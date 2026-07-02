import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { User } from "@/entities/User";
import { isPlusEntitled, RUUMR_PLUS_PRICE_ILS } from "@/lib/ruumrPlusEntitlement";
import { Button } from "@/components/ui/button";
import { getSubscriptionStatus } from "@/functions/getSubscriptionStatus";
import { cancelSubscription } from "@/functions/cancelSubscription";
import { Sparkles, CheckCircle2, XCircle, Loader2, AlertTriangle } from "lucide-react";
import BackArrowIcon from "@/components/shared/BackArrowIcon";

const STATUS_LABELS = {
  ACTIVE: { textKey: "sub_status_active", color: "text-emerald-600 bg-emerald-50" },
  CANCELED: { textKey: "sub_status_canceled", color: "text-amber-600 bg-amber-50" },
  ENDED: { textKey: "sub_status_ended", color: "text-gray-600 bg-gray-100" },
  PAUSED: { textKey: "sub_status_paused", color: "text-blue-600 bg-blue-50" },
  PENDING: { textKey: "sub_status_pending", color: "text-orange-600 bg-orange-50" },
};

export default function ManageSubscriptionPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [subscriptionInfo, setSubscriptionInfo] = useState(null);
  const [canceling, setCanceling] = useState(false);
  const [cancelDone, setCancelDone] = useState(false);
  const [error, setError] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const user = await User.me();
        if (!isPlusEntitled(user)) {
          navigate(createPageUrl("RuumrPlusPricing"), { replace: true });
          return;
        }
        const res = await getSubscriptionStatus({});
        setSubscriptionInfo(res.data);
      } catch (e) {
        setError(t("sub_load_error"));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [navigate]);

  const handleCancel = async () => {
    setCanceling(true);
    setError(null);
    try {
      await cancelSubscription({});
      setCancelDone(true);
      setShowConfirm(false);
    } catch (e) {
      setError(t("sub_cancel_error"));
    } finally {
      setCanceling(false);
    }
  };

  const wixStatus = subscriptionInfo?.wix_status;
  const statusMeta = STATUS_LABELS[wixStatus] || null;
  const isCanceled = wixStatus === "CANCELED" || wixStatus === "ENDED";

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white" dir={i18n.dir()}>
        <Loader2 className="w-8 h-8 animate-spin text-[--theme-orange]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-32 bg-gray-50" dir={i18n.dir()}>
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-4 flex items-center gap-3">
        <Link to={createPageUrl("Settings")} className="flex items-center justify-center w-9 h-9 rounded-full hover:bg-gray-100 transition-colors">
          <BackArrowIcon className="w-5 h-5 text-gray-500" />
        </Link>
        <h1 className="text-xl font-black text-gray-900">{t("manage_subscription_title")}</h1>
      </div>

      <div className="px-4 pt-5 space-y-4 max-w-md mx-auto">

        {/* Status Card */}
        <div className="bg-white rounded-3xl border border-orange-100 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-br from-[#FA3803] via-[#ff6a2a] to-[#ffb45c] px-5 py-5 text-white">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-5 h-5" />
              <span className="text-sm font-bold uppercase tracking-wide">Ruumr Plus</span>
            </div>
            <p className="text-3xl font-black">{RUUMR_PLUS_PRICE_ILS} ₪ <span className="text-base font-medium text-white/80">{t("per_month_suffix")}</span></p>
          </div>

          <div className="px-5 py-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-500">{t("subscription_status")}</span>
              {statusMeta ? (
                <span className={`text-sm font-bold px-3 py-1 rounded-full ${statusMeta.color}`}>
                  {t(statusMeta.textKey)}
                </span>
              ) : (
                <span className="text-sm font-bold px-3 py-1 rounded-full bg-emerald-50 text-emerald-600">{t("sub_status_active")}</span>
              )}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-500">{t("auto_renewal")}</span>
              <span className={`text-sm font-bold ${isCanceled || cancelDone ? "text-gray-400" : "text-gray-800"}`}>
                {isCanceled || cancelDone ? t("off") : t("on")}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-500">{t("charge_amount")}</span>
              <span className="text-sm font-bold text-gray-800">{RUUMR_PLUS_PRICE_ILS} ₪</span>
            </div>
          </div>
        </div>

        {/* Success message after cancel */}
        {cancelDone && (
          <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl p-4">
            <CheckCircle2 className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-amber-800">{t("auto_renew_canceled")}</p>
              <p className="text-sm text-amber-700 mt-0.5">{t("access_until_period_end")}</p>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-2xl p-4">
            <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Cancel CTA */}
        {!isCanceled && !cancelDone && (
          <div className="bg-white rounded-3xl border border-gray-200 p-5 space-y-3">
            <h2 className="font-black text-gray-900">{t("cancel_auto_renewal")}</h2>
            <p className="text-sm leading-6 text-gray-500">
              {t("cancel_renewal_explainer")}
            </p>

            {!showConfirm ? (
              <Button
                type="button"
                onClick={() => setShowConfirm(true)}
                variant="outline"
                className="w-full h-11 rounded-full border-red-200 text-red-500 font-bold hover:bg-red-50"
              >
                {t("cancel_auto_renewal")}
              </Button>
            ) : (
              <div className="rounded-2xl bg-red-50 border border-red-200 p-4 space-y-3">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm font-semibold text-red-700">
                    {t("confirm_cancel_renewal")}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    onClick={handleCancel}
                    disabled={canceling}
                    className="flex-1 h-10 rounded-full bg-red-500 text-white font-bold hover:bg-red-600"
                  >
                    {canceling ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : t("yes_cancel_renewal")}
                  </Button>
                  <Button
                    type="button"
                    onClick={() => setShowConfirm(false)}
                    variant="outline"
                    className="flex-1 h-10 rounded-full font-bold"
                  >
                    {t("no_go_back")}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Back to Plus */}
        <Link
          to={createPageUrl("RuumrPlus")}
          className="flex items-center justify-center gap-2 text-sm font-bold text-[--theme-orange] py-2"
        >
          <Sparkles className="w-4 h-4" />
          {t("back_to_plus")}
        </Link>
      </div>
    </div>
  );
}
