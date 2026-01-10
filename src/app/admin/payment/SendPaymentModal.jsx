import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Search,
  Loader2,
  Phone,
  CreditCard,
  X,
  User,
  CheckCircle2,
} from "lucide-react";
import { useGetAllOrders } from "@/hooks/tanstackHooks/useOrder";
import { useSendWhatsappPayment } from "@/hooks/tanstackHooks/usePayment";
import { toast } from "sonner";
import Loader from "@/components/ui/Loader";

export default function SendPaymentModal({ isOpen, onClose }) {
  /* -------------------- STATE -------------------- */
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [customAmount, setCustomAmount] = useState("");
  const [customPhone, setCustomPhone] = useState("");

  /* -------------------- DATA -------------------- */
  const { data: ordersData, isLoading: isSearching } = useGetAllOrders({
    page: 1,
    limit: 20,
    search: debouncedSearch,
    status: "all",
  });

  const { mutateAsync: sendPayment, isPending } = useSendWhatsappPayment();
  const orders = ordersData?.data || [];

  /* -------------------- EFFECTS -------------------- */
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  /* -------------------- HANDLERS -------------------- */
  const handleSelectOrder = (order) => {
    setSelectedOrder(order);
    setCustomAmount(order.totalAmount || order.price * order.quantity || "");
    setCustomPhone(order.phoneNumber || "");
    setSearchTerm("");
  };

  const handleReset = () => {
    setSelectedOrder(null);
    setCustomAmount("");
    setCustomPhone("");
    setSearchTerm("");
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const handleSendPayment = async () => {
    if (!customAmount || Number(customAmount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    if (!customPhone || customPhone.length < 10) {
      toast.error("Please enter a valid WhatsApp number");
      return;
    }

    const payload = {
      userId: selectedOrder.userId?._id || selectedOrder.userId,
      cardOrderId: selectedOrder.orderId,
      customerName:
        selectedOrder.customerName || selectedOrder.fullName || "Customer",
      customerPhone: customPhone,
      amount: Number(customAmount),
      customerEmail: selectedOrder.email || "",
    };

    try {
      await sendPayment(payload);
      toast.success("Payment link sent successfully");
      handleClose();
    } catch (error) {
      const msg =
        error.response?.data?.message || "Failed to send payment link";
      toast.error(msg);
    }
  };

  /* -------------------- UI -------------------- */
  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden gap-0 rounded-xl">
        <DialogHeader className="px-6 py-5 border-b bg-gray-50/50">
          <DialogTitle className="text-xl font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-indigo-600" />
            Send Payment Request
          </DialogTitle>
          <DialogDescription>
            {selectedOrder
              ? "Review details and send the payment link via WhatsApp."
              : "Search and select an order."}
          </DialogDescription>
        </DialogHeader>

        <div className="p-6">
          {/* SEARCH */}
          {!selectedOrder && (
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by Order ID, Name, or Phone"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-11"
                  autoFocus
                />
              </div>

              <div className="h-[320px] overflow-y-auto space-y-2">
                {isSearching ? (
                  <div className="flex flex-col items-center justify-center h-full">
                    <Loader className="h-6 w-6 animate-spin text-indigo-600" />
                  </div>
                ) : orders.length ? (
                  orders.map((order) => (
                    <div
                      key={order._id}
                      onClick={() => handleSelectOrder(order)}
                      className="p-3 border rounded-lg cursor-pointer hover:border-indigo-500"
                    >
                      <div className="flex justify-between">
                        <div>
                          <p className="font-semibold">
                            {order.fullName || "Customer"}
                          </p>
                          <p className="text-xs text-gray-500 font-mono">
                            {order.orderId}
                          </p>
                        </div>
                        <span className="text-sm font-bold">
                          ₹{" "}
                          {(order.price * order.quantity).toLocaleString(
                            "en-IN"
                          )}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 mt-1 flex items-center gap-2">
                        <Phone className="h-3 w-3" />
                        {order.phoneNumber}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-sm text-gray-400">
                    No orders found
                  </p>
                )}
              </div>
            </div>
          )}

          {/* CONFIRM */}
          {selectedOrder && (
            <div className="space-y-5">
              <div className="bg-indigo-50 border rounded-lg p-4 relative">
                <div className="flex justify-between">
                  <div className="flex gap-3">
                    <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                      <User className="h-5 w-5 text-indigo-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold">
                        {selectedOrder.fullName}
                      </h4>
                      <p className="text-xs font-mono text-indigo-600">
                        {selectedOrder.orderId}
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={handleReset}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Amount (₹)</Label>
                  <Input
                    type="number"
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value)}
                    className="font-bold"
                  />
                </div>

                <div className="space-y-2">
                  <Label>WhatsApp Number</Label>
                  <Input
                    value={customPhone}
                    onChange={(e) => setCustomPhone(e.target.value)}
                    placeholder="919876543210"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={handleReset}
                  disabled={isPending}
                >
                  Change Order
                </Button>
                <Button
                  onClick={handleSendPayment}
                  disabled={isPending}
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Sending
                    </>
                  ) : (
                    "Send Link"
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
