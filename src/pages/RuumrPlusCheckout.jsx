import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { createPageUrl } from "@/utils";
import { RUUMR_PLUS_PRICE_ILS } from "@/lib/ruumrPlusEntitlement";
import { CreditCard, ChevronRight, Loader2 } from "lucide-react";
import { createCheckout } from "@/functions/createCheckout";

export default function RuumrPlusCheckoutPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleCheckout = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await createCheckout({});
      const { redirectUrl } = res.data;
      if (redirectUrl) {
        window.location.href = redirectUrl;
      } else {
        setError("לא הצלחנו ליצור את דף התשלום. נסה/י שוב.");
      }
    } catch (e) {
      console.error("Checkout error:", e);
      setError("אירעה שגיאה. נסה/י שוב.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white px-6 text-center" dir="rtl">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-orange-50 text-[--theme-orange]">
        <CreditCard className="w-8 h-8" />
      </div>
      <h1 className="mt-5 text-2xl font-black text-gray-900">השלמת הרשמה ל-Plus</h1>
      <p className="mt-3 max-w-sm text-sm leading-6 text-gray-600">
        מסלול Ruumr Plus בעלות {RUUMR_PLUS_PRICE_ILS} ₪ לחודש. לחץ/י להמשך לדף התשלום המאובטח.
      </p>

      {error && (
        <p className="mt-3 text-sm text-red-500">{error}</p>
      )}

      <Button
        type="button"
        onClick={handleCheckout}
        disabled={loading}
        className="mt-6 h-12 w-full max-w-sm rounded-full bg-[--theme-orange] text-white font-bold shadow-lg hover:brightness-110 disabled:opacity-60"
      >
        {loading ? (
          <span className="flex items-center gap-2 justify-center">
            <Loader2 className="w-4 h-4 animate-spin" />
            מכין את דף התשלום...
          </span>
        ) : (
          `המשך לתשלום · ${RUUMR_PLUS_PRICE_ILS} ₪ לחודש`
        )}
      </Button>

      <p className="mt-2 text-xs text-gray-400">תשלום מאובטח באמצעות Wix Payments</p>

      <Link
        to={createPageUrl("RuumrPlusPricing")}
        className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-gray-500 hover:text-gray-700"
      >
        חזרה
        <ChevronRight className="w-4 h-4" />
      </Link>
    </div>
  );
}