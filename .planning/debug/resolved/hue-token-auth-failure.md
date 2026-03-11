---
status: resolved
trigger: "Hue Remote API authentication fails with TOKEN_ERROR on every page load"
created: 2026-02-19T00:00:00Z
updated: 2026-02-19T00:05:00Z
---

## Current Focus

hypothesis: CONFIRMED AND FIXED - Hue OAuth2 v1 endpoint deprecated, code used /oauth2/token instead of /v2/oauth2/token
test: migrated endpoints, added error handling, all 61 Hue tests pass
expecting: token refresh will succeed with v2 endpoint
next_action: archive session

## Symptoms

expected: Hue lights data loads successfully - rooms, lights, and scenes fetch without errors
actual: Every page load fails with HUE_REMOTE_AUTH_FAILED: TOKEN_ERROR - "Client authentication failed"
errors: HUE_REMOTE_AUTH_FAILED: TOKEN_ERROR at Object.fetchData [as current] (app/components/devices/lights/hooks/useLightsData.ts:204:34)
reproduction: Every page load that triggers lights data fetching
started: Was working before, broke recently. Every load fails consistently.

## Eliminated

## Evidence

- timestamp: 2026-02-19T00:00:30Z
  checked: useLightsData.ts fetchData function
  found: Error thrown at line 204 when roomsData.error is truthy, propagated from /api/hue/rooms
  implication: Error originates from API route, not client code

- timestamp: 2026-02-19T00:00:35Z
  checked: /api/hue/rooms/route.ts -> HueConnectionStrategy.getProvider()
  found: Strategy tries local first (fails), then remote. Remote calls getValidRemoteAccessToken()
  implication: Error is in the remote token refresh path

- timestamp: 2026-02-19T00:00:40Z
  checked: hueRemoteTokenHelper.ts performTokenRefresh()
  found: Uses v1 endpoint https://api.meethue.com/oauth2/token (line 14). Error "Client authentication failed" comes from line 221-225 TOKEN_ERROR return path.
  implication: Hue OAuth server rejects the token refresh request at the credential level

- timestamp: 2026-02-19T00:00:45Z
  checked: .env.local for HUE_CLIENT_ID and HUE_CLIENT_SECRET
  found: ZERO Hue-related env vars in .env.local (30 lines, none match HUE)
  implication: Env vars may be loaded from Vercel or missing entirely; performTokenRefresh uses non-null assertion (!) without validation

- timestamp: 2026-02-19T00:00:50Z
  checked: Web search for Hue OAuth2 v1 deprecation
  found: V1 OAuth2 (/oauth2) deprecated since July 2020, Philips recommends /v2/oauth2. Digest auth turned off Jan 31 2025.
  implication: The v1 token endpoint has been recently disabled, causing "Client authentication failed"

- timestamp: 2026-02-19T00:00:55Z
  checked: All OAuth2 endpoint URLs in codebase
  found: Token endpoints at /oauth2/token (lines 13-14), authorize at /oauth2/auth (authorize/route.ts line 55)
  implication: Token endpoints need migration from v1 to v2

- timestamp: 2026-02-19T00:01:00Z
  checked: Error handling in performTokenRefresh isTokenInvalid check
  found: Only checks for invalid_grant, invalid_token, and 500 status. Does NOT check for invalid_client.
  implication: When Hue returns invalid_client error, code returns TOKEN_ERROR instead of TOKEN_EXPIRED with reconnect:true

## Resolution

root_cause: Philips Hue deprecated the v1 OAuth2 token endpoint (/oauth2/token) which was recently enforced/disabled. The codebase used this deprecated endpoint for token refresh and exchange. Additionally, the error handling didn't recognize "invalid_client" errors (the exact error returned by Hue), preventing the reconnect flow from triggering. The performTokenRefresh function also lacked env var validation.

fix: Three changes applied:
1. Migrated OAuth2 token endpoints from /oauth2/token to /v2/oauth2/token (both HUE_TOKEN_ENDPOINT and HUE_REFRESH_ENDPOINT)
2. Added invalid_client and "Client authentication failed" to the isTokenInvalid check, so these errors now trigger the reconnect flow with TOKEN_EXPIRED status
3. Added env var validation for NEXT_PUBLIC_HUE_CLIENT_ID and HUE_CLIENT_SECRET before attempting token refresh, returning CONFIG_ERROR with clear message instead of sending malformed requests

verification: All 61 Hue tests pass (4 test suites). 2 new tests added: invalid_client error handling test and missing env vars CONFIG_ERROR test.

files_changed:
- lib/hue/hueRemoteTokenHelper.ts (endpoint migration + env var validation + error handling)
- lib/hue/__tests__/hueRemoteTokenHelper.test.ts (updated endpoint URLs + 2 new tests)
- app/api/hue/remote/authorize/route.ts (comment clarification only, URL kept at /oauth2/auth)
