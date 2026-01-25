"use client";

import { ScanLine } from "lucide-react";

function ScanFloatingButton({ onClick, disabled }) {
  if (disabled) return null;

  return (
    <button
      onClick={onClick}
      aria-label="Scan Business Card"
      className="
        fixed bottom-6 right-6 z-40
        flex items-center gap-2
        bg-gray-900 text-white
        px-4 py-3 rounded-full
        shadow-lg
        hover:bg-gray-800
        transition-all
      "
    >
      <ScanLine size={20} />
      <span className=" sm:inline text-sm font-medium">Scan Card</span>
    </button>
  );
}

export default ScanFloatingButton;
