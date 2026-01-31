---
status: resolved
trigger: "La pagina /thermostat/schedule mostra 'Nessun dato' per ogni giorno invece della programmazione"
created: 2026-01-31T10:30:00Z
updated: 2026-01-31T11:45:00Z
---

## Current Focus

hypothesis: Fix applied and tested - parseSchedules now handles multi-room structure
test: Verify in browser that schedule page shows actual schedule data instead of "Nessun dato"
expecting: Each day shows temperature slots from Netatmo schedule
next_action: Manual verification in browser at /thermostat/schedule

## Symptoms

expected: Ogni giorno della settimana dovrebbe mostrare gli slot orari con le temperature programmate
actual: Ogni giorno mostra "Nessun dato"
errors: Nessun errore in console
reproduction: Accedere a http://localhost:3000/thermostat/schedule
started: Dopo i fix precedenti (b9ae240 e f183b51) che hanno risolto errori undefined temp

## Eliminated

## Evidence

- timestamp: 2026-01-31T10:35:00Z
  checked: parseSchedules function in netatmoApi.js (lines 435-475)
  found: parseSchedules filters zones to exclude temp property if zone.temp === undefined (line 458)
  implication: If Netatmo API doesn't return temp in expected format, all zones get filtered out

- timestamp: 2026-01-31T10:36:00Z
  checked: parseTimelineSlots function in scheduleHelpers.js (lines 20-101)
  found: parseTimelineSlots skips zones where temp === undefined || temp === null (line 38)
  implication: If all zones have undefined/null temp, slotsByDay will be empty arrays

- timestamp: 2026-01-31T10:37:00Z
  checked: WeeklyTimeline component (lines 70-85)
  found: Shows "Nessun dato" when slotsByDay[dayIndex].length === 0 (line 83)
  implication: This is exactly what user sees - confirms hypothesis that all slots are being filtered out

- timestamp: 2026-01-31T10:40:00Z
  checked: Previous debug file (.planning/debug/resolved/schedule-data-not-displayed.md)
  found: Fix f183b51 added zone.temp filtering to SKIP zones without temp (Away zones type 5)
  implication: Filtering works correctly BUT now ALL zones are being skipped = NO zones have temp property

- timestamp: 2026-01-31T10:42:00Z
  checked: parseSchedules implementation (lines 448-464)
  found: Line 458 checks "if (zone.temp !== undefined)" and only includes temp if defined
  implication: If Netatmo API doesn't return zone.temp directly, parseSchedules won't include it, then parseTimelineSlots skips all zones

- timestamp: 2026-01-31T10:45:00Z
  checked: Git history - commit b9ae240 and the version before
  found: BEFORE fix, code had "temp: zone.temp" directly - so Netatmo DOES return zone.temp
  implication: Netatmo API returns zone.temp, but some zones have it undefined (Away). Question: why are ALL zones undefined now?

- timestamp: 2026-01-31T10:46:00Z
  checked: Logical analysis - two possibilities
  found: Either (1) ALL zones in current schedule are type 5 Away (unlikely), or (2) There's something wrong with how data is retrieved
  implication: Need to add logging to see actual raw Netatmo response before parseSchedules filters it

- timestamp: 2026-01-31T10:55:00Z
  checked: Netatmo API documentation (via WebSearch)
  found: Netatmo zones structure: zones: [{ type: 0, id: 0, temp: 19 }, { type: 1, id: 1, temp: 17 }, ...]
  implication: Netatmo DOES return temp directly on zone objects - confirms original code was correct

- timestamp: 2026-01-31T10:56:00Z
  checked: Added console.log to parseSchedules (line 441-443, 461-463, 469)
  found: Logs will show raw zones from Netatmo and which zones are missing temp
  implication: Need to wait for fresh API call (not cached) to see logs, or check user's actual schedule data

- timestamp: 2026-01-31T11:05:00Z
  checked: Previous debug file schedule-route-undefined-temp.md
  found: Original error was "zones.0.temp" was undefined - zone 0 specifically
  implication: At that time, at least one zone had undefined temp. Now ALL zones have undefined temp

- timestamp: 2026-01-31T11:07:00Z
  checked: Netatmo API zone type documentation (via WebSearch)
  found: Types 0-5 are Comfort, Night, Eco, Away, undefined, Comfort+ - ALL should have temp values
  implication: If Netatmo API returns proper zones, they ALL should have temp. But they don't.

- timestamp: 2026-01-31T11:09:00Z
  checked: Logical deduction from available evidence
  found: Netatmo likely uses rooms_temp array where rooms_temp[type] = temperature for that zone type
  implication: Need to check if zone.rooms_temp exists and extract temp from rooms_temp[zone.type]

- timestamp: 2026-01-31T11:15:00Z
  checked: WeeklyTimeline component logic (lines 15-18, 70-85)
  found: Returns empty arrays if !schedule?.timetable || !schedule?.zones - parseTimelineSlots also returns [] if no zones
  implication: Either activeSchedule has no zones array, OR zones array exists but ALL zones were filtered out by parseSchedules

- timestamp: 2026-01-31T11:16:00Z
  checked: parseSchedules filtering logic (lines 448-464)
  found: If ALL raw Netatmo zones have temp===undefined, then parsed.zones will have zones but NO zone will have temp property
  implication: parseTimelineSlots will skip ALL zones (line 38), resulting in empty slotsByDay, showing "Nessun dato"

- timestamp: 2026-01-31T11:30:00Z
  checked: User's server logs showing actual Netatmo data structure
  found: Zones are multi-room with rooms_temp array - NO direct zone.temp property. Example: zone.rooms_temp = [{ room_id: '2678939675', temp: 14 }, ...]
  implication: ROOT CAUSE CONFIRMED - parseSchedules looks for zone.temp which doesn't exist in Netatmo's multi-room structure

- timestamp: 2026-01-31T11:38:00Z
  checked: Modified parseSchedules to extract temp from rooms_temp[0].temp (multi-room structure)
  found: Added fallback chain - zone.temp → zone.rooms_temp[0].temp → zone.rooms[0].therm_setpoint_temperature
  implication: Zones now get temp property from multi-room structure

- timestamp: 2026-01-31T11:39:00Z
  checked: Added unit test for multi-room structure and ran test suite
  found: All 6 parseSchedules tests pass, including new test "should extract temp from multi-room structure (rooms_temp array)"
  implication: Fix verified at unit test level - parseSchedules correctly extracts temps from multi-room structure

## Resolution

root_cause: |
  Netatmo API uses multi-room structure where zones have rooms_temp array with per-room temperatures,
  NOT a direct zone.temp property. The parseSchedules function expects zone.temp, which doesn't exist
  in this structure, causing ALL zones to be filtered out (temp === undefined). This results in
  parsed schedules with no zones having temp property, which makes parseTimelineSlots skip ALL zones
  (line 38 check), producing empty slotsByDay arrays, displaying "Nessun dato" for every day.

fix: |
  Modified parseSchedules (lib/netatmoApi.js lines 458-469) to handle multi-room structure:
  - Added fallback chain: zone.temp → zone.rooms_temp[0].temp → zone.rooms[0].therm_setpoint_temperature
  - Uses first room's temperature as representative temp for multi-room zones
  - Preserves filtering: zones without any temp remain without temp property (Away zones)
  - Removed debug logging after verification

verification: |
  Unit tests: ✅ All 6 parseSchedules tests pass
  - Existing tests (direct zone.temp): ✅ Pass
  - New test (multi-room structure): ✅ Pass
  - Away zones (no temp): ✅ Pass

  Browser verification: Ready for testing
  - Navigate to http://localhost:3000/thermostat/schedule
  - If Netatmo cache is active (< 10 min), wait or trigger fresh API call
  - Expected: Each day shows temperature slots instead of "Nessun dato"

  The fix handles all 3 cases:
  1. Legacy format (zone.temp directly): Works ✅
  2. Multi-room format (zone.rooms_temp[]): Works ✅
  3. Away zones (no temp): Correctly filtered ✅

files_changed:
  - lib/netatmoApi.js (parseSchedules function - multi-room temp extraction)
  - __tests__/lib/netatmoApi.test.js (added multi-room structure test)
