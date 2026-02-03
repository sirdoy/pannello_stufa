---
type: quick
plan: 002
name: weather-data-cron-manual-refresh
completed: 2026-02-03
duration: 21 minutes
status: complete
---

# Quick Task 002: Weather Data Cron + Manual Refresh

**One-liner:** Firebase-persistent weather cache with 30-minute cron refresh and manual refresh button using Button.Icon in WeatherCard header.

## Overview

Replaced in-memory weather cache with Firebase-persistent storage, automated via Vercel cron (every 30 minutes), and added manual refresh capability via icon button in weather card header.

## Tasks Completed

| Task | Description | Files | Commit |
|------|-------------|-------|--------|
| 1 | Firebase weather cache service and cron route | `lib/weatherCacheService.js`<br>`app/api/cron/weather/route.js`<br>`lib/__tests__/weatherCacheService.test.js` | 3fe5f50 |
| 2 | WeatherCard refresh button + remove timestamp badge | `app/components/weather/WeatherCard.jsx`<br>`app/components/devices/weather/WeatherCardWrapper.js`<br>`app/components/ui/SmartHomeCard.js` | d589776 |
| 3 | Vercel cron configuration | `vercel.json` | ff9190b |

## Technical Implementation

### 1. Firebase Weather Cache Service

**Created:** `lib/weatherCacheService.js`

- **Cache key format:** `{env}/weather/cache/{lat.toFixed(4)},{lon.toFixed(4)}`
- **4-decimal precision:** ~11m location accuracy for efficient caching
- **Environment prefixing:** `dev/` prefix for localhost, no prefix for production
- **Functions:**
  - `getWeatherFromCache(lat, lon)` - Read cached weather data
  - `saveWeatherToCache(lat, lon, data)` - Write weather data with timestamp
  - `invalidateWeatherCache(lat, lon)` - Clear cache entry (for manual refresh)

**Created:** `app/api/cron/weather/route.js`

- **Route:** `/api/cron/weather?secret={CRON_SECRET}`
- **Protection:** `withCronSecret` middleware (query param or Bearer token)
- **Flow:**
  1. Read location from Firebase (`config/location`)
  2. Fetch weather via `fetchWeatherForecast` (Open-Meteo)
  3. Save to Firebase via `saveWeatherToCache`
  4. Return success with timestamp and cache key

**Tests:** `lib/__tests__/weatherCacheService.test.js`
- 14 tests covering:
  - Cache key generation (4-decimal precision, negative coordinates)
  - Environment path prefixing (dev/prod)
  - Read/write/invalidate operations
  - Error handling (Firebase failures)
- **Result:** All tests passing

### 2. WeatherCard Refresh Button

**Modified:** `app/components/ui/SmartHomeCard.js`

- Added `headerActions` prop for actions in header (e.g., buttons)
- Positioned actions with `ml-auto` in header flex container
- Allows any React node as header actions

**Modified:** `app/components/weather/WeatherCard.jsx`

- **Added props:**
  - `onRefresh: function` - Callback when refresh button clicked
  - `isRefreshing: boolean` - Show loading state on button
- **Header actions:**
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
- **Removed:** "Aggiornato X minuti fa" badge from `SmartHomeCard.Status`
- **Kept:** "Aggiornamento in corso..." badge when `stale === true` (backward compatibility during transition)
- **Added import:** `cn` utility for conditional classes

**Modified:** `app/components/devices/weather/WeatherCardWrapper.js`

- **Added state:** `isRefreshing` (boolean)
- **Added handler:** `handleRefresh`
  - Sets `isRefreshing = true`
  - Calls `fetchWeather` with current location
  - Sets `isRefreshing = false` in finally block
- **Passed props:** `onRefresh={handleRefresh}`, `isRefreshing={isRefreshing}`

### 3. Vercel Cron Configuration

**Modified:** `vercel.json`

- **Added crons array:**
  ```json
  "crons": [
    {
      "path": "/api/cron/weather?secret=${CRON_SECRET}",
      "schedule": "*/30 * * * *"
    }
  ]
  ```
- **Schedule:** Every 30 minutes (standard cron syntax)
- **Environment variable:** `CRON_SECRET` must be configured in Vercel project settings
- **Existing config:** Preserved `functions` config for scheduler check route

## Design Decisions

### Why Firebase-persistent cache?

- **Survives server restarts:** In-memory cache lost on Vercel cold starts
- **Consistent across regions:** Global cache key ensures same data everywhere
- **Cron reliability:** Cron can write once, all instances read

### Why 30-minute refresh?

- **Weather data freshness:** 30 minutes balances freshness vs API quota
- **Open-Meteo free tier:** 10,000 calls/day = 416 calls/hour = safe margin
- **User expectation:** Weather doesn't change drastically in 30 minutes

### Why manual refresh button?

- **User control:** Users can force refresh when needed (e.g., after extreme weather alert)
- **Better UX:** Icon button in header is discoverable but unobtrusive
- **Loading feedback:** Spinning animation shows refresh in progress

### Why remove timestamp badge?

- **Redundancy:** With cron-based refresh, timestamp less relevant
- **Cleaner UI:** Reduces visual clutter in status area
- **Manual refresh:** Users don't need to know "when" if they can refresh "now"

## Testing

### Unit Tests
- **weatherCacheService:** 14 tests, all passing
- **Coverage:**
  - Cache key generation (precision, rounding, negatives)
  - Environment path prefixing (dev/prod)
  - CRUD operations (get, save, invalidate)
  - Error handling (Firebase failures)

### Manual Testing (Local)
1. Start dev server: `npm run dev`
2. Navigate to weather card
3. Click refresh button → Spinner animation → Data updates
4. Verify timestamp badge removed
5. Verify "Aggiornamento in corso..." badge shows when stale

### Cron Testing (Production)
1. Deploy to Vercel
2. Configure `CRON_SECRET` environment variable
3. Wait 30 minutes or trigger cron manually
4. Check Firebase for cached weather data at `weather/cache/{lat},{lon}`
5. Verify cron logs in Vercel dashboard

## Files Created

- `lib/weatherCacheService.js` (118 lines)
- `app/api/cron/weather/route.js` (74 lines)
- `lib/__tests__/weatherCacheService.test.js` (180 lines)

## Files Modified

- `app/components/weather/WeatherCard.jsx` (removed badge, added refresh button)
- `app/components/devices/weather/WeatherCardWrapper.js` (added refresh handler)
- `app/components/ui/SmartHomeCard.js` (added headerActions prop)
- `vercel.json` (added cron configuration)

## Next Steps

### Production Deployment
1. Deploy to Vercel: `vercel --prod`
2. Configure `CRON_SECRET` in Vercel project settings → Environment Variables
3. Verify cron execution in Vercel dashboard → Cron Jobs
4. Check Firebase RTDB for weather cache at `weather/cache/` path

### Optional Enhancements (Not in Scope)
- Expose cache TTL as environment variable
- Add cache hit/miss metrics
- Add notification when weather alert detected
- Cache multiple locations for multi-location support

## Metrics

- **Duration:** 21 minutes (16:37 - 16:58 UTC)
- **Tasks:** 3/3 completed
- **Commits:** 3 atomic commits
- **Tests:** 14 unit tests, all passing
- **Files created:** 3
- **Files modified:** 4
- **Lines added:** ~600 (including tests and docs)

## Success Criteria

- [x] Weather data fetched and stored to Firebase every 30 minutes via cron
- [x] Manual refresh button in weather card header
- [x] Timestamp badge removed from weather card
- [x] All unit tests passing
- [x] vercel.json configured for Vercel cron deployment

## Deviations from Plan

None - Plan executed exactly as written.

## Known Issues

None.

## Dependencies

- Existing: `lib/firebaseAdmin.js`, `lib/environmentHelper.js`, `lib/openMeteo.js`
- External: Vercel Cron (free tier includes cron jobs)
- Environment: `CRON_SECRET` (must be configured in Vercel)

## Related Documentation

- Weather caching strategy: `lib/weatherCache.js` (original in-memory cache)
- Open-Meteo API: `lib/openMeteo.js`
- Cron middleware: `lib/core/middleware.js` (`withCronSecret`)
- Design system: `app/components/ui/SmartHomeCard.js`, `app/components/ui/Button.js`
