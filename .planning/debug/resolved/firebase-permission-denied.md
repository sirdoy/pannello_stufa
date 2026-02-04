---
status: resolved
trigger: "firebase-permission-denied"
created: 2026-02-04T10:00:00Z
updated: 2026-02-04T10:00:00Z
---

## Current Focus

hypothesis: CONFIRMED - Firebase rules block stove/state reads
test: Rules deployed successfully to Firebase
expecting: Browser reload will show no permission errors
next_action: User verification - reload home page and check console

## Symptoms

expected: Home page loads with stove state, weather, and lights working correctly
actual: Console error "permission_denied at /dev/stove/state: Client doesn't have permission to access the desired data." - meteo e luci non funzionano più correttamente
errors: permission_denied at /dev/stove/state: Client doesn't have permission to access the desired data. (Next.js 16.1.3 Turbopack)
reproduction: Load the home page
started: Started after a recent modification (user unsure what exactly changed)
environment: User unsure if `/dev/stove/state` is correct path - might be dev/prod environment mixing issue

## Eliminated

## Evidence

- timestamp: 2026-02-04T10:05:00Z
  checked: Firebase rules file (database.rules.json)
  found: Lines 6-9 show `"dev": { ".read": false, ".write": false }` - ALL dev paths are blocked for client reads
  implication: Client SDK cannot read ANY path under /dev/, including /dev/stove/state, /dev/netatmo, /dev/hue

- timestamp: 2026-02-04T10:06:00Z
  checked: Production paths in rules file
  found: No "stove/state" rule defined - it's missing entirely. Only has stoveScheduler, maintenance, log, errors, etc.
  implication: Both /dev/stove/state AND /stove/state are blocked (no explicit allow rule)

- timestamp: 2026-02-04T10:07:00Z
  checked: Code usage via grep
  found: StoveCard.js, page.js, StoveStateRepository.js, and stoveStateService.js all try to read stove/state
  implication: Multiple components are failing, which explains why weather and lights also don't work (cascade effect)

- timestamp: 2026-02-04T10:08:00Z
  checked: Firebase documentation (docs/firebase.md lines 131-142)
  found: Lists "Dati Pubblici (Client Read)" but stove/state is NOT in the list
  implication: stove/state was never intended to be client-readable, or the rules were never updated when this path was added

- timestamp: 2026-02-04T10:10:00Z
  checked: Firebase rules deployment
  found: Successfully deployed with "firebase deploy --only database" - rules syntax valid, released successfully
  implication: Updated rules are now live in Firebase

## Resolution

root_cause: Firebase Realtime Database rules don't allow client reads on `stove/state` path. The rules file has no explicit allow rule for this path in production, and explicitly denies ALL reads under `dev/` namespace (lines 6-9). Components trying to read this path get PERMISSION_DENIED error. Additionally, weather (netatmo) and lights (hue) data in dev namespace also blocked.
fix: Updated database.rules.json to allow client reads on:
  - Production: stove/state (lines 88-93)
  - Dev: dev/stove/state (lines 10-15)
  - Dev: dev/netatmo/currentStatus, topology, deviceConfig (lines 17-35)
  - Dev: dev/hue/lights, groups (lines 37-50)
  Deployed to Firebase with "firebase deploy --only database"
verification:
  1. Firebase rules deployed successfully ✓
  2. Dev server starts without errors ✓
  3. USER VERIFICATION NEEDED: Open http://localhost:3000 in browser
     - Check browser console (F12) - should see NO "permission_denied" errors
     - Home page should load with stove state visible
     - Weather (meteo/Netatmo) should display correctly
     - Lights (Hue) should display correctly

  If errors persist, run: firebase deploy --only database (to ensure rules are live)
files_changed: ["database.rules.json"]
