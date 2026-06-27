import '@testing-library/jest-dom';
// Initialize the shared i18next instance so components using useTranslation()
// render in tests. Force Hebrew (the app default) for deterministic output —
// jsdom reports navigator.language as en-US, which would otherwise auto-detect
// English and break the existing RTL/Hebrew assertions.
import i18n from '@/i18n';
i18n.changeLanguage('he');

const createMemoryStorage = () => {
  const store = {};

  return {
    getItem: (key) => (Object.prototype.hasOwnProperty.call(store, key) ? store[key] : null),
    setItem: (key, value) => {
      store[key] = String(value);
    },
    removeItem: (key) => {
      delete store[key];
    },
    clear: () => {
      Object.keys(store).forEach((key) => {
        delete store[key];
      });
    },
    key: (index) => Object.keys(store)[index] ?? null,
    get length() {
      return Object.keys(store).length;
    },
  };
};

if (typeof window !== 'undefined') {
  const existingStorage = window.localStorage;
  const missingStorageMethods =
    !existingStorage ||
    typeof existingStorage.getItem !== 'function' ||
    typeof existingStorage.setItem !== 'function' ||
    typeof existingStorage.removeItem !== 'function' ||
    typeof existingStorage.clear !== 'function';

  if (missingStorageMethods) {
    Object.defineProperty(window, 'localStorage', {
      value: createMemoryStorage(),
      configurable: true,
    });
  }
}
