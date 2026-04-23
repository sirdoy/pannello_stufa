# Phase 170: Auth UI - Research

**Researched:** 2026-04-23
**Domain:** Next.js 16 App Router + React 19 Auth UI (form-based login + API-key CRUD, httpOnly cookie session marker, Auth0 coexistence)
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Semantic Reconciliation (ROADMAP vs. Phase 157):**
- **D-01:** ROADMAP criterion 1 says "Login page POSTs form credentials to `/auth/login` and stores JWT." Phase 157 D-03 locked JWT as server-side only. Phase 170 reconciles by:
  - Extending `POST /api/auth/login` to accept an optional `{ username, password }` JSON body. If body present, proxy-login uses those creds; if absent, falls back to `HA_ADMIN_USER` / `HA_ADMIN_PASSWORD` env vars.
  - On successful proxy login, server sets a short-lived **httpOnly session cookie** (`ha_auth=1`, `max-age=3600`, `sameSite=lax`, `secure` in prod). JWT NEVER leaves server. Route response body remains `{ authenticated: true }`.
  - ROADMAP's "stores JWT" reinterpreted: cookie carries authenticated-session flag. **T-157-01 preserved.**
- **D-02:** Login form inputs default visible + required. Convenience "Use server-configured credentials" checkbox submits with empty body to use env vars. Fields required by default.

**Auth0 Relationship:**
- **D-03:** Auth0 remains the primary app-session gate. `/login` and `/settings/api-keys` both wrapped in Auth0 at the route level. HA-proxy login is a **second gate** unlocking api-key management. Preserves phase 157 D-04/D-07/D-08.
- **D-04:** Unauthenticated-from-HA-proxy state shows the login form. Once HA cookie set, `/settings/api-keys` becomes viewable. Cookie-expired → re-auth banner inline, not silent redirect.

**Page Structure & URLs:**
- **D-05:** Login page at `/login` (top-level, Auth0-guarded). Does NOT collide with existing `app/auth/profile/` (Auth0 callback) or `app/api/auth/*` (API routes).
- **D-06:** API-keys management at `/settings/api-keys`. Groups with existing `SettingsLayout`.
- **D-07:** Post-login redirect: push to `/settings/api-keys`. Query param `?next=/x` overrides if present.

**UI Pattern (API Keys Page):**
- **D-08:** Reuse the Registry pattern established in phases 118-125: `SettingsLayout` + `DataTable` + `FormModal` + `ConfirmationDialog` + `useToast`. Matches `app/registry/types/page.tsx` and `app/registry/devices/page.tsx`.
- **D-09:** DataTable columns: `id`, `name`, `created_at` (formatted relative time), `last_used_at` (relative or "Mai usata"), `is_active` badge, actions column (Revoke button). Italian locale throughout.
- **D-10:** Create flow: "Crea nuova API key" button → FormModal with `name` field (Zod: 1-100 chars). On `POST /api/auth/api-keys` success, swap the form modal content with a plaintext-key reveal view showing the full `api_key` value, copy-to-clipboard button, and red warning: *"Questa chiave è visibile solo ora. Copiala e conservala in un posto sicuro."* Closing modal removes key from state permanently.
- **D-11:** Revoke flow: `ConfirmationDialog` with key name + irreversibility warning → `DELETE /api/auth/api-keys/{keyId}` → refetch list → toast *"API key revocata"*. Optimistic UI NOT used.

**Hooks:**
- **D-12:** `app/hooks/useApiKeys.ts` — `{ keys, loading, error, refetch, create, revoke }`. Thin fetch wrapper around 3 existing routes. No SWR/React Query — matches existing `useDeviceTypes`, `useRooms` pattern.
- **D-13:** `app/hooks/useLogin.ts` — `{ login, logout, authenticated, loading, error }`.

**Minimal Backend Additions:**
- **D-14:** Add **one new route**: `POST /api/auth/logout` — clears `ha_auth` cookie, returns `{ authenticated: false }`.
- **D-15:** Modify `app/api/auth/login/route.ts`: add optional body parsing, set httpOnly cookie. Phase 157 tests extended, not rewritten. **T-157-01 still enforced** (access_token never in response body).

**Security & Validation:**
- **D-16:** Client-side Zod schemas on both login form and key-create form. Server continues to validate independently.
- **D-17:** Password input `type="password"` + `autocomplete="current-password"`; username `autocomplete="username"`.
- **D-18:** Login form toast *"Troppi tentativi, riprova tra un minuto"* on 429 and locally disables submit for 30 seconds.

**Testing:**
- **D-19:** Jest unit tests for both hooks using `fetch` mocks.
- **D-20:** Jest component tests for `LoginPage` and `ApiKeysPage` using RTL: render happy path, submit success, submit error, empty list, plaintext-key-once-visible assertion.
- **D-21:** Playwright smoke (`tests/smoke/page-loads.spec.ts`): add `/login` and `/settings/api-keys` to the matrix (structural smoke only).
- **D-22:** Playwright spec (`tests/features/auth-ui.spec.ts`) for full happy path using mocked `/api/auth/*` via `page.route()`.

**Nav & Discovery:**
- **D-23:** Add "API Keys" navbar entry alongside Registro/Stanze. Icon: `KeyRound` from lucide-react.
- **D-24:** No navbar entry for `/login`.

### Claude's Discretion

- Exact Toast messages and copy (Italian).
- Whether to inline the login form on `/settings/api-keys` when unauthenticated vs. always redirect. **Default: redirect to `/login?next=/settings/api-keys`.**
- Cookie name exactly (`ha_auth` suggested) and precise `max-age`.
- FormModal render-prop shape (follow registry pattern).

### Deferred Ideas (OUT OF SCOPE)

- API-key scoping / permissions UI (HA proxy doesn't support scopes).
- Key rotation reminders / expiry notifications.
- Multi-user RBAC on `/settings/api-keys`.
- Replace Auth0 with HA-proxy-only session.
- Password reset / "forgot password" flow.
- Per-key usage analytics beyond `last_used_at`.

</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| AUTH-01 | User può autenticarsi via POST /auth/login con credenziali form-based e ricevere JWT | Extended `/api/auth/login` route (D-15) + `useLogin` hook (D-13) + `/login` page (D-05). JWT stays server-side per T-157-01; cookie `ha_auth` is the client-visible marker. See §Code Examples Pattern 1 + 3. |
| AUTH-02 | User può creare API key via POST /auth/api-keys | `useApiKeys.create()` (D-12) + `FormModal` with Zod `name` schema + plaintext reveal modal (D-10). Existing `POST /api/auth/api-keys` route consumed as-is. See §Code Examples Pattern 4. |
| AUTH-03 | User può listare le proprie API key via GET /auth/api-keys | `useApiKeys.refetch()` + `DataTable` with 5 columns (D-09) + Italian relative-time formatting via `useRelativeTime`. Existing `GET /api/auth/api-keys` consumed as-is. See §Code Examples Pattern 5. |
| AUTH-04 | User può revocare una API key via DELETE /auth/api-keys/{key_id} | `ConfirmationDialog` (danger variant) + `useApiKeys.revoke(id)` + refetch on success. Existing `DELETE /api/auth/api-keys/[keyId]` consumed as-is. See §Code Examples Pattern 6. |

</phase_requirements>

---

## Summary

Phase 170 wires the frontend consumers for the 4 auth routes phase 157 delivered. It introduces two user-visible pages (`/login`, `/settings/api-keys`), two custom hooks (`useLogin`, `useApiKeys`), **one new API route** (`POST /api/auth/logout`), **one modified route** (`POST /api/auth/login` extended to accept optional credentials body + set httpOnly `ha_auth` cookie), and a navbar entry. Every UI primitive already exists in the codebase — this is strictly a wiring phase, not a foundation phase.

The one architecturally novel piece is the `ha_auth` httpOnly cookie: it's the first instance in the codebase of manually `cookies().set()`-ing a server-maintained session marker (Auth0 v4 manages `appSession` internally). The cookie is a binary marker — value `'1'` — because the JWT itself must never leave the server (T-157-01 from phase 157 is load-bearing). The Auth0 session still governs application-level access; `ha_auth` is a second gate for API-key management only, matching phase 157 D-08.

All other concerns — form validation, modal flow, DataTable columns, Italian copy, toast messaging, Playwright smoke — follow the Registry pattern (phases 118-125) faithfully.

**Primary recommendation:** Structure the phase as **3 plans**: (1) backend extensions (login body, cookie set/clear, logout route, test extensions); (2) hooks + login page; (3) api-keys page + navbar + Playwright smoke. Keep the plaintext-reveal modal inside the FormModal by conditionally rendering a second view after successful create — no new modal component needed.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| User credential input & submission | Browser / Client | — | Form UX is a pure client concern; React Hook Form + Zod owns validation before network. |
| JWT acquisition & storage | API / Backend | — | Phase 157 D-03 mandates JWT never crosses to client. Route handler owns full JWT lifecycle. |
| Session marker (`ha_auth` cookie) | API / Backend | Browser (read-only) | Server sets httpOnly cookie; client can only observe its existence via `document.cookie` absence or request response (browser can't read httpOnly). |
| API-key list/create/revoke HTTP calls | API / Backend | Browser (UI trigger) | Route handlers proxy to HA backend; client fires via `fetch()`. |
| Plaintext-key reveal UI | Browser / Client | — | Purely client-side state: `useState<string \| null>` wiped on modal close. |
| Auth0 guard on /login & /settings/api-keys | Frontend Server (SSR) | API / Backend | `withAuthAndErrorHandler` wraps API routes; page-level guard uses `useUser()` from Auth0 client SDK (or server-side `auth0.getSession()`). |
| Rate-limit awareness (429 handling) | Browser / Client | API / Backend | Server propagates 429 from HA proxy via ApiError; client renders toast + disables submit for 30s. |
| Copy-to-clipboard plaintext key | Browser / Client | — | `navigator.clipboard.writeText()` is a browser API. |

---

## Standard Stack

### Core

All libraries below are already in `package.json` at the versions shown. **No new dependencies required.**

| Library | Version (installed) | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `next` | 16.1.0 (current stable: 16.2.4) | Framework, App Router, route handlers, `cookies()` API | [VERIFIED: `package.json` line 50; `npm view next version` → 16.2.4 as of 2026-04-15] |
| `react` | 19.2.0 | Component runtime | [VERIFIED: `package.json`] |
| `react-hook-form` | 7.73.1 (installed) / 7.54.2 (pinned) | Form state + validation | [VERIFIED: `npm view react-hook-form version`; pattern used in `FormModal.tsx`] |
| `@hookform/resolvers` | 5.2.2 (installed) / 3.9.3 (pinned) | `zodResolver` for RHF+Zod bridge | [VERIFIED: `FormModal.tsx:5`] |
| `zod` | 3.24.2 | Runtime validation + TS inference | [VERIFIED: `package.json`; used throughout `app/registry/*/page.tsx`] |
| `@auth0/nextjs-auth0` | 4.13.1 | Auth0 SDK v4 — `useUser()` client hook, `auth0.getSession()` server | [VERIFIED: `package.json:24`; configured in `lib/auth0.ts`] |
| `lucide-react` | 0.562.0 | Icon set — `KeyRound`, `Copy`, `Check`, `X`, `Eye`, `EyeOff`, `AlertTriangle` | [VERIFIED: navbar already imports `ClipboardList`, `DoorOpen`, `Zap` at line 7] |
| `@tanstack/react-table` | 8.21.3 | DataTable engine | [VERIFIED: via `DataTable.tsx`] |
| `@radix-ui/react-dialog` | 1.1.14 | Modal primitives | [VERIFIED: via `ConfirmationDialog.tsx:5`] |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Existing `lib/hooks/useRelativeTime.ts` | — | Italian relative-time strings ("Adesso", "3m fa", "2h fa") with 10s auto-refresh | Apply to `created_at` and `last_used_at` columns. [VERIFIED: `lib/hooks/useRelativeTime.ts`] |
| Existing `app/components/SettingsLayout.tsx` | — | Page wrapper with back button + title + icon | Wrap `/settings/api-keys`. [VERIFIED: file read] |
| Existing `app/hooks/useToast.ts` | — | Toast trigger — `{ success, error, warning, info }` methods | Feedback on login, create, revoke, errors. [VERIFIED: file read] |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| httpOnly cookie via `cookies().set()` | JWT returned to client + localStorage | **REJECTED** — phase 157 D-03/T-157-01 locks JWT as server-only. Not an option. |
| Inline login form on `/settings/api-keys` when unauthenticated | Redirect to `/login?next=/settings/api-keys` | Context D-04 and Claude's Discretion pick redirect for clarity. Inline form would require duplicating form component; redirect reuses `/login` page. |
| `react-query` / `swr` for data fetching | Plain `useState` + manual `refetch()` callback | **REJECTED** — CONTEXT D-12 mandates local-state pattern to match `useDeviceTypes`, `useRooms`. Also no dep additions per project rule #4. |
| New `CopyButton` component | Inline `navigator.clipboard.writeText()` pattern | Existing `app/network/components/CopyableIp.tsx` shows the project's established inline copy pattern (state + lucide Copy/Check icon + 2s revert). Adopt that pattern inline in the reveal view; do not extract. |

**Installation:** No installation needed — all dependencies already in `package.json`.

**Version verification notes:**
- `next@16.2.4` is stable as of 2026-04-15 (`npm view next time --json`). Project pins `^16.1.0` which resolves to latest 16.x. [VERIFIED: npm registry]
- `next` 15+ made `cookies()` async (`const cookieStore = await cookies()`). Next.js 16 requires await. [CITED: https://nextjs.org/docs/app/api-reference/functions/cookies]
- `react-hook-form@7.73.1` is installed despite `^7.54.2` in package.json — lockfile allows minor upgrades. No breaking changes relevant to this phase. [VERIFIED: `npm view react-hook-form version`]
- `zod@3.24.2` pinned at v3 — project uses v3 patterns (`z.string().min().max().regex()`). Zod v4 is released but not adopted. [VERIFIED: `package.json`; `app/registry/types/page.tsx:21-31`]

---

## Architecture Patterns

### System Architecture Diagram

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                                USER BROWSER                                   │
└──────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
           ┌──────────────────────────────────────────────┐
           │   Auth0 Universal Login (pre-existing gate)   │
           │   — /auth/login, /auth/callback, /auth/logout │
           │   — Cookie: appSession (managed by SDK)       │
           └──────────────────────────────────────────────┘
                                      │  (authenticated Auth0 session)
                                      ▼
     ┌──────────────────────────────────────────────────────────────┐
     │            Next.js App Router (Client-Side Pages)             │
     ├──────────────────────────────────────────────────────────────┤
     │  /login (NEW)                                                  │
     │    ├─ Reads: ?next=<path> query param                          │
     │    ├─ Submits: useLogin.login({ username, password })          │
     │    └─ On success: router.push(next ?? '/settings/api-keys')    │
     │                                                                │
     │  /settings/api-keys (NEW)                                      │
     │    ├─ Guards on: Auth0 session (redirect to /auth/login)       │
     │    ├─ Guards on: ha_auth cookie presence (redirect to /login)  │
     │    ├─ useApiKeys() → { keys, loading, error, create, revoke } │
     │    ├─ DataTable: id, name, created_at, last_used_at, actions   │
     │    ├─ FormModal (create): Zod-validated name → reveal plaintext│
     │    └─ ConfirmationDialog (revoke): danger variant              │
     └──────────────────────────────────────────────────────────────┘
                                      │  fetch('/api/auth/...')
                                      ▼
     ┌──────────────────────────────────────────────────────────────┐
     │             Next.js API Routes (server, withAuth)             │
     ├──────────────────────────────────────────────────────────────┤
     │  POST /api/auth/login  [MODIFIED — D-15]                      │
     │    1. withAuthAndErrorHandler (Auth0 guard)                    │
     │    2. Optional parse: { username, password } from JSON body    │
     │       ├─ Body present → use submitted creds                    │
     │       └─ Body absent  → fall back to env HA_ADMIN_* vars       │
     │    3. Call authProxy.login(u, p) → Token { access_token }      │
     │    4. DISCARD access_token (T-157-01 preserved)                │
     │    5. cookies().set('ha_auth', '1', { httpOnly, sameSite,      │
     │         maxAge: 3600, path: '/', secure: IS_PROD })            │
     │    6. return success({ authenticated: true })                  │
     │                                                                │
     │  POST /api/auth/logout [NEW — D-14]                           │
     │    1. withAuthAndErrorHandler (Auth0 guard)                    │
     │    2. cookies().delete('ha_auth')  OR  set maxAge: 0           │
     │    3. return success({ authenticated: false })                 │
     │                                                                │
     │  POST /api/auth/api-keys         [UNCHANGED from phase 157]    │
     │  GET  /api/auth/api-keys         [UNCHANGED from phase 157]    │
     │  DELETE /api/auth/api-keys/[id]  [UNCHANGED from phase 157]    │
     └──────────────────────────────────────────────────────────────┘
                                      │  HA proxy (form-encoded / Bearer)
                                      ▼
     ┌──────────────────────────────────────────────────────────────┐
     │                   HA Proxy Backend (/auth/*)                  │
     │  — Rate-limited: 10 req/min per IP                            │
     │  — Form-encoded login body (OAuth2 PasswordRequestForm)       │
     │  — Plaintext key returned ONLY on POST /auth/api-keys (D-10)  │
     └──────────────────────────────────────────────────────────────┘
```

### Recommended Project Structure

```
app/
├── login/                           # NEW — D-05
│   └── page.tsx                     # NEW: LoginPage component
├── settings/
│   └── api-keys/                    # NEW — D-06
│       └── page.tsx                 # NEW: ApiKeysPage component
├── api/
│   └── auth/
│       ├── login/
│       │   └── route.ts             # MODIFIED — D-15 (body + cookie)
│       ├── logout/                  # NEW — D-14
│       │   └── route.ts             # NEW: POST clears cookie
│       └── api-keys/                # UNCHANGED
│           ├── route.ts
│           └── [keyId]/
│               └── route.ts
├── hooks/
│   ├── useApiKeys.ts                # NEW — D-12
│   └── useLogin.ts                  # NEW — D-13
└── components/
    └── Navbar.tsx                   # MODIFIED — D-23 (add KeyRound entry)

lib/
└── auth/
    └── authProxy.ts                 # UNCHANGED (phase 157)

types/
└── authProxy.ts                     # UNCHANGED (phase 157)

__tests__/
├── app/
│   ├── login/
│   │   └── page.test.tsx            # NEW — D-20
│   └── settings/
│       └── api-keys/
│           └── page.test.tsx        # NEW — D-20
├── hooks/
│   ├── useLogin.test.ts             # NEW — D-19
│   └── useApiKeys.test.ts           # NEW — D-19
└── api/
    └── auth/
        ├── login/
        │   └── route.test.ts        # EXTEND (phase 157 tests + new body/cookie cases)
        └── logout/
            └── route.test.ts        # NEW — D-14 tests

tests/
├── smoke/
│   └── page-loads.spec.ts           # EXTEND — D-21 (add /login, /settings/api-keys)
└── features/
    └── auth-ui.spec.ts              # NEW — D-22 (full happy path via page.route mocks)
```

### Pattern 1: httpOnly Session Cookie in Next.js 16 Route Handler

**What:** Server-side issuance of a binary session marker cookie that the client can never inspect (httpOnly) but that proves HA-proxy authentication for subsequent requests.

**When to use:** Only when you need a "this user is logged in to X" flag and **must not** expose the underlying token. Perfect for phase 170 because T-157-01 forbids returning JWT.

**Example:**
```typescript
// Source: https://nextjs.org/docs/app/api-reference/functions/cookies
// [VERIFIED: Context7 /vercel/next.js docs fetched 2026-04-23]
import { cookies } from 'next/headers';

export const POST = withAuthAndErrorHandler(async (request) => {
  // ... existing login logic ...
  const { access_token } = await login(username, password);
  // access_token intentionally unused — T-157-01 guard

  const cookieStore = await cookies();  // Next 15+: cookies() is async
  cookieStore.set('ha_auth', '1', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',  // false in localhost dev
    path: '/',
    maxAge: 60 * 60,  // 1 hour (matches HA proxy token TTL assumption)
  });

  return success({ authenticated: true });
}, 'Auth/Login');
```

**Why `secure: process.env.NODE_ENV === 'production'`:** The app runs on `http://localhost:3000` in dev (`npm run dev`). `secure: true` on HTTP transport causes browsers to silently drop the cookie. This is the project's established pattern — `lib/auth0.ts:49` uses the same guard for the Auth0 session cookie. [VERIFIED: `lib/auth0.ts:49`]

**Why `sameSite: 'lax'`:** Allows top-level navigations (including back-navigation from `/login` to `/settings/api-keys`) to include the cookie, but blocks third-party POST submissions (basic CSRF hygiene). Matches Auth0 SDK config. [VERIFIED: `lib/auth0.ts:50`]

**Why `maxAge: 3600`:** 1 hour is a conservative matching TTL — the HA proxy JWT is re-fetched server-side per request (phase 157 pattern), so the client-visible cookie's expiry is decoupled from the JWT's. A shorter TTL means more frequent re-auth prompts; 1 hour balances UX and security. Plan-phase may choose any value between 900s and 86400s without research implications. [ASSUMED — no explicit decision in CONTEXT.md beyond "short-lived"]

### Pattern 2: Cookie Clearing on Logout

**What:** Two equivalent mechanisms in Next.js 16; either works for phase 170.

**Example (preferred — explicit delete):**
```typescript
// Source: https://nextjs.org/docs/app/api-reference/functions/cookies
// [CITED: Next.js Authentication guide §"Delete Session Cookie in Next.js App Router"]
import { cookies } from 'next/headers';

export const POST = withAuthAndErrorHandler(async () => {
  const cookieStore = await cookies();
  cookieStore.delete('ha_auth');
  return success({ authenticated: false });
}, 'Auth/Logout');
```

**Alternative (set maxAge: 0):**
```typescript
cookieStore.set('ha_auth', '', { maxAge: 0, path: '/' });
```

Both produce identical browser behavior. Prefer `.delete()` for readability. [CITED: Next.js docs fetched 2026-04-23]

### Pattern 3: Form with React Hook Form + Zod (Login)

**What:** Validated login form mirroring the Registry FormModal pattern but rendered as a page, not a modal.

**When to use:** Top-level forms (login, signup) where the form IS the page.

**Example:**
```typescript
// Adapted from app/registry/types/page.tsx pattern
'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Input from '@/app/components/ui/Input';
import Button from '@/app/components/ui/Button';

const loginSchema = z.object({
  username: z.string().min(1, 'Username obbligatorio').max(64, 'Max 64 caratteri'),
  password: z.string().min(1, 'Password obbligatoria'),
});

type LoginValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { control, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginValues>({
    defaultValues: { username: '', password: '' },
    resolver: zodResolver(loginSchema),
    mode: 'onBlur',
    reValidateMode: 'onChange',
  });

  const onSubmit = async (data: LoginValues) => {
    // calls useLogin().login(data) — see Pattern 7
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <Controller
        name="username"
        control={control}
        render={({ field, fieldState }) => (
          <Input
            label="Username"
            autoComplete="username"
            {...field}
            error={fieldState.error?.message}
          />
        )}
      />
      <Controller
        name="password"
        control={control}
        render={({ field, fieldState }) => (
          <Input
            label="Password"
            type="password"
            autoComplete="current-password"
            {...field}
            error={fieldState.error?.message}
          />
        )}
      />
      <Button type="submit" variant="ember" loading={isSubmitting}>
        Accedi
      </Button>
    </form>
  );
}
```

### Pattern 4: FormModal Create Flow with Post-Success Reveal View (D-10)

**What:** After successful `POST /api/auth/api-keys`, swap the modal body from a form into a reveal view showing the plaintext key. The same modal instance — no second modal.

**Example:**
```typescript
// Adapted from app/registry/types/page.tsx + CopyableIp pattern
'use client';

import { useState } from 'react';
import { Controller } from 'react-hook-form';
import { Copy, Check, AlertTriangle } from 'lucide-react';
import { z } from 'zod';
import FormModal from '@/app/components/ui/FormModal';
import Input from '@/app/components/ui/Input';
import Button from '@/app/components/ui/Button';

const createKeySchema = z.object({
  name: z.string().min(1, 'Nome obbligatorio').max(100, 'Max 100 caratteri'),
});

function CreateKeyModal({ isOpen, onClose, onCreate }: Props) {
  const [revealedKey, setRevealedKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (data: { name: string }) => {
    const response = await onCreate(data.name);  // useApiKeys.create()
    setRevealedKey(response.api_key);  // triggers reveal view
  };

  const handleClose = () => {
    setRevealedKey(null);  // CRITICAL: wipe key from state before closing (D-10)
    setCopied(false);
    onClose();
  };

  const handleCopy = async () => {
    if (!revealedKey) return;
    try {
      await navigator.clipboard.writeText(revealedKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Clipboard copy failed:', err);
    }
  };

  if (revealedKey) {
    // REVEAL VIEW — conditional render replaces FormModal contents
    return (
      <Modal isOpen={isOpen} onClose={handleClose}>
        <div className="flex items-start gap-3 p-4 rounded-xl bg-danger-500/10 border border-danger-500/30">
          <AlertTriangle className="h-5 w-5 text-danger-500 flex-shrink-0" />
          <p className="text-sm text-danger-300">
            Questa chiave è visibile solo ora. Copiala e conservala in un posto sicuro.
          </p>
        </div>
        <code className="block mt-4 p-3 rounded-lg bg-slate-800 text-slate-100 font-mono break-all">
          {revealedKey}
        </code>
        <Button variant="ember" onClick={handleCopy} className="mt-4">
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          {copied ? 'Copiato' : 'Copia chiave'}
        </Button>
        <Button variant="subtle" onClick={handleClose} className="mt-2">
          Chiudi
        </Button>
      </Modal>
    );
  }

  // FORM VIEW — standard FormModal
  return (
    <FormModal
      isOpen={isOpen}
      onClose={handleClose}
      onSubmit={handleSubmit}
      title="Crea nuova API key"
      defaultValues={{ name: '' }}
      validationSchema={createKeySchema}
      submitLabel="Crea"
      cancelLabel="Annulla"
    >
      {({ control }: any) => (
        <Controller
          name="name"
          control={control}
          render={({ field, fieldState }) => (
            <Input
              label="Nome"
              placeholder="es. App mobile Federico"
              {...field}
              error={fieldState.error?.message}
            />
          )}
        />
      )}
    </FormModal>
  );
}
```

**Source:** Adapted from `app/registry/types/page.tsx:205-247` (FormModal pattern) + `app/network/components/CopyableIp.tsx:17-48` (clipboard pattern). [VERIFIED: files read 2026-04-23]

### Pattern 5: DataTable for API-Keys List (D-09)

**What:** 5-column table with relative-time formatting, badge for `is_active`, action button for revoke.

**Example:**
```typescript
import type { ColumnDef } from '@tanstack/react-table';
import type { APIKeyInfo } from '@/types/authProxy';
import { formatRelativeTime } from '@/lib/hooks/useRelativeTime';
import Badge from '@/app/components/ui/Badge';
import Button from '@/app/components/ui/Button';

const columns: ColumnDef<APIKeyInfo>[] = [
  {
    accessorKey: 'id',
    header: 'ID',
    cell: ({ row }) => <code className="font-mono text-slate-400">{row.original.id}</code>,
  },
  { accessorKey: 'name', header: 'Nome', enableSorting: true },
  {
    accessorKey: 'created_at',
    header: 'Creato',
    cell: ({ row }) => formatRelativeTime(Date.parse(row.original.created_at)),
    enableSorting: true,
  },
  {
    accessorKey: 'last_used_at',
    header: 'Ultimo utilizzo',
    cell: ({ row }) => {
      const ts = row.original.last_used_at;
      return ts ? formatRelativeTime(Date.parse(ts)) : <span className="text-slate-500">Mai usata</span>;
    },
  },
  {
    accessorKey: 'is_active',
    header: 'Stato',
    cell: ({ row }) => (
      <Badge variant={row.original.is_active ? 'ocean' : 'neutral'} size="sm">
        {row.original.is_active ? 'Attiva' : 'Revocata'}
      </Badge>
    ),
  },
  {
    id: 'actions',
    header: '',
    cell: ({ row }) => (
      <Button
        variant="danger"
        size="sm"
        onClick={() => setKeyToRevoke(row.original)}
        disabled={!row.original.is_active}
      >
        Revoca
      </Button>
    ),
    enableSorting: false,
  },
];
```

**Note:** `last_used_at` is ISO 8601 `string | null`. Use `Date.parse()` to get milliseconds for `formatRelativeTime` (which expects ms). Null → "Mai usata" fallback text. [VERIFIED: `types/authProxy.ts:57`; `lib/hooks/useRelativeTime.ts:13`]

### Pattern 6: Revoke via ConfirmationDialog

```typescript
<ConfirmationDialog
  isOpen={keyToRevoke !== null}
  onClose={() => setKeyToRevoke(null)}
  onConfirm={async () => {
    if (!keyToRevoke) return;
    await revoke(keyToRevoke.id);  // useApiKeys.revoke()
    setKeyToRevoke(null);
    await refetch();
    toastSuccess('API key revocata');
  }}
  title="Revoca API key"
  description={`Revocare "${keyToRevoke?.name}"? L'azione è irreversibile.`}
  confirmLabel="Revoca"
  cancelLabel="Annulla"
  variant="danger"
/>
```

[VERIFIED: pattern taken from `app/registry/devices/page.tsx:647-657`]

### Pattern 7: Custom Hooks — `useLogin` and `useApiKeys`

**What:** Thin wrapper hooks that encapsulate fetch calls, state, and refetch logic. Match the `useDeviceTypes` style inline in registry pages.

**Example (`useApiKeys`):**
```typescript
// app/hooks/useApiKeys.ts
'use client';

import { useState, useEffect, useCallback } from 'react';
import type { APIKeyInfo, APIKeyListResponse, APIKeyResponse } from '@/types/authProxy';

export function useApiKeys() {
  const [keys, setKeys] = useState<APIKeyInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/api-keys');
      if (res.status === 401) {
        // D-04: HA cookie expired — signal to redirect
        setError('SESSION_EXPIRED');
        return;
      }
      if (!res.ok) throw new Error('Errore nel caricamento delle API key');
      const data = (await res.json()) as APIKeyListResponse;
      setKeys(data.keys);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore sconosciuto');
    } finally {
      setLoading(false);
    }
  }, []);

  const create = useCallback(async (name: string): Promise<APIKeyResponse> => {
    const res = await fetch('/api/auth/api-keys', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    if (!res.ok) throw new Error(`Errore durante la creazione (${res.status})`);
    return (await res.json()) as APIKeyResponse;
  }, []);

  const revoke = useCallback(async (keyId: number): Promise<void> => {
    const res = await fetch(`/api/auth/api-keys/${keyId}`, { method: 'DELETE' });
    if (res.status === 404) {
      // already revoked — not an error
      return;
    }
    if (!res.ok) throw new Error('Errore durante la revoca');
  }, []);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return { keys, loading, error, refetch, create, revoke };
}
```

**Example (`useLogin`):**
```typescript
// app/hooks/useLogin.ts
'use client';

import { useState, useCallback } from 'react';

interface LoginPayload {
  username: string;
  password: string;
}

export function useLogin() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rateLimitedUntil, setRateLimitedUntil] = useState<number>(0);

  const login = useCallback(async (payload: LoginPayload | null): Promise<boolean> => {
    // Rate-limit local guard (D-18)
    if (Date.now() < rateLimitedUntil) return false;

    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload ? JSON.stringify(payload) : undefined,  // empty body → use env fallback (D-02)
      });
      if (res.status === 429) {
        setError('RATE_LIMITED');
        setRateLimitedUntil(Date.now() + 30_000);  // D-18: 30s lockout
        return false;
      }
      if (res.status === 401) {
        setError('INVALID_CREDENTIALS');
        return false;
      }
      if (!res.ok) {
        setError('SERVER_ERROR');
        return false;
      }
      return true;
    } catch (err) {
      setError('NETWORK_ERROR');
      return false;
    } finally {
      setLoading(false);
    }
  }, [rateLimitedUntil]);

  const logout = useCallback(async (): Promise<void> => {
    await fetch('/api/auth/logout', { method: 'POST' });
  }, []);

  return { login, logout, loading, error, rateLimitedUntil };
}
```

**Why sentinel error codes (`'RATE_LIMITED'`, `'INVALID_CREDENTIALS'`) instead of translated strings:** Lets the component layer map sentinels to i18n copy. Matches pattern observed in provider hooks like `useLightsData` where errors are set to status strings. [ASSUMED — pattern inference from project conventions; plan-phase may adjust]

### Anti-Patterns to Avoid

- **Store JWT in localStorage or non-httpOnly cookie:** Violates phase 157 D-03/T-157-01. Never return `access_token` to the browser.
- **Mutate the login response shape:** Keep `{ authenticated: true }` as the sole body. Adding user info, expiry, etc., creates info-disclosure surface.
- **Optimistic UI on revoke:** CONTEXT D-11 explicitly rules this out. Wait for server confirmation.
- **Server-side redirect from `/api/auth/login` to `/settings/api-keys`:** The route is called via `fetch()`, not browser navigation. Redirect would confuse the client. Let the component do `router.push()` after `login()` resolves true.
- **`secure: true` on all cookies in dev:** Silently dropped on `http://localhost`. Use `secure: process.env.NODE_ENV === 'production'` as in `lib/auth0.ts:49`.
- **Conditional React Hook call in `useLogin.login` for empty body:** Fetch body: `payload ? JSON.stringify(payload) : undefined` is fine but note that `undefined` body means no `Content-Type` header is needed (server must be tolerant). Route handler must handle absent body — see Pattern 8.
- **Polling `/api/auth/api-keys` on interval:** Not needed. Manual refetch after create/revoke is sufficient.
- **Showing the revealed key inside a toast:** Keys can be 64+ chars; toasts aren't scrollable/selectable. Reveal view inside modal is correct.
- **Reusing phase 157 tests wholesale without adding extension cases:** D-15 explicitly requires new tests for body parsing + cookie set behavior. Don't delete existing tests; append.

### Pattern 8: Tolerant Body Parsing in Route Handler (D-02 / D-15)

**What:** The modified `/api/auth/login` must accept three request shapes without error:
1. No body at all
2. Empty JSON `{}`
3. JSON `{ username, password }`

**Example:**
```typescript
// app/api/auth/login/route.ts — MODIFIED per D-15
import { cookies } from 'next/headers';
import { withAuthAndErrorHandler, success } from '@/lib/core';
import { login } from '@/lib/auth/authProxy';
import { ApiError, ERROR_CODES, HTTP_STATUS } from '@/lib/core/apiErrors';

interface LoginBody {
  username?: string;
  password?: string;
}

export const dynamic = 'force-dynamic';

export const POST = withAuthAndErrorHandler(async (request) => {
  // Tolerant body parse: empty body, empty object, or full credentials all valid
  let body: LoginBody = {};
  try {
    const text = await request.text();
    if (text.trim().length > 0) {
      body = JSON.parse(text) as LoginBody;
    }
  } catch {
    throw ApiError.badRequest('Invalid JSON body');
  }

  // Select credentials: body takes precedence, env vars fallback (D-02)
  const username = body.username ?? process.env.HA_ADMIN_USER;
  const password = body.password ?? process.env.HA_ADMIN_PASSWORD;

  if (!username || !password) {
    throw new ApiError(
      ERROR_CODES.EXTERNAL_API_ERROR,
      'HA proxy auth not configured: missing credentials',
      HTTP_STATUS.INTERNAL_SERVER_ERROR
    );
  }

  await login(username, password);  // throws ApiError(UNAUTHORIZED) on bad creds
  // T-157-01 preserved: access_token discarded, never returned

  const cookieStore = await cookies();
  cookieStore.set('ha_auth', '1', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60,
  });

  return success({ authenticated: true });
}, 'Auth/Login');
```

**Why not `request.json()` directly:** `request.json()` throws on empty body in Next 16. Reading text first, checking nonempty, then parsing is the defensive pattern. [ASSUMED — inferred from fetch API behavior; plan-phase may use try/catch on `request.json()` as alternative]

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Session cookie mechanics | Custom `Set-Cookie` header concatenation | `cookies().set()` from `next/headers` | Next.js 16 native API handles encoding, SameSite stringification, Secure/HttpOnly flags, Expires↔Max-Age interplay correctly. [CITED: Next docs] |
| Form validation | Hand-rolled field validators | `zod` + `@hookform/resolvers/zod` + `react-hook-form` | Already installed; `FormModal` expects this stack; Zod gives TS inference for free. |
| Modal UX | Custom dialog with manual focus trap | `FormModal` (form) and `ConfirmationDialog` (danger) from `app/components/ui/` | Built on Radix UI Dialog — focus management, ESC, scrim, mobile bottom-sheet all handled. |
| DataTable | `<table>` + manual sort | `DataTable` from `app/components/ui/` | TanStack Table under the hood; Italian locale sort; Badge/Button cells are standard. |
| Italian relative time | Custom "X minutes ago" math | `formatRelativeTime` / `useRelativeTime` from `lib/hooks/useRelativeTime.ts` | Already live-refreshes every 10s; "Adesso" / "Ns fa" / "Nm fa" / "Nh fa" strings are project-standard. |
| Copy-to-clipboard | Manual `document.execCommand('copy')` | `navigator.clipboard.writeText()` | Standard browser API; project already uses this in `CopyableIp`. |
| Toast notifications | Custom toast queue | `useToast()` hook | Lives in ToastProvider (app-wide). 4 severities available. |
| Icon set | Inline SVG | `lucide-react` — `KeyRound`, `Copy`, `Check`, `X`, `AlertTriangle`, `Eye`, `EyeOff` | Already loaded; tree-shaken per icon. |
| Auth0 session check | Custom JWT parse | `useUser()` (client) / `auth0.getSession(request)` (server) | Auth0 SDK v4 handles all edge cases (refresh, expiry). |

**Key insight:** 100% of primitives exist. The only genuinely new code is the two hooks (~80 LOC each) and the two pages (~150 LOC each). Everything else is composition and wiring.

---

## Runtime State Inventory

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | None — API keys live in the HA proxy backend, not in Firebase/Firestore/localStorage/IndexedDB in this app | None |
| Live service config | None — HA proxy is the single source of truth; no Next.js-side config stores API-key metadata | None |
| OS-registered state | None | None |
| Secrets/env vars | `HA_ADMIN_USER`, `HA_ADMIN_PASSWORD`, `HA_API_URL` (all consumed by `lib/auth/authProxy.ts` — phase 157) — **unchanged**; `BYPASS_AUTH` (dev Auth0 bypass) — coexists, no change | Plan must verify no new env var is introduced; cookie name `ha_auth` is hardcoded not env-driven |
| Build artifacts | None — no compiled binaries or generated files depend on auth state | None |

**Nothing found in any category beyond env vars:** Verified by `grep -rln "ha_auth"` returning zero matches in `lib/` and `app/` and no persistent storage of API keys anywhere in the codebase. The cookie is introduced fresh by phase 170. [VERIFIED: grep 2026-04-23]

---

## Common Pitfalls

### Pitfall 1: `secure: true` cookie silently dropped in localhost dev
**What goes wrong:** Dev loads `/settings/api-keys`, submits login, route returns 200, but `document.cookie` never shows `ha_auth` because browsers reject `Secure` cookies on HTTP.
**Why it happens:** Default-safe instinct says `secure: true`.
**How to avoid:** `secure: process.env.NODE_ENV === 'production'` — matches `lib/auth0.ts:49` established convention.
**Warning signs:** Login appears to succeed but every subsequent page load redirects to `/login`.

### Pitfall 2: `cookies()` called without `await` in Next.js 16
**What goes wrong:** TypeScript error "Property 'set' does not exist on type 'Promise<ReadonlyRequestCookies>'" or silent runtime failure.
**Why it happens:** Next.js 14 had sync `cookies()`; Next.js 15+ made it async.
**How to avoid:** Always `const cookieStore = await cookies();`. [CITED: Context7 /vercel/next.js docs]
**Warning signs:** `tsc` errors on any route handler that touches cookies.

### Pitfall 3: `/login` page path colliding with Auth0's `/auth/login`
**What goes wrong:** User clicks "API Keys" → middleware redirects to `/auth/login` (Auth0) instead of the new `/login` (HA-proxy form).
**Why it happens:** Auth0 SDK v4 config in `lib/auth0.ts:57` has `routes: { login: '/auth/login' }`. This is Auth0's OAuth-handoff route, not a page.
**How to avoid:** The new page IS at `/login` (D-05), not `/auth/login`. They're distinct paths. Playwright smoke must distinguish.
**Warning signs:** `page.goto('/login')` lands on Auth0 Universal Login instead of the HA-proxy form.

### Pitfall 4: `request.json()` throws on empty body
**What goes wrong:** Empty POST to `/api/auth/login` (D-02 env-fallback mode) returns 500.
**Why it happens:** `fetch` with `body: undefined` sends no body; `request.json()` throws `SyntaxError: Unexpected end of JSON input`.
**How to avoid:** Read `request.text()` first, check `length > 0`, then parse. See Pattern 8.
**Warning signs:** Phase 157 test suite green but new "empty body" test fails.

### Pitfall 5: Plaintext key left in React state after modal close
**What goes wrong:** User creates key, closes modal, re-opens modal — plaintext from previous creation still visible.
**Why it happens:** `setRevealedKey(null)` not called in `handleClose`.
**How to avoid:** In `handleClose`, call `setRevealedKey(null)` BEFORE `onClose()`. CONTEXT D-10 mandates this.
**Warning signs:** Jest test "plaintext-key-once-visible" fails on re-open assertion.

### Pitfall 6: Auth0 session active but HA cookie expired → 401 on refetch
**What goes wrong:** User has valid Auth0 session, loads `/settings/api-keys`, refetch call returns 401 (HA cookie expired), UI shows generic "error" banner instead of re-auth prompt.
**Why it happens:** Single error sentinel can't distinguish.
**How to avoid:** In `useApiKeys.refetch`, check `res.status === 401` and set `error = 'SESSION_EXPIRED'`. Component layer displays a dedicated "session expired" banner with re-login CTA (D-04).
**Warning signs:** User clicks "Revoke" → gets "Errore" toast → has to manually navigate to /login.

### Pitfall 7: Playwright `page.route()` not distinguishing POST vs GET on same path
**What goes wrong:** Mock for `GET /api/auth/api-keys` intercepts `POST /api/auth/api-keys` too.
**Why it happens:** `page.route()` matches by URL regardless of method unless you check `route.request().method()` inside the handler.
**How to avoid:** Inside `page.route(url, handler)`, branch on `route.request().method()` before calling `route.fulfill()`.
**Warning signs:** Create-key test receives list-response body.

### Pitfall 8: Navbar `KeyRound` entry showing in mobile but not desktop (or vice versa)
**What goes wrong:** Navbar has TWO render blocks (desktop nav lines ~267-430 + mobile menu lines ~542-650). Adding to one and forgetting the other causes asymmetric nav.
**Why it happens:** `app/components/Navbar.tsx` renders menu items twice: one in `<nav>` (hidden currently, per line 268) and once in mobile panel.
**How to avoid:** Add the entry by extending `getNavigationStructureWithPreferences` (`lib/devices/deviceRegistry.ts`) or the nav-structure data source — both render blocks consume the same structure. OR add explicitly to both blocks. Run Playwright smoke on both viewports.
**Warning signs:** Desktop test green, mobile test missing the entry.

### Pitfall 9: Italian relative-time format mismatch between `Date.parse()` and ISO timezone
**What goes wrong:** `last_used_at: "2026-03-22T15:30:00Z"` parses fine in Chrome but relative time shows negative value in edge cases (clock skew).
**Why it happens:** `Date.parse()` on ISO 8601 with `Z` is spec-compliant; if HA proxy omits `Z` the string is treated as local time.
**How to avoid:** Verify HA proxy always appends `Z` (the auth.md example shows `Z`). If in doubt, add defensive `new Date(str).getTime()` with NaN check.
**Warning signs:** "Creato in 3s" (future) instead of "3s fa".

### Pitfall 10: 429 rate limit toast fires on every fetch instead of once per lockout window
**What goes wrong:** User mashes login button; 10+ toasts appear.
**Why it happens:** Toast triggered unconditionally in error branch.
**How to avoid:** Check `rateLimitedUntil` state in `useLogin.login()`; early-return `false` before fetching. Component only calls `login` when form submits — but also disable the submit button visually. Both belt and suspenders.
**Warning signs:** Toast stacking; e2e test counts > 1 toast.

---

## Code Examples

### Example: Full `/login` page (skeleton)
```typescript
// app/login/page.tsx
'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useLogin } from '@/app/hooks/useLogin';
import { useToast } from '@/app/hooks/useToast';
import SettingsLayout from '@/app/components/SettingsLayout';
import Input from '@/app/components/ui/Input';
import Button from '@/app/components/ui/Button';
import Card from '@/app/components/ui/Card';

const loginSchema = z.object({
  username: z.string().min(1, 'Username obbligatorio').max(64),
  password: z.string().min(1, 'Password obbligatoria'),
});

type LoginValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const search = useSearchParams();
  const next = search.get('next') ?? '/settings/api-keys';
  const { login, loading, error, rateLimitedUntil } = useLogin();
  const { success: toastSuccess, error: toastError } = useToast();

  const form = useForm<LoginValues>({
    defaultValues: { username: '', password: '' },
    resolver: zodResolver(loginSchema),
    mode: 'onBlur',
  });

  const onSubmit = async (data: LoginValues) => {
    const ok = await login(data);
    if (ok) {
      toastSuccess('Accesso effettuato');
      router.push(next);
    } else if (error === 'RATE_LIMITED') {
      toastError('Troppi tentativi, riprova tra un minuto');
    } else if (error === 'INVALID_CREDENTIALS') {
      toastError('Credenziali non valide');
    } else {
      toastError('Errore durante l\'accesso');
    }
  };

  const submitDisabled = loading || Date.now() < rateLimitedUntil;

  return (
    <SettingsLayout title="Accedi" icon="🔐" showBackButton={false}>
      <Card variant="glass" className="max-w-md mx-auto p-6">
        <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="space-y-4">
          <Controller
            name="username"
            control={form.control}
            render={({ field, fieldState }) => (
              <Input label="Username" autoComplete="username" {...field} error={fieldState.error?.message} />
            )}
          />
          <Controller
            name="password"
            control={form.control}
            render={({ field, fieldState }) => (
              <Input label="Password" type="password" autoComplete="current-password" {...field} error={fieldState.error?.message} />
            )}
          />
          <Button type="submit" variant="ember" loading={loading} disabled={submitDisabled} className="w-full">
            Accedi
          </Button>
        </form>
      </Card>
    </SettingsLayout>
  );
}
```

### Example: Playwright `page.route()` mock for auth-ui.spec.ts
```typescript
// tests/features/auth-ui.spec.ts (NEW — D-22)
import { test, expect } from '@playwright/test';

test.describe('Auth UI — full happy path (mocked)', () => {
  test.beforeEach(async ({ page }) => {
    // Mock all /api/auth/* routes — branch on method
    await page.route('**/api/auth/login', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 200,
          headers: { 'set-cookie': 'ha_auth=1; HttpOnly; Path=/; SameSite=Lax' },
          contentType: 'application/json',
          body: JSON.stringify({ authenticated: true }),
        });
      } else {
        await route.continue();
      }
    });

    await page.route('**/api/auth/api-keys', async (route) => {
      const m = route.request().method();
      if (m === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            keys: [{ id: 1, name: 'Existing', created_at: '2026-04-20T10:00:00Z', last_used_at: null, is_active: true }],
            count: 1,
          }),
        });
      } else if (m === 'POST') {
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 2,
            name: 'Nuova',
            api_key: 'ha_live_REVEALED_PLAINTEXT_ABCD1234',
            created_at: '2026-04-23T12:00:00Z',
          }),
        });
      }
    });

    await page.route(/\/api\/auth\/api-keys\/\d+/, async (route) => {
      if (route.request().method() === 'DELETE') {
        await route.fulfill({ status: 204 });
      }
    });
  });

  test('login → list → create → reveal → close → revoke', async ({ page }) => {
    await page.goto('/settings/api-keys');
    // Expect redirect to /login (HA cookie absent)
    await expect(page).toHaveURL(/\/login/);
    await page.getByLabel('Username').fill('admin');
    await page.getByLabel('Password').fill('secret');
    await page.getByRole('button', { name: 'Accedi' }).click();
    await expect(page).toHaveURL('/settings/api-keys');
    // List renders
    await expect(page.getByText('Existing')).toBeVisible();
    // Create flow
    await page.getByRole('button', { name: /Crea/i }).click();
    await page.getByLabel('Nome').fill('Nuova');
    await page.getByRole('button', { name: 'Crea' }).click();
    // Plaintext reveal
    await expect(page.getByText(/ha_live_REVEALED_PLAINTEXT_ABCD1234/)).toBeVisible();
    // Close reveal
    await page.getByRole('button', { name: 'Chiudi' }).click();
    // Plaintext gone
    await expect(page.getByText(/ha_live_REVEALED_PLAINTEXT_ABCD1234/)).not.toBeVisible();
    // Revoke
    await page.getByRole('button', { name: 'Revoca' }).first().click();
    await page.getByRole('button', { name: 'Revoca' }).last().click();  // confirm dialog
    await expect(page.getByText(/revocata/i)).toBeVisible();
  });
});
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `cookies()` sync | `await cookies()` async | Next.js 15.0 (late 2024) | All cookie access must be awaited |
| `request.cookies.get()` in route handler | `(await cookies()).get()` from `next/headers` | Next.js 15.0 | Consistent server-side cookie access in route handlers, pages, and server functions |
| JSON body login (OAuth2) | Form-encoded body (OAuth2 PasswordRequestForm) | FastAPI/HA proxy standard since day 1 | Phase 157 `authProxy.login()` already handles form-encoding internally — no client-side impact |
| Optimistic UI for destructive actions | Server-confirmed updates | Registry pattern established phase 118-125 | Safety bias for revoke; matches D-11 |
| Multiple password hashing in client | Server-only credential handling | OWASP ASVS | Client never computes hashes; form sends plaintext over HTTPS (or HTTP in dev) |

**Deprecated/outdated in this codebase:**
- **Phase 157 tests for `/api/auth/login` that assume no body:** Must be extended, not kept as-is, because D-15 adds body parsing. The existing 3 tests remain relevant (env fallback path) but need new sibling tests for `{username, password}` path and cookie assertion.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `maxAge: 60 * 60` (1 hour) for `ha_auth` cookie is appropriate | Pattern 1 | Low — plan-phase/user may pick 15min–24h without breaking anything. Requires no research adjustment. |
| A2 | Error sentinels (`'RATE_LIMITED'`, `'INVALID_CREDENTIALS'`) are the right abstraction boundary between hook and component | Pattern 7 | Low — alternative is to return error objects or translated strings. Pure style choice. |
| A3 | Reading `request.text()` then parsing is needed for tolerant empty-body handling in Next.js 16 | Pattern 8 + Pitfall 4 | Medium — Next.js 16 could have been upgraded with `request.json()` that returns null on empty body. Plan-phase should test both approaches. Verification: write the test first, observe behavior. |
| A4 | HA proxy returns `last_used_at` in UTC with trailing `Z` | Pitfall 9 | Low — `docs/api/auth.md:160` shows `"2026-03-22T15:30:00Z"` explicitly. Treat as confirmed. |
| A5 | Cookie name `ha_auth` is final (not configurable via env) | Runtime State | Low — CONTEXT.md suggests `ha_auth` in D-01 with "cookie name exactly" noted under Claude's Discretion. Plan-phase may rename. |
| A6 | The mobile + desktop navbar render blocks both consume a shared nav-structure source (`getNavigationStructureWithPreferences`) | Pitfall 8 | Medium — if they don't, the entry must be added to both. Plan-phase should read `lib/devices/deviceRegistry.ts:getNavigationStructureWithPreferences` and confirm or branch. |
| A7 | Playwright auth.setup.ts authenticates via Auth0 for all specs, meaning `/login` + `/settings/api-keys` will NOT hit the HA-cookie gate in smoke tests (only the full mocked auth-ui.spec.ts does) | Validation Architecture | Low — that's the intended decomposition. Smoke asserts pages render at all; full spec asserts the HA-cookie flow via mocks. |

**Impact for planner:** All assumptions are low-to-medium risk; none block plan creation. Assumption A6 deserves a 5-minute grep by the planner or first executor to confirm which approach to use for nav entry.

---

## Open Questions (RESOLVED)

1. **Auth0 `useUser()` vs server-side `auth0.getSession()` for page guard on `/settings/api-keys`?**
   - What we know: `app/settings/thermostat/page.tsx:16` uses `useUser()` client-side with an `isLoading` check + `router.push('/auth/login')` redirect on `user === null`. Pattern proven.
   - What's unclear: Whether phase 170 should prefer this or switch to a server-component page with `auth0.getSession(request)` for earlier redirect.
   - Recommendation: Match the existing pattern (`useUser()`). Consistency beats micro-optimization here. Plan-phase can revisit.
   - **— RESOLVED:** Use client-side Auth0 `useUser()` pattern matching `app/settings/thermostat/page.tsx:16` (loading state + redirect on `!user`). This is what Plan 03 implements.

2. **Where is `getNavigationStructureWithPreferences` and does it need a new category for `/settings/api-keys`?**
   - What we know: `app/components/Navbar.tsx:6` imports from `@/lib/devices/deviceRegistry`.
   - What's unclear: Whether the function already has a "settings" submenu slot that would accept a new entry, or whether it needs extension.
   - Recommendation: Planner reads `lib/devices/deviceRegistry.ts` during plan creation; one 30-second grep resolves this. Plan should include explicit `lib/devices/deviceRegistry.ts` modification in file list if needed.
   - **— RESOLVED:** Extend `lib/devices/deviceTypes.ts` `GLOBAL_SECTIONS` array — the single data source feeds both desktop nav (`Navbar.tsx` line 321 region) and mobile drawer (line 561 region). No changes to `deviceRegistry.ts` or `getNavigationStructureWithPreferences` required. Assumption A6 confirmed by pattern-mapper.

3. **Should the phase 157 `login/route.test.ts` tests be modified in-place or extended with new `describe` blocks?**
   - What we know: Three existing tests cover the env-var-only flow (`test 1: success`, `test 2: 401 propagation`, `test 3: missing env`).
   - What's unclear: CONTEXT D-15 says "extended, not rewritten". Best practice: keep existing describe block verbatim, add a second `describe('POST /api/auth/login — body + cookie [phase 170]', () => {...})` block.
   - Recommendation: The latter (two describe blocks) — preserves git blame for phase 157 tests and makes the delta obvious.
   - **— RESOLVED:** Use two describe blocks — preserves git blame for phase 157 tests and makes the phase 170 delta obvious. This is what Plan 01 implements.

4. **Is `navigator.clipboard.writeText()` available in Playwright's Chromium without an explicit permission grant?**
   - What we know: Playwright default Chromium context does not auto-grant clipboard-write permissions.
   - What's unclear: Whether the test `await context.grantPermissions(['clipboard-read', 'clipboard-write'])` is needed in `tests/features/auth-ui.spec.ts` for the copy-button verification. [CITED: Playwright docs — permissions context]
   - Recommendation: Plan-phase includes a permission grant in `beforeEach` OR asserts the copy-button click triggers UI state change (checkmark icon) without verifying clipboard content. The latter is cleaner and matches the existing `CopyableIp.test.tsx` approach (asserts `aria-label` change, not clipboard contents).
   - **— RESOLVED:** Playwright will NOT `grantPermissions(['clipboard-write'])` in the feature spec; we assert UI state change (icon swap from Copy → Check after click) per `CopyableIp.test.tsx` pattern. Clipboard contents are verified via the manual UAT item in VALIDATION.md.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js ≥ 18 | Next.js 16 | ✓ (assumed — project running) | — | — |
| `npm` / lockfile-managed deps | All tooling | ✓ | See `package.json` | — |
| `next` | Framework | ✓ | 16.1.0 (installed) | — |
| `react` | Runtime | ✓ | 19.2.0 | — |
| `react-hook-form` + `@hookform/resolvers` | Forms | ✓ | 7.73.1 + 5.2.2 | — |
| `zod` | Validation | ✓ | 3.24.2 | — |
| `@auth0/nextjs-auth0` | Auth0 gate | ✓ | 4.13.1 | — |
| `@playwright/test` | E2E | ✓ | 1.52.0 | — |
| `lucide-react` | Icons | ✓ (already imports 4+ icons) | 0.562.0 | — |
| Existing `FormModal`, `ConfirmationDialog`, `DataTable`, `SettingsLayout`, `Input`, `Button`, `Card`, `Badge` components | UI | ✓ | — | — |
| Existing `useToast`, `useRelativeTime` hooks | UX | ✓ | — | — |
| Existing `lib/auth/authProxy.ts` + routes | Backend | ✓ | Phase 157 | — |
| HA proxy backend at `HA_API_URL` | Runtime | Out-of-scope for this research (deployment concern) | — | Mock via `page.route()` for Playwright; Jest mocks `login` directly |

**Missing dependencies with no fallback:** None.

**Missing dependencies with fallback:** None.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Unit framework | Jest 29.x + @testing-library/react + @testing-library/user-event |
| E2E framework | Playwright 1.52.0 |
| Unit config file | `jest.config.cjs` (root), `jest.setup.ts` (polyfills + mocks) |
| E2E config file | `playwright.config.ts` (root), `tests/auth.setup.ts` (Auth0 login) |
| Quick run command (unit) | `npm test -- __tests__/app/login __tests__/app/settings/api-keys __tests__/hooks/useLogin __tests__/hooks/useApiKeys __tests__/api/auth` |
| Quick run command (E2E) | `npx playwright test tests/smoke/page-loads.spec.ts tests/features/auth-ui.spec.ts` |
| Full suite command | `npm test && npx playwright test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| AUTH-01 | `POST /api/auth/login` with `{username, password}` body calls `login()` with those values, discards token, sets `ha_auth` cookie, returns `{authenticated: true}` | unit (route) | `npm test -- __tests__/api/auth/login/route.test.ts` | ❌ Wave 0 — existing file must be EXTENDED with 3+ new cases |
| AUTH-01 | `POST /api/auth/login` with empty body falls back to env vars (phase 157 behavior) | unit (route) | `npm test -- __tests__/api/auth/login/route.test.ts` | ✅ Exists (preserve existing cases) |
| AUTH-01 | `POST /api/auth/login` returns 429 when HA proxy rate-limits | unit (route) | `npm test -- __tests__/api/auth/login/route.test.ts` | ❌ Wave 0 |
| AUTH-01 | `useLogin.login()` POSTs to `/api/auth/login`, returns true on 200, sets RATE_LIMITED error on 429 with 30s lockout, sets INVALID_CREDENTIALS on 401 | unit (hook) | `npm test -- __tests__/hooks/useLogin.test.ts` | ❌ Wave 0 |
| AUTH-01 | `/login` page renders form, submits, calls hook, redirects on success, shows rate-limit toast on 429 | unit (component) | `npm test -- __tests__/app/login/page.test.tsx` | ❌ Wave 0 |
| AUTH-01 | `/login` page loads at all (structural smoke) | e2e smoke | `npx playwright test tests/smoke/page-loads.spec.ts -g "/login"` | ❌ Wave 0 (extend existing spec) |
| AUTH-01 | Full flow: visit `/settings/api-keys` unauth → redirect `/login` → submit → land on `/settings/api-keys` with `ha_auth=1` cookie mocked | e2e feature | `npx playwright test tests/features/auth-ui.spec.ts -g "login"` | ❌ Wave 0 |
| AUTH-01 | POST /api/auth/logout deletes `ha_auth` cookie and returns `{authenticated: false}` | unit (route) | `npm test -- __tests__/api/auth/logout/route.test.ts` | ❌ Wave 0 |
| AUTH-02 | `useApiKeys.create(name)` POSTs to `/api/auth/api-keys` with `{name}`, returns `APIKeyResponse` with `api_key` | unit (hook) | `npm test -- __tests__/hooks/useApiKeys.test.ts` | ❌ Wave 0 |
| AUTH-02 | `ApiKeysPage` create modal: submit → server responds 201 → reveal view shown with plaintext → copy button functional → close clears plaintext from DOM | unit (component) | `npm test -- __tests__/app/settings/api-keys/page.test.tsx` | ❌ Wave 0 |
| AUTH-02 | Full flow: click "Crea" → enter name → submit → plaintext revealed once → close → re-open → plaintext not pre-filled | e2e feature | `npx playwright test tests/features/auth-ui.spec.ts -g "create.*reveal"` | ❌ Wave 0 |
| AUTH-02 | Zod schema rejects empty name (client-side; server-side covered in phase 157) | unit (component) | `npm test -- __tests__/app/settings/api-keys/page.test.tsx -t "empty name"` | ❌ Wave 0 |
| AUTH-03 | `useApiKeys.refetch()` GETs `/api/auth/api-keys` and updates `keys` state; 401 sets SESSION_EXPIRED error | unit (hook) | `npm test -- __tests__/hooks/useApiKeys.test.ts` | ❌ Wave 0 |
| AUTH-03 | `ApiKeysPage` renders 5-column DataTable with id/name/created_at/last_used_at/is_active/actions; empty state shows "Nessuna API key" copy | unit (component) | `npm test -- __tests__/app/settings/api-keys/page.test.tsx -t "list"` | ❌ Wave 0 |
| AUTH-03 | `last_used_at: null` renders "Mai usata" Italian text | unit (component) | `npm test -- __tests__/app/settings/api-keys/page.test.tsx -t "Mai usata"` | ❌ Wave 0 |
| AUTH-03 | `/settings/api-keys` page loads at all (structural smoke with mocked HA cookie) | e2e smoke | `npx playwright test tests/smoke/page-loads.spec.ts -g "api-keys"` | ❌ Wave 0 |
| AUTH-03 | Full flow: list renders 2 mocked keys with correct columns | e2e feature | `npx playwright test tests/features/auth-ui.spec.ts -g "list"` | ❌ Wave 0 |
| AUTH-04 | `useApiKeys.revoke(id)` DELETEs `/api/auth/api-keys/{id}`; 404 is not an error | unit (hook) | `npm test -- __tests__/hooks/useApiKeys.test.ts -t "revoke"` | ❌ Wave 0 |
| AUTH-04 | `ApiKeysPage` revoke: click Revoca → confirmation dialog (danger variant) → confirm → DELETE called → list refetched → toast shown | unit (component) | `npm test -- __tests__/app/settings/api-keys/page.test.tsx -t "revoke"` | ❌ Wave 0 |
| AUTH-04 | Full flow: click Revoca → confirm → key removed from list on next refetch | e2e feature | `npx playwright test tests/features/auth-ui.spec.ts -g "revoke"` | ❌ Wave 0 |
| AUTH-04 | Revoking already-revoked key (404) does not show error toast | unit (component) | `npm test -- __tests__/app/settings/api-keys/page.test.tsx -t "already revoked"` | ❌ Wave 0 |

### Sampling Rate

- **Per task commit:** `npm test -- <relevant test files>` (quick run, < 15s for auth subset)
- **Per wave merge:** `npm test && npx playwright test tests/smoke/page-loads.spec.ts` (full Jest + smoke subset)
- **Phase gate:** Full suite green before `/gsd-verify-work` — `npm test && npx playwright test`

### Manual Verification

Certain behaviors cannot be automated and require human verification before phase closeout:

| Req ID | Manual Check | Justification |
|--------|--------------|---------------|
| AUTH-01 | Actual browser flow against real HA proxy (stage/prod): login sets cookie observable in DevTools → Application → Cookies | Cookie httpOnly flag cannot be directly inspected by JS; Playwright can assert Set-Cookie header but real browser behavior (cross-browser, cross-device) needs smoke |
| AUTH-02 | Create a real API key via UI, verify via `curl -H "X-API-Key: <plaintext>" <HA proxy URL>` that the key works | Plaintext only shown once; cannot be re-inspected via API list endpoint — correctness of `api_key` value is impossible to unit-test |
| AUTH-04 | Revoked key returns 401 when used in a subsequent request | End-to-end side effect — the key's state on the HA proxy is not introspectable from our app |
| D-10 UX | Copy-to-clipboard button actually populates clipboard | Clipboard permissions differ by browser; OS-level paste test is the only reliable verification |

These manual checks are enumerated in the phase VERIFICATION.md as human-verification UAT items per project convention.

### Wave 0 Gaps

- [ ] `__tests__/hooks/useLogin.test.ts` — covers AUTH-01
- [ ] `__tests__/hooks/useApiKeys.test.ts` — covers AUTH-02, AUTH-03, AUTH-04
- [ ] `__tests__/app/login/page.test.tsx` — covers AUTH-01 (component)
- [ ] `__tests__/app/settings/api-keys/page.test.tsx` — covers AUTH-02, AUTH-03, AUTH-04 (component)
- [ ] `__tests__/api/auth/login/route.test.ts` — **EXTEND** existing (3 new cases: body-provided path, cookie-set assertion, 429 propagation)
- [ ] `__tests__/api/auth/logout/route.test.ts` — **NEW** — covers AUTH-01 (logout)
- [ ] `tests/smoke/page-loads.spec.ts` — **EXTEND** with 2 new tests (`/login`, `/settings/api-keys`)
- [ ] `tests/features/auth-ui.spec.ts` — **NEW** — full mocked happy path (D-22)
- [ ] Framework install: none needed — all testing deps already present

---

## Security Domain

Security enforcement is enabled by default (no `security_enforcement: false` in `.planning/config.json`). Auth UI is a high-sensitivity surface and every phase-170 change must preserve or improve the phase-157 security posture.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | YES | Primary: Auth0 SDK v4 (library-managed); Secondary: HA proxy OAuth2 PasswordRequestForm via `authProxy.login` |
| V3 Session Management | YES | Primary: Auth0 `appSession` cookie (httpOnly, secure in prod, sameSite=lax, 1d rolling/7d absolute); Secondary: `ha_auth=1` httpOnly marker (1h max-age) |
| V4 Access Control | YES | `withAuthAndErrorHandler` wraps every `/api/auth/*` route; `/settings/api-keys` page guarded by both Auth0 (`useUser()`) and HA cookie presence |
| V5 Input Validation | YES | Zod schemas on both forms (login: username 1-64, password ≥1; create: name 1-100); server-side validation preserved from phase 157 |
| V6 Cryptography | YES (indirect) | Passwords transmitted over HTTPS to HA proxy (in prod); no client-side crypto. **Never hand-roll.** |
| V7 Error Handling & Logging | YES | `handleError` converts exceptions to standardized API responses; no stack traces or internal details leaked to client; 401/403/429 mapped to generic Italian copy |
| V9 Communications | YES | HTTPS-only cookies in production (`secure: true`); HTTP cookies only in localhost dev |
| V13 API & Web Service | YES | All four auth routes Auth0-guarded; RFC 9457 error responses; `dynamic = 'force-dynamic'` prevents caching of auth-sensitive responses |
| V14 Configuration | YES | Secrets (HA_ADMIN_USER/PASSWORD, HA_API_URL) in env vars only; never in client bundle |

### Known Threat Patterns for this Stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| JWT leakage via response body or logs | Information Disclosure | T-157-01 enforced: login route discards `access_token`; mandatory regression test asserts response body is `{authenticated: true}` only |
| Session fixation via cookie reuse | Spoofing | `ha_auth` rotated on every login (new value written); logout explicitly deletes — no long-lived deterministic value |
| CSRF on `POST /api/auth/login` and `POST /api/auth/api-keys` | Tampering | `sameSite: 'lax'` cookie blocks cross-origin POSTs; Auth0 session cookie also `sameSite=lax`; state-changing operations require valid session cookies |
| Brute-force credential stuffing | DoS / Info Disclosure | HA proxy enforces 10 req/min; client-side 30s lockout on 429 (D-18) adds a second layer; unit-test asserts lockout behavior |
| Clickjacking on `/login` | Tampering | Existing middleware (not modified in this phase) sets `X-Frame-Options: DENY` — verify inherited; no new iframe surface introduced |
| XSS via plaintext API key rendering | Info Disclosure / Tampering | `api_key` rendered inside `<code>` with text interpolation — no `dangerouslySetInnerHTML`; React escapes by default; clipboard copy uses `navigator.clipboard.writeText()` |
| Plaintext key retained in React component tree after modal close | Info Disclosure | D-10 mandates `setRevealedKey(null)` in `handleClose`; dedicated test case verifies plaintext not in DOM after close |
| 429 sentinel used for timing-attack oracle | Info Disclosure | HA proxy returns same 429 for any credential; no timing differentiation between "user exists" and "user not found" visible to client |
| Accidentally adding plaintext logs of credentials or tokens | Info Disclosure | Route handlers use `withErrorHandler` which logs only ApiError metadata (code, status), not request body; `handleError` strips sensitive payloads |
| httpOnly cookie read attempt via client JS | Info Disclosure | Browser-enforced — not a code-level mitigation but a guarantee (cookie is httpOnly); any attempt to read `document.cookie` for `ha_auth` returns empty string |
| Cookie scope too broad (path: '/api' vs path: '/') | Authorization | Set `path: '/'` — cookie accompanies page navigations too, allowing server components to check auth state |

### Phase-Specific Security Assertions

The planner MUST include these assertions as test cases or verification steps:

1. **T-157-01 regression test extension:** Assert modified `/api/auth/login` route's response body is exactly `{authenticated: true}` — no `access_token`, `user`, or any other field.
2. **Cookie attributes assertion:** Mock the `cookies().set()` call in Jest; assert it was called with `httpOnly: true`, `sameSite: 'lax'`, `path: '/'`, and `secure: process.env.NODE_ENV === 'production'` (or whatever the plan decides).
3. **Plaintext-key not persisted assertion:** After modal close in component test, `screen.queryByText(/ha_live_/)` returns null.
4. **Logout clears cookie assertion:** Jest test asserts `cookies().delete('ha_auth')` (or `set('ha_auth', '', {maxAge: 0})`) is called.
5. **Rate-limit 429 lockout:** Hook test asserts submit returns false immediately during lockout window without calling fetch.

---

## Project Constraints (from CLAUDE.md)

Phase 170 must honor these project-global rules:

- **NEVER break existing functionality** — Phase 157's 20 tests must remain green. Extension of `login/route.test.ts` preserves existing cases.
- **WAIT for user confirmation before version updates** — No new deps; no upgrades required.
- **PREFER editing existing files over creating new** — New files are limited to those listed in CONTEXT.md's `## Existing Code Insights`; only what's strictly necessary (2 pages, 2 hooks, 1 route, 1 modified route, 1 modified navbar).
- **NEVER execute `npm run build` or `npm install`** — No build or install steps in any task action.
- **ALWAYS create/update unit tests** — Every new file in `app/` or `lib/` ships with a matching test in `__tests__/`.
- **USE design system → `/debug/design-system`** — Use existing variants (`variant="ember"`, `variant="danger"`, etc.); no new variants added.
- **NEVER commit/push without explicit request** — Plan task actions may commit after work but must not push.
- **Firebase `filterUndefined` pattern** — N/A for this phase (no Firebase writes).
- **`export const dynamic = 'force-dynamic'`** — Applies to both modified and new API routes.
- **`'use client'` for client components** — All pages, hooks, and the reveal modal are client-side.
- **UI: Variants only (no custom Tailwind overrides)** — All styling flows through `Card`, `Button`, `Input`, etc. variants.

---

## Sources

### Primary (HIGH confidence)
- [VERIFIED] `docs/api/auth.md` — HA proxy auth spec: 4 endpoints, form-encoded login, plaintext-once rule, TypeScript interfaces
- [VERIFIED] `.planning/phases/157-auth-module/157-CONTEXT.md` — Phase 157 locked decisions (D-01..D-08)
- [VERIFIED] `.planning/phases/157-auth-module/157-01-SUMMARY.md` — Phase 157 deliverables (9 files, 20 tests, 2 commits)
- [VERIFIED] `.planning/phases/170-auth-ui/170-CONTEXT.md` — Phase 170 locked decisions (D-01..D-24)
- [VERIFIED] `app/api/auth/login/route.ts`, `/api-keys/route.ts`, `/api-keys/[keyId]/route.ts` — existing backend
- [VERIFIED] `lib/auth/authProxy.ts`, `types/authProxy.ts` — proxy client + types
- [VERIFIED] `app/registry/types/page.tsx` — closest analog (read in full)
- [VERIFIED] `app/registry/devices/page.tsx` — second analog with delete flow (read in full)
- [VERIFIED] `app/components/ui/FormModal.tsx`, `ConfirmationDialog.tsx`, `SettingsLayout.tsx` — primitives
- [VERIFIED] `app/hooks/useToast.ts`, `lib/hooks/useRelativeTime.ts` — helpers
- [VERIFIED] `lib/core/middleware.ts` — `withAuthAndErrorHandler`, `withAuth`, `withErrorHandler`
- [VERIFIED] `lib/auth0.ts` — Auth0 SDK v4 config + `appSession` cookie settings
- [VERIFIED] `app/components/Navbar.tsx` — two render blocks (desktop + mobile)
- [VERIFIED] `tests/smoke/page-loads.spec.ts`, `tests/auth.setup.ts`, `tests/helpers/auth.helpers.ts` — e2e infrastructure
- [VERIFIED] `jest.setup.ts` — polyfills, NextResponse mock
- [VERIFIED] `app/network/components/CopyableIp.tsx` + test — clipboard pattern reference
- [CITED] https://nextjs.org/docs/app/api-reference/functions/cookies — via Context7 `/vercel/next.js`
- [CITED] https://nextjs.org/docs/app/guides/authentication §"Delete Session Cookie in Next.js App Router" — via Context7

### Secondary (MEDIUM confidence)
- [VERIFIED via npm registry] `next@16.2.4` (stable 2026-04-15), `zod@3.24.2`, `react-hook-form@7.73.1`, `@hookform/resolvers@5.2.2`, `@auth0/nextjs-auth0@4.13.1`, `@playwright/test@1.52.0`

### Tertiary (LOW confidence)
- None. Every claim in this document is backed by either a file read, a docs fetch, or an npm registry query within this research session.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all deps verified via `package.json` + npm registry
- Architecture: HIGH — patterns matched to existing Registry phase (118-125), Auth0 cohabitation explicit
- Pitfalls: HIGH — 10 pitfalls enumerated, each with project-specific `file:line` references
- Security: HIGH — phase-157 threat model extended, not redefined; ASVS coverage mapped
- Validation architecture: HIGH — every AUTH-0X has ≥ 2 test levels (unit + e2e); Wave 0 gaps enumerated

**Research date:** 2026-04-23
**Valid until:** 2026-05-23 (30 days — stable stack; dependencies unlikely to materially change within a month)
