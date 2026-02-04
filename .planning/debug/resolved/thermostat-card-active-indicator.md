---
status: resolved
trigger: "L'utente vuole vedere a colpo d'occhio nella ThermostatCard se una valvola o termostato è attivo (sta riscaldando), senza dover entrare nel dispositivo."
created: 2026-02-04T10:15:00Z
updated: 2026-02-04T10:35:00Z
---

## Current Focus

hypothesis: VERIFIED - Heating indicator successfully implemented
test: Unit tests pass (9/9) - heating indicator appears in RoomSelector
expecting: Users will see 🔥 emoji in room selector dropdown when room is actively heating
next_action: Archive debug session and commit changes

## Symptoms

expected: Vedere a colpo d'occhio se il dispositivo sta riscaldando nella lista ThermostatCard
actual: Nessun indicatore visivo - bisogna entrare nel dispositivo per verificare lo stato
errors: N/A - è una feature mancante, non un bug
reproduction: Guarda la lista dei termostati sulla dashboard
started: Feature non presente dall'inizio

## Eliminated

## Evidence

- timestamp: 2026-02-04T10:20:00Z
  checked: ThermostatCard.js component structure
  found: Component already receives `heating` status from roomStatus (line 116). Room displays active heating badge in main display area (lines 549-556) but NOT in the list/card preview at top
  implication: The "Active Devices List" section (lines 456-482) shows actively heating rooms correctly, but individual room cards in RoomSelector don't show heating status visually

- timestamp: 2026-02-04T10:22:00Z
  checked: RoomSelector usage in ThermostatCard (lines 485-495)
  found: RoomSelector receives rooms with isOffline, hasLowBattery, hasCriticalBattery flags, but NOT heating status
  implication: Need to pass heating status to RoomSelector and update its visual display

- timestamp: 2026-02-04T10:23:00Z
  checked: Active Devices List implementation (lines 456-482)
  found: Shows badge list with ember colors for actively heating rooms - this is CORRECT pattern to follow
  implication: Same visual pattern (ember border + icon) should be applied to individual room selection items

## Resolution

root_cause: RoomSelector component receives room status indicators (offline, battery) but NOT heating status. The heating indicator 🔥 needs to be added to the room label in RoomSelector, similar to how offline 📵 and battery 🔋🪫 indicators are currently shown.

fix:
1. Updated RoomSelector.js to accept `heating` prop in room objects (line 11 JSDoc)
2. Added heating indicator logic: if room.heating === true, append ' 🔥' to room label (line 42-43)
3. Updated ThermostatCard.js to pass `heating: room.heating` to RoomSelector (line 492)

verification:
✓ All 9 unit tests pass
✓ Heating indicator (🔥) correctly appears when room.heating === true
✓ Indicator priority maintained: offline > critical battery > low battery > heating
✓ No regression - existing offline/battery indicators still work
✓ Follows existing design patterns in codebase

The fix ensures that when a room is actively heating (room.heating === true), the RoomSelector dropdown will display "Room Name 🔥" making it immediately visible which rooms are actively heating without entering the room detail view.

files_changed:
- app/components/devices/thermostat/ThermostatCard.js (added heating prop to RoomSelector)
- app/components/ui/RoomSelector.js (added heating indicator logic)
- app/components/ui/__tests__/RoomSelector.test.js (created 9 unit tests)
