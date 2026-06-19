import { App as CapacitorApp } from '@capacitor/app';
import { Browser } from '@capacitor/browser';
import { Capacitor } from '@capacitor/core';
import { appParams } from '@/lib/app-params';
import { captureAuthCallbackHints, persistAuthCallbackHints } from '@/lib/authCallbackHints';

// Base44 only accepts a real HTTPS domain as the OAuth `from_url`; a custom URL
// scheme is rejected at the callback step with "Domain is not valid". So
// provider login always returns to this valid-domain web route. The /auth/callback
// page then bridges the token into the native app via the platform custom scheme
// below — a redirect Base44 never sees, so it never hits domain validation.
export const WEB_AUTH_CALLBACK_PATH = '/auth/callback';
export const WEB_AUTH_CALLBACK_URL = `https://app.ruumrapp.com${WEB_AUTH_CALLBACK_PATH}`;
const NATIVE_PLATFORM_PARAM = 'native_platform';

const IOS_AUTH_SCHEME = 'com.ruumr.app';
const ANDROID_AUTH_SCHEME = 'com.ruumr.app.android';
const nativeAuthHost = 'auth';
const nativeAuthPath = '/callback';

// The custom scheme the native app registers and listens for. iOS and the
// (future) native Android build use distinct schemes.
export function getNativeAuthScheme() {
  const platform = typeof Capacitor.getPlatform === 'function' ? Capacitor.getPlatform() : '';
  return platform === 'ios' ? IOS_AUTH_SCHEME : ANDROID_AUTH_SCHEME;
}

export function getNativeAuthPlatform() {
  const platform = typeof Capacitor.getPlatform === 'function' ? Capacitor.getPlatform() : '';
  if (platform === 'ios' || platform === 'android') {
    return platform;
  }
  return null;
}

export function getNativeAuthCallbackUrl(scheme = getNativeAuthScheme()) {
  return `${scheme}://${nativeAuthHost}${nativeAuthPath}`;
}

// Back-compat alias resolving to the active platform's custom-scheme callback.
export const NATIVE_AUTH_CALLBACK_URL = getNativeAuthCallbackUrl();

export function isNativeAuthAvailable() {
  return typeof window !== 'undefined' && Capacitor.isNativePlatform();
}

export function getWebAuthCallbackUrl(platform = getNativeAuthPlatform()) {
  const callbackUrl = new URL(WEB_AUTH_CALLBACK_URL);
  if (platform) {
    callbackUrl.searchParams.set(NATIVE_PLATFORM_PARAM, platform);
  }
  return callbackUrl.toString();
}

export function isNativeAuthCallbackUrl(rawUrl) {
  try {
    const url = new URL(rawUrl);
    const scheme = `${getNativeAuthScheme()}:`;
    return (
      url.protocol === scheme &&
      url.hostname === nativeAuthHost &&
      url.pathname === nativeAuthPath
    );
  } catch (_) {
    return false;
  }
}

export function buildNativeProviderLoginUrl(provider, callbackUrl = getWebAuthCallbackUrl()) {
  const providerPath = provider === 'google' ? '' : `/${provider}`;
  // Always use the Base44 app base URL for the auth endpoint so OAuth redirects
  // work correctly. The from_url is the valid-domain web callback so Base44
  // accepts it; the web page then bridges into the app via the custom scheme.
  const loginUrl = new URL(`/api/apps/auth${providerPath}/login`, appParams.appBaseUrl);
  loginUrl.searchParams.set('app_id', appParams.appId);
  loginUrl.searchParams.set('from_url', callbackUrl);
  return loginUrl.toString();
}

export async function openNativeProviderLogin(provider) {
  await Browser.open({
    url: buildNativeProviderLoginUrl(provider),
    toolbarColor: '#E8420A',
    presentationStyle: 'fullscreen',
  });
}

export async function handleNativeAuthCallbackUrl(rawUrl, { onToken } = {}) {
  if (!isNativeAuthCallbackUrl(rawUrl)) {
    return false;
  }

  const url = new URL(rawUrl);
  const accessToken = url.searchParams.get('access_token');
  if (!accessToken) {
    return false;
  }

  persistAuthCallbackHints(captureAuthCallbackHints(url.searchParams));

  try {
    await Browser.close();
  } catch (_) {}

  if (onToken) {
    await onToken(accessToken);
  }

  return true;
}

export function registerNativeAuthCallbackHandler({ onToken } = {}) {
  if (!isNativeAuthAvailable()) {
    return () => undefined;
  }

  let listenerHandle = null;
  let disposed = false;

  const handleUrlOpen = (event) => {
    handleNativeAuthCallbackUrl(event?.url, { onToken }).catch((error) => {
      console.error('[ruumr] native auth callback failed:', error);
    });
  };

  CapacitorApp.addListener('appUrlOpen', handleUrlOpen).then((handle) => {
    if (disposed) {
      handle.remove();
      return;
    }
    listenerHandle = handle;
  });

  CapacitorApp.getLaunchUrl().then((launchUrl) => {
    if (!disposed && launchUrl?.url) {
      handleUrlOpen({ url: launchUrl.url });
    }
  }).catch(() => {});

  return () => {
    disposed = true;
    listenerHandle?.remove();
  };
}
