"use client";

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  Globe,
  Instagram,
  Phone,
  FileDown,
  Share2,
  Mail,
  MessageCircle,
  Star,
  User,
  Briefcase,
  Loader2,
} from "lucide-react";

import { useConnectProfile } from "@/hooks/tanstackHooks/useConnections";
import { iconObj } from "@/assets/Icons/icons";

// --- Import your new component ---
import ShareInfoModal from "./ShareInfoModal";
// (Ensure the path above is correct)

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import PhoneInput from "react-phone-number-input";

/* ---------------- CUSTOM PHONE INPUT (for AutoModal) ---------------- */
const CustomPhoneInput = ({ value, onChange, placeholder }) => (
  <div className="relative">
    <PhoneInput
      international
      defaultCountry="IN"
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="flex h-10 w-full rounded-md border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-white focus-within:ring-2 focus-within:ring-neutral-600"
      numberInputProps={{
        className:
          "bg-transparent border-none outline-none text-white w-full h-full ml-2",
      }}
    />
  </div>
);

export default function SalesProfilePremium({ profile }) {
  const navigate = useNavigate();
  const { mutate: connectProfile, isPending: loading } = useConnectProfile();

  /* ---------------- STATES ---------------- */
  const [isExchangeOpen, setIsExchangeOpen] = useState(false);
  const [isAutoModalOpen, setIsAutoModalOpen] = useState(false);
  const [autoModalShown, setAutoModalShown] = useState(false);

  // Matches the structure expected by ShareInfoModal
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    designation: "",
    businessName: "",
    businessPhone: "",
    website: "",
    businessAddress: "",
    notes: "",
  });

  const [autoForm, setAutoForm] = useState({ fullName: "", phone: "" });

  /* ---------------- AUTO MODAL TIMER ---------------- */
  useEffect(() => {
    if (autoModalShown) return;
    const timer = setTimeout(() => {
      setIsAutoModalOpen(true);
      setAutoModalShown(true);
    }, 2000);
    return () => clearTimeout(timer);
  }, [autoModalShown]);

  /* ---------------- SUBMISSION LOGIC ---------------- */
  const handleFinalSubmit = (data) => {
    if (!data.fullName || !data.phone) {
      toast.error("Name and phone number are required");
      return;
    }

    const payload = {
      viewId: profile?.viewId,
      fullName: data.fullName,
      phoneNumber: data.phone, // ShareInfoModal already cleans '+' if you kept that logic there
      email: data.email,
      designation: data.designation,
      businessName: data.businessName,
      businessPhone: data.businessPhone,
      website: data.website,
      address: data.businessAddress,
      notes: data.notes,
    };

    connectProfile(payload, {
      onSuccess: (res) => {
        if (res?.success) {
          toast.success("Information shared successfully!");
          setIsExchangeOpen(false);
          setIsAutoModalOpen(false);
          // Reset form
          setFormData({ fullName: "", email: "", phone: "", designation: "" });
        }
      },
      onError: (err) => {
        toast.error(err?.response?.data?.message || "Error sending connection");
      },
    });
  };

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({
        title: profile.fullName,
        url: window.location.href,
      });
    }
  };

  const actions = [
    { icon: Star, label: "Google Review", href: profile.googleReview },
    { icon: Instagram, label: "Instagram", href: profile.instagram },
    { icon: Phone, label: "Call", href: `tel:${profile.phoneNumber}` },
    {
      icon: MessageCircle,
      label: "WhatsApp",
      href: `https://wa.me/${profile.whatsapp}`,
    },
    { icon: Mail, label: "Email", href: `mailto:${profile.email}` },
    { icon: FileDown, label: "Download PDF", href: profile.pdf },
    { icon: Globe, label: "Website", href: profile.website },
    { icon: Share2, label: "Share", onClick: handleShare },
  ].filter((a) => a.href || a.onClick);

  return (
    <div className="min-h-screen bg-neutral-950 text-white flex justify-center p-4 lg:p-10">
      <div className="fixed inset-0 bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950" />

      <div className="relative z-10 w-full max-w-6xl">
        {/* Mobile View */}
        <div className="lg:hidden">
          <div className="relative">
            <div className="aspect-[16/10] rounded-xl overflow-hidden">
              <img
                src={profile.banner || "/placeholder.svg"}
                className="w-full h-full object-cover"
                alt="Banner"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-black/80 rounded-xl" />
            </div>
            <div className="absolute left-1/2 -translate-x-1/2 -bottom-16 z-20">
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 p-1 shadow-xl">
                <img
                  src={profile.profilePic || "/placeholder.svg"}
                  alt={profile.fullName}
                  className="w-full h-full rounded-full object-cover bg-neutral-900"
                />
              </div>
            </div>
          </div>

          <div className="relative bg-neutral-900 rounded-2xl px-6 pt-20 pb-8 mt-20">
            <h1 className="text-center text-2xl font-bold">
              {profile.fullName}
            </h1>
            <p className="text-center text-amber-400 text-sm">
              {profile.designation}
            </p>
            <p className="text-center text-neutral-400 text-sm mt-3">
              {profile.bio}
            </p>

            <div className="flex flex-col sm:flex-row justify-center mt-6 gap-3">
              <button
                onClick={() => setIsExchangeOpen(true)}
                className="px-8 py-3 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 font-medium active:scale-95 transition"
              >
                Exchange Contact
              </button>
              <button
                onClick={() => navigate(`/auth?ref=${profile?.referalCode}`)}
                className="px-8 py-3 rounded-full border border-neutral-700 bg-neutral-800 font-medium active:scale-95 transition"
              >
                Let’s get started
              </button>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-3 mt-8">
            {actions.map((a, i) => (
              <ActionItemMobile key={i} {...a} />
            ))}
          </div>
        </div>

        {/* Desktop View */}
        <div className="hidden lg:block">
          <div className="bg-neutral-900 rounded-3xl overflow-hidden border border-neutral-800">
            <div className="relative h-64">
              <img
                src={profile.banner || "/placeholder.svg"}
                alt="Banner"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-neutral-900/95" />
              <div className="absolute -bottom-20 left-12">
                <div className="w-44 h-44 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 p-1 shadow-2xl">
                  <img
                    src={profile.profilePic || "/placeholder.svg"}
                    className="w-full h-full rounded-full object-cover bg-neutral-900"
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col xl:flex-row gap-14 px-12 pb-12 pt-24">
              <div className="w-72 shrink-0">
                <h1 className="text-3xl font-bold">{profile.fullName}</h1>
                <p className="text-amber-400 text-lg mt-1">
                  {profile.designation}
                </p>
                <p className="text-neutral-400 mt-4 text-base">{profile.bio}</p>
                <div className="mt-8 flex flex-col gap-3">
                  <button
                    onClick={() => setIsExchangeOpen(true)}
                    className="w-full py-4 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 font-medium hover:opacity-90 transition"
                  >
                    Exchange Contact
                  </button>
                  <button
                    onClick={() =>
                      navigate(`/auth?ref=${profile?.referalCode}`)
                    }
                    className="w-full py-4 rounded-full border border-amber-500/40 text-amber-400 hover:bg-amber-500/10 transition"
                  >
                    Let’s get started
                  </button>
                </div>
              </div>

              <div className="flex-1 space-y-12">
                <div>
                  <h3 className="text-sm uppercase tracking-widest text-neutral-400 mb-6">
                    Quick Actions
                  </h3>
                  <div className="grid grid-cols-4 gap-4">
                    {actions.map((a, i) => (
                      <ActionItemDesktop key={i} {...a} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ----------- THE NEW SHARE INFO MODAL (WITH SCANNER) ----------- */}
      <ShareInfoModal
        open={isExchangeOpen}
        onClose={() => setIsExchangeOpen(false)}
        formData={formData}
        setFormData={setFormData}
        onSubmit={handleFinalSubmit}
        loading={loading}
        isDark={true} // Matches the dark premium theme
      />

      {/* ----------- AUTO WELCOME MODAL ----------- */}
      <Dialog open={isAutoModalOpen} onOpenChange={setIsAutoModalOpen}>
        <DialogContent
          className="
    bg-neutral-900 text-white border-neutral-800 rounded-xl
     w-[400px]
  "
        >
          <DialogHeader className="space-y-1">
            <DialogTitle className="text-center text-xl font-semibold">
              Welcome
            </DialogTitle>
            <p className="text-center text-sm text-neutral-400 leading-relaxed">
              If you wish, you may share your name and number.
              <br />
              This is optional and up to you.
            </p>
          </DialogHeader>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleFinalSubmit({
                fullName: autoForm.fullName,
                phone: autoForm.phone,
              });
            }}
            className="space-y-3 mt-3"
          >
            {/* Name */}
            <div className="relative">
              <User className="absolute left-3 top-2.5 h-4 w-4 text-neutral-500" />
              <Input
                placeholder="Your name"
                value={autoForm.fullName}
                onChange={(e) =>
                  setAutoForm({ ...autoForm, fullName: e.target.value })
                }
                className="
            bg-neutral-800 border-neutral-700 pl-9
            focus:border-amber-500 focus:ring-amber-500
          "
              />
            </div>

            {/* Phone */}
            <CustomPhoneInput
              value={autoForm.phone}
              onChange={(val) => setAutoForm({ ...autoForm, phone: val })}
              placeholder="Phone number"
            />

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1 bg-neutral-800 border-neutral-700 text-neutral-300 hover:bg-neutral-700"
                onClick={() => setIsAutoModalOpen(false)}
              >
                Skip
              </Button>

              <Button
                type="submit"
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 text-black font-medium"
              >
                {loading ? (
                  <Loader2 className="animate-spin h-4 w-4" />
                ) : (
                  "Send"
                )}
              </Button>
            </div>
          </form>

          {/* Privacy Note */}
          <p className="mt-4 text-center text-[11px] text-neutral-500 leading-snug">
            We respect your privacy. You are free to continue without sharing.
          </p>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* --- SMALL HELPER COMPONENTS --- */
function ActionItemMobile({ icon: Icon, label, href, onClick }) {
  const Wrapper = href ? "a" : "button";
  return (
    <Wrapper
      href={href}
      onClick={onClick}
      target="_blank"
      className="flex flex-col items-center gap-2"
    >
      <div className="w-14 h-14 rounded-full bg-neutral-800 flex items-center justify-center text-amber-400">
        <Icon className="w-5 h-5" />
      </div>
      <span className="text-xs text-neutral-400">{label.split(" ")[0]}</span>
    </Wrapper>
  );
}

function ActionItemDesktop({ icon: Icon, label, href, onClick }) {
  const Wrapper = href ? "a" : "button";
  return (
    <Wrapper
      href={href}
      onClick={onClick}
      target="_blank"
      className="flex flex-col items-center justify-center p-5 rounded-2xl bg-neutral-800/60 hover:bg-neutral-800 transition border border-neutral-800"
    >
      <div className="w-14 h-14 rounded-full bg-neutral-700 flex items-center justify-center text-amber-400">
        <Icon className="w-6 h-6" />
      </div>
      <span className="text-sm text-neutral-300 mt-2">{label}</span>
    </Wrapper>
  );
}
