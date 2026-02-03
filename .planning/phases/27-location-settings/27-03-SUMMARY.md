---
phase: 27
plan: 03
subsystem: weather-display
tags: [weather, ui, api, temperature-trend, location]

dependency-graph:
  requires: [25-weather-api, 26-weather-components]
  provides: [location-display, temperature-trend]
  affects: [dashboard-integration]

tech-stack:
  added: []
  patterns:
    - "Hourly temperature aggregation for trend analysis"
    - "3-hour window comparison for trend detection"
    - "1 degree celsius threshold for meaningful change"

key-files:
  created: []
  modified:
    - lib/openMeteo.js
    - app/api/weather/forecast/route.js
    - app/components/weather/weatherHelpers.js
    - app/components/weather/index.js
    - app/components/weather/WeatherCard.jsx
    - app/components/weather/CurrentConditions.jsx

decisions:
  - id: "past-hours-window"
    choice: "6 hours past + 1 hour forecast for trend"
    rationale: "Enough data points for reliable trend, not too much API data"
  - id: "trend-threshold"
    choice: "1 degree celsius threshold"
    rationale: "Small enough to be meaningful, large enough to avoid noise"
  - id: "trend-algorithm"
    choice: "Compare average of first 3 vs last 3 hours"
    rationale: "Smooths out short-term fluctuations"
  - id: "stable-no-icon"
    choice: "No icon for stable temperatures"
    rationale: "Only show actionable info (rising/falling)"

metrics:
  duration: "3 minutes"
  completed: "2026-02-03"
---

# Phase 27 Plan 03: Location Display and Temperature Trend Summary

API returns hourly temps; WeatherCard shows location name and trend icon

## Completed Tasks

| Task | Name | Commit | Key Changes |
|------|------|--------|-------------|
| 1 | Add hourly data to weather API | cf2dacf | hourly params in Open-Meteo, response includes hourly.temperatures |
| 2 | Add temperature trend helper | c9cb24d | getTemperatureTrend function, barrel export |
| 3 | Update WeatherCard and CurrentConditions | 0837a8d | locationName prop, TrendingUp/TrendingDown icons |

## Implementation Details

### 1. Weather API Hourly Data

**Open-Meteo Parameters Added:**
```javascript
hourly: 'temperature_2m',
past_hours: '6',
forecast_hours: '1',
```

**API Response Now Includes:**
```javascript
{
  current: { ... },
  forecast: [ ... ],
  hourly: {
    times: ['2026-02-03T05:00', ...],
    temperatures: [8.2, 8.5, 9.1, 10.2, 11.4, 12.1, 12.8]
  },
  cachedAt, stale
}
```

### 2. Temperature Trend Calculation

**Algorithm:**
1. Need at least 3 data points
2. Average first 3 hours (earlier)
3. Average last 3 hours (recent)
4. Compare: diff > 1 = rising, diff < -1 = falling, else stable

**Return Values:** `'rising' | 'falling' | 'stable' | null`

### 3. UI Integration

**WeatherCard:**
- New `locationName` prop
- Header shows "Meteo - {locationName}" when provided
- Passes `hourly.temperatures` to CurrentConditions

**CurrentConditions:**
- New `hourlyTemperatures` prop
- Calculates trend using `getTemperatureTrend`
- Displays trend icon between temperature and min/max:
  - TrendingUp (ember-400) for rising
  - TrendingDown (ocean-400) for falling
  - No icon for stable
- Italian tooltips: "In aumento" / "In diminuzione"

## Deviations from Plan

None - plan executed exactly as written.

## Files Modified

| File | Changes |
|------|---------|
| lib/openMeteo.js | Added hourly, past_hours, forecast_hours params |
| app/api/weather/forecast/route.js | Extract and return hourly data in response |
| app/components/weather/weatherHelpers.js | Added getTemperatureTrend function |
| app/components/weather/index.js | Export getTemperatureTrend |
| app/components/weather/WeatherCard.jsx | locationName prop, pass hourly to CurrentConditions |
| app/components/weather/CurrentConditions.jsx | hourlyTemperatures prop, trend icon display |

## Test Verification

**API Returns Hourly Data:**
```bash
curl 'http://localhost:3000/api/weather/forecast?lat=45.46&lon=9.19' | jq '.hourly'
# Returns: { times: [...], temperatures: [...] }
```

**Trend Function Works:**
```javascript
getTemperatureTrend([15, 16, 17, 18, 19, 20, 21]) // 'rising'
getTemperatureTrend([21, 20, 19, 18, 17, 16, 15]) // 'falling'
getTemperatureTrend([18, 18, 18, 18, 18, 18, 18]) // 'stable'
```

## Phase 27 Status

| Plan | Name | Status |
|------|------|--------|
| 27-01 | Geocoding Infrastructure | Complete |
| 27-02 | Location Settings UI | Complete (parallel) |
| 27-03 | Location Display & Trend | Complete |

**Phase 27 Complete** - All plans executed successfully.

## Next Phase Readiness

Phase 27 deliverables ready for Phase 28:
- Location stored in Firebase at /config/location
- Location name available for weather card header
- Temperature trend indicator functional
- Geocoding APIs available for location search

Ready to proceed with Phase 28 (Dashboard Customization) or Phase 29 (Weather Integration).
