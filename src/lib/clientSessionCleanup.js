export const APPLE_IDENTITY_CACHE_KEY = 'ruumr_apple_identity_by_user_id';
export const LAST_AUTH_PROVIDER_KEY = 'ruumr_last_auth_provider';
export const LAST_USED_AUTH_METHOD_KEY = 'lastUsedAuthMethod';

export const clearClientUserData = async () => {
  try {
    if (typeof window === 'undefined') return;

    try {
      window.sessionStorage?.clear();
    } catch (_) {}

    try {
      window.localStorage?.clear();
    } catch (_) {}

    try {
      if ('caches' in window) {
        const cacheKeys = await window.caches.keys();
        await Promise.all(cacheKeys.map((key) => window.caches.delete(key)));
      }
    } catch (_) {}
  } catch (_) {}
};
