import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'
import mixpanel from 'mixpanel-browser'
// Configure the native Android status bar when running inside Capacitor.
// Dynamically imported to avoid breaking the web build.


const hostname = window.location.hostname.toLowerCase()
const shouldEnableMixpanel =
  !hostname.includes('localhost') &&
  !hostname.includes('preview-sandbox') &&
  !hostname.includes('base44')

if (shouldEnableMixpanel) {
  mixpanel.init('57193f6883f7a3d0281c5fbbdf952fb2', {
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