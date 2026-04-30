# Environment Variables Configuration Guide

## Overview

This application uses Vite environment variables for managing production keys and sensitive configuration. All environment-specific variables should be defined in `.env` (development) and `.env.production` (production) files.

---

## OneSignal Configuration

OneSignal is configured with environment variables for secure production deployment.

### Environment Variables

```bash
# .env (Development)
VITE_ONESIGNAL_APP_ID=YOUR_ONESIGNAL_APP_ID_DEV
VITE_ONESIGNAL_SAFARI_WEB_ID=web.onesignal.auto.xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
VITE_ONESIGNAL_REST_API_KEY=YOUR_REST_API_KEY_DEV

# .env.production (Production)
VITE_ONESIGNAL_APP_ID=YOUR_ONESIGNAL_APP_ID_PROD
VITE_ONESIGNAL_SAFARI_WEB_ID=web.onesignal.auto.xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
VITE_ONESIGNAL_REST_API_KEY=YOUR_REST_API_KEY_PROD
```

### How to Get OneSignal Keys

1. **App ID:**
   - Go to [OneSignal Dashboard](https://onesignal.com)
   - Select your app
   - Go to Settings → Keys & IDs
   - Copy the App ID

2. **Safari Web ID:**
   - In the same Keys & IDs section
   - Copy the Safari Web ID (web.onesignal.auto.xxx format)

3. **REST API Key:**
   - Go to Settings → Authorization
   - Copy the REST API Key (not the User Auth Key)
   - **Important:** Keep this key secret! Never commit it to version control.

### Implementation

The OneSignal setup component (`components/shared/OneSignalSetup.jsx`) automatically reads from these environment variables:

```javascript
const appId = import.meta.env.VITE_ONESIGNAL_APP_ID;
const safariWebId = import.meta.env.VITE_ONESIGNAL_SAFARI_WEB_ID;
const restApiKey = import.meta.env.VITE_ONESIGNAL_REST_API_KEY;
```

**Safety Features:**
- ✅ Missing keys are detected and logged as warnings
- ✅ Initialization is skipped if AppID is not configured
- ✅ REST API calls validate keys before execution
- ✅ No hardcoded defaults (prevents accidental exposure)

---

## Vite Environment Variables Reference

### Accessing Variables in Code

Use `import.meta.env.` prefix to access environment variables in your code:

```javascript
// Good ✅
const appId = import.meta.env.VITE_ONESIGNAL_APP_ID;

// Bad ❌
const appId = process.env.VITE_ONESIGNAL_APP_ID; // Won't work in Vite
```

### Variable Naming Convention

- **Prefix:** `VITE_` is required for all client-side variables
- **Format:** `VITE_SERVICE_KEY_DESCRIPTION`
- **Examples:**
  - `VITE_ONESIGNAL_APP_ID`
  - `VITE_STRIPE_PUBLIC_KEY`
  - `VITE_GOOGLE_MAPS_API_KEY`

### Build Behavior

- **Development:** Variables from `.env` are available during `npm run dev`
- **Production:** Variables from `.env.production` are used during `npm run build`
- **Runtime:** Vite embeds environment variables at build time (not runtime-configurable)

---

## Development Setup

### 1. Create `.env` file in project root

```bash
# Copy the example
cp .env.example .env

# Edit with your development credentials
nano .env
```

### 2. Format

```bash
# OneSignal Development Keys
VITE_ONESIGNAL_APP_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
VITE_ONESIGNAL_SAFARI_WEB_ID=web.onesignal.auto.xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
VITE_ONESIGNAL_REST_API_KEY=your_rest_api_key_here
```

### 3. Verify in Browser Console

```javascript
// In browser DevTools console:
console.log(import.meta.env.VITE_ONESIGNAL_APP_ID);
// Should output: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

---

## Production Deployment

### Deployment Checklist

- [ ] Create `.env.production` with production keys
- [ ] Never commit `.env` or `.env.production` to version control
- [ ] Add `.env` and `.env.production` to `.gitignore`
- [ ] Configure environment variables in your hosting platform:
  - **Vercel:** Settings → Environment Variables
  - **Netlify:** Site Settings → Build & Deploy → Environment
  - **Docker:** Pass via `--env-file` or environment variables
  - **Manual Server:** Set system environment variables

### Vercel Setup Example

1. Go to your project settings
2. Navigate to "Environment Variables"
3. Add variables for production:
   - Name: `VITE_ONESIGNAL_APP_ID`
   - Value: `your_production_app_id`
   - Environment: `Production`
4. Repeat for all required variables

### GitHub Actions Example (CI/CD)

```yaml
name: Build and Deploy

on: [push]

env:
  VITE_ONESIGNAL_APP_ID: ${{ secrets.ONESIGNAL_APP_ID }}
  VITE_ONESIGNAL_SAFARI_WEB_ID: ${{ secrets.ONESIGNAL_SAFARI_WEB_ID }}
  VITE_ONESIGNAL_REST_API_KEY: ${{ secrets.ONESIGNAL_REST_API_KEY }}

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: npm run build
```

---

## Security Best Practices

### ✅ Do's

- ✅ Store production keys in secure environment variable systems
- ✅ Use `.env.production` for sensitive production data
- ✅ Rotate API keys regularly
- ✅ Use least-privilege API keys (e.g., read-only when possible)
- ✅ Monitor API usage for suspicious activity
- ✅ Version control `.env.example` with placeholder values

### ❌ Don'ts

- ❌ Never commit `.env` files
- ❌ Never hardcode API keys in source code
- ❌ Never share `.env.production` files
- ❌ Never use production keys in development builds
- ❌ Never expose keys in client-side console or network logs

### Git Configuration

Ensure `.env` files are ignored:

```bash
# .gitignore
.env
.env.local
.env.*.local
.env.production
```

---

## Troubleshooting

### Issue: Environment variables undefined in browser

**Problem:** `import.meta.env.VITE_ONESIGNAL_APP_ID` is `undefined`

**Solutions:**
1. Check variable prefix: Must start with `VITE_`
2. Restart dev server: `npm run dev`
3. Verify `.env` file exists in project root
4. Check `.env` file format (no spaces around `=`)

### Issue: Production build fails with missing keys

**Problem:** Build succeeds locally but fails in CI/CD

**Solutions:**
1. Ensure all variables are defined in hosting platform's environment
2. Check variable names match exactly (case-sensitive)
3. Verify `.env.production` exists or hosting platform has variables set
4. Check build logs for specific missing variable messages

### Issue: OneSignal not initializing

**Problem:** "OneSignal not defined" or no notifications

**Solutions:**
1. Verify `VITE_ONESIGNAL_APP_ID` is set and valid
2. Check OneSignal script is loaded: `window.OneSignal` in console
3. Verify app is served over HTTPS (required for notifications)
4. Check browser console for OneSignal initialization errors

---

## Ruumr Plus Bridge Configuration

The Ruumr app now talks to the standalone Ruumr Plus service through a Base44 function bridge. These settings live on the function/runtime side, not in the Vite client bundle:

```bash
# Base44 function / server-side environment
RUUMR_PLUS_SERVICE_URL=http://127.0.0.1:8787
RUUMR_PLUS_API_KEY=replace-me
RUUMR_PLUS_WEBHOOK_SECRET=replace-me
```

### Notes

- `RUUMR_PLUS_SERVICE_URL` should point at the deployed Ruumr Plus service.
- `RUUMR_PLUS_API_KEY` protects recommendation and admin endpoints.
- `RUUMR_PLUS_WEBHOOK_SECRET` signs profile sync requests for replay protection.
- If either secret is left as `replace-me`, the service treats that check as disabled for local development.
- The bridge defaults to `http://127.0.0.1:8787` so local service testing works without extra wiring.

### Base44 deployment

When you push `ruumr` to Base44, these values must be configured as Base44 function secrets for the `ruumrPlusBridge` function. They are not Vite client env vars.

```bash
base44 secrets set \
  RUUMR_PLUS_SERVICE_URL=https://your-ruumr-plus-service.example.com \
  RUUMR_PLUS_API_KEY=your-service-api-key \
  RUUMR_PLUS_WEBHOOK_SECRET=your-webhook-secret
```

- `base44 deploy` will publish the bridge function along with the rest of the `ruumr` app.
- `ruumr-plus-service` is still deployed separately and is not uploaded into Base44.
- If `RUUMR_PLUS_SERVICE_URL` is still set to localhost after deploying, the bridge will fail fast with a clear error.

---

## Additional Resources

- [Vite Environment Variables Docs](https://vitejs.dev/guide/env-and-mode.html)
- [OneSignal Setup Guide](https://documentation.onesignal.com/docs)
- [OWASP Secrets Management](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html)

---

## Maintenance Log

| Date | Update | Details |
|------|--------|---------|
| 2026-03-25 | Initial Setup | OneSignal environment variables configured |
| | Schema | Vite environment variable structure defined |
| | Security | Security best practices documented |
