import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import he from './locales/he/translation.json';
import en from './locales/en/translation.json';

// Single source of truth for the app's i18n. Imported once (at the top of
// src/main.jsx, before any component renders) so the configured instance is
// ready before the first render. Hebrew is the default/fallback language so
// existing behavior is unchanged for users who have never picked a language.
export const SUPPORTED_LANGUAGES = ['he', 'en'];
export const LANGUAGE_STORAGE_KEY = 'ruumr_lang';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      he: { translation: he },
      en: { translation: en },
    },
    fallbackLng: 'he',
    supportedLngs: SUPPORTED_LANGUAGES,
    // Normalize browser language for clean matching: 'en-GB' / 'en-US' resolve
    // to 'en' so UK visitors land in the English version on first connection.
    load: 'languageOnly',
    // Persist and restore the user's choice from localStorage under our own key
    // so it does not collide with any other i18next consumers.
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      lookupLocalStorage: LANGUAGE_STORAGE_KEY,
      caches: ['localStorage'],
    },
    interpolation: {
      // React already escapes values, so i18next does not need to.
      escapeValue: false,
    },
    returnNull: false,
  });

export default i18n;