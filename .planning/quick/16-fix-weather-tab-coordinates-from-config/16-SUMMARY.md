---
phase: quick-16
plan: 01
subsystem: debug-weather
tags: [debug, weather, location, firebase-config]
dependency-graph:
  requires: [locationService, WeatherTab-debug-components]
  provides: [weather-debug-with-coordinates]
  affects: [debug-panel-weather-tab, api-debug-weather-tab]
tech-stack:
  added: []
  patterns: [location-subscription, query-params]
key-files:
  created: []
  modified:
    - app/debug/components/tabs/WeatherTab.tsx
    - app/debug/api/components/tabs/WeatherTab.tsx
decisions:
  - Subscribe to location before initial fetch (existing useEffect chain handles auto-fetch when location arrives)
  - Show waiting state when location is null instead of making request without coordinates
  - Guard all fetch operations with forecastUrl null check to prevent API calls without coordinates
metrics:
  duration: 120s
  completed: 2026-02-09
---

# Quick Task 16: Fix Weather Tab Coordinates from Config

**One-liner:** Fixed both debug weather tabs to subscribe to Firebase location config and pass lat/lon coordinates to forecast API, eliminating "Missing or invalid coordinates" errors.

## Summary

Updated both WeatherTab debug components (`app/debug/components/tabs/WeatherTab.tsx` and `app/debug/api/components/tabs/WeatherTab.tsx`) to:
1. Subscribe to Firebase location config using `subscribeToLocation` from locationService
2. Build dynamic forecast URL with lat/lon query parameters
3. Guard fetch operations when location is unavailable
4. Show waiting state when location data hasn't loaded yet
5. Clean up location subscription on component unmount

The fix follows the same pattern already established in `WeatherCardWrapper.tsx`, ensuring consistency across the codebase.

## Tasks Completed

### Task 1: Add location subscription to app/debug/components/tabs/WeatherTab.tsx
**Commit:** `cc03a83`
**Files modified:** `app/debug/components/tabs/WeatherTab.tsx`

Changes:
- Imported `subscribeToLocation` and `Location` type from locationService
- Added location state with `useState<Location | null>(null)`
- Added useEffect to subscribe to location changes with cleanup on unmount
- Created dynamic `forecastUrl` variable that includes lat/lon query params when location is available
- Guarded `fetchAllGetEndpoints` to return early when `forecastUrl` is null
- Updated EndpointCard's `url` prop to show dynamic URL with coordinates
- Updated EndpointCard's `onRefresh` callback to guard against null `forecastUrl`
- Added waiting state message when location is null

### Task 2: Apply identical fix to app/debug/api/components/tabs/WeatherTab.tsx
**Commit:** `00f3184`
**Files modified:** `app/debug/api/components/tabs/WeatherTab.tsx`

Applied the exact same changes as Task 1 to the API debug version of WeatherTab. The only pre-existing difference between the two files was the EndpointCard import path (relative `'../ApiTab'` vs absolute `'@/app/debug/components/ApiTab'`), which was preserved.

## Deviations from Plan

None - plan executed exactly as written.

## Technical Details

### Location Subscription Pattern
```typescript
// Subscribe to location updates
useEffect(() => {
  const unsubscribe = subscribeToLocation((loc) => setLocation(loc));
  return () => unsubscribe();
}, []);
```

### Dynamic URL Construction
```typescript
const forecastUrl = location
  ? `/api/weather/forecast?lat=${location.latitude}&lon=${location.longitude}`
  : null;
```

### Fetch Guard
```typescript
const fetchAllGetEndpoints = useCallback(() => {
  if (!forecastUrl) return;
  fetchGetEndpoint('forecast', forecastUrl);
}, [fetchGetEndpoint, forecastUrl]);
```

### Waiting State UI
```tsx
{!location && (
  <div className="bg-amber-900/20 [html:not(.dark)_&]:bg-amber-50 border border-amber-700/50 [html:not(.dark)_&]:border-amber-300 rounded-lg p-4">
    <Text variant="secondary" size="sm">
      Waiting for location data from Firebase config...
    </Text>
  </div>
)}
```

## Verification

- Both WeatherTab files now import and use `subscribeToLocation`
- Forecast API calls include `?lat=X&lon=Y` query parameters
- Location subscription cleans up properly on unmount
- Waiting state displayed when location is null
- Existing useEffect chain (initial fetch, refresh trigger, auto-refresh) continues to work because `fetchAllGetEndpoints` is recreated when `forecastUrl` changes, triggering the dependent useEffect

## Impact

**Before:** Both debug weather tabs called `/api/weather/forecast` without coordinates, resulting in "Missing or invalid coordinates" errors.

**After:** Both debug weather tabs subscribe to Firebase location config, pass coordinates to the API, and show a waiting state when location is unavailable. Weather forecast data now loads correctly in both debug panels.

## Self-Check: PASSED

Files verified:
```bash
FOUND: app/debug/components/tabs/WeatherTab.tsx
FOUND: app/debug/api/components/tabs/WeatherTab.tsx
```

Commits verified:
```bash
FOUND: cc03a83
FOUND: 00f3184
```

Pattern consistency verified against reference implementation:
```bash
FOUND: app/components/devices/weather/WeatherCardWrapper.tsx (pattern source)
```

All changes committed successfully. Both debug weather tabs now work identically and follow the established locationService subscription pattern.
