---
status: resolved
trigger: "Weather modal for future days shows N/D for air quality when data doesn't exist - should hide the entire section instead"
created: 2026-02-04T10:00:00Z
updated: 2026-02-04T10:10:00Z
---

## Current Focus

hypothesis: CONFIRMED - Air Quality section renders unconditionally showing "N/D" when data is null/undefined
test: Read ForecastDaySheet.jsx - found lines 166-173
expecting: N/A - root cause confirmed
next_action: Apply fix - wrap Air Quality StatCard in conditional similar to Pressure section

## Symptoms

expected: Hide the entire air quality section when no data is available for future days
actual: Shows "N/D" for air quality on all future days in the weather modal
errors: None - display logic issue
reproduction: Open weather modal for any day after today - air quality shows as "N/D"
started: Never worked correctly - always been this behavior

## Eliminated

## Evidence

- timestamp: 2026-02-04T10:05:00Z
  checked: ForecastDaySheet.jsx lines 166-173
  found: Air Quality StatCard renders unconditionally with `value={day.airQuality ?? 'N/D'}` - no conditional wrapper
  implication: Shows "N/D" for future days where API doesn't provide air quality data

- timestamp: 2026-02-04T10:05:00Z
  checked: ForecastDaySheet.jsx lines 175-184 (Pressure section)
  found: Pressure uses conditional rendering `{isToday && pressure !== null && (` - correct pattern
  implication: Air Quality should follow same pattern - only render when data exists

## Resolution

root_cause: Air Quality StatCard in ForecastDaySheet.jsx was rendered unconditionally with fallback value `day.airQuality ?? 'N/D'`, showing "N/D" when air quality data is null/undefined (which is the case for future days since the API only provides air quality for the current day).

fix: Wrapped Air Quality StatCard in conditional rendering `{day.airQuality != null && (...)}` to only display when data exists, following the same pattern already used for Pressure and Sunrise/Sunset sections.

verification:
- Code review confirms the fix follows existing patterns in the same file
- All 2569 tests pass (excluding pre-existing unrelated thermostat test failure)
- Air quality section will now be hidden for future days where data is unavailable

files_changed:
- app/components/weather/ForecastDaySheet.jsx (lines 166-175)
