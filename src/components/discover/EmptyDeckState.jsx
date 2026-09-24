import React from "react";
import { motion } from "framer-motion";
import { RefreshCw } from "lucide-react";
import { useTranslation } from "react-i18next";

// The Ruumr mascot — a playful orange furry creature. Hosted on the app's
// public Base44 media storage so it loads fast without auth.
const MASCOT_URL =
  "https://media.base44.com/images/public/68c919adff6ac6fafb51bed6/70cd138a2_1767350127370.jpg";

export default function EmptyDeckState({ onRefresh }) {
  const { t } = useTranslation();
  return (
    <motion.div
      key="no-profiles"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="flex h-full flex-col items-center justify-center px-8 text-center"
    >
      {/* Mascot with a friendly idle bob */}
      <motion.div
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
        className="relative mb-5"
      >
        <motion.div
          animate={{ rotate: [-2, 2, -2] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className="h-36 w-36 overflow-hidden rounded-full shadow-xl ring-4 ring-orange-100 sm:h-40 sm:w-40"
        >
          <img
            src={MASCOT_URL}
            alt="Ruumr mascot"
            className="h-full w-full object-cover"
            loading="eager"
          />
        </motion.div>
        {/* Playful floating sparkles around the mascot */}
        <motion.span
          className="absolute -right-1 top-2 text-2xl"
          animate={{ opacity: [0, 1, 0], scale: [0.6, 1, 0.6] }}
          transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
        >
          ✨
        </motion.span>
        <motion.span
          className="absolute -left-2 bottom-3 text-xl"
          animate={{ opacity: [0, 1, 0], scale: [0.6, 1, 0.6] }}
          transition={{ duration: 2, repeat: Infinity, delay: 1 }}
        >
          ✨
        </motion.span>
      </motion.div>

      <motion.h2
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.15, duration: 0.3 }}
        className="mb-2 text-2xl font-extrabold text-gray-800"
      >
        {t("thats_all_for_now")}
      </motion.h2>
      <p className="mb-7 max-w-xs leading-relaxed text-gray-500">
        {t("no_more_profiles_1")}
        <br />
        {t("no_more_profiles_2")}
      </p>

      <motion.button
        onClick={onRefresh}
        whileTap={{ scale: 0.95 }}
        className="gradient-orange inline-flex items-center gap-2 rounded-full px-8 py-3 font-bold text-white shadow-lg transition-transform hover:scale-105"
      >
        <RefreshCw className="h-5 w-5" />
        {t("refresh")}
      </motion.button>
    </motion.div>
  );
}