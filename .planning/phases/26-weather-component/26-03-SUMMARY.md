---
phase: 26-weather-component
plan: 03
subsystem: weather-ui
tags: [forecast, horizontal-scroll, bottom-sheet, ios-style]

# Dependency Graph
requires: [26-01]
provides: [ForecastRow, ForecastDayCard, ForecastDaySheet, scrollbar-hide]
affects: [26-04]

# Tech Tracking
tech-stack:
  added: []
  patterns: [horizontal-snap-scroll, bottom-sheet-modal, stat-grid]

# File Tracking
key-files:
  created:
    - app/components/weather/ForecastDayCard.jsx
    - app/components/weather/ForecastRow.jsx
    - app/components/weather/ForecastDaySheet.jsx
  modified:
    - app/globals.css

# Decisions
decisions:
  - key: forecast-first-day-today
    choice: "Use index === 0 to mark first day as 'Oggi'"
    rationale: "API returns forecast starting from today, simpler than date comparison"
  - key: precipitation-threshold
    choice: "Show precipitation badge only when > 10%"
    rationale: "Matches weatherHelpers pattern, avoids visual noise for low probability"
  - key: missing-data-handling
    choice: "Display 'N/D' (non disponibile) for missing extended stats"
    rationale: "Phase 25 API may not include all fields, graceful degradation"

# Metrics
metrics:
  duration: ~3min
  completed: 2026-02-02
---

# Phase 26 Plan 03: Forecast Components Summary

**One-liner:** Horizontal scrollable 5-day forecast with tap-to-expand bottom sheet details

## What Was Built

### ForecastDayCard Component
Individual forecast day card showing:
- Day name (Italian format: "Lun", "Mar") or "Oggi" for today
- Weather icon matching condition code
- High temperature (ember color) and low temperature (tertiary)
- Precipitation badge when chance > 10%
- Full keyboard accessibility (Enter/Space)
- ARIA label with full forecast description

### ForecastRow Component
Horizontal scrollable container featuring:
- Apple Weather-style snap scrolling
- iOS momentum scrolling (-webkit-overflow-scrolling: touch)
- Right fade gradient indicating more content
- ARIA list role for screen readers
- Automatic "Oggi" marking for first day

### ForecastDaySheet Component
Bottom sheet modal with detailed day view:
- Full date title (e.g., "Lunedi 3 Febbraio")
- Temperature range (ember max, ocean min)
- Large weather icon with condition description
- Extended stats grid (UV, humidity, wind, precipitation)
- Optional sunrise/sunset row when data available
- Graceful N/D for missing data

### CSS Utility
Added scrollbar-hide utility to globals.css:
- WebKit browsers (Chrome, Safari)
- Firefox (scrollbar-width: none)
- IE/Edge (-ms-overflow-style: none)

## Key Patterns Established

1. **Horizontal Snap Scroll Pattern:**
```jsx
<div className="flex gap-3 overflow-x-auto scrollbar-hide snap-x snap-mandatory [-webkit-overflow-scrolling:touch]">
  {items.map(item => <Card className="flex-shrink-0 snap-start" />)}
</div>
```

2. **Bottom Sheet Stat Grid Pattern:**
```jsx
<div className="grid grid-cols-2 gap-4">
  <StatCard icon={Icon} iconColor="text-ocean-400" label="Label" value={value} />
</div>
```

3. **Day Name Formatting Pattern:**
```jsx
const dayName = isToday ? 'Oggi' : format(parseISO(date), 'EEE', { locale: it });
// Capitalize: dayName.charAt(0).toUpperCase() + dayName.slice(1)
```

## Files Changed

| File | Lines | Change |
|------|-------|--------|
| ForecastDayCard.jsx | 136 | Created |
| ForecastRow.jsx | 67 | Created |
| ForecastDaySheet.jsx | 187 | Created |
| globals.css | +9 | Added scrollbar-hide |

## Deviations from Plan

None - plan executed exactly as written.

## Commits

| Hash | Type | Description |
|------|------|-------------|
| 19754e8 | feat | ForecastDayCard component |
| 3d04351 | feat | ForecastRow component |
| 9d09579 | feat | ForecastDaySheet bottom sheet |
| 272c17a | style | scrollbar-hide CSS utility |

## Next Phase Readiness

**Ready for Plan 04 (Integration):**
- All forecast components exported and ready
- Components follow established WeatherIcon/weatherHelpers patterns
- Bottom sheet uses existing BottomSheet UI component
- Horizontal scroll pattern matches LightsCard implementation
