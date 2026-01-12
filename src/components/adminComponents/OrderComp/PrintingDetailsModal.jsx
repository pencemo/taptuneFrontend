

// "use client";

// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
// } from "@/components/ui/dialog";
// import { Button } from "@/components/ui/button";
// import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
// import { Copy, Download } from "lucide-react";
// import { useRef, useState, useEffect } from "react";
// import { QRCodeCanvas } from "qrcode.react";
// import { toast } from "sonner";
// import { useUpdateCardOrderStatus } from "@/hooks/tanstackHooks/useCard";
// import { Badge } from "@/components/ui/badge";

// export default function PrintingDetailsModal({ isOpen, onClose, profile }) {
//   const qrRef = useRef();
//   const { mutate, isPending } = useUpdateCardOrderStatus();
//   const [localProfile, setLocalProfile] = useState(profile);

//   useEffect(() => {
//     if (profile) setLocalProfile(profile);
//   }, [profile]);

// const handleCopyLink = () => {
//   const baseUrl = window.location.origin;
//   const profileUrl = `${baseUrl}/#/profile?id=${localProfile?.viewId}`;

//   navigator.clipboard.writeText(profileUrl);
//   toast.success("Profile link copied!");
// };


//   const handleDownloadQR = () => {
//     const canvas = qrRef.current.querySelector("canvas");
//     const pngUrl = canvas.toDataURL("image/png");
//     const link = document.createElement("a");
//     link.href = pngUrl;
//     link.download = `${localProfile?.fullName || "qr-code"}.png`;
//     link.click();
//   };

// const getNextStatus = (status) => {
//   if (status === "Pending") {
//     return { next: "Confirmed", label: "Confirm Order" };
//   }
//   if (status === "Confirmed") {
//     return { next: "Design Completed", label: "Mark Design Completed" };
//   }
//   if (status === "Design Completed") {
//     return { next: "Delivered", label: "Mark as Delivered" };
//   }
//   return null;
// };


// const getStatusBadgeVariant = (status) => {
//   switch (status) {
//     case "pending":
//       return "bg-red-100 text-red-700 border border-red-300";
//     case "Confirmed":
//       return "bg-yellow-100 text-yellow-700 border border-yellow-300";
//     case "Design Completed":
//       return "bg-blue-100 text-blue-700 border border-blue-300";
//     case "Delivered":
//       return "bg-green-100 text-green-700 border border-green-300";
//     default:
//       return "bg-gray-100 text-gray-600 border border-gray-300";
//   }
// };


//   const statusAction = getNextStatus(localProfile?.status);

//   const handleStatusChange = () => {
//     if (!statusAction) return;
//     mutate(
//       { orderId: localProfile?.orderId, status: statusAction.next },
//       {
//         onSuccess: (res) => {
//           if (res.success) {
//             toast.success(
//               res.message || `Order marked as ${statusAction.next}`
//             );
//             setLocalProfile((prev) => ({
//               ...prev,
//               status: statusAction.next,
//             }));
//           } else {
//             toast.error(res.message || "Failed to update order status");
//           }
//         },
//         onError: (err) => {
//           toast.error(err.response?.data?.message || "Something went wrong");
//         },
//       }
//     );
//   };

//   return (
//     <Dialog open={isOpen} onOpenChange={onClose}>
//       <DialogContent
//         className="
//           w-[95vw]
//           sm:max-w-2xl
//           lg:max-w-5xl
//           xl:max-w-6xl
//           max-h-[90vh]
//           overflow-y-auto
//           p-0
//           rounded-2xl
//         "
//       >
//         {/* Header */}
//         <DialogHeader className="px-6 py-5 border-b bg-gray-50 rounded-t-2xl">
//           <DialogTitle className="text-2xl font-bold text-gray-800">
//             Printing Details
//           </DialogTitle>
//           <p className="text-sm text-gray-500">
//             Complete details for card design and production
//           </p>
//         </DialogHeader>

//         {/* Content */}
//         <div className="px-6 py-8 space-y-8">
//           {/* User Info Section */}
//           <div className="text-center space-y-4">
//             <h2 className="text-lg font-semibold text-gray-600 uppercase">
//               Details Print in Card
//             </h2>
//             <Avatar className="w-24 h-24 mx-auto border-2 border-gray-200 shadow">
//               <AvatarImage src={localProfile?.logoImage} />
//               <AvatarFallback className="bg-gray-100 text-lg font-bold">
//                 {localProfile?.fullName?.charAt(0) || "U"}
//               </AvatarFallback>
//             </Avatar>
//             <h2 className="text-2xl font-bold text-gray-800">
//               <span className="text-lg text-gray-600">Name: </span>{" "}
//               {localProfile?.fullName || "-"}
//             </h2>
//             <p className="text-lg text-gray-600">
//               {localProfile?.designation || "-"}
//             </p>
//             <div className="text-lg text-gray-500">
//               <p>Email: {localProfile?.email || "-"}</p>
//             </div>
//             <p className="text-lg text-gray-500">
//                  Phone:  {localProfile?.phoneNumber || "-"}
//             </p>
//           </div>

//           {/* Status and Action Section */}
//           <div className="flex flex-row justify-between items-center gap-4 bg-gray-50 p-5 rounded-xl shadow-sm">
//             <div className="flex items-center gap-3">
//               <span className="text-sm font-medium text-gray-700">Status:</span>
//               <span
//                 className={`px-3 py-1 rounded-md text-sm font-medium ${getStatusBadgeVariant(
//                   localProfile?.status
//                 )}`}
//               >
//                 {localProfile?.status || "unknown"}
//               </span>
//             </div>

//             {statusAction && (
//               <Button
//                 onClick={handleStatusChange}
//                 disabled={isPending}
//                 className={`px-6 py-2 rounded-lg shadow-md text-white ${
//                   localProfile?.status === "Pending"
//                     ? "bg-blue-600 hover:bg-blue-700"
//                     : localProfile?.status === "Confirmed"
//                     ? "bg-yellow-600 hover:bg-yellow-700"
//                     : localProfile?.status === "Design Completed"
//                     ? "bg-purple-600 hover:bg-purple-700"
//                     : localProfile?.status === "Delivered"
//                     ? "bg-green-600 hover:bg-green-700"
//                     : "bg-gray-600 hover:bg-gray-700"
//                 }`}
//               >
//                 {isPending ? "Processing..." : statusAction.label}
//               </Button>
//             )}
//           </div>

//           {/* Card Details Section */}
//           <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
//             {/* Left Column - Card & Profile */}
//             <div className="lg:col-span-2 space-y-6">
//               {/* Card Information */}
//               <div className="bg-white border rounded-xl p-6 shadow-sm">
//                 <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b">
//                   Card Information
//                 </h3>
//                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
//                   <div>
//                     <p className="text-sm text-gray-500 mb-1">Card Name</p>
//                     <p className="font-medium text-gray-800">
//                       {localProfile?.cardName || "-"}
//                     </p>
//                   </div>
//                   <div>
//                     <p className="text-sm text-gray-500 mb-1">Category</p>
//                     <p className="font-medium text-gray-800">
//                       {localProfile?.category || "-"}
//                     </p>
//                   </div>
//                   <div>
//                     <p className="text-sm text-gray-500 mb-1">Quantity</p>
//                     <p className="font-medium text-gray-800">
//                       {localProfile?.quantity || "-"}
//                     </p>
//                   </div>
//                   <div className="flex items-center gap-2">
//                     <p className="text-sm text-gray-500 mb-1">Front Design</p>
//                     {localProfile?.frontImage ? (
//                       <img
//                         src={localProfile.frontImage}
//                         alt="Card Front"
//                         className="w-16 h-10 object-contain border rounded"
//                       />
//                     ) : (
//                       <span className="text-xs text-gray-400">No Image</span>
//                     )}
//                   </div>
//                 </div>
//               </div>

//               {/* Profile Details */}
//               <div className="bg-white border rounded-xl p-6 shadow-sm">
//                 <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b">
//                   Profile Details
//                 </h3>
//                 <div className="space-y-4">
//                   {[
//                     {
//                       label: "Full Name",
//                       value: localProfile?.profileFullName,
//                     },
//                     { label: "Username", value: localProfile?.userName || "-" },
//                     {
//                       label: "Designation",
//                       value: localProfile?.ProfileDesignation,
//                     },
//                     { label: "Email", value: localProfile?.profileEmail },
//                     { label: "Contact No", value: localProfile?.profileNumber },
//                     {
//                       label: "WhatsApp",
//                       value: localProfile?.watsappNumber || "-",
//                     },
//                     { label: "Bio", value: localProfile?.bio || "-" },
//                   ].map((item, idx) => (
//                     <div
//                       key={idx}
//                       className="flex sm:grid sm:grid-cols-3 sm:gap-4"
//                     >
//                       {/* Label column → fixed width on mobile, normal grid on desktop */}
//                       <p className="text-sm text-gray-500 sm:col-span-1 min-w-[120px]">
//                         {item.label}:
//                       </p>
//                       <p className="sm:col-span-2 text-sm font-medium text-gray-800 break-words">
//                         {item.value || "-"}
//                       </p>
//                     </div>
//                   ))}

//                   {/* Profile Link */}
//                   <div className="flex sm:grid sm:grid-cols-3 sm:gap-4">
//                     <p className="text-sm text-gray-500 sm:col-span-1 min-w-[120px]">
//                       Profile Link:
//                     </p>
//                     <div className="sm:col-span-2 flex items-center gap-2">
//                       <Button
//                         variant="outline"
//                         size="sm"
//                         onClick={handleCopyLink}
//                         className="text-sm text-blue-600 hover:text-blue-700"
//                       >
//                         Copy Link
//                       </Button>
//                       <Copy className="h-4 w-4 text-blue-600" />
//                     </div>
//                   </div>

//                   {/* Profile Status */}
//                   <div className="flex sm:grid sm:grid-cols-3 sm:gap-4">
//                     <p className="text-sm text-gray-500 sm:col-span-1 min-w-[120px]">
//                       Profile Status:
//                     </p>
//                     <div className="sm:col-span-2">
//                       <span
//                         className={`px-3 py-1 rounded-md text-sm font-medium ${
//                           localProfile?.isActive
//                             ? "bg-green-100 text-green-700 border border-green-300"
//                             : "bg-red-100 text-red-700 border border-red-300"
//                         }`}
//                       >
//                         {localProfile?.isActive ? "Activated" : "Not Activated"}
//                       </span>
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             </div>

//             {/* Right Column - QR Code & Contact */}
//             <div className="flex flex-col gap-6">
//               {/* QR Code */}
//               <div className="bg-white border rounded-xl p-6 shadow-sm">
//                 <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">
//                   Digital Profile QR
//                 </h3>
//                 <div className="flex flex-col items-center space-y-4">
//                   <div
//                     className="size-48 bg-white p-2 border rounded-lg flex items-center justify-center"
//                     ref={qrRef}
//                   >
//                     <QRCodeCanvas
//                       value={`https://taptune.in/#/profile?id=${localProfile?.viewId}`}
//                       size={180}
//                       bgColor="#ffffff"
//                       fgColor="#000000"
//                       marginSize={5}
//                       level="H"
//                     />
//                   </div>
//                   <Button
//                     onClick={handleDownloadQR}
//                     className="w-full bg-gray-800 hover:bg-gray-700 text-white"
//                   >
//                     <Download className="w-4 h-4 mr-2" />
//                     Download QR Code
//                   </Button>
//                 </div>
//               </div>

//               {/* Contact Info */}
//               <div className="bg-white border rounded-xl p-6 shadow-sm">
//                 <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">
//                   Contact Information
//                 </h3>
//                 <div className="space-y-2 text-sm text-center">
//                   <p className="font-medium text-gray-800">
//                     {localProfile?.designation || "N/A"}
//                   </p>
//                   <p className="text-gray-600 break-all">
//                     {localProfile?.email || "N/A"}
//                   </p>
//                   <p className="text-gray-600">
//                     {localProfile?.phoneNumber || "N/A"}
//                   </p>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>
//       </DialogContent>
//     </Dialog>
//   );
// }










"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  Copy,
  Download,
  MapPin,
  Phone,
  Mail,
  User,
  Briefcase,
  Printer,
  CheckCircle2,
  X,
} from "lucide-react";
import { useRef, useState, useEffect } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { toast } from "sonner";
import { useUpdateCardOrderStatus } from "@/hooks/tanstackHooks/useCard";
import { Badge } from "@/components/ui/badge";

export default function PrintingDetailsModal({ isOpen, onClose, profile }) {
  const qrRef = useRef();
  const { mutate, isPending } = useUpdateCardOrderStatus();
  const [localProfile, setLocalProfile] = useState(profile);

  useEffect(() => {
    if (profile) setLocalProfile(profile);
  }, [profile]);

  // --- Handlers ---
  const handleCopyLink = () => {
    const baseUrl = window.location.origin;
    const profileUrl = `${baseUrl}/#/profile?id=${localProfile?.viewId}`;
    navigator.clipboard.writeText(profileUrl);
    toast.success("Profile link copied!");
  };

  const handleDownloadQR = () => {
    const canvas = qrRef.current.querySelector("canvas");
    const pngUrl = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = pngUrl;
    link.download = `${localProfile?.fullName || "qr-code"}.png`;
    link.click();
  };

  const handleStatusChange = () => {
    const action = getNextStatus(localProfile?.status);
    if (!action) return;

    mutate(
      { orderId: localProfile?.orderId, status: action.next },
      {
        onSuccess: (res) => {
          if (res.success) {
            toast.success(res.message || `Order updated to ${action.next}`);
            setLocalProfile((prev) => ({ ...prev, status: action.next }));
          } else {
            toast.error(res.message || "Failed to update");
          }
        },
        onError: (err) => {
          toast.error(err.response?.data?.message || "Error updating status");
        },
      }
    );
  };

  // --- Helpers ---
  const getNextStatus = (status) => {
    if (status === "Pending")
      return {
        next: "Confirmed",
        label: "Confirm Order",
        color: "bg-blue-600 hover:bg-blue-700",
      };
    if (status === "Confirmed")
      return {
        next: "Design Completed",
        label: "Mark Design Completed",
        color: "bg-purple-600 hover:bg-purple-700",
      };
    if (status === "Design Completed")
      return {
        next: "Delivered",
        label: "Mark as Delivered",
        color: "bg-green-600 hover:bg-green-700",
      };
    return null;
  };

  const getStatusBadgeVariant = (status) => {
    switch (status?.toLowerCase()) {
      case "pending":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "confirmed":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "design completed":
        return "bg-purple-50 text-purple-700 border-purple-200";
      case "delivered":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      default:
        return "bg-gray-100 text-gray-600 border-gray-200";
    }
  };

  const statusAction = getNextStatus(localProfile?.status);
  const hasAddress =
    localProfile?.deliveryAddress &&
    (localProfile.deliveryAddress.houseNo || localProfile.deliveryAddress.city);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-[95vw] lg:max-w-6xl h-[90vh] sm:h-auto sm:max-h-[90vh] overflow-y-auto p-0 rounded-xl border border-gray-200 shadow-2xl bg-gray-50">
        {/* === Sticky Header === */}
        <DialogHeader className="sticky top-0 z-50 px-6 py-4 bg-white border-b border-gray-200 flex flex-row items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-600 text-white rounded-lg shadow-sm">
              <Printer className="w-5 h-5" />
            </div>
            <div className="text-left">
              <DialogTitle className="text-lg font-bold text-gray-900">
                Printing Details
              </DialogTitle>
              <p className="text-xs text-gray-500 font-mono mt-0.5">
                Order ID: {localProfile?.orderId || "..."}
              </p>
            </div>
          </div>

          {/* Close Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="rounded-full hover:bg-gray-100 text-gray-500"
          >
            <X className="w-5 h-5" />
          </Button>
        </DialogHeader>

        <div className="p-3 space-y-3">
          {/* === Top Card: User Snapshot === */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm flex flex-col md:flex-row items-center gap-6">
            {/* Avatar & Name */}
            <div className="flex flex-col md:flex-row items-center gap-5 flex-1 text-center md:text-left">
              <Avatar className="w-20 h-20 border-4 border-white shadow-md ring-1 ring-gray-100">
                <AvatarImage
                  src={localProfile?.logoImage}
                  className="object-cover"
                />
                <AvatarFallback className="bg-indigo-50 text-indigo-600 text-2xl font-bold">
                  {localProfile?.fullName?.charAt(0)}
                </AvatarFallback>
              </Avatar>

              <div className="space-y-1">
                <h2 className="text-2xl font-bold text-gray-900">
                  {localProfile?.fullName}
                </h2>
                <div className="flex items-center justify-center md:justify-start gap-2 text-gray-600 font-medium">
                  <Briefcase className="w-4 h-4 text-gray-400" />
                  {localProfile?.designation || "No Designation"}
                </div>
                <div className="flex flex-wrap justify-center md:justify-start gap-4 text-sm text-gray-500 mt-2">
                  <span className="flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded">
                    <Mail className="w-3.5 h-3.5" /> {localProfile?.email}
                  </span>
                  <span className="flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded">
                    <Phone className="w-3.5 h-3.5" />{" "}
                    {localProfile?.phoneNumber}
                  </span>
                </div>
              </div>
            </div>

            {/* Status & Actions */}
            <div className="w-full md:w-auto flex flex-col items-center md:items-end gap-3 pt-4 md:pt-0 border-t md:border-t-0 border-gray-100">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Status
                </span>
                <Badge
                  variant="outline"
                  className={`capitalize px-3 py-1 font-semibold ${getStatusBadgeVariant(
                    localProfile?.status
                  )}`}
                >
                  {localProfile?.status}
                </Badge>
              </div>

              {statusAction && (
                <Button
                  onClick={handleStatusChange}
                  disabled={isPending}
                  className={`w-full md:w-auto shadow-lg text-white font-medium transition-all ${statusAction.color}`}
                >
                  {isPending ? "Updating..." : statusAction.label}
                </Button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            {/* === LEFT COLUMN: Details (Takes 2/3 on desktop) === */}
            <div className="lg:col-span-2 space-y-3">
              {/* 1. Delivery Address */}
              {hasAddress && (
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                  <div className="px-5 py-3 border-b border-gray-100 bg-white flex items-center gap-2">
                    <div className="p-1.5 bg-emerald-100 rounded-md">
                      <MapPin className="w-4 h-4 text-emerald-700" />
                    </div>
                    <h3 className="font-bold text-gray-800 text-sm uppercase tracking-wide">
                      Delivery Address
                    </h3>
                  </div>
                  <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-8">
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mb-1">
                        House / Flat
                      </p>
                      <p className="text-gray-900 font-medium text-sm">
                        {localProfile.deliveryAddress.houseNo}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mb-1">
                        Landmark
                      </p>
                      <p className="text-gray-900 font-medium text-sm">
                        {localProfile.deliveryAddress.landmark || "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mb-1">
                        City / State
                      </p>
                      <p className="text-gray-900 font-medium text-sm">
                        {[
                          localProfile.deliveryAddress.city,
                          localProfile.deliveryAddress.state,
                        ]
                          .filter(Boolean)
                          .join(", ")}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mb-1">
                        Pincode
                      </p>
                      <span className="font-mono font-bold text-gray-700 bg-gray-100 px-2 py-1 rounded text-sm">
                        {localProfile.deliveryAddress.pincode || "-"}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* 2. Order Specs */}
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                <div className="px-5 py-3 border-b border-gray-100 bg-white flex items-center gap-2">
                  <div className="p-1.5 bg-blue-100 rounded-md">
                    <Briefcase className="w-4 h-4 text-blue-700" />
                  </div>
                  <h3 className="font-bold text-gray-800 text-sm uppercase tracking-wide">
                    Order Specifications
                  </h3>
                </div>
                <div className="p-5 grid grid-cols-2 sm:grid-cols-4 gap-6">
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">
                      Card Name
                    </p>
                    <p className="text-gray-900 font-medium text-sm">
                      {localProfile?.cardName}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">
                      Category
                    </p>
                    <Badge
                      variant="outline"
                      className="text-xs font-normal text-gray-600 bg-gray-50 border-gray-200"
                    >
                      {localProfile?.category}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">
                      Quantity
                    </p>
                    <p className="text-gray-900 font-bold text-lg">
                      {localProfile?.quantity}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase font-bold mb-2">
                      Front Preview
                    </p>
                    {localProfile?.frontImage ? (
                      <div className="relative w-20 h-12 rounded-lg border border-gray-200 bg-gray-50 overflow-hidden shadow-sm hover:shadow-md transition-all">
                        <img
                          src={localProfile.frontImage}
                          alt="Front"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400 italic">None</span>
                    )}
                  </div>
                </div>
              </div>

              {/* 3. Digital Profile Data */}
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                <div className="px-5 py-3 border-b border-gray-100 bg-white flex items-center gap-2">
                  <div className="p-1.5 bg-purple-100 rounded-md">
                    <User className="w-4 h-4 text-purple-700" />
                  </div>
                  <h3 className="font-bold text-gray-800 text-sm uppercase tracking-wide">
                    Digital Profile Data
                  </h3>
                </div>
                <div className="p-5 space-y-4">
                  {[
                    { l: "Full Name", v: localProfile?.profileFullName },
                    { l: "Designation", v: localProfile?.ProfileDesignation },
                    { l: "WhatsApp", v: localProfile?.watsappNumber },
                    { l: "Email", v: localProfile?.profileEmail },
                    { l: "Bio", v: localProfile?.bio, full: true },
                  ].map((i, idx) => (
                    <div
                      key={idx}
                      className={`grid grid-cols-1 sm:grid-cols-3 gap-1 sm:gap-4 ${
                        i.full ? "border-t border-gray-50 pt-3 mt-1" : ""
                      }`}
                    >
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-wide self-center">
                        {i.l}
                      </span>
                      <span className="sm:col-span-2 text-sm text-gray-800 font-medium break-words">
                        {i.v || (
                          <span className="text-gray-400 italic">
                            Not provided
                          </span>
                        )}
                      </span>
                    </div>
                  ))}

                  {/* Copy Link Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-4 border-t border-gray-100 items-center mt-2">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">
                      Profile Link
                    </span>
                    <div className="sm:col-span-2 flex items-center gap-2 w-full">
                      <div className="bg-gray-50 px-3 py-2 rounded-md text-xs text-gray-600 font-mono border border-gray-200 flex-1 truncate">
                        {localProfile?.viewId
                          ? `.../profile?id=${localProfile.viewId}`
                          : "Generating..."}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 text-indigo-600 hover:bg-indigo-50 border border-transparent hover:border-indigo-100 rounded-md"
                        onClick={handleCopyLink}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* === RIGHT COLUMN: QR Code (Takes 1/3 on desktop, Sticky) === */}
            <div className="space-y-6">
              <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm flex flex-col items-center text-center lg:sticky lg:top-24">
                <div className="bg-indigo-50 p-3 rounded-full mb-3 ring-4 ring-indigo-50/50">
                  <Printer className="w-6 h-6 text-indigo-600" />
                </div>
                <h3 className="font-bold text-gray-900 mb-1">
                  Digital QR Code
                </h3>
                <p className="text-xs text-gray-500 mb-6 px-4">
                  Scan this code to instantly view the digital profile.
                </p>

                <div
                  ref={qrRef}
                  className="bg-white p-4 border-2 border-dashed border-gray-300 rounded-xl mb-6 shadow-sm"
                >
                  <QRCodeCanvas
                    value={`https://taptune.in/#/profile?id=${localProfile?.viewId}`}
                    size={200}
                    bgColor="#ffffff"
                    fgColor="#000000"
                    level="H"
                    className="w-full h-auto max-w-[180px]"
                  />
                </div>

                <Button
                  onClick={handleDownloadQR}
                  className="w-full bg-gray-900 hover:bg-black text-white shadow-lg h-11 font-medium"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download PNG
                </Button>

                <div className="mt-5 flex items-center gap-2 text-xs font-semibold text-green-700 bg-green-50 px-4 py-2 rounded-full border border-green-100">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Ready for Printing</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}