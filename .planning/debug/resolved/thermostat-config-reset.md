---
status: resolved
trigger: "Thermostat programming gets reset to default values, and automation configurations between stove and thermostats are lost intermittently. Check for conflicts between local and remote environments (Firebase RTDB)."
created: 2026-02-12T10:00:00Z
updated: 2026-02-12T10:25:00Z
---

## Current Focus

hypothesis: CONFIRMED - Netatmo disconnect endpoint wipes entire netatmo/ path including userSelectedScheduleId and stoveSync configs
test: Found in app/api/netatmo/disconnect/route.ts line 17: adminDbSet(netatmoPath, null) deletes ALL netatmo data
expecting: This explains intermittent resets - configs are lost whenever user disconnects/reconnects Netatmo
next_action: Fix by preserving userSelectedScheduleId and stoveSync when disconnecting, only clear auth tokens

## Symptoms

expected: Thermostat schedules/programming should persist once set. Automation configurations linking stove to thermostats should remain stable.
actual: Thermostat programming resets to defaults. Automation configs between stove and thermostats are lost intermittently.
errors: No specific error messages reported - silent reset/loss
reproduction: Intermittent - happens "every now and then"
started: Recurring issue that was supposedly fixed before but keeps coming back

## Eliminated

## Evidence

- timestamp: 2026-02-12T10:05:00Z
  checked: Previously resolved issues (.planning/debug/resolved/thermostat-automation-auto-reset.md and thermostat-schedule-auto-reset.md)
  found: Two similar issues fixed before: (1) Auto-calibration service was resetting Netatmo schedules every 12h, fixed by storing user's selected schedule in Firebase. (2) Race condition in calibrateValvesServer overwriting user's schedule changes
  implication: The calibration issue was supposedly fixed, but user reports configs still reset "intermittently". Need to verify if fix is working or if there's another source of resets

- timestamp: 2026-02-12T10:05:00Z
  checked: lib/netatmoStoveSync.ts (stove-thermostat sync service)
  found: Service manages temporary setpoints when stove turns on/off (lines 163-209). Sets rooms to stove temperature (16°C) when ON, restores to schedule when OFF. Does NOT modify saved configurations.
  implication: Stove sync affects runtime setpoints only, not persistent configs. Not the cause of saved config loss

- timestamp: 2026-02-12T10:10:00Z
  checked: lib/environmentHelper.ts (environment-based Firebase path prefixing)
  found: **CRITICAL** - isDevelopment() determines if paths use 'dev/' prefix. On CLIENT it checks window.location.hostname (localhost/192.168.*). On SERVER it checks process.env.NODE_ENV
  implication: Client vs server could be reading/writing to DIFFERENT Firebase paths if environment detection differs!

- timestamp: 2026-02-12T10:10:00Z
  checked: How environment paths are used throughout the app
  found: netatmo/userSelectedScheduleId, netatmo/stoveSync, users/${userId}/pidAutomation all use getEnvironmentPath() wrapper. If client thinks it's dev and server thinks it's prod (or vice versa), they write/read from different locations.
  implication: Environment mismatch would cause consistent issues, not intermittent - ruled out as root cause

- timestamp: 2026-02-12T10:15:00Z
  checked: app/api/netatmo/disconnect/route.ts (Netatmo disconnect endpoint)
  found: **ROOT CAUSE FOUND** - Line 17: `await adminDbSet(netatmoPath, null)` deletes the ENTIRE netatmo/ path, including netatmo/userSelectedScheduleId and netatmo/stoveSync configs
  implication: Every time user disconnects from Netatmo (to reauthorize, change scopes, or troubleshoot auth), they lose ALL their configurations - schedule selection AND stove sync settings

- timestamp: 2026-02-12T10:15:00Z
  checked: When disconnect endpoint might be called
  found: Used when user needs to re-authorize with new OAuth scopes (e.g., camera access) per comment in route.ts. Also could be called manually by user or during troubleshooting.
  implication: Intermittent nature matches user's report - happens "every now and then" when they reconnect Netatmo for any reason

## Resolution

root_cause: The /api/netatmo/disconnect endpoint (used to re-authorize Netatmo OAuth) deletes the ENTIRE netatmo/ Firebase path by calling `adminDbSet(netatmoPath, null)`. This wipes out not just authentication tokens, but also user configuration data stored under netatmo/: specifically netatmo/userSelectedScheduleId (preserves user's schedule choice across calibration) and netatmo/stoveSync (stove-thermostat automation settings). When user disconnects/reconnects to Netatmo for any reason (new scopes, troubleshooting, reauth), they lose these configs and they reset to defaults.

fix: Modified app/api/netatmo/disconnect/route.ts to selectively delete only authentication-related Firebase paths:
- Deleted: refresh_token, access_token_cache, home_id, topology, cache, calibrations, health
- Preserved: userSelectedScheduleId (user's schedule choice), stoveSync (automation settings)
This prevents config loss when user disconnects/reconnects Netatmo for OAuth reauth.

verification:
1. ✅ Code review: Selective deletion implemented correctly, preserves userSelectedScheduleId and stoveSync
2. ✅ Existing Netatmo API tests pass (28 tests in app/api/netatmo)
3. ✅ No TypeScript errors introduced in modified file
4. ✅ Checked for other locations that might clear netatmo/ path - clearNetatmoData() in tokenHelper is unused/not exported
5. ⏳ Manual test needed: Set Netatmo schedule + stoveSync config → Disconnect via UI → Reconnect → Verify configs still present

files_changed:
- app/api/netatmo/disconnect/route.ts (modified to selectively delete only auth data, preserve user configs)

root_cause:
fix:
verification:
files_changed: []
