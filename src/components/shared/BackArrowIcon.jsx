import React from "react";
import { ArrowRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { isRtlLanguage } from "@/lib/languageDirection";

export default function BackArrowIcon({ className = "" }) {
  const { i18n } = useTranslation();
  const isRtl = isRtlLanguage(i18n);

  return (
    <ArrowRight className={`${className} ${isRtl ? "" : "rotate-180"}`} />
  );
}
