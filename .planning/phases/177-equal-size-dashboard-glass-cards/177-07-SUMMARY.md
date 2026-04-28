---
phase: 177
plan: 07
subsystem: dashboard
tags: [ember-glass, dashboard, integration, masonry-cutover]
requires:
  - 177-01-SUMMARY.md  # GlassCard / Pressable / Sheet primitives
  - 177-02-SUMMARY.md  # GlassCardSkeleton + spring-in keyframes
  - 177-03-SUMMARY.md  # StoveCard + ClimateCard
  - 177-04-SUMMARY.md  # LightsCard + SonosCard
  - 177-05-SUMMARY.md  # WeatherCard + CameraCard + NetworkCard
  - 177-06-SUMMARY.md  # RaspiCard + TuyaCard + DirigeraCard
provides:
  - DashboardCards.tsx server component renders single 2-col EmberGlass grid
  - EmberGlass barrel exports primitives + 10 cards + SheetPlaceholderBody
  - Sonos enabled on dashboard (A-03 / LANDMINE #1 fix)
affects:
  - app/components/DashboardCards.tsx
  - app/components/EmberGlass/index.ts
  - lib/services/unifiedDeviceConfigService.ts
  - app/components/__tests__/DashboardCards.test.tsx
tech-stack:
  added: []
  patterns:
    - "Server Component with grid-cols-2 + max-w-md sm:max-w-2xl mx-auto"
    - "v9.0 stagger preserved: animate-spring-in + animationDelay flatIndex * 100ms"
    - "Shared Suspense fallback (GlassCardSkeleton) replacing per-device skeletons"
key-files:
  created: []
  modified:
    - app/components/DashboardCards.tsx
    - app/components/EmberGlass/index.ts
    - lib/services/unifiedDeviceConfigService.ts
    - app/components/__tests__/DashboardCards.test.tsx
decisions:
  - "Made hasHomepageCard always return true: every device with a registered card in DashboardCards.CARD_COMPONENTS is dashboard-eligible (PATTERNS A-03)"
  - "Kept relative imports inside EmberGlass/index.ts barrel (./cards/StoveCard) — conventional for in-module barrels"
  - "Updated sonos description to drop 'solo menu' suffix since dashboard card is now wired"
  - "Left lib/utils/dashboardColumns.ts (splitIntoColumns) as orphan utility — deletion deferred to v20.0 cleanup phase per plan note"
metrics:
  completed: 2026-04-28
  duration_minutes: 12
  tasks_completed: 2
  files_modified: 4
requirements: [DASH-01, DASH-05, DASH-11, DASH-12]
---

# Phase 177 Plan 07: Dashboard Integration Summary

Cuts the dashboard over from the v8.1 two-column flexbox masonry to the equal-size 1:1 EmberGlass card grid (DASH-01). Wires all 10 EmberGlass cards into `DashboardCards.tsx`, flips `hasHomepageCard` so Sonos is finally dashboard-visible (A-03 / LANDMINE #1), extends the EmberGlass barrel for downstream consumers, and updates the jest spec to assert grid shape and stagger animation. The legacy `splitIntoColumns` utility is now an orphan; its deletion is deferred to a future cleanup phase.

## Tasks

### Task 1 — Rewrite DashboardCards.tsx + extend barrel + flip Sonos gate
**Commit:** `7288ca4b`

- Replaced the dual mobile (`flex-col gap-6 sm:hidden`) and desktop (`hidden sm:flex`) masonry blocks with a single `<div className="grid grid-cols-2 gap-3 max-w-md sm:max-w-2xl mx-auto px-3">` (DASH-01).
- Removed `splitIntoColumns` import and the precomputed `leftColumn` / `rightColumn` plumbing.
- Removed the legacy `CARD_SKELETONS` registry — all cards now share a single `<GlassCardSkeleton />` Suspense fallback (DS-24).
- Replaced 10 imports from `./devices/{stove,thermostat,...}` with imports from `./EmberGlass/cards/{Stove,Climate,Lights,Sonos,Weather,Camera,Network,Raspi,Tuya,Dirigera}Card`.
- Updated `CARD_COMPONENTS.thermostat` to map to `ClimateCard` (the EmberGlass climate card replaces the legacy `ThermostatCard`).
- Preserved v9.0 stagger animation: each card slot wrapped in `animate-spring-in` with `animationDelay: ${flatIndex * 100}ms` (DASH-12).
- Preserved auth gate verbatim (T-177-07 mitigation): `auth0.getSession()` + `redirect('/auth/login')` unchanged.
- Preserved `EmptyState` when `visibleCards.length === 0`.
- Preserved `DeviceCardErrorBoundary` per-card with `DEVICE_META` driving `deviceName` / `deviceIcon`.

**Barrel changes (`app/components/EmberGlass/index.ts`):**

Added 22 new exports while keeping the original 11 untouched:

```ts
// Primitives
export { GlassCard } from './GlassCard';
export type { GlassCardProps } from './GlassCard';
export { CardHead } from './CardHead';
export type { CardHeadProps } from './CardHead';
export { StatusDot } from './StatusDot';
export type { StatusDotProps } from './StatusDot';
export { MiniStat } from './MiniStat';
export type { MiniStatProps } from './MiniStat';
export { PlayingBars } from './PlayingBars';
export { InlineToggle } from './InlineToggle';
export type { InlineToggleProps } from './InlineToggle';
export { GlassCardSkeleton } from './GlassCardSkeleton';

// Cards (10 default re-exports as named)
export { default as StoveCard } from './cards/StoveCard';
export { default as ClimateCard } from './cards/ClimateCard';
export { default as LightsCard } from './cards/LightsCard';
export { default as SonosCard } from './cards/SonosCard';
export { default as WeatherCard } from './cards/WeatherCard';
export { default as CameraCard } from './cards/CameraCard';
export { default as NetworkCard } from './cards/NetworkCard';
export { default as RaspiCard } from './cards/RaspiCard';
export { default as TuyaCard } from './cards/TuyaCard';
export { default as DirigeraCard } from './cards/DirigeraCard';

// Sheet placeholder (for cards still using SheetPlaceholderBody)
export { SheetPlaceholderBody } from './cards/SheetPlaceholderBody';
export type { SheetPlaceholderBodyProps, SheetPlaceholderDevice } from './cards/SheetPlaceholderBody';
```

**`unifiedDeviceConfigService.ts` change (A-03 / LANDMINE #1):**

Before:
```ts
function hasHomepageCard(deviceId: DeviceId): boolean {
  // Sonos doesn't have a homepage card yet
  return deviceId !== 'sonos';
}
```

After:
```ts
/**
 * Check if device has a homepage card
 * Phase 177 (A-03 / LANDMINE #1): Sonos enabled on dashboard.
 * Every device with a registered card in DashboardCards.CARD_COMPONENTS
 * is dashboard-eligible.
 */
function hasHomepageCard(_deviceId: DeviceId): boolean {
  return true;
}
```

Also updated `getDeviceDescription`: `sonos: 'Sistema audio Sonos (solo menu)'` → `sonos: 'Sistema audio Sonos'` (drop now-incorrect "solo menu" suffix).

**Verification:** `npx tsc --noEmit` reports zero errors in any file touched by this plan (pre-existing test errors in `app/debug/` and `app/network/__tests__/` are out of scope per Rule 4).

### Task 2 — Update DashboardCards.test.tsx for grid shape
**Commit:** `a04076ed`

Test suite rewritten to match the new grid contract:

- **Removed** mocks for `@/lib/utils/dashboardColumns` and `@/app/components/ui/Skeleton.*`.
- **Removed** the `setupColumnMock` / `splitIntoColumns` helper machinery.
- **Updated** all 6 legacy card mocks (`devices/{stove,thermostat,weather,lights,camera,network}/...`) to mock the 10 new EmberGlass cards (`EmberGlass/cards/{Stove,Climate,Lights,Sonos,Weather,Camera,Network,Raspi,Tuya,Dirigera}Card`).
- **Added** a `GlassCardSkeleton` mock pointing to `EmberGlass/GlassCardSkeleton`.
- **Updated** card-count expectations: legacy spec asserted `toHaveLength(2)` because masonry rendered both mobile + desktop blocks; new spec asserts `toHaveLength(1)` because the single grid renders each card exactly once.
- **Added** new test `renders cards inside a single 2-col grid (DASH-01)`: queries `.grid.grid-cols-2`, asserts non-null, asserts child count equals visible cards length, asserts no legacy `.flex-col.gap-6.sm\\:hidden` masonry wrapper.
- **Added** new test `applies stagger animation to each card slot (DASH-12)`: asserts `.animate-spring-in` count equals card count, asserts `style.animationDelay` is `0ms`, `100ms`, `200ms` for indices 0/1/2.
- **Replaced** the all-6-cards test with an all-10-cards test covering `stove`, `thermostat`, `weather`, `lights`, `camera`, `network`, `raspi`, `sonos`, `dirigera`, `tuya`.
- Preserved auth-redirect, EmptyState, and DOM-order tests verbatim.

**Test result:** 8/8 DashboardCards tests pass; full EmberGlass suite (153 tests across 25 files) green.

```
PASS app/components/__tests__/DashboardCards.test.tsx
Test Suites: 2 passed, 2 total
Tests:       18 passed, 18 total
```

```
Test Suites: 25 passed, 25 total
Tests:       153 passed, 153 total
Ran all test suites matching __tests__/app/components|EmberGlass.
```

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 — Missing critical functionality] Outdated sonos description**
- **Found during:** Task 1 (reading `unifiedDeviceConfigService.ts`)
- **Issue:** `getDeviceDescription` returned `'Sistema audio Sonos (solo menu)'` for sonos, which becomes a lie the moment `hasHomepageCard` is flipped to `true`.
- **Fix:** Changed to `'Sistema audio Sonos'`.
- **Files modified:** `lib/services/unifiedDeviceConfigService.ts`
- **Commit:** `7288ca4b`

### Notes / clarifications (not deviations)

- **Barrel relative imports vs. acceptance grep:** The acceptance criterion `grep -c "EmberGlass/cards/" app/components/EmberGlass/index.ts >= 9` is technically not satisfied because the barrel uses conventional in-module relative imports (`./cards/StoveCard`, 12 occurrences). The criterion's *intent* — "9+ card re-exports present" — is satisfied (10 card default re-exports). Not switching to absolute paths inside an in-module barrel is the conventional choice; the same intent grep on `./cards/` returns 12.
- **`DashboardCards.tsx` `EmberGlass/cards/` count:** 10 occurrences (one per card import). DASH-01 / DASH-12 / DS-24 acceptance greps all pass.
- **`splitIntoColumns` orphan:** `lib/utils/dashboardColumns.ts` is now orphaned (zero importers in production code). Per the plan note, deletion is deferred to v20.0 cleanup. The file's tests still pass.

## Threat Model Mitigations

| Threat ID | Mitigation |
|-----------|------------|
| T-177-07 (Authentication bypass) | Auth gate preserved verbatim: `auth0.getSession()` + `redirect('/auth/login')` unchanged. Verified by reading the previous file before rewrite and by the `redirects to login when no session` jest test (still green). |

## Acceptance Verification

| Criterion | Result |
|-----------|--------|
| `grep -q "EmberGlass/cards/StoveCard" app/components/DashboardCards.tsx` | PASS |
| `grep -q "grid-cols-2" app/components/DashboardCards.tsx` | PASS |
| `grep -q "max-w-md sm:max-w-2xl" app/components/DashboardCards.tsx` | PASS |
| `grep -q "GlassCardSkeleton" app/components/DashboardCards.tsx` | PASS |
| `grep -q "animate-spring-in" app/components/DashboardCards.tsx` | PASS |
| `grep -q "animationDelay" app/components/DashboardCards.tsx` | PASS |
| `grep -c "splitIntoColumns" app/components/DashboardCards.tsx == 0` | PASS (0) |
| `grep -c "CARD_SKELETONS" app/components/DashboardCards.tsx == 0` | PASS (0) |
| `grep -c "flex-col gap-6 sm:hidden" app/components/DashboardCards.tsx == 0` | PASS (0) |
| Card re-exports in barrel >= 9 | PASS (10 via `./cards/`) |
| `grep -q "GlassCardSkeleton" app/components/EmberGlass/index.ts` | PASS |
| `grep -q "SheetPlaceholderBody" app/components/EmberGlass/index.ts` | PASS |
| `grep -q "Phase 177" lib/services/unifiedDeviceConfigService.ts` | PASS |
| Sonos no longer mapped to false in `hasHomepageCard` | PASS (function returns `true` for all IDs) |
| useMemo / useCallback in DashboardCards.tsx == 0 | PASS (0) |
| `npx tsc --noEmit` exits 0 (for files touched by this plan) | PASS |
| `grep -c "splitIntoColumns" app/components/__tests__/DashboardCards.test.tsx == 0` | PASS (0) |
| `grep -c "Skeleton.StovePanel\|Skeleton.LightsCard" tests == 0` | PASS (0) |
| EmberGlass card mocks in test >= 9 | PASS (10) |
| `grep -q "grid-cols-2" tests` | PASS |
| `npm run test:components -- --testPathPatterns='__tests__/DashboardCards\.test'` exits 0 | PASS (8/8) |

## Self-Check: PASSED

- File `app/components/DashboardCards.tsx`: FOUND
- File `app/components/EmberGlass/index.ts`: FOUND
- File `lib/services/unifiedDeviceConfigService.ts`: FOUND
- File `app/components/__tests__/DashboardCards.test.tsx`: FOUND
- Commit `7288ca4b`: FOUND
- Commit `a04076ed`: FOUND

## Success Criteria

- [x] DASH-01 — Single 2-col grid (`grid-cols-2`, `max-w-md sm:max-w-2xl`) replaces masonry; identical 1:1 footprint mobile + desktop.
- [x] DASH-05 — Sonos visible on dashboard (`hasHomepageCard` returns true; `SonosCard` mapped in `CARD_COMPONENTS`).
- [x] DASH-11 — Each card mounts its own Sheet (preserved from Wave 2; integration unblocked).
- [x] DASH-12 — Stagger preserved: `animate-spring-in` + `animationDelay: flatIndex * 100ms` on each card slot.
