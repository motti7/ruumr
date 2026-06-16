import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Sparkles, Clock } from "lucide-react";

export default function RuumrPlusComingSoon() {
  return (
    <div
      className="min-h-[100dvh] flex flex-col items-center justify-center bg-[radial-gradient(circle_at_top_right,_rgba(250,56,3,0.10),_transparent_36%),linear-gradient(180deg,_#fff8f4_0%,_#ffffff_40%,_#f8fafc_100%)]"
      dir="rtl"
      style={{ paddingBottom: 'var(--app-safe-area-bottom, env(safe-area-inset-bottom, 0px))' }}
    >
      <div className="px-6 max-w-sm mx-auto text-center space-y-6">
        {/* Icon */}
        <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-[--theme-orange] via-red-500 to-[--theme-orange] shadow-xl">
          <Sparkles className="w-11 h-11 text-white" />
        </div>

        {/* Title */}
        <h1 className="text-3xl font-black text-gray-900 leading-tight">
          Ruumr Plus<br />בדרך אליך
        </h1>

        {/* Description */}
        <p className="text-base leading-relaxed text-gray-600">
          אנחנו עובדים על פיצ'ר חכם שיעזור לך למצוא את השותפים הכי מתאימים —
          התאמות מבוססות הרגלים, שיחות מוקדמות, וסינון מדויק.
        </p>

        {/* Timeline */}
        <div className="inline-flex items-center gap-2 rounded-full bg-orange-50 px-4 py-2 text-sm font-bold text-[--theme-orange]">
          <Clock className="w-4 h-4" />
          יגיע ממש בקרוב
        </div>

        {/* Back link */}
        <div className="pt-4">
          <Link
            to={createPageUrl("Discover")}
            className="text-sm font-bold text-gray-500 hover:text-gray-700 transition-colors"
          >
            חזרה לדפדוף
          </Link>
        </div>
      </div>
    </div>
  );
}