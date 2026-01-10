
"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { useGetAllOrders } from "@/hooks/tanstackHooks/useOrder";
import { Loader2, Send, Search, Info } from "lucide-react";
import PrintingDetailsModal from "./PrintingDetailsModal";
import { useUpdateProfileStatus } from "@/hooks/tanstackHooks/useProfile";
import { toast } from "sonner";
import Loader from "@/components/ui/Loader";
import { ViewUserModal } from "./ViewUserModal";
import TransferProfileDialog from "../ProfileTransfer/TransferProfileDialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const PER_PAGE = 10;

const OrderTable = () => {
  const [tab, setTab] = useState("all");
  const [search, setSearch] = useState("");
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [profileToTransfer, setProfileToTransfer] = useState(null);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [updatingId, setUpdatingId] = useState(null);
  const [page, setPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewProfile, setViewProfile] = useState();

  const { data, isLoading } = useGetAllOrders({
    status: tab,
    page,
    search: debouncedSearch,
  });

  const { mutate, isPending } = useUpdateProfileStatus();

  const orders = data?.data || [];
  const totalCount = data?.pagination?.totalRecords || 0;
  const totalPages = Math.ceil(totalCount / PER_PAGE);
  const tabs = ["all", "Pending", "Confirmed", "Design Completed", "Delivered"];

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(handler);
  }, [search]);

  const handleTabChange = (val) => {
    setTab(val);
    setPage(1);
    setSearch("");
  };    

  const handleSearch = (e) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const changeStatusOfActiveAndDeActive = (id, status) => {
    setUpdatingId(id);
    mutate(
      { id, isActive: status },
      {
        onSuccess: (res) => {
          if (res.success) {
            toast.success(
              `Profile ${status ? "Activated" : "Deactivated"} successfully`
            );
          } else toast.error(res.message);
        },
        onError: (err) =>
          toast.error(err?.response?.data?.message || "Something went wrong"),
      }
    );
  };

  const getStatusBadgeClass = (status) => {
    const statusMap = {
      Pending: "border-yellow-400 text-yellow-600 bg-yellow-50",
      Confirmed: "border-purple-400 text-purple-600 bg-purple-50",
      "Design Completed": "border-indigo-400 text-indigo-600 bg-indigo-50",
      Delivered: "border-emerald-400 text-emerald-600 bg-emerald-50",
    };
    return statusMap[status] || "border-blue-400 text-blue-600 bg-blue-50";
  };

  return (
    <TooltipProvider>
      <div className="w-full space-y-6">
        {/* Header */}
        <div className="space-y-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Orders</h1>
              <p className="text-sm text-muted-foreground">
                Manage and review all orders
              </p>
            </div>
            <div className="relative w-full md:w-72">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search name, email, or designation..."
                value={search}
                onChange={handleSearch}
                className="pl-10"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2 border-b border-border">
            {tabs.map((tabName) => (
              <button
                key={tabName}
                onClick={() => handleTabChange(tabName)}
                className={`relative px-4 py-2 text-sm font-medium transition-all duration-200 ${
                  tabName === tab
                    ? "text-purple-600"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tabName}
                {tabName === tab && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-600" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="flex h-80 items-center justify-center rounded-lg">
            <div className="flex flex-col items-center gap-3">
              <Loader className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          </div>
        )}

        {/* Table */}
        {!isLoading && (
          <div className="overflow-hidden rounded-lg border border-border shadow-sm">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    {[
                      "No",
                      "Name",
                      "Position",
                      "Order Status",
                      "Profile Status",
                      "Details",
                      "User",
                      "Active/Deactive",
                      "Transfer",
                    ].map((h) => (
                      <TableHead
                        key={h}
                        className="h-12 px-4 text-left font-semibold text-foreground"
                      >
                        {h}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {orders.length > 0 ? (
                    orders.map((order, i) => (
                      <TableRow
                        key={i}
                        className="border-b border-border hover:bg-muted/50 transition-colors"
                      >
                        <TableCell className="px-4 py-3 font-medium text-foreground">
                          {(page - 1) * PER_PAGE + i + 1}
                        </TableCell>

                        {/* Name & Email (truncated) */}
                        <TableCell className="px-4 py-3">
                          <div className="font-medium text-foreground">
                            {order.fullName}
                          </div>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="max-w-[150px] truncate text-xs text-muted-foreground cursor-pointer">
                                {order.email}
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{order.email}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TableCell>

                        {/* Designation (truncated) */}
                        <TableCell className="px-4 py-3 capitalize">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="max-w-[120px] truncate text-foreground text-sm cursor-pointer">
                                {order.designation || "-"}
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{order.designation || "-"}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TableCell>

                        {/* Order Status */}
                        <TableCell className="px-4 py-3 text-center">
                          <Badge
                            variant="outline"
                            className={`px-2.5 py-1 text-xs font-medium ${getStatusBadgeClass(
                              order.status
                            )}`}
                          >
                            {order.status}
                          </Badge>
                        </TableCell>

                        {/* Profile Status */}
                        <TableCell className="px-4 py-3 text-center">
                          <Badge
                            variant="outline"
                            className={`px-2.5 py-1 text-xs font-medium ${
                              order.isActive
                                ? "border-emerald-500 text-emerald-600 bg-emerald-50"
                                : "border-red-400 text-red-600 bg-red-50"
                            }`}
                          >
                            {order.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>

                        {/* View Details */}
                        <TableCell className="px-4 py-3 text-center">
                          <Button
                            onClick={() => {
                              setIsModalOpen(true);
                              setViewProfile(order);
                            }}
                            size="sm"
                            className="bg-purple-600 text-white hover:bg-purple-700 transition-all"
                          >
                            View 
                          </Button>
                        </TableCell>

                        {/* User */}
                        <TableCell className="px-4 py-3 text-center">
                          <Button
                            onClick={() => {
                              setSelectedUser(order);
                              setIsUserModalOpen(true);
                            }}
                            variant="outline"
                            size="sm"
                            className="text-xs"
                          >
                            View User
                          </Button>
                        </TableCell>

                        {/* Activate/Deactivate */}
                        <TableCell className="px-4 py-3 text-center">
                          <Button
                            onClick={() =>
                              changeStatusOfActiveAndDeActive(
                                order.profileId,
                                !order.isActive
                              )
                            }
                            disabled={
                              updatingId === order.profileId && isPending
                            }
                            size="sm"
                            className={`text-sm font-medium px-3 py-1 rounded-md transition-colors w-25 flex items-center gap-2 ${
                              order.isActive
                                ? "bg-red-600 text-white hover:bg-red-700 focus:ring-2 focus:ring-red-400"
                                : "bg-green-700 text-white hover:bg-green-900"
                            }`}
                          >
                            {updatingId === order.profileId && isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : order.isActive ? (
                              "Deactivate"
                            ) : (
                              "Activate"
                            )}
                          </Button>
                        </TableCell>

                        {/* Transfer */}
                        <TableCell className="px-4 py-3 text-center">
                          <Button
                            variant="outline"
                            className="bg-gradient-to-r from-purple-600 to-blue-600 text-white border-0 hover:opacity-90"
                            size="sm"
                            onClick={() => {
                              setProfileToTransfer(order);
                              setIsTransferModalOpen(true);
                            }}
                          >
                            <Send className="h-4 w-4 mr-1.5" />
                            Transfer
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={9}
                        className="px-4 py-12 text-center text-muted-foreground"
                      >
                        <p className="text-sm font-medium">No orders found</p>
                        <p className="text-xs">Try adjusting your search</p>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {/* Pagination */}
        {!isLoading && totalPages > 1 && (
          <div className="flex flex-row sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              Showing{" "}
              <span className="font-medium">
                {(page - 1) * PER_PAGE + 1} -{" "}
                {Math.min(page * PER_PAGE, totalCount)}
              </span>{" "}
              of <span className="font-medium">{totalCount}</span>
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}

        {/* Modals */}
        {isModalOpen && viewProfile && (
          <PrintingDetailsModal
            isOpen={isModalOpen}
            profile={viewProfile}
            onClose={() => {
              setIsModalOpen(false);
              setViewProfile(null);
            }}
          />
        )}
        {isUserModalOpen && selectedUser && (
          <ViewUserModal
            isOpen={isUserModalOpen}
            onClose={() => setIsUserModalOpen(false)}
            user={selectedUser}
          />
        )}
        {isTransferModalOpen && profileToTransfer && (
          <TransferProfileDialog
            open={isTransferModalOpen}
            onOpenChange={(open) => {
              setIsTransferModalOpen(open);
              if (!open) setProfileToTransfer(null);
            }}
            profile={{
              _id: profileToTransfer.profileId,
              fullName: profileToTransfer.fullName,
              designation: profileToTransfer.designation,
              email: profileToTransfer.email,
              phoneNumber: profileToTransfer.phoneNumber,
            }}
          />
        )}
      </div>
    </TooltipProvider>
  );
};

export default OrderTable;
