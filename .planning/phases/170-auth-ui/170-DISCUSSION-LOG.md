# Phase 170: Auth UI - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-23
**Phase:** 170-auth-ui
**Mode:** `--auto --chain` (Claude auto-selected recommended defaults across all gray areas)
**Areas discussed:** Login-semantics reconciliation, Login UX, Auth0 relationship, Page URLs, UI pattern, Plaintext-key reveal, Hooks design, Backend additions, Security/validation, Testing, Nav & Discovery

---

## Login-Semantics Reconciliation (ROADMAP ↔ Phase 157)

| Option | Description | Selected |
|--------|-------------|----------|
| Keep `/api/auth/login` env-only; login page is a trigger button | Minimal change, preserves phase 157 literally. Login form collects no creds. | |
| Extend `/api/auth/login` to accept optional `{username, password}` body; fall back to env; set httpOnly cookie | Satisfies ROADMAP "form credentials" + phase 157 D-03 server-side JWT invariant | ✓ |
| Add new `/api/auth/login-form` route next to existing env-based route | Two parallel routes doing similar work — split brain. | |
| Replace Auth0 with HA-JWT session | Massive scope — not for phase 170. | |

**Selected:** Extend existing route + httpOnly cookie marker.
**Rationale:** Matches ROADMAP SC-1 most closely, preserves T-157-01 (no `access_token` leak in body), no new route needed, cookie gives a meaningful "authenticated" signal without client-visible token.

---

## Login Form UX

| Option | Description | Selected |
|--------|-------------|----------|
| username+password inputs required | Real form, real credentials flow through | ✓ |
| No inputs, only "Login" trigger button | Works with env fallback only | |
| Inputs optional with "Use server creds" checkbox | Hybrid — still supports env fallback | partial |

**Selected:** Inputs visible and required by default; env fallback remains usable by smoke tests/server-to-server callers via empty body.

---

## Auth0 Relationship

| Option | Description | Selected |
|--------|-------------|----------|
| Auth0 alone; HA login is orthogonal | Phase 157 status quo | |
| Auth0 + HA login (two gates) — HA login gates key-management UI only | Preserves phase 157 D-04/D-07/D-08 | ✓ |
| Replace Auth0 | Out of scope | |

---

## Page URLs

| Option | Description | Selected |
|--------|-------------|----------|
| `/login` + `/settings/api-keys` | Clean, discoverable, no collisions | ✓ |
| `/auth/login` + `/admin/api-keys` | Collides with existing `app/auth/profile` Auth0 routes | |
| `/admin/login` + `/admin/api-keys` | No `app/admin/` exists yet — would be a new tree | |

---

## UI Pattern (API Keys page)

| Option | Description | Selected |
|--------|-------------|----------|
| Registry pattern (DataTable + FormModal + ConfirmationDialog + useToast) | Matches phases 118-125 | ✓ |
| Custom bespoke layout | Unnecessary novelty | |
| Card grid instead of table | Keys are tabular metadata — table wins | |

---

## Plaintext-Key Reveal UX

| Option | Description | Selected |
|--------|-------------|----------|
| Modal with key + copy-to-clipboard + red warning, cleared on close | Matches docs/api/auth.md §Frontend Component Suggestions | ✓ |
| Inline banner on list page | Risk of accidental refresh/navigation losing the key | |
| Toast only | Too easy to miss — plaintext shown once ever | |

---

## Hooks Design

| Option | Description | Selected |
|--------|-------------|----------|
| Local `useState` + manual refetch (registry pattern) | Matches `useDeviceTypes`, `useRooms` | ✓ |
| SWR | Adds a dep for a small surface | |
| React Query | Adds a dep for a small surface | |

---

## Backend Additions

| Option | Description | Selected |
|--------|-------------|----------|
| Add `POST /api/auth/logout` route (clear cookie) + extend `POST /api/auth/login` | Minimum surface to make sessions symmetric | ✓ |
| No new routes, logout on client only | Cookie is httpOnly — client can't clear it | |
| Rewrite all 4 routes | Unnecessary | |

---

## Security & Validation

**Selected:**
- Zod on both login form (username/password required) and create-key form (name 1-100 chars)
- `type="password"` + proper autocomplete tokens
- 429 rate-limit UX: toast + temporary submit-disable

Alternatives considered: HTML5 required attrs only (insufficient UX), no client Zod (server already validates — but double-validation matches the rest of the codebase).

---

## Testing

**Selected:** Jest unit tests for hooks, Jest component tests for both pages, Playwright smoke in `page-loads.spec.ts`, dedicated `auth-ui.spec.ts` with mocked routes for happy path.

Alternatives considered: skip component tests (registry pattern has them — maintain parity), real HA backend in CI (brittle — mock via `page.route()`).

---

## Nav & Discovery

**Selected:**
- "API Keys" entry in Navbar global-sections group (alongside Registro, Stanze)
- `KeyRound` icon from lucide-react
- No `/login` entry (reached via redirect from gated pages or direct URL)

---

## Claude's Discretion

- Exact Italian copy for toasts, banners, warnings
- Whether to inline login on `/settings/api-keys` when unauthenticated vs. redirect — default: redirect to `/login?next=...`
- Cookie name and exact `max-age`
- FormModal render-prop wiring details

---

## Deferred Ideas

See `170-CONTEXT.md` `<deferred>` section.

---

*Auto-mode reminder:* Every decision above was selected by Claude using the "recommended default" heuristic. The user can override any of these by editing `170-CONTEXT.md` before `/gsd-plan-phase 170` runs.
