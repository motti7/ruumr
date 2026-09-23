import React from "react";
import { useTranslation } from "react-i18next";
import { ExternalLink, Award } from "lucide-react";

// TODO: replace url/placeholders with the real press links and awards.
const ITEMS = [
  { key: "1", labelKey: "our_story_trust_1_label", sourceKey: "our_story_trust_1_source", url: "https://www.geektime.co.il" },
  { key: "2", labelKey: "our_story_trust_2_label", sourceKey: "our_story_trust_2_source", url: "#" },
];

export default function TrustSignals() {
  const { t } = useTranslation();
  return (
    <section>
      <h2 className="text-xl font-extrabold text-gray-900 dark:text-white mb-1">{t("our_story_trust_title")}</h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{t("our_story_trust_subtitle")}</p>
      <div className="grid grid-cols-1 gap-3">
        {ITEMS.map((it) => (
          <a
            key={it.key}
            href={it.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 active:scale-[0.99] transition-transform"
          >
            <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center flex-shrink-0">
              <Award className="w-5 h-5 text-[--theme-orange]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{t(it.labelKey)}</p>
              <p className="text-xs text-gray-400">{t(it.sourceKey)}</p>
            </div>
            <ExternalLink className="w-4 h-4 text-gray-400 flex-shrink-0" />
          </a>
        ))}
      </div>
    </section>
  );
}