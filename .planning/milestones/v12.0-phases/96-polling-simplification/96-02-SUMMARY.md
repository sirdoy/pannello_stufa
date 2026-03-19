---
phase: 96-polling-simplification
plan: "02"
subsystem: polling
tags: [polling, performance, api-load]
requirements_completed: [POLL-04, POLL-05, POLL-06, POLL-07]
dependency_graph:
  requires: []
  provides: [unified-60s-polling]
  affects: [ThermostatCard, LightsCard, NetworkCard, RaspiCard, RaspiPage]
tech_stack:
  added: []
  patterns: [adaptive-polling, visibility-based-interval]
key_files:
  created: []
  modified:
    - app/components/devices/thermostat/ThermostatCard.tsx
    - app/components/devices/lights/hooks/useLightsData.ts
    - app/components/devices/network/hooks/useNetworkData.ts
    - app/components/devices/raspi/hooks/useRaspiData.ts
    - app/components/devices/raspi/hooks/useRaspiFullData.ts
    - lib/hooks/useDeviceStaleness.ts
    - app/components/devices/network/__tests__/useNetworkData.test.ts
decisions:
  - "SPARKLINE_MAX_POINTS stays at 120 — 2h of history at 60s is acceptable, more data is not harmful"
  - "Pre-existing useNetworkData sparkline test is flaky (timeout at 5000ms for 130-iteration loop) — confirmed pre-existing, not caused by this plan"
metrics:
  duration: "3m 43s"
  completed_date: "2026-03-18"
  tasks_completed: 2
  files_modified: 7
requirements: [POLL-04, POLL-05, POLL-06, POLL-07, POLL-08]
---

# Phase 96 Plan 02: Device Polling Unification Summary

**One-liner:** Unified all device hooks to 60s polling (thermostat, lights, network, raspi x2) and reduced useDeviceStaleness from 5s to 60s — cutting non-stove API call volume by 50% and staleness check volume by 92%.

## What Was Built

Six files updated with polling interval changes:

| File | Change | Impact |
|------|--------|--------|
| ThermostatCard.tsx | 30000 → 60000 | 50% fewer Netatmo homeStatus calls |
| useLightsData.ts | 30000 → 60000 | 50% fewer Hue API calls |
| useNetworkData.ts | 30000 → 60000 | 50% fewer Fritz!Box API calls |
| useRaspiData.ts | 30000 → 60000 | 50% fewer Raspi API calls |
| useRaspiFullData.ts | 30000 → 60000 | 50% fewer Raspi API calls (full data) |
| useDeviceStaleness.ts | 5000 → 60000 | 92% fewer Firebase staleness checks |

All `initialDelay` stagger values preserved: ThermostatCard (50ms), LightsData (100ms), RaspiData (600ms), RaspiFullData (600ms). NetworkCard's 500ms initialDelay also preserved.

SPARKLINE_MAX_POINTS stays at 120 — comment updated from "1h at 30s" to "2h at 60s".

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing] Updated stale test comment in useNetworkData.test.ts**
- Found during: Task 1 verification
- Issue: Test comment still said "1h at 30s interval" after sparkline constant comment was updated
- Fix: Updated to "2h at 60s interval" for consistency
- Files modified: app/components/devices/network/__tests__/useNetworkData.test.ts
- Commit: 9d554b8

**2. [Rule 1 - Observation] Pre-existing flaky test in useNetworkData**
- Found during: Overall verification
- Issue: `caps sparkline buffer at 12 points` test times out intermittently due to 130-iteration loop with async delays hitting Jest 5000ms limit
- Confirmed pre-existing: test fails identically without any of this plan's changes (via git stash verification)
- Action: No fix — documented as pre-existing, out of scope

## Self-Check: PASSED

Files exist:
- app/components/devices/thermostat/ThermostatCard.tsx: FOUND
- app/components/devices/lights/hooks/useLightsData.ts: FOUND
- app/components/devices/network/hooks/useNetworkData.ts: FOUND
- app/components/devices/raspi/hooks/useRaspiData.ts: FOUND
- app/components/devices/raspi/hooks/useRaspiFullData.ts: FOUND
- lib/hooks/useDeviceStaleness.ts: FOUND

Commits:
- 1e66a32: feat(96-02): update device hook polling intervals from 30s to 60s
- f1af301: feat(96-02): update useDeviceStaleness polling from 5s to 60s
- 9d554b8: chore(96-02): update stale sparkline comment in test (30s→60s)
