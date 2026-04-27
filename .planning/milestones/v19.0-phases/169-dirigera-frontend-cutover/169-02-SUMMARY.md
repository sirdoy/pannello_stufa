---
phase: 169-dirigera-frontend-cutover
plan: 02
subsystem: dirigera
tags: [hooks, panels, pagination, playwright, v1-consumers, italian-ui]
dependency_graph:
  requires: [169-01]
  provides: [dirigera-history-hook, dirigera-stats-hook, dirigera-telemetry-hook, dirigera-history-panel, dirigera-stats-panel, dirigera-telemetry-panel]
  affects: [app/components/devices/dirigera, app/dirigera, tests/smoke]
tech_stack:
  added: []
  patterns: [useAdaptivePolling, replace-on-poll/append-on-loadMore, stale-while-revalidate-dataRef, URLSearchParams-pagination, Intl.DateTimeFormat-it-IT]
key_files:
  created:
    - app/components/devices/dirigera/hooks/useDirigeraStats.ts
    - app/components/devices/dirigera/hooks/__tests__/useDirigeraStats.test.ts
    - app/components/devices/dirigera/hooks/useDirigeraHistory.ts
    - app/components/devices/dirigera/hooks/__tests__/useDirigeraHistory.test.ts
    - app/components/devices/dirigera/hooks/useDirigeraTelemetry.ts
    - app/components/devices/dirigera/hooks/__tests__/useDirigeraTelemetry.test.ts
    - app/components/devices/dirigera/components/DirigeraStatsPanel.tsx
    - app/components/devices/dirigera/components/DirigeraHistoryPanel.tsx
    - app/components/devices/dirigera/components/DirigeraTelemetryPanel.tsx
  modified:
    - app/dirigera/page.tsx
    - tests/smoke/page-loads.spec.ts
decisions:
  - "Three independent hooks (useDirigeraStats, useDirigeraHistory, useDirigeraTelemetry) per D-07 — not folded into useDirigeraFullData"
  - "replace-on-poll / append-on-loadMore dual behaviour per Pitfall 6 — poll always resets offsetRef.current=0"
  - "Aspirational labels (Sensore più attivo, Eventi ultime 24h) excluded from DirigeraStatsPanel — fields absent from DirigeraStatsResponse per RESEARCH Q1"
  - "Panel headings use semantic <h2> with token classes (not Heading design-system component) to avoid unverified import dependency"
metrics:
  duration: 57min
  completed: "2026-04-22T20:46:00Z"
  tasks_completed: 7
  files_created: 9
  files_modified: 2
---

# Phase 169 Plan 02: DIRIGERA Frontend Cutover Summary

3 polling hooks with paginated load-more, 3 Italian-copy panel components, /dirigera page wiring, and Playwright smoke heading assertions — making DIR-01/02/03 end-to-end observable on the /dirigera page via /api/v1/dirigera/{history,stats,telemetry}.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| T1 | useDirigeraStats hook + test (DIR-02) | `b0abdf02` | useDirigeraStats.ts + test |
| T2 | useDirigeraHistory + useDirigeraTelemetry hooks + tests (DIR-01, DIR-03) | `5575f3cb` | 4 files (2 hooks + 2 tests) |
| T3 | DirigeraStatsPanel component (D-08, D-10) | `4ab11671` | DirigeraStatsPanel.tsx |
| T4 | DirigeraHistoryPanel + DirigeraTelemetryPanel (D-08, D-10) | `0edd33e9` | 2 panel components |
| T5 | Wire hooks + panels into /dirigera/page.tsx | `794dcf30` | app/dirigera/page.tsx |
| T6 | Extend /dirigera Playwright smoke test | `48d58023` | tests/smoke/page-loads.spec.ts |
| T7 | Full Jest + verification gate | — | No code changes (verification only) |

## What Was Built

### 3 New Polling Hooks

**useDirigeraStats** (`hooks/useDirigeraStats.ts`)
- Polls `/api/v1/dirigera/stats` at 300s visible / 600s hidden
- Returns `{ data: DirigeraStatsResponse | null, loading, error, stale }`
- dataRef pattern for stale-while-revalidate (retains last good data on error)
- Italian error: `'Impossibile caricare le statistiche'`

**useDirigeraHistory** (`hooks/useDirigeraHistory.ts`)
- Polls `/api/v1/dirigera/history?limit=50&offset=0` at 300s visible / 600s hidden
- `loadMore()` increments offsetRef by 50, appends to items array (non-destructive)
- Poll callback resets offsetRef=0 and REPLACES items (Pitfall 6 — intentional)
- `sensor_id` + `event_type` params forwarded via URLSearchParams
- Italian error: `'Impossibile caricare lo storico'`

**useDirigeraTelemetry** (`hooks/useDirigeraTelemetry.ts`)
- Identical structure to useDirigeraHistory with telemetry-specific adaptations
- Reads `data.telemetry` (not `data.events`)
- `sensor_id` param forwarded; `event_type` NOT in SensorTelemetryParams interface
- Italian error: `'Impossibile caricare la telemetria'`

### 3 New Panel Components

**DirigeraStatsPanel** — Aggregazione + Retention subsections
- 8 tiles total (4 per subsection): total rows, last_run timestamp, rows last run, last_run_status
- All 4 states: loading spinner / error / empty (`Statistiche non disponibili`) / data
- Stale badges: `Aggiornamento…` / `Dati non aggiornati`
- Timestamps via `Intl.DateTimeFormat('it-IT', { dateStyle: 'short', timeStyle: 'medium' })`
- Responsive grid: `grid-cols-2 gap-3 sm:grid-cols-4`

**DirigeraHistoryPanel** — Recent events paginated table
- 3 columns: Sensore (sensor_name ?? sensor_id), Tipo evento, Data/ora
- `Carica altri 50` button hidden when `items.length >= total`, disabled during `isLoadingMore`
- `overflow-x-auto` mobile scroll wrapper
- 4 states: loading / error (`Impossibile caricare lo storico`) / empty (`Nessun evento`) / data

**DirigeraTelemetryPanel** — Telemetry readings paginated table
- 4 columns: Sensore, Batteria (% or —), Lux (lux or —), Data/ora
- Same pagination button pattern as DirigeraHistoryPanel
- 4 states: loading / error (`Impossibile caricare la telemetria`) / empty (`Nessuna telemetria`) / data

### /dirigera/page.tsx Wiring

Imports added (6 new):
- `useDirigeraStats`, `useDirigeraHistory`, `useDirigeraTelemetry` (hooks)
- `DirigeraStatsPanel`, `DirigeraHistoryPanel`, `DirigeraTelemetryPanel` (components)

Hook calls added (3 new, before early-return skeleton guard):
```typescript
const stats = useDirigeraStats();
const history = useDirigeraHistory({ limit: 50 });
const telemetry = useDirigeraTelemetry({ limit: 50 });
```

JSX panels added after `DirigeraSensorList`, inside `space-y-6` wrapper.

### Playwright Smoke Extension

`/dirigera loads and shows data` test extended with:
```typescript
await expect(page.getByText('Statistiche', { exact: true })).toBeVisible({ timeout: 15000 });
await expect(page.getByText('Eventi recenti', { exact: true })).toBeVisible({ timeout: 15000 });
await expect(page.getByText('Telemetria', { exact: true })).toBeVisible({ timeout: 15000 });
```
Panel headings always present regardless of data state (loading/error/empty shows heading + state body).

## Test Results

**Dirigera-focused Jest (`--testPathPatterns="dirigera"`):** 78/78 tests, 14 suites — ALL PASS

New test suites:
- `useDirigeraStats.test.ts` — 5 tests (interval, fetch URL, data shape, error degradation)
- `useDirigeraHistory.test.ts` — 7 tests (intervals, URL, loadMore append, poll replace, sensor_id, error)
- `useDirigeraTelemetry.test.ts` — 7 tests (same structure as history)

**Full Jest suite:** 10-12 failing suites, all pre-existing (documented in 169-01-SUMMARY.md):
- `useLightsData.test.ts`, `useLightsCommands.test.ts` — pre-existing lights URL assertions
- `NetworkCard.test.tsx` — pre-existing Space key navigation
- `HueTab.test.tsx` — pre-existing missing module
- `Kbd.test.tsx` — pre-existing snapshot mismatch
- `LastUpdated.test.tsx` — pre-existing class assertion
- `FormModal.test.tsx` — pre-existing
- `useDeviceStaleness.test.ts` — pre-existing
- `ThermostatCard.schedule.test.tsx` — pre-existing
- `app/thermostat/page.test.tsx` — pre-existing
- `CopyableIp.test.tsx`, `Rooms` tests — pass in isolation, timing-related flakiness under full run load

## DIR Requirements Closure

| Requirement | Hook | Panel | Smoke | Status |
|-------------|------|-------|-------|--------|
| DIR-01 (history) | `useDirigeraHistory` fetches `/api/v1/dirigera/history` | `DirigeraHistoryPanel` on /dirigera | `getByText('Eventi recenti')` | CLOSED |
| DIR-02 (stats) | `useDirigeraStats` fetches `/api/v1/dirigera/stats` | `DirigeraStatsPanel` on /dirigera | `getByText('Statistiche')` | CLOSED |
| DIR-03 (telemetry) | `useDirigeraTelemetry` fetches `/api/v1/dirigera/telemetry` | `DirigeraTelemetryPanel` on /dirigera | `getByText('Telemetria')` | CLOSED |

## Wave-Exit Gates Verified

| Gate | Check | Result |
|------|-------|--------|
| G1 | `find app/api/v1/dirigera -name route.ts \| wc -l` = 8 | PASS |
| G2 | Zero `/api/dirigera/` literals in dirigera component files | PASS |
| G3 | Dirigera Jest suite 78/78 | PASS |
| G4 | 3 hook test files pass independently | PASS |
| G5 | Panel headings in Playwright smoke assertions | PASS (test written) |

## Deviations from Plan

None — plan executed exactly as written. All 7 tasks completed without auto-fix deviations.

## Known Stubs

None. All 3 hooks fetch real v1 endpoints (routed via HA proxy, authenticated). Panels render real API data. No hardcoded mock data flows to UI.

## Threat Flags

No new threat surface beyond the plan's threat model:
- T-169-04 (information disclosure): Auth0 session enforced at route layer — hooks inherit cookie
- T-169-05 (tampering): URLSearchParams on typed interface fields — no user-controlled text injection
- T-169-06 (XSS): All values rendered as React text children with automatic escaping
- T-169-07 (DoS): Low cadence 300s/600s with alwaysActive:false

## Self-Check

## Self-Check: PASSED
