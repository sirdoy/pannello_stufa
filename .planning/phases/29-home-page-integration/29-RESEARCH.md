# Phase 29: Home Page Integration - Research

**Researched:** 2026-02-03
**Domain:** React Server Components + Client Components integration, Firebase Realtime Database preferences
**Confidence:** HIGH

## Summary

This phase integrates user-saved dashboard preferences with the home page rendering. The codebase already has all infrastructure in place from Phases 26-28:

1. **Dashboard Preferences Service** (`lib/services/dashboardPreferencesService.js`) - Client-side Firebase service with `getDashboardPreferences()`, `subscribeToDashboardPreferences()`
2. **Dashboard API Route** (`app/api/config/dashboard/route.js`) - Server-side per-user preferences with `adminDbGet()`
3. **WeatherCard Component** (`app/components/weather/WeatherCard.jsx`) - Fully implemented with loading/error/data states
4. **Location Service** (`lib/services/locationService.js`) - For weather coordinates
5. **DEFAULT_CARD_ORDER** constant - Defines the 5 cards: stove, thermostat, weather, lights, camera

The home page (`app/page.js`) is currently a **Server Component** that fetches enabled devices via `getEnabledDevicesForUser()`. Phase 29 must transform this to render cards based on dashboard preferences order and visibility.

**Primary recommendation:** Convert home page to render cards from dashboard preferences using server-side API fetch pattern (similar to existing `getEnabledDevicesForUser`), map card IDs to components, and add WeatherCard to the card registry.

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js App Router | 15.5 | Server/Client component model | Already in use, SSR pattern |
| Firebase Admin SDK | existing | Server-side DB access | `adminDbGet()` in route handlers |
| Firebase Client SDK | existing | Real-time updates (optional) | `onValue` for live preference sync |
| React | 19 | Component rendering | Already in use |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @auth0/nextjs-auth0 | existing | User authentication | Get userId for per-user preferences |
| date-fns | existing | Time formatting | WeatherCard "last updated" display |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Server-side fetch | Client-side subscribe | Server fetch is simpler for initial render, matches existing pattern |
| Inline card mapping | Card registry object | Registry is cleaner but inline matches current code |

**Installation:**
No new packages required - all infrastructure exists.

## Architecture Patterns

### Recommended Project Structure

```
app/
├── page.js                    # Home page - renders cards from preferences
├── components/
│   ├── devices/
│   │   ├── stove/StoveCard.js
│   │   ├── thermostat/ThermostatCard.js
│   │   ├── camera/CameraCard.js
│   │   └── lights/LightsCard.js
│   └── weather/
│       └── WeatherCard.jsx
lib/
├── services/
│   ├── dashboardPreferencesService.js  # Client-side (existing)
│   └── locationService.js              # Location for weather (existing)
└── devicePreferencesService.js          # Current device enable/disable (existing)
```

### Pattern 1: Server-Side Preferences Fetch

**What:** Fetch dashboard preferences on server before rendering
**When to use:** Initial page load for SSR
**Example:**
```javascript
// app/page.js (Server Component)
import { auth0 } from '@/lib/auth0';
import { adminDbGet } from '@/lib/firebaseAdmin';
import { DEFAULT_CARD_ORDER } from '@/lib/services/dashboardPreferencesService';

export default async function Home() {
  const session = await auth0.getSession();
  const userId = session?.user?.sub;

  // Fetch dashboard preferences server-side
  const dashboardPath = `users/${userId}/dashboardPreferences`;
  const preferences = await adminDbGet(dashboardPath);
  const cardOrder = preferences?.cardOrder || DEFAULT_CARD_ORDER;

  // Filter visible cards and render in order
  const visibleCards = cardOrder.filter(card => card.visible !== false);

  return (
    <main>
      {visibleCards.map((card, index) => (
        <CardRenderer key={card.id} cardId={card.id} index={index} />
      ))}
    </main>
  );
}
```

### Pattern 2: Card Registry Pattern

**What:** Map card IDs to React components
**When to use:** Rendering dynamic card order
**Example:**
```javascript
// Card component mapping - inline or separate file
const CARD_COMPONENTS = {
  stove: StoveCard,
  thermostat: ThermostatCard,
  weather: WeatherCardWrapper,  // Wrapper handles data fetching
  lights: LightsCard,
  camera: CameraCard,
};

// In render
{visibleCards.map((card, index) => {
  const CardComponent = CARD_COMPONENTS[card.id];
  if (!CardComponent) return null;
  return (
    <div key={card.id} className="animate-spring-in" style={{ animationDelay: `${index * 100}ms` }}>
      <CardComponent />
    </div>
  );
})}
```

### Pattern 3: WeatherCard Wrapper (Client Component)

**What:** Wrapper component that fetches weather data for WeatherCard
**When to use:** WeatherCard requires client-side data fetching (location, weather API)
**Example:**
```javascript
// app/components/devices/weather/WeatherCardWrapper.js
'use client';

import { useState, useEffect } from 'react';
import { WeatherCard } from '@/app/components/weather';
import { getLocation, subscribeToLocation } from '@/lib/services/locationService';

export default function WeatherCardWrapper() {
  const [location, setLocation] = useState(null);
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Subscribe to location changes
    const unsubscribe = subscribeToLocation(async (loc) => {
      setLocation(loc);
      if (loc?.latitude && loc?.longitude) {
        await fetchWeather(loc.latitude, loc.longitude);
      }
    });
    return () => unsubscribe();
  }, []);

  const fetchWeather = async (lat, lon) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/weather/forecast?lat=${lat}&lon=${lon}`);
      if (!res.ok) throw new Error('Failed to fetch weather');
      const data = await res.json();
      setWeatherData(data);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <WeatherCard
      weatherData={weatherData}
      locationName={location?.name}
      isLoading={loading}
      error={error}
      onRetry={() => location && fetchWeather(location.latitude, location.longitude)}
    />
  );
}
```

### Anti-Patterns to Avoid

- **Mixing two preference systems:** Don't use both `devicePreferencesService` and `dashboardPreferencesService`. Phase 29 should consolidate on dashboard preferences for card order/visibility.
- **Client-side initial render:** Don't make dashboard preferences fetch client-side only - will cause layout shift.
- **Hardcoded card lists:** Don't maintain separate card lists in multiple places - use DEFAULT_CARD_ORDER as single source of truth.
- **Missing weather wrapper:** Don't try to pass props to WeatherCard from Server Component - create a client wrapper.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Card order persistence | Custom state management | `dashboardPreferencesService.js` | Already implemented, handles Firebase |
| Weather data fetching | Inline fetch logic | `/api/weather/forecast` + wrapper | API route handles caching |
| Default card order | New constant | `DEFAULT_CARD_ORDER` from service | Single source of truth |
| User authentication | Manual session check | `auth0.getSession()` | Standard pattern in codebase |
| Animation stagger | Manual CSS delays | Existing `animate-spring-in` pattern | Already used in current home page |

**Key insight:** All infrastructure exists from Phases 25-28. Phase 29 is purely integration - wiring existing pieces together.

## Common Pitfalls

### Pitfall 1: Two Preference Systems Coexisting

**What goes wrong:** Home page currently uses `devicePreferencesService.getEnabledDevicesForUser()` which stores at `devicePreferences/${userId}`. Dashboard settings uses `dashboardPreferencesService` which stores at `users/${userId}/dashboardPreferences`. These are two different Firebase paths.

**Why it happens:** Phase 28 created a new preferences system without removing the old one.

**How to avoid:** Phase 29 should replace `getEnabledDevicesForUser()` with dashboard preferences fetch. The dashboard preferences include visibility (`visible` field) which replaces the enable/disable concept.

**Warning signs:** Home page not reflecting changes made in dashboard settings.

### Pitfall 2: WeatherCard Data Fetching in Server Component

**What goes wrong:** WeatherCard needs location data (from Firebase client) and weather data (from API). Server Components cannot use client-side Firebase SDK or maintain state.

**Why it happens:** WeatherCard expects props like `weatherData`, `locationName`, `isLoading` - these require client-side lifecycle.

**How to avoid:** Create a `WeatherCardWrapper` client component that:
1. Subscribes to location from Firebase
2. Fetches weather from API when location available
3. Passes data to WeatherCard

**Warning signs:** "Cannot use hooks in Server Component" error, or WeatherCard always showing loading state.

### Pitfall 3: Missing New Cards for New Users

**What goes wrong:** New users (no saved preferences) don't see the weather card because it's not in the legacy `DEVICE_CONFIG`.

**Why it happens:** `DEFAULT_CARD_ORDER` includes weather, but fallback logic might accidentally use `DEVICE_CONFIG`.

**How to avoid:** When no preferences exist, use `DEFAULT_CARD_ORDER` from `dashboardPreferencesService.js` - it already includes all 5 cards (stove, thermostat, weather, lights, camera).

**Warning signs:** New users don't see weather card on home page.

### Pitfall 4: Card Order Not Updating After Settings Change

**What goes wrong:** User saves new card order in settings, but home page still shows old order until full refresh.

**Why it happens:** Server Component fetches preferences on page load. Navigation from settings to home doesn't trigger re-fetch.

**How to avoid:** Accept this behavior - settings page saves, user returns to home, home page re-fetches on navigation. This is standard Next.js App Router behavior.

**Warning signs:** User confusion that order didn't change. Could add toast notification in settings page: "Changes will appear on home page".

### Pitfall 5: Stale Animation Delays

**What goes wrong:** Animation delays based on index don't reset when cards are reordered mid-session.

**Why it happens:** Using map index for animation delay, card keys stay same.

**How to avoid:** This is actually fine - animation only matters on initial page load. After card reorder (which requires settings save + navigate home), page remounts and animation plays correctly.

**Warning signs:** None - current behavior is acceptable.

## Code Examples

### Server-Side Dashboard Preferences Fetch

```javascript
// app/page.js - Replacement for getEnabledDevicesForUser pattern
import { auth0 } from '@/lib/auth0';
import { adminDbGet } from '@/lib/firebaseAdmin';
import { DEFAULT_CARD_ORDER } from '@/lib/services/dashboardPreferencesService';

/**
 * Get dashboard card order for a user (server-side)
 * @param {string} userId - Auth0 user ID
 * @returns {Promise<Array>} Array of card configs with id, label, icon, visible
 */
export async function getDashboardCardsForUser(userId) {
  if (!userId) {
    return DEFAULT_CARD_ORDER;
  }

  try {
    const dashboardPath = `users/${userId}/dashboardPreferences`;
    const preferences = await adminDbGet(dashboardPath);
    return preferences?.cardOrder || DEFAULT_CARD_ORDER;
  } catch (error) {
    console.error('Error fetching dashboard preferences:', error);
    return DEFAULT_CARD_ORDER;
  }
}
```

### Card Component Registry

```javascript
// Card ID to Component mapping
import StoveCard from './components/devices/stove/StoveCard';
import ThermostatCard from './components/devices/thermostat/ThermostatCard';
import LightsCard from './components/devices/lights/LightsCard';
import CameraCard from './components/devices/camera/CameraCard';
import WeatherCardWrapper from './components/devices/weather/WeatherCardWrapper';

const CARD_COMPONENTS = {
  stove: StoveCard,
  thermostat: ThermostatCard,
  weather: WeatherCardWrapper,
  lights: LightsCard,
  camera: CameraCard,
};
```

### WeatherCardWrapper Component

```javascript
// app/components/devices/weather/WeatherCardWrapper.js
'use client';

import { useState, useEffect, useCallback } from 'react';
import { WeatherCard } from '@/app/components/weather';
import { subscribeToLocation } from '@/lib/services/locationService';

/**
 * Wrapper component for WeatherCard
 * Handles location subscription and weather data fetching
 * Designed for use in home page card list
 */
export default function WeatherCardWrapper() {
  const [location, setLocation] = useState(null);
  const [weatherData, setWeatherData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchWeather = useCallback(async (lat, lon) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/weather/forecast?lat=${lat}&lon=${lon}`);
      if (!res.ok) {
        throw new Error('Impossibile caricare i dati meteo');
      }
      const data = await res.json();
      setWeatherData(data);
    } catch (err) {
      console.error('[WeatherCardWrapper] Fetch error:', err);
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeToLocation((loc) => {
      setLocation(loc);
      if (loc?.latitude && loc?.longitude) {
        fetchWeather(loc.latitude, loc.longitude);
      } else {
        setIsLoading(false);
        // No location configured - show empty state
        setWeatherData(null);
      }
    });

    return () => unsubscribe();
  }, [fetchWeather]);

  const handleRetry = () => {
    if (location?.latitude && location?.longitude) {
      fetchWeather(location.latitude, location.longitude);
    }
  };

  return (
    <WeatherCard
      weatherData={weatherData}
      locationName={location?.name || null}
      isLoading={isLoading}
      error={error}
      onRetry={handleRetry}
    />
  );
}
```

### Updated Home Page Render

```javascript
// app/page.js - Key rendering section
export default async function Home() {
  const session = await auth0.getSession();

  if (!session?.user) {
    redirect('/auth/login');
  }

  const userId = session.user.sub;
  const cardOrder = await getDashboardCardsForUser(userId);

  // Filter to only visible cards
  const visibleCards = cardOrder.filter(card => card.visible !== false);

  return (
    <main>
      <Section title="I tuoi dispositivi" level={1}>
        <SandboxToggle />

        <Grid cols={2} gap="lg">
          {visibleCards.map((card, index) => {
            const CardComponent = CARD_COMPONENTS[card.id];
            if (!CardComponent) return null;

            return (
              <div
                key={card.id}
                className="animate-spring-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <CardComponent />
              </div>
            );
          })}
        </Grid>

        {visibleCards.length === 0 && (
          <EmptyState
            icon="Gear icon"
            title="Nessuna card visibile"
            description="Vai alle impostazioni per personalizzare la tua dashboard"
          />
        )}
      </Section>
    </main>
  );
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `devicePreferencesService` (enable/disable) | `dashboardPreferencesService` (order + visibility) | Phase 28 | Phase 29 completes migration |
| Static card order in page.js | Dynamic order from user preferences | Phase 29 | Full dashboard customization |
| No WeatherCard on home | WeatherCard as reorderable card | Phase 29 | Weather integration complete |

**Deprecated/outdated:**
- `getEnabledDevicesForUser()`: Replace with dashboard preferences pattern
- `devicePreferences/${userId}` Firebase path: Will be superseded by `users/${userId}/dashboardPreferences`

## Open Questions

None - all infrastructure exists. Phase 29 is pure integration.

## Sources

### Primary (HIGH confidence)

- **Codebase inspection:**
  - `/app/page.js` - Current home page implementation
  - `/lib/services/dashboardPreferencesService.js` - Dashboard preferences with `DEFAULT_CARD_ORDER`
  - `/app/api/config/dashboard/route.js` - API route with server-side patterns
  - `/lib/devicePreferencesService.js` - Legacy device preferences (to be replaced)
  - `/app/components/weather/WeatherCard.jsx` - Weather component props and states
  - `/lib/services/locationService.js` - Location data for weather

- **Phase documentation:**
  - `28-VERIFICATION.md` - Confirmed Phase 28 infrastructure works
  - `28-CONTEXT.md` - User decisions for dashboard customization

### Secondary (MEDIUM confidence)

- **Existing patterns:**
  - StoveCard.js, ThermostatCard.js - How existing cards work
  - Card rendering with animation delays - Pattern already in use

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Using existing codebase infrastructure
- Architecture: HIGH - Following established patterns in codebase
- Pitfalls: HIGH - Based on direct codebase inspection

**Research date:** 2026-02-03
**Valid until:** Indefinite - This is codebase-specific integration research
