---
type: quick
plan: 002
name: weather-data-cron-manual-refresh
files_modified:
  - app/api/cron/weather/route.js
  - lib/weatherCacheService.js
  - app/components/weather/WeatherCard.jsx
  - app/components/devices/weather/WeatherCardWrapper.js
  - lib/__tests__/weatherCacheService.test.js
autonomous: true
---

<objective>
Add cron-based weather data caching with Firebase persistence and manual refresh capability.

Purpose: Replace in-memory weather cache with Firebase-persistent cache that refreshes every 30 minutes via Vercel cron. Add manual refresh button to weather card for user-triggered updates.

Output:
- Cron API route fetching weather and storing to Firebase
- Firebase-backed weather cache service
- Refresh button in WeatherCard header
- Removal of "Aggiornato X minuti fa" badge from weather card
</objective>

<context>
@.planning/PROJECT.md
@lib/weatherCache.js (current in-memory cache)
@app/api/weather/forecast/route.js (current weather API)
@app/components/weather/WeatherCard.jsx (UI component)
@app/components/devices/weather/WeatherCardWrapper.js (data fetching wrapper)
@lib/core/middleware.js (withCronSecret middleware)
@lib/firebaseAdmin.js (Firebase Admin SDK)
@lib/environmentHelper.js (dev/prod path prefixing)
</context>

<tasks>

<task type="auto">
  <name>Task 1: Create Firebase weather cache service and cron route</name>
  <files>
    lib/weatherCacheService.js
    app/api/cron/weather/route.js
    lib/__tests__/weatherCacheService.test.js
  </files>
  <action>
1. Create `lib/weatherCacheService.js` - Firebase-backed weather cache:
   - Export `getWeatherFromCache(lat, lon)` - reads from Firebase path `{env}/weather/cache`
   - Export `saveWeatherToCache(lat, lon, data)` - writes to Firebase with timestamp
   - Export `invalidateWeatherCache(lat, lon)` - clears cache entry (optional, for manual refresh)
   - Use `getEnvironmentPath('weather/cache')` for dev/prod separation
   - Use `adminDbGet`/`adminDbSet` from firebaseAdmin for server-side operations
   - Cache key format: `{env}/weather/cache/{lat.toFixed(4)},{lon.toFixed(4)}`

2. Create `app/api/cron/weather/route.js` - Cron endpoint:
   - Use `withCronSecret` middleware (same pattern as scheduler/check)
   - Read location from Firebase: `getEnvironmentPath('config/location')`
   - If location has coordinates, fetch weather via `fetchWeatherForecast` from openMeteo
   - Save to Firebase via `saveWeatherToCache`
   - Return success response with timestamp
   - Add `export const dynamic = 'force-dynamic'`

3. Create `lib/__tests__/weatherCacheService.test.js`:
   - Test cache key generation (4 decimal precision)
   - Test cache read/write (mock firebaseAdmin)
   - Test environment path prefixing
  </action>
  <verify>
    - `npm test -- --testPathPattern=weatherCacheService` passes
    - Manual curl: `curl "http://localhost:3000/api/cron/weather?secret=$CRON_SECRET"` returns 200
  </verify>
  <done>
    - Cron route exists at /api/cron/weather, protected by CRON_SECRET
    - Weather data persists to Firebase at weather/cache path
    - Tests cover cache service logic
  </done>
</task>

<task type="auto">
  <name>Task 2: Update WeatherCard with refresh button and remove timestamp badge</name>
  <files>
    app/components/weather/WeatherCard.jsx
    app/components/devices/weather/WeatherCardWrapper.js
  </files>
  <action>
1. Update `app/components/weather/WeatherCard.jsx`:
   - Add `onRefresh` prop (function, called when refresh button clicked)
   - Add `isRefreshing` prop (boolean, shows loading state on refresh button)
   - Add refresh button in header area using Button.Icon component:
     ```jsx
     <Button.Icon
       icon={<RefreshCw className={cn("w-4 h-4", isRefreshing && "animate-spin")} />}
       variant="ghost"
       size="sm"
       onClick={onRefresh}
       disabled={isRefreshing}
       aria-label="Aggiorna meteo"
     />
     ```
   - Place button to the right of the title in SmartHomeCard header
   - REMOVE the Badge showing "Aggiornato X minuti fa" from SmartHomeCard.Status section
   - Keep the "Aggiornamento in corso..." badge if stale (for backward compat during transition)

2. Update `app/components/devices/weather/WeatherCardWrapper.js`:
   - Add `isRefreshing` state (useState, initially false)
   - Add `handleRefresh` function that:
     - Sets isRefreshing to true
     - Calls existing fetchWeather with current location coordinates
     - Sets isRefreshing to false when complete (in finally block)
   - Pass `onRefresh={handleRefresh}` and `isRefreshing={isRefreshing}` to WeatherCard
  </action>
  <verify>
    - WeatherCard renders refresh button in header
    - Clicking refresh button triggers data fetch
    - Refresh button shows spinning animation during fetch
    - "Aggiornato X minuti fa" badge is no longer visible
  </verify>
  <done>
    - Manual refresh button visible and functional
    - Timestamp badge removed from weather card
    - Loading state shown during refresh
  </done>
</task>

<task type="auto">
  <name>Task 3: Configure Vercel cron schedule</name>
  <files>
    vercel.json
  </files>
  <action>
1. Update `vercel.json` to add cron configuration:
   ```json
   {
     "crons": [
       {
         "path": "/api/cron/weather?secret=${CRON_SECRET}",
         "schedule": "*/30 * * * *"
       }
     ],
     "functions": {
       "app/api/scheduler/check/route.js": {
         "maxDuration": 60
       }
     }
   }
   ```
   Note: Vercel cron uses standard cron syntax. `*/30 * * * *` = every 30 minutes.
   The CRON_SECRET env var must be configured in Vercel project settings.

2. Ensure route is discoverable by Vercel:
   - Cron routes must be in app/api directory (already satisfied)
   - Route must export GET handler (already in Task 1)
  </action>
  <verify>
    - vercel.json contains crons array with weather cron entry
    - `cat vercel.json | jq '.crons'` shows the weather cron configuration
  </verify>
  <done>
    - Vercel cron configured to run every 30 minutes
    - Weather data will auto-refresh in production
  </done>
</task>

</tasks>

<verification>
1. Unit tests pass: `npm test -- --testPathPattern=weatherCacheService`
2. Cron endpoint works: `curl -s "http://localhost:3000/api/cron/weather?secret=$CRON_SECRET" | jq`
3. Weather card shows refresh button, no timestamp badge
4. Refresh button triggers data reload with spinner animation
5. vercel.json has valid cron configuration
</verification>

<success_criteria>
- Weather data fetched and stored to Firebase every 30 minutes via cron
- Manual refresh button in weather card header
- Timestamp badge removed from weather card
- All unit tests passing
- vercel.json configured for Vercel cron deployment
</success_criteria>

<output>
After completion, create `.planning/quick/002-weather-data-cron-manual-refresh/002-SUMMARY.md`
</output>
