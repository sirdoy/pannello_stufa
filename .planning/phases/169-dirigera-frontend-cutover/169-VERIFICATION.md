---
phase: 169-dirigera-frontend-cutover
verified: 2026-04-22T21:30:00Z
status: human_needed
score: 4/4 must-haves verified
overrides_applied: 0
human_verification:
  - test: "Navigate to /dirigera in a browser. Confirm the Statistiche, Eventi recenti, and Telemetria panel headings render and data (or empty/error states) appear without JS console errors."
    expected: "Three panels visible below the sensor list. Each shows either a spinner (loading), an Italian empty/error message, or real data tiles/rows from /api/v1/dirigera/{stats,history,telemetry}."
    why_human: "Playwright auth.setup.ts times out in the local BYPASS_AUTH=true environment — the same documented limitation as Phases 167 and 168 Plan 03. The Playwright test is written and the assertions are correct; the test cannot run programmatically in this environment without a real Auth0 token."
---

# Phase 169: DIRIGERA Frontend Cutover Verification Report

**Phase Goal:** `useDirigeraData` consumes `/api/v1/dirigera/*` history, stats, telemetry. Close v19.0 audit DIR integration gap (phase 163 orphan).
**Verified:** 2026-04-22T21:30:00Z
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Three new dedicated hooks (`useDirigeraHistory`, `useDirigeraStats`, `useDirigeraTelemetry`) consume `/api/v1/dirigera/history`, `/stats`, `/telemetry` respectively | VERIFIED | Hook files exist at `hooks/useDirigeraHistory.ts`, `useDirigeraStats.ts`, `useDirigeraTelemetry.ts`; each fetches the correct v1 URL (grep confirmed); 78/78 hook + route tests pass |
| 2 | Zero `/api/dirigera/` references outside debug/archived paths | VERIFIED | `grep -rn "/api/dirigera/" app/ lib/ types/ --include='*.ts' --include='*.tsx' \| grep -v "/api/v1/dirigera/" \| grep -v "lib/version.ts"` returns zero matches; `app/api/dirigera/` directory deleted via `git rm -r` (commit `04a6e147`) |
| 3 | `/dirigera` page renders history/stats/telemetry panels end-to-end | VERIFIED (code) / human_needed (runtime) | `app/dirigera/page.tsx` imports all 3 hooks + 3 panels, calls hooks before early-return guard, renders `<DirigeraStatsPanel>`, `<DirigeraHistoryPanel>`, `<DirigeraTelemetryPanel>` after `DirigeraSensorList`; Playwright assertions written (`getByText('Statistiche')`, `getByText('Eventi recenti')`, `getByText('Telemetria')`); runtime confirmation needs human due to `BYPASS_AUTH=true` environment |
| 4 | Jest + Playwright smoke green | VERIFIED (Jest) / human_needed (Playwright) | Dirigera-focused Jest: 78/78 tests, 14 suites — ALL PASS; Full Jest: 11 failed/326 passed — all 11 failures are documented pre-existing (Lights, NetworkCard, HueTab, Kbd, LastUpdated, FormModal, useDeviceStaleness, ThermostatCard suites); Playwright: auth.setup.ts times out in BYPASS_AUTH=true env (same documented limitation as Phases 167, 168) |

**Score:** 4/4 truths verified at code level

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `app/api/v1/dirigera/health/route.ts` | v1 health wrapper delegating to `getHealth()` | VERIFIED | Exists; `withAuthAndErrorHandler`, `force-dynamic`, full passthrough `success(data as unknown as Record<string, unknown>)` |
| `app/api/v1/dirigera/sensors/route.ts` | v1 sensors wrapper with explicit field spread | VERIFIED | Exists; `success({ sensors: data.sensors, count: data.count, is_stale: data.is_stale })` |
| `app/api/v1/dirigera/sensors/summary/route.ts` | v1 sensor-summary wrapper | VERIFIED | Exists; `getSensorSummary`, full passthrough |
| `app/api/v1/dirigera/sensors/contact/route.ts` | v1 contact-sensors wrapper | VERIFIED | Exists; `getContactSensors`, explicit spread |
| `app/api/v1/dirigera/sensors/motion/route.ts` | v1 motion-sensors wrapper | VERIFIED | Exists; `getMotionSensors`, explicit spread |
| `app/api/v1/dirigera/history/route.ts` | Pre-existing from Phase 163 | VERIFIED | Exists |
| `app/api/v1/dirigera/stats/route.ts` | Pre-existing from Phase 163 | VERIFIED | Exists |
| `app/api/v1/dirigera/telemetry/route.ts` | Pre-existing from Phase 163 | VERIFIED | Exists |
| `app/api/v1/dirigera/` v1 route count | 8 total route.ts files | VERIFIED | `find app/api/v1/dirigera -name route.ts -type f | wc -l` = 8 |
| `app/api/dirigera/` legacy tree | DELETED | VERIFIED | Directory does not exist; 5 files removed via `git rm -r` commit `04a6e147` |
| `app/components/devices/dirigera/hooks/useDirigeraHistory.ts` | Paginated history hook (DIR-01) | VERIFIED | Exists; fetches `/api/v1/dirigera/history?limit=50&offset=0`; `loadMore()` increments offset by 50; `data.events`; Italian error `'Impossibile caricare lo storico'`; 300s/600s polling |
| `app/components/devices/dirigera/hooks/useDirigeraStats.ts` | Stats polling hook (DIR-02) | VERIFIED | Exists; fetches `/api/v1/dirigera/stats`; `dataRef` stale-while-revalidate; Italian error `'Impossibile caricare le statistiche'`; 300s/600s polling |
| `app/components/devices/dirigera/hooks/useDirigeraTelemetry.ts` | Paginated telemetry hook (DIR-03) | VERIFIED | Exists; fetches `/api/v1/dirigera/telemetry?limit=50&offset=0`; `data.telemetry`; Italian error `'Impossibile caricare la telemetria'`; 300s/600s polling |
| `app/components/devices/dirigera/components/DirigeraStatsPanel.tsx` | Aggregazione + Retention tile panel | VERIFIED | Exists; heading "Statistiche"; subsections "Aggregazione" + "Retention"; 8 tiles from `DirigeraStatsResponse`; all 4 states (loading/error/empty/data); no aspirational labels |
| `app/components/devices/dirigera/components/DirigeraHistoryPanel.tsx` | Recent events paginated table | VERIFIED | Exists; heading "Eventi recenti"; "Carica altri 50" button; `items.length < total` guard; `overflow-x-auto`; Italian states |
| `app/components/devices/dirigera/components/DirigeraTelemetryPanel.tsx` | Telemetry readings paginated table | VERIFIED | Exists; heading "Telemetria"; 4 columns (Sensore, Batteria, Lux, Data/ora); same pagination pattern |
| `tests/smoke/page-loads.spec.ts` | `/dirigera` test case with 3 panel heading assertions | VERIFIED | Lines 90-102: `getByText('Statistiche', { exact: true })`, `getByText('Eventi recenti', { exact: true })`, `getByText('Telemetria', { exact: true })`; `collectConsoleErrors` used |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|----|--------|---------|
| `useDirigeraData.ts` | `/api/v1/dirigera/health` + `/sensors/summary` | `fetch()` in `fetchData` and `fetchHealth` | WIRED | Lines 51-52, 81 — 3 fetch calls; zero `/api/dirigera/` legacy strings |
| `useDirigeraFullData.ts` | `/api/v1/dirigera/sensors`, `/sensors/contact`, `/sensors/motion`, `/health` | `FILTER_ENDPOINTS` map + health fetch | WIRED | Lines 17-20, 55 — all 4 v1 URLs present; zero legacy strings |
| `useDirigeraData.ts` | WebSocket `'dirigera'` topic | `subscribe('dirigera', handleMessage)` / `unsubscribe('dirigera', handleMessage)` | WIRED + UNCHANGED | Lines 128-129 — WS topic keys untouched (orthogonal to HTTP URL swap) |
| `useDirigeraHistory.ts` | `/api/v1/dirigera/history` | `fetch(buildUrl(offset))` with `URLSearchParams` | WIRED | `limit=50&offset=N`; `sensor_id` + `event_type` forwarded when provided |
| `useDirigeraStats.ts` | `/api/v1/dirigera/stats` | `fetch('/api/v1/dirigera/stats')` | WIRED | Direct fetch, no params |
| `useDirigeraTelemetry.ts` | `/api/v1/dirigera/telemetry` | `fetch(buildUrl(offset))` with `URLSearchParams` | WIRED | `limit=50&offset=N`; `sensor_id` forwarded when provided; `event_type` excluded (not in `SensorTelemetryParams`) |
| `app/dirigera/page.tsx` | `DirigeraStatsPanel`, `DirigeraHistoryPanel`, `DirigeraTelemetryPanel` | Direct imports + JSX inside `space-y-6`, after `DirigeraSensorList` | WIRED | Lines 14-21 (imports), lines 42-44 (hook calls), lines 111-138 (JSX panels); `loadMore` prop wired for both paginated panels |
| `useDirigeraData.test.ts` | `/api/v1/dirigera/health` + `/sensors/summary` | `expect(fetchMock).toHaveBeenCalledWith(...)` assertions | WIRED | Lines 121, 122, 309 — all reference v1 paths |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|--------------------|--------|
| `DirigeraStatsPanel` | `data: DirigeraStatsResponse \| null` | `useDirigeraStats()` → `fetch('/api/v1/dirigera/stats')` → `app/api/v1/dirigera/stats/route.ts` → `getStats()` in `dirigeraProxy.ts` | Yes — proxy calls HA backend | FLOWING |
| `DirigeraHistoryPanel` | `items: SensorEvent[]` | `useDirigeraHistory()` → `fetch('/api/v1/dirigera/history?...')` → `app/api/v1/dirigera/history/route.ts` → `getHistory()` in `dirigeraProxy.ts` | Yes — proxy calls HA backend | FLOWING |
| `DirigeraTelemetryPanel` | `items: SensorTelemetryReading[]` | `useDirigeraTelemetry()` → `fetch('/api/v1/dirigera/telemetry?...')` → `app/api/v1/dirigera/telemetry/route.ts` → `getTelemetry()` in `dirigeraProxy.ts` | Yes — proxy calls HA backend | FLOWING |

No hardcoded empty arrays or static returns detected. All three panels derive from real v1 routes backed by `dirigeraProxy.ts` (Phase 163).

### Behavioral Spot-Checks

Step 7b: SKIPPED — Playwright requires running server and Auth0 session. The targeted Jest suite (78/78 pass) covers all critical behavior at the unit level. Visual rendering deferred to human verification.

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| DIR-01 | 169-02 | GET /api/v1/dirigera/history ritorna storico eventi sensori paginato | SATISFIED | `useDirigeraHistory` fetches `/api/v1/dirigera/history`; `DirigeraHistoryPanel` renders events; 7 tests pass |
| DIR-02 | 169-02 | GET /api/v1/dirigera/stats ritorna statistiche aggregazione e retention | SATISFIED | `useDirigeraStats` fetches `/api/v1/dirigera/stats`; `DirigeraStatsPanel` renders Aggregazione + Retention; 5 tests pass |
| DIR-03 | 169-02 | GET /api/v1/dirigera/telemetry ritorna storico telemetria sensori paginato | SATISFIED | `useDirigeraTelemetry` fetches `/api/v1/dirigera/telemetry`; `DirigeraTelemetryPanel` renders readings; 7 tests pass |

All three requirements marked `[x]` in `.planning/REQUIREMENTS.md`.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| (none) | — | No TODO/FIXME/placeholder/stub patterns found in any new or modified file | — | — |

No stubs, no hardcoded empty data, no missing handlers. All hook implementations use real `fetch()` calls; all panels render actual data from typed response shapes.

### Human Verification Required

#### 1. /dirigera page end-to-end runtime smoke

**Test:** Navigate to `/dirigera` in a browser. Observe that the page loads beyond the sensor skeleton. Scroll down to verify three new panels appear below the sensor list.
**Expected:** Three panel headings "Statistiche", "Eventi recenti", "Telemetria" are visible. Each panel renders in one of: loading spinner, Italian empty-state text, Italian error-state text, or actual data tiles/rows. No JS console errors logged.
**Why human:** Playwright `auth.setup.ts` times out in the local `BYPASS_AUTH=true` + `NEXT_PUBLIC_BYPASS_AUTH=true` environment — the real Auth0 Universal Login redirect is never reached, so the session cookie is never set and authenticated pages cannot be loaded. This is the same documented environmental limitation from Phase 167 Plan 03 and Phase 168 Plan 03. The Playwright test code is correct (assertions at lines 97-99 of `tests/smoke/page-loads.spec.ts`); only CI with real credentials can execute it end-to-end.

### Gaps Summary

No code gaps identified. All artifacts exist, are substantive, are wired, and data flows through the full stack. The only outstanding item is the Playwright runtime smoke that cannot execute in the local BYPASS_AUTH environment — a pre-existing environmental constraint, not a phase regression.

---

_Verified: 2026-04-22T21:30:00Z_
_Verifier: Claude (gsd-verifier)_
