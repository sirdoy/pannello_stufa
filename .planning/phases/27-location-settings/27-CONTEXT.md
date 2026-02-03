# Phase 27: Location Settings - Context

**Gathered:** 2026-02-03
**Status:** Ready for planning

<domain>
## Phase Boundary

Users configure their home location for weather display. Includes city search with autocomplete, geolocation auto-detect, and persistence to Firebase. Location name displays in WeatherCard. Temperature trend indicator (WEATHER-09) also implemented here since it requires hourly data.

</domain>

<decisions>
## Implementation Decisions

### Location Input Method
- Both search and auto-detect equally prominent — no hierarchy between them
- Manual coordinates available via "Avanzate" link for power users (hidden by default)
- No automatic prompts — user must navigate to settings to configure location
- Once set, location cannot be cleared — only changed to a different location

### Search Experience
- 5 autocomplete suggestions maximum — compact, quick to scan
- Single location only — no recent/saved locations feature
- Result info format: Claude's discretion based on Open-Meteo geocoding response

### Error Handling
- No results: "Nessun risultato. Prova con un nome più completo o una città vicina."
- API failures: Silent retry 2-3 times, then show error with retry button
- Geolocation errors: Claude's discretion for denied/timeout messaging

### Display & Feedback
- Location display in WeatherCard: Claude's discretion based on design system
- Save confirmation: Claude's discretion for feedback pattern
- No quick edit from WeatherCard — must go through Settings menu
- Navigation path: Claude determines based on existing app patterns

### Claude's Discretion
- Search trigger timing (debounced vs on-submit)
- Result info format (city+country vs city+region+country)
- Geolocation denied/timeout messaging in Italian
- Location display format in WeatherCard
- Save feedback pattern (toast vs navigate vs inline)
- Settings page navigation integration

</decisions>

<specifics>
## Specific Ideas

- All copy in Italian (app is Italian-only)
- Power user manual coordinates should be unobtrusive — small "Avanzate" link
- Helpful error messages that guide user to resolution

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 27-location-settings*
*Context gathered: 2026-02-03*
