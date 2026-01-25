

"use client";

import { useState } from "react";
import "react-phone-number-input/style.css";
import PhoneInput from "react-phone-number-input";

// --- Import the separate ScanCard component ---
import ScanCard from "./scanning/ScanCardModal";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Loader2,
  Plus,
  Minus,
  Globe,
  Building2,
  MapPin,
  Camera,
  ScanLine,
  ChevronLeft,
  Languages,
} from "lucide-react";

// --- Custom Phone Input Helper ---
const CustomPhoneInput = ({ value, onChange, id, required }) => {
  return (
    <div className="relative">
      <PhoneInput
        international
        defaultCountry="IN"
        value={value}
        onChange={onChange}
        id={id}
        required={required}
        className="flex h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-purple-600 focus-within:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        numberInputProps={{
          className:
            "bg-transparent border-none outline-none text-gray-900 placeholder:text-gray-500 w-full h-full focus:ring-0 ml-2",
        }}
      />
    </div>
  );
};

export default function ShareInfoModal({
  open,
  onClose,
  formData,
  setFormData,
  onSubmit,
  loading,
}) {
  // --- STATE MANAGEMENT ---
  const [view, setView] = useState("form"); // 'form' | 'scanner'
  const [showAdditionalFields, setShowAdditionalFields] = useState(false);

  // --- HANDLERS ---
  const handleScanComplete = (scannedData) => {
    // 1. Create formatted notes
    const currentNotes = formData.notes || "";
    const newNotes =
      `${currentNotes}\n\n--- Scanned Data ---\n${scannedData.rawText || ""}`.trim();

    // 2. Update Form Data
    setFormData((prev) => ({
      ...prev,
      fullName: scannedData.name || prev.fullName,
      phone: scannedData.phoneNumber || prev.phone,
      email: scannedData.email || prev.email,
      website: scannedData.website || prev.website,
      notes: newNotes,
    }));

    // 3. Switch back to form view
    setView("form");
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    const cleanPhone = formData.phone ? formData.phone.replace("+", "") : "";
    const cleanBusinessPhone = formData.businessPhone
      ? formData.businessPhone.replace("+", "")
      : "";

    onSubmit({
      ...formData,
      phone: cleanPhone,
      businessPhone: cleanBusinessPhone,
    });
  };

  // Reset view when modal closes/opens
  const handleOpenChange = (v) => {
    if (!v) {
      onClose();
      // Short delay to reset view after animation closes
      setTimeout(() => setView("form"), 300);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="flex flex-col gap-0 p-0 w-[95vw] sm:w-full sm:max-w-lg max-h-[90vh] rounded-xl overflow-hidden bg-white">
        {/* --- HEADER --- */}
        <DialogHeader className="px-6 py-5 border-b bg-white flex-shrink-0 min-h-[85px] flex justify-center">
          {/* Using a key here triggers a subtle fade animation on title change */}
          <div key={view} className="animate-in fade-in duration-300">
            {view === "form" ? (
              <>
                <DialogTitle className="text-xl sm:text-2xl font-bold text-gray-900">
                  Share Your Information
                </DialogTitle>
                <DialogDescription className="text-sm text-gray-500 mt-1">
                  Fill in details manually or scan your business card.
                </DialogDescription>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 -ml-2 rounded-full hover:bg-slate-100 transition-colors"
                  onClick={() => setView("form")}
                >
                  <ChevronLeft className="h-5 w-5 text-gray-600" />
                </Button>
                <div>
                  <DialogTitle className="text-xl font-bold text-gray-900">
                    Scan Card
                  </DialogTitle>
                  <div className="flex items-center gap-1 text-[10px] font-medium text-purple-600 bg-purple-50 px-2 py-0.5 rounded w-fit mt-1">
                    <Languages className="h-3 w-3" /> ENG + MAL
                  </div>
                </div>
              </div>
            )}
          </div>
        </DialogHeader>

        {/* --- BODY CONTENT --- */}
        <div className="flex-1 overflow-y-auto p-6 bg-white relative overflow-x-hidden">
          {/* VIEW 1: THE FORM */}
          {view === "form" && (
            <div className="animate-in slide-in-from-left-8 fade-in duration-300 ease-out">
              {/* Scan Banner */}
              <div className="mb-6 bg-purple-50 p-4 rounded-xl border border-purple-100 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm transition-all hover:shadow-md hover:border-purple-200">
                <div className="flex items-center gap-3">
                  <div className="bg-purple-100 p-2 rounded-lg text-purple-600">
                    <ScanLine className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 text-sm">
                      Have a Business Card?
                    </h4>
                    <p className="text-xs text-gray-500">
                      Auto-fill details instantly
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  onClick={() => setView("scanner")}
                  className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700 text-white gap-2 shadow-sm transition-all active:scale-95"
                  size="sm"
                >
                  <Camera className="h-4 w-4" /> Scan Card
                </Button>
              </div>

              <form
                id="share-info-form"
                onSubmit={handleFormSubmit}
                className="space-y-6"
              >
                <div className="space-y-4">
                  <div className="grid gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="fullName" className="text-sm font-medium">
                        Full Name <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="fullName"
                        placeholder="e.g. John Doe"
                        value={formData.fullName || ""}
                        onChange={(e) =>
                          setFormData({ ...formData, fullName: e.target.value })
                        }
                        required
                        className="focus-visible:ring-purple-600 transition-shadow"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-sm font-medium">
                        Email
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="name@example.com"
                        value={formData.email || ""}
                        onChange={(e) =>
                          setFormData({ ...formData, email: e.target.value })
                        }
                        className="focus-visible:ring-purple-600 transition-shadow"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="phone" className="text-sm font-medium">
                          Phone Number <span className="text-red-500">*</span>
                        </Label>
                        <CustomPhoneInput
                          id="phone"
                          value={formData.phone}
                          onChange={(val) =>
                            setFormData({ ...formData, phone: val })
                          }
                          required={true}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label
                          htmlFor="designation"
                          className="text-sm font-medium"
                        >
                          Designation
                        </Label>
                        <Input
                          id="designation"
                          placeholder="e.g. Manager"
                          value={formData.designation || ""}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              designation: e.target.value,
                            })
                          }
                          className="focus-visible:ring-purple-600 transition-shadow"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="relative">
                  <div
                    className="absolute inset-0 flex items-center"
                    aria-hidden="true"
                  >
                    <div className="w-full border-t border-gray-200"></div>
                  </div>
                  <div className="relative flex justify-center">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setShowAdditionalFields(!showAdditionalFields)
                      }
                      className="bg-white text-purple-600 border-purple-200 hover:bg-purple-50 hover:text-purple-700 hover:border-purple-300 transition-all"
                    >
                      {showAdditionalFields ? (
                        <>
                          <Minus className="mr-2 h-3.5 w-3.5" /> Less Details
                        </>
                      ) : (
                        <>
                          <Plus className="mr-2 h-3.5 w-3.5" /> Add Business
                          Details
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {showAdditionalFields && (
                  <div className="space-y-4 pt-2 animate-in fade-in-0 slide-in-from-top-2 duration-300 ease-out">
                    <div className="bg-gray-50/50 p-4 rounded-lg border border-gray-100 space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="flex items-center gap-2">
                            <Building2 className="w-3.5 h-3.5 text-gray-500" />{" "}
                            Business Name
                          </Label>
                          <Input
                            value={formData.businessName || ""}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                businessName: e.target.value,
                              })
                            }
                            className="bg-white focus-visible:ring-purple-600 transition-shadow"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="flex items-center gap-2">
                            <div className="w-3.5 h-3.5" /> Business Phone
                          </Label>
                          <CustomPhoneInput
                            value={formData.businessPhone}
                            onChange={(val) =>
                              setFormData({ ...formData, businessPhone: val })
                            }
                            required={false}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                          <Globe className="w-3.5 h-3.5 text-gray-500" />{" "}
                          Website
                        </Label>
                        <Input
                          placeholder="https://"
                          value={formData.website || ""}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              website: e.target.value,
                            })
                          }
                          className="bg-white focus-visible:ring-purple-600 transition-shadow"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 text-gray-500" />{" "}
                          Address
                        </Label>
                        <Textarea
                          value={formData.businessAddress || ""}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              businessAddress: e.target.value,
                            })
                          }
                          className="min-h-[60px] bg-white resize-none focus-visible:ring-purple-600 transition-shadow"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Notes (Scanned Text)</Label>
                        <Textarea
                          value={formData.notes || ""}
                          onChange={(e) =>
                            setFormData({ ...formData, notes: e.target.value })
                          }
                          className="min-h-[80px] bg-white text-xs font-mono text-gray-600 focus-visible:ring-purple-600 transition-shadow"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </form>
            </div>
          )}

          {/* VIEW 2: THE SCANNER (Imported) */}
          {view === "scanner" && (
            <div className="animate-in slide-in-from-right-8 fade-in duration-300 ease-out h-full flex flex-col">
              <ScanCard onScanComplete={handleScanComplete} />
            </div>
          )}
        </div>

        {/* --- FOOTER --- */}
        <DialogFooter className="p-6 pt-4 border-t bg-gray-50/50 sm:bg-white flex-col sm:flex-row gap-3 flex-shrink-0">
          <Button
            type="button"
            variant="outline"
            onClick={view === "form" ? onClose : () => setView("form")}
            className="w-full sm:w-auto order-2 sm:order-1 transition-colors"
            disabled={loading}
          >
            Cancel
          </Button>

          {/* Only show Submit button when in Form View */}
          {view === "form" && (
            <div className="animate-in fade-in duration-300 w-full sm:w-auto order-1 sm:order-2">
              <Button
                type="submit"
                form="share-info-form"
                className="w-full bg-purple-600 hover:bg-purple-700 text-white shadow-md transition-all hover:shadow-lg"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin mr-2 h-4 w-4" />{" "}
                    Submitting...
                  </>
                ) : (
                  "Submit Information"
                )}
              </Button>
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}