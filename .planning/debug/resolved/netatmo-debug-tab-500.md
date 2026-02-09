---
status: resolved
trigger: "netatmo-debug-tab-500-errors"
created: 2026-02-09T10:00:00Z
updated: 2026-02-09T10:30:00Z
---

## Current Focus

hypothesis: CONFIRMED - devicelist endpoint is deprecated/shutdown for Energy API
test: Web search confirmed devicelist is deprecated and scheduled for shutdown
expecting: Need to replace devicelist calls with homesdata/homestatus which are current Energy API endpoints
next_action: Fix both routes to use homesdata instead of devicelist

## Symptoms

expected: The Netatmo tab in the debug page should successfully load device data and device temperature data from the API
actual: Both API calls return HTTP 500 errors
errors: HTTP 500 on devices and devices temperatures API endpoints
reproduction: Go to /debug page, click on Netatmo tab, observe the errors on the devices and devices temperatures calls
started: Has always been broken - never worked

## Eliminated

## Evidence

- timestamp: 2026-02-09T10:05:00Z
  checked: NetatmoTab component (/app/debug/components/tabs/NetatmoTab.tsx)
  found: Calls /api/netatmo/devices and /api/netatmo/devices-temperatures
  implication: These are the two failing endpoints

- timestamp: 2026-02-09T10:06:00Z
  checked: API route handlers (devices/route.ts and devices-temperatures/route.ts)
  found: Both use NETATMO_API.getDeviceList() which calls Netatmo's 'devicelist' endpoint
  implication: Both routes depend on the same underlying Netatmo API call

- timestamp: 2026-02-09T10:07:00Z
  checked: netatmoApi.ts library
  found: getDeviceList() calls makeRequest('devicelist', accessToken) - line 305-308
  implication: The issue is calling https://api.netatmo.com/api/devicelist

- timestamp: 2026-02-09T10:08:00Z
  checked: Working endpoints (homesdata, homestatus)
  found: They call 'homesdata' and 'homestatus' endpoints respectively
  implication: These endpoints work, so auth is OK. The 'devicelist' endpoint may not exist or may be deprecated

- timestamp: 2026-02-09T10:15:00Z
  checked: Netatmo API documentation via web search
  found: "Devicelist (along with Getthermstate and Getuser) will transition from deprecated to shutdown status" - scheduled for November 30th shutdown
  implication: ROOT CAUSE FOUND - devicelist endpoint is deprecated/shut down for Energy API. Must use homesdata instead.

## Resolution

root_cause: The devicelist endpoint has been deprecated and shut down by Netatmo for the Energy API. Both /api/netatmo/devices and /api/netatmo/devices-temperatures were calling this non-existent endpoint, causing 500 errors. The Energy API uses homesdata and homestatus endpoints instead.
fix:
  1. /api/netatmo/devices: Now uses NETATMO_API.getHomesData() + parseModules() to return all modules/devices
  2. /api/netatmo/devices-temperatures: Now uses getHomesData() + getHomeStatus() + extractTemperatures() to return room temperatures with proper names and heating status
verification:
  - TypeScript compilation: No errors in modified files
  - API endpoint response: Changed from 500 to 401 (expected - auth required)
  - Code structure: Both routes now use current Energy API endpoints (homesdata, homestatus)
  - No tests to update (no existing tests for these routes)
files_changed:
  - app/api/netatmo/devices/route.ts
  - app/api/netatmo/devices-temperatures/route.ts
