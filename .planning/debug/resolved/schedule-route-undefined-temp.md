---
status: resolved
trigger: "La pagina schedule è alla route sbagliata (/schedule invece di /thermostat/schedule) e ha un errore di undefined nel campo temp delle zone"
created: 2026-01-31T10:30:00Z
updated: 2026-01-31T10:45:00Z
---

## Current Focus

hypothesis: CONFIRMED - Two distinct issues: (1) schedule page at /schedule instead of /thermostat/schedule (2) parseSchedules includes undefined temp values causing Firebase error
test: Fix both issues - move page and filter undefined temps
expecting: Page at correct route, no Firebase errors
next_action: Apply fixes to app/schedule and lib/netatmoApi.js

## Symptoms

expected: La pagina schedule dovrebbe essere accessibile a /thermostat/schedule, e dovrebbe caricare correttamente i programmi senza errori
actual: La pagina è a /schedule (route sbagliata) e lancia errore "set failed: value argument contains undefined in property 'dev.netatmo.cache.schedules.data.0.zones.0.temp'"
errors:
```
set failed: value argument contains undefined in property 'dev.netatmo.cache.schedules.data.0.zones.0.temp'
at useScheduleData.useCallback[fetchSchedules] (lib/hooks/useScheduleData.js:63:15)
```
reproduction: Accedere a http://localhost:3000/schedule
started: Issue attuale

## Eliminated

## Evidence

- timestamp: 2026-01-31T10:35:00Z
  checked: app directory structure
  found: app/schedule/page.js exists (wrong location), app/thermostat/ exists (correct parent)
  implication: Page needs to be moved from /schedule to /thermostat/schedule

- timestamp: 2026-01-31T10:36:00Z
  checked: Links pointing to /schedule
  found: app/thermostat/page.js:418 has href="/schedule"
  implication: Need to update link after moving page

- timestamp: 2026-01-31T10:37:00Z
  checked: lib/netatmoApi.js parseSchedules function (line 435-456)
  found: Line 454 assigns temp: zone.temp without checking if defined
  implication: When zone.temp is undefined, it gets included in parsed data causing Firebase error

- timestamp: 2026-01-31T10:38:00Z
  checked: Firebase error source
  found: Error occurs in netatmoCacheService when caching API response
  implication: parseSchedules must filter undefined values before returning data

## Resolution

root_cause: Two independent issues - (1) Schedule page incorrectly located at app/schedule instead of app/thermostat/schedule (2) parseSchedules function in netatmoApi.js included undefined temp values in zone data, causing Firebase write errors

fix:
1. Moved app/schedule directory to app/thermostat/schedule
2. Updated link in app/thermostat/page.js from href="/schedule" to href="/thermostat/schedule"
3. Modified lib/netatmoApi.js parseSchedules to conditionally include temp only when defined

verification:
- Tests passing: parseSchedules correctly filters undefined temp values (5 new test cases)
- Route verified: app/thermostat/schedule/page.js exists, old app/schedule removed
- Link verified: app/thermostat/page.js now points to /thermostat/schedule
- Ready to test in browser at http://localhost:3000/thermostat/schedule
files_changed:
  - app/schedule -> app/thermostat/schedule (moved)
  - app/thermostat/page.js (link updated)
  - lib/netatmoApi.js (parseSchedules function)
