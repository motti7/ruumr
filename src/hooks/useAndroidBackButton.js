import { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

// Root screens that should exit the app (or go to home) on back press
const ROOT_PATHS = ['/', '/Discover', '/Matches', '/RuumrPlus', '/LikesYou', '/GroupTracker'];

/**
 * Native Android back handler bridge
 * Communicates with native WebView/PWA via window.AndroidBridge or postMessage
 */
class AndroidBackBridge {
  static isNativeAndroid() {
    return typeof window !== 'undefined' && (
      window.AndroidBridge !== undefined ||
      window.webkit?.messageHandlers?.androidBack !== undefined
    );
  }

  static onBackPress() {
    if (window.AndroidBridge?.onBackPress) {
      window.AndroidBridge.onBackPress();
    } else if (window.webkit?.messageHandlers?.androidBack) {
      window.webkit.messageHandlers.androidBack.postMessage({});
    } else if (window.parent && window.parent !== window) {
      window.parent.postMessage({ type: 'androidBackPress' }, '*');
    }
  }
}

/**
 * Handles Android hardware back button via popstate event with native Android integration.
 */
export default function useAndroidBackButton(onBack = null) {
  const navigate = useNavigate();
  const location = useLocation();
  const isHandlingRef = useRef(false);
  const lastPathRef = useRef(null);
  const isNativeAndroidRef = useRef(AndroidBackBridge.isNativeAndroid());

  useEffect(() => {
    window.history.pushState({ androidBackSentinel: true, ts: Date.now() }, '');
    lastPathRef.current = location.pathname;

    const handlePopState = () => {
      if (isHandlingRef.current) return;
      isHandlingRef.current = true;

      try {
        if (onBack) {
          window.history.pushState({ androidBackSentinel: true, ts: Date.now() }, '');
          onBack();
          return;
        }

        const isRoot = ROOT_PATHS.includes(location.pathname);

        if (isRoot) {
          if (isNativeAndroidRef.current) {
            AndroidBackBridge.onBackPress();
          }
        } else {
          if (lastPathRef.current === location.pathname) {
            window.history.pushState({ androidBackSentinel: true, ts: Date.now() }, '');
            navigate(-1);
            lastPathRef.current = location.pathname;
          }
        }
      } finally {
        isHandlingRef.current = false;
      }
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [location.pathname, navigate, onBack]);
}