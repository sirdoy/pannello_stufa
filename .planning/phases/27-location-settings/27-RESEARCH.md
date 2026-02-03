# Phase 27: Location Settings - Research

**Researched:** 2026-02-03
**Domain:** Location settings, geocoding autocomplete, browser geolocation, Firebase persistence
**Confidence:** HIGH

## Summary

Phase 27 implements location configuration for weather display with city search autocomplete, geolocation auto-detect, and Firebase persistence. The implementation builds on existing Phase 25 infrastructure (geolocation utility, locationService, API routes) and integrates with Phase 26 WeatherCard.

The standard approach uses Open-Meteo Geocoding API (free, no key required) for city search, browser Geolocation API with proper iOS PWA error handling, debounced search input to minimize API calls, and Firebase RTDB for shared location storage at `/config/location`.

Key architectural decisions: single shared location for entire app (not per-user), location cannot be cleared once set (only changed), search and geolocation equally prominent, manual coordinates hidden under "Avanzate" link for power users.

**Primary recommendation:** Use Open-Meteo Geocoding API with 300-500ms debounced input, limit autocomplete to 5 suggestions, implement robust error handling for iOS PWA geolocation failures, persist to Firebase via existing `/api/config/location` route.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Open-Meteo Geocoding API | v1 | Free city/location geocoding with autocomplete | No API key required, global coverage, multi-language support |
| Browser Geolocation API | Native | Device location detection | Standard web API, works in PWAs, already implemented in Phase 25 |
| Firebase RTDB | Admin SDK v12.7+ | Location preference persistence | Already used for app config, supports real-time sync |
| Next.js 15.5 | 15.5.x | Framework for settings page and API routes | Project standard |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| React hooks (useState, useEffect) | React 18+ | State management for autocomplete | Built-in, no additional deps |
| Debounce pattern | Custom or lodash | Rate-limit autocomplete API calls | 300-500ms delay standard for search |
| Design System components | Project | Input, Button, Card, Banner | Consistent UI per design-system.md |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Open-Meteo Geocoding | Google Places API | Google requires API key and billing, Open-Meteo is free |
| Custom debounce hook | use-debounce npm package | Custom implementation is lightweight (10 lines), no extra dependency |
| Browser Geolocation | IP-based geolocation | Less accurate, unreliable with VPNs |

**Installation:**
```bash
# No new dependencies - uses existing stack
# Open-Meteo Geocoding API is free and requires no API key
```

## Architecture Patterns

### Recommended Project Structure
```
app/settings/location/
├── page.js                    # Settings page with SettingsLayout
lib/services/
├── locationService.js         # Already exists from Phase 25
lib/
├── geolocation.js             # Already exists from Phase 25
app/api/config/location/
└── route.js                   # Already exists from Phase 25
app/api/geocoding/
└── route.js                   # NEW: Proxy to Open-Meteo Geocoding API
```

### Pattern 1: Debounced Autocomplete Search
**What:** Search input triggers API call only after user stops typing for N milliseconds
**When to use:** Any autocomplete/search feature to minimize API calls and improve UX
**Example:**
```javascript
// Debounce hook (custom implementation)
import { useState, useEffect } from 'react';

export function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Usage in autocomplete
const [searchQuery, setSearchQuery] = useState('');
const debouncedQuery = useDebounce(searchQuery, 300); // 300ms delay

useEffect(() => {
  if (debouncedQuery.length >= 3) {
    // Fetch autocomplete suggestions
    fetchSuggestions(debouncedQuery);
  }
}, [debouncedQuery]);
```

### Pattern 2: Settings Page with SettingsLayout
**What:** Consistent settings page structure with back button, title, and content area
**When to use:** All settings pages in the app
**Example:**
```javascript
// Source: app/settings/theme/page.js
import SettingsLayout from '@/app/components/SettingsLayout';
import Card from '@/app/components/ui/Card';

export default function LocationSettingsPage() {
  return (
    <SettingsLayout title="Posizione" icon="📍">
      <Text variant="secondary">
        Configura la posizione per le previsioni meteo
      </Text>

      <Card variant="glass" className="p-6 sm:p-8">
        {/* Settings content */}
      </Card>
    </SettingsLayout>
  );
}
```

### Pattern 3: Geolocation with Error Handling
**What:** Use existing geolocation utility with comprehensive error messages
**When to use:** Any feature requiring device location
**Example:**
```javascript
// Source: lib/geolocation.js (already implemented)
import { getCurrentLocation, GEOLOCATION_ERROR_MESSAGES } from '@/lib/geolocation';

const handleUseMyLocation = async () => {
  try {
    const { latitude, longitude } = await getCurrentLocation();
    // Save location
  } catch (error) {
    // error.code is GEOLOCATION_ERRORS constant
    // error.message is Italian user-friendly message
    setErrorMessage(error.message);
  }
};
```

### Pattern 4: Firebase Location Persistence
**What:** Use existing locationService and API route for shared location storage
**When to use:** Reading/writing app-wide location preference
**Example:**
```javascript
// Save location via API (server-side validation)
const response = await fetch('/api/config/location', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    latitude: 45.4642,
    longitude: 9.1900,
    name: 'Milano, IT'
  })
});

// Client-side real-time subscription (for WeatherCard)
import { subscribeToLocation } from '@/lib/services/locationService';

const unsubscribe = subscribeToLocation((location) => {
  if (location) {
    setCurrentLocation(location);
  }
});
```

### Anti-Patterns to Avoid
- **Calling geocoding API on every keystroke:** Always debounce search input (300-500ms)
- **Not limiting autocomplete results:** Show max 5-10 suggestions to avoid overwhelming users
- **Generic geolocation errors:** Use specific error messages for denied/timeout/unavailable (already handled by lib/geolocation.js)
- **Creating new Firebase paths:** Use existing `/config/location` path from Phase 25
- **Per-user location storage:** Location is shared app-wide, not per-user (requirement from STATE.md)

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Debounce hook | Custom complex debounce logic with refs | Simple useState + useEffect pattern | 10-line implementation, no deps, proven pattern |
| Geocoding API | Custom city database or scraping | Open-Meteo Geocoding API | Free, no key, global coverage, maintained |
| Coordinate validation | Custom regex/parsing | Built-in parseFloat + range checks | Edge cases (NaN, Infinity) already handled in existing API route |
| Location storage | New Firebase structure | Existing `/api/config/location` and locationService | Already implemented in Phase 25, tested, secure |
| Geolocation wrapper | Direct navigator.geolocation calls | Existing lib/geolocation.js | Timeout handling, iOS PWA errors, Italian messages |

**Key insight:** Phase 25 already implemented the hard parts (geolocation utility, Firebase persistence, API routes). Phase 27 is primarily UI layer that consumes existing services.

## Common Pitfalls

### Pitfall 1: Too Many Autocomplete Suggestions
**What goes wrong:** Showing 10+ suggestions overwhelms mobile users (keyboard takes 50% of screen)
**Why it happens:** Desktop mindset - mobile screens are much smaller
**How to avoid:** Limit to 5 suggestions maximum (per CONTEXT.md decision)
**Warning signs:** Users scrolling past suggestions, missed selections

### Pitfall 2: No Minimum Search Length
**What goes wrong:** API called with 1-2 character queries returns irrelevant results
**Why it happens:** Eager to show results quickly
**How to avoid:** Require minimum 3 characters before triggering search (Open-Meteo fuzzy matching kicks in at 3+ chars)
**Warning signs:** Many autocomplete requests with no results

### Pitfall 3: iOS PWA Geolocation Permission Not Persisted
**What goes wrong:** User grants permission but gets prompted again on next visit
**Why it happens:** iOS PWA permission storage differs from Safari browser
**How to avoid:** Save location immediately after geolocation success to Firebase, use saved location on subsequent visits
**Warning signs:** Users complaining about repeated permission prompts

### Pitfall 4: Forgetting to Clear Suggestions on Selection
**What goes wrong:** Autocomplete dropdown stays open after user selects a city
**Why it happens:** Missing state cleanup in selection handler
**How to avoid:** Clear search query and suggestions array in selection handler
**Warning signs:** Dropdown still visible after selection

### Pitfall 5: Not Showing Current Location
**What goes wrong:** User saves location but page doesn't indicate what was saved
**Why it happens:** Missing feedback after successful save
**How to avoid:** Show saved location name in UI, provide success toast/banner
**Warning signs:** Users re-submitting same location multiple times

### Pitfall 6: Race Conditions with Debounced Input
**What goes wrong:** Fast typers trigger multiple API calls, older responses override newer ones
**Why it happens:** API responses arrive out of order
**How to avoid:** Use abort controller or request ID to ignore stale responses
**Warning signs:** Autocomplete showing results for previous query

## Code Examples

Verified patterns from official sources and existing codebase:

### Open-Meteo Geocoding API Request
```javascript
// Source: https://open-meteo.com/en/docs/geocoding-api
// Endpoint: https://geocoding-api.open-meteo.com/v1/search

const fetchCitySuggestions = async (query) => {
  const params = new URLSearchParams({
    name: query,
    count: 5,        // Limit to 5 results (per CONTEXT.md)
    language: 'it',  // Italian results when available
    format: 'json'
  });

  const response = await fetch(
    `https://geocoding-api.open-meteo.com/v1/search?${params}`
  );

  const data = await response.json();

  // Response format:
  // {
  //   results: [
  //     {
  //       id: 3173435,
  //       name: "Milano",
  //       latitude: 45.46427,
  //       longitude: 9.18951,
  //       country: "Italia",
  //       admin1: "Lombardia",
  //       timezone: "Europe/Rome"
  //     },
  //     ...
  //   ]
  // }

  return data.results || [];
};
```

### Debounce Hook Pattern
```javascript
// Lightweight custom implementation (no dependencies)
// Based on common React pattern from multiple sources

import { useState, useEffect } from 'react';

export function useDebounce(value, delay = 300) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Cleanup: cancel timer if value changes before delay
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
```

### Autocomplete Component Structure
```javascript
'use client';

import { useState, useEffect } from 'react';
import { Input, Button, Card, Banner } from '@/app/components/ui';
import { getCurrentLocation, GEOLOCATION_ERROR_MESSAGES } from '@/lib/geolocation';
import { useDebounce } from '@/app/hooks/useDebounce';

export default function LocationSearch({ onLocationSelected }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Debounce search query (300ms)
  const debouncedQuery = useDebounce(searchQuery, 300);

  // Fetch suggestions when debounced query changes
  useEffect(() => {
    if (debouncedQuery.length < 3) {
      setSuggestions([]);
      return;
    }

    const fetchSuggestions = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/geocoding/search?q=${encodeURIComponent(debouncedQuery)}`);
        const data = await response.json();
        setSuggestions(data.results || []);
      } catch (err) {
        setError('Errore durante la ricerca');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSuggestions();
  }, [debouncedQuery]);

  const handleSelectSuggestion = (suggestion) => {
    onLocationSelected({
      latitude: suggestion.latitude,
      longitude: suggestion.longitude,
      name: `${suggestion.name}, ${suggestion.country}`
    });
    setSearchQuery('');
    setSuggestions([]);
  };

  const handleUseMyLocation = async () => {
    try {
      setIsLoading(true);
      const { latitude, longitude } = await getCurrentLocation();

      // Reverse geocode to get location name
      const response = await fetch(`/api/geocoding/reverse?lat=${latitude}&lon=${longitude}`);
      const data = await response.json();

      onLocationSelected({
        latitude,
        longitude,
        name: data.name || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <Input
        label="Cerca città"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="Es. Milano, Roma, Napoli..."
        clearable
      />

      {suggestions.length > 0 && (
        <ul className="mt-2 space-y-1">
          {suggestions.map((s) => (
            <li key={s.id}>
              <button onClick={() => handleSelectSuggestion(s)}>
                {s.name}, {s.country}
              </button>
            </li>
          ))}
        </ul>
      )}

      <Button
        variant="subtle"
        onClick={handleUseMyLocation}
        disabled={isLoading}
      >
        📍 Usa la mia posizione
      </Button>

      {error && <Banner variant="danger">{error}</Banner>}
    </div>
  );
}
```

### Save Location via API
```javascript
// Pattern follows existing themeService.js pattern
const saveLocation = async (latitude, longitude, name) => {
  try {
    const response = await fetch('/api/config/location', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ latitude, longitude, name })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Errore salvataggio posizione');
    }

    return true;
  } catch (error) {
    console.error('Error saving location:', error);
    throw error;
  }
};
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Google Places API | Open-Meteo Geocoding API | 2023+ | No API key required, free tier sufficient |
| Inline debounce logic | Custom useDebounce hook | React 16.8+ (hooks) | Reusable, cleaner code |
| localStorage for location | Firebase RTDB shared config | Phase 25 (v3.2) | Multi-device sync, iOS eviction-safe |
| Generic geolocation errors | Specific error codes with Italian messages | Phase 25 | Better UX, iOS PWA compatibility |

**Deprecated/outdated:**
- Using Google Geocoding API for non-commercial apps: Open-Meteo provides free alternative
- Direct navigator.geolocation without error handling: Use lib/geolocation.js wrapper
- Creating custom Firebase service: Phase 25 already provides locationService and API route

## Open Questions

Things that couldn't be fully resolved:

1. **Temperature Trend Indicator (WEATHER-09)**
   - What we know: Requires hourly historical data for comparison
   - What's unclear: Whether to fetch hourly data in location settings or defer to WeatherCard
   - Recommendation: Implement in location settings page since it requires API changes anyway - add hourly data to weather API response, calculate trend in WeatherCard

2. **Reverse Geocoding for "Use My Location"**
   - What we know: Open-Meteo supports reverse geocoding (coordinates → place name)
   - What's unclear: Whether to implement reverse geocoding or just show coordinates
   - Recommendation: Implement reverse geocoding for better UX - call Open-Meteo with coordinates, show city name if found

3. **Search Result Display Format**
   - What we know: Open-Meteo returns name, country, admin1 (region), admin2, etc.
   - What's unclear: How much info to show (city+country vs city+region+country)
   - Recommendation: Show "City, Country" for brevity - matches Google/Apple Maps pattern

## Sources

### Primary (HIGH confidence)
- Open-Meteo Geocoding API Docs: https://open-meteo.com/en/docs/geocoding-api
- Existing codebase: lib/geolocation.js (Phase 25 implementation)
- Existing codebase: lib/services/locationService.js (Phase 25 implementation)
- Existing codebase: app/api/config/location/route.js (Phase 25 implementation)
- Existing codebase: app/settings/theme/page.js (Settings page pattern)
- Existing codebase: lib/themeService.js (API persistence pattern)

### Secondary (MEDIUM confidence)
- [Baymard Institute: Autocomplete Design Patterns](https://baymard.com/blog/autocomplete-design) - 9 UX best practices
- [UX Magazine: Autosuggest Best Practices](https://uxmag.com/articles/best-practices-designing-autosuggest-experiences) - Limit to 6-8 suggestions
- [useHooks: useDebounce](https://usehooks.com/usedebounce) - Standard React debounce pattern
- [MagicBell: PWA iOS Limitations](https://www.magicbell.com/blog/pwa-ios-limitations-safari-support-complete-guide) - iOS geolocation quirks

### Tertiary (LOW confidence)
- WebSearch results about Next.js debounce patterns - Multiple approaches exist, custom implementation chosen for simplicity

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Open-Meteo documented, geolocation already implemented, Firebase patterns established
- Architecture: HIGH - Follows existing settings page pattern, locationService already exists from Phase 25
- Pitfalls: MEDIUM - Autocomplete UX pitfalls well-documented, iOS geolocation issues verified in existing code
- Code examples: HIGH - Based on official Open-Meteo docs and existing codebase patterns

**Research date:** 2026-02-03
**Valid until:** 2026-03-03 (30 days - stable APIs and patterns)

---

**Research complete. Ready for planning.**
