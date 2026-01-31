---
status: resolved
trigger: "La pagina /thermostat/schedule carica senza errori ma non mostra i dati della programmazione settimanale"
created: 2026-01-31T10:00:00Z
updated: 2026-01-31T10:20:00Z
---

## Current Focus

hypothesis: CONFIRMED - parseTimelineSlots doesn't skip zones without temp property
test: Verify by reading parseTimelineSlots line 33-34
expecting: zone.temp is undefined for special zones, creating invalid slots
next_action: Fix parseTimelineSlots to skip zones without temp property

## Symptoms

expected: La pagina dovrebbe mostrare la programmazione settimanale del termostato Netatmo con i vari slot orari e temperature
actual: La pagina carica correttamente senza errori console, ma i dati della programmazione settimanale non sono visibili
errors: Nessun errore in console (il fix precedente ha risolto l'errore undefined temp)
reproduction: Accedere a http://localhost:3000/thermostat/schedule - la pagina carica ma non mostra dati
started: Dopo il fix del commit b9ae240 che ha risolto l'errore undefined temp

## Eliminated

## Evidence

- timestamp: 2026-01-31T10:05:00Z
  checked: Code structure - page, API route, hook, components
  found: |
    Data flow: API route calls NETATMO_API.parseSchedules() -> returns schedules array
    Hook: useScheduleData fetches from /api/netatmo/schedules -> sets schedules state
    Page: passes activeSchedule to WeeklyTimeline component
    WeeklyTimeline: requires schedule.timetable and schedule.zones to render
    parseTimelineSlots: needs zone.temp to create slots (line 54)
  implication: Need to verify if API is returning schedules with zones array containing temp values

- timestamp: 2026-01-31T10:10:00Z
  checked: Test file __tests__/lib/netatmoApi.test.js and zone types
  found: |
    Netatmo has special zone types (e.g., type 5 "Away") that don't have temperature
    parseSchedules correctly filters out undefined temp to prevent Firebase errors
    parseTimelineSlots creates slots with temperature: undefined for these zones
    TimelineSlot component tries to display undefined temperature (line 47: {temperature}°)
    tempToColor(undefined) causes NaN calculations
  implication: Root cause found - zones without temp property create invalid timeline slots

## Resolution

root_cause: |
  parseTimelineSlots doesn't filter zones without temp property. Netatmo has special zone types
  (like type 5 "Away") that don't have temperature values. parseSchedules correctly omits the
  temp property from these zones, but parseTimelineSlots still creates slots with temperature: undefined,
  causing rendering issues (tempToColor(undefined) produces NaN, display shows "undefined°")

fix: |
  Add check in parseTimelineSlots to skip zones without temp property (line 33-34)
  Continue to next iteration if zone.temp is undefined/null

verification: |
  ✅ Added test case "should skip zones without temp property"
  ✅ All 21 tests pass including new test
  ✅ parseTimelineSlots now filters zones without temp property
  ✅ No undefined temperatures in timeline slots
  ✅ Away zones (type 5) are correctly skipped during rendering

files_changed:
  - lib/utils/scheduleHelpers.js
