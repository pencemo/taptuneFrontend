"use client";

import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  Users,
  CheckCircle2,
  Target,
  Search,
  UserCircle2,
  Briefcase,
  AlertCircle,
} from "lucide-react";
import {
  useAssignUserToSalesman,
  useGetAllSalesman,
} from "@/hooks/tanstackHooks/useSales";
import { toast } from "sonner";
import Loader from "@/components/ui/Loader";

const SelectSalesmanModal = ({
  open,
  onClose,
  selectedUsers = [],
  onRemoveUserFromParent,
}) => {
  const [search, setSearch] = useState("");
  const [selectedSalesman, setSelectedSalesman] = useState(null);
  const [isDirectLead, setIsDirectLead] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);

  // Fetch Salesmen Data
  const { data, isLoading, isError } = useGetAllSalesman();
  const salesmen = useMemo(
    () => (Array.isArray(data?.data) ? data.data : []),
    [data]
  );

  const { mutateAsync: assignMutation, isPending } = useAssignUserToSalesman();

  const userCount = selectedUsers?.length || 0;

  // Optimized Filter
  const filteredSalesmen = useMemo(() => {
    if (!search) return salesmen;
    return salesmen.filter(
      (s) =>
        s.name?.toLowerCase().includes(search.toLowerCase()) ||
        s.email?.toLowerCase().includes(search.toLowerCase())
    );
  }, [salesmen, search]);

  // Logic: Mutually exclusive selection
  const handleSelectSalesman = (salesman) => {
    if (selectedSalesman?._id === salesman._id) {
      setSelectedSalesman(null); // Deselect
    } else {
      setSelectedSalesman(salesman);
      setIsDirectLead(false); // Clear direct lead if salesman selected
    }
  };

  const handleToggleDirectLead = () => {
    if (isDirectLead) {
      setIsDirectLead(false);
    } else {
      setIsDirectLead(true);
      setSelectedSalesman(null); // Clear salesman if direct lead selected
    }
  };

  const handleSubmit = async () => {
    if (userCount === 0) {
      toast.error("Please select at least one user to assign.");
      return;
    }

    const assignmentData = {
      userIds: selectedUsers.map((u) => u._id),
      salesmanId: selectedSalesman?._id || null,
      isDirectLead,
    };

    try {
      const res = await assignMutation(assignmentData);

      if (res?.success) {
        toast.success(res.message || "Leads assigned successfully");

        // Handle UI Cleanup
        if (onRemoveUserFromParent) {
          selectedUsers.forEach((user) => onRemoveUserFromParent(user._id));
        }

        // Reset State
        setSelectedSalesman(null);
        setIsDirectLead(false);
        setIsConfirmed(false);
        setSearch("");
        onClose();
      }
    } catch (error) {
      console.error("Assignment Error:", error);
      toast.error(error?.response?.data?.message || "Failed to assign users.");
    }
  };

  // Validation for Submit Button
  const isSelectionMade = !!selectedSalesman || isDirectLead;
  const isSubmitDisabled =
    !isConfirmed || !isSelectionMade || isPending || userCount === 0;

  return (
    <Dialog open={open} onOpenChange={(val) => !isPending && onClose(val)}>
      <DialogContent className="w-[95vw] max-w-lg rounded-xl shadow-2xl p-0 overflow-hidden gap-0 bg-white">
        {/* Header Section */}
        <DialogHeader className="p-6 pb-4 border-b border-gray-100">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <DialogTitle className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <Target className="w-5 h-5 text-purple-600" />
                Assign Leads
              </DialogTitle>
              <DialogDescription className="text-sm text-gray-500">
                Route {userCount} leads to a salesman or mark as direct.
              </DialogDescription>
            </div>
            <Badge
              variant="secondary"
              className="w-fit px-3 py-1.5 flex items-center gap-2 bg-purple-50 text-purple-700 border-purple-100"
            >
              <Users className="w-3.5 h-3.5" />
              <span className="font-medium">{userCount} Selected</span>
            </Badge>
          </div>

          {/* Search Bar */}
          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-11 bg-gray-50 border-gray-200 focus:bg-white transition-all"
            />
          </div>
        </DialogHeader>

        {/* Scrollable Content Area */}
        <div className="p-4 overflow-y-auto max-h-[50vh] min-h-[300px] space-y-3 bg-gray-50/50">
          {/* Option 1: Direct Lead */}
          <button
            onClick={handleToggleDirectLead}
            className={`w-full group relative flex items-center gap-4 p-4 rounded-xl border-2 transition-all duration-200 text-left ${
              isDirectLead
                ? "bg-amber-50 border-amber-400 shadow-sm"
                : "bg-white border-transparent shadow-sm hover:border-amber-200 hover:shadow-md"
            }`}
          >
            <div
              className={`p-2.5 rounded-lg ${
                isDirectLead
                  ? "bg-amber-100 text-amber-700"
                  : "bg-gray-100 text-gray-500 group-hover:bg-amber-50 group-hover:text-amber-600"
              }`}
            >
              <Briefcase className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <p
                className={`font-semibold ${
                  isDirectLead ? "text-amber-900" : "text-gray-900"
                }`}
              >
                Direct Lead
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                Keep as unassigned / house account
              </p>
            </div>
            {isDirectLead && (
              <CheckCircle2 className="w-6 h-6 text-amber-600 animate-in fade-in zoom-in duration-200" />
            )}
          </button>

          <div className="flex items-center gap-2 px-2 py-1">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Or Select Salesman
            </span>
            <div className="h-px bg-gray-200 flex-1"></div>
          </div>

          {/* Option 2: Salesman List */}
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-10 space-y-3 text-gray-400">
              <Loader className="w-8 h-8 text-purple-600 animate-spin" />
              <p className="text-sm">Loading team...</p>
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center justify-center py-8 text-red-500 bg-red-50 rounded-xl border border-red-100">
              <AlertCircle className="w-6 h-6 mb-2" />
              <p className="text-sm font-medium">Failed to load data</p>
            </div>
          ) : filteredSalesmen.length === 0 ? (
            <div className="text-center py-12 px-4 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50">
              <UserCircle2 className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">
                No salesman found matching "{search}"
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredSalesmen.map((salesman) => {
                const isSelected = selectedSalesman?._id === salesman._id;
                return (
                  <button
                    key={salesman._id}
                    onClick={() => handleSelectSalesman(salesman)}
                    className={`w-full group flex items-center gap-3 p-3 rounded-xl border transition-all duration-200 text-left ${
                      isSelected
                        ? "bg-purple-50 border-purple-500 shadow-sm z-10"
                        : "bg-white border-gray-200 hover:border-purple-200 hover:shadow-md"
                    }`}
                  >
                    {/* Avatar / Icon Placeholder */}
                    <div
                      className={`h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold border ${
                        isSelected
                          ? "bg-purple-100 text-purple-700 border-purple-200"
                          : "bg-gray-100 text-gray-600 border-gray-100 group-hover:bg-purple-50 group-hover:text-purple-600"
                      }`}
                    >
                      {salesman.name?.charAt(0).toUpperCase() || "S"}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p
                        className={`font-medium truncate ${
                          isSelected ? "text-purple-900" : "text-gray-900"
                        }`}
                      >
                        {salesman.name}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {salesman.email || "No contact info"}
                      </p>
                    </div>

                    {isSelected && (
                      <CheckCircle2 className="w-5 h-5 text-purple-600 flex-shrink-0 animate-in fade-in slide-in-from-left-2" />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-white border-t border-gray-100 space-y-4">
          <label
            className={`flex items-center gap-3 p-3 rounded-lg border transition-colors cursor-pointer select-none ${
              isConfirmed
                ? "bg-green-50 border-green-200"
                : "bg-gray-50 border-transparent hover:bg-gray-100"
            }`}
          >
            <input
              type="checkbox"
              checked={isConfirmed}
              onChange={(e) => setIsConfirmed(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500 cursor-pointer"
            />
            <span
              className={`text-sm font-medium ${
                isConfirmed ? "text-green-800" : "text-gray-600"
              }`}
            >
              I confirm this assignment
            </span>
          </label>

          <DialogFooter className="flex-row gap-3 sm:justify-end">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isPending}
              className="flex-1 sm:flex-none border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitDisabled}
              className={`flex-1 sm:flex-none min-w-[140px] font-medium text-white transition-all
                ${
                  isDirectLead
                    ? "bg-amber-500 hover:bg-amber-600"
                    : "bg-purple-600 hover:bg-purple-700"
                }
              `}
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Assigning...
                </>
              ) : (
                "Assign Leads"
              )}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SelectSalesmanModal;
