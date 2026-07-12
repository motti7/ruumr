import React, { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { createPageUrl } from "@/utils";
import { RUUMR_PLUS_PRICE_ILS, RUUMR_PLUS_DURATION_MONTHS } from "@/lib/ruumrPlusEntitlement";
import { CreditCard, ChevronRight, Loader2 } from "lucide-react";
import { createCheckout } from "@/functions/createCheckout";

export default function RuumrPlusCheckoutPage() {
  const { t, i18n } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [checkoutParams, setCheckoutParams] = useState(null);
  const formRef = useRef(null);

  const handleCheckout = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await createCheckout({});
      const params = res.data;
      if (!params?.terminalName) {
        setError(t("checkout_create_error"));
        return;
      }
      setCheckoutParams(params);
      // Submit the hidden form into the named iframe once it's rendered
      setTimeout(() => formRef.current?.submit(), 0);
    } catch (e) {
      console.error("Checkout error:", e);
      setError(t("generic_error_retry"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white px-6 py-8 text-center" dir={i18n.dir()}>
      {!checkoutParams ? (
        <>
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-orange-50 text-[--theme-orange]">
            <CreditCard className="w-8 h-8" />
          </div>
          <h1 className="mt-5 text-2xl font-black text-gray-900">{t("complete_plus_signup")}</h1>
          <p className="mt-3 max-w-sm text-sm leading-6 text-gray-600">
            {t("plus_plan_desc_3mo", { price: RUUMR_PLUS_PRICE_ILS, count: RUUMR_PLUS_DURATION_MONTHS })}
          </p>

          <label className="mt-5 flex items-start gap-3 max-w-sm text-start cursor-pointer select-none">
            <input
              type="checkbox"
              checked={termsAccepted}
              onChange={e => setTermsAccepted(e.target.checked)}
              className="mt-0.5 h-5 w-5 shrink-0 accent-[--theme-orange] cursor-pointer"
            />
            <span className="text-sm text-gray-600 leading-5">
              {t("i_accept_terms_pre")}{" "}
              <Link to={createPageUrl("Terms")} className="font-bold text-[--theme-orange] underline" target="_blank" rel="noopener noreferrer">
                {t("terms_of_service_link")}
              </Link>
              {" "}{t("i_accept_terms_post")}
            </span>
          </label>

          {error && (
            <p className="mt-3 text-sm text-red-500">{error}</p>
          )}

          <Button
            type="button"
            onClick={handleCheckout}
            disabled={loading || !termsAccepted}
            className="mt-6 h-12 w-full max-w-sm rounded-full bg-[--theme-orange] text-white font-bold shadow-lg hover:brightness-110 disabled:opacity-60"
          >
            {loading ? (
              <span className="flex items-center gap-2 justify-center">
                <Loader2 className="w-4 h-4 animate-spin" />
                {t("preparing_payment")}
              </span>
            ) : (
              t("continue_to_payment_3mo", { price: RUUMR_PLUS_PRICE_ILS, count: RUUMR_PLUS_DURATION_MONTHS })
            )}
          </Button>

          <p className="mt-2 text-xs text-gray-400">{t("secure_payment_tranzila")}</p>

          <Link
            to={createPageUrl("RuumrPlusPricing")}
            className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-gray-500 hover:text-gray-700"
          >
            {t("back")}
            <ChevronRight className="w-4 h-4" />
          </Link>
        </>
      ) : (
        <div className="w-full max-w-sm">
          <h1 className="text-xl font-black text-gray-900 mb-4">{t("complete_plus_signup")}</h1>

          {/* Hidden form auto-submitted into the named iframe below, per Tranzila's IFRAME integration */}
          <form
            ref={formRef}
            action={`https://directng.tranzila.com/${checkoutParams.terminalName}/iframenew.php`}
            method="POST"
            target="tranzila-iframe"
          >
            <input type="hidden" name="sum" value={checkoutParams.sum} />
            <input type="hidden" name="currency" value={checkoutParams.currency} />
            <input type="hidden" name="cred_type" value={checkoutParams.cred_type} />
            <input type="hidden" name="tranmode" value={checkoutParams.tranmode} />
            <input type="hidden" name="contact" value={checkoutParams.contact} />
            <input type="hidden" name="company" value={checkoutParams.company} />
            <input type="hidden" name="email" value={checkoutParams.email} />
            <input type="hidden" name="country" value={checkoutParams.country} />
            <input type="hidden" name="city" value={checkoutParams.city} />
            <input type="hidden" name="address" value={checkoutParams.address} />
            <input type="hidden" name="zip" value={checkoutParams.zip} />
            <input type="hidden" name="pdesc" value={checkoutParams.pdesc} />
            <input type="hidden" name="lang" value={checkoutParams.lang} />
            <input type="hidden" name="success_url_address" value={checkoutParams.success_url_address} />
            <input type="hidden" name="fail_url_address" value={checkoutParams.fail_url_address} />
            <input type="hidden" name="notify_url_address" value={checkoutParams.notify_url_address} />
          </form>

          <iframe
            name="tranzila-iframe"
            title="Tranzila Payment"
            className="w-full rounded-2xl border border-gray-200"
            style={{ height: "600px" }}
          />

          <p className="mt-2 text-xs text-gray-400">{t("secure_payment_tranzila")}</p>
        </div>
      )}
    </div>
  );
}