---
phase: 144-connection-ux
plan: 03
type: gap_closure
status: complete
completed: 2026-04-15
commits:
  - 1f15bb44
  - 5cdafebc
  - 8cb30ca2
  - c29bb405
files_modified:
  - app/components/ui/DeviceCard.tsx
  - app/components/devices/lights/LightsCard.tsx
  - app/components/devices/thermostat/ThermostatCard.tsx
  - app/components/devices/thermostat/hooks/useThermostatData.ts
  - app/components/devices/thermostat/hooks/__tests__/useThermostatData.test.ts
  - .planning/milestones/v17.0-phases/144-connection-ux/144-UAT.md
requirements: [UX-03]
closes_gaps: [UAT#5, UAT#8]
---

# Plan 144-03 Gap Closure Summary

## Scope

Closed 2 UAT gaps reported in 144-UAT.md:
- **UAT#5** (minor): LightsCard `Aggiornato X fa` positioned mid-card instead of at the bottom
- **UAT#8** (major): ThermostatCard missing temperature data + timestamp at wrong position

## Root Causes

1. **Footer ordering** — `<LastUpdated>` was rendered as a DeviceCard child. DeviceCard renders children BEFORE `infoBoxes` and `footerActions`, so the timestamp appeared above those elements.

2. **Missing thermostat data** — `useThermostatData` used `useAdaptivePolling({ interval: isWsConnected ? null : ... })`. When WS was OPEN before the initial HTTP poll fired, polling was suppressed. If the netatmo WS topic did not push an initial snapshot, `status` stayed `null` forever, so `selectedRoom.temperature` rendered as undefined.

## Changes

### Task 1 — DeviceCard footerContent slot (commit `1f15bb44`)
- Added `footerContent?: ReactNode` prop to `DeviceCardProps`
- Rendered after the `footerActions` block and before the `LoadingOverlay`
- Backwards-compatible: existing callers that don't pass it are unaffected

### Task 2 — LightsCard migration (commit `5cdafebc`)
- Moved `<LastUpdated>` out of DeviceCard children
- Passed via new `footerContent` prop so it sits below the "Tutte le Stanze e Scene →" button

### Task 3 — ThermostatCard migration (commit `8cb30ca2`)
- Moved `<LastUpdated>` out of DeviceCard children
- Passed via `footerContent` so it sits below the `Casa / Stanze / Dispositivi` infoBoxes grid

### Task 4 — Thermostat initial fetch decoupled from WS gate (commit `c29bb405`)
- Added `initialStatusFetchedRef` + new `useEffect` that fires `fetchStatus()` exactly once when `topology` becomes non-null, regardless of WS connection state
- Subsequent updates continue to flow through the WS primary / polling fallback paths
- Updated Tests 13 and 14 in `useThermostatData.test.ts` to reflect the new initial-fetch ordering (status is populated by HTTP before WS messages arrive in the test)

### Task 5 — Manual UAT
- User verified both cases pass in browser
- Updated `144-UAT.md`: status `partial → complete`, test #5 + #8 marked `pass`, summary counters `passed: 5 → 7`, `issues: 2 → 0`, gaps section cleared

## Verification

- `npm test` — affected suites (DeviceCard, LightsCard, useThermostatData) all green, 86/86 tests pass
- `npx tsc --noEmit` — zero errors in modified files (pre-existing errors in unrelated `thermorossi` + `automations` routes not touched here)
- Browser UAT (user-confirmed):
  - LightsCard timestamp now below "Tutte le Stanze e Scene →" button
  - ThermostatCard shows temperature value in "Attuale" box + timestamp below infoBoxes

## Out of Scope

- Pre-existing failures in `ThermostatCard.schedule.test.tsx` (OnlineStatusProvider context missing in test setup) — unrelated to this gap closure, to be addressed separately
- UAT #2, #6, #10 remain skipped/blocked (non-gap-closure scenarios: WS disconnect testing, Sonos device not enabled in user's registry)

## Architectural Note

The DeviceCard render order is now: `children → infoBoxes → footerActions → footerContent → LoadingOverlay`. The `footerContent` slot is the canonical placement for trailing card metadata (timestamps, status lines). Other cards (Stove, Network, Sonos, Dirigera) use `SmartHomeCard` directly and are unaffected — they already controlled ordering via JSX placement.
