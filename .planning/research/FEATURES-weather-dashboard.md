# Feature Landscape: Weather Display & Dashboard Customization

**Domain:** Smart Home PWA (Italian, heating-focused)
**Researched:** 2026-02-02
**Milestone:** Weather component and dashboard customization
**Confidence:** HIGH (verified with multiple sources)

---

## Context: Smart Home Weather vs. Generic Weather App

This PWA is a **heating control system** first. Weather serves a specific purpose:

1. **Decision support** - "Should I turn on the stove?" needs outdoor temperature
2. **Planning ahead** - "Will it be cold tomorrow?" affects heating schedules
3. **At-a-glance info** - Quick check without opening another app

Weather here is **ancillary**, not the main feature. Complexity should be minimal.

---

## Table Stakes

Features users expect. Missing = product feels incomplete.

### Weather Display

| Feature | Why Expected | Complexity | Implementation Notes |
|---------|--------------|------------|---------------------|
| **Current temperature** | Primary data point for heating decisions | Low | Single API call, prominent display |
| **Weather condition icon** | Visual recognition (sunny, cloudy, rain, snow) | Low | Map API condition codes to icons |
| **"Feels like" temperature** | More useful than actual temp for comfort decisions | Low | Most APIs provide this field |
| **Humidity** | Affects perceived cold, relevant for heating | Low | Standard API field |
| **3-day forecast minimum** | Plan heating for upcoming days | Low | Single API call typically includes this |
| **High/low temperatures** | Daily planning reference | Low | Standard forecast field |
| **Last updated timestamp** | Trust indicator, know if data is stale | Low | Track fetch time |
| **Loading state** | UX polish, no blank screens | Low | Standard skeleton/spinner |
| **Error state with retry** | Network failures happen, especially on PWA | Low | Standard error handling pattern |

### Location Settings

| Feature | Why Expected | Complexity | Implementation Notes |
|---------|--------------|------------|---------------------|
| **Manual city/location input** | User may not want to share GPS, or location wrong | Low | Text input with autocomplete |
| **Location persistence** | Remember setting across sessions | Low | Firebase or localStorage |
| **Clear location display** | Show which location is being used | Low | Display city name prominently |

### Dashboard Customization

| Feature | Why Expected | Complexity | Implementation Notes |
|---------|--------------|------------|---------------------|
| **Card visibility toggle** | Hide unused devices (e.g., no camera) | Low | Already have device enabled/disabled in registry |
| **Order persistence** | Remember user's preferred layout | Low | Firebase array of device IDs |
| **Settings page for customization** | Discoverable way to customize | Low | Route already exists at `/settings/devices` |

---

## Differentiators

Features that set product apart. Not expected, but valued.

### Weather Display

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **5-7 day forecast** | Better long-term planning | Low | Same API, just display more days |
| **Hourly forecast (today)** | Plan heating for today's temperature swings | Medium | Additional data, scrollable UI needed |
| **Wind speed/direction** | Affects perceived temperature, drafty homes | Low | Standard API field, often overlooked |
| **Precipitation probability** | Plan outdoor activities, useful context | Low | Standard forecast field |
| **Sunrise/sunset times** | Useful for lighting automation context | Low | Most APIs include this |
| **Weather alerts** | Safety-relevant (storms, extreme cold) | Medium | Requires alert-capable API, notification system |
| **Indoor/outdoor comparison** | "It's 20C inside, 5C outside" - immediate context | Low | Combine thermostat data with weather |
| **Temperature trend indicator** | Arrow showing if temp is rising/falling | Low | Compare current vs. previous hour |
| **UV index** | Useful in summer for outdoor planning | Low | Standard API field |

### Location Settings

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Geolocation auto-detect** | Convenience, zero setup | Medium | Browser geolocation API + reverse geocoding |
| **Autocomplete city search** | Faster than typing full address | Medium | Requires geocoding API integration |
| **Multiple saved locations** | Summer house, vacation home | Medium | Firebase array, location selector |
| **Map-based location picker** | Visual, intuitive selection | High | Requires map library (Leaflet, Google Maps) |

### Dashboard Customization

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Drag-and-drop reordering** | Intuitive, modern interaction | Medium | Library like hello-pangea/dnd or dnd-kit |
| **Per-device card expansion toggle** | Choose compact vs. detailed per card | Medium | Additional state per device |
| **Dashboard layout presets** | "Heating mode" vs "Summer mode" | High | Multiple saved configurations |
| **Widget-based dashboard** | Add weather widget, clock widget, etc. | High | Significant architecture change |

---

## Anti-Features

Features to deliberately NOT build and why.

### Weather Display

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| **Minute-by-minute precipitation radar** | Overkill for heating decisions, high complexity | Link to weather app for detailed radar |
| **Historical weather data** | Not useful for current heating decisions | Focus on forecast only |
| **Weather comparison (year-over-year)** | Academic interest, not actionable | Keep it simple |
| **Air quality index (AQI)** | Scope creep, not heating-relevant | Can add later if requested |
| **Pollen count** | Scope creep, health app territory | Out of scope |
| **Weather-based automation triggers** | Complex, requires rule engine | Future milestone if needed |
| **Multiple weather providers** | Complexity for marginal accuracy gain | Pick one reliable provider |
| **Customizable weather card layout** | Over-engineering for ancillary feature | Fixed, well-designed layout |
| **Weather animations (rain effects, clouds)** | Battery drain, distraction on utility app | Static icons sufficient |
| **Full-screen weather view** | Users have dedicated weather apps for this | Card in dashboard is enough |

### Location Settings

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| **Location sharing with other users** | Privacy concern, not needed | Single-user location |
| **Address book of locations** | Overkill for single home | One location, simple override |
| **IP-based location fallback** | Unreliable (VPN, shared IP), creates confusion | Require explicit location or GPS |
| **Background location tracking** | Privacy invasive, battery drain, not needed | On-demand only |

### Dashboard Customization

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| **Free-form dashboard grid** | Complexity explosion, maintenance nightmare | Fixed card order only |
| **Card resize (small/medium/large)** | Design inconsistency, responsive breaks | Consistent card sizes |
| **Custom card colors/themes per device** | Design system violation, visual chaos | Use device registry colors |
| **Dashboard export/import** | Over-engineering, no real use case | Single saved configuration |
| **Multi-page dashboards** | Complexity, navigation confusion | Single dashboard, scrollable |
| **Dashboard templates marketplace** | Way out of scope | Fixed design |
| **Undo/redo for dashboard changes** | Nice but overkill for simple reordering | Save on change, manual revert in settings |

---

## Feature Dependencies

```
Weather Card Dependencies:
  Weather API setup → Current conditions display
  Weather API setup → Forecast display
  Geolocation API → Auto-detect location (optional)
  Geocoding API → City name autocomplete (optional)
  Firebase → Location persistence

Dashboard Customization Dependencies:
  Device Registry (exists) → Card visibility toggle
  Firebase → Order persistence
  Drag-drop library (optional) → Drag reorder
```

**Critical path:** Weather API is the only external dependency. Everything else builds on existing architecture.

---

## MVP Recommendation

For this milestone, prioritize:

### Must Have (Table Stakes)

1. **Weather card with current conditions**
   - Temperature, feels like, humidity, condition icon
   - 3-day forecast minimum
   - Loading/error states

2. **Location settings**
   - Manual city input (text field)
   - Persist to Firebase
   - Display current location in weather card

3. **Dashboard card order**
   - Settings page with simple up/down arrows or sortable list
   - Persist order to Firebase
   - Home page respects saved order

### Nice to Have (Differentiators for MVP)

4. **Geolocation auto-detect** (Medium complexity, high convenience)
   - "Use my location" button
   - Reverse geocode to city name
   - Fallback to manual input

5. **5-day forecast** (Low complexity, more value)
   - Extended forecast in weather card
   - Simple horizontal scroll

### Defer to Post-MVP

- Hourly forecast (Medium complexity)
- Weather alerts (Requires notification system)
- Drag-and-drop reordering (Low value for few cards)
- Multiple saved locations (Unlikely use case)
- Map-based location picker (High complexity)

---

## Integration with Existing Architecture

### Weather Card Placement

Following the Self-Contained Pattern from `docs/architecture.md`:

```jsx
// Weather card follows same pattern as device cards
<WeatherCard />

// Self-contained: all weather info inside one card
// Error states inside card, not separate banner
```

### Device Registry Extension

```javascript
// Can add weather as a "pseudo-device" or separate WIDGET_TYPES
// Recommendation: Separate, weather is not a controllable device

export const WIDGET_TYPES = {
  WEATHER: 'weather',
};

export const WIDGET_CONFIG = {
  [WIDGET_TYPES.WEATHER]: {
    id: 'weather',
    name: 'Meteo',
    icon: '☀️',
    enabled: true,
    position: 0, // First card
  },
};
```

### Dashboard Order Storage

```javascript
// Firebase schema extension
/users/{userId}/preferences/
  dashboardOrder: ['weather', 'stove', 'thermostat', 'lights', 'camera']
```

---

## Complexity Estimates

| Feature Set | Estimated Effort | Risk |
|-------------|------------------|------|
| Weather card (table stakes) | 4-6 hours | Low - standard API integration |
| Location settings (manual) | 2-3 hours | Low - Firebase CRUD |
| Location settings (geolocation) | 3-4 hours | Medium - browser API quirks |
| Dashboard order (settings page) | 3-4 hours | Low - Firebase + UI |
| Dashboard order (drag-drop) | 6-8 hours | Medium - library integration |

**Total MVP estimate:** 12-17 hours for table stakes + geolocation

---

## Smart Home Weather Context

### Why Weather Matters for Heating

Research indicates weather integration in smart home systems serves three key purposes:

1. **Proactive heating decisions** - Knowing a cold front is approaching allows pre-heating the home
2. **Energy optimization** - Avoid running heating when outdoor temp will rise
3. **At-a-glance context** - Quick reference without switching apps

### Better Thermostat Pattern

The Better Thermostat component for Home Assistant demonstrates the ideal integration:
- Combines room temperature sensor with weather forecasts
- Decides when to call for heat based on outdoor conditions
- Provides proactive rather than reactive heating

### Indoor/Outdoor Display Pattern

Smart home weather widgets often show indoor vs outdoor comparison:
- Thermostat shows: "20°C inside"
- Weather shows: "5°C outside"
- User instantly understands heating context

This pattern should be considered for the weather card design.

---

## Weather API Recommendation

Based on research, **Open-Meteo** is recommended:

| Criteria | Open-Meteo | OpenWeatherMap |
|----------|------------|----------------|
| **Free tier** | Unlimited (non-commercial) | 1,000 calls/day |
| **API key required** | No | Yes |
| **Data quality** | National weather services | Own data sources |
| **Commercial use** | Requires paid plan | Allowed with attribution |
| **Italian coverage** | Excellent (MET Norway, ECMWF) | Good |

**Recommendation:** Use Open-Meteo for development, evaluate for production.

For production, consider:
- Open-Meteo with API key for reliability
- OpenWeatherMap One Call 3.0 (free tier 1000/day is sufficient for personal use)

---

## Location UX Best Practices

Research highlights these patterns:

### Do
- Get location automatically when possible, without prompting
- Display the detected/selected location visibly ("Showing weather for Milan")
- Allow easy location change (not hidden in settings)
- Use reverse geocoding to show friendly names (not lat/long)
- Provide autocomplete for city search

### Don't
- Auto-geolocate without showing what was detected (creates confusion)
- Require multiple fields (street, city, state, zip)
- Use browser geolocation prompt immediately on page load
- Hide location settings deep in menus

### Recommended Flow
1. **First use:** Show manual input with "Use my location" button
2. **After selection:** Persist to Firebase, show location in weather card
3. **To change:** Tap location name in card to open settings, or via Settings menu

---

## Dashboard Customization UX Best Practices

Research highlights these patterns:

### Do
- Provide drag-and-drop for reordering (modern expectation)
- Save order automatically on change
- Show clear visual feedback during drag
- Allow hiding cards (toggle, not delete)

### Don't
- Require complex configuration to customize
- Use confusing icons (prefer clear "Edit layout" text)
- Allow free-form grid (creates maintenance nightmare)
- Forget mobile touch support for drag

### Home Assistant Pattern
Home Assistant 2024.3 introduced sections-based drag-and-drop:
- New "Sections" view layout type
- Clean grid that works with drag-drop
- Undo/redo support (up to 75 steps)
- Manual sorting of areas

**For this PWA:** Simpler approach sufficient:
- Settings page with sortable list
- Up/down buttons or touch-drag
- Save to Firebase
- Apply order on home page

---

## Sources

### Weather Features Research
- [Tomorrow.io - Smart Home Weather API](https://www.tomorrow.io/blog/how-the-smart-home-of-the-future-is-powered-by-weather-data/)
- [Home Assistant Weather Integration](https://www.home-assistant.io/integrations/weather)
- [Better Thermostat Component](https://github.com/KartoffelToby/better_thermostat)
- [Brilliant Smart Home Weather Widget](https://www.brilliant.tech/blogs/news/new-feature-weather-widget)
- [Weather Cards in Home Assistant](https://markus-haack.com/weather-cards-in-home-assistant-my-top-picks/)

### Dashboard Customization Research
- [Home Assistant Dashboard Drag-Drop](https://www.home-assistant.io/blog/2024/03/06/release-20243/)
- [Home Assistant Dashboard Chapter 1](https://www.home-assistant.io/blog/2024/03/04/dashboard-chapter-1/)
- [Smart Life App Dashboard](https://smart-life-app.com/the-new-smart-life-app-dashboard/)
- [SharpTools Dashboard](https://sharptools.io/features/dashboard)
- [Dashboard Anti-Patterns](https://startingblockonline.org/dashboard-anti-patterns-12-mistakes-and-the-patterns-that-replace-them/)
- [Dashboard UX Best Practices](https://www.designrush.com/agency/ui-ux-design/dashboard/trends/dashboard-ux)

### Location UX Research
- [UXmatters - Understanding Location](https://www.uxmatters.com/mt/archives/2018/03/understanding-location.php)
- [UX Booth - Progressive Location Filter](https://uxbooth.com/articles/designing-a-progressive-location-filter/)
- [Location-Based UX Patterns](https://workforceinstitute.io/ui-ux-design/what-is-location-based-ux/)

### Weather App UX Mistakes
- [Core77 - Good and Bad Design in Weather Apps](https://www.core77.com/posts/109456/Good-and-Bad-Design-in-Weather-Apps)
- [Weather Channel Reviews - User Complaints](https://the-weather-channel.pissedconsumer.com/review.html)

### Weather API Comparison
- [Visual Crossing - Best Weather API 2025](https://www.visualcrossing.com/resources/blog/best-weather-api-for-2025/)
- [Open-Meteo Pricing](https://open-meteo.com/en/pricing)
- [OpenWeatherMap Pricing](https://openweathermap.org/price)
