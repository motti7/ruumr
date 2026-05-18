import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'
import mixpanel from 'mixpanel-browser'
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


const hostname = window.location.hostname.toLowerCase()
const shouldEnableMixpanel =
  !hostname.includes('localhost') &&
  !hostname.includes('preview-sandbox') &&
  !hostname.includes('base44')

if (shouldEnableMixpanel) {
  mixpanel.init(import.meta.env.VITE_MIXPANEL_TOKEN, {
    debug: true,
    autocapture: true,
    record_sessions_percent: 100,
    api_host: 'https://api-eu.mixpanel.com',
  })
}

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
