import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { createPageUrl } from "@/utils";
import { RUUMR_PLUS_PRICE_ILS } from "@/lib/ruumrPlusEntitlement";
import { CreditCard, ChevronRight } from "lucide-react";

// Placeholder checkout. The payment provider is not yet chosen (web PSP vs.
// native in-app purchase for the mobile wrapper), so this route stands in for
// the real gateway. Wire the provider here once selected; on a successful
// charge the backend should set `is_ruumr_plus` on the User and grant the
// service-side entitlement, after which isPlusEntitled(user) unlocks the flow.
export default function RuumrPlusCheckoutPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white px-6 text-center" dir="rtl">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-orange-50 text-[--theme-orange]">
        <CreditCard className="w-8 h-8" />
      </div>
      <h1 className="mt-5 text-2xl font-black text-gray-900">התשלום בקרוב</h1>
      <p className="mt-3 max-w-sm text-sm leading-6 text-gray-600">
        מסלול Ruumr Plus בעלות {RUUMR_PLUS_PRICE_ILS} ₪ לחודש. חיבור אמצעי התשלום נמצא בהכנה — נעדכן אותך כשאפשר יהיה להשלים את ההרשמה.
      </p>

      <Button
        type="button"
        disabled
        className="mt-6 h-12 w-full max-w-sm rounded-full bg-[--theme-orange] text-white font-bold opacity-60"
      >
        השלמת תשלום (בקרוב)
      </Button>

      <Link
        to={createPageUrl("Discover")}
        className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-gray-500 hover:text-gray-700"
      >
        חזרה ל-Discover
        <ChevronRight className="w-4 h-4" />
      </Link>
    </div>
  );
}
