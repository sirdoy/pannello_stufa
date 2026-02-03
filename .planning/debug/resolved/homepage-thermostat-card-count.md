---
status: resolved
trigger: "Nella card termostato in homepage il conteggio di stanze/moduli è ancora sbagliato"
created: 2026-02-03T10:15:00Z
updated: 2026-02-03T10:20:00Z
---

## Current Focus

hypothesis: ThermostatCard infoBoxes use unfiltered rooms/modules arrays instead of filtered roomsWithStatus
test: Check lines 427-428 where infoBoxes are built
expecting: rooms.length and topology.modules.length are unfiltered
next_action: Fix to use roomsWithStatus.length and filtered module count

## Symptoms

expected: Card shows count of only thermostat/valve rooms (matching /thermostat page)
actual: Card shows count of ALL rooms including cameras/relays
errors: None
reproduction: View homepage thermostat card info boxes
started: After previous fix to /thermostat page

## Eliminated

## Evidence

- timestamp: 2026-02-03T10:15:00Z
  checked: ThermostatCard.js lines 425-430
  found: infoBoxes use `rooms.length` (line 427) and `topology.modules?.length` (line 428)
  implication: These are unfiltered arrays from topology, not the filtered roomsWithStatus

- timestamp: 2026-02-03T10:16:00Z
  checked: Lines 75-129 (roomsWithStatus creation)
  found: roomsWithStatus is properly filtered to only thermostat/valve rooms
  implication: The correct filtered count exists but isn't used in infoBoxes

## Resolution

root_cause: ThermostatCard infoBoxes use unfiltered topology data (rooms.length, topology.modules.length) instead of filtered roomsWithStatus.length and filtered module count
fix: Updated infoBoxes to use roomsWithStatus.length and modulesWithStatus.filter() to exclude cameras/relays (NAPlug, NACamera, NOC)
verification: Grep confirmed fix applied - lines 425-430 now use filtered counts matching /thermostat page logic
files_changed:
  - app/components/devices/thermostat/ThermostatCard.js: Updated infoBoxes to use filtered counts
