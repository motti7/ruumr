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
        {/* Blue glitter ring around Joss (app's secondary blue #1c53d4) */}
        <div className="rounded-full p-[3px] shadow-xl" style={{ background: "conic-gradient(from 0deg, #1c53d4, #4f7ff0, #1c53d4, #1334a8, #1c53d4)" }}>
          <div className="rounded-full bg-white p-[2px]">
            <motion.div
              animate={{ rotate: [-2, 2, -2] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="h-36 w-36 overflow-hidden rounded-full sm:h-40 sm:w-40"
            >
              <img
                src={MASCOT_URL}
                alt="Joss the Ruumr mascot"
                className="h-full w-full object-cover"
                loading="eager"
              />
            </motion.div>
          </div>
        </div>
        {/* Blue glitter sparkles around the mascot */}
        {[
          { pos: "absolute -right-1 top-2", size: 10, delay: 0.3 },
          { pos: "absolute -left-2 bottom-3", size: 8, delay: 1 },
          { pos: "absolute right-3 -bottom-1", size: 6, delay: 1.6 },
          { pos: "absolute -top-1 left-6", size: 7, delay: 0.8 },
        ].map((sp, i) => (
          <motion.span
            key={i}
            className={`${sp.pos} block rounded-full`}
            style={{ width: sp.size, height: sp.size, backgroundColor: "#4f7ff0", boxShadow: "0 0 6px 1px rgba(79,127,240,0.8)" }}
            animate={{ opacity: [0, 1, 0], scale: [0.4, 1.1, 0.4] }}
            transition={{ duration: 2, repeat: Infinity, delay: sp.delay }}
          />
        ))}
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