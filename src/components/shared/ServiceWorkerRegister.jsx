/**
 * ServiceWorkerRegister — Registers the service worker for offline support
 * Call this component once on app startup (e.g., in App.jsx or Layout)
 */

import { useEffect } from 'react';

export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) {
      console.log('[ServiceWorker] Not supported in this browser');
      return;
    }

    // Never register the SW in dev — stale cached JS causes React hook errors
    if (import.meta.env.DEV) {
      navigator.serviceWorker.getRegistrations().then((regs) => {
        regs.forEach((reg) => reg.unregister());
      });
      caches.keys().then((keys) => keys.forEach((k) => caches.delete(k)));
      return;
    }

    const registerServiceWorker = async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
        });
        console.log('[ServiceWorker] Registered successfully:', registration);

        // Check for updates periodically (every 6 hours)
        setInterval(() => {
          registration.update();
        }, 6 * 60 * 60 * 1000);

        // Listen for controller change (new SW ready)
        let refreshing = false;
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          if (!refreshing) {
            refreshing = true;
            // Optionally notify user of update
            console.log('[ServiceWorker] New version available, please refresh');
          }
        });
      } catch (error) {
        console.warn('[ServiceWorker] Registration failed:', error);
      }
    };

    // Delay registration to avoid blocking initial load
    const timeoutId = setTimeout(registerServiceWorker, 1000);

    return () => clearTimeout(timeoutId);
  }, []);

  return null; // This component renders nothing
}