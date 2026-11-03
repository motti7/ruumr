import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import { resolveRegion, REGIONS } from './lib/userRegion';
import roomsHe from './locales/he/rooms.json';
import roomsEn from './locales/en/rooms.json';
import he from './locales/he/translation.json';
import en from './locales/en/translation.json';

// Single source of truth for the app's i18n. Imported once (at the top of
// src/main.jsx, before any component renders) so the configured instance is
// ready before the first render.
export const SUPPORTED_LANGUAGES = ['he', 'en'];
export const LANGUAGE_STORAGE_KEY = 'ruumr_lang';

// Which language a first-time visitor starts in:
// 1. an explicit choice saved from the language toggle always wins;
// 2. a supported browser language (Hebrew or English);
// 3. anything else (a Spanish/French/Arabic browser, i.e. a language we do not
//    ship) resolves by market: Israel → Hebrew, everywhere else → English.
// This is what makes the app open in English for a visitor outside Israel.
function resolveInitialLanguage() {
  try {
    const stored = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (SUPPORTED_LANGUAGES.includes(stored)) return stored;
  } catch {
    // Storage unavailable; keep resolving below.
  }

  const browserLang = String(
    (typeof navigator !== 'undefined' && navigator.language) || ''
  ).toLowerCase().split('-')[0];

  if (browserLang === 'he' || browserLang === 'iw') return 'he';
  if (browserLang === 'en') return 'en';

  return resolveRegion() === REGIONS.ISRAEL ? 'he' : 'en';
}

i18n
  .use(initReactI18next)
  .init({
    resources: {
      he: { translation: he, rooms: roomsHe },
      en: { translation: en, rooms: roomsEn },
    },
    lng: resolveInitialLanguage(),
    fallbackLng: 'en',
    supportedLngs: SUPPORTED_LANGUAGES,
    load: 'languageOnly',
    interpolation: {
      // React already escapes values, so i18next does not need to.
      escapeValue: false,
    },
    returnNull: false,
  });

// Apply language + direction before the first render so a visitor starting in
// English never sees an RTL flash from the Hebrew <html> defaults.
try {
  document.documentElement.dir = i18n.language === 'he' ? 'rtl' : 'ltr';
  document.documentElement.lang = i18n.language;
} catch {
  // No DOM (native bootstrap); direction is set by App.jsx.
}

// Remember the language the user picks from the header toggle.
i18n.on('languageChanged', (lng) => {
  try {
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, lng);
  } catch {
    // Best-effort only.
  }
});

export default i18n;