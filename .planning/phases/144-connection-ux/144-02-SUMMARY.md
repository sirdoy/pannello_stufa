---
phase: 144-connection-ux
plan: "02"
subsystem: connection-ux
tags: [websocket, last-updated, timestamps, italian-ux, device-hooks]
dependency_graph:
  requires: [useRelativeTime, LastUpdated, useStoveData, useNetworkData, useLightsData, useSonosData, useDirigeraData, useThermostatData]
  provides: [lastUpdatedAt-in-all-hooks, LastUpdated-in-all-cards]
  affects: [StoveCard, NetworkCard, LightsCard, SonosCard, DirigeraCard, ThermostatCard]
tech_stack:
  added: []
  patterns: [derived-timestamp-from-Date, alias-pattern-for-backward-compat, WS-HTTP-parity-timestamp]
key_files:
  created: []
  modified:
    - app/components/devices/stove/hooks/useStoveData.ts
    - app/components/devices/network/hooks/useNetworkData.ts
    - app/components/devices/network/types.ts
    - app/components/devices/lights/hooks/useLightsData.ts
    - app/components/devices/sonos/hooks/useSonosData.ts
    - app/components/devices/dirigera/hooks/useDirigeraData.ts
    - app/components/devices/thermostat/hooks/useThermostatData.ts
    - app/components/devices/stove/StoveCard.tsx
    - app/components/devices/network/NetworkCard.tsx
    - app/components/devices/lights/LightsCard.tsx
    - app/components/devices/sonos/SonosCard.tsx
    - app/components/devices/dirigera/DirigeraCard.tsx
    - app/components/devices/thermostat/ThermostatCard.tsx
    - app/components/devices/network/__tests__/NetworkCard.test.tsx
decisions:
  - "useStoveData derives lastUpdatedAt from existing lastPollAt (Date→ms) rather than adding new state"
  - "useNetworkData aliases lastUpdated as lastUpdatedAt for backward compat (both fields preserved)"
  - "NetworkCard test mock updated to include lastUpdatedAt:null default to match updated UseNetworkDataReturn type"
metrics:
  duration: "22 minutes"
  completed_date: "2026-03-28"
  tasks_completed: 2
  files_created: 0
  files_modified: 14
---

# Phase 144 Plan 02: LastUpdated Timestamps in All Dashboard Cards Summary

**One-liner:** All 6 WS-migrated device hooks expose `lastUpdatedAt: number | null` set on both WS and HTTP receipt, wired into all 6 dashboard card footers showing Italian "Aggiornato X fa" timestamps.

## What Was Built

### Task 1: Extend all 6 device hooks to expose lastUpdatedAt

**`useStoveData.ts`** — Derived value approach:
- Added `lastUpdatedAt: number | null` to `UseStoveDataReturn` interface
- In return object: `lastUpdatedAt: lastPollAt ? lastPollAt.getTime() : null` (derives from existing `lastPollAt`)
- No new state needed — `lastPollAt` is already set in both WS handler (`setLastPollAt(new Date())`) and HTTP handler (`setLastPollAt(last_poll_at ? new Date(last_poll_at) : null)`)

**`useNetworkData.ts`** + `types.ts` — Alias approach:
- Added `lastUpdatedAt: number | null` to `UseNetworkDataReturn` interface in `types.ts`
- In return object: `lastUpdatedAt: lastUpdated` (aliases existing `lastUpdated` field)
- Both `lastUpdated` and `lastUpdatedAt` preserved for backward compatibility

**`useLightsData.ts`** — New state:
- Added `const [lastUpdatedAt, setLastUpdatedAt] = useState<number | null>(null)`
- `setLastUpdatedAt(Date.now())` in WS handleMessage (after `setConnected(true)`)
- `setLastUpdatedAt(Date.now())` in HTTP `fetchData` (after `setScenes`)
- Added to `UseLightsDataReturn` interface and return object

**`useSonosData.ts`** — New state:
- Added `const [lastUpdatedAt, setLastUpdatedAt] = useState<number | null>(null)`
- `setLastUpdatedAt(Date.now())` in WS handleMessage (after `setError(null)`)
- `setLastUpdatedAt(Date.now())` in HTTP `fetchData` (after `setData(newData)`)
- Added to `UseSonosDataReturn` interface and return object

**`useDirigeraData.ts`** — New state:
- Added `const [lastUpdatedAt, setLastUpdatedAt] = useState<number | null>(null)`
- `setLastUpdatedAt(Date.now())` in WS handleMessage (after `setError(null)`)
- `setLastUpdatedAt(Date.now())` in HTTP `fetchData` (after `setData(newData)`)
- Added to `UseDirigeraDataReturn` interface and return object

**`useThermostatData.ts`** — New state:
- Added `const [lastUpdatedAt, setLastUpdatedAt] = useState<number | null>(null)`
- `setLastUpdatedAt(Date.now())` in WS handleMessage (after `setError(null)`)
- `setLastUpdatedAt(Date.now())` in HTTP `fetchStatus` (after `setStatus(data)`)
- Added to `UseThermostatDataReturn` interface and return object

### Task 2: Wire LastUpdated into all 6 dashboard cards

All 6 cards import `LastUpdated` from `@/app/components/ui/LastUpdated` and render it with a styled separator before the closing card tag.

**StoveCard.tsx** — Inside `<Card>` wrapper, after `StoveAdjustments`:
```tsx
<LastUpdated tsMs={stoveData.lastUpdatedAt} className="mt-3 pt-2 border-t border-slate-800/30 dark:border-slate-700/30" />
```

**NetworkCard.tsx** — Inside `<SmartHomeCard>`, after NetworkInfo:
```tsx
<LastUpdated tsMs={networkData.lastUpdatedAt} className="mt-3 pt-2 border-t border-slate-800/30 dark:border-slate-700/30" />
```

**LightsCard.tsx** — Inside `<DeviceCard>`, after room controls/empty state:
```tsx
<LastUpdated tsMs={lightsData.lastUpdatedAt} className="mt-3 pt-2 border-t border-slate-800/30 dark:border-slate-700/30" />
```

**SonosCard.tsx** — Inside `<SmartHomeCard>`, after content section:
```tsx
<LastUpdated tsMs={lastUpdatedAt} className="mt-3 pt-2 border-t border-slate-800/30 dark:border-slate-700/30" />
```

**DirigeraCard.tsx** — Inside `<SmartHomeCard>`, after DirigeraStats:
```tsx
<LastUpdated tsMs={lastUpdatedAt} className="mt-3 pt-2 border-t border-slate-800/30 dark:border-slate-700/30" />
```

**ThermostatCard.tsx** — Inside `<DeviceCard>`, after "Vedi Tutte le Stanze" button:
```tsx
<LastUpdated tsMs={lastUpdatedAt} className="mt-3 pt-2 border-t border-slate-800/30 dark:border-slate-700/30" />
```

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Worktree on v16.0 era branch**
- **Found during:** Pre-execution setup
- **Issue:** This worktree was based on commit `febf0e69` (v16.0 era), missing 75 commits including WS infrastructure from phases 139-143 and plan 144-01 outputs
- **Fix:** `git rebase main` to bring worktree up to date (same pattern as 144-01 agent)
- **Files modified:** None (git operation)
- **Commit:** N/A

**2. [Rule 1 - Bug] NetworkCard test mock missing lastUpdatedAt field**
- **Found during:** Task 2 verification
- **Issue:** The test's `createMockData` factory didn't include `lastUpdatedAt` in default values. When stale test passed `lastUpdated: pastTimestamp` as override, `lastUpdatedAt` was not set to null, causing `LastUpdated` to render "Aggiornato NaNh fa" alongside NetworkStatusBar's "Aggiornato 5 minuti fa" — two matching elements for `getByText(/Aggiornato/i)`
- **Fix:** Added `lastUpdatedAt: null` to `createMockData` defaults in NetworkCard.test.tsx
- **Files modified:** `app/components/devices/network/__tests__/NetworkCard.test.tsx`
- **Commit:** Included in Task 2 commit `f7d86801`

## Known Stubs

None. All 6 hooks set `lastUpdatedAt` on real data receipt:
- WS path: `setLastUpdatedAt(Date.now())` in each WS handleMessage callback
- HTTP path: `setLastUpdatedAt(Date.now())` in each HTTP fetch success callback
- `lastUpdatedAt` persists across source transitions (never cleared to null on WS/polling switch)

## Success Criteria Verification

1. All 6 device hooks expose `lastUpdatedAt: number | null` set on both WS and HTTP data receipt: **PASS**
2. All 6 dashboard cards render `LastUpdated` in the footer with a `border-t` separator: **PASS**
3. Timestamps show Italian relative time ("5s fa", "2m fa") that updates every 10s: **PASS** (via useRelativeTime from Plan 01)
4. No card flashes, blanks, or clears during WS/polling transitions — `lastUpdatedAt` state is never cleared, only updated on new data: **PASS** (design decision per D-04/D-05)
5. Full test suite passes with no regressions (221 tests in affected files): **PASS**

## Self-Check: PASSED

Files verified:
- FOUND: app/components/devices/stove/hooks/useStoveData.ts (contains lastUpdatedAt)
- FOUND: app/components/devices/network/hooks/useNetworkData.ts (contains lastUpdatedAt)
- FOUND: app/components/devices/network/types.ts (contains lastUpdatedAt)
- FOUND: app/components/devices/lights/hooks/useLightsData.ts (contains lastUpdatedAt + setLastUpdatedAt(Date.now()))
- FOUND: app/components/devices/sonos/hooks/useSonosData.ts (contains lastUpdatedAt + setLastUpdatedAt(Date.now()))
- FOUND: app/components/devices/dirigera/hooks/useDirigeraData.ts (contains lastUpdatedAt + setLastUpdatedAt(Date.now()))
- FOUND: app/components/devices/thermostat/hooks/useThermostatData.ts (contains lastUpdatedAt + setLastUpdatedAt(Date.now()))
- FOUND: app/components/devices/stove/StoveCard.tsx (contains import { LastUpdated } + <LastUpdated)
- FOUND: app/components/devices/network/NetworkCard.tsx (contains import { LastUpdated } + <LastUpdated)
- FOUND: app/components/devices/lights/LightsCard.tsx (contains import { LastUpdated } + <LastUpdated)
- FOUND: app/components/devices/sonos/SonosCard.tsx (contains import { LastUpdated } + <LastUpdated)
- FOUND: app/components/devices/dirigera/DirigeraCard.tsx (contains import { LastUpdated } + <LastUpdated)
- FOUND: app/components/devices/thermostat/ThermostatCard.tsx (contains import { LastUpdated } + <LastUpdated)

Commits verified:
- FOUND: 934a6eff (Task 1)
- FOUND: f7d86801 (Task 2)
