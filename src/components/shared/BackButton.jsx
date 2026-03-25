import React from "react";
import { useLocation } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import useTabHistory from "@/hooks/useTabHistory";

// Pages that are "root" tabs — no back button shown
const ROOT_PATHS = ["/Discover", "/Matches", "/LikesYou", "/GroupTracker", "/"];

export default function BackButton({ className = "" }) {
  const location = useLocation();
  const { goBack } = useTabHistory();

  const isRoot = ROOT_PATHS.includes(location.pathname);
  if (isRoot) return null;

  return (
    <button
      onClick={goBack}
      aria-label="חזור"
      className={`flex items-center justify-center min-w-[44px] min-h-[44px] rounded-full select-none touch-manipulation active:scale-90 transition-transform ${className}`}
    >
      <ChevronRight className="w-6 h-6 text-gray-700" />
    </button>
  );
}