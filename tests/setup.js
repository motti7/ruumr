import '@testing-library/jest-dom';

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
