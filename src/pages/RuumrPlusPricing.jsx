import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { User } from "@/entities/User";
import { createPageUrl } from "@/utils";
import { isPlusEntitled, RUUMR_PLUS_PRICE_ILS } from "@/lib/ruumrPlusEntitlement";
import { base44 } from "@/api/base44Client";
import { trackMixpanel } from "@/lib/mixpanelTracking";
import { Sparkles, MessageCircle, SlidersHorizontal, ShieldCheck, Check } from "lucide-react";

const benefits = [
  { icon: Sparkles, title: "התאמות חכמות", description: "דירוג התאמות לפי שגרה, דירה, תקציב והרגלים משותפים." },
  { icon: MessageCircle, title: "שיחות מוקדמות", description: "פתיחת הודעות עם ההתאמות הכי טובות שלך." },
  { icon: SlidersHorizontal, title: "סינון לפי הרגלים", description: "התאמה לפי סדר יום, ניקיון, אורחים ורעש." },
  { icon: ShieldCheck, title: "פרופיל מדויק", description: "פרופיל מאומת לחישוב התאמות אמין יותר." },
];

function trackPlusEvent(eventName, mixpanelName, properties = {}) {
  try {
    const result = base44.analytics?.track?.({ eventName, properties });
    if (result && typeof result.then === "function") {
      result.catch(() => {});
    }
  } catch (_) {
    // best-effort
  }
  trackMixpanel(mixpanelName, properties);
}

export default function RuumrPlusPricingPage() {
  const navigate = useNavigate();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const user = await User.me();
        if (cancelled) return;
        // Already subscribed users skip the paywall.
        if (isPlusEntitled(user)) {
          navigate(createPageUrl("RuumrPlus"), { replace: true });
          return;
        }
      } catch (_) {
        // If we cannot resolve the user, still show the paywall.
      }
      if (!cancelled) {
        setChecked(true);
        trackPlusEvent("plus_paywall_viewed", "Plus Paywall Viewed", { price_ils: RUUMR_PLUS_PRICE_ILS });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  const handleSubscribe = () => {
    trackPlusEvent("plus_subscribe_clicked", "Plus Subscribe Clicked", { price_ils: RUUMR_PLUS_PRICE_ILS });
    navigate(createPageUrl("RuumrPlusCheckout"));
  };

  if (!checked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white" dir="rtl">
        <svg className="w-6 h-6 animate-spin text-[--theme-orange]" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
        </svg>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen pb-40 sm:pb-24 bg-[radial-gradient(circle_at_top_right,_rgba(250,56,3,0.16),_transparent_36%),linear-gradient(180deg,_#fff8f4_0%,_#ffffff_40%,_#f8fafc_100%)]"
      dir="rtl"
    >
      <div className="px-4 pt-6 space-y-5 max-w-md mx-auto">
        <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#FA3803] via-[#ff6a2a] to-[#ffb45c] px-5 py-7 text-white shadow-2xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-bold uppercase tracking-[0.22em]">
            <Sparkles className="w-4 h-4" />
            Ruumr Plus
          </div>
          <h1 className="mt-4 text-3xl font-black leading-tight">שדרג/י לחוויית Plus</h1>
          <p className="mt-3 text-sm leading-6 text-white/90">
            התאמות חכמות יותר, שיחות מוקדמות, וסינון לפי הרגלי מגורים.
          </p>
          <div className="mt-5 flex items-baseline justify-center gap-1">
            <span className="text-5xl font-black">{RUUMR_PLUS_PRICE_ILS} ₪</span>
            <span className="text-base font-medium text-white/85">/ לחודש</span>
          </div>
        </div>

        <div className="rounded-3xl border border-orange-100 bg-white p-5 shadow-sm space-y-4">
          {benefits.map((benefit) => {
            const Icon = benefit.icon;
            return (
              <div key={benefit.title} className="flex items-start gap-3">
                <div className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-orange-50 text-[--theme-orange]">
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-black text-gray-900 flex items-center gap-1">
                    <Check className="w-4 h-4 text-emerald-500" />
                    {benefit.title}
                  </h2>
                  <p className="mt-0.5 text-sm leading-5 text-gray-600">{benefit.description}</p>
                </div>
              </div>
            );
          })}
        </div>

        <Button
          type="button"
          onClick={handleSubscribe}
          className="w-full h-12 rounded-full bg-[--theme-orange] text-white font-bold shadow-lg hover:brightness-110"
        >
          הירשם/י עכשיו · {RUUMR_PLUS_PRICE_ILS} ₪ לחודש
        </Button>

        <p className="text-center text-xs text-gray-500">
          ניתן לבטל בכל עת. החיוב מתחדש מדי חודש.
        </p>

        <div className="text-center">
          <Link to={createPageUrl("Discover")} className="text-sm font-bold text-gray-500 hover:text-gray-700">
            אולי מאוחר יותר
          </Link>
        </div>
      </div>
    </div>
  );
}
