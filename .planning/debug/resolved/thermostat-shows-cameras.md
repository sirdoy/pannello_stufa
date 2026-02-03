---
status: resolved
trigger: "thermostat-shows-cameras: Nel termostato vengono visualizzate telecamere invece di mostrare solo termostati e termovalvole"
created: 2026-02-03T10:30:00Z
updated: 2026-02-03T10:55:00Z
---

## Current Focus

hypothesis: CONFIRMED - Rooms with camera modules (NACamera, NOC) are being displayed because the code only filters out relay modules (NAPlug) but not camera modules
test: Add filtering to exclude rooms that only contain camera modules or have no thermostat/valve modules
expecting: Camera rooms will be excluded from thermostat page, device modal, and homepage
next_action: Implement fix to filter rooms by checking if they contain at least one thermostat/valve module

## Symptoms

expected: La pagina /thermostat, il modal dispositivi e l'homepage dovrebbero mostrare SOLO dispositivi termostato e termovalvole Netatmo
actual: Vengono mostrate anche telecamere nella lista dei dispositivi
errors: Nessun errore, comportamento funzionale errato
reproduction: Andare su /thermostat oppure aprire il modal dispositivi o vedere homepage
started: Non specificato, probabilmente da sempre o dopo aggiunta telecamere

## Eliminated

## Evidence

- timestamp: 2026-02-03T10:35:00Z
  checked: /app/thermostat/page.js and /app/components/devices/thermostat/ThermostatCard.js
  found: Both components filter modules by type !== 'NAPlug' (line 272 in page.js, line 95 in ThermostatCard.js), but they process ALL rooms from topology.rooms without checking if the room actually contains thermostat/valve devices
  implication: The code excludes relay modules (NAPlug) but does not filter out rooms that only contain cameras or other non-thermostat devices

- timestamp: 2026-02-03T10:40:00Z
  checked: lib/netatmoApi.js and lib/netatmoCameraApi.js
  found: Netatmo device types are - Thermostats: NATherm1, OTH; Valves: NRV; Relays: NAPlug; Cameras: NACamera (Welcome), NOC (Presence)
  implication: Cameras (NACamera, NOC) are being included because parseRooms() returns ALL rooms without filtering, and the component only filters out NAPlug modules, not camera modules

## Resolution

root_cause: The parseRooms() function in lib/netatmoApi.js returns ALL rooms from Netatmo API without filtering by device type. The thermostat components (page.js and ThermostatCard.js) only filter out relay modules (NAPlug) but don't check if a room contains thermostat/valve devices (NATherm1, OTH, NRV) before displaying it. This causes rooms with only camera modules (NACamera, NOC) to appear in the thermostat interface.

fix: Added filtering in both components to:
1. Exclude camera modules (NACamera, NOC) when building roomModules array
2. Determine deviceType (thermostat/valve/unknown) based on module types
3. Filter final roomsWithStatus array to only include rooms with deviceType === 'thermostat' or 'valve'
This ensures only rooms with actual heating devices are shown in thermostat interfaces.

verification: ✅ VERIFIED
- All existing tests pass (4/4 passed in app/thermostat/page.test.js)
- Code review confirms camera modules (NACamera, NOC) are now filtered out in roomModules array
- Rooms without thermostat/valve devices are excluded via filter on deviceType
- Logic is consistent across both /thermostat page and homepage ThermostatCard
- No breaking changes to existing functionality

files_changed:
  - app/thermostat/page.js
  - app/components/devices/thermostat/ThermostatCard.js
