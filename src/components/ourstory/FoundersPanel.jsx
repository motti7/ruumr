import React from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import Reveal from "./Reveal";

const PORTRAITS = [
  "https://media.base44.com/images/public/68c919adff6ac6fafb51bed6/3f38e5ea9_WhatsAppImage2026-04-21at1515231.jpeg",
  "https://media.base44.com/images/public/68c919adff6ac6fafb51bed6/acc7c4062_WhatsAppImage2026-04-21at151523.jpeg",
  "https://media.base44.com/images/public/68c919adff6ac6fafb51bed6/48ee6ea72_WhatsAppImage2026-04-22at185231.jpeg",
];

export default function FoundersPanel() {
  const { t } = useTranslation();
  return (
    <Reveal y={20}>
      <section className="relative overflow-hidden rounded-[28px] bg-[--theme-blue] text-white shadow-xl px-6 pt-8 pb-8">
        {/* decorative orange circles */}
        <motion.div
          className="absolute -top-16 -end-12 w-48 h-48 rounded-full bg-[--theme-orange] opacity-20 blur-md"
          animate={{ scale: [1, 1.18, 1], opacity: [0.2, 0.35, 0.2] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          aria-hidden="true"
        />
        <motion.div
          className="absolute -bottom-20 -start-14 w-44 h-44 rounded-full bg-[--theme-orange] opacity-15 blur-md"
          animate={{ scale: [1, 1.2, 1], opacity: [0.15, 0.28, 0.15] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          aria-hidden="true"
        />

        <div className="relative">
          {/* three founder portraits — orange ring on the blue panel */}
          <div className="flex items-center justify-center mb-5">
            {PORTRAITS.map((src, i) => (
              <motion.img
                key={i}
                src={src}
                alt=""
                className="w-24 h-24 rounded-full object-cover border-4 border-[--theme-orange] shadow-lg first:ms-0 -ms-5"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.45, delay: 0.15 + i * 0.12, ease: "easeOut" }}
              />
            ))}
          </div>

          <div className="text-center mb-5">
            <span className="inline-block text-[11px] font-bold tracking-wider uppercase bg-white/20 rounded-full px-3 py-1 mb-2">
              {t("our_story_badge")}
            </span>
            <p className="logo-font text-2xl leading-none mb-2 opacity-95">ruumr</p>
            <h1 className="text-[22px] font-extrabold leading-tight mb-1.5">{t("our_story_hero_title")}</h1>
            <p className="text-white/85 text-[14px] leading-relaxed max-w-xs mx-auto">{t("our_story_hero_tagline")}</p>
          </div>

          {/* the story — one flowing narrative, not a problem/solution pitch */}
          <div className="border-t border-white/15 pt-4">
            <span className="inline-block text-[11px] font-bold tracking-wider uppercase bg-white/20 rounded-full px-3 py-1 mb-2">
              {t("our_story_origin_eyebrow")}
            </span>
            <h2 className="text-xl font-extrabold leading-tight mb-3">{t("our_story_origin_title")}</h2>
            <p className="text-white/90 text-[14px] leading-relaxed mb-3">{t("our_story_origin_text")}</p>
            <p className="text-white/85 text-[14px] leading-relaxed">{t("our_story_origin_text_2")}</p>
          </div>
        </div>
      </section>
    </Reveal>
  );
}