import React from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";

// The three team portraits (orange-bg headshots) provided by the builder.
const PORTRAITS = [
  "https://media.base44.com/images/public/68c919adff6ac6fafb51bed6/3f38e5ea9_WhatsAppImage2026-04-21at1515231.jpeg",
  "https://media.base44.com/images/public/68c919adff6ac6fafb51bed6/acc7c4062_WhatsAppImage2026-04-21at151523.jpeg",
  "https://media.base44.com/images/public/68c919adff6ac6fafb51bed6/48ee6ea72_WhatsAppImage2026-04-22at185231.jpeg",
];

export default function StoryHero() {
  const { t } = useTranslation();
  return (
    <section className="relative overflow-hidden rounded-[28px] gradient-orange text-white shadow-xl px-6 pt-9 pb-9">
      <motion.div
        className="absolute -top-16 -end-12 w-48 h-48 bg-white/10 rounded-full blur-md"
        animate={{ scale: [1, 1.18, 1], opacity: [0.4, 0.65, 0.4] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        aria-hidden="true"
      />
      <motion.div
        className="absolute -bottom-20 -start-14 w-44 h-44 bg-white/10 rounded-full blur-md"
        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.55, 0.3] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        aria-hidden="true"
      />

      {/* Team portraits — overlapping cluster on the brand orange; text sits below, never overlapping */}
      <div className="relative flex items-center justify-center mb-7">
        {PORTRAITS.map((src, i) => (
          <motion.img
            key={i}
            src={src}
            alt=""
            className="w-28 h-28 rounded-full object-cover border-4 border-white shadow-lg first:ms-0 -ms-6"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.45, delay: 0.15 + i * 0.12, ease: "easeOut" }}
          />
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4, ease: "easeOut" }}
        className="relative text-center"
      >
        <span className="inline-block text-[11px] font-bold tracking-wider uppercase bg-white/20 rounded-full px-3 py-1 mb-3">
          {t("our_story_badge")}
        </span>
        <p className="logo-font text-3xl leading-none mb-3 opacity-95">ruumr</p>
        <h1 className="text-[26px] font-extrabold leading-tight mb-2">{t("our_story_hero_title")}</h1>
        <p className="text-white/90 text-[15px] leading-relaxed max-w-xs mx-auto">{t("our_story_hero_tagline")}</p>
      </motion.div>
    </section>
  );
}