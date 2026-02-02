# Phase 26: Weather Component - Context

**Gathered:** 2026-02-02
**Status:** Ready for planning

<domain>
## Phase Boundary

A visual card displaying current weather conditions and 5-day forecast, matching the existing Ember Noir design system. Uses the weather API infrastructure from Phase 25. Location settings and home page integration are separate phases.

</domain>

<decisions>
## Implementation Decisions

### Card layout & density
- Single unified card (current + forecast together, no expand/collapse)
- Current conditions prominent on top, forecast row below (Apple Weather widget style)
- Full weather details visible at once: humidity, wind, UV index, pressure, visibility
- Details displayed in a grid of small icons/values below main temperature

### Weather icons & visuals
- Filled/solid icon style (like iOS weather)
- Day/night variants (sun for day, moon for night, different cloud styles)
- Static icons (no animation)
- Natural weather colors (sun=yellow, rain=blue, clouds=gray) for intuitive recognition

### Temperature display
- Celsius only, one decimal precision (18.5°C)
- "Feels like" temperature in the details grid (not next to main temp)
- Show difference value between indoor and outdoor temperature
- Indoor/outdoor comparison text: shows how much warmer/colder outside is vs thermostat reading

### Forecast presentation
- Scrollable horizontal row (allows future expansion beyond 5 days)
- Each day shows: day name + icon + high/low + precipitation chance
- Tapping a forecast day opens bottom sheet with full day details
- Day detail sheet shows both hourly breakdown AND extended stats (UV, humidity, wind, sunrise/sunset)

### Claude's Discretion
- Exact grid layout for weather details
- Indoor/outdoor comparison format (text description vs icon+number)
- Skeleton loading design
- Error state layout
- Bottom sheet styling and animation

</decisions>

<specifics>
## Specific Ideas

- Current conditions layout inspired by Apple Weather widget (large temp + icon prominent)
- Forecast row similar to iOS weather app horizontal scroll
- Natural colors for weather icons help users instantly recognize conditions

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 26-weather-component*
*Context gathered: 2026-02-02*
