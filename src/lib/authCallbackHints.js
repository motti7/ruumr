const AUTH_CALLBACK_HINT_STORAGE_KEY = 'ruumr_auth_callback_hints';

const safeTrim = (value) => String(value ?? '').trim();

const normalizeProvider = (value) => safeTrim(value).toLowerCase();

const HINT_KEYS = [
  'provider',
  'auth_provider',
  'identity_provider',
  'full_name',
  'fullName',
  'display_name',
  'displayName',
  'name',
  'first_name',
  'firstName',
  'given_name',
  'givenName',
  'family_name',
  'familyName',
  'last_name',
  'lastName',
  'email',
  'is_new_user',
];

const storageAvailable = () => typeof window !== 'undefined' && Boolean(window.sessionStorage);

export function captureAuthCallbackHints(searchParams) {
  if (!searchParams?.get('access_token')) {
    return null;
  }

  const hints = {};

  for (const key of HINT_KEYS) {
    const rawValue = searchParams.get(key);
    const value = safeTrim(rawValue);
    if (!value) {
      continue;
    }

    if (key === 'provider' || key === 'auth_provider' || key === 'identity_provider') {
      hints[key] = normalizeProvider(value);
      continue;
    }

    if (key === 'is_new_user') {
      hints[key] = ['true', '1', 'yes'].includes(value.toLowerCase()) ? 'true' : 'false';
      continue;
    }

    hints[key] = value;
  }

  return Object.keys(hints).length > 0 ? hints : null;
}

export function getStoredAuthCallbackHints() {
  if (!storageAvailable()) {
    return null;
  }

  try {
    const raw = window.sessionStorage.getItem(AUTH_CALLBACK_HINT_STORAGE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch (_) {
    return null;
  }
}

export function persistAuthCallbackHints(hints) {
  if (!storageAvailable()) {
    return;
  }

  const nextHints = hints && typeof hints === 'object' ? hints : null;
  if (!nextHints || Object.keys(nextHints).length === 0) {
    window.sessionStorage.removeItem(AUTH_CALLBACK_HINT_STORAGE_KEY);
    return;
  }

  try {
    window.sessionStorage.setItem(AUTH_CALLBACK_HINT_STORAGE_KEY, JSON.stringify(nextHints));
  } catch (_) {}
}

export function clearAuthCallbackHints() {
  if (!storageAvailable()) {
    return;
  }

  try {
    window.sessionStorage.removeItem(AUTH_CALLBACK_HINT_STORAGE_KEY);
  } catch (_) {}
}

