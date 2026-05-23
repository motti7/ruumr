import { App as CapacitorApp } from '@capacitor/app';
import { Browser } from '@capacitor/browser';
import { Capacitor } from '@capacitor/core';
import { appParams } from '@/lib/app-params';
import { captureAuthCallbackHints, persistAuthCallbackHints } from '@/lib/authCallbackHints';

export const NATIVE_AUTH_CALLBACK_URL = 'com.ruumr.app.android://auth/callback';

const nativeAuthScheme = 'com.ruumr.app.android:';
const nativeAuthHost = 'auth';
const nativeAuthPath = '/callback';

export function isNativeAuthAvailable() {
  return typeof window !== 'undefined' && Capacitor.isNativePlatform();
}

export function isNativeAuthCallbackUrl(rawUrl) {
  try {
    const url = new URL(rawUrl);
    return (
      url.protocol === nativeAuthScheme &&
      url.hostname === nativeAuthHost &&
      url.pathname === nativeAuthPath
    );
  } catch (_) {
    return false;
  }
}

export function buildNativeProviderLoginUrl(provider, callbackUrl = NATIVE_AUTH_CALLBACK_URL) {
  const providerPath = provider === 'google' ? '' : `/${provider}`;
  // Always use the Base44 app base URL for the auth endpoint so OAuth redirects work correctly.
  // The from_url must be the native deep-link so the OS reopens the app after login.
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