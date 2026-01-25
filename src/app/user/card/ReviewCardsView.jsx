import React, { useState } from "react";
import { ExternalLink, MapPin, Loader2, Package } from "lucide-react"; // Icons for better UI
import { useGetAllReviewCardOrders } from "@/hooks/tanstackHooks/useReviewCard";
// Make sure to import your actual hook path correctly

const ReviewCardOrders = () => {
  // Since the backend handles the "User" role logic automatically,
  // we can pass "all" or leave it empty.
  const [statusFilter] = useState("all");

  const { data, isLoading } = useGetAllReviewCardOrders(statusFilter);
  const orders = data?.data || [];

  // --- Helper: Status Badge Color ---
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "approved":
        return "bg-green-100 text-green-800 border-green-200";
      case "rejected":
        return "bg-red-100 text-red-800 border-red-200";
      case "pending":
      default:
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
        <Package className="h-6 w-6" />
        My Review Cards
      </h2>

      {orders.length === 0 ? (
        <div className="text-center p-10 bg-gray-50 rounded-lg border border-dashed border-gray-300">
          <p className="text-gray-500">No review card orders found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {orders.map((order) => (
            <div
              key={order._id}
              className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200 overflow-hidden flex flex-col"
            >
              {/* --- Card Header --- */}
              <div className="p-5 border-b border-gray-50 bg-gray-50/50 flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-lg text-gray-900 truncate">
                    {order.brandName}
                  </h3>
                  <span className="text-xs text-gray-500">
                    Order ID: {order._id.slice(-6).toUpperCase()}
                  </span>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                    order.status
                  )}`}
                >
                  {order.status
                    ? order.status.charAt(0).toUpperCase() +
                      order.status.slice(1)
                    : "Unknown"}
                </span>
              </div>

              {/* --- Card Body --- */}
              <div className="p-5 flex-1 flex flex-col gap-4">
                {/* Google Review Link */}
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Review Link
                  </span>
                  <a
                    href={order.googleReviewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1 truncate"
                  >
                    View Google Link <ExternalLink className="h-3 w-3" />
                  </a>
                </div>

                {/* Delivery Address */}
                <div className="flex flex-col gap-1 mt-auto">
                  <div className="flex items-center gap-2 mb-1">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Delivery Address
                    </span>
                  </div>

                  <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
                    <p className="font-medium text-gray-800">
                      {order.deliveryAddress?.houseName}
                    </p>
                    {order.deliveryAddress?.landmark && (
                      <p>{order.deliveryAddress.landmark}</p>
                    )}
                    <p>
                      {order.deliveryAddress?.city},{" "}
                      {order.deliveryAddress?.state}
                    </p>
                    <p className="font-mono text-xs text-gray-500 mt-1">
                      PIN: {order.deliveryAddress?.pincode}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ReviewCardOrders;
