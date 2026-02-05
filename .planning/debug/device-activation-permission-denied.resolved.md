---
status: verifying
trigger: "Firebase PERMISSION_DENIED error when activating a new device in settings"
created: 2026-02-05T10:30:00Z
updated: 2026-02-05T10:40:00Z
---

## Current Focus

hypothesis: CONFIRMED - devicePreferencesService uses client SDK for writes, which is blocked by Firebase security rules
test: Verify fix works by running the app
expecting: Device activation saves without PERMISSION_DENIED error
next_action: User needs to test the fix by activating a device in settings

## Symptoms

expected: La configurazione del dispositivo dovrebbe essere salvata in Firebase
actual: PERMISSION_DENIED error thrown at handleSave (app/settings/page.js:602)
errors: PERMISSION_DENIED: Permission denied at handleSave (app/settings/page.js:602:15)
reproduction: User tries to activate a new device from settings page
started: Regression - worked before, now gives error

## Eliminated

(none - hypothesis was confirmed)

## Evidence

- timestamp: 2026-02-05T10:31:00Z
  checked: app/settings/page.js:588-619 (handleSave in DevicesContent)
  found: handleSave calls POST /api/devices/preferences with { preferences } body
  implication: API route is being called correctly

- timestamp: 2026-02-05T10:32:00Z
  checked: app/api/devices/preferences/route.js:52-87 (POST handler)
  found: POST handler calls updateDevicePreferences(userId, preferences) from devicePreferencesService
  implication: API uses devicePreferencesService for the write operation

- timestamp: 2026-02-05T10:33:00Z
  checked: lib/devicePreferencesService.js:54-67 (updateDevicePreferences function)
  found: Uses `update(prefsRef, preferences)` from firebase/database (CLIENT SDK)
  implication: ROOT CAUSE - Client SDK is subject to Firebase security rules

- timestamp: 2026-02-05T10:34:00Z
  checked: database.rules.json:131-136 (devicePreferences rules)
  found: `.write: false` for devicePreferences/$userId - blocks ALL client writes
  implication: Confirms hypothesis - client SDK write is blocked by security rules

- timestamp: 2026-02-05T10:35:00Z
  checked: lib/firebaseAdmin.js (Admin SDK helpers)
  found: adminDbUpdate function exists and bypasses security rules
  implication: Solution is to use adminDbUpdate for write operations from API routes

- timestamp: 2026-02-05T10:38:00Z
  checked: ESLint validation
  found: No lint errors in modified files
  implication: Code is syntactically correct

## Resolution

root_cause: devicePreferencesService.js uses client Firebase SDK (`lib/firebase`) for updateDevicePreferences(), but Firebase security rules have `.write: false` on devicePreferences path. The client SDK cannot bypass security rules, even when called from server-side API routes.

fix: Modified devicePreferencesService.js to:
1. Import Admin SDK helpers (adminDbUpdate, adminDbSet, adminDbGet) from lib/firebaseAdmin
2. updateDevicePreferences() now uses adminDbUpdate instead of client SDK update()
3. Added getDevicePreferencesAdmin() for server-side reads (used by API route)
4. toggleDevicePreference() now uses getDevicePreferencesAdmin() for consistency
5. Updated API route to use getDevicePreferencesAdmin() instead of getDevicePreferences()

verification: Lint passes. User needs to test the actual flow.

files_changed:
  - lib/devicePreferencesService.js (use Admin SDK for write operations)
  - app/api/devices/preferences/route.js (use getDevicePreferencesAdmin)
