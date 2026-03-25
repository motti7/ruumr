import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'

// Register audit tools in development
if (process.env.NODE_ENV === 'development') {
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