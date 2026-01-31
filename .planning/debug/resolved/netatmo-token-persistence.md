---
status: resolved
trigger: "netatmo-token-persistence"
created: 2026-01-31T10:00:00Z
updated: 2026-01-31T10:30:00Z
---

## Current Focus

hypothesis: CONFIRMED - netatmoTokenHelper.js uses client SDK which is blocked by Firebase Security Rules
test: Convert to Admin SDK and run tests
expecting: All tests pass, fix ready for verification
next_action: Instruct user to test OAuth flow and page reload

## Symptoms

expected: Token should persist across page reloads, user stays connected
actual: "Invalid access token" error on every page reload, must reconnect each time
errors: ❌ Netatmo: API error - "Netatmo API Error: Invalid access token" at checkConnection (app/thermostat/page.js:104:17)
reproduction: Go to /thermostat, see error. Reconnect, works. Reload page, error again.
started: Happening now in local development

## Eliminated

## Evidence

- timestamp: 2026-01-31T10:05:00Z
  checked: OAuth callback flow (app/api/netatmo/callback/route.js)
  found: Token is saved via saveRefreshToken() which uses getEnvironmentPath('netatmo/refresh_token')
  implication: Token save uses environment-aware paths (dev/ prefix for localhost)

- timestamp: 2026-01-31T10:06:00Z
  checked: Token helper (lib/netatmoTokenHelper.js)
  found: getValidAccessToken() reads from getEnvironmentPath('netatmo/refresh_token') and caches to getEnvironmentPath('netatmo/access_token_cache')
  implication: Token retrieval also uses environment-aware paths - should work correctly

- timestamp: 2026-01-31T10:07:00Z
  checked: Environment helper (lib/environmentHelper.js)
  found: isDevelopment() checks window.location.hostname on client-side, process.env.NODE_ENV on server-side
  implication: POTENTIAL ISSUE - client vs server environment detection mismatch could cause path inconsistency

- timestamp: 2026-01-31T10:10:00Z
  checked: netatmoApi.js line 68
  found: Error "Invalid access token" comes from Netatmo API response (data.error), not from our code
  implication: The access token being sent to Netatmo is genuinely invalid - either expired, wrong, or not retrieved

- timestamp: 2026-01-31T10:15:00Z
  checked: OAuth callback route.js
  found: OAuth response includes BOTH access_token and refresh_token, but callback only saves refresh_token (line 54)
  implication: Initial access_token is discarded. Next API call must refresh to get new token. This is intentional design.

- timestamp: 2026-01-31T10:16:00Z
  checked: User symptom timeline
  found: User says "Reconnecting fixes it temporarily, but reloading the page causes the error again"
  implication: After OAuth, FIRST load might work, but SUBSEQUENT reloads fail - suggests token refresh is failing

- timestamp: 2026-01-31T10:20:00Z
  checked: Firebase Security Rules (database.rules.json)
  found: netatmo/.read = false, netatmo/.write = false (lines 75-77)
  implication: Client SDK CANNOT read/write to netatmo/* paths - only Admin SDK can!

- timestamp: 2026-01-31T10:21:00Z
  checked: netatmoTokenHelper.js SDK usage
  found: Uses client SDK (import { db } from '@/lib/firebase') with get() and set() from 'firebase/database'
  implication: All token operations (save, read, cache) are being DENIED by Firebase Security Rules

## Resolution

root_cause: netatmoTokenHelper.js uses client SDK which is denied by Firebase Security Rules (netatmo/.read=false, .write=false). Server-side API routes call this helper, but client SDK enforces security rules even server-side, causing all token reads/writes to fail silently. User thinks tokens are being saved, but they're actually being rejected by Firebase.

fix: Convert netatmoTokenHelper.js to use Admin SDK (adminDbGet/adminDbSet) instead of client SDK (db/get/set). Updated all token operations: getValidAccessToken(), doTokenRefresh(), isNetatmoConnected(), saveRefreshToken(), clearNetatmoData().

verification:
- Unit tests updated and passing (16/16 tests pass)
- Ready for user verification: reconnect Netatmo, reload page, verify no error

files_changed:
- lib/netatmoTokenHelper.js (converted from client SDK to Admin SDK)
- __tests__/lib/netatmoTokenHelper.test.js (updated mocks for Admin SDK)
