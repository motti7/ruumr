import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ChevronRight } from "lucide-react";

// Pages that are "root" tabs — no back button shown
const ROOT_PATHS = ["/Discover", "/Matches", "/LikesYou", "/GroupTracker", "/"];

export default function BackButton({ className = "" }) {
  const location = useLocation();
  const navigate = useNavigate();

  const isRoot = ROOT_PATHS.includes(location.pathname);
  if (isRoot) return null;

  return (
    <button
      onClick={() => navigate(-1)}
      aria-label="חזור"
      className={`flex items-center justify-center min-w-[44px] min-h-[44px] rounded-full select-none touch-manipulation active:scale-90 transition-transform ${className}`}
    >
      <ChevronRight className="w-6 h-6 text-gray-700" />
    </button>
  );
}