import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { User } from "@/entities/User";
import { isPlusEntitled, RUUMR_PLUS_PRICE_ILS } from "@/lib/ruumrPlusEntitlement";
import { Button } from "@/components/ui/button";
import { getSubscriptionStatus } from "@/functions/getSubscriptionStatus";
import { cancelSubscription } from "@/functions/cancelSubscription";
import { Sparkles, CheckCircle2, XCircle, Loader2, ChevronLeft, AlertTriangle } from "lucide-react";

const STATUS_LABELS = {
  ACTIVE: { text: "פעיל", color: "text-emerald-600 bg-emerald-50" },
  CANCELED: { text: "בוטל (פעיל עד סוף החודש)", color: "text-amber-600 bg-amber-50" },
  ENDED: { text: "הסתיים", color: "text-gray-600 bg-gray-100" },
  PAUSED: { text: "מושהה", color: "text-blue-600 bg-blue-50" },
  PENDING: { text: "ממתין לאישור", color: "text-orange-600 bg-orange-50" },
};

export default function ManageSubscriptionPage() {
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
        setError("לא הצלחנו לטעון את פרטי המנוי.");
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
      setError("שגיאה בביטול המנוי. נסה/י שוב או פנה/י לתמיכה.");
    } finally {
      setCanceling(false);
    }
  };

  const wixStatus = subscriptionInfo?.wix_status;
  const statusMeta = STATUS_LABELS[wixStatus] || null;
  const isCanceled = wixStatus === "CANCELED" || wixStatus === "ENDED";

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white" dir="rtl">
        <Loader2 className="w-8 h-8 animate-spin text-[--theme-orange]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-32 bg-gray-50" dir="rtl">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-4 flex items-center gap-3">
        <Link to={createPageUrl("Settings")} className="flex items-center justify-center w-9 h-9 rounded-full hover:bg-gray-100 transition-colors">
          <ChevronLeft className="w-5 h-5 text-gray-500 rotate-180" />
        </Link>
        <h1 className="text-xl font-black text-gray-900">ניהול מנוי Ruumr Plus</h1>
      </div>

      <div className="px-4 pt-5 space-y-4 max-w-md mx-auto">

        {/* Status Card */}
        <div className="bg-white rounded-3xl border border-orange-100 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-br from-[#FA3803] via-[#ff6a2a] to-[#ffb45c] px-5 py-5 text-white">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-5 h-5" />
              <span className="text-sm font-bold uppercase tracking-wide">Ruumr Plus</span>
            </div>
            <p className="text-3xl font-black">{RUUMR_PLUS_PRICE_ILS} ₪ <span className="text-base font-medium text-white/80">/ חודש</span></p>
          </div>

          <div className="px-5 py-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-500">סטטוס מנוי</span>
              {statusMeta ? (
                <span className={`text-sm font-bold px-3 py-1 rounded-full ${statusMeta.color}`}>
                  {statusMeta.text}
                </span>
              ) : (
                <span className="text-sm font-bold px-3 py-1 rounded-full bg-emerald-50 text-emerald-600">פעיל</span>
              )}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-500">חידוש אוטומטי</span>
              <span className={`text-sm font-bold ${isCanceled || cancelDone ? "text-gray-400" : "text-gray-800"}`}>
                {isCanceled || cancelDone ? "כבוי" : "פעיל"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-500">סכום חיוב</span>
              <span className="text-sm font-bold text-gray-800">{RUUMR_PLUS_PRICE_ILS} ₪</span>
            </div>
          </div>
        </div>

        {/* Success message after cancel */}
        {cancelDone && (
          <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl p-4">
            <CheckCircle2 className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-amber-800">החידוש האוטומטי בוטל</p>
              <p className="text-sm text-amber-700 mt-0.5">הגישה שלך ל-Plus תמשיך עד סוף תקופת החיוב הנוכחית.</p>
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
            <h2 className="font-black text-gray-900">ביטול חידוש אוטומטי</h2>
            <p className="text-sm leading-6 text-gray-500">
              ביטול החידוש לא מפסיק את הגישה מיידית — תמשיך/י ליהנות מ-Plus עד סוף תקופת החיוב הנוכחית.
            </p>

            {!showConfirm ? (
              <Button
                type="button"
                onClick={() => setShowConfirm(true)}
                variant="outline"
                className="w-full h-11 rounded-full border-red-200 text-red-500 font-bold hover:bg-red-50"
              >
                ביטול חידוש אוטומטי
              </Button>
            ) : (
              <div className="rounded-2xl bg-red-50 border border-red-200 p-4 space-y-3">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm font-semibold text-red-700">
                    האם לבטל את חידוש המנוי? לא תחויב/י שוב, אך הגישה תסתיים בסוף החודש.
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    onClick={handleCancel}
                    disabled={canceling}
                    className="flex-1 h-10 rounded-full bg-red-500 text-white font-bold hover:bg-red-600"
                  >
                    {canceling ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "כן, בטל חידוש"}
                  </Button>
                  <Button
                    type="button"
                    onClick={() => setShowConfirm(false)}
                    variant="outline"
                    className="flex-1 h-10 rounded-full font-bold"
                  >
                    לא, חזור/י
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
          חזרה ל-Ruumr Plus
        </Link>
      </div>
    </div>
  );
}