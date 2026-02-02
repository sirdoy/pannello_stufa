# Roadmap: Pannello Stufa v3.2

## Overview

v3.2 adds weather display and dashboard customization to the Pannello Stufa PWA. Users will see outdoor weather conditions on the home page and can reorder/hide cards to personalize their dashboard. The milestone builds foundational infrastructure (API, storage, geolocation), then layers UI components, then integrates everything on the home page.

## Milestones

- **v3.2 Dashboard Customization & Weather** - Phases 25-29 (in progress)

## Phases

- [ ] **Phase 25: Weather Foundation** - API route, geolocation utility, preferences service
- [ ] **Phase 26: Weather Component** - WeatherCard UI with current conditions and forecast
- [ ] **Phase 27: Location Settings** - Settings page for home location configuration
- [ ] **Phase 28: Dashboard Customization** - Settings page for card order and visibility
- [ ] **Phase 29: Home Page Integration** - Render cards in saved order with WeatherCard

## Phase Details

### Phase 25: Weather Foundation
**Goal**: Infrastructure for weather data and user preferences is operational
**Depends on**: Nothing (first phase of v3.2)
**Requirements**: INFRA-01, INFRA-04
**Success Criteria** (what must be TRUE):
  1. API route /api/weather/forecast returns weather data for given coordinates
  2. Weather responses are cached for 15 minutes (repeated requests within window return cached data)
  3. Geolocation utility returns coordinates within 10 seconds or triggers fallback
  4. iOS PWA geolocation failures show appropriate error rather than hanging
**Plans**: TBD

Plans:
- [ ] 25-01: Weather API client and route
- [ ] 25-02: Geolocation utility with iOS fallback
- [ ] 25-03: Dashboard preferences service

### Phase 26: Weather Component
**Goal**: Users can view weather information in a card matching the existing design system
**Depends on**: Phase 25 (API route must exist)
**Requirements**: WEATHER-01, WEATHER-02, WEATHER-03, WEATHER-04, WEATHER-05, WEATHER-06, WEATHER-07, WEATHER-08, WEATHER-09, WEATHER-10
**Success Criteria** (what must be TRUE):
  1. User can see current temperature and "feels like" temperature in WeatherCard
  2. User can see weather condition icon representing current conditions
  3. User can see 5-day forecast with daily high/low temperatures
  4. User sees skeleton loading state while weather fetches
  5. User sees error state with retry button when fetch fails
  6. User can compare outdoor temperature with indoor thermostat reading
**Plans**: TBD

Plans:
- [ ] 26-01: WeatherCard component structure
- [ ] 26-02: Current conditions display
- [ ] 26-03: 5-day forecast display
- [ ] 26-04: Loading and error states

### Phase 27: Location Settings
**Goal**: Users can configure their home location for weather display
**Depends on**: Phase 25 (geolocation utility), Phase 26 (WeatherCard shows location)
**Requirements**: LOC-01, LOC-02, LOC-03, LOC-04, LOC-05, LOC-06, INFRA-03
**Success Criteria** (what must be TRUE):
  1. User can navigate to location settings page from settings menu
  2. User can type city name and see autocomplete suggestions
  3. User can click "Use my location" to auto-detect position
  4. User sees appropriate error message when geolocation fails
  5. User's location preference persists across browser sessions
  6. WeatherCard displays the configured location name
**Plans**: TBD

Plans:
- [ ] 27-01: Location settings page
- [ ] 27-02: City autocomplete with Open-Meteo Geocoding
- [ ] 27-03: Geolocation button with error handling
- [ ] 27-04: Firebase persistence and WeatherCard integration

### Phase 28: Dashboard Customization
**Goal**: Users can personalize their home page card layout
**Depends on**: Nothing (parallel track)
**Requirements**: DASH-01, DASH-02, DASH-03, DASH-04, INFRA-02
**Success Criteria** (what must be TRUE):
  1. User can navigate to dashboard layout settings page
  2. User can reorder cards using up/down buttons
  3. User can toggle card visibility (show/hide each card)
  4. User's card order and visibility preferences persist across sessions
**Plans**: TBD

Plans:
- [ ] 28-01: Dashboard layout settings page
- [ ] 28-02: Card reorder functionality
- [ ] 28-03: Card visibility toggles
- [ ] 28-04: Firebase persistence

### Phase 29: Home Page Integration
**Goal**: Home page renders cards according to user's saved preferences
**Depends on**: Phase 26 (WeatherCard exists), Phase 28 (dashboard preferences exist)
**Requirements**: DASH-05, DASH-06
**Success Criteria** (what must be TRUE):
  1. Home page renders cards in user's saved order
  2. Home page hides cards user has disabled
  3. WeatherCard appears in the card list and can be reordered like other cards
  4. New users see sensible default card order
**Plans**: TBD

Plans:
- [ ] 29-01: Home page card rendering from preferences
- [ ] 29-02: WeatherCard integration into card list

## Progress

**Execution Order:**
Phases execute in numeric order: 25 -> 26 -> 27 -> 28 -> 29

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 25. Weather Foundation | 0/3 | Not started | - |
| 26. Weather Component | 0/4 | Not started | - |
| 27. Location Settings | 0/4 | Not started | - |
| 28. Dashboard Customization | 0/4 | Not started | - |
| 29. Home Page Integration | 0/2 | Not started | - |

## Requirement Coverage

All 26 v3.2 requirements are mapped:

| Category | Requirements | Phase |
|----------|--------------|-------|
| Infrastructure | INFRA-01, INFRA-04 | 25 |
| Weather Display | WEATHER-01 to WEATHER-10 | 26 |
| Location Settings | LOC-01 to LOC-06, INFRA-03 | 27 |
| Dashboard Customization | DASH-01 to DASH-04, INFRA-02 | 28 |
| Home Integration | DASH-05, DASH-06 | 29 |

**Coverage: 26/26 requirements mapped**
