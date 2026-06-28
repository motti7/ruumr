import '@/i18n' // Initialize i18next before any component renders.
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'
import { initMixpanel } from '@/lib/mixpanelTracking'
import { initSafeAreaInsets } from '@/lib/safeAreaInsets'
// Configure the native Android status bar when running inside Capacitor.
// Dynamically imported to avoid breaking the web build.

const recordRuntimeIssue = (kind, payload) => {
  try {
    window.localStorage.setItem('ruumr_last_runtime_issue', JSON.stringify({
      kind,
      payload,
      timestamp: new Date().toISOString(),
    }));
  } catch {
    // Debug only.
  }
};

if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    recordRuntimeIssue('error', {
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      stack: event.error?.stack || null,
    });
  });

  window.addEventListener('unhandledrejection', (event) => {
    recordRuntimeIssue('unhandledrejection', {
      reason: event.reason?.message || String(event.reason || 'unknown'),
      stack: event.reason?.stack || null,
    });
  });
}

initMixpanel()
initSafeAreaInsets()

// Track app entry source (mobile native vs web browser)
;(async () => {
  try {
    const { Capacitor } = await import('@capacitor/core');
    const { trackMixpanel } = await import('@/lib/mixpanelTracking');
    const { base44 } = await import('@/api/base44Client');
    const isNative = Capacitor.isNativePlatform();
    const platform = isNative ? Capacitor.getPlatform() : 'web';
    const source = isNative ? 'mobile' : 'web';
    trackMixpanel('App Opened', { source, platform });
    base44.analytics?.track?.({ eventName: 'app_opened', properties: { source, platform } });
  } catch (_) {}
})()

// Capacitor status bar is configured natively via the Android build.

// Register audit tools in development
if (import.meta.env.DEV) {
  import('@/lib/accessibilityAudit.js');
  import('@/lib/performanceAudit.js');
  import('@/lib/modalTapTargetAudit.js');
  import('@/lib/performanceTest.js');
  import('@/lib/lighthouseAudit.js');
}

ReactDOM.createRoot(document.getElementById('root')).render(
  // <React.StrictMode>
  <App />
  // </React.StrictMode>,
)

if (import.meta.hot) {
  import.meta.hot.on('vite:beforeUpdate', () => {
    window.parent?.postMessage({ type: 'sandbox:beforeUpdate' }, '*');
  });
  import.meta.hot.on('vite:afterUpdate', () => {
    window.parent?.postMessage({ type: 'sandbox:afterUpdate' }, '*');
  });
}