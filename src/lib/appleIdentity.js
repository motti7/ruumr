import {
  APPLE_IDENTITY_CACHE_KEY,
  LAST_AUTH_PROVIDER_KEY,
  LAST_USED_AUTH_METHOD_KEY,
} from '@/lib/clientSessionCleanup';

const safeJsonParse = (value, fallbackValue) => {
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === 'object' ? parsed : fallbackValue;
  } catch (_) {
    return fallbackValue;
  }
};

const safeTrim = (value) => String(value ?? '').trim();

const APPLE_NAME_PLACEHOLDERS = new Set([
  'ruumr user',
  'apple account name',
  'שם מחשבון apple',
]);

const isRealAppleName = (value) => {
  const cleaned = safeTrim(value);
  if (!cleaned) {
    return false;
  }

  return !APPLE_NAME_PLACEHOLDERS.has(cleaned.toLowerCase());
};

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

const getStoredLastUsedAuthMethod = () => {
  if (typeof window === 'undefined') {
    return '';
  }

  try {
    return safeTrim(window.localStorage.getItem(LAST_USED_AUTH_METHOD_KEY)).toLowerCase();
  } catch (_) {
    return '';
  }
};

const extractAppleName = (source, depth = 0) => {
  if (!source || typeof source !== 'object') {
    return '';
  }

  if (depth > 2) {
    return '';
  }

  const nestedSources = [
    source.profile,
    source.user_profile,
    source.user_metadata,
    source.raw_user_meta_data,
    source.metadata,
    source.user,
  ];

  for (const nestedSource of nestedSources) {
    const nestedName = extractAppleName(nestedSource, depth + 1);
    if (nestedName) {
      return nestedName;
    }
  }

  const structuredName = source.name;
  if (structuredName && typeof structuredName === 'object') {
    const firstName = pickFirstNonEmpty(
      structuredName.firstName,
      structuredName.givenName,
      structuredName.given_name,
      structuredName.first_name,
      structuredName.fullName,
      structuredName.full_name,
      structuredName.displayName,
      structuredName.display_name
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

    const structuredDirect = pickFirstNonEmpty(
      structuredName.full_name,
      structuredName.fullName,
      structuredName.display_name,
      structuredName.displayName
    );
    if (structuredDirect) {
      return structuredDirect;
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
    source.apple_name,
    source.appleName,
    source.profile_name,
    source.profileName,
    typeof source.name === 'string' ? source.name : ''
  );
};

export function isAppleAuthUser(user, cachedIdentity = null, authHints = null) {
  if (!user) return false;

  const provider = String(
    user.auth_provider || user.provider || user.sign_in_provider || user.identity_provider || ''
  ).toLowerCase();
  const hintProvider = String(
    authHints?.provider || authHints?.auth_provider || authHints?.identity_provider || authHints?.auth_method || ''
  ).toLowerCase();
  const storedAuthMethod = getStoredLastUsedAuthMethod();
  const email = safeTrim(user.email).toLowerCase();
  const cachedFullName = isRealAppleName(cachedIdentity?.fullName) ? safeTrim(cachedIdentity.fullName) : '';
  const currentFullName = safeTrim(user.full_name);

  return (
    provider.includes('apple') ||
    hintProvider.includes('apple') ||
    storedAuthMethod.includes('apple') ||
    email.includes('privaterelay.appleid.com') ||
    Boolean(cachedFullName && !currentFullName)
  );
}

export function getCachedAppleIdentity(userId) {
  if (!userId || typeof window === 'undefined') return null;

  const cache = safeJsonParse(window.localStorage.getItem(APPLE_IDENTITY_CACHE_KEY), {});
  return cache[String(userId)] || null;
}

export function persistAppleIdentity(userId, identity) {
  if (!userId || typeof window === 'undefined') return;

  const cache = safeJsonParse(window.localStorage.getItem(APPLE_IDENTITY_CACHE_KEY), {});
  const fullName = isRealAppleName(identity?.fullName) ? safeTrim(identity.fullName) : '';

  if (!fullName) {
    delete cache[String(userId)];

    if (Object.keys(cache).length > 0) {
      window.localStorage.setItem(APPLE_IDENTITY_CACHE_KEY, JSON.stringify(cache));
    } else {
      window.localStorage.removeItem(APPLE_IDENTITY_CACHE_KEY);
    }

    window.localStorage.removeItem(LAST_AUTH_PROVIDER_KEY);
    return;
  }

  cache[String(userId)] = {
    fullName,
    email: safeTrim(identity?.email),
  };
  window.localStorage.setItem(APPLE_IDENTITY_CACHE_KEY, JSON.stringify(cache));
  window.localStorage.setItem(LAST_AUTH_PROVIDER_KEY, 'apple');
}

/**
 * @param {{
 *   authUser?: any,
 *   userData?: any,
 *   authHints?: any,
 *   cachedIdentity?: any,
 *   fallbackName?: string,
 * }} [params]
 */
export function resolveAppleDisplayName({ authUser, userData, authHints, cachedIdentity, fallbackName = 'Ruumr user' } = {}) {
  const cachedFullName = isRealAppleName(cachedIdentity?.fullName) ? safeTrim(cachedIdentity.fullName) : '';
  const fullName = pickFirstNonEmpty(
    extractAppleName(authHints),
    extractAppleName(authUser),
    extractAppleName(userData),
    cachedFullName,
  );
  const firstName = getFirstWord(fullName);
  const displayName = fullName || fallbackName;

  return {
    fullName,
    firstName,
    displayName,
  };
}

/**
 * @param {{
 *   authUser?: any,
 *   userData?: any,
 *   authHints?: any,
 *   cachedIdentity?: any,
 *   fallbackName?: string,
 * }} [params]
 */
export function resolveAppleIdentitySnapshot({
  authUser,
  userData,
  authHints,
  cachedIdentity,
  fallbackName = '',
} = {}) {
  const primaryUser = userData || authUser;
  const appleAuthUser = Boolean(
    isAppleAuthUser(primaryUser, cachedIdentity, authHints) ||
    (authUser && authUser !== primaryUser && isAppleAuthUser(authUser, cachedIdentity, authHints))
  );
  const appleIdentity = resolveAppleDisplayName({
    authUser,
    userData,
    authHints,
    cachedIdentity,
    fallbackName,
  });
  const fullName = safeTrim(appleIdentity.fullName);
  const displayName = safeTrim(appleIdentity.displayName);
  const email = pickFirstNonEmpty(userData?.email, authUser?.email, cachedIdentity?.email);
  const firstName = appleIdentity.firstName || getFirstWord(fullName);

  return {
    authUser,
    userData,
    cachedIdentity,
    appleAuthUser,
    appleIdentity,
    fullName,
    displayName,
    email,
    firstName,
  };
}

export async function syncAppleDisplayNameToBase44(authModule, user, appleIdentity = null, cachedIdentity = null, authHints = null) {
  if (!authModule?.updateMe || !isAppleAuthUser(user, cachedIdentity, authHints)) {
    return user;
  }

  const resolvedAppleIdentity = appleIdentity || resolveAppleDisplayName({
    authUser: user,
    authHints,
    cachedIdentity: getCachedAppleIdentity(user?.id),
    fallbackName: '',
  });
  const fullName = safeTrim(resolvedAppleIdentity.fullName);
  const currentFullName = safeTrim(user?.full_name);

  if (!fullName || fullName === currentFullName) {
    return user;
  }

  try {
    return await authModule.updateMe({ full_name: fullName });
  } catch (error) {
    console.error('Failed to persist Apple full name to Base44:', error);
    return user;
  }
}

/**
 * @param {{
 *   authModule?: any,
 *   user?: any,
 *   authUser?: any,
 *   authHints?: any,
 *   cachedIdentity?: any,
 *   fallbackName?: string,
 *   onPersistError?: (error: any) => void,
 * }} [params]
 */
export async function resolveAndSyncAppleIdentity({
  authModule,
  user,
  authUser,
  authHints,
  cachedIdentity,
  fallbackName = '',
  onPersistError,
} = {}) {
  const resolvedCachedIdentity = cachedIdentity || getCachedAppleIdentity(user?.id || authUser?.id);
  const snapshot = resolveAppleIdentitySnapshot({
    authUser,
    userData: user,
    authHints,
    cachedIdentity: resolvedCachedIdentity,
    fallbackName,
  });

  if (!user || !snapshot.appleAuthUser) {
    return {
      ...snapshot,
      user,
    };
  }

  const syncedUser = await syncAppleDisplayNameToBase44(
    authModule,
    user,
    snapshot.appleIdentity,
    resolvedCachedIdentity,
    authHints
  );
  const nextUser = {
    ...user,
    ...syncedUser,
    full_name: safeTrim(syncedUser?.full_name) || snapshot.fullName || '',
  };
  const nextFullName = safeTrim(nextUser.full_name) || snapshot.fullName || '';
  const nextEmail = pickFirstNonEmpty(nextUser.email, snapshot.email);

  try {
    persistAppleIdentity(nextUser.id || user.id, {
      fullName: nextFullName,
      email: nextEmail,
    });
  } catch (persistError) {
    if (onPersistError) {
      onPersistError(persistError);
    }
  }

  const nextIdentity = {
    ...snapshot.appleIdentity,
    fullName: nextFullName,
    firstName: getFirstWord(nextFullName),
    displayName: nextFullName || snapshot.displayName,
  };

  return {
    ...snapshot,
    user: nextUser,
    userData: nextUser,
    appleIdentity: nextIdentity,
    fullName: nextFullName,
    displayName: nextIdentity.displayName,
    email: nextEmail,
    firstName: nextIdentity.firstName,
  };
}
