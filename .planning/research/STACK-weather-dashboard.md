# Technology Stack: Weather Component & Dashboard Customization

**Project:** Pannello Stufa - Weather & Layout Features
**Researched:** 2026-02-02
**Confidence:** HIGH

---

## Executive Summary

This document recommends stack additions for weather component and dashboard customization features. The existing stack (Next.js 16, Firebase Realtime Database, Auth0, CVA + Radix UI) is well-suited for these additions. **No new npm dependencies are required** - all features can be implemented with existing packages and native browser APIs.

---

## Recommended Stack Additions

### Weather API

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **Open-Meteo API** | N/A (REST) | Weather data | Free, no API key, no credit card, 16-day forecast, includes humidity/wind |

**Recommendation: Open-Meteo**

Open-Meteo is the clear choice for this project because:

1. **No API Key Required** - Simplifies deployment, no secrets management
2. **Free for Non-Commercial Use** - This is a personal smart home PWA
3. **No Credit Card** - Unlike OpenWeatherMap One Call 3.0, no payment method needed
4. **16-Day Forecast** - Exceeds the 3-5 day requirement
5. **Comprehensive Data** - Temperature, humidity, wind speed, precipitation, weather codes
6. **Fast** - Response times under 10ms, servers in Europe (good for Italian users)
7. **No Rate Limit Concerns** - Fair use policy of 10,000 calls/day is more than sufficient

**API Endpoint Structure:**
```
GET https://api.open-meteo.com/v1/forecast
  ?latitude={lat}
  &longitude={lon}
  &current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code
  &daily=temperature_2m_max,temperature_2m_min,weather_code,precipitation_probability_max
  &forecast_days=5
  &timezone=auto
```

**Weather Codes:** Open-Meteo uses WMO weather codes (0-99) which map to conditions like clear, cloudy, rain, snow, etc.

### Alternatives Considered (NOT Recommended)

| API | Why NOT |
|-----|---------|
| **OpenWeatherMap** | Free tier requires credit card for One Call 3.0; legacy 2.5 API being deprecated |
| **WeatherAPI.com** | Requires API key registration; rate limits unclear on free tier |
| **Tomorrow.io** | Only 500 calls/day free; overkill for simple weather display |
| **Netatmo Weather** | Would require users to own Netatmo weather station (not thermostat) |

### Geolocation

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **Browser Geolocation API** | Native | Get user coordinates | Built-in, no dependencies, PWA-supported |
| **Open-Meteo Geocoding API** | N/A (REST) | Location search/autocomplete | Same provider, no extra API key |

**Geolocation Approach: Native Browser API + Manual Override**

The browser's `navigator.geolocation` API is the correct choice because:

1. **No Dependencies** - Built into all modern browsers
2. **PWA Support** - Works in iOS Safari, Chrome, Firefox PWAs
3. **User Control** - iOS 14+ allows precise vs approximate location toggle
4. **HTTPS Required** - Already satisfied (Vercel deployment)

**Implementation Pattern:**
```javascript
// Get current position (one-time)
navigator.geolocation.getCurrentPosition(
  (position) => {
    const { latitude, longitude } = position.coords;
    // Use coordinates for weather API
  },
  (error) => {
    // Fall back to manual location entry
  },
  { enableHighAccuracy: false, timeout: 10000 }
);
```

**iOS Safari Considerations:**
- Geolocation works but may return 3-9km accuracy if user selects "Approximate Location"
- PWA standalone mode has a known bug where permission dialog may not appear
- Fallback to manual location entry is essential

**Reverse Geocoding for Display:**
Open-Meteo provides a geocoding API that can be used for:
1. **Location Search** - User types city name, get coordinates
2. **Display Name** - Convert coordinates to city name for UI

```
GET https://geocoding-api.open-meteo.com/v1/search?name={city}&count=5&language=it
```

No separate geocoding API needed - Open-Meteo handles both weather and location lookup.

### Dashboard Layout Storage

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **Firebase Realtime Database** | Existing | Store layout preferences | Already in use for devicePreferences; consistent pattern |

**Storage Approach: Extend Existing Firebase Schema**

The project already stores per-user device preferences at `devicePreferences/{userId}`. Layout order should follow the same pattern:

```javascript
// Proposed Firebase schema extension
dashboardLayout/{userId}: {
  order: ['stove', 'thermostat', 'weather', 'lights', 'camera'],
  weather: {
    location: {
      lat: 45.4642,
      lon: 9.1900,
      name: 'Milano',
      source: 'manual' | 'geolocation'
    }
  },
  updatedAt: 1706886400000
}
```

**Why NOT localStorage:**
- User preferences should sync across devices
- Consistent with existing devicePreferences pattern
- Already have Firebase infrastructure

**Why NOT Firestore:**
- Firebase Realtime Database already in use
- No need for complex queries
- Simple key-value storage is sufficient

### Dashboard Reordering (Menu-Based)

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **Existing UI Components** | N/A | Reorder interface | Toggle, Card, Button already available |

**Approach: Settings Page with Up/Down Buttons**

The constraint explicitly states "menu-based, NOT drag-drop". This is actually simpler to implement:

1. **Settings Page** - New page at `/settings/layout`
2. **List of Components** - Show current order with up/down arrows
3. **Save Button** - Persist to Firebase

**Implementation Pattern:**
```jsx
// Similar to existing /settings/devices page
function moveUp(index) {
  if (index === 0) return;
  const newOrder = [...order];
  [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
  setOrder(newOrder);
}
```

**Why NOT Drag-Drop Libraries:**
- Constraint says "menu-based"
- Up/down buttons work better on mobile
- No new dependencies (react-beautiful-dnd, dnd-kit, etc.)
- Simpler accessibility (keyboard navigation)

---

## What NOT to Add

| Technology | Reason |
|------------|--------|
| **Any weather npm package** | REST API calls with fetch are sufficient |
| **Geocoding library** | Open-Meteo geocoding API covers needs |
| **Drag-drop library** | Constraint specifies menu-based reordering |
| **Map library** | Not needed for simple location display |
| **Date library for weather** | date-fns already in dependencies |
| **State management (Redux, Zustand)** | React state + Firebase listeners sufficient |

---

## Integration with Existing Stack

### Next.js 16 App Router

Weather API calls should use:
- **Server Components** for initial render (SSR weather data)
- **Route Handlers** for client refresh (`/api/weather`)
- **`dynamic = 'force-dynamic'`** for real-time data

```javascript
// app/api/weather/route.js
export const dynamic = 'force-dynamic';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get('lat');
  const lon = searchParams.get('lon');

  const response = await fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&...`
  );
  return Response.json(await response.json());
}
```

### Firebase Integration

Follow existing patterns from `devicePreferencesService.js`:
- Use `adminDbGet`/`adminDbSet` for server-side writes
- Use `ref`, `get`, `onValue` for client reads
- Apply `filterUndefined()` for safe writes

### Design System

Weather component should use existing UI primitives:
- `Card` with `variant="glass"` for weather display
- `Text` with semantic variants for temperatures
- `Badge` for weather conditions
- `Skeleton` for loading states
- Lucide icons for weather symbols (already in dependencies)

---

## Environment Variables

**No new environment variables required.**

Open-Meteo requires no API key. All data storage uses existing Firebase configuration.

---

## API Rate Limits Summary

| API | Free Tier | Project Usage | Headroom |
|-----|-----------|---------------|----------|
| Open-Meteo Weather | 10,000/day (fair use) | ~100/day max | 100x |
| Open-Meteo Geocoding | Same fair use policy | ~10/day | 1000x |
| Firebase Realtime | Spark plan (1GB stored, 10GB/month transfer) | Already in use | Minimal additional |

---

## Browser Support

| Browser | Geolocation | Weather Display | Layout Settings |
|---------|-------------|-----------------|-----------------|
| iOS Safari (PWA) | Yes (with caveats) | Yes | Yes |
| Chrome (PWA) | Yes | Yes | Yes |
| Firefox | Yes | Yes | Yes |
| Safari Desktop | Yes | Yes | Yes |

**iOS Safari Caveats:**
- Geolocation permission dialog may not appear in standalone PWA mode (known WebKit bug)
- Workaround: Detect standalone mode, prompt user to open in Safari for location permission, then return to PWA
- Manual location entry is essential fallback

---

## Sources

### Weather APIs (HIGH confidence)
- [Open-Meteo Documentation](https://open-meteo.com/en/docs) - Official API docs, verified 2026-02-02
- [Open-Meteo About](https://open-meteo.com/en/about) - Licensing and usage terms
- [OpenWeatherMap Pricing](https://openweathermap.org/price) - Comparison reference
- [Best Weather APIs 2026](https://www.meteomatics.com/en/weather-api/best-weather-apis/) - Industry comparison

### Geolocation (HIGH confidence)
- [PWA Geolocation Demo](https://progressier.com/pwa-capabilities/geolocation) - Browser support verification
- [PWA iOS Limitations](https://brainhub.eu/library/pwa-on-ios) - iOS-specific considerations
- [firt.dev iOS 14 PWA](https://firt.dev/ios-14/) - Safari geolocation behavior

### Geocoding (MEDIUM confidence)
- [Open-Meteo Geocoding API](https://open-meteo.com/en/docs/geocoding-api) - Official docs
- [BigDataCloud Reverse Geocoding](https://www.bigdatacloud.com/free-api/free-reverse-geocode-to-city-api) - Alternative evaluated

### Dashboard Patterns (MEDIUM confidence)
- [KendoReact TileLayout](https://www.telerik.com/blogs/react-dashboard-tutorial-build-interactive-dashboard) - Pattern reference (not recommended for this use case)
- Existing codebase: `/app/settings/devices/page.js` - Toggle-based settings pattern

---

## Summary

| Category | Technology | Action |
|----------|------------|--------|
| Weather API | Open-Meteo | Add API route + component |
| Geolocation | Browser API | Use native `navigator.geolocation` |
| Geocoding | Open-Meteo Geocoding | Use for location search |
| Layout Storage | Firebase Realtime DB | Extend existing schema |
| Reorder UI | Existing components | Build settings page with up/down |
| New Dependencies | None | Zero new npm packages |

**Total npm additions: 0**
**Total new env vars: 0**
**Integration complexity: LOW** - All features use existing patterns and infrastructure.

---

**Last updated:** 2026-02-02
