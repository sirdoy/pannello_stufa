# Requirements: Pannello Stufa v3.2

**Defined:** 2026-02-02
**Core Value:** I dispositivi vengono riconosciuti automaticamente dopo il riavvio del browser e le notifiche arrivano sempre (100% delivery rate per dispositivi registrati).

## v3.2 Requirements

Requirements for Dashboard Customization & Weather milestone.

### Weather Component

- [ ] **WEATHER-01**: User can view current temperature and "feels like" temperature
- [ ] **WEATHER-02**: User can see weather condition icon (sunny, cloudy, rain, snow, etc.)
- [ ] **WEATHER-03**: User can view current humidity percentage
- [ ] **WEATHER-04**: User can view current wind speed
- [ ] **WEATHER-05**: User can view 5-day forecast with high/low temperatures
- [ ] **WEATHER-06**: User sees loading skeleton while weather data is fetching
- [ ] **WEATHER-07**: User sees error state with retry option when weather fetch fails
- [ ] **WEATHER-08**: User can see "Updated X minutes ago" timestamp
- [ ] **WEATHER-09**: User can see temperature trend indicator (rising/falling arrow)
- [ ] **WEATHER-10**: User can compare outdoor temperature with indoor thermostat temperature

### Location Settings

- [ ] **LOC-01**: User can manually enter city name in settings
- [ ] **LOC-02**: User sees autocomplete suggestions when typing city name
- [ ] **LOC-03**: User can click "Use my location" to auto-detect position
- [ ] **LOC-04**: User sees appropriate error message when geolocation fails (especially iOS PWA)
- [ ] **LOC-05**: User's location preference persists across sessions (Firebase)
- [ ] **LOC-06**: User can see current location name displayed in weather card

### Dashboard Customization

- [ ] **DASH-01**: User can access dashboard layout settings page
- [ ] **DASH-02**: User can reorder cards using up/down buttons
- [ ] **DASH-03**: User can toggle card visibility (show/hide)
- [ ] **DASH-04**: User's card order persists across sessions (Firebase)
- [ ] **DASH-05**: Home page renders cards in user's saved order
- [ ] **DASH-06**: Weather card appears in home page card list (reorderable like other cards)

### Infrastructure

- [x] **INFRA-01**: Weather API route fetches from Open-Meteo with 15-min cache
- [ ] **INFRA-02**: Dashboard preferences stored in Firebase RTDB (not localStorage)
- [ ] **INFRA-03**: Location settings stored in Firebase RTDB
- [x] **INFRA-04**: Geolocation has 10-second timeout with iOS PWA fallback

## Future Requirements

Deferred to future milestone.

### Weather Enhancements

- **WEATHER-F01**: Hourly forecast for today
- **WEATHER-F02**: Weather alerts (storms, extreme temperatures)
- **WEATHER-F03**: Precipitation radar preview

### Dashboard Enhancements

- **DASH-F01**: Drag-and-drop reordering (in addition to buttons)
- **DASH-F02**: Dashboard layout presets (e.g., "Winter mode", "Summer mode")

## Out of Scope

Explicitly excluded from this milestone.

| Feature | Reason |
|---------|--------|
| Weather animations | Battery drain, complexity, utility app focus |
| Multiple weather providers | Unnecessary complexity, Open-Meteo sufficient |
| Historical weather data | Not actionable for smart home decisions |
| Air quality / pollen | Scope creep, not heating-relevant |
| Weather-based automation | Requires rule engine, future milestone |
| Multi-page dashboards | Complexity, single scrollable page sufficient |
| Card resize options | Design system violation, consistent cards preferred |
| Map-based location picker | High complexity, autocomplete sufficient |
| Multiple saved locations | Unlikely use case for single home |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| WEATHER-01 | Phase 26 | Pending |
| WEATHER-02 | Phase 26 | Pending |
| WEATHER-03 | Phase 26 | Pending |
| WEATHER-04 | Phase 26 | Pending |
| WEATHER-05 | Phase 26 | Pending |
| WEATHER-06 | Phase 26 | Pending |
| WEATHER-07 | Phase 26 | Pending |
| WEATHER-08 | Phase 26 | Pending |
| WEATHER-09 | Phase 26 | Pending |
| WEATHER-10 | Phase 26 | Pending |
| LOC-01 | Phase 27 | Pending |
| LOC-02 | Phase 27 | Pending |
| LOC-03 | Phase 27 | Pending |
| LOC-04 | Phase 27 | Pending |
| LOC-05 | Phase 27 | Pending |
| LOC-06 | Phase 27 | Pending |
| DASH-01 | Phase 28 | Pending |
| DASH-02 | Phase 28 | Pending |
| DASH-03 | Phase 28 | Pending |
| DASH-04 | Phase 28 | Pending |
| DASH-05 | Phase 29 | Pending |
| DASH-06 | Phase 29 | Pending |
| INFRA-01 | Phase 25 | Complete |
| INFRA-02 | Phase 28 | Pending |
| INFRA-03 | Phase 27 | Pending |
| INFRA-04 | Phase 25 | Complete |

**Coverage:**
- v3.2 requirements: 26 total
- Mapped to phases: 26
- Unmapped: 0

---
*Requirements defined: 2026-02-02*
*Last updated: 2026-02-02 after roadmap creation*
