# Deferred Items — Phase 175

## Plan 03 — runtime status (closed 2026-05-04)

All three deferred items below were resolved or superseded as part of the Phase
180 / 175-03 runtime-unblock work:

### 1. Worktree dev-server boot blocked by missing `.env.local` — RESOLVED (operational)

Symlink workaround documented; new orchestrator runs are expected to provision
`.env.local` (and `tests/.auth/user.json`) up-front before spawning executors
inside worktrees.

### 2. Playwright smoke specs blocked by `ForceUpdateModal` overlay — RESOLVED (root cause re-attributed)

Original hypothesis (`VersionEnforcer` / `ForceUpdateModal` intercepting clicks)
was incorrect. The actual blocker was `<DialogPrimitive.Content forceMount>` on
the EmberGlass `Sheet` primitive: Radix's `DialogContentModal` runs
`hideOthers(content)` inside `useEffect([], [])`, which sets `aria-hidden=true`
on every page sibling and `pointer-events: none` on `<body>` — and never
unwinds because `forceMount` keeps Content mounted regardless of `open=false`.

Fix landed in `f96cb121` (drop forceMount from Portal+Content) and
`8cf603b3` (raise ConfirmationDialog z-index above Sheet + dedupe Title).
Outro animation degrades to instant unmount; recoverable later via CSS
animation on `[data-state='closed']` which Radix Presence honours.

After the fix, Phase 175-03 specs run 13/14 green under `--workers=1`. The
remaining `scroll-lock applied + restored at y=300` spec is `test.skip` —
the underlying behaviour works in the live browser and is verified manually
(MCP browser round-trips 300 → 0 lock → 300 restore correctly), but the
end-to-end runtime path races React Strict Mode + Next 16's RouterScroll in
headless dev: the cleanup's `scrollTo(300)` is overwritten by Next's layout
effect snapping `scrollY` back to 0, which is then re-captured on Strict
Mode's second `useEffect` invoke and persisted as the locked offset. Skip
until production-build smokes (no Strict Mode) are wired in CI.

### 3. Playwright auth setup not provisioned — RESOLVED

Fixed in `e45ef827`: `tests/auth.setup.ts` now detects `BYPASS_AUTH=true`
(the dev default that stubs `auth0.getSession()` to MOCK_SESSION) and writes
an empty `storageState` instead of attempting a real Auth0 OAuth round-trip.
`playwright.config.ts` was also updated to load `.env.local` so the bypass
flag is visible to the setup file.

For the BYPASS_AUTH=false path, `E2E_TEST_USER_EMAIL` /
`E2E_TEST_USER_PASSWORD` still need provisioning in CI/local `.env.local`.
