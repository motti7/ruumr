# Base44 Developer Reference

Base44 is the backend-as-a-service platform powering Ruumr. Use this reference when developing any backend logic, entities, functions, SDK calls, or auth flows.

---

## Project Structure

```
base44/
  entities/       # JSON schema files defining data models
  functions/      # TypeScript serverless functions (Deno runtime)
  agents/         # JSONC agent configuration files
  config.jsonc    # Project config (name, build commands)

src/
  pages/          # Route components (one file = one URL)
  components/     # Reusable UI elements (ui/ = pre-built)
  api/            # SDK client setup (base44Client.ts)
  hooks/          # Custom React hooks
  lib/            # Base44 integration & app config
  utils/          # Helper functions
```

---

## SDK Usage

### In Ruumr (internal app)
```typescript
import { base44 } from "@/api/base44Client";

// Entity CRUD
const profile = await base44.entities.Profile.create({ ... });
const profiles = await base44.entities.Profile.list({ filters: [...] });
const updated = await base44.entities.Profile.update(id, { ... });
await base44.entities.Profile.delete(id);

// Call a backend function
const result = await base44.functions.invoke("functionName", { param: value });
```

### External apps
```typescript
import { createClient } from "@base44/sdk";
const base44 = createClient({ appId: "your-app-id" });
```

### SDK Modules
| Module | Purpose |
|--------|---------|
| `entities` | CRUD on data models |
| `auth` | User authentication & sessions |
| `functions` | Invoke backend functions |
| `agents` | AI agent conversations |
| `analytics` | Custom event tracking |
| `app-logs` | Query application logs |
| `connectors` | OAuth & third-party tokens |
| `integrations` | Third-party services |

---

## Entities

Entity schemas live in `base44/entities/` as JSON files. The entity name (filename) becomes the SDK accessor.

### Schema structure
```json
{
  "fields": {
    "fieldName": {
      "type": "string | number | boolean | date | array | object",
      "required": true
    }
  },
  "security": {
    "read": "authenticated | public | owner",
    "write": "authenticated | owner | admin"
  }
}
```

- **Flexible schemas** — modify anytime without migrations (MongoDB-compatible NoSQL)
- **Real-time subscriptions** — watch record changes live
- **Row-level & field-level security** — granular access control
- TypeScript types auto-generated from schemas

### Deploy entities
```bash
base44 entities push       # push all
base44 entities push Name  # push one
```

---

## Backend Functions

Functions live in `base44/functions/<name>/entry.ts`. The directory path is the function identifier.

### Structure
```typescript
import { createClientFromRequest } from "@base44/sdk";

Deno.serve(async (req: Request) => {
  // Authenticated context when called from frontend
  const base44 = createClientFromRequest(req);

  // For HTTP/webhook calls without user context:
  // const base44 = createClientFromRequest(req).asServiceRole();

  // Your logic here
  const data = await base44.entities.SomeEntity.list();

  return new Response(JSON.stringify({ result: data }), {
    headers: { "Content-Type": "application/json" },
  });
});
```

### Key rules
- Runs in **Deno** (not Node.js) — use Deno-compatible imports
- `createClientFromRequest(req)` — preserves user auth context
- `.asServiceRole()` — bypasses auth for webhook/scheduled calls
- Max **50 functions** per project
- Secrets stored via `base44 secrets set KEY VALUE`

### Invoke from frontend
```typescript
const result = await base44.functions.invoke("email/send", { to: "..." });
```

### Direct HTTP
```
POST https://<domain>/functions/<function-name>
```

### Automations
Functions can be triggered on a schedule or by database events — configure in `function.jsonc`.

### CLI
```bash
base44 functions deploy          # deploy all
base44 functions deploy name     # deploy one
base44 functions pull            # pull from remote
base44 functions list            # list all
base44 logs --function name      # stream logs
```

---

## Authentication

### Auth module methods
```typescript
// Get current user
const user = await base44.auth.me();

// Check auth
const authed = await base44.auth.isAuthenticated();

// Login
await base44.auth.loginViaEmailPassword(email, password);
await base44.auth.loginWithProvider("google" | "apple" | "microsoft" | "facebook");

// Register
await base44.auth.register({ email, password, full_name });

// Logout
await base44.auth.logout(redirectUrl?);

// OTP
await base44.auth.verifyOtp({ email, otp });
await base44.auth.resendOtp(email);

// Password
await base44.auth.resetPasswordRequest(email);
await base44.auth.resetPassword({ token, password });
await base44.auth.changePassword({ old_password, new_password });

// Token
await base44.auth.setToken(token, saveToStorage?);

// Team
await base44.auth.inviteUser(email, role);
```

### User object shape
```typescript
{
  id: string;
  email: string;
  full_name: string;
  role: string;
  is_verified: boolean;
  app_id: string;
  disabled: boolean;
  is_service: boolean;
  // + any custom schema fields
}
```

> Browser-only methods (`redirectToLogin`, `loginWithProvider`, `logout`) cannot run in backend functions.

---

## AI Agents

Defined in `base44/agents/<name>.jsonc`:

```jsonc
{
  "name": "support_agent",
  "description": "Handles customer support",
  "instructions": "System prompt defining behavior...",
  "model": "claude-3-5-sonnet",   // or openai/gpt-4o
  "tool_configs": [
    {
      "type": "entity",
      "entity": "Ticket",
      "allowed_operations": ["read", "create", "update"]
    },
    {
      "type": "function",
      "function": "escalate/human",
      "description": "Escalate to human support"
    }
  ]
}
```

```bash
base44 agents push   # deploy
base44 agents pull   # sync from remote
```

---

## CLI Reference

```bash
# Install
npm install -g base44@latest   # requires Node 20.19.0+

# Auth & project
base44 login
base44 create           # new project
base44 eject            # convert editor project to local codebase
base44 link             # link existing code to Base44

# Development
base44 dev              # local dev server

# Deploy everything
base44 deploy

# Individual resources
base44 entities push/pull
base44 functions deploy/pull/list
base44 agents push/pull
base44 secrets set KEY VALUE

# Run a script with pre-authed SDK (migrations, queries)
base44 exec script.ts

# Logs
base44 logs
base44 logs --function <name>
```

---

## Ruumr-specific Context

- **App name**: Ruumr
- **Entities directory**: `base44/entities/` (currently: `Profile.jsonc`)
- **Functions directory**: `base44/functions/` — existing functions include:
  - `handleSwipe` — swipe matching logic
  - `sendPushNotification` — push notifications
  - `sendMessageNotification` — chat message notifications
  - `uploadProfilePhoto` / `replacePhoto` — photo management
  - `searchSong` — Spotify song search
  - `ruumrPlusBridge` — Ruumr Plus subscription logic
  - `weeklyActivityReport` — activity reporting
  - `deleteAccount` — account deletion
  - `sendEmailToMotti` — internal email
- **Config**: `base44/config.jsonc` — project name "Ruumr", Vite build
