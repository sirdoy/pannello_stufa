---
phase: 172-fritzbox-v1-path-migration
plan: 02
subsystem: hooks
tags: [fritzbox, path-migration, v1, consumers, hooks, sed-sweep]

# Dependency graph
requires:
  - phase: 172-fritzbox-v1-path-migration
    plan: 01
    provides: app/api/v1/fritzbox/** — 28 production routes at canonical v1 path
provides:
  - All 17 Fritz!Box consumer hooks fetch from /api/v1/fritzbox/* (FRITZ-01..07 closed on consumer side)
  - 14 hook Jest test files assert on /api/v1/fritzbox/* URL strings (green)
affects: [172-fritzbox-v1-path-migration plan-03 (verification sweep)]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "sed -i '' URL sweep: s|/api/fritzbox/|/api/v1/fritzbox/|g across 31 consumer files in one pass"
    - "Pitfall 3 guard: literal 15-char target /api/fritzbox/ (leading+trailing slash) leaves WS topic 'fritzbox' and FRITZBOX_TIMEOUT constant untouched"

key-files:
  created: []
  modified:
    - app/telefonia/hooks/useFritzDectHandsets.ts
    - app/telefonia/hooks/useFritzCallHistory.ts
    - app/telefonia/hooks/useFritzTamStatus.ts
    - app/telefonia/hooks/__tests__/useFritzDectHandsets.test.ts
    - app/telefonia/hooks/__tests__/useFritzCallHistory.test.ts
    - app/telefonia/hooks/__tests__/useFritzTamStatus.test.ts
    - app/network/hooks/useFritzBandwidthHistoryRaw.ts
    - app/network/hooks/useFritzDevicePresenceHistory.ts
    - app/network/hooks/useFritzDeviceEventsRaw.ts
    - app/network/hooks/useFritzBandwidthTiers.ts
    - app/network/hooks/useFritzBudgetStats.ts
    - app/network/hooks/useFritzDeviceCountHistory.ts
    - app/network/hooks/useFritzNetworkServices.ts
    - app/network/hooks/useFritzSystemInfo.ts
    - app/network/hooks/useFritzWifiClients.ts
    - app/network/hooks/useFritzWifiNetworks.ts
    - app/network/hooks/useBandwidthHistory.ts
    - app/network/hooks/useDeviceHistory.ts
    - app/network/hooks/__tests__/useFritzBandwidthHistoryRaw.test.ts
    - app/network/hooks/__tests__/useFritzDevicePresenceHistory.test.ts
    - app/network/hooks/__tests__/useFritzDeviceEventsRaw.test.ts
    - app/network/hooks/__tests__/useFritzBandwidthTiers.test.ts
    - app/network/hooks/__tests__/useFritzBudgetStats.test.ts
    - app/network/hooks/__tests__/useFritzDeviceCountHistory.test.ts
    - app/network/hooks/__tests__/useFritzNetworkServices.test.ts
    - app/network/hooks/__tests__/useFritzSystemInfo.test.ts
    - app/network/hooks/__tests__/useFritzWifiClients.test.ts
    - app/network/hooks/__tests__/useFritzWifiNetworks.test.ts
    - app/network/hooks/__tests__/useDeviceHistory.test.ts
    - app/components/devices/network/hooks/useNetworkData.ts
    - app/debug/hooks/useFritzServiceDiscovery.ts

key-decisions:
  - "Single commit for all 3 tasks: plan specifies Tasks 1+2+3 staged together in Task 3's commit step — executed as written"
  - "Pitfall 3 preserved: sed pattern with both leading and trailing slash /api/fritzbox/ is safe — does not touch WS topic 'fritzbox' or FRITZBOX_TIMEOUT error constant in useNetworkData.ts"
  - "useNetworkData.test.ts untouched: per RESEARCH.md this test uses mocked fetch responses without URL string assertions — zero changes needed, 25/25 green"

# Metrics
duration: 28min
completed: 2026-04-24
---

# Phase 172 Plan 02: Fritz!Box v1 Path Migration (Consumer Side) Summary

**Pure URL-string sweep of 17 production hooks + 14 hook test files: s|/api/fritzbox/|/api/v1/fritzbox/|g, restoring app runtime after Plan 01's route tree move**

## Performance

- **Duration:** 28 min
- **Started:** 2026-04-24T13:50:09Z
- **Completed:** 2026-04-24T14:18:09Z
- **Tasks:** 3 (all executed; single commit at end of Task 3 per plan spec)
- **Files modified:** 31 (17 production hooks + 14 hook test files)

## Accomplishments
- All 7 FRITZ canonical consumer hooks retargeted to `/api/v1/fritzbox/*` (FRITZ-01..07 consumer side closed)
- 10 surrounding Fritz hooks (wifi, system, bandwidth-tiers, budget, network services, device count, bandwidth-history, device-history, useNetworkData) also retargeted
- 14 hook Jest test files updated: URL assertion strings, JSDoc comments, test description strings all reflect v1 paths
- 404-graceful branch in `useFritzDevicePresenceHistory.ts` preserved byte-for-byte
- WebSocket topic `'fritzbox'` and `FRITZBOX_TIMEOUT` error code in `useNetworkData.ts` preserved (Pitfall 3)
- 3 telefonia test suites (13 tests), 13 network hook test suites (98 tests), 1 useNetworkData test suite (25 tests), 1 useFritzServiceDiscovery test suite — all green

## Task Commits

All 3 tasks committed as a single conventional commit per plan spec:

1. **Task 1: Retarget telefonia hooks + tests (FRITZ-01, FRITZ-02, FRITZ-03)** — part of `deacade42`
2. **Task 2: Retarget network hooks + tests (FRITZ-04, FRITZ-05, FRITZ-06, + surrounding)** — part of `deacade42`
3. **Task 3: Retarget components/devices network hook + debug hook (FRITZ-07 + useNetworkData)** — `deacade42`

## Files Created/Modified

31 files modified, zero created, zero deleted.

- **Telefonia hooks (3):** useFritzDectHandsets.ts, useFritzCallHistory.ts, useFritzTamStatus.ts
- **Telefonia tests (3):** co-located `__tests__/` for the above
- **Network hooks (12):** useFritzBandwidthHistoryRaw, useFritzDevicePresenceHistory, useFritzDeviceEventsRaw, useFritzBandwidthTiers, useFritzBudgetStats, useFritzDeviceCountHistory, useFritzNetworkServices, useFritzSystemInfo, useFritzWifiClients, useFritzWifiNetworks, useBandwidthHistory, useDeviceHistory
- **Network tests (11):** co-located `__tests__/` for all 11 network hooks with URL assertions (useDeviceHistory.test.ts had 5 assertions)
- **Components hook (1):** app/components/devices/network/hooks/useNetworkData.ts (5 URL sites)
- **Debug hook (1):** app/debug/hooks/useFritzServiceDiscovery.ts

## Decisions Made
- Single commit covers Tasks 1+2+3 per plan spec (commit message `refactor(172-02): ...`)
- `useNetworkData.test.ts` intentionally untouched per RESEARCH.md (contains only `'fritzbox'` WS topic and `FRITZBOX_TIMEOUT` error code — no `/api/fritzbox/` URL strings)
- `useFritzServiceDiscovery.test.ts` intentionally untouched per RESEARCH.md (mocks hook, no URL assertions)

## Deviations from Plan

None - plan executed exactly as written.

## Verification Results

### Canonical Hook v1 URL Counts

| File | `/api/v1/fritzbox/` count |
|------|--------------------------|
| useFritzDectHandsets.ts | 2 |
| useFritzCallHistory.ts | 2 |
| useFritzTamStatus.ts | 2 |
| useFritzBandwidthHistoryRaw.ts | 3 |
| useFritzDevicePresenceHistory.ts | 3 |
| useFritzDeviceEventsRaw.ts | 3 |
| useFritzServiceDiscovery.ts | 2 |

### Legacy Ref Sweep

```
grep -rn "/api/fritzbox/" app/telefonia/ app/network/hooks/ app/components/devices/network/hooks/ app/debug/hooks/ --include="*.ts" --include="*.tsx"
```
**Result: 0 matches**

### Pitfall 3 Verification

| Check | Result |
|-------|--------|
| `grep "subscribe.*'fritzbox'" useNetworkData.ts` | MATCH (WS topic preserved) |
| `grep "FRITZBOX_TIMEOUT" useNetworkData.ts` | MATCH (error code preserved) |
| `grep "/api/fritzbox/" useNetworkData.ts` | 0 matches (URL updated to v1) |

### Jest Suites

| Suite | Tests | Result |
|-------|-------|--------|
| app/telefonia/hooks/__tests__/ | 13 | PASS (3 suites) |
| app/network/hooks/__tests__/ | 98 | PASS (13 suites) |
| app/components/devices/network/__tests__/useNetworkData.test.ts | 25 | PASS |
| app/debug/hooks/__tests__/useFritzServiceDiscovery.test.ts | 1 | PASS |
| **Total** | **137** | **All passed** |

### Commit Info

| Check | Result |
|-------|--------|
| Commit SHA | deacade42da9e983550bffc2a6168a6a00292eac |
| Files changed | 31 |
| Insertions | 69 |
| Deletions | 69 |
| `git diff --stat` | Symmetric +/- (pure URL swap confirmed) |

## Known Stubs

None.

## Threat Flags

None — pure URL string rename. No new network endpoints, auth paths, or schema changes introduced.

## Self-Check: PASSED

- All 7 canonical hooks contain `/api/v1/fritzbox/*` strings (counts ≥ 2 each)
- Zero `/api/fritzbox/` refs in 4 target directories
- WS topic `'fritzbox'` and `FRITZBOX_TIMEOUT` preserved in useNetworkData.ts
- Commit deacade42 confirmed in git log with 31 files, 69+69 symmetric changes
- 137 tests passing across 18 suites

## Next Phase Readiness

- Plan 03 (verification) is unblocked: all consumer hooks now fetch from `/api/v1/fritzbox/*`
- Remaining consumer files for Plan 03 scope: `app/network/page.tsx`, `app/registry/devices/page.tsx`, `app/debug/components/tabs/NetworkTab.tsx` (pages + debug panel)
- App is runtime-green: hooks call `/api/v1/fritzbox/*` which Plan 01's routes serve correctly

---
*Phase: 172-fritzbox-v1-path-migration*
*Completed: 2026-04-24*
