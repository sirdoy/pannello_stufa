# Roadmap: Pannello Stufa v3.2

## Overview

v3.2 adds weather display and dashboard customization to the Pannello Stufa PWA. Users will see outdoor weather conditions on the home page and can reorder/hide cards to personalize their dashboard. The milestone builds foundational infrastructure (API, storage, geolocation), then layers UI components, then integrates everything on the home page.

## Milestones

- **v3.2 Dashboard Customization & Weather** - Phases 25-29 (in progress)

## Phases

- [x] **Phase 25: Weather Foundation** - API route, geolocation utility, preferences service ✓
- [x] **Phase 26: Weather Component** - WeatherCard UI with current conditions and forecast ✓
- [x] **Phase 27: Location Settings** - Settings page for home location configuration ✓
- [x] **Phase 28: Dashboard Customization** - Settings page for card order and visibility ✓
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
**Plans**: 3 plans

Plans:
- [x] 25-01-PLAN.md — Weather API client (Open-Meteo wrapper), cache utility, forecast route
- [x] 25-02-PLAN.md — Geolocation utility with iOS fallback, location service for Firebase
- [x] 25-03-PLAN.md — Dashboard preferences service, dashboard API route, weather cache tests

### Phase 26: Weather Component
**Goal**: Users can view weather information in a card matching the existing design system
**Depends on**: Phase 25 (API route must exist)
**Requirements**: WEATHER-01, WEATHER-02, WEATHER-03, WEATHER-04, WEATHER-05, WEATHER-06, WEATHER-07, WEATHER-08, WEATHER-10
**Success Criteria** (what must be TRUE):
  1. User can see current temperature and "feels like" temperature in WeatherCard
  2. User can see weather condition icon representing current conditions
  3. User can see 5-day forecast with daily high/low temperatures
  4. User sees skeleton loading state while weather fetches
  5. User sees error state with retry button when fetch fails
  6. User can compare outdoor temperature with indoor thermostat reading
**Plans**: 4 plans

Plans:
- [x] 26-01-PLAN.md — WeatherIcon component and weather helpers (WMO code mapping, temperature formatting)
- [x] 26-02-PLAN.md — WeatherCard core with CurrentConditions and Skeleton.WeatherCard
- [x] 26-03-PLAN.md — ForecastRow, ForecastDayCard, and ForecastDaySheet with bottom sheet details
- [x] 26-04-PLAN.md — Barrel export, integration, and visual verification

### Phase 27: Location Settings
**Goal**: Users can configure their home location for weather display
**Depends on**: Phase 25 (geolocation utility), Phase 26 (WeatherCard shows location)
**Requirements**: LOC-01, LOC-02, LOC-03, LOC-04, LOC-05, LOC-06, INFRA-03, WEATHER-09
**Success Criteria** (what must be TRUE):
  1. User can navigate to location settings page from settings menu
  2. User can type city name and see autocomplete suggestions
  3. User can click "Use my location" to auto-detect position
  4. User sees appropriate error message when geolocation fails
  5. User's location preference persists across browser sessions
  6. WeatherCard displays the configured location name
  7. User sees temperature trend indicator (rising/falling arrow) when hourly data is available
**Plans**: 3 plans

Plans:
- [x] 27-01-PLAN.md — Geocoding API routes and useDebounce hook
- [x] 27-02-PLAN.md — Location settings page with city search and geolocation
- [x] 27-03-PLAN.md — WeatherCard location display and temperature trend indicator

### Phase 28: Dashboard Customization
**Goal**: Users can personalize their home page card layout
**Depends on**: Nothing (parallel track)
**Requirements**: DASH-01, DASH-02, DASH-03, DASH-04, INFRA-02
**Success Criteria** (what must be TRUE):
  1. User can navigate to dashboard layout settings page
  2. User can reorder cards using up/down buttons
  3. User can toggle card visibility (show/hide each card)
  4. User's card order and visibility preferences persist across sessions
**Plans**: 2 plans

Plans:
- [x] 28-01-PLAN.md — Per-user infrastructure: refactor API + service for user-specific storage, add menu item
- [x] 28-02-PLAN.md — Dashboard settings page with reorder and visibility controls

### Phase 29: Home Page Integration
**Goal**: Home page renders cards according to user's saved preferences
**Depends on**: Phase 26 (WeatherCard exists), Phase 28 (dashboard preferences exist)
**Requirements**: DASH-05, DASH-06
**Success Criteria** (what must be TRUE):
  1. Home page renders cards in user's saved order
  2. Home page hides cards user has disabled
  3. WeatherCard appears in the card list and can be reordered like other cards
  4. New users see sensible default card order
**Plans**: 1 plan

Plans:
- [ ] 29-01-PLAN.md — WeatherCardWrapper + home page card rendering from dashboard preferences

## Progress

**Execution Order:**
Phases execute in numeric order: 25 -> 26 -> 27 -> 28 -> 29

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 25. Weather Foundation | 3/3 | ✓ Complete | 2026-02-02 |
| 26. Weather Component | 4/4 | ✓ Complete | 2026-02-02 |
| 27. Location Settings | 3/3 | ✓ Complete | 2026-02-03 |
| 28. Dashboard Customization | 2/2 | ✓ Complete | 2026-02-03 |
| 29. Home Page Integration | 0/1 | Not started | - |

## Requirement Coverage

All 26 v3.2 requirements are mapped:

| Category | Requirements | Phase |
|----------|--------------|-------|
| Infrastructure | INFRA-01, INFRA-04 | 25 |
| Weather Display | WEATHER-01 to WEATHER-08, WEATHER-10 | 26 |
| Weather Trends | WEATHER-09 | 27 |
| Location Settings | LOC-01 to LOC-06, INFRA-03 | 27 |
| Dashboard Customization | DASH-01 to DASH-04, INFRA-02 | 28 |
| Home Integration | DASH-05, DASH-06 | 29 |

**Coverage: 26/26 requirements mapped**

**Note:** WEATHER-09 (temperature trend indicator) deferred to Phase 27 because it requires hourly historical data for meaningful comparison. Phase 27 will add hourly data fetching alongside location settings.
