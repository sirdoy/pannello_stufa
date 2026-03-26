---
phase: 138-sonos-frontend-wiring
plan: "01"
subsystem: sonos-frontend
tags: [sonos, nav, hooks, data-fetch, commands]
dependency_graph:
  requires: []
  provides: [sonos-devices-fetch, sonos-zone-volume-cmd, sonos-seek-cmd, sonos-nav-fix]
  affects: [lib/devices/deviceTypes.ts, app/components/devices/sonos/hooks]
tech_stack:
  added: []
  patterns: [haGet-fetch-chain, sonosVolumeCmd-reuse]
key_files:
  created: []
  modified:
    - lib/devices/deviceTypes.ts
    - app/components/devices/sonos/hooks/useSonosFullData.ts
    - app/components/devices/sonos/hooks/__tests__/useSonosFullData.test.ts
    - app/components/devices/sonos/hooks/useSonosCommands.ts
    - app/components/devices/sonos/hooks/__tests__/useSonosCommands.test.ts
decisions:
  - "SonosDeviceResponse actual type used (uid/name/ip/model/firmware/serial/role/is_visible/is_coordinator) — matches types/sonosProxy.ts, not plan interface stub"
  - "handleSetZoneVolume and handleSeek reuse sonosVolumeCmd (no new useRetryableCommand call) — exactly 3 calls maintained"
metrics:
  duration_minutes: 8
  completed_date: "2026-03-26"
  tasks_completed: 1
  files_modified: 5
---

# Phase 138 Plan 01: Sonos Frontend Wiring Summary

Fix Sonos nav 404s (removed spotify/zones routes), add /api/sonos/devices fetch to useSonosFullData, and add handleSetZoneVolume + handleSeek handlers to useSonosCommands using existing sonosVolumeCmd.

## Tasks Completed

| # | Name | Commit | Files |
|---|------|--------|-------|
| 1 | Fix deviceTypes.ts nav 404s and extend hooks with new handlers + devices fetch | 05cd18e6 | 5 modified |

## Decisions Made

1. **Actual SonosDeviceResponse type used** — The plan's interface stub had `model_number`, `serial_number`, `zone_name` fields that do not exist in `types/sonosProxy.ts`. Used actual fields: `uid`, `name`, `ip`, `model`, `firmware`, `serial`, `role`, `is_visible`, `is_coordinator`. Test fixtures updated accordingly.

2. **sonosVolumeCmd reused for new handlers** — Both `handleSetZoneVolume` and `handleSeek` use the existing `sonosVolumeCmd` instance per plan spec. No new `useRetryableCommand()` calls added. Hook still has exactly 3 calls.

## Verification Results

- `grep -c 'spotify' lib/devices/deviceTypes.ts` → 0 (nav 404s removed)
- `grep 'handleSetZoneVolume\|handleSeek'` → both handlers present in interface, implementation, and return object
- `grep 'devices: SonosDeviceResponse'` → field present in SonosFullData interface and fetch body
- `grep -c 'useRetryableCommand('` → 3 (unchanged)
- All 28 tests pass (16 useSonosCommands + 12 useSonosFullData)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Adapted SonosDeviceResponse fixture fields to match actual types**
- **Found during:** Task 1
- **Issue:** Plan's interface stub in `<interfaces>` section used different field names (`model_number`, `serial_number`, `zone_name`) vs actual `types/sonosProxy.ts` definition
- **Fix:** Used actual type fields in test fixtures: `model`, `serial`, and no `zone_name` (per Phase 128 decision: "use actual types/sonosProxy.ts field names")
- **Files modified:** `useSonosFullData.test.ts`
- **Commit:** 05cd18e6

## Known Stubs

None. All new fields are wired to live API endpoints.

## Self-Check: PASSED

- `lib/devices/deviceTypes.ts` — exists, Sonos routes contain only `main: '/sonos'`
- `app/components/devices/sonos/hooks/useSonosFullData.ts` — exists, contains `devices: SonosDeviceResponse[]`
- `app/components/devices/sonos/hooks/useSonosCommands.ts` — exists, contains `handleSetZoneVolume` and `handleSeek`
- Commit 05cd18e6 — verified in git log
