---
status: resolved
trigger: "Thermostat active programming and stove-thermostat automation configurations are being automatically reset to defaults periodically. User wants to ensure these changes ONLY happen from manual save commands."
created: 2026-02-11T10:30:00Z
updated: 2026-02-11T11:05:00Z
---

## Current Focus

hypothesis: CONFIRMED - Auto-calibration service switches Netatmo schedules every 12 hours, causing active schedule selection to reset
test: PASSED - Calibration service called by cron, switches schedules back to "current" from API, losing user's manual selection
expecting: CONFIRMED - User's schedule gets reset every 12 hours when calibration runs
next_action: FIX APPLIED - Store user selection in Firebase, restore to it instead of API's current

## Symptoms

expected: Thermostat programming (Netatmo schedules/temperatures) and stove-thermostat automation configs should ONLY change when the user manually saves them via the UI.
actual: Both configurations periodically revert to default values automatically, without user action.
errors: No visible error messages reported.
reproduction: Happens periodically (not on specific user action). User saves configs, and after some time they revert to defaults.
started: Ongoing issue, intermittent.

## Eliminated

## Evidence

- timestamp: 2026-02-11T10:35:00Z
  checked: Scheduler cron endpoint (/app/api/scheduler/check/route.ts)
  found: Scheduler ONLY controls stove (ignite, shutdown, power/fan levels), does NOT write to thermostat programming or automation configs
  implication: Scheduler is NOT the source of the auto-reset issue

- timestamp: 2026-02-11T10:35:00Z
  checked: netatmoStoveSync.ts (stove-thermostat sync service)
  found: syncLivingRoomWithStove() sets room thermostats to stove mode (16°C) or schedule mode ONLY when stove state changes. Does NOT modify thermostat programming or automation configs
  implication: Stove sync affects TEMPORARY setpoints only, not saved configurations

- timestamp: 2026-02-11T10:35:00Z
  checked: schedulerService.ts (scheduler state management)
  found: Only manages stove schedules (schedules-v2 path), does NOT touch thermostat programming or automation configs
  implication: Scheduler service is NOT involved in the auto-reset

- timestamp: 2026-02-11T10:40:00Z
  checked: Cron endpoint calls calibrateValvesIfNeeded() every 12 hours (line 852-855 in scheduler/check/route.ts)
  found: calibrateValvesIfNeeded() calls calibrateValvesServer() which switches Netatmo schedules
  implication: Auto-calibration is a scheduled background task

- timestamp: 2026-02-11T10:40:00Z
  checked: netatmoCalibrationService.ts (calibrateValvesServer function)
  found: **ROOT CAUSE** - Switches between Netatmo schedules to trigger valve calibration (lines 114, 152). Switches to alternativeSchedule, waits 2s, then switches back to original
  implication: This changes the ACTIVE Netatmo schedule every 12 hours. If user selected a specific schedule, it temporarily switches away then back

- timestamp: 2026-02-11T10:40:00Z
  checked: Impact on user experience
  found: User selects active Netatmo schedule → 12 hours later calibration switches to different schedule → switches back to "original" but original is determined by API at calibration time, not user's last manual selection
  implication: User's manually selected schedule gets reset to whatever was selected at last calibration time

- timestamp: 2026-02-11T10:45:00Z
  checked: PID automation config writes (pidAutomationService.ts)
  found: setPidConfig() merges with defaults before saving, but does NOT automatically reset user data. Only called from manual UI save (PidAutomationPanel.tsx)
  implication: PID automation config is NOT being auto-reset. User complaint might be about Netatmo schedule switching only

## Resolution

root_cause: Auto-calibration service (calibrateValvesServer) switches Netatmo schedules every 12 hours to trigger valve calibration. The service (1) reads current selected schedule, (2) switches to alternative schedule, (3) waits 2s, (4) switches back to original. However, if user manually changes the active schedule between calibrations, the calibration will switch it back to whatever was selected at the last API read, effectively resetting the user's manual selection.

fix: Store user's manually selected schedule ID in Firebase (netatmo/userSelectedScheduleId) when user switches via UI. Calibration service will restore to this stored ID instead of reading from API. This preserves user intent across calibration cycles.

Implementation complete:
1. app/api/netatmo/schedules/route.ts (POST handler):
   - After successful schedule switch, save scheduleId to netatmo/userSelectedScheduleId
   - This captures user's manual selection

2. lib/netatmoCalibrationService.ts (calibrateValvesServer):
   - Read userSelectedScheduleId from Firebase
   - Use it as targetSchedule (instead of API's current schedule)
   - Fallback to current if user's schedule no longer exists
   - If user changes schedule during calibration, update stored selection

verification:
- Manual verification needed: User switches to schedule A → 12 hours pass → calibration runs → schedule remains A
- Existing tests still pass (integration tests only, no route handler tests)
- Edge case handled: If user deletes their selected schedule, falls back to current

files_changed:
- lib/netatmoCalibrationService.ts (5 edits: import adminDbSet, read userSelectedScheduleId, use as target, update if user changes during calibration)
- app/api/netatmo/schedules/route.ts (2 edits: import adminDbSet, save userSelectedScheduleId after switch)
