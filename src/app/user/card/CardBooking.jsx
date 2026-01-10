"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Star,
  QrCode,
  CheckCircle,
  Plus,
  Minus,
  MapPin,
  Truck,
  ChevronDown,
  ChevronUp,
  Loader2,
} from "lucide-react";

import {
  useCreateCardOrderAndProfile,
  useGetOneCard,
} from "@/hooks/tanstackHooks/useCard";
import { useCreateReviewCardOrder } from "@/hooks/tanstackHooks/useReviewCard";

import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import Loader from "@/components/ui/Loader";
import { uploadFileToFirebase } from "@/firebase/functions/uploadFileToFirebase";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import {
  useCreatePaymentOrder,
  useVerifyPayment,
} from "@/hooks/tanstackHooks/usePayment";

export default function CardBooking() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data, isLoading } = useGetOneCard({ id });
  const cardData = data?.data || {};
  const isReviewCard = cardData?.category === "Review Card";

  // Mutations
  const { mutateAsync: createNormalOrder } = useCreateCardOrderAndProfile();
  const { mutateAsync: createReviewOrder } = useCreateReviewCardOrder();
  const { mutateAsync: createPaymentOrder } = useCreatePaymentOrder();
  const { mutateAsync: verifyPayment } = useVerifyPayment();

  const [loading, setLoading] = useState(false);
  const [imageViewOnCard, setImageViewOnCard] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [uploadedLogo, setUploadedLogo] = useState(null);
  const [errors, setErrors] = useState({});

  // Toggle for Shipping Accordion
  const [showShipping, setShowShipping] = useState(false);

  // --- STATE ---
  const [formData, setFormData] = useState({
    // Personal/Card Info
    fullName: "",
    designation: "",
    phone: "",
    email: "",
    brandName: "",
    googleReviewUrl: "",

    // Delivery Address Info
    houseNo: "",
    landmark: "",
    city: "",
    state: "",
    pincode: "",
  });

  const cardPrice = cardData?.price || 1200;
  const totalAmount = cardPrice * quantity;

  /* ---------- Load Razorpay Script ---------- */
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  /* ---------- Image Preview ---------- */
  useEffect(() => {
    if (cardData?.frontImage) {
      setImageViewOnCard(cardData.frontImage);
    }
  }, [cardData?.frontImage]);

  /* ---------- Input Handlers ---------- */
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
    setErrors((p) => ({ ...p, [name]: undefined }));
  };

  const handlePhoneChange = (value) => {
    setFormData((p) => ({ ...p, phone: value.replace(/^\+/, "") }));
    setErrors((p) => ({ ...p, phone: undefined }));
  };

  const handleQuantityChange = (type) => {
    if (type === "increase") setQuantity((p) => p + 1);
    if (type === "decrease" && quantity > 1) setQuantity((p) => p - 1);
  };

  const handleLogoUpload = (e) => {
    if (e.target.files[0]) {
      setUploadedLogo(e.target.files[0]);
      setErrors((p) => ({ ...p, logo: undefined }));
    }
  };

  /* ---------- Validation ---------- */
  const validate = () => {
    const e = {};

    // 1. Card Specific Validation
    if (isReviewCard) {
      if (!formData.brandName.trim()) e.brandName = "Brand name is required";
      if (!formData.googleReviewUrl.trim())
        e.googleReviewUrl = "Google review URL is required";
    } else {
      if (!formData.fullName.trim()) e.fullName = "Full name required";
      if (!formData.designation.trim()) e.designation = "Designation required";
      if (!formData.phone.trim()) e.phone = "Phone number required";
      if (!formData.email.includes("@")) e.email = "Valid email required";
    }

    if (cardData?.isLogo && !uploadedLogo) e.logo = "Logo required";

    return e;
  };

  /* ---------- PAYMENT + ORDER LOGIC ---------- */
  const handlePlaceOrder = async () => {
    setLoading(true);

    const validationErrors = validate();
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length) {
      setLoading(false);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    try {
      let logoLink = "";
      if (cardData?.isLogo && uploadedLogo) {
        logoLink = await uploadFileToFirebase(uploadedLogo, "logo");
      }

      /* 1️⃣ Create Razorpay Order */
      const paymentOrder = await createPaymentOrder({
        amount: totalAmount,
      });

      if (!paymentOrder?.success) {
        toast.error("Unable to initiate payment");
        setLoading(false);
        return;
      }

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY,
        amount: paymentOrder.order.amount,
        currency: "INR",
        name: "TapTune",
        description: cardData.cardName,
        order_id: paymentOrder.order.id,

        handler: async (response) => {
          try {
            /* 2️⃣ Verify Payment */
            const verified = await verifyPayment(response);
            const isVerified = verified?.success || verified?.data?.success;

            if (!isVerified) {
              throw new Error("Payment verification failed");
            }

            /* 3️⃣ CONSTRUCT PAYLOAD */
            const payload = {
              // Identifiers
              cardId: id,
              razorpayOrderId: paymentOrder.order.id,
              paymentId: response.razorpay_payment_id,
              amount: totalAmount,

              // Common Data
              fullName: formData.fullName,
              designation: formData.designation,
              phone: formData.phone,
              email: formData.email,
              quantity,
              logoImage: logoLink,

              // Address (Backend handles empty strings if optional)
              deliveryAddress: {
                houseNo: formData.houseNo,
                landmark: formData.landmark,
                city: formData.city,
                state: formData.state,
                pincode: formData.pincode,
                country: "India",
              },

              // Review Card Specifics
              ...(isReviewCard && {
                brandName: formData.brandName,
                googleReviewUrl: formData.googleReviewUrl,
              }),
            };

            /* 4️⃣ CALL API & CHECK RESPONSE */
            let orderResponse;

            if (isReviewCard) {
              orderResponse = await createReviewOrder(payload);
            } else {
              orderResponse = await createNormalOrder(payload);
            }

            // ✅ Dynamic Success Handling
            if (orderResponse?.success) {
              toast.success(
                orderResponse.message || "Order placed successfully!"
              );
              navigate(-1);
            } else {
              // Fallback if API returns 200 but success: false
              toast.error(orderResponse?.message || "Failed to place order.");
              setLoading(false);
            }
          } catch (err) {
            console.error("Order failed:", err);
            // Use backend error message if available, else fallback
            const errorMessage =
              err.response?.data?.message ||
              "Payment verified but order failed. Contact support.";
            toast.error(errorMessage);
            setLoading(false);
          }
        },

        modal: {
          ondismiss: () => {
            toast.error("Payment cancelled");
            setLoading(false);
          },
        },

        prefill: {
          name: formData.fullName,
          email: formData.email,
          contact: formData.phone,
        },

        theme: { color: "#000000" },
      };

      const rzp = new window.Razorpay(options);

      rzp.on("payment.failed", function (response) {
        toast.error(response.error.description);
        setLoading(false);
      });

      rzp.open();
    } catch (err) {
      console.error("Payment init failed:", err);
      toast.error("Payment initialization failed");
      setLoading(false);
    }
  };

  /* ---------- UI RENDER ---------- */
  if (isLoading)
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <Loader />
      </div>
    );

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
              Book a Card
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              Customize your card and tell us where to ship it.
            </p>
          </div>
          <Button
            variant="outline"
            size="icon"
            className="rounded-full bg-white shadow-sm hover:bg-gray-100"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </Button>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 lg:gap-12">
          {/* --- LEFT SECTION: Preview & Info --- */}
          <div className="space-y-6">
            <Card className="border-0 shadow-lg overflow-hidden rounded-md p-0 bg-white">
              <div className="relative aspect-video sm:aspect-[1.6/1] w-full bg-gray-100">
                <img
                  src={imageViewOnCard}
                  alt="Card front"
                  className="absolute inset-0 w-full h-full object-cover"
                />
              </div>
            </Card>

            <div className="flex gap-4">
              {[
                { src: cardData?.frontImage, label: "Front" },
                { src: cardData?.backImage, label: "Back" },
              ].map((img, idx) => (
                <div
                  key={idx}
                  className={`w-24 aspect-[1.6/1] rounded-lg border-2 transition-all ${
                    imageViewOnCard === img.src
                      ? "border-indigo-600 ring-2 ring-indigo-100"
                      : "border-gray-200 hover:border-gray-300"
                  } overflow-hidden cursor-pointer bg-white relative`}
                  onClick={() => setImageViewOnCard(img.src)}
                >
                  <img
                    src={img.src}
                    alt={img.label}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {cardData?.cardName}
                </h2>
                <div className="flex items-center gap-2 mt-2">
                  <Badge
                    variant="secondary"
                    className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
                  >
                    {cardData?.category}
                  </Badge>
                  <div className="flex items-center text-yellow-400">
                    <Star className="w-4 h-4 fill-current" />
                    <span className="text-gray-600 text-sm font-medium ml-1">
                      4.9 (120+ reviews)
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-gray-900">
                  ₹{cardData?.price || "1200"}
                </span>
              </div>

              {(cardData?.isQr || cardData?.isLogo) && (
                <div className="pt-4 border-t border-gray-100 space-y-3">
                  <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
                    Features
                  </h3>
                  <div className="flex flex-wrap gap-3">
                    {cardData?.isQr && (
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-md text-sm font-medium">
                        <QrCode className="w-4 h-4" />
                        QR Code
                      </div>
                    )}
                    {cardData?.isLogo && (
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-md text-sm font-medium">
                        <CheckCircle className="w-4 h-4" />
                        Logo Customization
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* --- RIGHT SECTION: Forms --- */}
          <div>
            <Card className="border-0 shadow-xl rounded-2xl overflow-hidden p-0">
              <CardContent className="p-6 sm:p-8 space-y-8">
                {/* 1. Card Personalization Section */}
                <div className="space-y-6">
                  <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                    <div className="p-2 bg-indigo-50 rounded-lg">
                      <Star className="w-5 h-5 text-indigo-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Card Customization
                    </h3>
                  </div>

                  {/* Normal Card Inputs */}
                  {!isReviewCard && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div className="space-y-1.5">
                        <Label
                          htmlFor="fullName"
                          className="text-xs uppercase text-gray-500 font-semibold tracking-wide"
                        >
                          Full Name
                        </Label>
                        <Input
                          id="fullName"
                          name="fullName"
                          value={formData.fullName}
                          onChange={handleInputChange}
                          placeholder="e.g. John Doe"
                          className={`bg-gray-50 h-11 ${
                            errors.fullName
                              ? "border-red-500"
                              : "border-gray-200"
                          }`}
                        />
                        {errors.fullName && (
                          <p className="text-xs text-red-500 font-medium">
                            {errors.fullName}
                          </p>
                        )}
                      </div>

                      <div className="space-y-1.5">
                        <Label
                          htmlFor="designation"
                          className="text-xs uppercase text-gray-500 font-semibold tracking-wide"
                        >
                          Designation
                        </Label>
                        <Input
                          id="designation"
                          name="designation"
                          value={formData.designation}
                          onChange={handleInputChange}
                          placeholder="e.g. Manager"
                          className={`bg-gray-50 h-11 ${
                            errors.designation
                              ? "border-red-500"
                              : "border-gray-200"
                          }`}
                        />
                        {errors.designation && (
                          <p className="text-xs text-red-500 font-medium">
                            {errors.designation}
                          </p>
                        )}
                      </div>

                      <div className="space-y-1.5 sm:col-span-1">
                        <Label className="text-xs uppercase text-gray-500 font-semibold tracking-wide">
                          Phone
                        </Label>
                        <PhoneInput
                          country={"in"}
                          value={formData.phone}
                          onChange={handlePhoneChange}
                          containerClass="w-full"
                          inputClass={`!w-full !h-11 !border !rounded-md !pl-12 !pr-3 !text-sm !bg-gray-50 ${
                            errors.phone
                              ? "!border-red-500"
                              : "!border-gray-200"
                          }`}
                          buttonClass={`!border !rounded-l-md !bg-gray-100 ${
                            errors.phone
                              ? "!border-red-500"
                              : "!border-gray-200"
                          }`}
                        />
                        {errors.phone && (
                          <p className="text-xs text-red-500 font-medium">
                            {errors.phone}
                          </p>
                        )}
                      </div>

                      <div className="space-y-1.5 sm:col-span-1">
                        <Label className="text-xs uppercase text-gray-500 font-semibold tracking-wide">
                          Email
                        </Label>
                        <Input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          placeholder="john@example.com"
                          className={`bg-gray-50 h-11 ${
                            errors.email ? "border-red-500" : "border-gray-200"
                          }`}
                        />
                        {errors.email && (
                          <p className="text-xs text-red-500 font-medium">
                            {errors.email}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Review Card Inputs */}
                  {isReviewCard && (
                    <div className="grid grid-cols-1 gap-5">
                      <div className="space-y-1.5">
                        <Label className="text-xs uppercase text-gray-500 font-semibold tracking-wide">
                          Brand Name
                        </Label>
                        <Input
                          name="brandName"
                          value={formData.brandName}
                          onChange={handleInputChange}
                          placeholder="Your Business Name"
                          className={`bg-gray-50 h-11 ${
                            errors.brandName
                              ? "border-red-500"
                              : "border-gray-200"
                          }`}
                        />
                        {errors.brandName && (
                          <p className="text-xs text-red-500 font-medium">
                            {errors.brandName}
                          </p>
                        )}
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs uppercase text-gray-500 font-semibold tracking-wide">
                          Google Review URL
                        </Label>
                        <Input
                          name="googleReviewUrl"
                          value={formData.googleReviewUrl}
                          onChange={handleInputChange}
                          placeholder="https://g.page/..."
                          className={`bg-gray-50 h-11 ${
                            errors.googleReviewUrl
                              ? "border-red-500"
                              : "border-gray-200"
                          }`}
                        />
                        {errors.googleReviewUrl && (
                          <p className="text-xs text-red-500 font-medium">
                            {errors.googleReviewUrl}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Logo Upload */}
                  {cardData?.isLogo && (
                    <div className="space-y-2">
                      <Label className="text-xs uppercase text-gray-500 font-semibold tracking-wide">
                        Brand Logo
                      </Label>
                      <div
                        className={`relative border-2 border-dashed rounded-xl p-6 text-center transition-all ${
                          errors.logo
                            ? "border-red-300 bg-red-50"
                            : "border-gray-300 hover:border-indigo-400 bg-gray-50"
                        }`}
                      >
                        {uploadedLogo ? (
                          <div className="flex flex-col items-center">
                            <img
                              src={URL.createObjectURL(uploadedLogo)}
                              alt="Logo"
                              className="h-16 object-contain mb-2"
                            />
                            <p className="text-xs text-gray-500">
                              {uploadedLogo.name}
                            </p>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center text-gray-500">
                            <Plus className="w-8 h-8 mb-2 opacity-50" />
                            <p className="text-sm">Click to upload logo</p>
                          </div>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleLogoUpload}
                          className="absolute inset-0 opacity-0 cursor-pointer"
                        />
                      </div>
                      {errors.logo && (
                        <p className="text-xs text-red-500 font-medium">
                          {errors.logo}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* 2. Shipping Address Section (Accordion) */}
                <div className="border border-gray-200 rounded-xl overflow-hidden bg-gray-50/50">
                  {/* Accordion Header */}
                  <div
                    onClick={() => setShowShipping(!showShipping)}
                    className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-100/50 transition-colors select-none"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-emerald-50 rounded-lg shrink-0">
                        <Truck className="w-5 h-5 text-emerald-600" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-gray-900">
                          Shipping Details
                        </h3>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Add address for physical delivery (Optional)
                        </p>
                      </div>
                    </div>
                    <div
                      className={`transition-transform duration-200 ${
                        showShipping ? "rotate-180" : ""
                      }`}
                    >
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    </div>
                  </div>

                  {/* Accordion Body */}
                  {showShipping && (
                    <div className="p-4 pt-0 border-t border-gray-100 bg-white animate-in slide-in-from-top-2 duration-200">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-4">
                        <div className="space-y-1.5 sm:col-span-1">
                          <Label className="text-xs uppercase text-gray-500 font-semibold tracking-wide">
                            Flat / House No.
                          </Label>
                          <Input
                            name="houseNo"
                            value={formData.houseNo}
                            onChange={handleInputChange}
                            placeholder="e.g. Flat 101"
                            className="bg-gray-50 h-11 border-gray-200"
                          />
                        </div>

                        <div className="space-y-1.5 sm:col-span-1">
                          <Label className="text-xs uppercase text-gray-500 font-semibold tracking-wide">
                            Landmark
                          </Label>
                          <Input
                            name="landmark"
                            value={formData.landmark}
                            onChange={handleInputChange}
                            placeholder="e.g. Near Apollo Hospital"
                            className="bg-gray-50 h-11 border-gray-200"
                          />
                        </div>

                        <div className="space-y-1.5 sm:col-span-1">
                          <Label className="text-xs uppercase text-gray-500 font-semibold tracking-wide">
                            City
                          </Label>
                          <Input
                            name="city"
                            value={formData.city}
                            onChange={handleInputChange}
                            placeholder="e.g. Bangalore"
                            className="bg-gray-50 h-11 border-gray-200"
                          />
                        </div>

                        <div className="space-y-1.5 sm:col-span-1">
                          <Label className="text-xs uppercase text-gray-500 font-semibold tracking-wide">
                            State
                          </Label>
                          <Input
                            name="state"
                            value={formData.state}
                            onChange={handleInputChange}
                            placeholder="e.g. Karnataka"
                            className="bg-gray-50 h-11 border-gray-200"
                          />
                        </div>

                        <div className="space-y-1.5 sm:col-span-2">
                          <Label className="text-xs uppercase text-gray-500 font-semibold tracking-wide">
                            Pincode
                          </Label>
                          <div className="relative">
                            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <Input
                              name="pincode"
                              maxLength={6}
                              value={formData.pincode}
                              onChange={(e) => {
                                const val = e.target.value.replace(/\D/g, "");
                                handleInputChange({
                                  target: { name: "pincode", value: val },
                                });
                              }}
                              placeholder="e.g. 560001"
                              className="bg-gray-50 h-11 pl-10 tracking-widest border-gray-200"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* 3. Summary & Action */}
                <div className="space-y-6 pt-6 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-semibold">Quantity</Label>
                    <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 rounded-md bg-white shadow-sm hover:bg-gray-100"
                        onClick={() => handleQuantityChange("decrease")}
                        disabled={quantity <= 1}
                      >
                        <Minus className="w-4 h-4" />
                      </Button>
                      <span className="w-8 text-center font-bold">
                        {quantity}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 rounded-md bg-white shadow-sm hover:bg-gray-100"
                        onClick={() => handleQuantityChange("increase")}
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="bg-indigo-50 p-5 rounded-xl flex items-center justify-between">
                    <div>
                      <p className="text-xs text-indigo-600 uppercase font-bold tracking-wide">
                        Total Amount
                      </p>
                      <p className="text-2xl font-bold text-indigo-900">
                        ₹ {totalAmount.toLocaleString()}
                      </p>
                    </div>
                    <Button
                      onClick={handlePlaceOrder}
                      disabled={loading}
                      className="
    w-full sm:w-auto min-w-[180px]
    bg-indigo-600 hover:bg-indigo-700
    text-white text-base sm:text-lg
    px-6 sm:px-8 h-11 sm:h-12
    shadow-lg shadow-indigo-200
    flex items-center justify-center
    disabled:opacity-70 disabled:cursor-not-allowed
    transition-colors
  "
                    >
                      {loading ? (
                        <Loader2 className="h-5 w-5 animate-spin text-white" />
                      ) : (
                        "Pay Now"
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
