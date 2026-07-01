export function getLanguageDirection(i18n) {
  const documentLanguage = typeof document !== "undefined" ? document.documentElement?.lang : "";
  const language = String(i18n?.language || i18n?.resolvedLanguage || documentLanguage || "he")
    .toLowerCase()
    .split("-")[0];

  return language === "he" ? "rtl" : "ltr";
}

export function isRtlLanguage(i18n) {
  return getLanguageDirection(i18n) === "rtl";
}
