---
phase: 170
slug: auth-ui
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-23
---

# Phase 170 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> Derived from `170-RESEARCH.md` §"Validation Architecture".

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest 29.x + @testing-library/react + @testing-library/user-event; Playwright 1.52.0 for E2E |
| **Config file** | `jest.config.cjs` (root), `jest.setup.ts`; `playwright.config.ts` (root), `tests/auth.setup.ts` |
| **Quick run command** | `npm test -- __tests__/app/login __tests__/app/settings/api-keys __tests__/hooks/useLogin __tests__/hooks/useApiKeys __tests__/api/auth` |
| **Full suite command** | `npm test && npx playwright test` |
| **Estimated runtime** | ~15 seconds (auth unit subset); ~120 seconds (full Playwright) |

---

## Sampling Rate

- **After every task commit:** `npm test -- <relevant test files>` (quick run, < 15s for auth subset)
- **After every plan wave:** `npm test && npx playwright test tests/smoke/page-loads.spec.ts` (Jest + smoke subset)
- **Before `/gsd-verify-work`:** Full suite must be green — `npm test && npx playwright test`
- **Max feedback latency:** 15s (unit), 120s (full)

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 170-01-01 | 01 | 1 | AUTH-01 | T-157-01 | Login route extension accepts `{username, password}` body, forwards to `authProxy.login`, discards token, sets `ha_auth` httpOnly cookie, returns `{authenticated: true}` | unit | `npm test -- __tests__/api/auth/login/route.test.ts` | ✅ (EXTEND) | ⬜ pending |
| 170-01-02 | 01 | 1 | AUTH-01 | T-157-01 | Empty body falls back to env vars (phase 157 behavior preserved) | unit | `npm test -- __tests__/api/auth/login/route.test.ts -t "empty body env fallback"` | ✅ (EXTEND) | ⬜ pending |
| 170-01-03 | 01 | 1 | AUTH-01 | — | Cookie attributes: `httpOnly: true`, `sameSite: 'lax'`, `path: '/'`, `secure: NODE_ENV==='production'` | unit | `npm test -- __tests__/api/auth/login/route.test.ts -t "cookie attributes"` | ❌ W0 | ⬜ pending |
| 170-01-04 | 01 | 1 | AUTH-01 | — | 429 from HA proxy propagated to client | unit | `npm test -- __tests__/api/auth/login/route.test.ts -t "429"` | ❌ W0 | ⬜ pending |
| 170-01-05 | 01 | 1 | AUTH-01 | — | `POST /api/auth/logout` deletes `ha_auth` cookie, returns `{authenticated: false}` | unit | `npm test -- __tests__/api/auth/logout/route.test.ts` | ❌ W0 | ⬜ pending |
| 170-02-01 | 02 | 2 | AUTH-01 | — | `useLogin.login()` POSTs, returns true on 200, sets RATE_LIMITED with 30s lockout on 429, sets INVALID_CREDENTIALS on 401 | unit | `npm test -- __tests__/hooks/useLogin.test.ts` | ❌ W0 | ⬜ pending |
| 170-02-02 | 02 | 2 | AUTH-01 | — | Lockout window blocks submit without calling fetch | unit | `npm test -- __tests__/hooks/useLogin.test.ts -t "lockout"` | ❌ W0 | ⬜ pending |
| 170-02-03 | 02 | 2 | AUTH-01 | — | `/login` page renders form, submits, calls hook, redirects on success, shows rate-limit toast on 429 | unit | `npm test -- __tests__/app/login/page.test.tsx` | ❌ W0 | ⬜ pending |
| 170-02-04 | 02 | 2 | AUTH-01 | — | Zod rejects empty username or password client-side | unit | `npm test -- __tests__/app/login/page.test.tsx -t "zod"` | ❌ W0 | ⬜ pending |
| 170-02-05 | 02 | 2 | AUTH-02, AUTH-03, AUTH-04 | — | `useApiKeys`: list/create/revoke hit correct endpoints, update state; 401 → SESSION_EXPIRED; 404 on revoke is not error | unit | `npm test -- __tests__/hooks/useApiKeys.test.ts` | ❌ W0 | ⬜ pending |
| 170-03-01 | 03 | 3 | AUTH-03 | — | `ApiKeysPage` renders DataTable with id/name/created_at/last_used_at/is_active/actions; empty state shows "Nessuna API key"; `null` last_used → "Mai usata" | unit | `npm test -- __tests__/app/settings/api-keys/page.test.tsx -t "list"` | ❌ W0 | ⬜ pending |
| 170-03-02 | 03 | 3 | AUTH-02 | T-157-02 | Create flow: FormModal submit → server responds 201 → reveal view shown with plaintext → copy button functional → close clears plaintext from DOM | unit | `npm test -- __tests__/app/settings/api-keys/page.test.tsx -t "create"` | ❌ W0 | ⬜ pending |
| 170-03-03 | 03 | 3 | AUTH-02 | — | `screen.queryByText(/ha_live_/)` returns null after modal close | unit | `npm test -- __tests__/app/settings/api-keys/page.test.tsx -t "plaintext cleared"` | ❌ W0 | ⬜ pending |
| 170-03-04 | 03 | 3 | AUTH-04 | — | Revoke: click Revoca → ConfirmationDialog danger variant → confirm → DELETE → list refetched → toast; 404 not error | unit | `npm test -- __tests__/app/settings/api-keys/page.test.tsx -t "revoke"` | ❌ W0 | ⬜ pending |
| 170-03-05 | 03 | 3 | AUTH-02 | — | Zod rejects empty name client-side | unit | `npm test -- __tests__/app/settings/api-keys/page.test.tsx -t "empty name"` | ❌ W0 | ⬜ pending |
| 170-03-06 | 03 | 3 | AUTH-01, AUTH-02, AUTH-03, AUTH-04 | — | `/login` and `/settings/api-keys` load in structural smoke matrix with mocked HA cookie | e2e | `npx playwright test tests/smoke/page-loads.spec.ts -g "login\|api-keys"` | ✅ (EXTEND) | ⬜ pending |
| 170-03-07 | 03 | 3 | AUTH-01, AUTH-02, AUTH-03, AUTH-04 | — | Full happy path: unauth visit → login form → submit (mocked 200 + Set-Cookie) → list renders → create → plaintext revealed → close → masked → revoke → removed | e2e | `npx playwright test tests/features/auth-ui.spec.ts` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `__tests__/hooks/useLogin.test.ts` — stubs for AUTH-01
- [ ] `__tests__/hooks/useApiKeys.test.ts` — stubs for AUTH-02, AUTH-03, AUTH-04
- [ ] `__tests__/app/login/page.test.tsx` — stubs for AUTH-01 (component)
- [ ] `__tests__/app/settings/api-keys/page.test.tsx` — stubs for AUTH-02, AUTH-03, AUTH-04 (component)
- [ ] `__tests__/api/auth/login/route.test.ts` — EXTEND with 4 new cases (body-path, env-fallback, cookie attributes, 429)
- [ ] `__tests__/api/auth/logout/route.test.ts` — NEW, covers AUTH-01 (logout)
- [ ] `tests/smoke/page-loads.spec.ts` — EXTEND with `/login`, `/settings/api-keys`
- [ ] `tests/features/auth-ui.spec.ts` — NEW, full mocked happy path (CONTEXT.md D-22)
- [ ] Framework install: none needed — Jest, Playwright, @testing-library, zod, react-hook-form already present

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Cookie `httpOnly` flag observed in real browser DevTools against real HA proxy | AUTH-01 | Playwright can assert `Set-Cookie` header, but real browser behavior across browsers/devices requires smoke | Open `/login` in Chrome + Safari, submit real creds, DevTools → Application → Cookies → assert `ha_auth` exists with `HttpOnly` flag true, `Secure` true in prod |
| Created plaintext API key actually authenticates against HA proxy | AUTH-02 | Plaintext only shown once; list endpoint never returns it — value correctness cannot be unit-tested | Create key via UI → copy → run `curl -H "X-API-Key: <plaintext>" <HA_API_URL>/health` → expect 200 |
| Revoked key returns 401 on subsequent use | AUTH-04 | End-to-end side effect on HA proxy state, not introspectable from app | Revoke key via UI → `curl -H "X-API-Key: <previously-copied-plaintext>" <HA_API_URL>/health` → expect 401 |
| Copy-to-clipboard button actually populates the OS clipboard | D-10 UX | Clipboard permissions differ by browser; OS-level paste test is only reliable verification | Create key → click Copia → paste into another app → verify full plaintext appears |

Per project convention, these items are recorded in phase VERIFICATION.md as human-verification UAT entries after execution.

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references (8 test files — 6 new, 2 extended)
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s for auth-subset quick run, < 120s for full suite
- [ ] `nyquist_compliant: true` set in frontmatter after planner integrates VALIDATION.md task refs

**Approval:** pending
