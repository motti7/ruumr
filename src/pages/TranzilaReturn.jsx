import React, { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Loader2 } from "lucide-react";

// Tranzila's success/fail redirect happens *inside* the payment iframe. This
// page's only job is to break out of that iframe (window.top) and send the
// full browser tab to the right in-app page.
export default function TranzilaReturnPage() {
  const { t, i18n } = useTranslation();

  useEffect(() => {
    const status = new URLSearchParams(window.location.search).get("status");
    const target = status === "success"
      ? "/RuumrPlusThankYou"
      : "/RuumrPlusPricing?paymentFailed=1";

    if (window.top) {
      window.top.location.href = target;
    } else {
      window.location.href = target;
    }
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white" dir={i18n.dir()}>
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-[--theme-orange]" />
        <span className="text-sm font-semibold text-gray-500">{t("loading")}</span>
      </div>
    </div>
  );
}