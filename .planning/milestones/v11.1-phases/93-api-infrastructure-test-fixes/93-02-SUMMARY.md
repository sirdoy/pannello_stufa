---
phase: 93-api-infrastructure-test-fixes
plan: "02"
subsystem: lib
tags: [test-fixes, logging, stoveApi, maintenanceService, schedulerService, healthDeadManSwitch]
dependency_graph:
  requires: []
  provides: [TFIX-03, TFIX-04, TFIX-05, TFIX-06]
  affects: [lib/stoveApi.ts, lib/maintenanceService.ts, lib/schedulerService.ts, lib/healthDeadManSwitch.ts]
tech_stack:
  added: []
  patterns: [console.log for operational logging]
key_files:
  created: []
  modified:
    - lib/stoveApi.ts
    - lib/maintenanceService.ts
    - lib/schedulerService.ts
    - lib/healthDeadManSwitch.ts
decisions:
  - "Added console.log calls to match test assertions — these are legitimate operational logs, not test-only noise"
metrics:
  duration: 73s
  completed: 2026-03-18
  tasks_completed: 2
  files_modified: 4
---

# Phase 93 Plan 02: API & Infrastructure Log Fixes Summary

**One-liner:** Added 8 missing console.log statements across 4 lib files so tests asserting on operational log output pass (TFIX-03 through TFIX-06).

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | Add missing logs to stoveApi, maintenanceService, healthDeadManSwitch | 47675fb | lib/stoveApi.ts, lib/maintenanceService.ts, lib/healthDeadManSwitch.ts |
| 2 | Add missing logs to schedulerService | c47d355 | lib/schedulerService.ts |

## What Was Built

Four source files were missing console.log statements that their test suites assert on via `jest.spyOn(console, 'log')`. One-line additions per function — no logic was changed.

**lib/stoveApi.ts (TFIX-03):** Added `console.log('Timeout on attempt N/M. Retrying...')` inside the empty `if (attempt < maxRetries)` block in `fetchWithRetry`.

**lib/maintenanceService.ts (TFIX-04):** Added `console.log('⚠️ Maintenance threshold reached: ...')` immediately after `currentData.needsCleaning = true` in `trackUsageHours`.

**lib/healthDeadManSwitch.ts (TFIX-06):** Added `console.log('[DeadManSwitch] ADMIN_USER_ID not configured, skipping alert')` before the early `return` in `alertDeadManSwitch`.

**lib/schedulerService.ts (TFIX-05):** Added 4 console.log calls:
- `saveSchedule`: "Scheduler salvato per {day}"
- `setSchedulerMode`: "Modalità scheduler impostata su: attiva/disattiva"
- `setSemiManualMode`: "Modalità semi-manuale attivata. Ritorno automatico previsto: {timestamp}"
- `clearSemiManualMode`: "Modalità semi-manuale disattivata. Ritorno in automatico."

## Verification Results

```
Test Suites: 4 passed, 4 total
Tests:       107 passed, 107 total
```

- TFIX-03: stoveApi.test.ts — PASS (fetchWithRetry retry logging)
- TFIX-04: maintenanceService.test.ts — PASS (threshold reached log)
- TFIX-05: schedulerService.test.ts — PASS (all 5 CRUD log assertions)
- TFIX-06: healthDeadManSwitch.test.ts — PASS (ADMIN_USER_ID missing log)

## Deviations from Plan

None — plan executed exactly as written.

## Decisions Made

- Added console.log calls to match test assertions — these are legitimate operational logs, not test-only noise. They document retry events, maintenance state changes, and scheduler operations, which are useful for production debugging.

## Self-Check: PASSED

Files modified:
- FOUND: lib/stoveApi.ts
- FOUND: lib/maintenanceService.ts
- FOUND: lib/healthDeadManSwitch.ts
- FOUND: lib/schedulerService.ts

Commits:
- FOUND: 47675fb
- FOUND: c47d355
