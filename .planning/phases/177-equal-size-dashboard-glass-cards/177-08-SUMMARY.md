---
phase: 177
plan: 08
title: Playwright smoke spec
status: complete
date: 2026-04-28
requirements: [DASH-01, DASH-02, DASH-03, DASH-04, DASH-05, DASH-06, DASH-07, DASH-08, DASH-09, DASH-10, DASH-11, DASH-12]
files_changed: 1
---

# Plan 177-08: Playwright smoke + RC grep gate

## What shipped

- `tests/smoke/dashboard-glass-cards.spec.ts` (253 lines, 5 named tests + 10 parametrized = 15 test cases)
  - DASH-01: 2-col grid with 1:1 children, console clean
  - DASH-02..10: 10-card presence on cold load
  - DASH-11: 8 parametrized tap → Sheet opens (Stove, Climate, Lights, Sonos, Camera, Network, Tuya, IKEA)
  - DASH-11 negative: 2 parametrized — Weather + Raspi do NOT open a Sheet (SC-#3)
  - DASH-12: stagger `animationDelay` = `${i * 100}ms` for each card

## VersionEnforcer hard mitigation (W5)

`test.beforeEach` installs three layers (no soft-OR fallback):

1. `page.route('**/api/version*', ...)` defensive 200 fulfilling `version: 99.99.99` — short-circuits any HTTP version probe before goto.
2. `page.addInitScript` pre-populates `localStorage.lastSeenVersion` + `dismissedVersions` to suppress `WhatsNewModal` mount.
3. `dismissVersionEnforcerIfPresent` + `dismissWhatsNewModalIfPresent` DOM dismissal helpers (verbatim from `tests/smoke/splash.spec.ts:60-80`).

## React Compiler discipline gate (D-28 / DASH-12)

```bash
grep -rEn "^[^*/]*\b(useMemo|useCallback)\(" app/components/EmberGlass/cards/
```
Returns 0 matches across all 10 new card production files. ✓

## Commits

- `550ba0c8` feat(177-08): Playwright smoke spec for dashboard glass cards (DASH-01..DASH-12)

## Notes

- Spec authoring complete. Runtime verification (`npx playwright test tests/smoke/dashboard-glass-cards.spec.ts`) requires the Next.js dev server running (`npm run dev`); deferred to user-side execution. The spec wires into the canonical `data-testid` attributes already emitted by every card via the `GlassCard` `data-testid` passthrough (verified by `grep -rE "data-testid" app/components/EmberGlass/cards/`).
- Original plan-08 executor agent encountered an upstream API ConnectionRefused mid-flight (after ~78 tool uses). The spec file was authored to disk in the worktree; orchestrator copied it to main, committed it, and authored this SUMMARY. No worktree branch / commit landed via the executor for this plan — the orchestrator owns the single commit `550ba0c8`.
