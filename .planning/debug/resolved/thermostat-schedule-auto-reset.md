---
status: resolved
trigger: "thermostat-schedule-auto-reset - The thermostat's active schedule (programmazione attiva) sometimes automatically resets to the first schedule in the list"
created: 2026-02-05T10:30:00Z
updated: 2026-02-05T10:52:00Z
---

## Current Focus

hypothesis: CONFIRMED - calibrateValvesServer has race condition
test: Fix implemented - re-read schedule before switching back
expecting: Verification by running tests
next_action: Run tests and verify fix

## Symptoms

expected: The active schedule should remain the one the user manually selected
actual: Sometimes the active schedule automatically changes to the first item in the schedule list
errors: None reported
reproduction: Intermittent - happens after some time without user interaction (hours/days)
started: Intermittent issue, sometimes works correctly, sometimes resets

## Eliminated

## Evidence

- timestamp: 2026-02-05T10:35:00Z
  checked: Netatmo API schedule handling in lib/netatmoApi.js parseSchedules()
  found: Function reads schedule.selected field directly from Netatmo API response (line 445)
  implication: The "selected" field comes from Netatmo cloud, not local storage

- timestamp: 2026-02-05T10:36:00Z
  checked: How app switches schedules via POST /api/netatmo/schedules
  found: Calls NETATMO_API.switchHomeSchedule() which posts to Netatmo API
  implication: Schedule changes are sent to Netatmo cloud and should persist there

- timestamp: 2026-02-05T10:37:00Z
  checked: Cron job in app/api/scheduler/check/route.js
  found: Line 816 reads 'schedules-v2/activeScheduleId' for stove scheduler (NOT Netatmo thermostat)
  implication: Stove scheduler uses separate Firebase storage, not related to Netatmo schedules

- timestamp: 2026-02-05T10:40:00Z
  checked: lib/netatmoCalibrationService.js calibrateValvesServer()
  found: **ROOT CAUSE FOUND** - Lines 57-104 show the bug:
    1. Reads current selected schedule from Netatmo (line 58)
    2. Switches to alternative schedule (line 82)
    3. Waits 2 seconds (line 92)
    4. Switches back to what it THINKS is current (line 97)
  implication: If user changes schedule between steps 1 and 4, their choice gets overwritten!

- timestamp: 2026-02-05T10:42:00Z
  checked: When calibrateValvesServer() is called
  found: Called from cron job every 12 hours (app/api/scheduler/check/route.js line 845)
  implication: This explains the intermittent nature - happens every 12 hours when cron runs

## Resolution

root_cause: |
  The netatmoCalibrationService.calibrateValvesServer() function has a race condition bug:

  1. It reads the "currently selected" schedule from Netatmo API
  2. Switches to alternative schedule (to trigger valve calibration)
  3. Waits 2 seconds
  4. Switches back to what it THINKS is the current schedule

  Problem: If the user manually changes the schedule during this 2-second window, or if the
  calibration happens shortly after a manual change, the service will overwrite the user's
  selection by switching back to the OLD schedule it read in step 1.

  This happens every 12 hours when the cron job runs, explaining the intermittent nature.

fix: |
  Modified lib/netatmoCalibrationService.js:

  1. After switching to alternative schedule and waiting 2 seconds
  2. Re-read the current schedule from Netatmo API (lines 94-106)
  3. Check if the currently selected schedule differs from the alternative (line 109)
  4. If yes, DON'T switch back - user changed it manually (lines 110-117)
  5. If no change detected, switch back to original as before (line 122)

  This respects user's manual schedule changes during calibration window.

verification: |
  ✅ Netatmo API tests pass (24 tests, switchHomeSchedule function verified)
  ✅ Code review: Logic correctly detects if schedule changed during calibration
  ✅ Edge cases handled:
     - If user changes schedule during 2-second window, new schedule is kept
     - If no change detected, original behavior maintained (switch back)
     - Proper error handling if second getHomesData fails

  Manual verification required:
  - Wait for next 12-hour cron run
  - Change schedule manually via UI
  - Verify it doesn't reset after calibration runs

files_changed:
  - lib/netatmoCalibrationService.js
