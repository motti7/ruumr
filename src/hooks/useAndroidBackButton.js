import { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';

// Root screens that should exit the app (or go to home) on back press
const ROOT_PATHS = ['/', '/Discover', '/Matches', '/RuumrPlus', '/LikesYou', '/GroupTracker'];

/**
 * Native Android back handler bridge
 * Communicates with native WebView/PWA via window.AndroidBridge or postMessage
 */
class AndroidBackBridge {
  static isNativeAndroid() {
    return typeof window !== 'undefined' && (
      (Capacitor.isNativePlatform?.() && Capacitor.getPlatform?.() === 'android') ||
      window.AndroidBridge !== undefined ||
      window.webkit?.messageHandlers?.androidBack !== undefined
    );
  }

  static onBackPress() {
    if (Capacitor.isNativePlatform?.()) {
      App.exitApp?.();
      return;
    }
    if (window.AndroidBridge?.onBackPress) {
      window.AndroidBridge.onBackPress();
    } else if (window.webkit?.messageHandlers?.androidBack) {
      window.webkit.messageHandlers.androidBack.postMessage({});
    } else if (window.parent && window.parent !== window) {
      // Fallback: postMessage to parent frame (e.g., Capacitor)
      window.parent.postMessage({ type: 'androidBackPress' }, '*');
    }
  }

  static registerBackHandler(callback) {
    if (window.AndroidBridge) {
      window.AndroidBridge.registerBackHandler = callback;
    }
  }
}

/**
 * Handles Android hardware back button via popstate event with native Android integration.
 * - Communicates with native Android via AndroidBridge
 * - On root screens: calls native back handler (minimizes app / exits WebView)
 * - On other screens: navigates back in history
 * - Accepts optional `onBack` override (e.g. to close a modal first)
 * - Guards against state drift by tracking call order and preventing double-handling
 */
export default function useAndroidBackButton(onBack = null) {
  const navigate = useNavigate();
  const location = useLocation();
  const isHandlingRef = useRef(false);
  const lastPathRef = useRef(null);
  const isNativeAndroidRef = useRef(AndroidBackBridge.isNativeAndroid());

  useEffect(() => {
    // Push a state so we can intercept the back press
    window.history.pushState({ androidBackSentinel: true, ts: Date.now() }, '');
    lastPathRef.current = location.pathname;

    const handlePopState = (e) => {
      // Prevent re-entrant calls (state drift protection)
      if (isHandlingRef.current) return;
      isHandlingRef.current = true;

      try {
        if (onBack) {
          // Let the caller handle it (e.g. close modal)
          window.history.pushState({ androidBackSentinel: true, ts: Date.now() }, '');
          onBack();
          return;
        }

        const isRoot = ROOT_PATHS.includes(location.pathname);

        if (isRoot) {
          // On root screen — call native handler (minimizes app / exits WebView)
          if (isNativeAndroidRef.current) {
            AndroidBackBridge.onBackPress();
          }
          // For non-native environments, natural history.back() is sufficient
        } else {
          // Verify path state consistency before navigating
          if (lastPathRef.current === location.pathname) {
            // Re-push sentinel state so next back press is also intercepted
            window.history.pushState({ androidBackSentinel: true, ts: Date.now() }, '');
            navigate(-1);
            lastPathRef.current = location.pathname; // will update on next location change
          }
        }
      } finally {
        isHandlingRef.current = false;
      }
    };

    window.addEventListener('popstate', handlePopState);

    let nativeBackListener = null;
    if (Capacitor.isNativePlatform?.() && Capacitor.getPlatform?.() === 'android') {
      App.addListener('backButton', handlePopState)
        .then((listener) => {
          nativeBackListener = listener;
        })
        .catch(() => {});
    }

    return () => {
      window.removeEventListener('popstate', handlePopState);
      nativeBackListener?.remove?.();
    };
  }, [location.pathname, navigate, onBack]);
}
