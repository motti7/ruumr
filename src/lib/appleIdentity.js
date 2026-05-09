import { APPLE_IDENTITY_CACHE_KEY, LAST_AUTH_PROVIDER_KEY } from '@/lib/clientSessionCleanup';

const safeJsonParse = (value, fallbackValue) => {
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === 'object' ? parsed : fallbackValue;
  } catch (_) {
    return fallbackValue;
  }
};

const safeTrim = (value) => String(value ?? '').trim();

const getFirstWord = (value) => {
  const cleaned = safeTrim(value);
  if (!cleaned) {
    return '';
  }

  return cleaned.split(/\s+/).filter(Boolean)[0] || '';
};

const pickFirstNonEmpty = (...values) => {
  for (const value of values) {
    const cleaned = safeTrim(value);
    if (cleaned) {
      return cleaned;
    }
  }

  return '';
};

const extractAppleName = (source) => {
  if (!source || typeof source !== 'object') {
    return '';
  }

  const structuredName = source.name;
  if (structuredName && typeof structuredName === 'object') {
    const firstName = pickFirstNonEmpty(
      structuredName.firstName,
      structuredName.givenName,
      structuredName.given_name,
      structuredName.first_name
    );
    const lastName = pickFirstNonEmpty(
      structuredName.lastName,
      structuredName.familyName,
      structuredName.family_name,
      structuredName.last_name
    );
    const combined = [firstName, lastName].filter(Boolean).join(' ').trim();
    if (combined) {
      return combined;
    }
  }

  const directCombined = [pickFirstNonEmpty(
    source.given_name,
    source.givenName,
    source.first_name,
    source.firstName
  ), pickFirstNonEmpty(
    source.family_name,
    source.familyName,
    source.last_name,
    source.lastName
  )].filter(Boolean).join(' ').trim();

  if (directCombined) {
    return directCombined;
  }

  return pickFirstNonEmpty(
    source.full_name,
    source.fullName,
    source.display_name,
    source.displayName,
    typeof source.name === 'string' ? source.name : ''
  );
};

export function isAppleAuthUser(user) {
  if (!user) return false;

  const provider = String(
    user.auth_provider || user.provider || user.sign_in_provider || user.identity_provider || ''
  ).toLowerCase();
  const email = safeTrim(user.email).toLowerCase();
  const lastAuthProvider =
    typeof window !== 'undefined' ? window.localStorage.getItem(LAST_AUTH_PROVIDER_KEY) : null;

  return provider.includes('apple') || email.includes('privaterelay.appleid.com') || lastAuthProvider === 'apple';
}

export function getCachedAppleIdentity(userId) {
  if (!userId || typeof window === 'undefined') return null;

  const cache = safeJsonParse(window.localStorage.getItem(APPLE_IDENTITY_CACHE_KEY), {});
  return cache[String(userId)] || null;
}

export function persistAppleIdentity(userId, identity) {
  if (!userId || typeof window === 'undefined') return;

  const cache = safeJsonParse(window.localStorage.getItem(APPLE_IDENTITY_CACHE_KEY), {});
  const previous = cache[String(userId)] || {};
  cache[String(userId)] = {
    fullName: identity?.fullName || previous.fullName || '',
    email: identity?.email || previous.email || '',
  };
  window.localStorage.setItem(APPLE_IDENTITY_CACHE_KEY, JSON.stringify(cache));
  window.localStorage.setItem(LAST_AUTH_PROVIDER_KEY, 'apple');
}

export function resolveAppleDisplayName({ authUser, userData, cachedIdentity, fallbackName = 'Ruumr user' } = {}) {
  const fullName = pickFirstNonEmpty(
    extractAppleName(authUser),
    extractAppleName(userData),
    cachedIdentity?.fullName
  );
  const firstName = getFirstWord(fullName);
  const cachedFirstName = getFirstWord(cachedIdentity?.fullName);
  const displayName = fullName || firstName || cachedFirstName || fallbackName;

  return {
    fullName,
    firstName,
    displayName,
  };
}
