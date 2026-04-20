# Phase 167: Sonos Frontend Cutover - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-20
**Phase:** 167-sonos-frontend-cutover
**Mode:** `--auto` (non-interactive, Claude selected recommended defaults)
**Areas discussed:** Missing V1 Routes Scope, URL Mapping Strategy, Frontend File Coverage, Legacy Cleanup, Firebase Logging, Plan Structure

---

## Missing V1 Routes Scope

| Option | Description | Selected |
|--------|-------------|----------|
| Frontend-only (15 routes) | Wrap only legacy endpoints actually consumed by hooks; skip `devices/[uid]` | ✓ |
| Spec-complete (16 routes) | Wrap every legacy endpoint including `devices/[uid]` for API-surface parity | |
| Consumer-driven + stubs | Wrap frontend routes, add 501 stubs for unused ones | |

**Claude's choice:** Frontend-only (15 routes) — recommended default
**Rationale:** Mirrors Phase 166 Hue cutover (only created v1 routes for endpoints with frontend consumers). `devices/[uid]` deferred (captured in Deferred Ideas). Proxy function `getDevice(uid)` already exists so future consumers can wire a v1 route trivially.

---

## URL Mapping Strategy

| Option | Description | Selected |
|--------|-------------|----------|
| Direct 1:1 prefix swap | Replace `/api/sonos/` with `/api/v1/sonos/`, identical suffix | ✓ |
| Path splits (GET vs PUT) | Separate GET/PUT into `/endpoint` vs `/endpoint/state` like Hue lights | |
| New REST grouping | Reorganize speakers/zones hierarchy under more idiomatic resources | |

**Claude's choice:** Direct 1:1 prefix swap — recommended default
**Rationale:** Legacy Sonos routes already group GET + PUT in one file (unlike Hue lights). `docs/api/sonos.md` spec paths mirror legacy paths exactly — prefix swap is the zero-risk option. Matches Phase 160's combined `play-mode` and `sleep-timer` pattern.

---

## Frontend File Coverage

| Option | Description | Selected |
|--------|-------------|----------|
| Hooks + tests only (9 files) | Rewrite 5 hooks + 4 existing test files | ✓ |
| Hooks + tests + new useSonosHistory test | Add missing test coverage for history hook during cutover | |
| Hooks + tests + E2E | Add Playwright assertions for Sonos zone page | |

**Claude's choice:** Hooks + tests only (9 files) — recommended default
**Rationale:** No existing `useSonosHistory.test.ts` — adding it here is scope creep (test coverage is a separate concern). Playwright smoke already covers page render per Phase 97. No Sonos-specific page fetches (`app/sonos/page.tsx` renders via hooks), no debug panel, no command palette, no `lib/routes.ts`, no `app/sw.ts` cache rule — surface is exactly the 5 hooks + 4 tests.

---

## Legacy Cleanup Strategy

| Option | Description | Selected |
|--------|-------------|----------|
| Delete entire legacy tree | Remove `app/api/sonos/` recursively after cutover verified | ✓ |
| Redirect/alias legacy paths | Keep legacy routes as thin redirects to v1 for backwards compat | |
| Soft-deprecate with warning logs | Keep legacy routes, add deprecation log on each call | |

**Claude's choice:** Delete entire legacy tree — recommended default
**Rationale:** Success criterion #2 requires "Zero `/api/sonos/` references in `app/` and `components/`". Hard delete is the simplest way to prove that. No external API consumers exist (all requests are same-origin from the PWA). Matches Phase 166 D-11 (hue tree delete) and Phase 164 precedent (legacy stove tree delete).

---

## Firebase Command Logging

| Option | Description | Selected |
|--------|-------------|----------|
| Do not add logging | Sonos has no pre-existing command log — stay consistent | ✓ |
| Add adminDbPush to all write routes | Parity with Hue v1 write routes | |
| Add logging only to transport commands (play/pause/stop/next/prev) | Partial coverage for high-signal user actions | |

**Claude's choice:** Do not add logging — recommended default
**Rationale:** Out of scope per ROADMAP.md success criteria (all four criteria are path-migration and smoke-green assertions, none mention Firebase logging). Legacy `/api/sonos/*` routes never logged; existing Phase 160 v1 zone routes never logged. Adding it during cutover would be a scope expansion. Captured in Deferred Ideas as a possible follow-up observability phase.

---

## Plan Structure

| Option | Description | Selected |
|--------|-------------|----------|
| 3 plans (routes / hooks / cleanup) | Match Phase 166 three-plan split | ✓ |
| 2 plans (routes+hooks / cleanup) | Fewer plans, larger scope per plan | |
| 4 plans (routes / hooks / tests / cleanup) | Fine-grained, separate hook + test waves | |

**Claude's choice:** 3 plans — recommended default
**Rationale:** Phase 166 shipped the same cutover shape in 3 plans successfully (166-01 routes, 166-02 frontend rewrite, 166-03 legacy delete + grep sweep). Re-using proven cadence. Wave-2 parallelism unnecessary given hooks are few and coupled.

---

## Claude's Discretion

- Log-tag naming for `withAuthAndErrorHandler` in new v1 routes (e.g., `'Sonos/Speakers/Eq/Get'`)
- Query parameter parsing strategy for `/history` endpoint (pass-through vs per-param validation)
- Body-DTO typing for `source` / `join` single-field request shapes
- Whether to interleave test writing with route writing or batch

## Deferred Ideas

- `GET /api/v1/sonos/devices/[uid]` v1 wrapper — no frontend consumer today
- Firebase `adminDbPush` logging for Sonos commands — out of phase scope; candidate for a future observability phase
