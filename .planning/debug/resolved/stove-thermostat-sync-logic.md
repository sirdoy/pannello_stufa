---
status: resolved
trigger: "La connessione tra stufa e termostati usa lo scheduling della stufa invece dello stato attuale della stufa"
created: 2026-02-02T10:00:00Z
updated: 2026-02-02T10:45:00Z
---

## Current Focus

hypothesis: CONFIRMED and FIXED
test: Unit tests verify sync calls are made
expecting: Manual stove operations now trigger immediate thermostat sync
next_action: Archive session

## Symptoms

expected: I termostati dovrebbero sincronizzare la temperatura target con lo stato reale della stufa (quando accesa/spenta)
actual: Attualmente la sincronizzazione e guidata dallo scheduling della stufa, non dallo stato reale (stoveActive/stoveStatus)
errors: Nessun errore visibile - la logica funziona ma e sbagliata
reproduction: Qualsiasi cambio di stato della stufa (accesa/spenta manualmente) non si riflette sui termostati se non e previsto dallo schedule
started: Comportamento attuale del sistema - da cambiare

## Eliminated

- hypothesis: Cron job uses schedule intervals to decide sync
  evidence: Line 540-549 in /api/scheduler/check/route.js shows enforceStoveSyncSetpoints(isOn) is called with isOn = stove status (WORK/START), NOT schedule active status
  timestamp: 2026-02-02T10:10:00Z

## Evidence

- timestamp: 2026-02-02T10:05:00Z
  checked: /api/scheduler/check/route.js (main cron endpoint)
  found: >
    Stove sync in cron is based on isOn = currentStatus.includes('WORK') || currentStatus.includes('START')
    (line 304, 540-541). The sync at lines 537-553 uses enforceStoveSyncSetpoints(isOn) which checks
    actual Netatmo setpoints vs expected and re-syncs if needed.
  implication: The cron-based sync DOES use actual stove status, not schedule

- timestamp: 2026-02-02T10:08:00Z
  checked: netatmoStoveSync.js
  found: >
    syncLivingRoomWithStove(stoveIsOn) takes a boolean for stove state.
    enforceStoveSyncSetpoints(stoveIsOn) verifies actual Netatmo setpoints.
    Both functions do NOT read schedule data - they trust the caller to provide stove state.
  implication: The sync functions are generic and work correctly based on input

- timestamp: 2026-02-02T10:12:00Z
  checked: handleIgnition/handleShutdown in scheduler check route
  found: >
    Lines 358-362 (ignition) and 383-387 (shutdown) call syncLivingRoomWithStove(true/false)
    AFTER scheduler actions. These only trigger on schedule-based events.
  implication: The IMMEDIATE sync is only triggered by scheduler, not manual stove operations

- timestamp: 2026-02-02T10:22:00Z
  checked: lib/services/StoveService.js
  found: >
    StoveService.ignite() and .shutdown() do NOT call syncLivingRoomWithStove().
    They only update Firebase state and handle semi-manual mode.
    This is the ROOT CAUSE - manual commands don't trigger thermostat sync.
  implication: Manual stove operations wait up to 1 minute for the cron to pick up the change

- timestamp: 2026-02-02T10:23:00Z
  checked: app/api/stove/ignite/route.js and shutdown/route.js
  found: These routes use StoveService which lacks sync logic
  implication: All manual ignite/shutdown commands miss immediate thermostat sync

- timestamp: 2026-02-02T10:33:00Z
  checked: Unit tests for StoveService
  found: >
    7 tests pass:
    - ignite() calls syncLivingRoomWithStove(true)
    - shutdown() calls syncLivingRoomWithStove(false)
    - Both work for manual and scheduler sources
    - Sync errors don't block the response
    - Maintenance block prevents sync (as expected)
  implication: Fix is working correctly

- timestamp: 2026-02-02T10:43:00Z
  checked: Full test suite regression check
  found: >
    Before change: 72 failing tests
    After change: 66 failing tests
    No regressions introduced by this fix
  implication: Fix is safe to commit

## Resolution

root_cause: >
  StoveService.ignite() and StoveService.shutdown() in lib/services/StoveService.js
  did NOT call syncLivingRoomWithStove() after the stove operation succeeds.
  This meant manual stove commands from the UI did not immediately sync thermostats.
  The sync only happened when the cron job ran (every minute via /api/scheduler/check).

  Comparison:
  - Scheduler route (line 358-362, 383-387): Calls syncLivingRoomWithStove(true/false) immediately
  - StoveService (before fix): Did NOT call syncLivingRoomWithStove at all

fix: >
  Added syncLivingRoomWithStove(true) after successful ignite, and syncLivingRoomWithStove(false)
  after successful shutdown in StoveService. The sync runs asynchronously (fire-and-forget) to
  not block the API response. Error handling logs failures but doesn't affect the stove operation.

verification: >
  - Unit tests: 7 tests pass (lib/services/__tests__/StoveService.test.js)
  - Verified: syncLivingRoomWithStove(true) called after ignite
  - Verified: syncLivingRoomWithStove(false) called after shutdown
  - Verified: Sync errors don't block stove operation
  - Regression test: No new failures introduced

files_changed:
  - lib/services/StoveService.js (added import and sync calls)
  - lib/services/__tests__/StoveService.test.js (new test file)
