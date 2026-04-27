---
phase: 171-fritzbox-consumer-ui
plan: 02
subsystem: ui
tags: [fritzbox, raw-history, service-discovery, consumer-ui, frontend, tr-064, polling-hooks, datatable, pagination]

# Dependency graph
requires:
  - phase: 162-fritz-box-gap-closure
    provides: raw-history API routes + service-discovery route + fritzboxClient.getBandwidthHistoryRaw / getDevicePresenceHistory / getDeviceEventsRaw / getServiceDiscovery
  - phase: 171-fritzbox-consumer-ui (Plan 01, parallel wave-1)
    provides: /telefonia page (smoke test in this plan depends on it post-merge)
provides:
  - Three raw-history polling hooks under app/network/hooks/ with paused+hours semantics and 404-graceful presence handling
  - Three raw-history presentational DataTable components with Italian copy and pagination
  - RawHistoryTab container composing the three sub-sections driven by shared TimeRangeSelector
  - /network page extended with new "Storico grezzo" tab (lazy-loaded via paused: activeTab !== 'storico')
  - Manual-refresh service-discovery hook (no polling) under app/debug/hooks/
  - FritzboxServiceDiscoveryTab component with copy-URL action and XSS-safe JSX escaping
  - /debug page extended with new Service Discovery tab (deep link via ?tab=service-discovery)
  - Three new Playwright smoke tests (Phase 171 describe block) covering /telefonia, Storico grezzo, Service Discovery
affects: future-Fritz!Box-UI-work, debug-tabs, network-monitoring

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Paused-aware polling hook with defensive paused→active re-fetch effect for lazy-loaded tabs"
    - "404-graceful hook variant (notFound state) for HA-proxy endpoints that may not exist"
    - "JSX-text-only rendering for untrusted device strings (T-171-01 XSS mitigation, no dangerouslySetInnerHTML anywhere)"
    - "Manual-refresh hook (useEffect on mount + exposed refresh callback) for effectively-static descriptors"
    - "Inline CopyUrl cell renderer (copy-to-clipboard with 2s Check feedback) mirroring CopyableIp pattern"

key-files:
  created:
    - app/network/hooks/useFritzBandwidthHistoryRaw.ts
    - app/network/hooks/useFritzDevicePresenceHistory.ts
    - app/network/hooks/useFritzDeviceEventsRaw.ts
    - app/network/hooks/__tests__/useFritzBandwidthHistoryRaw.test.ts
    - app/network/hooks/__tests__/useFritzDevicePresenceHistory.test.ts
    - app/network/hooks/__tests__/useFritzDeviceEventsRaw.test.ts
    - app/network/components/RawBandwidthTable.tsx
    - app/network/components/DevicePresenceTable.tsx
    - app/network/components/RawDeviceEventsTable.tsx
    - app/network/components/RawHistoryTab.tsx
    - app/network/components/__tests__/RawBandwidthTable.test.tsx
    - app/network/components/__tests__/DevicePresenceTable.test.tsx
    - app/network/components/__tests__/RawDeviceEventsTable.test.tsx
    - app/network/__tests__/storico-tab.test.tsx
    - app/debug/hooks/useFritzServiceDiscovery.ts
    - app/debug/hooks/__tests__/useFritzServiceDiscovery.test.ts
    - app/debug/components/tabs/FritzboxServiceDiscoveryTab.tsx
    - app/debug/components/tabs/__tests__/FritzboxServiceDiscoveryTab.test.tsx
  modified:
    - app/network/page.tsx
    - app/debug/page.tsx
    - tests/smoke/page-loads.spec.ts

key-decisions:
  - "D-07/D-08/D-09/D-10 honored: single 'Storico grezzo' tab on /network with three stacked sub-sections driven by a shared TimeRangeSelector; all three raw hooks pause when tab inactive"
  - "D-11/D-12/D-13 honored: Service Discovery lives inside existing /debug Tabs.List (not a standalone route); manual-refresh only; no keyboard shortcut (Open Question #4 RESOLVED — keys 1-9 already allocated)"
  - "D-14/D-15 honored: 60s cadence for raw history hooks (useAdaptivePolling + useVisibility) — 300s when tab hidden; service-discovery fetches once on mount + manual refresh"
  - "D-20/D-21 honored: Jest coverage for each new hook + each new component + tab integration + Playwright smoke extension"
  - "D-22 honored: every automated verify command uses a scoped Jest subset, never bare npm test"
  - "Pitfall 1 honored: presence hook NEVER throws on 404 — sets stale+notFound and returns empty list"
  - "Pitfall 2 honored: all three raw hooks reset page to 0 when total shrinks past the current page boundary"
  - "Pitfall 4 honored: zero ErrorAlert imports in any new file; uses Banner variant='error' with explicit title+description"
  - "Pitfall 6 honored: all timestamp columns multiply seconds × 1000 before constructing Date objects"
  - "Open Question #2 RESOLVED: defensive useEffect(() => { if (!paused) void fetchData(); }, [paused]) added to all three raw-history hooks so lazy-loaded tabs re-fetch on activation"
  - "T-171-01 XSS mitigation verified by a test rendering a <script>alert(1)</script> service name as literal text (React auto-escaping)"

patterns-established:
  - "Paused-aware polling hook template extended with paused→active re-fetch side effect for lazy-loaded tab content"
  - "404-graceful hook state shape ({ stale, notFound, items, totalCount, page, setPage }) — future HA-proxy endpoints that may be absent can clone this pattern"
  - "Specific-file component imports (import Card from '@/app/components/ui/Card') inside components that will be tested with a DataTable mock — avoids the barrel's self-reference circular import in jest"
  - "Manual-refresh debug tab pattern: { data, loading, error, refresh } with initial fetch via useEffect + UI button onClick → refresh()"

requirements-completed: [FRITZ-04, FRITZ-05, FRITZ-06, FRITZ-07]

# Metrics
duration: ~75min
completed: 2026-04-23
---

# Phase 171 Plan 02: Fritz!Box Raw History + Service Discovery UI Summary

**Storico grezzo tab on /network (raw bandwidth, device presence, device events) with 404-graceful proxy handling + Service Discovery tab on /debug with copy-URL and XSS-safe JSX escaping — closes FRITZ-04…07 without touching the API layer.**

## Performance

- **Duration:** ~75 min
- **Started:** 2026-04-23T18:25Z (approx)
- **Completed:** 2026-04-23T19:40Z
- **Tasks:** 5
- **Files modified:** 21 (18 created + 3 edited)

## Accomplishments

- Three paused-aware polling hooks wired to the Fritz!Box raw-history API routes, with defensive paused→active re-fetch and Pitfall-2 pagination shrink-reset
- Device-presence hook degrades gracefully on 404 (notFound flag), matching phase 162's D-05 caveat — tab never crashes when HA proxy lacks the endpoint
- Three presentational DataTable components with exact Italian copy from UI-SPEC, Unix-seconds × 1000 timestamp formatting, and Prev/Next pagination with sr-only live regions
- RawHistoryTab container orchestrates the three sub-sections under a shared TimeRangeSelector; /network page extended with the new 'storico' tab (last in the tab row)
- Manual-refresh Service Discovery hook + tab with copy-URL cells; /debug page extended with a new Tabs.Trigger + Content; keyboard shortcut array untouched per Open Question #4
- Three new Playwright smoke tests appended under a "Fritz!Box Consumer UI (Phase 171)" describe block, reusing the existing collectConsoleErrors helper

## Task Commits

Each task was committed atomically on branch `worktree-agent-aab9b8ec`:

1. **Task 1: Three raw-history polling hooks + Jest tests** — `a4a9e535` (feat)
2. **Task 2: Three raw-history presentational tables + component tests** — `a3e2f233` (feat)
3. **Task 3: RawHistoryTab container + /network page wiring + tab integration test** — `140b5fce` (feat)
4. **Task 4: Service Discovery hook + tab + /debug page integration + tests** — `5e77e213` (feat)
5. **Task 5: Three Playwright smoke tests appended to page-loads.spec.ts** — `e375a25e` (test)

## Files Created/Modified

### Created — Hooks
- `app/network/hooks/useFritzBandwidthHistoryRaw.ts` — FRITZ-04 polling hook (hours + pagination, 60s cadence, pause/re-fetch semantics)
- `app/network/hooks/useFritzDevicePresenceHistory.ts` — FRITZ-05 hook with notFound state for HA-proxy 404
- `app/network/hooks/useFritzDeviceEventsRaw.ts` — FRITZ-06 hook (hours + pagination, no mac filter forwarded)
- `app/debug/hooks/useFritzServiceDiscovery.ts` — FRITZ-07 manual-refresh hook

### Created — Presentational components
- `app/network/components/RawBandwidthTable.tsx` — DataTable with bytes/bps formatters, Italian timestamp rendering
- `app/network/components/DevicePresenceTable.tsx` — DataTable + 404-graceful "Endpoint non disponibile sul proxy" branch
- `app/network/components/RawDeviceEventsTable.tsx` — DataTable with Connesso/Disconnesso badges + unknown-event fallback
- `app/network/components/RawHistoryTab.tsx` — Container composing all three tables + TimeRangeSelector
- `app/debug/components/tabs/FritzboxServiceDiscoveryTab.tsx` — Service Discovery table with copy-URL cells

### Created — Jest tests
- `app/network/hooks/__tests__/{useFritzBandwidthHistoryRaw,useFritzDevicePresenceHistory,useFritzDeviceEventsRaw}.test.ts`
- `app/network/components/__tests__/{RawBandwidthTable,DevicePresenceTable,RawDeviceEventsTable}.test.tsx`
- `app/network/__tests__/storico-tab.test.tsx`
- `app/debug/hooks/__tests__/useFritzServiceDiscovery.test.ts`
- `app/debug/components/tabs/__tests__/FritzboxServiceDiscoveryTab.test.tsx`

### Modified
- `app/network/page.tsx` — NetworkTab union + storicoHours state + three hook calls + new tab entry + conditional RawHistoryTab render
- `app/debug/page.tsx` — added Network icon + Service Discovery Tabs.Trigger + Content; keyboard shortcut array intentionally untouched
- `tests/smoke/page-loads.spec.ts` — appended Phase 171 describe block with three smoke tests

## Test Results

```
Test Suites: 9 passed, 9 total
Tests:       44 passed, 44 total
Time:        ~9 s

(covering all hooks + components + storico-tab + service-discovery hook/component)
```

Existing `app/network/__tests__/page.test.tsx` still green (18/18) — no regressions.

Playwright `--list` confirms the three new tests are discoverable:
```
[chromium] › smoke/page-loads.spec.ts:193:9 › Fritz!Box Consumer UI (Phase 171) › /telefonia loads and renders heading
[chromium] › smoke/page-loads.spec.ts:204:9 › Fritz!Box Consumer UI (Phase 171) › /network Storico grezzo tab renders sub-sections
[chromium] › smoke/page-loads.spec.ts:221:9 › Fritz!Box Consumer UI (Phase 171) › /debug Service Discovery tab renders heading
```

## Decisions Made

None beyond those inherited from the plan/CONTEXT/UI-SPEC — all 11 honored decisions documented in frontmatter. The executor made one minor adjustment (specific-file component imports instead of barrel imports) documented under Deviations.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Switched from barrel imports to specific-file imports in the three raw-history table components**
- **Found during:** Task 2 (first run of component tests)
- **Issue:** Initially imported from `@/app/components/ui` barrel inside the three Raw* table components. The barrel has an internal self-reference (Accordion export) that Jest's module loader hits before the Accordion module is fully initialised, yielding `ReferenceError: Cannot access '_Accordion' before initialization`. Using `jest.requireActual('@/app/components/ui')` inside the test mock triggered the same error.
- **Fix:** Switched each raw-history table component (RawBandwidthTable, DevicePresenceTable, RawDeviceEventsTable) from `import { Card, Heading, Badge, ... } from '@/app/components/ui'` to specific-file imports (`import Card from '@/app/components/ui/Card'`, etc.). Then updated the Jest mocks to target `@/app/components/ui/DataTable` directly. Mirrors the pattern already used in `WifiClientsTable.tsx`.
- **Files modified:** `app/network/components/{RawBandwidthTable,DevicePresenceTable,RawDeviceEventsTable}.tsx` + the three matching test files
- **Verification:** All 14 Task 2 tests pass after the switch.
- **Committed in:** `a3e2f233` (Task 2 commit)

**2. [Rule 1 - Bug] Test rewrite for useFritzServiceDiscovery refresh() to tolerate React StrictMode double-invoked effects**
- **Found during:** Task 4 (hook test)
- **Issue:** Initial `refresh()` test used `.mockResolvedValueOnce` twice then asserted `expect(fetchMock).toHaveBeenCalledTimes(2)`. React StrictMode (default in this jest setup) invoked the mount effect twice, so the second `mockResolvedValueOnce` was consumed during mount, leaving the explicit `refresh()` call to hit the default (undefined) mock implementation.
- **Fix:** Replaced the two `mockResolvedValueOnce` calls with a single `mockImplementation(() => ...)` returning the initial list, then reassigned the implementation to return the updated list right before calling `refresh()`. Dropped the brittle "2 times" assertion.
- **Files modified:** `app/debug/hooks/__tests__/useFritzServiceDiscovery.test.ts`
- **Verification:** All 4 hook tests pass.
- **Committed in:** `5e77e213` (Task 4 commit)

**3. [Rule 1 - Bug] Test rewrite for storico-tab "7d" button click and notFound scenario**
- **Found during:** Task 3 (storico-tab integration test)
- **Issue:** (a) The "7d" button name matched multiple buttons on the page (DeviceHistoryTimeline also renders a TimeRangeSelector), so `getByRole('button', { name: '7d' })` threw `found multiple elements`. (b) The original plan sketch used `jest.resetModules()` + re-import to flip the presence hook's notFound state; this breaks React's singleton in the same test file.
- **Fix:** (a) Switched to `getAllByRole('button', { name: '7d' })[0]` — storico TimeRangeSelector is rendered before DeviceHistoryTimeline in the DOM, so the first match is the right one. (b) Replaced `jest.resetModules` with a shared mutable `presenceState` object whose `notFound` flag is flipped in the test, read by the presence hook mock on each render.
- **Files modified:** `app/network/__tests__/storico-tab.test.tsx`
- **Verification:** All 4 storico-tab tests pass.
- **Committed in:** `140b5fce` (Task 3 commit)

---

**Total deviations:** 3 auto-fixed (1 blocking Jest circular-import, 2 test-infra bugs).
**Impact on plan:** All adjustments were test-infrastructure — no change to production code semantics or the plan's acceptance criteria. Scope unchanged.

## Issues Encountered

- React `act()` warnings when state updates happen inside async fetch callbacks that escape the initial `waitFor`. These are non-fatal (matches the existing `useFritzWifiClients.test.ts` behaviour) and do not affect pass/fail.
- Background `pyenv` shim-lock warnings appear in every shell invocation — cosmetic only, does not affect command exit codes.

## Pitfall Verification

- **Pitfall 1 (never throw):** `useFritzDevicePresenceHistory` test `expect(() => renderHook(...)).not.toThrow()` explicitly asserts the 404 path never throws.
- **Pitfall 2 (pagination shrink):** Each hook has `useEffect(() => { if (page > 0 && totalCount > 0 && page * PAGE_SIZE >= totalCount) setPage(0); }, [totalCount, page])`.
- **Pitfall 4 (no ErrorAlert):** `! grep -q "ErrorAlert" app/network/components/RawBandwidthTable.tsx app/network/components/DevicePresenceTable.tsx app/network/components/RawDeviceEventsTable.tsx app/debug/components/tabs/FritzboxServiceDiscoveryTab.tsx` returns 0.
- **Pitfall 6 (timestamp × 1000):** `grep -q "timestamp \* 1000"` returns a match in all three raw-history table components.
- **Pitfall 7 (no nav entry for tab-only surfaces):** Neither `/network` raw-history nor `/debug` service-discovery added a CommandPalette nav entry.
- **T-171-01 (XSS):** No `dangerouslySetInnerHTML` anywhere; `FritzboxServiceDiscoveryTab.test.tsx` includes `<script>alert(1)</script>` literal-text assertion.
- **Open Question #4 (RESOLVED — no keyboard shortcut for tab 10):** `grep -E "const tabs = \[.*'network'\]" app/debug/page.tsx` confirms the keyboard shortcut array still ends at 'network'.

## User Setup Required

None — no external service configuration required. All routes are already shipped in phase 162 (API + client).

## Next Phase Readiness

- FRITZ-04 through FRITZ-07 closed at the UI layer; v19.0 audit gap is fully addressed.
- Plan 01 (telephony UI) is a parallel worktree; the `/telefonia` smoke test in this plan will pass end-to-end once both plans merge into main.
- No blockers for subsequent Fritz!Box or debug-console work.

## Self-Check: PASSED

Created files verified present:
- FOUND: app/network/hooks/useFritzBandwidthHistoryRaw.ts
- FOUND: app/network/hooks/useFritzDevicePresenceHistory.ts
- FOUND: app/network/hooks/useFritzDeviceEventsRaw.ts
- FOUND: app/network/components/RawBandwidthTable.tsx
- FOUND: app/network/components/DevicePresenceTable.tsx
- FOUND: app/network/components/RawDeviceEventsTable.tsx
- FOUND: app/network/components/RawHistoryTab.tsx
- FOUND: app/debug/hooks/useFritzServiceDiscovery.ts
- FOUND: app/debug/components/tabs/FritzboxServiceDiscoveryTab.tsx
- FOUND: tests/smoke/page-loads.spec.ts (modified)

Commits verified in `git log`:
- FOUND: a4a9e535 (Task 1 — raw-history hooks)
- FOUND: a3e2f233 (Task 2 — raw-history tables)
- FOUND: 140b5fce (Task 3 — RawHistoryTab + /network wiring)
- FOUND: 5e77e213 (Task 4 — Service Discovery tab + /debug wiring)
- FOUND: e375a25e (Task 5 — Playwright smoke)

---
*Phase: 171-fritzbox-consumer-ui*
*Completed: 2026-04-23*
