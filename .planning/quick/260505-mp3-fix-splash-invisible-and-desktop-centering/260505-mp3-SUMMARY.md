---
quick_id: 260505-mp3
description: Fix splash leaves page invisible on reload + desktop bottom-tab not centered
date: 2026-05-05
status: complete
commit: pending
---

# Quick 260505-mp3 — Summary

## What changed

**`app/components/EmberGlass/SplashGate.tsx`** — `ready` now flips true in two extra cases:

1. Hydration sees `sessionStorage[ember-glass-splash-shown] === 'true'` → reload bypass.
2. Auth resolves with no user (`!isLoading && !user`) → public route safety net.

Previously `ready` was set only by `<Splash onDone>`. When splash didn't mount (already shown / logged out) the wrapper was stuck at `opacity: 0; transform: scale(0.97)` indefinitely.

**`app/components/EmberGlass/BottomTabBar.tsx`** — removed inline `left: 12, right: 12`. They were beating the desktop centering rule in globals.css (inline style > stylesheet, even with `@media`).

**`app/globals.css:364-367`** — added base `left: 12px; right: 12px` to `[data-bottom-tab="true"]`. Mobile stays full-width pill, `@media (min-width: 640px)` (lines 368-376) now correctly overrides with `left: 50%; transform: translateX(-50%); width: 480px`.

## Verification

- `npm test -- BottomTabBar.test SplashGate.test` → 15 tests passed
- `npx tsc --noEmit` → clean

## Files

- app/components/EmberGlass/SplashGate.tsx (+11 -1)
- app/components/EmberGlass/BottomTabBar.tsx (-2)
- app/globals.css (+2)
