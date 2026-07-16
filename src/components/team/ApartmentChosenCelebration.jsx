import React, { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import confetti from "canvas-confetti";
import { ArrowRight, Home, Sparkles } from "lucide-react";

const CONFETTI_COLORS = ["#16A34A", "#22C55E", "#FA3803", "#FFC93C", "#ffffff"];

function apartmentImage(apartment) {
  const galleryImage = Array.isArray(apartment?.images) ? apartment.images.find(Boolean) : "";
  return apartment?.image || galleryImage || "";
}

/**
 * Full-screen celebration shown once the team chooses its apartment.
 * Mirrors the team-complete moment, then hands off to apartment services.
 */
export default function ApartmentChosenCelebration({ apartment = null, onContinue }) {
  const { t, i18n } = useTranslation();
  const image = apartmentImage(apartment);
  const title =
    i18n.language === "he"
      ? apartment?.title_he || apartment?.title
      : apartment?.title_en || apartment?.title;

  useEffect(() => {
    const colors = CONFETTI_COLORS;
    confetti({ particleCount: 180, spread: 105, startVelocity: 42, origin: { y: 0.34 }, colors, scalar: 1.08 });
    const end = Date.now() + 2200;
    const frame = () => {
      confetti({ particleCount: 5, angle: 60, spread: 72, origin: { x: 0, y: 0.72 }, colors });
      confetti({ particleCount: 5, angle: 120, spread: 72, origin: { x: 1, y: 0.72 }, colors });
      if (Date.now() < end) requestAnimationFrame(frame);
    };
    const id = requestAnimationFrame(frame);
    const pop = setTimeout(() => {
      confetti({ particleCount: 120, spread: 88, startVelocity: 36, origin: { y: 0.42 }, colors });
    }, 700);
    return () => {
      cancelAnimationFrame(id);
      clearTimeout(pop);
    };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex flex-col items-center justify-center overflow-hidden px-8 text-center bg-gradient-to-b from-[#06150b] via-[#0d2b16] to-[#090b09]"
      role="dialog"
      aria-modal="true"
    >
      {image && (
        <motion.div
          initial={{ scale: 0.86, opacity: 0, y: 18 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 140, damping: 16, delay: 0.12 }}
          className="mb-6 h-32 w-32 overflow-hidden rounded-[2rem] border-4 border-white/90 shadow-2xl sm:h-40 sm:w-40"
        >
          <img src={image} alt="" className="h-full w-full object-cover" />
        </motion.div>
      )}

      {!image && (
        <motion.div
          initial={{ scale: 0, rotate: -24 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 12, delay: 0.1 }}
          className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-green-600 shadow-2xl"
        >
          <Home className="h-10 w-10 text-white" />
        </motion.div>
      )}

      <motion.div
        initial={{ y: -18, opacity: 0, scale: 0.92 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 140, damping: 14, delay: 0.25 }}
        className="flex items-center justify-center gap-2 text-green-200"
      >
        <Sparkles className="h-5 w-5" />
        <span className="text-sm font-black uppercase">{t("apartment_chosen_kicker")}</span>
        <Sparkles className="h-5 w-5" />
      </motion.div>

      <motion.h1
        initial={{ y: -20, opacity: 0, scale: 0.9 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 140, damping: 14, delay: 0.34 }}
        className="mt-3 max-w-md text-4xl font-black leading-tight text-white drop-shadow-lg sm:text-5xl"
      >
        {t("apartment_chosen_celebration_title")}
      </motion.h1>

      {title && (
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.82 }}
          className="mt-6 max-w-sm text-lg leading-7 text-white/85"
        >
          {title}
        </motion.p>
      )}

      <motion.p
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.98 }}
        className="mt-3 max-w-sm text-sm font-bold leading-6 text-white/65"
      >
        {t("apartment_chosen_celebration_subtitle")}
      </motion.p>

      <motion.button
        type="button"
        onClick={onContinue}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.18 }}
        whileTap={{ scale: 0.97 }}
        className="mt-9 inline-flex items-center gap-2 rounded-full bg-green-600 px-8 py-4 text-lg font-extrabold text-white shadow-2xl shadow-green-950/50"
      >
        {t("apartment_chosen_celebration_cta")}
        <ArrowRight className="h-5 w-5 rtl:rotate-180" />
      </motion.button>
    </motion.div>
  );
}
