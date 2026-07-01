export function normalizeInsightLanguage(language = "he") {
  return String(language || "he").toLowerCase().split("-")[0] === "en" ? "en" : "he";
}

export function containsHebrewText(value) {
  return /[\u0590-\u05FF]/.test(String(value || ""));
}

const KNOWN_ENGLISH_INSIGHT_TRANSLATIONS = {
  "התאמה מצוינת סביב סדר, בית נעים ותקשורת רגועה.": "A strong fit around tidiness, a calm home, and easy communication.",
  "בחירה טובה להשלמת הצוות: תקציב דומה, אזורי חיפוש חופפים והרגלי בית קרובים.": "A strong team addition: similar budget, overlapping search areas, and close home habits.",
  "התאמה אישית טובה, אבל אזורי החיפוש פחות חופפים לצוות תל אביב.": "A good personal fit, though the search areas overlap less with the Tel Aviv team.",
  "התאמה חברתית סבירה, אבל העיר והתקציב פחות מדויקים לתרחיש.": "A reasonable social fit, but the city and budget are less aligned for this setup.",
  "יש כאן התאמה מצוינת לשיחות שקטות, בית מסודר ואיזון טוב בין שגרה לעשייה.": "A strong match for quiet conversations, a tidy home, and a balanced routine.",
  "יש הרבה חפיפה סביב יצירתיות, סדר יום וגישה חברתית מאוזנת.": "There is strong overlap around creativity, daily rhythm, and a balanced social style.",
};

export function resolveRuumrPlusInsight(meta = null, language = "he", fallback = "") {
  const lang = normalizeInsightLanguage(language);
  const insight = meta?.insight;
  const localized = meta?.insight_i18n || meta?.localized_insight || null;
  const stringInsight = typeof insight === "string" ? insight.trim() : "";
  const candidates = [
    localized?.[lang],
    meta?.[`insight_${lang}`],
    insight && typeof insight === "object" ? insight[lang] : null,
    lang === "en" ? KNOWN_ENGLISH_INSIGHT_TRANSLATIONS[stringInsight] : null,
    stringInsight,
    fallback,
  ];

  const value = candidates.find((candidate) => String(candidate || "").trim());
  if (lang === "en" && containsHebrewText(value) && String(fallback || "").trim()) {
    return fallback;
  }

  return String(value || "");
}
