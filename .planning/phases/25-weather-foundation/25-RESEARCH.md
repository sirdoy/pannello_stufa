# Phase 25: Weather Foundation - Research

**Researched:** 2026-02-02
**Domain:** Weather API integration, geolocation, Next.js API caching
**Confidence:** HIGH

## Summary

Phase 25 establishes weather infrastructure using Open-Meteo (free, no API key required) for weather data, browser Geolocation API with iOS PWA fallback handling, and stale-while-revalidate caching with 15-minute TTL. The architecture uses a single shared location stored in Firebase RTDB at `/config/location`, simplifying cache strategy to a single entry. Real-time sync ensures location changes propagate to all connected clients immediately.

The standard approach combines Next.js 15 API routes with in-memory caching (JavaScript Map with TTL), Open-Meteo's forecast endpoint for current conditions and 5-day forecast, and Firebase RTDB for location persistence. The project already has established patterns for API responses, Firebase operations, and error handling that should be followed.

**Primary recommendation:** Use Open-Meteo forecast API with in-memory Map cache (single entry for shared location), browser Geolocation API with 10-second timeout, and Firebase RTDB for location storage at `/config/location`.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Open-Meteo API | v1 | Weather data provider | Free, no API key, high resolution (1-11km), 16-day forecasts, 80+ years historical data |
| Next.js API Routes | 15.5 | Backend API layer | Already in project (16.1.0), native to Next.js, no additional dependencies |
| Browser Geolocation API | Native | Location detection | Built into all modern browsers, no library needed, works in PWAs |
| Firebase RTDB | 12.8.0 | Location persistence | Already in project, real-time sync, existing patterns established |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| JavaScript Map | Native | In-memory cache | Single cache entry, simple TTL tracking, no library overhead |
| date-fns | 4.1.0 | Date/time utilities | Already in project, timestamp formatting, age calculation |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Open-Meteo | OpenWeatherMap | Requires API key, free tier limited to 1000 calls/day |
| In-memory Map | node-cache library | Adds dependency for single-entry cache, unnecessary complexity |
| Firebase RTDB | Cache in Firebase | Increases Firebase reads, adds latency, defeats cache purpose |

**Installation:**
```bash
# No new dependencies needed - all libraries already in project
```

## Architecture Patterns

### Recommended Project Structure
```
app/api/weather/
├── forecast/
│   └── route.js          # GET /api/weather/forecast?lat=X&lon=Y
lib/
├── openMeteo.js          # API wrapper, weather code interpretation
├── geolocation.js        # Browser geolocation utility with iOS handling
└── weatherCache.js       # In-memory cache with TTL and stale-while-revalidate
```

### Pattern 1: Stale-While-Revalidate Caching
**What:** Return stale cache immediately while refreshing in background
**When to use:** Weather data where slight staleness (15 min) is acceptable
**Example:**
```javascript
// lib/weatherCache.js
const cache = new Map(); // Single entry: 'location:lat,lon'
const CACHE_TTL = 15 * 60 * 1000; // 15 minutes

export async function getCachedWeather(lat, lon, fetchFn) {
  const key = `location:${lat},${lon}`;
  const cached = cache.get(key);

  // Return stale immediately if exists
  if (cached) {
    const age = Date.now() - cached.timestamp;

    // If stale (>15min), trigger background refresh
    if (age > CACHE_TTL) {
      fetchFn(lat, lon).then(fresh => {
        cache.set(key, { data: fresh, timestamp: Date.now() });
      }).catch(err => console.error('Background refresh failed:', err));
    }

    return { data: cached.data, cachedAt: cached.timestamp, stale: age > CACHE_TTL };
  }

  // No cache - fetch and cache
  const fresh = await fetchFn(lat, lon);
  cache.set(key, { data: fresh, timestamp: Date.now() });
  return { data: fresh, cachedAt: Date.now(), stale: false };
}
```

### Pattern 2: Geolocation with iOS PWA Fallback
**What:** Browser geolocation with 10-second timeout and specific error handling
**When to use:** Any location-based feature needing user position
**Example:**
```javascript
// lib/geolocation.js
export async function getCurrentLocation() {
  if (!navigator.geolocation) {
    throw new Error('GEOLOCATION_NOT_SUPPORTED');
  }

  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (position) => resolve({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy
      }),
      (error) => {
        // Map error codes to specific messages
        const errorMap = {
          1: 'PERMISSION_DENIED',
          2: 'POSITION_UNAVAILABLE',
          3: 'TIMEOUT'
        };
        reject(new Error(errorMap[error.code] || 'UNKNOWN_ERROR'));
      },
      {
        enableHighAccuracy: false, // Faster, less battery
        timeout: 10000,            // 10 seconds (from requirements)
        maximumAge: 300000         // 5 minutes cached position acceptable
      }
    );
  });
}
```

### Pattern 3: Firebase Location Storage with Real-Time Sync
**What:** Single shared location at `/config/location` with real-time updates
**When to use:** App-wide shared configuration that needs real-time sync
**Example:**
```javascript
// Server-side write (API route)
import { adminDbSet } from '@/lib/firebaseAdmin';
await adminDbSet('config/location', {
  latitude: 45.4642,
  longitude: 9.1900,
  name: 'Milano, Italy',
  updatedAt: Date.now(),
  updatedBy: userId
});

// Client-side listen (component)
import { ref, onValue } from 'firebase/database';
import { db } from '@/lib/firebase';

useEffect(() => {
  const unsubscribe = onValue(ref(db, 'config/location'), (snapshot) => {
    setLocation(snapshot.val());
  });
  return () => unsubscribe();
}, []);
```

### Pattern 4: Open-Meteo API Call Structure
**What:** Fetch current + 5-day forecast in single request
**When to use:** All weather data fetching
**Example:**
```javascript
// lib/openMeteo.js
export async function fetchWeatherForecast(latitude, longitude) {
  const params = new URLSearchParams({
    latitude: latitude.toFixed(4),
    longitude: longitude.toFixed(4),
    current: 'temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weather_code',
    daily: 'weather_code,temperature_2m_max,temperature_2m_min',
    forecast_days: '5',
    timezone: 'auto'
  });

  const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`);

  if (!response.ok) {
    throw new Error(`Open-Meteo API error: ${response.status}`);
  }

  return response.json();
}
```

### Pattern 5: Project API Response Consistency
**What:** Use existing `@/lib/core` response utilities
**When to use:** All API route responses
**Example:**
```javascript
// app/api/weather/forecast/route.js
import { success, badRequest, error } from '@/lib/core';
import { withAuthAndErrorHandler } from '@/lib/core';

export const dynamic = 'force-dynamic';

export const GET = withAuthAndErrorHandler(async (request) => {
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get('lat');
  const lon = searchParams.get('lon');

  if (!lat || !lon) {
    return badRequest('Missing latitude or longitude');
  }

  try {
    const weatherData = await getCachedWeather(lat, lon, fetchWeatherForecast);
    return success(weatherData);
  } catch (err) {
    return error('Failed to fetch weather', 'WEATHER_API_ERROR', 500);
  }
}, 'Weather/Forecast');
```

### Anti-Patterns to Avoid
- **Per-user caching:** Single shared location means single cache entry, don't create user-specific caches
- **Firebase for cache storage:** Defeats purpose of caching, adds latency and Firebase read costs
- **Edge Runtime with Firebase:** Firebase SDK incompatible with Edge Runtime, use `dynamic = 'force-dynamic'`
- **Immediate page-load geolocation:** Poor UX, request location only when user clicks location button
- **Infinite geolocation timeout:** Default is `Infinity`, always set explicit timeout (10 seconds)
- **High accuracy mode for weather:** Drains battery, city-level accuracy sufficient for weather

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Weather code interpretation | Custom mapping of 0-99 codes | WMO standard mapping (GitHub Gist) | 99 codes with day/night variants, icon URLs, localized descriptions |
| Geolocation error handling | Generic error messages | Specific error codes (PERMISSION_DENIED, TIMEOUT, UNAVAILABLE) | iOS PWA has unique permission issues, users need actionable messages |
| Stale-while-revalidate | Custom background refresh logic | Standard SWR pattern with Promise.then() | Prevents blocking on stale data, handles errors gracefully |
| Date freshness calculation | Manual timestamp math | date-fns `formatDistanceToNow()` | Handles edge cases, localization, human-readable output |
| Coordinate validation | Regex or manual checks | Numeric range check (lat: -90 to 90, lon: -180 to 180) | Simple, sufficient, no library needed |

**Key insight:** Weather APIs have subtle complexities (timezone handling, unit conversions, weather code interpretations) that are already solved. Don't reinvent - use Open-Meteo's built-in timezone support and WMO standard codes.

## Common Pitfalls

### Pitfall 1: iOS PWA Geolocation Permission State Inconsistency
**What goes wrong:** iOS reports permission state as "prompt" when it's actually "denied", causing infinite loops
**Why it happens:** Safari's location permission setting doesn't sync with `navigator.permissions.query()` state
**How to avoid:** Don't rely on `navigator.permissions.query()` for iOS. Use `getCurrentPosition()` error callback directly
**Warning signs:** User reports "location button doesn't work" on iOS, console shows repeated permission requests
**Source:** [PWA iOS Limitations Safari Support](https://www.magicbell.com/blog/pwa-ios-limitations-safari-support-complete-guide)

### Pitfall 2: Cache Key Coordinate Precision Mismatch
**What goes wrong:** Cache misses because `45.4642` vs `45.464199999` treated as different locations
**Why it happens:** Floating point precision from different sources (GPS, geocoding, manual entry)
**How to avoid:** Round coordinates to 4 decimal places (~11m precision) for cache keys
**Warning signs:** Cache hit rate near 0% despite same location, API calls every request

### Pitfall 3: Stale Data Without Background Refresh Trigger
**What goes wrong:** Stale data returned but never refreshed because no subsequent request triggers update
**Why it happens:** Background refresh only triggers when stale cache accessed, not automatically
**How to avoid:** Either (a) accept eventual freshness on next access, or (b) add setInterval cleanup for truly critical data
**Warning signs:** Weather data stuck at 15-minute-old values for hours when no user activity

### Pitfall 4: Open-Meteo Rate Limiting Without Detection
**What goes wrong:** API starts failing silently after exceeding 10,000 requests/day
**Why it happens:** No explicit rate limit headers, documentation says "contact us" at 10k/day
**How to avoid:** Monitor request count per day in Firebase (`weatherApiStats/requestsToday`), alert at 8,000
**Warning signs:** Weather suddenly stops working for all users, Open-Meteo returns 429 or 503

### Pitfall 5: Timezone Mismatch Between API and Display
**What goes wrong:** Forecast shows "tomorrow's weather" at 11 PM because API uses UTC
**Why it happens:** Open-Meteo returns times in specified timezone, but default is UTC
**How to avoid:** Always pass `timezone=auto` parameter to Open-Meteo (uses location's local timezone)
**Warning signs:** Hourly forecast times don't match user's clock, daily forecasts shift unexpectedly

### Pitfall 6: Missing Firebase Security Rule for `/config/location`
**What goes wrong:** Client can't read location, API route writes fail silently
**Why it happens:** Firebase Security Rules not updated to allow read access to new path
**How to avoid:** Add rule: `"/config": { ".read": "auth != null" }` and deploy with `firebase deploy --only database`
**Warning signs:** Console shows `PERMISSION_DENIED` on client, weather card shows "Location not set" despite being configured

## Code Examples

Verified patterns from official sources:

### Open-Meteo API Call (Current + 5-day Forecast)
```javascript
// Source: https://open-meteo.com/en/docs
const url = new URL('https://api.open-meteo.com/v1/forecast');
url.searchParams.set('latitude', '45.4642');
url.searchParams.set('longitude', '9.1900');
url.searchParams.set('current', 'temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weather_code');
url.searchParams.set('daily', 'weather_code,temperature_2m_max,temperature_2m_min');
url.searchParams.set('forecast_days', '5');
url.searchParams.set('timezone', 'auto'); // CRITICAL: Use location's timezone

const response = await fetch(url.toString());
const data = await response.json();

// Response structure:
// {
//   current: { time, temperature_2m, apparent_temperature, ... },
//   daily: { time: ['2026-02-02', ...], temperature_2m_max: [...], ... },
//   current_units: { temperature_2m: '°C', ... }
// }
```

### WMO Weather Code Interpretation
```javascript
// Source: https://gist.github.com/stellasphere/9490c195ed2b53c707087c8c2db4ec0c
const WMO_CODES = {
  0: { description: 'Clear sky', icon: '01' },
  1: { description: 'Mainly clear', icon: '02' },
  2: { description: 'Partly cloudy', icon: '03' },
  3: { description: 'Overcast', icon: '04' },
  45: { description: 'Fog', icon: '50' },
  48: { description: 'Depositing rime fog', icon: '50' },
  51: { description: 'Light drizzle', icon: '09' },
  53: { description: 'Moderate drizzle', icon: '09' },
  55: { description: 'Dense drizzle', icon: '09' },
  61: { description: 'Slight rain', icon: '10' },
  63: { description: 'Moderate rain', icon: '10' },
  65: { description: 'Heavy rain', icon: '10' },
  71: { description: 'Slight snow', icon: '13' },
  73: { description: 'Moderate snow', icon: '13' },
  75: { description: 'Heavy snow', icon: '13' },
  95: { description: 'Thunderstorm', icon: '11' },
  // ... full mapping in research sources
};

export function interpretWeatherCode(code) {
  return WMO_CODES[code] || { description: 'Unknown', icon: '01' };
}
```

### Geolocation with Error Handling
```javascript
// Source: https://developer.mozilla.org/en-US/docs/Web/API/Geolocation/getCurrentPosition
function getLocation() {
  const options = {
    enableHighAccuracy: false, // Faster, less battery
    timeout: 10000,            // 10 seconds (requirement: INFRA-04)
    maximumAge: 300000         // 5 min cache acceptable
  };

  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      position => resolve({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy
      }),
      error => {
        const errorMessages = {
          [error.PERMISSION_DENIED]: 'Location permission denied',
          [error.POSITION_UNAVAILABLE]: 'Location unavailable',
          [error.TIMEOUT]: 'Location request timed out'
        };
        reject(new Error(errorMessages[error.code] || 'Unknown error'));
      },
      options
    );
  });
}
```

### In-Memory Cache with TTL
```javascript
// Simplified pattern from: https://ericnish.io/blog/simple-in-memory-cache-for-node-js
const cache = new Map();
const TTL = 15 * 60 * 1000; // 15 minutes

export function getCached(key) {
  const entry = cache.get(key);
  if (!entry) return null;

  const age = Date.now() - entry.timestamp;
  return {
    data: entry.data,
    timestamp: entry.timestamp,
    stale: age > TTL
  };
}

export function setCache(key, data) {
  cache.set(key, {
    data,
    timestamp: Date.now()
  });
}
```

### Firebase Config Pattern (Existing Project Pattern)
```javascript
// Server-side write (matches project pattern from api-routes.md)
import { adminDbSet } from '@/lib/firebaseAdmin';
import { getEnvironmentPath } from '@/lib/environmentHelper';

const locationPath = getEnvironmentPath('config/location');
await adminDbSet(locationPath, {
  latitude: 45.4642,
  longitude: 9.1900,
  name: 'Milano, Italy',
  updatedAt: Date.now()
});

// Client-side read (matches project pattern from firebase.md)
import { ref, onValue } from 'firebase/database';
import { db } from '@/lib/firebase';

const locationPath = 'config/location'; // Dev: 'dev/config/location'
const locationRef = ref(db, locationPath);
const unsubscribe = onValue(locationRef, (snapshot) => {
  setLocation(snapshot.val());
});
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Fetch caching off by default | Next.js 15: No caching by default | Next.js 15 (Oct 2024) | Must explicitly cache with `cache: 'force-cache'` or custom solution |
| GET Route Handlers cached | Next.js 15: Dynamic by default | Next.js 15 (Oct 2024) | Must add `export const dynamic = 'force-static'` for caching |
| OpenWeatherMap free tier | Open-Meteo standard | Ongoing (2024-2026) | No API key needed, unlimited non-commercial use |
| node-cache library | Native Map for simple caches | Ongoing best practice | No dependency for single-entry caches, faster |

**Deprecated/outdated:**
- **Next.js 14 automatic fetch caching:** Next.js 15 changed default to no caching, must explicitly opt-in
- **`getServerSideProps` for API calls:** App Router uses Server Components and API routes, not page-level data fetching
- **OpenWeatherMap free tier:** Open-Meteo offers better terms (no API key, higher limits) for non-commercial use

**Sources:**
- [Next.js 15 Breaking Cache Changes](https://medium.com/@weijunext/next-js-15-introduces-breaking-cache-strategy-changes-a594e3b504df)
- [Next.js Caching Guide 2026](https://dev.to/marufrahmanlive/nextjs-caching-and-rendering-complete-guide-for-2026-ij2)

## Open Questions

Things that couldn't be fully resolved:

1. **Cache storage location trade-off**
   - What we know: In-memory Map is fastest, Firebase RTDB enables multi-instance sharing
   - What's unclear: Whether app will scale to multiple server instances (Vercel serverless functions)
   - Recommendation: Start with in-memory Map (simpler). If deploying to multi-instance environment, cache misses won't break functionality (just extra API calls). Monitor Open-Meteo request count and migrate to Firebase cache only if approaching 10k/day limit.

2. **iOS PWA geolocation preemptive warning**
   - What we know: iOS has permission state inconsistency, users may get confused
   - What's unclear: Whether warning before first attempt helps or hinders UX
   - Recommendation: Don't show preemptive warning. Instead, provide clear error message with link to location settings page when permission denied. Less UI clutter, same outcome.

3. **Upstream API failure behavior**
   - What we know: Open-Meteo can fail (network, rate limit, service outage)
   - What's unclear: Whether returning stale cache (even 1+ hour old) is better than error state
   - Recommendation: Return stale cache with `{ stale: true, error: 'upstream_failed' }` if available, otherwise error. Let UI decide whether to show stale data with warning or full error state.

4. **Geocoding for location names**
   - What we know: Open-Meteo returns coordinates only, not location names
   - What's unclear: Whether to integrate geocoding service for "Milano, Italy" display names
   - Recommendation: Defer to Phase 27 (Location Settings). For Phase 25 foundation, store location name in Firebase when user sets it. If using GPS, display coordinates until user saves a named location.

## Sources

### Primary (HIGH confidence)
- Open-Meteo Forecast API Documentation - https://open-meteo.com/en/docs (API structure, parameters, response format)
- MDN Geolocation API - https://developer.mozilla.org/en-US/docs/Web/API/Geolocation/getCurrentPosition (getCurrentPosition options, error codes)
- WMO Weather Codes Gist - https://gist.github.com/stellasphere/9490c195ed2b53c707087c8c2db4ec0c (Complete code mapping)
- Next.js Caching Documentation - https://nextjs.org/docs/app/guides/caching (Next.js 15 caching behavior)

### Secondary (MEDIUM confidence)
- Next.js 15 Cache Changes Analysis - https://medium.com/@weijunext/next-js-15-introduces-breaking-cache-strategy-changes-a594e3b504df (Breaking changes impact)
- PWA iOS Limitations Guide - https://www.magicbell.com/blog/pwa-ios-limitations-safari-support-complete-guide (iOS geolocation issues)
- Stale-While-Revalidate Pattern - https://web.dev/articles/stale-while-revalidate (Caching strategy explanation)
- Simple In-Memory Cache for Node.js - https://ericnish.io/blog/simple-in-memory-cache-for-node-js (Implementation pattern)

### Tertiary (LOW confidence)
- Geolocation Timeout Best Practices - Multiple community sources suggest 5-10 seconds for mobile, aligns with requirement's 10-second timeout

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Open-Meteo well-documented, project already has Next.js/Firebase/native APIs
- Architecture: HIGH - Patterns verified against official docs and existing project patterns
- Pitfalls: MEDIUM - iOS PWA issues well-documented, cache pitfalls from experience, rate limiting unclear

**Research date:** 2026-02-02
**Valid until:** 2026-03-02 (30 days - stable technologies, Open-Meteo API unlikely to change significantly)

---

**Key Decisions from CONTEXT.md Honored:**
- Cache TTL: 15 minutes ✓
- Stale data handling: Return stale immediately, refresh in background ✓
- Response includes `cachedAt` timestamp ✓
- Single cache entry for shared location ✓
- Location stored at `/config/location` ✓
- Error logging to Firebase ✓
- Geolocation timeout: 10 seconds ✓
- iOS PWA warning: Researched options, recommendation provided ✓
