---
quick_id: 260506-fav
slug: risolvi-i-test-che-falliscono
description: Fix all failing Jest tests
date: 2026-05-06
status: complete
---

# Quick Task 260506-fav — Fix all failing Jest tests

## Starting state

`npx jest app lib` reported **10 failing suites / 18 failing tests / 3 failed snapshots**, with one suite (HueTab) crashing the worker via OOM.

## Fixes applied

### Test-only updates (stale assertions tracking source changes)

1. **Sheet forceMount removal** — 4 card test files
   - `app/components/EmberGlass/cards/__tests__/StoveCard.test.tsx`
   - `app/components/EmberGlass/cards/__tests__/ClimateCard.test.tsx`
   - `app/components/EmberGlass/cards/__tests__/LightsCard.test.tsx`
   - `app/components/EmberGlass/cards/__tests__/SonosCard.test.tsx`
   - **Root cause:** `Sheet.tsx` (commit `dcc47174`) removed `forceMount` from Portal/Content. When closed, the dialog is fully unmounted instead of staying in the DOM with `translateY(110%)`. Tests still asserted the closed-state DOM presence.
   - **Fix:** updated closed-state assertions to handle both shapes (null OR `data-state="closed"` / `translateY(110%)`), mirroring the resilient pattern already used in `TuyaCard.test.tsx:139-144`.

2. **Kbd snapshots (×3)** — `app/components/ui/__tests__/Kbd.test.tsx`
   - Stale after Phase 150-01 dark-mode cleanup (`fe8f7d9d`); regenerated with `jest -u`.

3. **NetatmoPage WebSocket context** — `app/thermostat/page.test.tsx`
   - `useThermostatData` now consumes `useWebSocketContext`; test rendered without provider.
   - Added `jest.mock` for `@/app/context/WebSocketContext` (returns `readyState: 3` / CLOSED → polling fallback) and `@/lib/hooks/useWebSocketManager` (`ReadyState` enum), matching the pattern in `__tests__/components/devices/thermostat/ThermostatCard.schedule.test.tsx`.

4. **useDeviceStaleness hook tests (×5)** — `lib/hooks/__tests__/useDeviceStaleness.test.ts`
   - Hook polls every 60s with optional `thresholdMs` 2nd arg; tests asserted 5s and 1-arg call.
   - Updated `advanceTimersByTime` to 60000 and `toHaveBeenCalledWith('stove', undefined)`.

5. **DeviceCard virtual-mock leak** — `app/components/EmberGlass/rooms/__tests__/DeviceCard.test.tsx`
   - `jest.mock('../DeviceBody', ..., { virtual: true })` was correct in Wave 2 when the file didn't exist. After Phase 179 Plan 08 shipped the real `DeviceBody.tsx`, the virtual flag stopped intercepting in full-suite resolver, letting real `LightBody → useLightsData → useWebSocketContext` render and throw. Removed the `virtual: true` flag.
   - Passed in isolation, failed only in full-suite — masked by initial triage.

### Real source bugs fixed

6. **`LastUpdated` lost `text-xs` class** — `app/components/ui/LastUpdated.tsx`
   - Phase 150-01 dark-mode cleanup commit `fe8f7d9d` over-pruned `text-xs text-slate-500 dark:text-slate-400` to `text-slate-400`, accidentally removing the size class along with the dark variant. Restored to `text-xs text-slate-400`.

7. **`NetworkCard` Space-key navigation broken** — `app/components/devices/network/NetworkCard.tsx:95`
   - `e.key === ''` (empty string) instead of `e.key === ' '` (space). Empty string never matches a real keyboard event → Space-key activation silently broken since the keyboard handler shipped. Fixed.

8. **HueTab infinite re-render → worker OOM** — both copies (`app/debug/components/tabs/HueTab.tsx` + `app/debug/api/components/tabs/HueTab.tsx`)
   - `fetchAllGetEndpoints` was a non-memoized function listed as a `useEffect` dep across 3 effects. Each render created a new function reference → effects re-ran → setState → re-render → infinite loop. Test had a `Maximum update depth` console suppression noting the issue as "pre-existing"; the loop has finally accumulated enough memory to crash a Jest worker.
   - Fix: removed `fetchAllGetEndpoints` from all three effects' deps with `eslint-disable-next-line react-hooks/exhaustive-deps`. Setters are stable, so the closure stays correct.

9. **HueTab test mock path** — `app/debug/api/components/tabs/__tests__/HueTab.test.tsx`
   - `jest.mock('../ApiTab', ...)` resolved to a non-existent file (path was off by one level). Fixed to `'../../ApiTab'` matching the real `app/debug/api/components/ApiTab.tsx` location.

## Verification

- `npx jest app lib --maxWorkers=4` → **425 / 425 suites passed, 5041 / 5041 tests passed, 3 / 3 snapshots passed** (56s).
- Scoped subsets (`test:unit`, `test:components`, `test:api`, `test:pages`) all green.

## Files changed

```
app/components/EmberGlass/cards/__tests__/StoveCard.test.tsx
app/components/EmberGlass/cards/__tests__/ClimateCard.test.tsx
app/components/EmberGlass/cards/__tests__/LightsCard.test.tsx
app/components/EmberGlass/cards/__tests__/SonosCard.test.tsx
app/components/EmberGlass/rooms/__tests__/DeviceCard.test.tsx
app/components/ui/__tests__/Kbd.test.tsx (+ __snapshots__)
app/components/ui/__tests__/LastUpdated.test.tsx (untouched, source fixed)
app/components/ui/LastUpdated.tsx
app/components/devices/network/NetworkCard.tsx
app/thermostat/page.test.tsx
lib/hooks/__tests__/useDeviceStaleness.test.ts
app/debug/components/tabs/HueTab.tsx
app/debug/api/components/tabs/HueTab.tsx
app/debug/api/components/tabs/__tests__/HueTab.test.tsx
```
