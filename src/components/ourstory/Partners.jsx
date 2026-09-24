import React from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import SectionHeader from "./SectionHeader";
import { PARTNERS } from "./ourStoryData";

const container = { hidden: {}, show: { transition: { staggerChildren: 0.1 } } };
const cardVar = {
  hidden: { opacity: 0, scale: 0.9 },
  show: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
};

export default function Partners() {
  const { t } = useTranslation();
  return (
    <section>
      <SectionHeader title={t("our_story_partners_title")} subtitle={t("our_story_partners_subtitle")} />
      <motion.div
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.15 }}
        className="grid grid-cols-2 gap-3"
      >
        {PARTNERS.map((p) => (
          <motion.div
            key={p.id}
            variants={cardVar}
            className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm h-20 flex flex-col items-center justify-center gap-1 px-2 text-center"
          >
            {p.logoUrl ? (
              <img src={p.logoUrl} alt={t(p.nameKey)} className="max-h-10 max-w-[80%] object-contain opacity-80" />
            ) : (
              <>
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                  {p.type === "tv" ? t("our_story_partner_type_tv") : t("our_story_partner_type_accelerator")}
                </span>
                <span className="text-sm font-extrabold text-gray-700 dark:text-gray-200 leading-tight">{t(p.nameKey)}</span>
              </>
            )}
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}