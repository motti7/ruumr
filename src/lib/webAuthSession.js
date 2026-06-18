import { Capacitor, registerPlugin } from '@capacitor/core';
import {
  buildNativeProviderLoginUrl,
  getNativeAuthScheme,
  handleNativeAuthCallbackUrl,
} from '@/lib/nativeAuth';

// Native ASWebAuthenticationSession plugin (iOS). Opens provider login in a secure
// system session and returns the custom-scheme callback URL (with access_token)
// directly — no "Open in Ruumr?" prompt.
const WebAuth = registerPlugin('WebAuth', {
  web: () => ({
    signIn: async () => {
      throw new Error('WebAuth (ASWebAuthenticationSession) is only available on native iOS.');
    },
  }),
});

export function isWebAuthSessionAvailable() {
  return (
    typeof window !== 'undefined' &&
    Capacitor.isNativePlatform() &&
    Capacitor.getPlatform() === 'ios' &&
    Capacitor.isPluginAvailable('WebAuth')
  );
}

/**
 * Runs the iOS ASWebAuthenticationSession sign-in for a provider and routes the
 * returned token through `onToken`. Returns `{ canceled: true }` if the user
 * dismissed the session (so callers can stay silent instead of showing an error).
 */
export async function signInWithWebAuthSession(provider, { onToken } = {}) {
  const url = buildNativeProviderLoginUrl(provider);
  const callbackScheme = getNativeAuthScheme(); // e.g. 'com.ruumr.app'

  let result;
  try {
    result = await WebAuth.signIn({ url, callbackScheme });
  } catch (error) {
    if (error?.code === 'CANCELED' || /cancel/i.test(error?.message || '')) {
      return { canceled: true, handled: false };
    }
    throw error;
  }

  const callbackUrl = result?.url;
  if (!callbackUrl) {
    throw new Error('Sign in did not return a callback URL.');
  }

  const handled = await handleNativeAuthCallbackUrl(callbackUrl, { onToken });
  return { canceled: false, handled };
}
