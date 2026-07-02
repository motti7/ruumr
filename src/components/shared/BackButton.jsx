import React from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router-dom";
import useTabHistory from "@/hooks/useTabHistory";
import BackArrowIcon from "@/components/shared/BackArrowIcon";

// Pages that are "root" tabs — no back button shown
const ROOT_PATHS = ["/Discover", "/Matches", "/LikesYou", "/GroupTracker", "/"];

export default function BackButton({ className = "" }) {
  const { t } = useTranslation();
  const location = useLocation();
  const { goBack } = useTabHistory();

  const isRoot = ROOT_PATHS.includes(location.pathname);
  if (isRoot) return null;

  return (
    <button
      onClick={goBack}
      aria-label={t("back")}
      className={`flex items-center justify-center min-w-[44px] min-h-[44px] rounded-full select-none touch-manipulation active:scale-90 transition-transform ${className}`}
    >
      <BackArrowIcon className="w-6 h-6 text-gray-700" />
    </button>
  );
}
