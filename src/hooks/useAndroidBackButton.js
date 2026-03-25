import { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

// Root screens that should exit the app (or go to home) on back press
const ROOT_PATHS = ['/', '/Discover', '/Matches', '/LikesYou', '/GroupTracker'];

/**
 * Handles Android hardware back button via the popstate event with robust state drift prevention.
 * - On root screens: minimizes the app (history.go(-1) exits PWA/WebView)
 * - On other screens: navigates back in history
 * - Accepts an optional `onBack` override (e.g. to close a modal first)
 * - Guards against state drift by tracking call order and preventing double-handling
 */
export default function useAndroidBackButton(onBack = null) {
  const navigate = useNavigate();
  const location = useLocation();
  const isHandlingRef = useRef(false);
  const lastPathRef = useRef(null);

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
          // On root screen — minimize app (don't re-push, let it close)
          // For WebView/TWA this exits; for browser it goes back in history naturally
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
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [location.pathname, navigate, onBack]);
}