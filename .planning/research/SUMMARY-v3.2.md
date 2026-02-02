# Research Summary: v3.2 Dashboard Customization & Weather

**Project:** Pannello Stufa - Smart Home PWA
**Milestone:** v3.2 Dashboard Customization & Weather
**Researched:** 2026-02-02
**Confidence:** HIGH

---

## Executive Summary

v3.2 adds two main features: **weather display** and **dashboard customization**. Research confirms both can be implemented with **zero new npm dependencies** using existing infrastructure (Firebase, CVA/Radix UI, native browser APIs).

**Key decisions:**
- **Open-Meteo API** for weather — free, no API key, no credit card, 16-day forecast
- **Firebase RTDB** for dashboard preferences — consistent with existing patterns, survives iOS storage eviction
- **Menu-based reordering** via settings page — simpler than drag-drop, better mobile UX
- **Browser Geolocation API** for auto-detect — with iOS PWA fallbacks

---

## Stack Recommendations

| Need | Solution | Rationale |
|------|----------|-----------|
| Weather API | Open-Meteo | Free, no API key, CORS-enabled, 10k calls/day |
| Geolocation | Browser API + Open-Meteo Geocoding | Native, no dependencies |
| Dashboard storage | Firebase RTDB | Survives iOS eviction, syncs cross-device |
| Reorder UI | Existing Button/Card components | Menu-based per constraint |

**NOT adding:** Weather npm packages, drag-drop libraries (menu-based approach), map libraries, new state management.

**New env vars:** None required (Open-Meteo needs no API key).

---

## Feature Table Stakes

### Weather Component
- Current temperature + "feels like"
- Weather condition icon
- Humidity, wind speed
- 3-5 day forecast
- Loading/error states
- "Updated X minutes ago" timestamp

### Location Settings
- Manual city input with autocomplete
- Browser geolocation ("Use my location")
- Location persistence to Firebase
- Display current location in weather card

### Dashboard Customization
- Settings page with up/down buttons to reorder
- Enable/disable cards (visibility toggle)
- Order persists to Firebase
- Home page respects saved order

---

## Architecture Overview

```
New files:
  lib/weather/api.js                    — Open-Meteo client
  lib/dashboardPreferencesService.js    — Dashboard order + location CRUD
  app/api/weather/forecast/route.js     — Weather endpoint (server-side caching)
  app/api/user/dashboard/route.js       — Dashboard preferences endpoint
  app/components/devices/weather/WeatherCard.js
  app/settings/layout/page.js           — Dashboard order settings
  app/settings/location/page.js         — Home location settings
```

**Firebase schema extension:**
```javascript
dashboardPreferences/{userId}: {
  cardOrder: ['weather', 'stove', 'thermostat', 'lights', 'camera'],
  enabledCards: ['weather', 'stove', 'thermostat', 'lights'],
  location: {
    lat: 45.46,
    lon: 9.19,
    name: 'Milano',
    source: 'geolocation' | 'manual'
  }
}
```

---

## Critical Pitfalls to Address

| Pitfall | Risk | Mitigation | Phase |
|---------|------|------------|-------|
| iOS PWA geolocation hangs | HIGH | 10s timeout + manual fallback mandatory | 1 |
| Weather API key exposure | HIGH | Server-side route only, no NEXT_PUBLIC_ | 1 |
| iOS storage eviction (7 days) | HIGH | Firebase primary, localStorage cache | 2 |
| Weather rate limits | MEDIUM | 10-min cache, visibility-aware polling | 1 |
| Stale data without indicator | MEDIUM | Show "Updated X ago" timestamp | 1 |

---

## Suggested Phase Structure

### Phase 25: Weather Foundation
- lib/weather/api.js (Open-Meteo client)
- lib/dashboardPreferencesService.js
- /api/weather/forecast route with 15-min caching
- Geolocation utility with iOS fallback

### Phase 26: Weather Component
- WeatherCard component (follows existing card patterns)
- Current conditions + 5-day forecast
- Loading/error states
- Accessibility (aria-labels)

### Phase 27: Location Settings
- /settings/location page
- Manual city input + autocomplete
- "Use my location" button
- Firebase persistence

### Phase 28: Dashboard Customization
- /settings/layout page
- Card order with up/down buttons
- Enable/disable toggles
- Firebase persistence

### Phase 29: Home Page Integration
- app/page.js renders cards in saved order
- WeatherCard added to card list
- Respects enabled/disabled state

---

## Complexity Estimates

| Feature | Effort | Risk |
|---------|--------|------|
| Weather API integration | 3-4h | Low |
| WeatherCard component | 4-5h | Low |
| Location settings | 3-4h | Medium (iOS geo) |
| Dashboard order settings | 3-4h | Low |
| Home page integration | 2-3h | Low |
| **Total** | **15-20h** | **Low-Medium** |

---

## Sources

**Stack (HIGH confidence):**
- [Open-Meteo API Documentation](https://open-meteo.com/en/docs)
- [Open-Meteo Geocoding API](https://open-meteo.com/en/docs/geocoding-api)

**Features (HIGH confidence):**
- [Home Assistant Weather Integration](https://www.home-assistant.io/integrations/weather)
- [Smart Home Dashboard Patterns](https://www.home-assistant.io/blog/2024/03/04/dashboard-chapter-1/)

**Pitfalls (HIGH confidence):**
- [PWA on iOS Limitations 2025](https://brainhub.eu/library/pwa-on-ios)
- [iOS Safari PWA Storage Eviction](https://www.magicbell.com/blog/pwa-ios-limitations-safari-support-complete-guide)

---

*Research complete: 2026-02-02*
*Ready for requirements definition*
