# Deferred Items — Phase 175

## Plan 03 — Out-of-scope environmental issues

### 1. Worktree dev-server boot blocked by missing `.env.local`

**Status:** Worked around (symlinked `/Users/federicomanfredi/Sites/localhost/pannello-stufa/.env.local`).

**Issue:** `npm run dev` in this git worktree fails at module-load time with `FIREBASE FATAL ERROR: Can't determine Firebase Database URL` because Next.js loads env vars from the cwd-local `.env.local` (which the worktree does not have by default — it's gitignored).

**Workaround applied (untracked):** `ln -sf /Users/federicomanfredi/Sites/localhost/pannello-stufa/.env.local .env.local` (symlink, gitignored).

**Recommendation for orchestrator:** When spawning future executor agents in worktrees, pre-symlink `.env.local` and `tests/.auth/user.json` from the main checkout, or document this as a one-time worktree bootstrap step.

### 2. Playwright smoke specs blocked by `ForceUpdateModal` overlay (pre-existing, NOT caused by Plan 03)

**Status:** Deferred — pre-existing issue affects ALL Playwright smoke specs in this worktree (verified by re-running `tests/smoke/accent-picker.spec.ts` from Phase 174, which fails with the IDENTICAL overlay-intercept error).

**Issue:** Visiting any page in dev triggers `VersionEnforcer` → `ForceUpdateModal` → Radix `Modal` to render with `data-state="open"`. The `<div ... fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md ...>` overlay intercepts ALL pointer events on the page, blocking every test that performs a click.

**Root cause:** `useVersion()` hook compares `APP_VERSION` (from `lib/version.ts`) against the `firebaseVersion` value in Firebase RTDB. In this dev environment, Firebase reports a version that does not equal `APP_VERSION` → `needsUpdate=true` → modal shown.

**Verification of pre-existence:**
```bash
$ npx playwright test tests/smoke/accent-picker.spec.ts --project=chromium --no-deps
# 2 failed — same "<div ... bg-slate-950/70 ...> intercepts pointer events" error.
```

**Why deferred (not fixed by this plan):**
- Per executor scope boundary: only auto-fix issues DIRECTLY caused by current task changes. ForceUpdateModal predates Phase 175.
- Fixing requires either (a) updating `firebaseVersion` in Firebase RTDB to match `APP_VERSION`, or (b) adding a `TEST_MODE` bypass in `VersionEnforcer.tsx` — both are out of scope for a primitive demo + Playwright spec plan.

**Recommendation for next phase or operations:**
- Option A: Add `process.env.NEXT_PUBLIC_TEST_MODE === 'true'` short-circuit in `VersionEnforcer.tsx` so smoke tests can run when `TEST_MODE=true` is set.
- Option B: Operations task to bump `firebaseVersion` in Firebase RTDB to the current `APP_VERSION`.

### 3. Playwright auth setup not provisioned

**Status:** Worked around (used `--no-deps` to skip `auth.setup.ts`).

**Issue:** `tests/auth.setup.ts` runs `signIn()` with `process.env.E2E_TEST_USER_EMAIL` / `_PASSWORD`, but those env vars are not set in `.env.local` and `tests/.auth/user.json` is empty (`{"cookies":[],"origins":[]}`). The setup hangs at `page.waitForURL(/.*auth0.*/)` because `/auth/login` doesn't redirect to Auth0 (no root `middleware.ts` wires Auth0 SDK in this app).

**Workaround:** None of the Plan 03 specs require authentication (the `/debug/design-system-v2` page is public). They run cleanly with `npx playwright test ... --no-deps`.

**Recommendation:** Document `--no-deps` as the standard run command for `/debug/*` smoke specs, OR provision E2E test credentials in CI/local `.env.local`.
