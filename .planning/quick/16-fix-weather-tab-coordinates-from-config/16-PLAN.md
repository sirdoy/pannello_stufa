---
phase: quick-16
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - app/debug/components/tabs/WeatherTab.tsx
  - app/debug/api/components/tabs/WeatherTab.tsx
autonomous: true
must_haves:
  truths:
    - "Weather debug tab fetches forecast with lat/lon from Firebase config"
    - "Tab shows loading state while waiting for location data"
    - "Refresh and auto-refresh pass coordinates correctly"
  artifacts:
    - path: "app/debug/components/tabs/WeatherTab.tsx"
      provides: "Weather debug tab with location subscription"
      contains: "subscribeToLocation"
    - path: "app/debug/api/components/tabs/WeatherTab.tsx"
      provides: "API debug weather tab with location subscription"
      contains: "subscribeToLocation"
  key_links:
    - from: "app/debug/components/tabs/WeatherTab.tsx"
      to: "lib/services/locationService.ts"
      via: "subscribeToLocation import"
      pattern: "subscribeToLocation"
    - from: "app/debug/components/tabs/WeatherTab.tsx"
      to: "/api/weather/forecast"
      via: "fetch with lat/lon query params"
      pattern: "lat=.*lon="
---

<objective>
Fix both WeatherTab.tsx debug components to subscribe to Firebase location config and pass lat/lon coordinates as query parameters to `/api/weather/forecast`.

Purpose: The weather debug tabs currently call `/api/weather/forecast` without coordinates, causing "Missing or invalid coordinates" errors. The API route requires `?lat=X&lon=Y` query params.

Output: Both WeatherTab files updated to subscribe to location, pass coords, and handle the "waiting for location" state.
</objective>

<execution_context>
@/Users/federicomanfredi/.claude/get-shit-done/workflows/execute-plan.md
@/Users/federicomanfredi/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@app/debug/components/tabs/WeatherTab.tsx
@app/debug/api/components/tabs/WeatherTab.tsx
@lib/services/locationService.ts
@app/components/devices/weather/WeatherCardWrapper.tsx (reference pattern)
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add location subscription to app/debug/components/tabs/WeatherTab.tsx</name>
  <files>app/debug/components/tabs/WeatherTab.tsx</files>
  <action>
1. Import `subscribeToLocation` and `Location` type from `@/lib/services/locationService`.

2. Add location state:
   ```typescript
   const [location, setLocation] = useState<Location | null>(null);
   ```

3. Add useEffect for location subscription (before the existing useEffects):
   ```typescript
   useEffect(() => {
     const unsubscribe = subscribeToLocation((loc) => setLocation(loc));
     return () => unsubscribe();
   }, []);
   ```

4. Build the forecast URL dynamically. Update `fetchAllGetEndpoints` to accept location and only fetch when location is available:
   ```typescript
   const forecastUrl = location
     ? `/api/weather/forecast?lat=${location.latitude}&lon=${location.longitude}`
     : null;

   const fetchAllGetEndpoints = useCallback(() => {
     if (!forecastUrl) return;
     fetchGetEndpoint('forecast', forecastUrl);
   }, [fetchGetEndpoint, forecastUrl]);
   ```

5. Update the `onRefresh` callback in the EndpointCard to also use the dynamic URL:
   ```typescript
   onRefresh={() => forecastUrl && fetchGetEndpoint('forecast', forecastUrl)}
   ```

6. Update the `url` prop on EndpointCard to show the actual URL being called (with coords or the base path):
   ```typescript
   url={forecastUrl || '/api/weather/forecast'}
   ```

7. When `location` is null, show a waiting state at the top of the return JSX (before the cache status section):
   ```tsx
   {!location && (
     <div className="bg-amber-900/20 [html:not(.dark)_&]:bg-amber-50 border border-amber-700/50 [html:not(.dark)_&]:border-amber-300 rounded-lg p-4">
       <Text variant="secondary" size="sm">
         Waiting for location data from Firebase config...
       </Text>
     </div>
   )}
   ```

Note: The initial fetch useEffect already depends on `fetchAllGetEndpoints`, which will re-trigger when location becomes available (because `forecastUrl` changes, causing `fetchAllGetEndpoints` to be recreated). This means the existing useEffect chain handles the "fetch when location arrives" case automatically.
  </action>
  <verify>
    Open the debug page at localhost:3000/debug, navigate to the Weather tab. The tab should show location coordinates in the forecast URL and return valid weather data instead of a "Missing or invalid coordinates" error. If Firebase location is not configured, a "Waiting for location" message should appear.
  </verify>
  <done>
    WeatherTab at app/debug/components/tabs/ fetches forecast with lat/lon from Firebase config. No more "Missing or invalid coordinates" error. Shows waiting state when location unavailable.
  </done>
</task>

<task type="auto">
  <name>Task 2: Apply identical fix to app/debug/api/components/tabs/WeatherTab.tsx</name>
  <files>app/debug/api/components/tabs/WeatherTab.tsx</files>
  <action>
Apply the exact same changes as Task 1 to this file. The only difference is the EndpointCard import path (this file uses `'../ApiTab'` instead of `'@/app/debug/components/ApiTab'`). Keep that import as-is.

Specifically:
1. Add imports: `subscribeToLocation`, `Location` from `@/lib/services/locationService`
2. Add `location` state with `useState<Location | null>(null)`
3. Add location subscription useEffect
4. Build `forecastUrl` from location coordinates
5. Guard `fetchAllGetEndpoints` with `if (!forecastUrl) return`
6. Update EndpointCard `url`, `onRefresh` to use dynamic URL
7. Add "Waiting for location" message when `location` is null

The result should be functionally identical to the fixed version of Task 1.
  </action>
  <verify>
    Open the API debug page at localhost:3000/debug/api, navigate to the Weather tab. Same behavior as Task 1: coordinates in URL, valid weather data returned, waiting state when location unavailable.
  </verify>
  <done>
    WeatherTab at app/debug/api/components/tabs/ fetches forecast with lat/lon from Firebase config. Both debug weather tabs now work identically.
  </done>
</task>

</tasks>

<verification>
1. Both WeatherTab files import and use `subscribeToLocation` from locationService
2. Both files pass `?lat=X&lon=Y` query params to `/api/weather/forecast`
3. Both files show a waiting state when location is null
4. No TypeScript errors: `npx tsc --noEmit --pretty` on both files
5. The forecast API returns actual weather data (not "Missing or invalid coordinates")
</verification>

<success_criteria>
- Both debug weather tabs display weather forecast data from the API
- Coordinates come from Firebase config (not hardcoded)
- Location subscription cleans up on unmount (unsubscribe called)
- Waiting state displayed when location not yet loaded
- Auto-refresh and manual refresh pass coordinates correctly
</success_criteria>

<output>
After completion, create `.planning/quick/16-fix-weather-tab-coordinates-from-config/16-SUMMARY.md`
</output>
