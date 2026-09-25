import React from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import SectionHeader from "./SectionHeader";
import { PARTNERS } from "./ourStoryData";

const container = { hidden: {}, show: { transition: { staggerChildren: 0.18 } } };
const cardVar = (i) => ({
  hidden: { opacity: 0, y: 48, scale: 0.9, rotate: i % 2 === 0 ? -3 : 3 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    rotate: 0,
    transition: { type: "spring", stiffness: 130, damping: 14, mass: 0.7 },
  },
});

function renderPartnerTitle(t) {
  const raw = t("our_story_partners_title");
  const idx = raw.indexOf("Ruumr");
  if (idx === -1) return raw;
  return (
    <>
      {raw.slice(0, idx)}
      <span className="text-[--theme-orange]">Ruumr</span>
      {raw.slice(idx + 5)}
    </>
  );
}

export default function Partners() {
  const { t } = useTranslation();
  return (
    <section className="pt-6">
      <SectionHeader title={renderPartnerTitle(t)} subtitle={t("our_story_partners_subtitle")} />
      <motion.div
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.2 }}
        className="grid grid-cols-2 gap-3"
      >
        {PARTNERS.map((p, i) => (
          <motion.div
            key={p.id}
            variants={cardVar(i)}
            whileHover={{ y: -6, transition: { duration: 0.2 } }}
            className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm h-28 flex flex-col items-center justify-center gap-2 px-3"
          >
            {p.logoUrl ? (
              <img src={p.logoUrl} alt={t(p.nameKey)} className="max-h-12 max-w-[72%] object-contain" />
            ) : null}
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 text-center leading-tight">{t(p.nameKey)}</span>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}