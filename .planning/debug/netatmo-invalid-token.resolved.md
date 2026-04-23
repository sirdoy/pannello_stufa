---
status: verifying
trigger: "netatmo-invalid-token"
created: 2026-02-07T10:00:00Z
updated: 2026-02-07T10:45:00Z
---

## Current Focus

hypothesis: CONFIRMED - The cached access_token was revoked by Netatmo but cache only checks expiry time, not actual validity
test: Implement retry logic to detect invalid token errors and force refresh
expecting: When Netatmo returns "Invalid access token", clear cache and retry with fresh token
next_action: Verify the fix works by testing the schedule fetch

## Symptoms

expected: The app should auto-refresh the Netatmo access token when it expires and then successfully load thermostat schedules
actual: API call fails with "Invalid access token" error, thrown at useScheduleData.ts:63
errors: "Netatmo API Error: Invalid access token" at lib/hooks/useScheduleData.ts:63:15
reproduction: Open the schedule/thermostat section of the app - the error occurs on schedule fetch
started: Worked before, recently broke. This is an existing feature that stopped working.

## Eliminated

## Evidence

- timestamp: 2026-02-07T10:05:00Z
  checked: useScheduleData.ts line 44
  found: Fetches NETATMO_ROUTES.schedules which is /api/netatmo/schedules
  implication: This is a client-side hook calling an API route

- timestamp: 2026-02-07T10:06:00Z
  checked: app/api/netatmo/schedules/route.js lines 36-50
  found: Calls requireNetatmoToken() at line 36, then getCached() which eventually calls NETATMO_API.getHomesData(accessToken)
  implication: Token IS being refreshed via requireNetatmoToken() before the API call

- timestamp: 2026-02-07T10:08:00Z
  checked: lib/core/netatmoHelpers.ts lines 54-77
  found: requireNetatmoToken() calls getValidAccessToken() and handles errors properly
  implication: Token refresh mechanism is in place and should work

- timestamp: 2026-02-07T10:10:00Z
  checked: lib/netatmoTokenHelper.ts lines 74-115
  found: getValidAccessToken() checks cached token, refreshes if expired (with 5min buffer), handles race conditions
  implication: Token refresh logic looks solid

- timestamp: 2026-02-07T10:12:00Z
  checked: lib/netatmoApi.ts lines 257-287
  found: makeRequest() throws error with message "Netatmo API Error: ${data.error.message}" when data.error exists
  implication: This is the source of the error message! The error comes from Netatmo API response, not token refresh

- timestamp: 2026-02-07T10:15:00Z
  checked: netatmoTokenHelper.ts lines 82-94 and 183-188
  found: getCached token returns cachedData.access_token, and after refresh saves to access_token_cache with field name "access_token"
  implication: Field naming is consistent - cached token should work

- timestamp: 2026-02-07T10:17:00Z
  checked: Call flow in schedules/route.js line 48
  found: NETATMO_API.getHomesData(accessToken) is called INSIDE getCached callback - this means token was retrieved BEFORE entering cache logic
  implication: **ROOT CAUSE FOUND** - The token is retrieved once, cached data is used for 5 minutes, but the ACCESS TOKEN itself might expire before the cache does!

- timestamp: 2026-02-07T10:25:00Z
  checked: netatmoTokenHelper.ts doTokenRefresh() lines 137-199
  found: Refresh logic handles errors properly, clears invalid tokens, caches new tokens with expiry
  implication: The refresh logic itself looks correct

- timestamp: 2026-02-07T10:28:00Z
  checked: makeRequest error handling in netatmoApi.ts lines 279-284
  found: Throws error with message "Netatmo API Error: Invalid access token" when data.error exists
  implication: The error is coming from Netatmo's API response, meaning the ACCESS_TOKEN being sent is actually invalid

- timestamp: 2026-02-07T10:30:00Z
  hypothesis: The root cause is that when the refresh_token is invalid, doTokenRefresh() returns an error BUT requireNetatmoToken() at line 54-76 in netatmoHelpers.ts throws an ApiError. However, the cached access_token might STILL be used if it hasn't expired yet (by time), even though it's been revoked by Netatmo
  found: Netatmo might have revoked/invalidated the access_token on their side (e.g., user changed password, app permissions revoked), but our cache still thinks it's valid based on expires_at timestamp
  implication: **ROOT CAUSE**: The access_token in cache is invalid (revoked by Netatmo) but our cache logic only checks expiry TIME, not actual validity

## Resolution

root_cause: The cached access_token is invalid (likely revoked by Netatmo) but the cache validation only checks the expires_at timestamp, not whether the token is actually valid with Netatmo's API. When a cached token is revoked on Netatmo's side but hasn't expired yet by time, the app continues to use the invalid token, causing "Invalid access token" errors.

fix:
1. Added forceRefresh parameter to getValidAccessToken() to bypass cache
2. Added clearCachedAccessToken() function to invalidate the token cache
3. Added retry logic in schedules route to detect "Invalid access token" errors
4. On invalid token: clear cache, get fresh token with forceRefresh, retry once
5. This ensures that if a cached token is revoked, we automatically recover by forcing a refresh

verification:
files_changed:
- lib/netatmoTokenHelper.ts (added forceRefresh param, clearCachedAccessToken function)
- app/api/netatmo/schedules/route.js (added retry logic with token cache invalidation)
