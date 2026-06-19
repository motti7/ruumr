import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { captureAuthCallbackHints, persistAuthCallbackHints } from '@/lib/authCallbackHints';

const IOS_AUTH_SCHEME = 'com.ruumr.app';
const ANDROID_AUTH_SCHEME = 'com.ruumr.app.android';

// This page is the OAuth landing target (`from_url=https://app.ruumrapp.com/auth/callback`).
// During NATIVE login it loads inside the system browser (SFSafariViewController),
// NOT the Capacitor webview — so `Capacitor.isNativePlatform()` is false here and
// cannot be used. We detect the native target by user agent and bridge the token
// into the app via its registered custom scheme (a redirect Base44 never sees, so
// it bypasses the "Domain is not valid" check). On web/PWA we complete in-page.
function nativeSchemeFromUserAgent() {
  if (typeof navigator === 'undefined') {
    return null;
  }
  const ua = navigator.userAgent || '';
  if (/iPad|iPhone|iPod/.test(ua)) {
    return IOS_AUTH_SCHEME;
  }
  if (/Android/.test(ua)) {
    return ANDROID_AUTH_SCHEME;
  }
  return null;
}

export default function AuthCallback() {
  const [handoffStalled, setHandoffStalled] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    // app-params.js (loaded via base44Client) reads `access_token` with
    // removeFromUrl=true and stashes it in localStorage BEFORE this effect runs,
    // so the query string is usually already cleared by now. Recover the token
    // from storage so the native bridge still receives it.
    let token = params.get('access_token');
    if (!token) {
      try {
        token =
          window.localStorage.getItem('base44_access_token') ||
          window.localStorage.getItem('token') ||
          '';
      } catch (_) {
        // localStorage unavailable; token stays empty
      }
    }

    if (!token) {
      window.location.replace('/login');
      return;
    }

    const nativeScheme = nativeSchemeFromUserAgent();
    if (nativeScheme) {
      // Ensure the token is on the bridge URL even if app-params already stripped it.
      if (!params.get('access_token')) {
        params.set('access_token', token);
      }
      const bridgeUrl = `${nativeScheme}://auth/callback?${params.toString()}`;
      window.location.replace(bridgeUrl);
      // If the app doesn't intercept the scheme (not installed / handoff blocked),
      // surface a fallback instead of leaving the user on a blank page.
      const timer = window.setTimeout(() => setHandoffStalled(true), 2500);
      return () => window.clearTimeout(timer);
    }

    // Web / PWA: establish the session directly in this page.
    persistAuthCallbackHints(captureAuthCallbackHints(params));
    base44.auth.setToken(token);
    window.location.replace('/');
  }, []);

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center gap-4 px-6 text-center">
      {handoffStalled ? (
        <p className="max-w-xs text-sm font-semibold text-slate-700 dark:text-slate-200">
          Finishing sign-in… if Ruumr didn’t reopen automatically, switch back to the app.
        </p>
      ) : (
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
      )}
    </div>
  );
}
