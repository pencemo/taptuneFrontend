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
const CustomPhoneInput = ({ value, onChange, id, required, isDark }) => {
  return (
    <div className="relative">
      <PhoneInput
        international
        defaultCountry="IN"
        value={value}
        onChange={onChange}
        id={id}
        required={required}
        className={`flex h-10 w-full rounded-md border px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium focus-within:outline-none focus-within:ring-2 focus-within:ring-purple-600 focus-within:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-colors 
          ${
            isDark
              ? "border-slate-800 bg-slate-900 text-slate-100 placeholder:text-slate-500"
              : "border-gray-200 bg-white text-gray-900 placeholder:text-gray-500"
          }`}
        numberInputProps={{
          className: `bg-transparent border-none outline-none w-full h-full focus:ring-0 ml-2 
            ${isDark ? "text-slate-100 placeholder:text-slate-500" : "text-gray-900 placeholder:text-gray-500"}`,
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
  isDark = false, // Added isDark prop
}) {
  const [view, setView] = useState("form"); // 'form' | 'scanner'
  const [showAdditionalFields, setShowAdditionalFields] = useState(false);

  const handleScanComplete = (scannedData) => {
    const currentNotes = formData.notes || "";
    const newNotes =
      `${currentNotes}\n\n--- Scanned Data ---\n${scannedData.rawText || ""}`.trim();

    setFormData((prev) => ({
      ...prev,
      fullName: scannedData.name || prev.fullName,
      phone: scannedData.phoneNumber || prev.phone,
      email: scannedData.email || prev.email,
      website: scannedData.website || prev.website,
      notes: newNotes,
    }));

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

  const handleOpenChange = (v) => {
    if (!v) {
      onClose();
      setTimeout(() => setView("form"), 300);
    }
  };

  // Dynamic Theme Classes
  const theme = {
    bg: isDark ? "bg-slate-950" : "bg-white",
    bgMuted: isDark ? "bg-slate-900/50" : "bg-gray-50/50",
    border: isDark ? "border-slate-800" : "border-gray-200",
    text: isDark ? "text-slate-100" : "text-gray-900",
    textMuted: isDark ? "text-slate-400" : "text-gray-500",
    input: isDark
      ? "bg-slate-900 border-slate-800 text-slate-100 focus-visible:ring-purple-500"
      : "bg-white border-gray-200 text-gray-900 focus-visible:ring-purple-600",
    card: isDark
      ? "bg-purple-900/20 border-purple-900/30"
      : "bg-purple-50 border-purple-100",
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className={`flex flex-col gap-0 p-0 w-[95vw] sm:w-full sm:max-w-lg max-h-[90vh] rounded-xl overflow-hidden shadow-2xl transition-colors duration-200 ${theme.bg} ${theme.border}`}
      >
        {/* --- HEADER --- */}
        <DialogHeader
          className={`px-6 py-5 border-b flex-shrink-0 min-h-[85px] flex justify-center ${theme.bg} ${theme.border}`}
        >
          <div key={view} className="animate-in fade-in duration-300">
            {view === "form" ? (
              <>
                <DialogTitle
                  className={`text-xl sm:text-2xl font-bold ${theme.text}`}
                >
                  Share Your Information
                </DialogTitle>
                <DialogDescription
                  className={`text-sm mt-1 ${theme.textMuted}`}
                >
                  Fill in details manually or scan your business card.
                </DialogDescription>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className={`h-8 w-8 -ml-2 rounded-full transition-colors ${isDark ? "hover:bg-slate-800 text-slate-400" : "hover:bg-slate-100 text-gray-600"}`}
                  onClick={() => setView("form")}
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <div>
                  <DialogTitle className={`text-xl font-bold ${theme.text}`}>
                    Scan Card
                  </DialogTitle>
                  <div className="flex items-center gap-1 text-[10px] font-medium text-purple-500 bg-purple-500/10 px-2 py-0.5 rounded w-fit mt-1">
                    <Languages className="h-3 w-3" /> ENG + MAL
                  </div>
                </div>
              </div>
            )}
          </div>
        </DialogHeader>

        {/* --- BODY CONTENT --- */}
        <div
          className={`flex-1 overflow-y-auto p-6 relative overflow-x-hidden ${theme.bg}`}
        >
          {view === "form" && (
            <div className="animate-in slide-in-from-left-8 fade-in duration-300 ease-out">
              {/* Scan Banner */}
              <div
                className={`mb-6 p-4 rounded-xl border flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm transition-all hover:shadow-md ${theme.card}`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`${isDark ? "bg-purple-500/20 text-purple-400" : "bg-purple-100 text-purple-600"} p-2 rounded-lg`}
                  >
                    <ScanLine className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className={`font-semibold text-sm ${theme.text}`}>
                      Have a Business Card?
                    </h4>
                    <p className={`text-xs ${theme.textMuted}`}>
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
                      <Label
                        htmlFor="fullName"
                        className={`text-sm font-medium ${isDark ? "text-slate-300" : "text-gray-700"}`}
                      >
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
                        className={theme.input}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label
                        htmlFor="email"
                        className={`text-sm font-medium ${isDark ? "text-slate-300" : "text-gray-700"}`}
                      >
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
                        className={theme.input}
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label
                          htmlFor="phone"
                          className={`text-sm font-medium ${isDark ? "text-slate-300" : "text-gray-700"}`}
                        >
                          Phone Number <span className="text-red-500">*</span>
                        </Label>
                        <CustomPhoneInput
                          id="phone"
                          isDark={isDark}
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
                          className={`text-sm font-medium ${isDark ? "text-slate-300" : "text-gray-700"}`}
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
                          className={theme.input}
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
                    <div className={`w-full border-t ${theme.border}`}></div>
                  </div>
                  <div className="relative flex justify-center">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setShowAdditionalFields(!showAdditionalFields)
                      }
                      className={`${isDark ? "bg-slate-950 text-purple-400 border-slate-800 hover:bg-slate-900" : "bg-white text-purple-600 border-purple-200 hover:bg-purple-50"} transition-all`}
                    >
                      {showAdditionalFields ? (
                        <>
                          {" "}
                          <Minus className="mr-2 h-3.5 w-3.5" /> Less
                          Details{" "}
                        </>
                      ) : (
                        <>
                          {" "}
                          <Plus className="mr-2 h-3.5 w-3.5" /> Add Business
                          Details{" "}
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {showAdditionalFields && (
                  <div className="space-y-4 pt-2 animate-in fade-in-0 slide-in-from-top-2 duration-300 ease-out">
                    <div
                      className={`${isDark ? "bg-slate-900/30 border-slate-800" : "bg-gray-50/50 border-gray-100"} p-4 rounded-lg border space-y-4`}
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label
                            className={`flex items-center gap-2 ${isDark ? "text-slate-300" : "text-gray-700"}`}
                          >
                            <Building2 className="w-3.5 h-3.5 opacity-70" />{" "}
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
                            className={theme.input}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label
                            className={`flex items-center gap-2 ${isDark ? "text-slate-300" : "text-gray-700"}`}
                          >
                            <div className="w-3.5 h-3.5" /> Business Phone
                          </Label>
                          <CustomPhoneInput
                            isDark={isDark}
                            value={formData.businessPhone}
                            onChange={(val) =>
                              setFormData({ ...formData, businessPhone: val })
                            }
                            required={false}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label
                          className={`flex items-center gap-2 ${isDark ? "text-slate-300" : "text-gray-700"}`}
                        >
                          <Globe className="w-3.5 h-3.5 opacity-70" /> Website
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
                          className={theme.input}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label
                          className={`flex items-center gap-2 ${isDark ? "text-slate-300" : "text-gray-700"}`}
                        >
                          <MapPin className="w-3.5 h-3.5 opacity-70" /> Address
                        </Label>
                        <Textarea
                          value={formData.businessAddress || ""}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              businessAddress: e.target.value,
                            })
                          }
                          className={`min-h-[60px] resize-none ${theme.input}`}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label
                          className={
                            isDark ? "text-slate-300" : "text-gray-700"
                          }
                        >
                          Notes (Scanned Text)
                        </Label>
                        <Textarea
                          value={formData.notes || ""}
                          onChange={(e) =>
                            setFormData({ ...formData, notes: e.target.value })
                          }
                          className={`min-h-[80px] font-mono text-xs ${theme.input} ${isDark ? "text-slate-400" : "text-gray-600"}`}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </form>
            </div>
          )}

          {view === "scanner" && (
            <div className="animate-in slide-in-from-right-8 fade-in duration-300 ease-out h-full flex flex-col">
              <ScanCard onScanComplete={handleScanComplete} isDark={isDark} />
            </div>
          )}
        </div>

        {/* --- FOOTER --- */}
        <DialogFooter
          className={`p-6 pt-4 border-t flex-col sm:flex-row gap-3 flex-shrink-0 ${theme.bgMuted} ${theme.border}`}
        >
          <Button
            type="button"
            variant="outline"
            onClick={view === "form" ? onClose : () => setView("form")}
            className={`w-full sm:w-auto order-2 sm:order-1 transition-colors ${isDark ? "bg-slate-900 hover:text-slate-400 border-slate-800 text-slate-300 hover:bg-slate-800" : ""}`}
            disabled={loading}
          >
            Cancel
          </Button>

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
