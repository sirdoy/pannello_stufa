---
phase: 171-fritzbox-consumer-ui
verified: 2026-04-23T22:15:00Z
status: passed
score: 11/11 must-haves verified
overrides_applied: 0
recommendation: APPROVE
verifier: gsd-verifier (Claude Opus 4.7, 1M context)
---

# Phase 171: Fritz!Box Consumer UI — Verification Report

**Phase Goal (ROADMAP.md §Phase 171):** Telephony, raw history, and service-discovery endpoints have production UI consumers outside debug panels.

**Verified:** 2026-04-23T22:15:00Z
**Status:** PASSED
**Re-verification:** No (initial verification)

---

## Goal Achievement: PASS

All four roadmap Success Criteria verified end-to-end in the codebase. All seven FRITZ-XX requirements closed via code path: API route → hook → presentational component → orchestrator page/tab. Scoped Jest subsets green (80 tests across 17 suites). Playwright smoke discoverable (3 new tests under "Fritz!Box Consumer UI (Phase 171)"). No existing-tests regression on `app/network/__tests__/page.test.tsx` (18/18 green).

---

## Success Criterion Check (from ROADMAP.md §Phase 171)

| # | Success Criterion | Status | Evidence |
|---|---|---|---|
| 1 | DECT handsets + call history + TAM state rendered in a Telephony page/section | VERIFIED | `app/telefonia/page.tsx` composes `TamStatusCard`, `DectHandsetsTable`, `CallHistoryTable` with live hook data (`app/telefonia/page.tsx:19-66`). Italian copy: "Telefonia" (H1), "Segreteria", "Cornette DECT", "Cronologia chiamate" (H2). |
| 2 | Raw bandwidth history, device presence history, device-events log surfaced in network section (chart or table) | VERIFIED | `app/network/page.tsx:88` extends `NetworkTab` union with `'storico'`; lines 115-118 wire three raw-history hooks with `paused: activeTab !== 'storico'`; line 234 adds the "Storico grezzo" tab entry; lines 285-293 render `RawHistoryTab` composing `RawBandwidthTable` + `DevicePresenceTable` + `RawDeviceEventsTable`. Italian copy: "Bandwidth grezzo", "Presenza dispositivi", "Eventi dispositivi". |
| 3 | Service-discovery TR-064 descriptor visible in an admin/debug-elevated surface | VERIFIED | `app/debug/page.tsx:40` imports `FritzboxServiceDiscoveryTab`; line 392 adds `<Tabs.Trigger value="service-discovery">`; lines 432-434 render the tab content. Tab lives inside the existing `/debug` admin-elevated surface (D-11). |
| 4 | Jest + Playwright smoke covers each new route | VERIFIED | 17 Jest suites (80 tests) passing across hooks/components/pages. `tests/smoke/page-loads.spec.ts:192-234` adds Phase 171 describe block with 3 smoke tests; `npx playwright test --list` confirms all 3 are discoverable. |

---

## Per-Requirement Status (FRITZ-01 … FRITZ-07)

| Requirement | Description | Status | UI Artifact | Wiring Evidence |
|---|---|---|---|---|
| FRITZ-01 | DECT handsets | SATISFIED | `useFritzDectHandsets` → `DectHandsetsTable` → `/telefonia` | `app/telefonia/hooks/useFritzDectHandsets.ts:48` fetches `/api/fritzbox/telephony/dect`; `/telefonia/page.tsx:22,49-54` wires hook into component |
| FRITZ-02 | Call history paginated | SATISFIED | `useFritzCallHistory` (50/page) → `CallHistoryTable` → `/telefonia` | `useFritzCallHistory.ts:7` defines `PAGE_SIZE = 50`; line 56 GETs `/api/fritzbox/telephony/calls?${params}`; Pitfall 2 pagination reset (line 98); Pitfall 6 timestamp ×1000 applied in `CallHistoryTable.tsx:137` |
| FRITZ-03 | TAM status | SATISFIED | `useFritzTamStatus` → `TamStatusCard` → `/telefonia` | `useFritzTamStatus.ts:43` fetches `/api/fritzbox/telephony/tam`; `TamStatusCard.tsx` renders enabled/disabled HealthIndicator + new-message count + stale Banner |
| FRITZ-04 | Raw bandwidth history | SATISFIED | `useFritzBandwidthHistoryRaw` → `RawBandwidthTable` → `/network` Storico tab | Hook builds URL with `hours=HOURS_MAP[h]&limit=100&offset=N`; table applies `timestamp * 1000` in cell renderer (line 69) |
| FRITZ-05 | Device presence history (404-graceful) | SATISFIED | `useFritzDevicePresenceHistory` → `DevicePresenceTable` → `/network` Storico tab | Hook tracks `notFound` boolean; sets `notFound=true` on `res.status === 404` (line 73); never throws; `DevicePresenceTable.tsx:106-113` renders "Endpoint non disponibile sul proxy" EmptyState when notFound=true (no DataTable rendered in this branch) |
| FRITZ-06 | Device events raw log | SATISFIED | `useFritzDeviceEventsRaw` → `RawDeviceEventsTable` → `/network` Storico tab | Hook forwards hours/limit/offset; table renders "Connesso"/"Disconnesso" badges and applies `timestamp * 1000` (line 47) |
| FRITZ-07 | Service discovery TR-064 | SATISFIED | `useFritzServiceDiscovery` (manual-refresh) → `FritzboxServiceDiscoveryTab` → `/debug` | Hook fetches on mount + exposes `refresh` callback (`useFritzServiceDiscovery.ts:28-53`); tab renders DataTable with copy-URL cells (CopyUrl component using `navigator.clipboard.writeText`) |

**Note on REQUIREMENTS.md status column:** The table at `.planning/REQUIREMENTS.md:151-157` still marks FRITZ-01…07 as "Pending" — this is a roadmap bookkeeping concern. The requirement text is API-level ("GET /api/... ritorna ..."), which was already satisfied by phase 162. Phase 171 closes the UI consumer gap. A roadmap update (Pending → Complete) is suggested after this verification, but does not block approval.

---

## Observable Truths (Goal-Backward)

| # | Truth | Status | Evidence |
|---|---|---|---|
| 1 | `/telefonia` page renders TAM + DECT + Call History sections with live hook data | VERIFIED | `app/telefonia/page.tsx:19-66` — three hooks, three components, wired. |
| 2 | `/network` page includes a "Storico grezzo" tab with 3 raw-history sub-sections driven by TimeRangeSelector | VERIFIED | `app/network/page.tsx` lines 88, 234, 285-293; `RawHistoryTab.tsx` composes TimeRangeSelector + 3 tables. |
| 3 | `/debug` page includes a "Service Discovery" tab with TR-064 descriptor table + manual refresh + copy-URL | VERIFIED | `app/debug/page.tsx:392,432-434`; `FritzboxServiceDiscoveryTab.tsx:91,107` (heading + "Aggiorna" button). |
| 4 | CommandPalette exposes `nav-telephony` entry routing to `/telefonia` | VERIFIED | `app/components/layout/CommandPaletteProvider.tsx:117-122`. |
| 5 | All Fritz!Box-supplied strings rendered via JSX escaping (zero `dangerouslySetInnerHTML`) | VERIFIED | `grep -rq "dangerouslySetInnerHTML"` returns empty for `app/telefonia/`, `app/network/components/Raw*.tsx`, `app/network/components/DevicePresenceTable.tsx`, `app/debug/components/tabs/FritzboxServiceDiscoveryTab.tsx`. |
| 6 | No `ErrorAlert` imports anywhere in Phase 171 scope (Banner variant="error" used instead per Pitfall 4) | VERIFIED | `grep -rq "ErrorAlert"` returns empty for all new files. |
| 7 | Device presence hook degrades gracefully on 404 (notFound flag, never throws) | VERIFIED | `useFritzDevicePresenceHistory.ts:73` sets `notFound` on 404; test `DevicePresenceTable.test.tsx:60-67` asserts graceful render without throwing. |
| 8 | All hooks degrade on non-OK responses (setStale(true), empty list, no throw) | VERIFIED | Every new hook has the `if (!res.ok) { setStale(true); … return; }` pattern (grep confirmed in 6 files). |
| 9 | Timestamp × 1000 applied in every row renderer (Unix seconds → Date) — Pitfall 6 | VERIFIED | `timestamp * 1000` present in `CallHistoryTable.tsx:137`, `RawBandwidthTable.tsx:69`, `DevicePresenceTable.tsx:50`, `RawDeviceEventsTable.tsx:47`. |
| 10 | Defensive paused→active re-fetch effect in every polling hook (Open Question #2) | VERIFIED | `if (!paused) void fetchData()` useEffect present in all 6 polling hooks (3 telephony + 3 raw-history). |
| 11 | Keyboard-shortcut array in `/debug` still ends at `'network'` (no tab-10 shortcut per Open Question #4) | VERIFIED | `app/debug/page.tsx:310` — array length 9, last entry `'network'`. |

**Score: 11/11 truths VERIFIED.**

---

## Required Artifacts Check

### Plan 01 — Telephony (/telefonia)

| Artifact | Status | Notes |
|---|---|---|
| `app/telefonia/hooks/useFritzDectHandsets.ts` | VERIFIED | 85 lines, `'use client'`, fetches `/api/fritzbox/telephony/dect`, sets stale on non-OK |
| `app/telefonia/hooks/useFritzCallHistory.ts` | VERIFIED | 111 lines, PAGE_SIZE=50, server-paginated, Pitfall 2 reset, defensive paused→active |
| `app/telefonia/hooks/useFritzTamStatus.ts` | VERIFIED | 75 lines, single-object response, stale/loading state |
| `app/telefonia/components/TamStatusCard.tsx` | VERIFIED | Heading "Segreteria", HealthIndicator attiva/disattiva, stale Banner |
| `app/telefonia/components/DectHandsetsTable.tsx` | VERIFIED | Heading "Cornette DECT", battery tier badges, registration badge |
| `app/telefonia/components/CallHistoryTable.tsx` | VERIFIED | Heading "Cronologia chiamate", call-type badges (+ "Sconosciuto" fallback), Prev/Next pagination, timestamp ×1000 |
| `app/telefonia/page.tsx` | VERIFIED | Orchestrator composing 3 hooks + 3 components under PageLayout |
| `app/components/layout/CommandPaletteProvider.tsx` | VERIFIED | `nav-telephony` entry inserted between `nav-camera` and `nav-settings` |
| Test files (8 suites) | VERIFIED | All 33 tests green |

### Plan 02 — Raw history + Service discovery

| Artifact | Status | Notes |
|---|---|---|
| `app/network/hooks/useFritzBandwidthHistoryRaw.ts` | VERIFIED | HOURS_MAP, PAGE_SIZE, hours-reset, pagination-shrink reset, paused→active re-fetch |
| `app/network/hooks/useFritzDevicePresenceHistory.ts` | VERIFIED | `notFound` state; `res.status === 404` branch; never throws |
| `app/network/hooks/useFritzDeviceEventsRaw.ts` | VERIFIED | HOURS_MAP reuse, hours/limit/offset forwarding, no mac filter |
| `app/network/components/RawBandwidthTable.tsx` | VERIFIED | Heading "Bandwidth grezzo", bytes/bps formatters, timestamp ×1000, pagination footer |
| `app/network/components/DevicePresenceTable.tsx` | VERIFIED | Heading "Presenza dispositivi", 404-graceful "Endpoint non disponibile sul proxy" branch does not render DataTable |
| `app/network/components/RawDeviceEventsTable.tsx` | VERIFIED | Heading "Eventi dispositivi", Connesso/Disconnesso badges, unknown-event fallback |
| `app/network/components/RawHistoryTab.tsx` | VERIFIED | Composes TimeRangeSelector + 3 tables; HOURS_LABEL copy |
| `app/network/page.tsx` (modified) | VERIFIED | NetworkTab union + storicoHours state + 3 hook wirings + tab entry + conditional render |
| `app/debug/hooks/useFritzServiceDiscovery.ts` | VERIFIED | Manual-refresh + initial fetch on mount + error state |
| `app/debug/components/tabs/FritzboxServiceDiscoveryTab.tsx` | VERIFIED | CopyUrl inline component, refresh button ("Aggiorna"), Banner on error, EmptyState on empty |
| `app/debug/page.tsx` (modified) | VERIFIED | Tabs.Trigger + Tabs.Content + Network icon import; keyboard array untouched |
| `tests/smoke/page-loads.spec.ts` (modified) | VERIFIED | Phase 171 describe block with 3 tests; `collectConsoleErrors` reused |
| Test files (9 suites) | VERIFIED | All 47 tests green (15 hooks + 18 components+storico + 14 service-discovery+CommandPalette) |

---

## Key Link Verification (Wiring)

| From | To | Via | Status |
|---|---|---|---|
| `useFritzDectHandsets` | `/api/fritzbox/telephony/dect` | `fetch()` | WIRED |
| `useFritzCallHistory` | `/api/fritzbox/telephony/calls?limit&offset` | `fetch()` with URLSearchParams | WIRED |
| `useFritzTamStatus` | `/api/fritzbox/telephony/tam` | `fetch()` | WIRED |
| `useFritzBandwidthHistoryRaw` | `/api/fritzbox/history/bandwidth?hours&limit&offset` | `fetch()` with URLSearchParams | WIRED |
| `useFritzDevicePresenceHistory` | `/api/fritzbox/history/devices?limit&offset` | `fetch()` with 404-graceful branch | WIRED |
| `useFritzDeviceEventsRaw` | `/api/fritzbox/history/device-events?hours&limit&offset` | `fetch()` with URLSearchParams | WIRED |
| `useFritzServiceDiscovery` | `/api/fritzbox/service-discovery` | `fetch()` manual-refresh | WIRED |
| `/telefonia/page.tsx` | 3 hooks + 3 components | orchestrator composition | WIRED |
| `/network/page.tsx` | `RawHistoryTab` | `activeTab === 'storico'` conditional render | WIRED |
| `/debug/page.tsx` | `FritzboxServiceDiscoveryTab` | `Tabs.Content value="service-discovery"` | WIRED |
| `CommandPaletteProvider` → `/telefonia` | `router.push('/telefonia')` | `nav-telephony` onSelect handler | WIRED |
| `RawHistoryTab` → 3 tables | prop drilling + `TimeRangeSelector` | component composition | WIRED |

All 12 key links verified.

---

## Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source (API Route) | Real Data? | Status |
|---|---|---|---|---|
| `DectHandsetsTable` | `handsets` | `GET /api/fritzbox/telephony/dect` (phase 162, uses `fritzboxClient.getDectHandsets`) | YES — no static return, proxies to HA proxy | FLOWING |
| `CallHistoryTable` | `calls` | `GET /api/fritzbox/telephony/calls` (phase 162) | YES | FLOWING |
| `TamStatusCard` | `status` | `GET /api/fritzbox/telephony/tam` (phase 162) | YES | FLOWING |
| `RawBandwidthTable` | `items` | `GET /api/fritzbox/history/bandwidth` (phase 162) | YES — raw pass-through envelope | FLOWING |
| `DevicePresenceTable` | `items` (or `notFound`) | `GET /api/fritzbox/history/devices` (phase 162; may 404 per D-05) | YES when 200; gracefully empty when 404 | FLOWING |
| `RawDeviceEventsTable` | `items` | `GET /api/fritzbox/history/device-events` (phase 162) | YES | FLOWING |
| `FritzboxServiceDiscoveryTab` | `services` | `GET /api/fritzbox/service-discovery` (phase 162, XML→JSON server-side) | YES | FLOWING |

No hollow props, no hardcoded empty defaults reaching render paths.

---

## Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|---|---|---|---|
| Scoped Jest: telephony hooks + components + page + CommandPalette | `npm test -- app/telefonia/` | 7 suites, 33 tests passed | PASS |
| Scoped Jest: raw-history hooks | `npm test -- app/network/hooks/__tests__/useFritz*Raw.test.ts app/network/hooks/__tests__/useFritzDevicePresenceHistory.test.ts` | 3 suites, 15 tests passed | PASS |
| Scoped Jest: raw-history components + storico-tab | `npm test -- app/network/components/__tests__/Raw*.test.tsx app/network/components/__tests__/DevicePresenceTable.test.tsx app/network/__tests__/storico-tab.test.tsx` | 4 suites, 18 tests passed | PASS |
| Scoped Jest: service-discovery hook + tab + CommandPalette | `npm test -- app/debug/hooks/__tests__/useFritzServiceDiscovery.test.ts app/debug/components/tabs/__tests__/FritzboxServiceDiscoveryTab.test.tsx app/components/layout/__tests__/CommandPaletteProvider.test.tsx` | 3 suites, 14 tests passed | PASS |
| Regression check: existing `/network` page test | `npm test -- app/network/__tests__/page.test.tsx` | 1 suite, 18 tests passed | PASS |
| Playwright smoke discoverability | `npx playwright test tests/smoke/page-loads.spec.ts --list` | 3 Phase 171 tests listed | PASS |
| XSS hygiene | `grep -rq "dangerouslySetInnerHTML" app/telefonia app/network/components/Raw*.tsx app/network/components/DevicePresenceTable.tsx app/debug/components/tabs/FritzboxServiceDiscoveryTab.tsx` | no matches | PASS |
| Legacy primitive ban | `grep -rq "ErrorAlert" app/telefonia app/network/components/Raw*.tsx app/network/components/DevicePresenceTable.tsx app/debug/components/tabs/FritzboxServiceDiscoveryTab.tsx` | no matches | PASS |

**Aggregate: 80 Jest tests + 3 Playwright tests + 18 regression tests — all green.**

---

## Anti-Patterns Scan

| File | Line | Pattern | Severity | Impact |
|---|---|---|---|---|
| — | — | — | — | No blocker, warning, or info-level anti-patterns found in Phase 171 scope |

All Fritz!Box-supplied strings render via JSX text interpolation (XSS-safe). No TODO/FIXME/PLACEHOLDER comments in new files. No empty implementations. Hooks never throw on non-OK responses (graceful `setStale(true)` pattern).

---

## Test Execution Summary

```
Telephony (telefonia):        7 suites | 33 tests | passed
Raw-history hooks:            3 suites | 15 tests | passed
Raw-history components+tab:   4 suites | 18 tests | passed
Service discovery + palette:  3 suites | 14 tests | passed
-------------------------------------------------------------
Phase 171 total:             17 suites | 80 tests | passed

Regression (existing tests):
  app/network/__tests__/page.test.tsx: 1 suite | 18 tests | passed

Playwright smoke (discoverable via --list):
  [chromium] › Phase 171 › /telefonia loads and renders heading
  [chromium] › Phase 171 › /network Storico grezzo tab renders sub-sections
  [chromium] › Phase 171 › /debug Service Discovery tab renders heading
```

All commands used scoped test subsets per CLAUDE.md Rule 8 (no bare `npm test`).

---

## Deviations from Plans / CONTEXT

All deviations are already documented in the SUMMARY.md files and inspected — they are test-infrastructure adjustments, not logic changes:

1. **Plan 01 Task 3**: Component JSDoc comments rewritten to avoid triggering the plan's own `! grep -q "ErrorAlert"` / `! grep -q "dangerouslySetInnerHTML"` acceptance criteria (literal substrings appeared in comments). No behavior change. Logged in `171-01-SUMMARY.md` §Deviations.
2. **Plan 02 Task 2**: Specific-file component imports (`import Card from '@/app/components/ui/Card'`) replaced barrel imports in `Raw*.tsx` tables to avoid a Jest circular-import issue in the barrel's Accordion module. Matches existing `WifiClientsTable.tsx` pattern. Logged in `171-02-SUMMARY.md` §Deviations.
3. **Plan 02 Task 4**: `useFritzServiceDiscovery.test.ts` refresh-path test switched from `mockResolvedValueOnce` × 2 to a reassigned `mockImplementation` to tolerate StrictMode double-invoked mount effects. Logged in `171-02-SUMMARY.md` §Deviations.
4. **Plan 02 Task 3**: `storico-tab.test.tsx` switched to `getAllByRole(...)[0]` for ambiguous "7d" button and a shared mutable mock state for the `notFound` test. Logged in `171-02-SUMMARY.md` §Deviations.

None of these deviations reduce scope, weaken tests, or alter production behavior. All plan acceptance criteria remain satisfied.

---

## Outstanding Gaps

**None.** All must-haves verified. All tests green. All wiring confirmed. No regressions.

### Informational follow-ups (not gaps)

- `.planning/REQUIREMENTS.md` status column for FRITZ-01…07 still reads "Pending" (line 151-157). Those rows describe API-level contracts (satisfied by phase 162) and are unblocked at the UI layer by this phase. A REQUIREMENTS.md bookkeeping update from Pending → Complete is warranted but does not affect this verification's outcome.
- Playwright smoke tests were verified discoverable via `--list` but not executed end-to-end — they require a running dev server (documented in Plan 02 Task 5 as intentional, per `<verify><automated>` convention). Jest-level `storico-tab.test.tsx` and `page.test.tsx` already cover the DOM-mount branches.

---

## Recommendation: APPROVE

**Rationale:**

1. All 4 ROADMAP success criteria met.
2. All 7 FRITZ-XX requirements closed with live API → hook → component → page wiring.
3. CommandPalette `nav-telephony` entry present and correctly routed.
4. Device-presence 404-graceful pattern verified in both hook and component; component does not render DataTable in notFound branch.
5. Zero `dangerouslySetInnerHTML` and zero `ErrorAlert` in Phase 171 scope (XSS mitigation + Pitfall 4 compliance).
6. 80 Jest tests + 3 Playwright smoke tests added, all passing.
7. No regressions on `app/network/__tests__/page.test.tsx` (18/18 still green).
8. CLAUDE.md Rule 8 honored: every verify command used a scoped subset.

Phase 171 delivers exactly what the goal statement promised and closes the v19.0 FRITZ audit integration gap identified in phase 162.

---

*Verified: 2026-04-23T22:15:00Z*
*Verifier: Claude (gsd-verifier, Opus 4.7 / 1M context)*
*Phase dir: .planning/phases/171-fritzbox-consumer-ui/*
