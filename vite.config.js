import base44 from "@base44/vite-plugin"
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  logLevel: 'error', // Suppress warnings, only show errors
  plugins: [
    base44({
      // Support for legacy code that imports the base44 SDK with @/integrations, @/functions, etc.
      // The app still relies on these (e.g. `@/functions/getSubscriptionStatus`, which the plugin
      // maps to `base44.functions.invoke`), so this defaults ON to match Base44's cloud build —
      // without it the production build fails to resolve those imports. Real files (e.g.
      // `src/entities/*`) still take precedence, so only unresolved legacy imports hit the shim.
      // Set BASE44_LEGACY_SDK_IMPORTS=false once all imports use the new @base44/sdk paths.
      legacySDKImports: process.env.BASE44_LEGACY_SDK_IMPORTS !== 'false',
      hmrNotifier: true,
      navigationNotifier: true,
      visualEditAgent: true
    }),
    react(),
  ]
});