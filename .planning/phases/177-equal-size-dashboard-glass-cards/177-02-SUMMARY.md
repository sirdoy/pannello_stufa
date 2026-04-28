---
phase: 177
plan: 02
subsystem: ember-glass
tags: [ember-glass, primitives, dashboard, css-keyframes, hooks]
requires:
  - 174-01 (Ember Glass tokens — `--glass-bg`, `--glass-border`, `--r-card`, `--text-1`, `--text-2`, `--font-display`)
  - 174-02 (AmbientBg pre-paint hydration — globals.css already loaded)
  - 175-02 (Sheet primitive — consumed by Phase 177 cards via `<SheetPlaceholderBody>` body)
  - 176-01 (FlameViz keyframes — establishes the reduced-motion guard block we extend)
provides:
  - PlayingBars (3-bar Sonos animation primitive — DASH-05 enabling)
  - GlassCardSkeleton (1:1 shimmer Suspense fallback — DASH-01 fallback)
  - SheetPlaceholderBody (Phase 178 placeholder body with device-class icon — DASH-11 enabling)
  - useWeatherSummary (read-only weather summary hook — DASH-06 enabling)
  - sonosBar0/1/2 keyframes + reduced-motion guard in app/globals.css
affects:
  - app/components/EmberGlass/ (new sibling files alongside FlameViz, Pressable, Sheet, AmbientBg, Splash)
  - app/components/EmberGlass/cards/ (new directory; first occupant)
  - app/components/devices/weather/hooks/ (new directory; first occupant)
  - app/globals.css (3 keyframes + 1 reduced-motion rule appended)
tech-stack:
  added:
    - none (uses existing react, lucide-react, @testing-library/react, jest)
  patterns:
    - inline-style + var(--token) (Phase 174 D-12 / 175 D-08 / 176 D-23)
    - `data-testid` selectors on all primitive roots (Phase 175/176 precedent)
    - mocks-before-imports + jest.fn() reset (Phase 92 pattern)
    - StrictMode-aware async cancellation flag in useEffect cleanup
key-files:
  created:
    - app/components/EmberGlass/PlayingBars.tsx
    - app/components/EmberGlass/GlassCardSkeleton.tsx
    - app/components/EmberGlass/cards/SheetPlaceholderBody.tsx
    - app/components/devices/weather/hooks/useWeatherSummary.ts
    - app/components/EmberGlass/__tests__/PlayingBars.test.tsx
    - app/components/EmberGlass/__tests__/GlassCardSkeleton.test.tsx
    - app/components/EmberGlass/__tests__/SheetPlaceholderBody.test.tsx
    - app/components/devices/weather/hooks/__tests__/useWeatherSummary.test.tsx
    - .planning/phases/177-equal-size-dashboard-glass-cards/deferred-items.md
  modified:
    - app/globals.css (+3 @keyframes, +1 reduced-motion selector)
decisions:
  - PlayingBars consumes three keyframes (sonosBar0/1/2) appended to globals.css; reduced-motion guard added to the existing Phase 176 prefers-reduced-motion block (single block keeps maintenance trivial).
  - SheetPlaceholderBody uses a `satisfies` device→icon map keyed by an exported `SheetPlaceholderDevice` union — keys `'plugs-tuya'` and `'plugs-dirigera'` planned for Phase 177 plug cards.
  - Hook ships a cancellation flag in `useEffect` cleanup so React StrictMode double-mount + late-resolving fetch never sets stale state (and the test asserts ≥1 unsubscribe call rather than exactly 1, matching StrictMode reality).
  - WeatherSummary `city` is sourced from `location.name` (subscribeToLocation result) rather than the API payload, matching `WeatherCardWrapper.tsx` semantics where the API is location-agnostic and `locationName` is propagated separately.
  - All four test specs use `npm test -- <specific path>` rather than the scoped `test:components` / `test:unit` scripts because both scripts hard-code positional path filters (`__tests__/app/components`, `__tests__/lib __tests__/hooks __tests__/utils`) that exclude colocated tests under `app/components/EmberGlass/__tests__/` and `app/components/devices/weather/hooks/__tests__/`. CLAUDE.md rule 8 explicitly endorses `npm test -- <specific paths>` as a sanctioned form.
metrics:
  duration: ~25min
  completed: 2026-04-28
---

# Phase 177 Plan 02: Foundation Skeleton & Keyframes Summary

Ship the remaining Wave 1 foundations for the equal-size dashboard glass-card grid: the `PlayingBars` Sonos animation primitive (with the missing `sonosBar0/1/2` keyframes added to `app/globals.css`), the shared `GlassCardSkeleton` Suspense fallback, the `SheetPlaceholderBody` helper for the per-card sheet bodies that Phase 178 will swap, and the read-only `useWeatherSummary` hook extracted from `WeatherCardWrapper.tsx`. All four artifacts ship with colocated jest specs (4 suites, 18 tests, all green).

## What

- **`PlayingBars`** (`app/components/EmberGlass/PlayingBars.tsx`) — pure-presentational primitive renders 3 inner bars (`width: 2`, `gap: 1.5`, container height `9`, color `#b080ff`) animated via three CSS keyframes `sonosBar0/1/2` running `0.9s ease-in-out` with `i * 0.15s` delay. `data-testid="playing-bars"` on the container; bundle source is `cards.jsx:272-282`.
- **`GlassCardSkeleton`** (`app/components/EmberGlass/GlassCardSkeleton.tsx`) — 1:1 shimmer fallback with `aspectRatio: '1 / 1'`, `borderRadius: var(--r-card)`, `border: 0.5px solid var(--glass-border)`, `background: rgba(255,255,255,0.05)`, plus the single Tailwind `animate-pulse` utility allowed under D-02's shimmer carve-out. `data-testid="glass-card-skeleton"`.
- **`SheetPlaceholderBody`** (`app/components/EmberGlass/cards/SheetPlaceholderBody.tsx`) — props `{ phase: string; device: SheetPlaceholderDevice }`. Renders the Italian copy `Controlli in arrivo nella Phase {phase}` plus subtitle `Stiamo cucinando.` and a Lucide icon mapped from the device key (`stove → Flame`, `thermostat → Thermometer`, `lights → Lightbulb`, `sonos → Music`, `camera → Video`, `network → Wifi`, `plugs-tuya|plugs-dirigera → Plug`). Falls back to `Flame` for unknown keys. `data-testid="sheet-placeholder-body"`.
- **`useWeatherSummary`** (`app/components/devices/weather/hooks/useWeatherSummary.ts`) — subscribes to `subscribeToLocation`; on coords arrival fetches `/api/weather/forecast?lat=&lon=` and maps the response to `{ city, temp, condition, high, low, loading }` (read-only summary). Field mapping: `city ← location.name`, `temp ← current.temperature`, `condition ← current.condition.description`, `high ← forecast[0].tempMax`, `low ← forecast[0].tempMin`. Cancellation flag in cleanup guards setState across StrictMode double-mount. Zero memoization hooks (D-28).
- **`app/globals.css`** — appended three `@keyframes`:
  - `@keyframes sonosBar0 { 0%, 100% { height: 4px; } 50% { height: 9px; } }`
  - `@keyframes sonosBar1 { 0%, 100% { height: 6px; } 50% { height: 4px; } }`
  - `@keyframes sonosBar2 { 0%, 100% { height: 5px; } 50% { height: 8px; } }`
  - and one new selector inside the existing Phase 176 `@media (prefers-reduced-motion: reduce)` block: `[data-testid="playing-bars"] > div { animation: none !important; }`.

## Why

- **DASH-05** requires PlayingBars to ship before SonosCard can compose it. The bundle (`cards.jsx:267-271`) references three keyframes that did not exist in `globals.css`; the plan auditor flagged this as A-04. We add them once, here, so SonosCard (Wave 2) is purely composition.
- **DASH-01** requires a single shared 1:1 shimmer fallback that matches the GlassCard outer footprint exactly so the dashboard never shifts on hydration. GlassCardSkeleton replaces the per-device skeleton registry slots used by `DashboardCards.tsx` once Wave 2 lands.
- **DASH-11** requires every interactive card (7 of 9) to mount its own Sheet on tap with a placeholder body until Phase 178 swaps in the real bodies. SheetPlaceholderBody centralises the placeholder copy + icon mapping so the swap is one delete operation per card.
- **DASH-06** requires WeatherCard (Wave 2) to be a pure-presentational summary with no inline data subscription. Extracting the read-only slice from `WeatherCardWrapper.tsx` keeps the new card trivially testable and lets Phase 178's hypothetical WeatherSheet reuse the same hook.

## How

### Task 1 — PlayingBars + GlassCardSkeleton + SheetPlaceholderBody + sonosBar keyframes (TDD)

- **RED:** Authored three colocated jest specs (`PlayingBars.test.tsx`, `GlassCardSkeleton.test.tsx`, `SheetPlaceholderBody.test.tsx`) under `app/components/EmberGlass/__tests__/` with structural assertions on test-ids, child counts, animation strings, aspectRatio inline style, animate-pulse class, and Italian copy. Initial run failed (RED) with module-resolution errors as expected.
- **GREEN:** Implemented all three primitives following Phase 174/175/176 inline-style + `var(--token)` convention. PlayingBars maps `[0,1,2]` to bars with stable `key={i}` and per-index animation strings. GlassCardSkeleton uses Tailwind `animate-pulse` (the only allowed Tailwind for visual values inside EmberGlass per D-02's carve-out). SheetPlaceholderBody declares the icon map with `satisfies Record<string, LucideIcon>` so the inferred key union is exposed as `SheetPlaceholderDevice`.
- **globals.css:** Appended the three keyframes and the reduced-motion selector to the existing Phase 176 `@media (prefers-reduced-motion: reduce)` block (no new media query — single block keeps the keyframe→guard mapping easy to scan). Final 5/5 tests green for SheetPlaceholderBody, 4/4 for PlayingBars, 4/4 for GlassCardSkeleton.

### Task 2 — useWeatherSummary hook (TDD)

- **RED:** Authored `app/components/devices/weather/hooks/__tests__/useWeatherSummary.test.tsx` with 5 specs covering initial loading state, populated summary after fetch resolves, graceful failure on rejection, unsubscribe on unmount, and handling of `null` coords. Mocks `@/lib/services/locationService` and assigns a fresh `global.fetch = jest.fn()` per test (rather than `jest.spyOn` which fails in jsdom when `global.fetch` was previously restored). Initial run failed (RED).
- **GREEN:** Implemented the hook with a single `useState<WeatherSummary>` and a single `useEffect`. The effect subscribes to location, kicks off a fire-and-forget async fetch when coords arrive, and uses a `cancelled` flag in cleanup to ignore late-resolving promises. Field mapping reads from the actual `/api/weather/forecast` response shape (verified against `WeatherCard.tsx`'s `WeatherData` interface and `WeatherCardWrapper.tsx`'s consumption).
- **StrictMode accommodation:** The first GREEN run failed on two tests because `reactStrictMode: true` is configured in `jest.setup.ts` (line 32), which causes `useEffect` to mount→cleanup→mount during initial render. The fix: tests now use `mockResolvedValue` (not `mockResolvedValueOnce`) so both StrictMode invocations land on the same payload, and the unmount test asserts the unsubscribe count *increases* rather than being exactly 1. The hook itself remains StrictMode-correct via the cancellation flag; no opt-out, no `useRef` deduplication, no `useMemo`/`useCallback`. All 5/5 tests green after the test-side fix.

## Verification

| Check | Command | Result |
|-------|---------|--------|
| sonosBar keyframes count | `grep -c "@keyframes sonosBar" app/globals.css` | `3` ✓ |
| PlayingBars test-id | `grep -q 'data-testid="playing-bars"' app/components/EmberGlass/PlayingBars.tsx` | exit 0 ✓ |
| GlassCardSkeleton test-id | `grep -q 'data-testid="glass-card-skeleton"' app/components/EmberGlass/GlassCardSkeleton.tsx` | exit 0 ✓ |
| SheetPlaceholderBody copy | `grep -q "Controlli in arrivo nella Phase" app/components/EmberGlass/cards/SheetPlaceholderBody.tsx` | exit 0 ✓ |
| GlassCardSkeleton uses animate-pulse | `grep -q "animate-pulse" app/components/EmberGlass/GlassCardSkeleton.tsx` | exit 0 ✓ |
| Hook export present | `grep -q "export function useWeatherSummary" app/components/devices/weather/hooks/useWeatherSummary.ts` | exit 0 ✓ |
| Hook subscribes to location | `grep -q "subscribeToLocation" app/components/devices/weather/hooks/useWeatherSummary.ts` | exit 0 ✓ |
| Hook fetches forecast | `grep -q "/api/weather/forecast" app/components/devices/weather/hooks/useWeatherSummary.ts` | exit 0 ✓ |
| Zero memoization hooks in new files | `grep -v '^//' <new-files> | grep -cE "useMemo|useCallback"` | `0` ✓ |
| Jest run | `npm test -- <four spec paths>` | 4 suites, 18 tests, all PASS ✓ |
| `tsc --noEmit` on new files | `npx tsc --noEmit` filtered to new paths | 0 errors ✓ |

`tsc --noEmit` exits 1 globally because of 7 pre-existing errors in unrelated test files (`app/debug/components/tabs/__tests__/FritzboxServiceDiscoveryTab.test.tsx`, `app/debug/hooks/__tests__/useFritzServiceDiscovery.test.ts`, `app/network/__tests__/storico-tab.test.tsx`, `app/network/hooks/__tests__/useFritzBandwidthHistoryRaw.test.ts`, `app/network/hooks/__tests__/useFritzDeviceEventsRaw.test.ts`). These existed on the base commit `d4cb3da3` and do not touch any file modified or created by this plan. Logged to `.planning/phases/177-equal-size-dashboard-glass-cards/deferred-items.md` for the v20.0 cleanup phase per the executor scope-boundary rule.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Test-infrastructure block] Adapt useWeatherSummary jest test for React StrictMode double-mount**
- **Found during:** Task 2 GREEN.
- **Issue:** The plan's test outline used `jest.spyOn(global, 'fetch').mockResolvedValueOnce(...)` and asserted `mockUnsubscribe` was called exactly once on unmount. Both broke under `reactStrictMode: true` (configured in `jest.setup.ts:32`): StrictMode double-invokes `useEffect`, so the hook calls `subscribeToLocation` twice, kicks off two fetches, and `unsubscribe` fires twice (once for the intentional cleanup-of-first-mount and once for the actual unmount). The `Once` mock satisfies only the first call; the second receives `undefined` → the catch path resets fields to null. And `jest.spyOn(global, 'fetch')` failed in the no-coords test because `global.fetch` had been restored by `afterEach`, so there was nothing to spy on.
- **Fix:**
  1. Replaced `jest.spyOn(global, 'fetch')` with direct `global.fetch = jest.fn()` setup in `beforeEach` (with restore in `afterEach`). Tests then call `(global.fetch as jest.Mock).mockResolvedValue(...)` (NOT `mockResolvedValueOnce`) so both StrictMode invocations get the same payload.
  2. Changed the unmount assertion from `toHaveBeenCalledTimes(1)` to `mockUnsubscribe.mock.calls.length > beforeUnmount` so we only require that the `unmount()` call adds at least one cleanup invocation, regardless of how many StrictMode emitted earlier.
  3. The hook itself remains StrictMode-correct via the `cancelled` flag in `useEffect` cleanup — no `useMemo`/`useCallback`, no opt-out (D-28 preserved).
- **Files modified:** `app/components/devices/weather/hooks/__tests__/useWeatherSummary.test.tsx`.
- **Commit:** `ef1cc081` (combined GREEN commit; test-side fix landed atomically with the hook implementation).

**2. [Rule 3 - Verification command form] Use `npm test -- <path>` instead of the plan's scoped scripts**
- **Found during:** Task 1 GREEN verification.
- **Issue:** The plan's `<verify><automated>` blocks specified `npm run test:components -- --testPathPattern='EmberGlass/(PlayingBars|GlassCardSkeleton|SheetPlaceholderBody)\.test'` and `npm run test:unit -- --testPathPattern='useWeatherSummary'`. Both scoped scripts hard-code positional path filters (`__tests__/app/components` for `test:components`; `__tests__/lib __tests__/hooks __tests__/utils` for `test:unit`) that exclude colocated tests under `app/components/EmberGlass/__tests__/` and `app/components/devices/weather/hooks/__tests__/`.
- **Fix:** Used `npm test -- <specific spec paths>`. CLAUDE.md rule 8 explicitly endorses this form ("Prefer `npm test -- <specific paths>`"). All 18 tests across 4 suites pass.
- **Files modified:** none (verification-command-only deviation).
- **Commit:** none.

### Pre-existing tsc errors (out-of-scope)

Logged to `.planning/phases/177-equal-size-dashboard-glass-cards/deferred-items.md`. Files: `app/debug/components/tabs/__tests__/FritzboxServiceDiscoveryTab.test.tsx`, `app/debug/hooks/__tests__/useFritzServiceDiscovery.test.ts`, `app/network/__tests__/storico-tab.test.tsx`, `app/network/hooks/__tests__/useFritzBandwidthHistoryRaw.test.ts`, `app/network/hooks/__tests__/useFritzDeviceEventsRaw.test.ts`. None touch any file modified or created by this plan; left for a dedicated tech-debt phase.

## Threat Surface

No threat-register changes. The plan's threat model (`T-177-02`) accepts the existing `/api/weather/forecast` endpoint with no new auth surface; coords come from the existing `subscribeToLocation` (Firebase RTDB) which already enforces app-wide auth via Phase 14.x bindings. No new endpoints, no new credentials, no new client-side storage, no new POST surface introduced by this plan.

## Self-Check: PASSED

| Item | Check | Result |
|------|-------|--------|
| `app/components/EmberGlass/PlayingBars.tsx` | `[ -f ... ]` | FOUND |
| `app/components/EmberGlass/GlassCardSkeleton.tsx` | `[ -f ... ]` | FOUND |
| `app/components/EmberGlass/cards/SheetPlaceholderBody.tsx` | `[ -f ... ]` | FOUND |
| `app/components/devices/weather/hooks/useWeatherSummary.ts` | `[ -f ... ]` | FOUND |
| `app/components/EmberGlass/__tests__/PlayingBars.test.tsx` | `[ -f ... ]` | FOUND |
| `app/components/EmberGlass/__tests__/GlassCardSkeleton.test.tsx` | `[ -f ... ]` | FOUND |
| `app/components/EmberGlass/__tests__/SheetPlaceholderBody.test.tsx` | `[ -f ... ]` | FOUND |
| `app/components/devices/weather/hooks/__tests__/useWeatherSummary.test.tsx` | `[ -f ... ]` | FOUND |
| `app/globals.css` keyframes | `grep -c "@keyframes sonosBar" app/globals.css` | `3` |
| Commit `fe727d71` (RED 1) | `git log --oneline | grep fe727d71` | FOUND |
| Commit `0bf23d69` (GREEN 1) | `git log --oneline | grep 0bf23d69` | FOUND |
| Commit `3eafa25d` (RED 2) | `git log --oneline | grep 3eafa25d` | FOUND |
| Commit `ef1cc081` (GREEN 2) | `git log --oneline | grep ef1cc081` | FOUND |

## TDD Gate Compliance

The plan declares `tdd="true"` on both tasks. Both gate sequences executed in order:

| Task | RED commit | GREEN commit | REFACTOR |
|------|------------|--------------|----------|
| 1 | `fe727d71` (test) | `0bf23d69` (feat) | none needed |
| 2 | `3eafa25d` (test) | `ef1cc081` (feat) | none needed |

Both RED commits land before their corresponding GREEN commits in `git log --oneline`. No REFACTOR commits required because the bundle-verbatim primitives admit no further simplification.
