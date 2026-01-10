import { useState, useEffect } from "react";
import { useGetAllPayments } from "@/hooks/tanstackHooks/usePayment";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

import {
  RefreshCw,
  Send,
  Search,
  AlertCircle,
  Filter,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import Loader from "@/components/ui/Loader";
import SendPaymentModal from "./SendPaymentModal";

export default function AdminPayments() {
  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [status, setStatus] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);

  /* ---------------- Debounced Search ---------------- */
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      setDebouncedSearch(searchInput.trim());
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInput]);

  /* ---------------- API ---------------- */
  const { data, isFetching, refetch } = useGetAllPayments({
    page,
    limit,
    search: debouncedSearch,
    status,
  });

  const payments = data?.data || [];
  const pagination = data?.pagination;
  const totalPages = pagination?.totalPages || 1;


  const truncateMiddle = (value, start = 6, end = 6) => {
    if (!value || value.length <= start + end) return value;
    return `${value.slice(0, start)}…${value.slice(-end)}`;
  };

  /* ---------------- Handlers ---------------- */
  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages) return;
    setPage(newPage);
  };

  const getStatusBadge = (status) => {
    if (status === "paid") {
      return (
        <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 px-2.5 py-0.5 font-medium hover:bg-emerald-100">
          Paid
        </Badge>
      );
    }
    if (status === "failed") {
      return (
        <Badge className="bg-red-50 text-red-700 border-red-200 px-2.5 py-0.5 font-medium hover:bg-red-100">
          Failed
        </Badge>
      );
    }
    return (
      <Badge className="bg-amber-50 text-amber-700 border-amber-200 px-2.5 py-0.5 font-medium hover:bg-amber-100">
        Pending
      </Badge>
    );
  };

  return (
    <div className="w-full max-w-[1600px] mx-auto space-y-6">
      {/* --- Page Header --- */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">
            Payments
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage transactions, track statuses, and send invoices.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={refetch}
            disabled={isFetching}
            className="h-10 border-gray-300 text-gray-700 hover:bg-gray-50 shadow-sm"
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${isFetching ? "animate-spin" : ""}`}
            />
            <span className="hidden sm:inline">Refresh</span>
          </Button>

          <Button
            size="sm"
            className="h-10 bg-indigo-600 hover:bg-indigo-700 text-white shadow-md transition-all"
            onClick={() => setIsModalOpen(true)}
          >
            <Send className="mr-2 h-4 w-4" />
            Send Request
          </Button>
        </div>
      </div>

      {/* --- Main Content Card --- */}
      <Card className="border p-0 border-gray-200 shadow-sm rounded-xl overflow-hidden bg-white">
        {/* Card Header & Filters */}
        <CardHeader className="p-5 sm:p-6 border-b border-gray-100 bg-white">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            {/* Left: Title & Count */}
            <div className="flex flex-col gap-1">
              <CardTitle className="text-lg sm:text-xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
                Transaction History
                <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold border border-indigo-100">
                  {pagination?.total || 0}
                </span>
              </CardTitle>
              <p className="text-sm text-gray-500 font-normal">
                View and manage all payment records.
              </p>
            </div>

            {/* Right: Actions (Search & Filter) */}
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto mt-2 md:mt-0">
              {/* Search Input */}
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                <Input
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Search by Order ID, Phone..."
                  className="pl-10 h-10 w-full bg-white border-gray-200 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all shadow-sm placeholder:text-gray-400"
                />
              </div>

              {/* Status Filter */}
              <div className="w-full sm:w-[160px]">
                <Select
                  value={status}
                  onValueChange={(value) => {
                    setPage(1);
                    setStatus(value);
                  }}
                >
                  <SelectTrigger className="h-10 w-full bg-white border-gray-200 text-sm text-gray-700 shadow-sm focus:ring-2 focus:ring-indigo-500/20 transition-all">
                    <div className="flex items-center gap-2 truncate">
                      <Filter className="h-3.5 w-3.5 text-gray-500 flex-shrink-0" />
                      <SelectValue placeholder="Filter Status" />
                    </div>
                  </SelectTrigger>
                  <SelectContent className="border-gray-100 shadow-lg">
                    <SelectItem value="all" className="cursor-pointer">
                      All Status
                    </SelectItem>
                    <SelectItem
                      value="paid"
                      className="cursor-pointer text-emerald-600 focus:text-emerald-700"
                    >
                      Paid
                    </SelectItem>
                    <SelectItem
                      value="pending"
                      className="cursor-pointer text-amber-600 focus:text-amber-700"
                    >
                      Pending
                    </SelectItem>
                    <SelectItem
                      value="failed"
                      className="cursor-pointer text-red-600 focus:text-red-700"
                    >
                      Failed
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardHeader>
        {/* Table Content */}
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50/50 hover:bg-gray-50/50 border-b border-gray-100">
                <TableHead className="h-11 pl-6 font-semibold text-xs text-gray-500 uppercase tracking-wider">
                  Customer
                </TableHead>
                <TableHead className="h-11 font-semibold text-xs text-gray-500 uppercase tracking-wider">
                  Amount
                </TableHead>
                <TableHead className="h-11 font-semibold text-xs text-gray-500 uppercase tracking-wider">
                  Status
                </TableHead>
                <TableHead className="h-11 font-semibold text-xs text-gray-500 uppercase tracking-wider">
                  Order ID
                </TableHead>
                <TableHead className="h-11 font-semibold text-xs text-gray-500 uppercase tracking-wider">
                  Phone
                </TableHead>
                <TableHead className="h-11 pr-6 text-right font-semibold text-xs text-gray-500 uppercase tracking-wider">
                  Date
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {isFetching ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-64">
                    <div className="flex flex-col items-center justify-center h-full gap-2 text-gray-500">
                      <Loader className="h-6 w-6 text-indigo-600 animate-spin" />
                      <span className="text-sm">Loading transactions...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : payments.length ? (
                payments.map((p) => (
                  <TableRow
                    key={p._id}
                    className="hover:bg-gray-50/60 transition-colors group border-b border-gray-50 last:border-0"
                  >
                    <TableCell className="pl-6 py-4 font-medium text-gray-900">
                      {p.user?.name || (
                        <span className="text-gray-400 font-normal italic">
                          Unknown
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="py-4 font-semibold text-gray-700">
                      ₹ {Number(p.amount).toLocaleString("en-IN")}
                    </TableCell>
                    <TableCell className="py-4">
                      {getStatusBadge(p.status)}
                    </TableCell>
                    <TableCell className="py-4 font-mono text-sm text-gray-500 group-hover:text-indigo-600 transition-colors">
                      {p.razorpayOrderId ? (
                        <TooltipProvider>
                          <Tooltip delayDuration={200}>
                            <TooltipTrigger asChild>
                              <span className="cursor-pointer select-all">
                                {truncateMiddle(p.razorpayOrderId, 6, 6)}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent side="top" align="start">
                              <span className="font-mono text-xs">
                                {p.razorpayOrderId}
                              </span>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell className="py-4 text-sm text-gray-600">
                      {p.user?.phoneNumber || p.customerPhone || "—"}
                    </TableCell>
                    <TableCell className="pr-6 py-4 text-right text-sm text-gray-500">
                      {new Date(p.createdAt).toLocaleDateString("en-IN", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-64 text-center">
                    <div className="flex flex-col items-center justify-center py-8">
                      <div className="bg-gray-100 p-4 rounded-full mb-3">
                        <AlertCircle className="h-8 w-8 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-900">
                        No transactions found
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">
                        Try adjusting your filters or search terms.
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          {/* --- Simplified Pagination Footer (Bottom Right) --- */}
          {totalPages > 0 && (
            <div className="flex items-center justify-end border-t border-gray-100 bg-gray-50/30 p-4 gap-2">
              {/* First Page (<<) */}
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 bg-white"
                onClick={() => handlePageChange(1)}
                disabled={page === 1}
                title="First Page"
              >
                <ChevronsLeft className="h-4 w-4" />
              </Button>

              {/* Previous Page (<) */}
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 bg-white"
                onClick={() => handlePageChange(page - 1)}
                disabled={page === 1}
                title="Previous Page"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              {/* Current Page Indicator */}
              <span className="text-sm font-medium text-gray-700 mx-2 min-w-[80px] text-center">
                Page {page} of {totalPages}
              </span>

              {/* Next Page (>) */}
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 bg-white"
                onClick={() => handlePageChange(page + 1)}
                disabled={page === totalPages}
                title="Next Page"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>

              {/* Last Page (>>) */}
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 bg-white"
                onClick={() => handlePageChange(totalPages)}
                disabled={page === totalPages}
                title="Last Page"
              >
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <SendPaymentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}
