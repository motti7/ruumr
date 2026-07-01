import React from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { Sparkles, ThumbsUp, CalendarDays, ArrowRight } from "lucide-react";
import { isRtlLanguage } from "@/lib/languageDirection";

const STEPS = [
  { icon: ThumbsUp, key: "apartment_intro_step1" },
  { icon: Sparkles, key: "apartment_intro_step2" },
  { icon: CalendarDays, key: "apartment_intro_step3" },
];

/**
 * One-time "here's what happens next" modal shown when the team first reaches
 * the apartment-ranking stage. Keeps the ranking screen itself clean by moving
 * the how-it-works explanation here.
 */
export default function ApartmentIntroModal({ onClose }) {
  const { t, i18n } = useTranslation();
  const textAlign = isRtlLanguage(i18n) ? "text-right" : "text-left";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[150] flex items-center justify-center bg-black/60 backdrop-blur-sm p-5"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <motion.div
        initial={{ scale: 0.9, y: 20, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 210, damping: 22 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm overflow-hidden rounded-3xl bg-white shadow-2xl"
      >
        <div className="gradient-orange px-6 pt-7 pb-6 text-center text-white">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20">
            <Sparkles className="h-7 w-7" />
          </div>
          <h2 className="text-2xl font-extrabold leading-tight">{t("apartment_intro_title")}</h2>
          <p className="mt-1.5 text-sm text-white/85">{t("apartment_intro_subtitle")}</p>
        </div>

        <div className="space-y-2.5 p-5">
          {STEPS.map((step, index) => {
            const Icon = step.icon;
            return (
              <div key={step.key} className={`flex items-center gap-3 rounded-2xl bg-orange-50/70 p-3 ${textAlign}`}>
                <div className="relative flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-white text-[--theme-orange] shadow-sm">
                  <Icon className="h-5 w-5" />
                  <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-[--theme-orange] text-[10px] font-black text-white">
                    {index + 1}
                  </span>
                </div>
                <p className="text-sm font-bold leading-5 text-gray-800">{t(step.key)}</p>
              </div>
            );
          })}

          <button
            type="button"
            onClick={onClose}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl gradient-orange py-3.5 font-extrabold text-white shadow-md active:scale-[0.98] transition-transform"
          >
            {t("apartment_intro_cta")}
            <ArrowRight className="h-5 w-5 rtl:rotate-180" />
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
