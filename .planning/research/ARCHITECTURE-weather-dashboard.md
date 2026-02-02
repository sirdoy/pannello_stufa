# Architecture Patterns: Weather Component and Dashboard Customization

**Project:** Pannello Stufa - Smart Home PWA
**Researched:** 2026-02-02
**Confidence:** HIGH (based on existing codebase patterns)

## Executive Summary

This research analyzes how to integrate a WeatherCard component and dashboard customization into the existing Next.js 15 App Router architecture. The existing codebase follows a well-established Service + Repository pattern with a centralized Device Registry. The weather and dashboard features should follow these same patterns for consistency.

**Key findings:**
- WeatherCard follows existing DeviceCard/SmartHomeCard component hierarchy
- Weather data fetched via API route with server-side caching + client-side SWR
- Dashboard order stored in Firebase user preferences (extends existing pattern)
- Location settings leverage existing geofencing infrastructure
- Open-Meteo API recommended (free, no API key, CORS support)

## Recommended Architecture

### Component Hierarchy

```
app/
  page.js                          # Home page (Server Component)
  components/
    devices/
      weather/
        WeatherCard.js             # NEW: Client component for weather display
    ui/
      SortableGrid.js              # NEW: Drag-drop wrapper for Grid component

lib/
  weather/
    api.js                         # NEW: Weather API client (Open-Meteo)
    service.js                     # NEW: Weather data service with caching
  locationService.js               # NEW: User location preferences
  dashboardPreferencesService.js   # NEW: Dashboard order preferences

app/api/
  weather/
    forecast/route.js              # NEW: Weather forecast endpoint
  user/
    location/route.js              # NEW: User location settings endpoint
    dashboard/route.js             # NEW: Dashboard order settings endpoint

app/settings/
  dashboard/page.js                # NEW: Dashboard customization page
  location/page.js                 # NEW: Home location settings page
```

### Component Boundaries

| Component | Responsibility | Communicates With |
|-----------|---------------|-------------------|
| `WeatherCard` | Display weather, handle loading/error states | `/api/weather/forecast` |
| `SortableGrid` | Wrap Grid with drag-drop sorting capability | Dashboard preferences service |
| `app/page.js` | Render cards in user-preferred order | devicePreferencesService, dashboardPreferencesService |
| `/api/weather/forecast` | Fetch from Open-Meteo, cache response | Open-Meteo API |
| `/api/user/location` | CRUD for home location | Firebase RTDB |
| `/api/user/dashboard` | CRUD for card order | Firebase RTDB |

## Pattern: WeatherCard as Non-Device Card

### Differentiation from Device Cards

WeatherCard is NOT a device - it's an **info card**. Key differences:

| Aspect | Device Cards | WeatherCard |
|--------|-------------|-------------|
| Connection state | Has connected/disconnected | Always "connected" (API-based) |
| Controls | Yes (buttons, sliders) | No controls (display only) |
| Device Registry | Listed in DEVICE_CONFIG | NOT in DEVICE_CONFIG |
| Preferences storage | `devicePreferences/{userId}` | `dashboardPreferences/{userId}/enabledCards` |

### Component Implementation Pattern

Follow existing DeviceCard structure but simplified:

```
WeatherCard.js
  - Client component ('use client')
  - Uses SmartHomeCard base (NOT DeviceCard)
  - Fetches via SWR hook from /api/weather/forecast
  - Displays: current temp, conditions, forecast preview
  - No connection state, no controls area
  - Error handling: graceful degradation with retry
```

**Why SmartHomeCard not DeviceCard:**
DeviceCard adds device-specific features (connection state, controls, info boxes) that weather doesn't need. SmartHomeCard provides the visual container without device semantics.

## Pattern: Weather API Route

### Server-Side Caching Strategy

```
/api/weather/forecast/route.js

Request flow:
1. Check if location provided (lat/lon query params)
2. If no location, return error
3. Fetch from Open-Meteo with Next.js fetch cache
4. Return standardized response

Caching layers:
- Next.js fetch: { next: { revalidate: 900 } } // 15 minutes
- Client SWR: refreshInterval: 900000 // 15 minutes
```

**Why this caching approach:**

| Layer | Purpose | Duration |
|-------|---------|----------|
| Next.js fetch cache | Reduce API calls across all users with same location | 15 minutes |
| SWR client cache | Instant UI updates, background revalidation | 15 minutes |

Weather data doesn't change rapidly; 15-minute cache balances freshness with API efficiency.

### Open-Meteo Integration

**Selected API:** [Open-Meteo](https://open-meteo.com/) - free, no API key, CORS-enabled.

```javascript
// lib/weather/api.js
const BASE_URL = 'https://api.open-meteo.com/v1/forecast';

export async function getWeatherForecast(lat, lon) {
  const params = new URLSearchParams({
    latitude: lat,
    longitude: lon,
    current: 'temperature_2m,weather_code,relative_humidity_2m,wind_speed_10m',
    daily: 'weather_code,temperature_2m_max,temperature_2m_min',
    timezone: 'auto',
    forecast_days: 5,
  });

  const response = await fetch(`${BASE_URL}?${params}`, {
    next: { revalidate: 900 }, // 15-minute server cache
  });

  return response.json();
}
```

**Why Open-Meteo:**
- No API key required (simplifies deployment)
- No rate limiting for reasonable usage (< 10K/day)
- CORS-enabled (can call from client if needed)
- High accuracy from multiple weather models
- Includes geocoding API for city search

## Pattern: Dashboard Order Preferences

### Firebase Schema Extension

```
firebase-root/
  dashboardPreferences/{userId}/
    cardOrder: ['stove', 'thermostat', 'weather', 'lights', 'camera']
    enabledCards: ['stove', 'thermostat', 'weather', 'lights']
    location: {
      latitude: 45.1234,
      longitude: 7.5678,
      name: 'Torino',
      source: 'geolocation' | 'manual',
      updatedAt: '2026-02-02T10:00:00Z'
    }
```

**Why separate from devicePreferences:**
- devicePreferences tracks device enable/disable (hardware)
- dashboardPreferences tracks display preferences (UI)
- Separation allows adding info cards (weather) without polluting device registry

### Service Pattern

```javascript
// lib/dashboardPreferencesService.js

// Mirrors existing devicePreferencesService.js pattern
export async function getDashboardPreferences(userId) {
  // Returns { cardOrder: [], enabledCards: [], location: {} }
}

export async function updateCardOrder(userId, order) {
  // Updates cardOrder array
}

export async function updateEnabledCards(userId, enabled) {
  // Updates enabledCards array
}

export async function updateLocation(userId, location) {
  // Updates location object
}
```

## Pattern: Location Settings

### Leveraging Existing Geofencing

The project already has geofencing infrastructure:
- `lib/pwa/geofencing.js` - Geolocation API utilities
- `lib/hooks/useGeofencing.js` - React hook for location

**Reuse for weather:**
```javascript
// In location settings page
import { getCurrentPosition } from '@/lib/pwa/geofencing';

// Get current location button uses existing utility
const handleGetCurrentLocation = async () => {
  const position = await getCurrentPosition();
  setLocation({
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
    source: 'geolocation',
  });
};
```

### Location Storage Decision

**Option A:** Store in Firebase (server-side)
- Pros: Available across devices, persists with user account
- Cons: Requires API call to fetch

**Option B:** Store in IndexedDB (client-side)
- Pros: Instant access, works offline
- Cons: Per-device, not synced

**Recommendation:** Firebase (server-side) for consistency with other preferences. Location rarely changes, so the API call overhead is minimal.

## Pattern: Sortable Dashboard

### Library Selection: @dnd-kit/sortable

**Recommended:** [@dnd-kit](https://docs.dndkit.com/) with @dnd-kit/sortable

**Why dnd-kit:**
- Modern React hooks-based API
- Lightweight (~10kb core)
- Excellent accessibility support
- Supports grid layouts natively
- Active maintenance (2026)

**Not recommended:**
- react-beautiful-dnd - Deprecated by Atlassian
- react-dnd - More complex, lower-level API
- react-grid-layout - Overkill for simple reordering

### Implementation Approach

```
SortableGrid.js wraps existing Grid component:

<SortableGrid
  items={cardOrder}
  onReorder={(newOrder) => updateCardOrder(newOrder)}
>
  {/* Cards rendered by app/page.js */}
</SortableGrid>
```

**Key insight:** Don't modify Grid component. Create wrapper that adds sortability.

## Data Flow

### Weather Data Flow

```
1. User opens home page (/)
2. page.js (Server Component):
   - Fetches user dashboard preferences (cardOrder, enabledCards, location)
   - Passes location to WeatherCard as prop
3. WeatherCard (Client Component) mounts:
   - SWR hook fetches /api/weather/forecast?lat=X&lon=Y
   - Shows loading skeleton during fetch
4. /api/weather/forecast:
   - Checks Next.js fetch cache (15-min TTL)
   - If miss: fetches from Open-Meteo
   - Returns { current, daily } weather data
5. WeatherCard displays:
   - Current temperature, conditions, icon
   - 5-day forecast preview
6. SWR revalidates every 15 minutes in background
```

### Dashboard Reorder Flow

```
1. User navigates to /settings/dashboard
2. Page loads current cardOrder from API
3. User drags card to new position
4. onDragEnd handler:
   - Optimistic UI update (instant reorder)
   - POST /api/user/dashboard with new order
5. API updates Firebase dashboardPreferences
6. On next visit to home page:
   - page.js fetches updated cardOrder
   - Renders cards in new order
```

### Location Settings Flow

```
1. User navigates to /settings/location
2. Page loads current location from API (if set)
3. User either:
   a. Clicks "Use Current Location":
      - getCurrentPosition() from geofencing.js
      - Shows coordinates on map preview
   b. Enters city name manually:
      - Calls Open-Meteo Geocoding API
      - Selects from search results
4. User saves:
   - POST /api/user/location with lat/lon/name
5. Location used by:
   - WeatherCard for forecast
   - Future: time-based automations
```

## Scalability Considerations

| Concern | Current (1 user) | At 100 users | At 10K users |
|---------|------------------|--------------|--------------|
| Weather API calls | Direct to Open-Meteo | Direct (< 10K/day limit) | Need edge caching or paid tier |
| Firebase reads | ~5 per page load | ~500 per page load | Consider RTDB pricing |
| Drag-drop UX | Instant | Instant | Instant (client-side only) |

**Mitigation for scale:**
- Weather: Add Vercel Edge Config or KV for shared cache across users with same location
- Firebase: Dashboard preferences rarely change; aggressive client caching with SWR

## Build Order (Dependencies)

```
Phase 1: Foundation (no dependencies)
  1.1 lib/weather/api.js - Open-Meteo client
  1.2 lib/locationService.js - Location CRUD
  1.3 lib/dashboardPreferencesService.js - Dashboard CRUD

Phase 2: API Routes (depends on Phase 1)
  2.1 /api/weather/forecast - Weather endpoint
  2.2 /api/user/location - Location endpoint
  2.3 /api/user/dashboard - Dashboard order endpoint

Phase 3: Components (depends on Phase 2)
  3.1 WeatherCard - Weather display component
  3.2 Settings pages (location, dashboard)

Phase 4: Home Page Integration (depends on Phase 3)
  4.1 Update app/page.js to render WeatherCard
  4.2 Add SortableGrid wrapper

Phase 5: Drag-Drop (can be deferred)
  5.1 Add @dnd-kit packages
  5.2 Implement SortableGrid
  5.3 Connect to settings page
```

## Anti-Patterns to Avoid

### Anti-Pattern 1: Adding Weather to Device Registry
**What:** Adding weather as DEVICE_TYPE in deviceTypes.js
**Why bad:** Weather is not a controllable device; pollutes device semantics
**Instead:** Use separate dashboardPreferences for card management

### Anti-Pattern 2: Client-Side Weather Fetching
**What:** Calling Open-Meteo directly from WeatherCard
**Why bad:** Exposes API patterns to client, no server-side caching
**Instead:** API route with server-side caching + SWR client cache

### Anti-Pattern 3: Storing Card Order in Local State Only
**What:** Using React state or localStorage for card order
**Why bad:** Not persisted across devices, lost on logout
**Instead:** Firebase storage with optimistic UI updates

### Anti-Pattern 4: Modifying Grid Component for Sorting
**What:** Adding drag-drop logic directly into Grid.js
**Why bad:** Violates single responsibility, breaks existing usages
**Instead:** Create SortableGrid wrapper component

### Anti-Pattern 5: Coupling Weather to Geofencing
**What:** Requiring geofencing setup to display weather
**Why bad:** Weather should work with manual location entry too
**Instead:** Location service with multiple sources (geo/manual)

## Sources

### Official Documentation (HIGH confidence)
- [Next.js Data Fetching](https://nextjs.org/docs/app/getting-started/fetching-data)
- [SWR with Next.js](https://swr.vercel.app/docs/with-nextjs)
- [@dnd-kit Sortable](https://docs.dndkit.com/presets/sortable)
- [Open-Meteo API](https://open-meteo.com/)

### Existing Codebase (HIGH confidence)
- `/Users/federicomanfredi/Sites/localhost/pannello-stufa/docs/architecture.md`
- `/Users/federicomanfredi/Sites/localhost/pannello-stufa/.planning/codebase/ARCHITECTURE.md`
- `/Users/federicomanfredi/Sites/localhost/pannello-stufa/lib/devicePreferencesService.js`
- `/Users/federicomanfredi/Sites/localhost/pannello-stufa/lib/pwa/geofencing.js`
- `/Users/federicomanfredi/Sites/localhost/pannello-stufa/app/components/ui/DeviceCard.js`

### Community Patterns (MEDIUM confidence)
- [Next.js Caching Guide 2026](https://dev.to/marufrahmanlive/nextjs-caching-and-rendering-complete-guide-for-2026-ij2)
- [dnd-kit for Dashboard Grids](https://puckeditor.com/blog/top-5-drag-and-drop-libraries-for-react)

---

*Architecture research: 2026-02-02*
