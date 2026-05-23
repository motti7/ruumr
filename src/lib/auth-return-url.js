import { Capacitor } from '@capacitor/core';
import { NATIVE_AUTH_CALLBACK_URL } from '@/lib/nativeAuth';

export function getSafeAuthReturnUrl(fallbackPath = '/') {
  if (typeof window === 'undefined') {
    return fallbackPath;
  }

  // On native platforms, always return the deep-link callback URL so the OS
  // reopens the app (instead of redirecting to a localhost/file:// URL).
  if (Capacitor.isNativePlatform()) {
    return NATIVE_AUTH_CALLBACK_URL;
  }

  try {
    const url = new URL(window.location.href);
    url.searchParams.delete('from_url');

    if (url.pathname.toLowerCase() === '/login') {
      url.pathname = fallbackPath;
      url.search = '';
      url.hash = '';
    }

    return url.toString();
  } catch {
    return fallbackPath;
  }
}