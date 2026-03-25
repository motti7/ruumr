import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

// Root screens that should exit the app (or go to home) on back press
const ROOT_PATHS = ['/', '/Discover', '/Matches', '/LikesYou', '/GroupTracker'];

/**
 * Handles Android hardware back button via the popstate event.
 * - On root screens: minimizes the app (history.go(-1) exits PWA/WebView)
 * - On other screens: navigates back in history
 * - Accepts an optional `onBack` override (e.g. to close a modal first)
 */
export default function useAndroidBackButton(onBack = null) {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Push a state so we can intercept the back press
    window.history.pushState({ androidBack: true }, '');

    const handlePopState = (e) => {
      if (onBack) {
        // Let the caller handle it (e.g. close modal)
        window.history.pushState({ androidBack: true }, '');
        onBack();
        return;
      }

      const isRoot = ROOT_PATHS.includes(location.pathname);

      if (isRoot) {
        // On root screen — minimize app (don't re-push, let it close)
        // For WebView/TWA this exits; for browser it goes back in history naturally
      } else {
        // Re-push sentinel state so next back press is also intercepted
        window.history.pushState({ androidBack: true }, '');
        navigate(-1);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [location.pathname, navigate, onBack]);
}