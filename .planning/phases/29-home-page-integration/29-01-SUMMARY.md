---
phase: 29-home-page-integration
plan: 01
subsystem: frontend-dashboard
tags: [dashboard, weather, card-registry, preferences, home-page]
requires: [28-02-dashboard-settings, 27-02-weather-card, 26-01-weather-api]
provides: [integrated-home-page, card-order-rendering, weather-card-display]
affects: [future-card-additions, dashboard-customization-features]
tech-stack:
  added: []
  patterns: [card-registry, server-side-preferences-fetch]
key-files:
  created:
    - app/components/devices/weather/WeatherCardWrapper.js
  modified:
    - app/page.js
decisions:
  - id: card-components-registry
    decision: Use CARD_COMPONENTS object to map card IDs to React components
    rationale: Cleaner than if/else chain, easier to maintain and extend
    alternatives: [if-else-chain, switch-statement, dynamic-import]
  - id: server-side-preferences-fetch
    decision: Fetch dashboard preferences server-side using adminDbGet
    rationale: Home page is a Server Component, direct RTDB access is faster than API route
    alternatives: [client-side-fetch, api-route-proxy]
  - id: weather-card-wrapper
    decision: Create WeatherCardWrapper client component for data fetching
    rationale: WeatherCard remains pure presentation component, wrapper handles Firebase subscription and API calls
    alternatives: [server-side-weather-fetch, direct-weathercard-client]
metrics:
  duration: 2 minutes
  completed: 2026-02-03
---

# Phase 29 Plan 01: Home Page Integration Summary

**One-liner:** Home page now renders cards from dashboard preferences with card order/visibility control, includes WeatherCard via client wrapper with real-time location subscription and weather fetch.

## What Was Built

### 1. WeatherCardWrapper Client Component
Created `app/components/devices/weather/WeatherCardWrapper.js` as a client-side wrapper for WeatherCard:
- Subscribes to app-wide location changes via `subscribeToLocation` from Firebase RTDB
- Fetches weather forecast from `/api/weather/forecast?lat={lat}&lon={lon}` when location changes
- Manages loading, error, and retry states
- Passes `weatherData`, `locationName`, `isLoading`, `error`, and `onRetry` to WeatherCard
- Handles case where no location is configured (shows WeatherCard with null data)

**Pattern:** Client wrapper handles data fetching (Firebase + API), presentation component (WeatherCard) remains pure.

### 2. Home Page Card Registry
Updated `app/page.js` to render cards from dashboard preferences:
- **Removed:** `getEnabledDevicesForUser` (legacy device preferences)
- **Added:** `adminDbGet` to fetch dashboard preferences server-side
- **Added:** `DEFAULT_CARD_ORDER` fallback for new users
- **Added:** `CARD_COMPONENTS` registry mapping card IDs to React components:
  ```javascript
  const CARD_COMPONENTS = {
    stove: StoveCard,
    thermostat: ThermostatCard,
    weather: WeatherCardWrapper,
    lights: LightsCard,
    camera: CameraCard,
  };
  ```
- **Updated:** Render logic to use `visibleCards.map()` with registry lookup
- **Removed:** Legacy if/else chain and sonos placeholder

### 3. Dashboard Preferences Integration
Home page now:
- Fetches preferences from `users/${userId}/dashboardPreferences` (server-side)
- Falls back to `DEFAULT_CARD_ORDER` for new users (5 cards: stove, thermostat, weather, lights, camera)
- Filters cards by visibility (`card.visible !== false`)
- Renders cards in user's saved order
- Shows empty state if all cards are hidden

## Technical Achievements

### Card Registry Pattern
Replaced 50+ lines of if/else chain with clean registry lookup:
```javascript
// Before: if/else chain for each card type (52 lines)
if (device.id === 'stove') return <StoveCard />;
if (device.id === 'thermostat') return <ThermostatCard />;
// ...

// After: Registry lookup (13 lines)
const CardComponent = CARD_COMPONENTS[card.id];
if (!CardComponent) return null;
return <CardComponent />;
```

**Benefits:**
- Easier to add new cards (just add to registry)
- No code changes to render logic when adding cards
- Type-safe component references
- Cleaner, more maintainable code

### Server-Side Preferences Fetch
Home page remains a Server Component and fetches dashboard preferences directly from Firebase RTDB using Admin SDK:
```javascript
const dashboardPath = `users/${userId}/dashboardPreferences`;
const preferences = await adminDbGet(dashboardPath);
const cardOrder = preferences?.cardOrder || DEFAULT_CARD_ORDER;
```

**Benefits over API route:**
- Faster (no HTTP round-trip)
- Simpler (direct database access)
- Consistent with other server components in the app

### Client Wrapper Pattern
WeatherCardWrapper demonstrates the client wrapper pattern:
- **Server Component** (page.js) renders the wrapper
- **Client Component** (WeatherCardWrapper) handles subscriptions and API calls
- **Pure Presentation Component** (WeatherCard) receives props and renders UI

This pattern allows:
- Server-side rendering of page structure
- Client-side real-time data updates
- Clean separation of concerns

## Deviations from Plan

None - plan executed exactly as written.

## Decisions Made

### 1. Card Components Registry
**Decision:** Use `CARD_COMPONENTS` object to map card IDs to React components.

**Why:** Cleaner than if/else chain, easier to maintain and extend. When adding a new card, just add one line to registry instead of modifying render logic.

**Impact:** Sets pattern for all future card additions. Any new card just needs to be added to the registry.

### 2. Server-Side Preferences Fetch
**Decision:** Fetch dashboard preferences server-side using `adminDbGet` instead of API route.

**Why:** Home page is a Server Component, so direct RTDB access via Admin SDK is faster than creating an API route proxy.

**Trade-offs:** Admin SDK bypasses security rules, but home page already requires authentication at session level.

### 3. WeatherCard Wrapper
**Decision:** Create WeatherCardWrapper as client component for data fetching, keep WeatherCard as pure presentation.

**Why:** WeatherCard needs real-time Firebase subscription and API calls, which require client-side JavaScript. By creating a wrapper, WeatherCard remains reusable and testable.

**Alternative considered:** Make WeatherCard itself a client component with built-in data fetching, but that would reduce reusability (e.g., for testing or different data sources).

## Files Changed

### Created
- `app/components/devices/weather/WeatherCardWrapper.js` (83 lines)
  - Client wrapper for WeatherCard
  - Real-time location subscription
  - Weather forecast API fetching
  - Loading, error, and retry state management

### Modified
- `app/page.js` (-52 lines, +34 lines = net -18 lines)
  - Replaced legacy device preferences with dashboard preferences
  - Added CARD_COMPONENTS registry
  - Simplified render logic
  - Integrated WeatherCard

## Testing Notes

### Manual Verification Checklist
1. Start dev server: `npm run dev`
2. Open http://localhost:3000
3. Verify all 5 cards appear (stove, thermostat, weather, lights, camera)
4. Check card order matches dashboard preferences
5. If location is configured, WeatherCard should show weather data
6. If location not configured, WeatherCard should show "Nessun dato meteo disponibile"
7. Test card visibility by hiding cards in dashboard settings
8. Test card reordering via dashboard settings

### Browser Console
- No errors should appear
- WeatherCardWrapper should subscribe to location on mount
- Weather API fetch should trigger when location changes

## Next Phase Readiness

### Blockers
None.

### What's Next
Phase 29 complete. Weather card is now fully integrated into the home page with dashboard customization support. Future work:
- **Phase 30+:** Additional device integrations (if planned)
- **Dashboard enhancements:** Drag-and-drop card reordering
- **Weather enhancements:** Extended forecast view, weather alerts

### Related Work
- Dashboard settings page (Phase 28-02) provides UI for card customization
- Weather API (Phase 26) provides forecast data
- WeatherCard component (Phase 27) provides presentation layer
- Dashboard preferences service (Phase 28) provides data layer

## Commits

| Task | Commit | Files | Description |
|------|--------|-------|-------------|
| 1 | 4b095a3 | WeatherCardWrapper.js | Create client wrapper with location subscription and weather fetch |
| 2 | cc64621 | app/page.js | Render home page from dashboard preferences with card registry |

## Success Metrics

- ✅ WeatherCardWrapper.js exists with client-side location subscription and weather fetch
- ✅ Home page imports adminDbGet and DEFAULT_CARD_ORDER
- ✅ CARD_COMPONENTS registry maps all 5 card IDs to components
- ✅ getEnabledDevicesForUser is no longer imported or used
- ✅ Cards render in order from dashboard preferences
- ✅ Hidden cards (visible: false) are filtered out
- ✅ New users see all 5 cards in default order
- ✅ Code is cleaner (-18 lines net) and more maintainable

## Knowledge for Future Sessions

### Card Registry Pattern
When adding a new card:
1. Create the card component in `app/components/devices/{device-name}/`
2. Add entry to `CARD_COMPONENTS` registry in `app/page.js`
3. Add card config to `DEFAULT_CARD_ORDER` in `lib/services/dashboardPreferencesService.js`
4. No changes to render logic needed

### Client Wrapper Pattern
For cards that need real-time data or API calls:
1. Create `{CardName}Wrapper.js` as 'use client' component
2. Handle subscriptions and API fetching in wrapper
3. Pass data as props to presentation component
4. Add wrapper to CARD_COMPONENTS registry (not the presentation component)

### Dashboard Preferences
- Path: `users/${userId}/dashboardPreferences`
- Structure: `{ cardOrder: [...], updatedAt: timestamp }`
- Each card: `{ id, label, icon, visible }`
- Home page reads server-side via adminDbGet
- Dashboard settings reads/writes client-side via dashboardPreferencesService
