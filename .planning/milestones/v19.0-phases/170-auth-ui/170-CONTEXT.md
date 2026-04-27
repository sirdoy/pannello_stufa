# Phase 170: Auth UI - Context

**Gathered:** 2026-04-23
**Status:** Ready for planning
**Mode:** `--auto --chain` (Claude selected recommended defaults)

<domain>
## Phase Boundary

Users can log in via a form UI and manage HA-proxy API keys end-to-end (list, create with one-shot plaintext reveal, revoke). This phase builds the **frontend consumers** for the 4 routes phase 157 created (AUTH-01..04). No new backend routes — but the existing `POST /api/auth/login` route from phase 157 is extended to accept user-submitted credentials (see D-02 below) so the login form is meaningful UX.

**In scope:** `/login` page, `/settings/api-keys` management page, custom hooks (`useApiKeys`, `useLogin`), plaintext-key reveal modal, navbar entry, Jest unit tests, Playwright smoke covering happy path.

**Out of scope:** Auth0 replacement, multi-user/role-based access, password-reset flow, API-key rotation reminders, per-key scope/permission UI (HA proxy doesn't expose scopes). These are separate phases if ever needed.

</domain>

<decisions>
## Implementation Decisions

### Semantic Reconciliation (ROADMAP vs. Phase 157)

- **D-01:** ROADMAP criterion 1 says "Login page POSTs form credentials to `/auth/login` and stores JWT." Phase 157 D-03 locked JWT as **server-side only** (env-based, never returned to client). Phase 170 reconciles by:
  - Extending `POST /api/auth/login` to accept an optional `{ username, password }` JSON body. If body present, proxy-login uses those creds; if absent, falls back to `HA_ADMIN_USER` / `HA_ADMIN_PASSWORD` env vars (phase 157 behaviour preserved for callers with no body).
  - On successful proxy login, server sets a short-lived **httpOnly session cookie** (e.g. `ha_auth=1`, `max-age=3600`, `sameSite=lax`, `secure` in prod) as the "authenticated" marker. JWT itself still NEVER leaves the server. Route response body remains `{ authenticated: true }`.
  - ROADMAP's "stores JWT" is reinterpreted: cookie carries the authenticated-session flag; the HA-proxy JWT is re-fetched server-side per request as phase 157 already does. No localStorage, no client-visible token. **T-157-01 preserved.**
- **D-02:** Login form input is **optional** from the user's perspective: the page renders `username` + `password` inputs (required for HA proxy OAuth2 PasswordRequestForm), but a dev/admin convenience "Use server-configured credentials" checkbox submits with empty body to use env vars. Default: fields visible and required. **Rationale:** ROADMAP explicitly says "form credentials"; env-only flow remains available for smoke tests and server-to-server callers.

### Auth0 Relationship

- **D-03:** Auth0 remains the primary app-session gate (phase 157 D-04, D-07 preserved). `/login` and `/settings/api-keys` are both **wrapped in Auth0** at the route level (`withAuthAndErrorHandler`). The HA-proxy login is a **second gate** that unlocks api-key management UI specifically — user must (a) pass Auth0 at the app layer, then (b) pass HA-proxy login to see/touch keys. This matches phase 157 D-08.
- **D-04:** Unauthenticated-from-HA-proxy state shows the login form. Once HA cookie is set, `/settings/api-keys` becomes viewable. If cookie expires, the page shows a re-auth banner inline instead of silent redirect.

### Page Structure & URLs

- **D-05:** Login page at `/login` (top-level, Auth0-guarded). Does **not** collide with existing `app/auth/profile` (Auth0 callback) or `app/api/auth/*` (API routes).
- **D-06:** API-keys management at `/settings/api-keys`. Rationale: groups with the existing `SettingsLayout` used by registry/rooms; discoverable via navbar's settings section.
- **D-07:** Post-login redirect: on successful login, push to `/settings/api-keys` (the only HA-gated surface in this phase). Query param `?next=/x` overrides if present.

### UI Pattern (API Keys Page)

- **D-08:** Reuse the **Registry pattern** established in phases 118-125: `SettingsLayout` + `DataTable` + `FormModal` (react-hook-form + Zod) + `ConfirmationDialog` + `useToast`. This matches `app/registry/types/page.tsx` and `app/registry/devices/page.tsx` closely — no new patterns invented.
- **D-09:** DataTable columns: `id`, `name`, `created_at` (formatted relative time), `last_used_at` (relative or "Mai usata"), `is_active` badge, actions column (Revoke button). Italian locale throughout (matches existing pages).
- **D-10:** Create flow: "Crea nuova API key" button → `FormModal` with `name` field (Zod: 1-100 chars). On `POST /api/auth/api-keys` success, swap the form modal content with a **plaintext-key reveal view** showing the full `api_key` value, a copy-to-clipboard button, and a red warning: *"Questa chiave è visibile solo ora. Copiala e conservala in un posto sicuro."* Closing the modal removes the key from component state permanently.
- **D-11:** Revoke flow: `ConfirmationDialog` with key name + irreversibility warning → `DELETE /api/auth/api-keys/{keyId}` → refetch list → toast *"API key revocata"*. Optimistic UI not used (safety bias — show server confirmation).

### Hooks

- **D-12:** `app/hooks/useApiKeys.ts` — `{ keys, loading, error, refetch, create, revoke }`. Thin fetch wrapper around the 3 existing routes. No SWR/React Query — matches existing `useDeviceTypes`, `useRooms` pattern (local state + manual refetch).
- **D-13:** `app/hooks/useLogin.ts` — `{ login, logout, authenticated, loading, error }`. `login({username, password})` POSTs to `/api/auth/login`, reads cookie presence after, updates state. `logout()` clears cookie via new `POST /api/auth/logout` route (see D-14).

### Minimal Backend Additions

- **D-14:** Phase 170 adds **one new API route**: `POST /api/auth/logout` — clears the `ha_auth` cookie, returns `{ authenticated: false }`. Auth0 logout remains a separate link (`/auth/logout` already exists). Rationale: without a matching logout, the HA-auth cookie would only expire passively.
- **D-15:** Phase 170 **modifies** `app/api/auth/login/route.ts`: adds optional body parsing, sets httpOnly cookie. Phase 157 tests are extended, not rewritten. **T-157-01 still enforced** (access_token never in response body — assertion preserved).

### Security & Validation

- **D-16:** Client-side Zod schemas on both login form (`username`, `password` required) and key-create form (`name` 1-100 chars, non-empty). Server continues to validate independently (phase 157 already does).
- **D-17:** Login form uses `<form method="post">`-style semantics with React Hook Form; password input uses `type="password"` + autocomplete="current-password"; username uses `autocomplete="username"`.
- **D-18:** Rate-limit awareness: HA proxy returns 429 on login brute-force (phase 157 spec). Login form displays toast *"Troppi tentativi, riprova tra un minuto"* on 429 and locally disables submit for 30 seconds.

### Testing

- **D-19:** Jest unit tests for both hooks (`useApiKeys`, `useLogin`) using `fetch` mocks — pattern mirrors `useDeviceTypes.test.ts`.
- **D-20:** Jest component tests for `LoginPage` and `ApiKeysPage` using React Testing Library — at minimum: render happy path, submit success, submit error, empty list, plaintext-key-once-visible assertion.
- **D-21:** Playwright smoke (`e2e/page-loads.spec.ts`): add `/login` and `/settings/api-keys` to the page-loads matrix (structural smoke only, no credential submission — the real app-level Auth0 session already short-circuits the login form in Playwright's `realAuthState`).
- **D-22:** Additional Playwright spec (`e2e/auth-ui.spec.ts`) for full happy path: visit `/settings/api-keys` → login form shown → submit → list renders → create key → verify plaintext shown once → close modal → verify masked in list → revoke → verify removed. Uses mocked `/api/auth/*` routes via `page.route()` to avoid needing a real HA backend in CI.

### Nav & Discovery

- **D-23:** Add "API Keys" navbar entry. Placement: alongside Registro/Stanze in the global-sections group (see `app/components/Navbar.tsx:171` `isGlobalActive` helper). Icon: `KeyRound` from lucide-react.
- **D-24:** No entry for `/login` in the navbar — users hit it via redirect from gated pages or direct URL.

### Claude's Discretion

- Exact Toast messages and copy (Italian), subject to design-system vocab.
- Whether to inline the login form on `/settings/api-keys` when unauthenticated (progressive disclosure) or always redirect to `/login`. Default: **redirect to `/login?next=/settings/api-keys`** for clarity.
- Cookie name exactly (`ha_auth` suggested) and precise `max-age`.
- FormModal render-prop shape (follow registry pattern — planner can decide exact Controller wiring).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### HA Proxy Auth Spec
- `docs/api/auth.md` — Full spec: 4 endpoints, request/response shapes, `Token` / `APIKeyCreate` / `APIKeyResponse` / `APIKeyInfo` / `APIKeyListResponse` interfaces, rate limiting (10 req/min), form-encoded login requirement, plaintext-key-shown-once rule, "Frontend Component Suggestions" section specific to this phase.
- `docs/api/README.md` §Authentication — JWT + API Key overview.

### Phase 157 (Upstream — consumers of its routes)
- `.planning/phases/157-auth-module/157-CONTEXT.md` — All auth module decisions (D-01..D-08). **Phase 170 preserves D-03, D-04, D-07, D-08; extends D-01 via D-02/D-15.**
- `.planning/phases/157-auth-module/157-01-SUMMARY.md` — Delivered files (authProxy, 3 routes, types, 20 tests). Phase 170 consumes these.
- `app/api/auth/login/route.ts` — To be modified in D-15.
- `app/api/auth/api-keys/route.ts` — To be consumed as-is.
- `app/api/auth/api-keys/[keyId]/route.ts` — To be consumed as-is.
- `lib/auth/authProxy.ts` — No changes; consumed via existing route surface.
- `types/authProxy.ts` — Types to import client-side (`APIKeyInfo`, `APIKeyListResponse`, `APIKeyResponse`).

### UI Pattern Reference (Registry / Rooms)
- `app/registry/types/page.tsx` — Closest analog: DataTable + FormModal + ConfirmationDialog + Zod + react-hook-form.
- `app/registry/devices/page.tsx` — Same pattern, with delete flow.
- `app/components/SettingsLayout.tsx` — Wrapper for settings-style pages.
- `app/components/ui/DataTable.tsx` — TanStack Table wrapper with Italian locale sort.
- `app/components/ui/FormModal.tsx` — Render-prop Zod-validated modal (phase 118 established).
- `app/components/ui/ConfirmationDialog.tsx` — Destructive-action confirmation.
- `app/hooks/useToast.ts` — Toast helper.

### Auth0 Integration (do not modify)
- `lib/auth0.ts` — Auth0 SDK config.
- `lib/core/middleware.ts` — `withAuthAndErrorHandler` (Auth0 guard).
- `app/auth/` tree (Auth0 callbacks, `/auth/logout`, `/auth/profile`) — coexists with phase 170's `/login` and `/api/auth/*`.

### Navbar
- `app/components/Navbar.tsx` — Line 171 onward shows `isGlobalActive` + icon map (`ClipboardList` for registry, `DoorOpen` for rooms). Phase 170 adds `KeyRound` for api-keys.

### Testing Infrastructure
- `__tests__/app/registry/types/page.test.tsx` — Model for component tests.
- `e2e/page-loads.spec.ts` — Add `/login`, `/settings/api-keys` to matrix.
- `e2e/helpers.ts` (or existing e2e helper) — `collectConsoleErrors`, `realAuthState` patterns from phase 97.

### Design System
- `/debug/design-system` (live) — Visual reference for Button, Input, Card, Heading, Text, Banner, Skeleton variants.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `SettingsLayout`, `DataTable`, `FormModal`, `ConfirmationDialog`, `Button`, `Banner`, `Input`, `Skeleton`, `Card`, `Heading`, `Text`, `useToast` — 100% of the UI primitives the two new pages need already exist and are battle-tested in phases 118-125.
- All 4 phase-157 routes are functional and covered by 20 tests. Only `/api/auth/login` needs extension (D-15).
- `withAuthAndErrorHandler` Auth0 middleware — wraps every new server handler.
- Italian locale sort + relative-time formatters already used in registry pages — copy-paste patterns.

### Established Patterns
- **CRUD page pattern:** `SettingsLayout > { Banner on error, Skeleton on loading, DataTable + Button } + FormModal + ConfirmationDialog`. Hook owns state + refetch.
- **Hook pattern:** Local `useState` + `useCallback` for refetch; no SWR/React Query. Return `{ data, loading, error, refetch, ...mutations }`.
- **Form pattern:** Zod schema → `zodResolver` → `useForm` → `FormModal` render-prop → `Controller` on each field.
- **Auth0 guard pattern:** Both pages and API routes use `withAuthAndErrorHandler` / Auth0 session check at server layer.
- **Route prefix:** `/api/auth/` (phase 157 — different from `/api/v1/<provider>/`). Phase 170 follows.
- **Italian UX copy:** All user-visible strings in Italian; error/empty/loading states have established phrases (*"Nessun dato"*, *"Caricamento..."*, *"Errore"*).

### Integration Points
- `app/components/Navbar.tsx` — add `KeyRound` icon + link entry in global sections group.
- `app/api/auth/login/route.ts` — extend to accept optional body + set cookie (D-15).
- `app/api/auth/logout/route.ts` — NEW (D-14).
- `app/hooks/useApiKeys.ts` — NEW.
- `app/hooks/useLogin.ts` — NEW.
- `app/login/page.tsx` — NEW.
- `app/settings/api-keys/page.tsx` — NEW.
- `e2e/page-loads.spec.ts` — 2 entries added.
- `e2e/auth-ui.spec.ts` — NEW (D-22).

### Creative Options Enabled / Constrained
- **Enabled:** Cookie-based session marker (httpOnly) without touching client token storage — preserves phase 157 D-03 security guarantee while giving UX a meaningful "authenticated" signal.
- **Constrained:** Phase 157 D-03 blocks returning JWT to client; D-07 requires Auth0 guard on everything under `/api/auth`. Any deviation requires amending phase 157, which we are explicitly NOT doing.

</code_context>

<specifics>
## Specific Ideas

- **Plaintext key reveal modal** is the UX centerpiece of this phase — get the copy-to-clipboard + warning copy right. Follow `docs/api/auth.md` §Frontend Component Suggestions.
- Italian copy is non-negotiable and matches surrounding pages (Registro / Stanze / Automations).
- Re-use `ClipboardList`/`DoorOpen` icon selection style — `KeyRound` is the thematic match.
- The whole phase follows the Phase 157 "v19.0 API alignment & full coverage" milestone intent: eliminate orphans by wiring UI consumers.
- Masking in the list view: HA proxy's `GET /auth/api-keys` intentionally NEVER returns plaintext — so "mask first 8 chars" as per `docs/api/auth.md` Frontend Suggestions is cosmetic; we just show `id`, `name`, metadata. No masked plaintext fallback is possible.

</specifics>

<deferred>
## Deferred Ideas

- **API-key scoping / permissions UI** — HA proxy doesn't support per-key scopes; defer until backend does.
- **Key rotation reminders / expiry notifications** — worth a follow-up phase if users ask.
- **Multi-user RBAC on `/settings/api-keys`** — current model is single admin; RBAC is its own milestone.
- **Replace Auth0 with HA-proxy-only session** — architectural decision; not for phase 170.
- **Password reset / "forgot password" flow** — HA proxy backend doesn't expose this yet.
- **Per-key usage analytics** — `last_used_at` is available; richer analytics is a future phase.

</deferred>

---

*Phase: 170-auth-ui*
*Context gathered: 2026-04-23*
*Mode: `--auto --chain` — auto-advancing to /gsd-plan-phase after commit*
