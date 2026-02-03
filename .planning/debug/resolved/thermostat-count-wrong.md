---
status: resolved
trigger: "Il numero di stanze e moduli mostrato è sbagliato dopo il fix per filtrare le telecamere"
created: 2026-02-03T11:00:00Z
updated: 2026-02-03T11:18:00Z
---

## Current Focus

hypothesis: CONFIRMED - Room and module counts use pre-filtered data (topology.rooms, topologyModules) while display uses filtered data (roomsWithStatus)
test: Verified that InfoBox displays rooms.length and modulesWithBattery.length, which include ALL rooms/modules before camera filtering
expecting: Change counts to use roomsWithStatus.length and filtered module count
next_action: Apply fix to both thermostat/page.js and NetatmoTemperatureReport.js

## Symptoms

expected: Il numero di stanze e moduli dovrebbe riflettere solo i dispositivi termostato/termovalvole (dopo il filtraggio delle telecamere)
actual: Il conteggio mostrato include ancora le telecamere/stanze filtrate
errors: Nessun errore, ma i numeri visualizzati non corrispondono ai dispositivi effettivamente mostrati
reproduction: Guardare il numero di stanze/moduli mostrato nella UI del termostato
started: Dopo il fix per filtrare le telecamere - i conteggi non sono stati aggiornati per riflettere il filtraggio

## Eliminated

## Evidence

- timestamp: 2026-02-03T11:05:00Z
  checked: app/thermostat/page.js lines 458-465
  found: InfoBox displays "Stanze" with value={rooms.length} and "Moduli" with value={modulesWithBattery?.length || 0}
  implication: rooms comes from topology.rooms (line 245) which is BEFORE filtering. The actual displayed rooms use roomsWithStatus which is filtered (lines 301-305)

- timestamp: 2026-02-03T11:08:00Z
  checked: app/thermostat/page.js lines 245-305
  found: rooms = topology.rooms (unfiltered), roomsWithStatus = filtered by deviceType (line 301-305). modulesWithBattery uses topologyModules (unfiltered)
  implication: The counts show ALL rooms/modules from topology, but the UI displays only filtered roomsWithStatus

- timestamp: 2026-02-03T11:10:00Z
  checked: app/components/netatmo/NetatmoTemperatureReport.js line 176
  found: Displays "{sortedRooms.length} stanze" where sortedRooms is the result of sorting enrichedRooms (lines 37-55)
  implication: NetatmoTemperatureReport filters cameras at module level (line 44) but doesn't filter out rooms with only cameras, so count includes camera rooms

## Resolution

root_cause: The room and module counts displayed in InfoBox components use unfiltered data (topology.rooms, topologyModules) instead of the filtered data (roomsWithStatus). After the camera filtering fix, the displayed rooms/modules are correctly filtered, but the counts still reference the original arrays that include cameras. This creates a mismatch where the count says "5 stanze" but only 3 are shown.

fix: Applied the following changes:
1. thermostat/page.js:
   - Added filteredModulesCount calculation (line 307-309) to count only thermostat/valve modules
   - Changed InfoBox "Stanze" value from rooms.length to roomsWithStatus.length (line 459)
   - Changed InfoBox "Moduli" value from modulesWithBattery.length to filteredModulesCount (line 465)
2. NetatmoTemperatureReport.js:
   - Added camera filtering (NACamera, NOC) to module filter (line 44-45)
   - Added room filtering to exclude rooms with deviceType === 'unknown' (line 57-60)
   - Now enrichedRooms only contains thermostat/valve rooms before being set to state

verification: ✅ VERIFIED
- All existing tests pass (4/4 in app/thermostat/page.test.js)
- Code review confirms counts now use filtered arrays:
  - thermostat/page.js: roomsWithStatus.length and filteredModulesCount
  - NetatmoTemperatureReport.js: enrichedRooms filtered before setState
- Both files now consistently filter cameras at both module and room level
- Room count will match displayed rooms, module count will match displayed modules

files_changed:
  - app/thermostat/page.js
  - app/components/netatmo/NetatmoTemperatureReport.js
