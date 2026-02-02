# Domain Pitfalls: Weather Integration & Dashboard Customization

**Domain:** Weather Component + Dashboard Customization for PWA
**Researched:** 2026-02-02
**Confidence:** HIGH (iOS PWA limitations verified with 2025-2026 guides, weather API costs verified with official pricing)

---

## Critical Pitfalls

### Pitfall 1: iOS PWA Geolocation Permission Dialog in Standalone Mode

**What goes wrong:**
User installs PWA to home screen, launches app, weather component requests location but permission dialog never appears. App hangs indefinitely waiting for geolocation. User sees "Unable to get location" error with no recovery path. Location works fine in Safari browser but fails when running as installed PWA.

**Why it happens:**
- When PWA runs in `display: standalone` mode on iOS, the location permission dialog may appear in Safari instead of the PWA
- iOS shares geolocation permissions between Safari and PWA but the dialog targeting is buggy
- `navigator.permissions.query({name: "geolocation"})` returns "prompt" even when permission is actually denied
- No way to detect if permission was previously denied since Safari reports inconsistent state

**Warning signs:**
- Geolocation works on Android/desktop but fails silently on iOS
- `getCurrentPosition()` never resolves (no success or error callback)
- Works when testing in Safari but not in home screen app
- User reports "location stuck loading" on iPhone/iPad

**Prevention strategy:**
```javascript
// lib/weather/geolocation.js
export async function getLocationWithFallback(timeout = 10000) {
  // iOS PWA detection
  const isIOSPWA = window.navigator.standalone === true;

  return new Promise((resolve, reject) => {
    // Set hard timeout - iOS can hang indefinitely
    const timeoutId = setTimeout(() => {
      reject(new Error('GEOLOCATION_TIMEOUT'));
    }, timeout);

    // Attempt geolocation
    navigator.geolocation.getCurrentPosition(
      (position) => {
        clearTimeout(timeoutId);
        resolve({
          lat: position.coords.latitude,
          lon: position.coords.longitude,
          source: 'gps',
          accuracy: position.coords.accuracy,
        });
      },
      (error) => {
        clearTimeout(timeoutId);
        // On iOS, error.code 1 (PERMISSION_DENIED) may not fire correctly
        reject({
          code: error.code,
          message: error.message,
          isIOSPWA,
          // Provide actionable guidance
          recovery: isIOSPWA
            ? 'Open Settings > Safari > Location and ensure "Ask" or "Allow" is selected'
            : 'Please allow location permission when prompted',
        });
      },
      {
        enableHighAccuracy: false, // Faster on mobile
        timeout: timeout - 1000, // Leave buffer for our timeout
        maximumAge: 600000, // Accept 10-minute old position
      }
    );
  });
}

// Always provide manual fallback
export async function getLocationWithManualFallback(savedLocation) {
  try {
    return await getLocationWithFallback(10000);
  } catch (error) {
    // Fall back to saved location from user preferences
    if (savedLocation) {
      return {
        ...savedLocation,
        source: 'saved',
        stale: true,
      };
    }
    // Fall back to IP-based geolocation as last resort
    return await getIPBasedLocation();
  }
}
```

**Phase to address:**
**Phase 1: Weather Component Foundation** - Implement geolocation with iOS-specific fallbacks
**UI must always show:** Manual location entry option, never assume GPS will work

---

### Pitfall 2: Weather API Key Exposure in Client-Side Code

**What goes wrong:**
Developer fetches weather directly from client-side JavaScript, exposing API key in browser DevTools. Malicious user extracts key and makes thousands of requests. Free tier quota exhausted in hours. App shows "API limit reached" for all users. Attacker uses stolen key for their own project, incurring charges on paid plans.

**Why it happens:**
- Convenience: Direct fetch from React component is simpler than server-side route
- Misunderstanding: Developer assumes "environment variable" means secure (it doesn't in client bundle)
- Copy-paste: Weather API tutorials often show client-side fetching for simplicity
- `NEXT_PUBLIC_*` prefix exposes vars to client (Next.js specific)

**Warning signs:**
- `NEXT_PUBLIC_WEATHER_API_KEY` in environment variables
- `fetch('https://api.openweathermap.org/...?appid=' + process.env...)` in client component
- API key visible in Network tab of DevTools
- Sudden spike in API usage not matching app traffic

**Prevention strategy:**
```javascript
// WRONG - Client-side fetch exposes API key
// app/components/weather/WeatherWidget.js
const res = await fetch(
  `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${process.env.NEXT_PUBLIC_WEATHER_KEY}`
); // KEY VISIBLE IN BROWSER

// CORRECT - Server-side API route
// app/api/weather/current/route.js
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get('lat');
  const lon = searchParams.get('lon');

  // Validate inputs
  if (!lat || !lon || isNaN(lat) || isNaN(lon)) {
    return NextResponse.json({ error: 'Invalid coordinates' }, { status: 400 });
  }

  // API key only on server, never exposed
  const apiKey = process.env.WEATHER_API_KEY; // No NEXT_PUBLIC_ prefix

  const response = await fetch(
    `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric&lang=it`,
    { next: { revalidate: 600 } } // Cache for 10 minutes
  );

  if (!response.ok) {
    return NextResponse.json({ error: 'Weather API error' }, { status: response.status });
  }

  return NextResponse.json(await response.json());
}

// Client component fetches from our API route
// app/components/weather/WeatherWidget.js
const res = await fetch(`/api/weather/current?lat=${lat}&lon=${lon}`);
```

**Phase to address:**
**Phase 1: Weather Component Foundation** - API route is mandatory, never client-side

---

### Pitfall 3: Weather API Rate Limits and Cost Explosion

**What goes wrong:**
Weather widget polls every 5 seconds like stove status. Free tier limit (1000 calls/day on OpenWeatherMap) exhausted by noon. On paid plans, bill unexpectedly high ($50+/month for simple widget). Multiple users multiplies problem (10 users = 10x API calls). Polling continues when browser tab is hidden (background tab drain).

**Why it happens:**
- Copying polling pattern from stove card (which uses internal API, not rate-limited external service)
- Not caching weather data (weather changes slowly, 10-30 minute cache is fine)
- Every component instance makes separate requests (no deduplication)
- Not pausing polling when tab/app is in background
- Not understanding free tier limits before implementation

**Warning signs:**
- 429 (Too Many Requests) errors from weather API
- Error 26 on OpenWeatherMap: "Your account is temporary blocked"
- Console shows weather fetch every few seconds
- Network tab shows duplicate weather requests

**Prevention strategy:**
```javascript
// lib/weather/weatherService.js
const weatherCache = new Map(); // In-memory cache

export async function getWeather(lat, lon, options = {}) {
  const {
    maxAge = 600000, // 10 minutes default cache
    forceRefresh = false,
  } = options;

  const cacheKey = `${lat.toFixed(2)},${lon.toFixed(2)}`; // Round to reduce cache variations
  const cached = weatherCache.get(cacheKey);

  // Return cached if fresh enough
  if (!forceRefresh && cached && (Date.now() - cached.timestamp < maxAge)) {
    return { ...cached.data, fromCache: true, cacheAge: Date.now() - cached.timestamp };
  }

  // Fetch fresh data
  const response = await fetch(`/api/weather/current?lat=${lat}&lon=${lon}`);
  if (!response.ok) {
    // On error, serve stale cache if available
    if (cached) {
      return { ...cached.data, fromCache: true, stale: true };
    }
    throw new Error('Weather fetch failed');
  }

  const data = await response.json();
  weatherCache.set(cacheKey, { data, timestamp: Date.now() });

  return { ...data, fromCache: false };
}

// React hook with visibility-aware polling
// app/hooks/useWeather.js
export function useWeather(lat, lon) {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!lat || !lon) return;

    let intervalId;

    const fetchWeather = async () => {
      try {
        const data = await getWeather(lat, lon);
        setWeather(data);
      } catch (error) {
        console.error('Weather fetch error:', error);
      } finally {
        setLoading(false);
      }
    };

    // Initial fetch
    fetchWeather();

    // Set up visibility-aware polling
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Pause polling when tab hidden
        clearInterval(intervalId);
      } else {
        // Resume with fresh fetch
        fetchWeather();
        intervalId = setInterval(fetchWeather, 600000); // 10 minutes
      }
    };

    // Start polling only when visible
    if (!document.hidden) {
      intervalId = setInterval(fetchWeather, 600000);
    }

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [lat, lon]);

  return { weather, loading, refresh: () => getWeather(lat, lon, { forceRefresh: true }) };
}
```

**Cost planning:**
| Provider | Free Tier | Safe Polling | Est. Cost (10 users) |
|----------|-----------|--------------|----------------------|
| OpenWeatherMap | 1000 calls/day | 15 min intervals | Free |
| WeatherAPI.com | 1M calls/month | 10 min intervals | Free |
| Visual Crossing | 1000 records/day | 15 min intervals | Free |
| Tomorrow.io | 50 calls/day | 30 min intervals | Free (barely) |

**Phase to address:**
**Phase 1: Weather Component Foundation** - Caching and rate limiting from day one

---

### Pitfall 4: iOS Safari PWA Storage Eviction Destroys User Preferences

**What goes wrong:**
User customizes dashboard layout (card order, visibility), saves to localStorage/IndexedDB. User doesn't open PWA for 10 days. iOS evicts storage. User opens app, all customizations gone. Dashboard reset to default. User frustrated, customizes again, same thing happens.

**Why it happens:**
- iOS Safari enforces 7-day cap on script-writable storage for PWAs not used frequently
- IndexedDB, localStorage, and Cache API are all subject to eviction
- iOS imposes ~50MB limit on PWA storage
- No warning before eviction, no way to prevent it from client
- Users don't understand their data can disappear

**Warning signs:**
- Users report "my settings keep resetting"
- Preferences work for a week then disappear
- Issue only on iOS devices, not Android/desktop
- localStorage reads return null for keys that should exist

**Prevention strategy:**
```javascript
// Persist user preferences to Firebase, not just localStorage
// lib/preferences/dashboardPreferences.js

import { db, ref, get, update } from '@/lib/firebase';
import { filterUndefined } from '@/lib/firebase/utils';

// Firebase schema: /users/{userId}/preferences/dashboard
// {
//   cardOrder: ['stove', 'thermostat', 'weather', 'lights'],
//   hiddenCards: ['lights'],
//   weatherLocation: { lat: 45.46, lon: 9.19, name: 'Milano' },
//   lastModified: 1706886400000,
// }

export async function saveDashboardPreferences(userId, preferences) {
  // Save to Firebase (persistent, survives iOS eviction)
  await update(ref(db, `users/${userId}/preferences/dashboard`), filterUndefined({
    ...preferences,
    lastModified: Date.now(),
  }));

  // Also save to localStorage for offline/instant access
  try {
    localStorage.setItem('dashboardPrefs', JSON.stringify(preferences));
  } catch (e) {
    // localStorage may fail (quota, private mode), Firebase is primary
    console.warn('localStorage save failed, Firebase primary');
  }
}

export async function loadDashboardPreferences(userId) {
  // Try localStorage first for instant load
  try {
    const cached = localStorage.getItem('dashboardPrefs');
    if (cached) {
      const prefs = JSON.parse(cached);
      // Still fetch from Firebase to sync, but return cached immediately
      syncFromFirebase(userId, prefs);
      return prefs;
    }
  } catch (e) {
    // localStorage failed, continue to Firebase
  }

  // Load from Firebase
  const snapshot = await get(ref(db, `users/${userId}/preferences/dashboard`));
  const prefs = snapshot.val() || getDefaultPreferences();

  // Cache to localStorage for next time
  try {
    localStorage.setItem('dashboardPrefs', JSON.stringify(prefs));
  } catch (e) {
    // Ignore localStorage failures
  }

  return prefs;
}

async function syncFromFirebase(userId, localPrefs) {
  const snapshot = await get(ref(db, `users/${userId}/preferences/dashboard`));
  const remotePrefs = snapshot.val();

  if (remotePrefs && remotePrefs.lastModified > (localPrefs.lastModified || 0)) {
    // Firebase has newer data, update localStorage
    try {
      localStorage.setItem('dashboardPrefs', JSON.stringify(remotePrefs));
    } catch (e) {}
    // Optionally trigger UI refresh
    window.dispatchEvent(new CustomEvent('preferencesUpdated', { detail: remotePrefs }));
  }
}
```

**Phase to address:**
**Phase 2: Dashboard Customization** - Firebase is primary storage, localStorage is cache

---

### Pitfall 5: Drag-and-Drop Touch Issues on iOS Safari

**What goes wrong:**
Dashboard reordering works perfectly on desktop with mouse. On iPhone, user tries to drag card but page scrolls instead. Long-press required but feels unresponsive (120ms+ delay). Heavy-handed touch doesn't register drag at all. Force Touch on 3D Touch devices causes unpredictable behavior. Users report "drag and drop is broken on mobile."

**Why it happens:**
- `react-beautiful-dnd` has known iOS Safari issues (documented in GitHub issues #413, #1021, #1464, #1795)
- iOS intercepts touch events for scrolling before drag handlers can process them
- Force Touch (3D Touch) adds complexity on older iPhones
- 120ms long-press delay feels laggy to users
- PWA standalone mode may behave differently than Safari browser

**Warning signs:**
- Works on Chrome/Firefox but fails on Safari
- Users report "I can't drag cards" on iPhone
- Page scrolls when user tries to drag
- Drag preview doesn't appear on touch devices
- Works with light touch but not normal touch pressure

**Prevention strategy:**
```javascript
// Option 1: Use @dnd-kit instead of react-beautiful-dnd
// @dnd-kit has better mobile/touch support
// npm install @dnd-kit/core @dnd-kit/sortable

// app/components/dashboard/SortableCardList.js
import { DndContext, closestCenter, TouchSensor, MouseSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';

export function SortableCardList({ cards, onReorder }) {
  // Configure touch sensor with reduced activation delay
  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 10, // 10px before drag starts
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 100, // Reduced from 250ms default
        tolerance: 5, // Allow 5px movement during delay
      },
    })
  );

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={cards.map(c => c.id)} strategy={verticalListSortingStrategy}>
        {cards.map(card => (
          <SortableCard key={card.id} card={card} />
        ))}
      </SortableContext>
    </DndContext>
  );
}

// Option 2: If using react-beautiful-dnd, add mobile-friendly alternatives
// app/components/dashboard/CardWithReorderButtons.js
export function CardWithReorderButtons({ card, index, totalCards, onMoveUp, onMoveDown }) {
  const isTouchDevice = 'ontouchstart' in window;

  return (
    <Card>
      {/* Card content */}

      {/* Show reorder buttons on touch devices as fallback */}
      {isTouchDevice && (
        <div className="flex gap-2 mt-2">
          <Button
            variant="ghost"
            size="sm"
            disabled={index === 0}
            onClick={() => onMoveUp(index)}
            aria-label="Move up"
          >
            <ChevronUp />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            disabled={index === totalCards - 1}
            onClick={() => onMoveDown(index)}
            aria-label="Move down"
          >
            <ChevronDown />
          </Button>
        </div>
      )}
    </Card>
  );
}

// CSS to prevent iOS Safari pull-to-refresh during drag
// styles/globals.css
/* Prevent pull-to-refresh during drag */
.dragging {
  touch-action: none;
  overscroll-behavior: contain;
}
```

**Phase to address:**
**Phase 2: Dashboard Customization** - Use @dnd-kit OR provide button-based fallback for mobile

---

### Pitfall 6: State Not Persisted After Drag-and-Drop Reorder

**What goes wrong:**
User reorders cards by dragging. Cards move visually during drag. On drop, cards snap back to original positions. React re-renders and state resets. User's reordering is lost. Sometimes works, sometimes doesn't (race condition).

**Why it happens:**
- DnD library updates visual DOM during drag but doesn't persist to React state
- `onDragEnd` handler missing or doesn't update state correctly
- State update uses wrong order (source/destination swapped)
- Component re-renders before state update completes
- No persistence to localStorage/Firebase, reorder lost on refresh

**Warning signs:**
- Cards animate back to original position after drop
- Reorder works first time but subsequent reorders fail
- Works until page refresh, then resets
- Console shows correct `onDragEnd` data but UI doesn't update

**Prevention strategy:**
```javascript
// app/components/dashboard/DraggableDashboard.js
import { DndContext, closestCenter } from '@dnd-kit/core';
import { arrayMove, SortableContext } from '@dnd-kit/sortable';
import { useState, useCallback, useEffect } from 'react';
import { saveDashboardPreferences, loadDashboardPreferences } from '@/lib/preferences';

export function DraggableDashboard({ userId }) {
  const [cardOrder, setCardOrder] = useState(['stove', 'thermostat', 'weather', 'lights']);
  const [isLoading, setIsLoading] = useState(true);

  // Load saved order on mount
  useEffect(() => {
    async function loadOrder() {
      const prefs = await loadDashboardPreferences(userId);
      if (prefs?.cardOrder) {
        setCardOrder(prefs.cardOrder);
      }
      setIsLoading(false);
    }
    loadOrder();
  }, [userId]);

  // Handle drag end - MUST update state AND persist
  const handleDragEnd = useCallback(async (event) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return; // No change
    }

    const oldIndex = cardOrder.indexOf(active.id);
    const newIndex = cardOrder.indexOf(over.id);

    // Optimistic update - update state immediately
    const newOrder = arrayMove(cardOrder, oldIndex, newIndex);
    setCardOrder(newOrder);

    // Persist to Firebase (async, don't block UI)
    try {
      await saveDashboardPreferences(userId, { cardOrder: newOrder });
    } catch (error) {
      // Revert on save failure
      console.error('Failed to save card order:', error);
      setCardOrder(cardOrder); // Revert to old order
      // Show toast notification
      toast.error('Failed to save card order');
    }
  }, [cardOrder, userId]);

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={cardOrder}>
        {cardOrder.map(cardId => (
          <SortableDeviceCard key={cardId} id={cardId} />
        ))}
      </SortableContext>
    </DndContext>
  );
}
```

**Phase to address:**
**Phase 2: Dashboard Customization** - State management and persistence in same handler

---

## Moderate Pitfalls

### Pitfall 7: Weather Location Privacy Concerns

**What goes wrong:**
App requests precise GPS location when approximate would suffice. Users refuse location permission due to privacy concerns. App stores exact coordinates in Firebase visible to developers. No transparency about what location data is stored/used.

**Prevention:**
- Request approximate location when possible (`enableHighAccuracy: false`)
- Only store city/region name, not precise coordinates
- Provide clear privacy disclosure
- Allow manual city entry as alternative to GPS
- Round coordinates (1 decimal = ~10km precision, sufficient for weather)

**Phase to address:**
**Phase 1: Weather Component** - Implement privacy-respecting location handling

---

### Pitfall 8: Weather Widget Accessibility Failures

**What goes wrong:**
Weather icon has no alt text. Screen reader announces "image" instead of "sunny" or "rainy". Temperature changes not announced to screen readers. Color contrast of weather conditions fails WCAG. Drag-and-drop reordering inaccessible to keyboard users.

**Prevention:**
- Add descriptive aria-labels: `aria-label="Current weather: Sunny, 22 degrees"`
- Use aria-live regions for temperature updates
- Ensure 4.5:1 contrast ratio for all weather text
- Provide keyboard alternatives for drag-and-drop
- Test with VoiceOver on iOS

**Phase to address:**
**Phase 1: Weather Component** - Accessibility from the start
**Phase 2: Dashboard Customization** - Keyboard-accessible reordering

---

### Pitfall 9: Stale Weather Data Without User Awareness

**What goes wrong:**
Weather cached for 10 minutes but user doesn't know data is old. User sees "22 degrees" at 3 PM that was actually fetched at 2:50 PM when it was warmer. No indication of last update time. User makes decisions based on stale data.

**Prevention:**
- Display "Updated X minutes ago" timestamp
- Visual indicator when showing cached data (subtle badge)
- Manual refresh button (pull-to-refresh on mobile)
- Different visual state for stale data (>30 min old)

```javascript
// Show cache age in UI
<div className="text-xs text-muted-foreground">
  {weather.fromCache
    ? `Updated ${Math.round(weather.cacheAge / 60000)} min ago`
    : 'Just now'}
  {weather.stale && <Badge variant="warning">Stale</Badge>}
</div>
```

**Phase to address:**
**Phase 1: Weather Component** - Cache age visibility in UI

---

### Pitfall 10: Vercel Serverless Cold Start Affects Weather Response

**What goes wrong:**
First weather request after inactivity takes 3-5 seconds (cold start). User sees loading spinner for extended time. Subsequent requests are fast (warm function). Users with infrequent visits always experience slow loads.

**Prevention:**
- Use stale-while-revalidate caching (serve stale, update in background)
- Consider Vercel Edge Runtime for weather API route (faster cold starts)
- Pre-warm with scheduled cron if critical
- Show cached data immediately, update when fresh data arrives

```javascript
// app/api/weather/current/route.js
export const runtime = 'edge'; // Faster cold starts than Node.js

// Or use stale-while-revalidate headers
return new Response(JSON.stringify(data), {
  headers: {
    'Content-Type': 'application/json',
    'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=1200',
  },
});
```

**Phase to address:**
**Phase 1: Weather Component** - Edge runtime or SWR caching

---

### Pitfall 11: Firebase Write Conflicts with Rapid Preference Changes

**What goes wrong:**
User rapidly reorders cards (drag-drop-drag-drop in quick succession). Each reorder triggers Firebase write. Writes arrive out of order. Final state doesn't match user's last action. User sees cards in wrong order.

**Prevention:**
- Debounce preference saves (300ms-500ms)
- Use Firebase transactions for atomic updates
- Include timestamp, reject older writes
- Local state is source of truth, Firebase is backup

```javascript
// Debounced save
import { debounce } from 'lodash-es';

const debouncedSave = debounce(
  (userId, prefs) => saveDashboardPreferences(userId, prefs),
  500
);

// In drag end handler
setCardOrder(newOrder); // Immediate local update
debouncedSave(userId, { cardOrder: newOrder }); // Debounced persist
```

**Phase to address:**
**Phase 2: Dashboard Customization** - Debounced persistence

---

## "Looks Done But Isn't" Checklist

- [ ] **Weather API key hidden**: Key not in client bundle, only server-side
- [ ] **iOS geolocation fallback**: Manual location entry always available
- [ ] **Rate limiting implemented**: Weather cached 10+ minutes
- [ ] **Touch drag working on iOS**: Tested on actual iPhone, not just simulator
- [ ] **State persists to Firebase**: Not just localStorage (iOS eviction)
- [ ] **Reorder persists on refresh**: Drag-and-drop saves to backend
- [ ] **Cache age visible**: User knows when data was last fetched
- [ ] **Offline fallback**: Shows cached weather when offline
- [ ] **Accessibility complete**: Screen reader tested, keyboard navigation works
- [ ] **Privacy considered**: Location data minimal, user informed

---

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Weather API | Client-side fetch exposes key | Server-side API route, key never in client |
| Geolocation | Assume permission always granted | Timeout + manual entry fallback |
| iOS PWA | Trust localStorage persistence | Firebase primary, localStorage cache |
| Drag-and-drop | react-beautiful-dnd on iOS | @dnd-kit or button fallback |
| State persistence | Save only to localStorage | Save to Firebase, sync localStorage |
| Caching | No cache or infinite cache | 10-min TTL with stale-while-revalidate |
| User feedback | Silent cache, silent errors | Show "Updated X ago", error messages |

---

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| No weather caching | 429 errors, high API bills | 10-min cache minimum | >100 daily active users |
| Poll when hidden | Battery drain, quota waste | Pause polling when tab hidden | Always on mobile |
| Separate requests per component | N requests for N components | Single shared service | Multiple weather displays |
| Large preference object | Slow Firebase writes | Store only changed fields | >50 preference keys |
| No debouncing | Rapid writes during drag | 500ms debounce | Fast reordering |
| Cold start latency | 3-5s first load | Edge runtime or pre-cache | Infrequent visitors |

---

## Phase-to-Pitfall Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| iOS PWA geolocation | Phase 1: Weather Foundation | Test on actual iPhone in standalone mode |
| API key exposure | Phase 1: Weather Foundation | Check Network tab, key not visible |
| Rate limits | Phase 1: Weather Foundation | Monitor API calls, <100/day |
| iOS storage eviction | Phase 2: Dashboard | Preferences survive 10-day gap |
| Touch drag issues | Phase 2: Dashboard | Test on iPhone, cards reorderable |
| State persistence | Phase 2: Dashboard | Refresh page, order preserved |
| Privacy concerns | Phase 1: Weather Foundation | Only city stored, not coords |
| Accessibility | Phase 1 + Phase 2 | VoiceOver reads weather, keyboard reorders |
| Stale data UX | Phase 1: Weather Foundation | "Updated X ago" visible |
| Cold start latency | Phase 1: Weather Foundation | First load <2s with edge runtime |
| Write conflicts | Phase 2: Dashboard | Rapid reorder results in correct final state |

---

## Sources

### iOS PWA Limitations (HIGH Confidence)
- [PWA on iOS - Current Status & Limitations for Users [2025]](https://brainhub.eu/library/pwa-on-ios)
- [PWA iOS Limitations and Safari Support: Complete Guide](https://www.magicbell.com/blog/pwa-ios-limitations-safari-support-complete-guide)
- [Navigating Safari/iOS PWA Limitations and Bugs](https://vinova.sg/navigating-safari-ios-pwa-limitations/)
- [Location Alert does not open in PWA - Apple Developer Forums](https://developer.apple.com/forums/thread/694999)
- [HTML Geolocation API does not work - Apple Developer Forums](https://developer.apple.com/forums/thread/751189)

### Weather API Pricing (HIGH Confidence)
- [Best Weather API for 2025: Free & Paid Options Compared](https://www.visualcrossing.com/resources/blog/best-weather-api-for-2025/)
- [OpenWeatherMap Pricing](https://openweathermap.org/price)
- [WeatherAPI.com Pricing](https://www.weatherapi.com/pricing.aspx)
- [36 Best weather APIs in 2026: Free and paid options](https://www.getambee.com/blogs/best-weather-apis)

### API Security (HIGH Confidence)
- [Remediating OpenWeatherMap Token leaks | GitGuardian](https://www.gitguardian.com/remediation/openweathermap-token)
- [OpenWeatherMap FAQ](https://openweathermap.org/faq)

### Drag-and-Drop Touch Issues (MEDIUM Confidence)
- [iOS 11.3 not supported - react-beautiful-dnd Issue #413](https://github.com/atlassian/react-beautiful-dnd/issues/413)
- [Draggables not working for heavy handed touch - Issue #1021](https://github.com/atlassian/react-beautiful-dnd/issues/1021)
- [Delayed touch start on mobile - Issue #1795](https://github.com/atlassian/react-beautiful-dnd/issues/1795)
- [Long press timeout customization - Issue #1464](https://github.com/atlassian/react-beautiful-dnd/issues/1464)
- [Top 5 Drag-and-Drop Libraries for React in 2026](https://puckeditor.com/blog/top-5-drag-and-drop-libraries-for-react)

### State Persistence (HIGH Confidence)
- [Persist List Reordering with react-beautiful-dnd | egghead.io](https://egghead.io/lessons/react-persist-list-reordering-with-react-beautiful-dnd-using-the-ondragend-callback)
- [Building Customizable Dashboard Widgets Using React Grid Layout](https://www.antstack.com/blog/building-customizable-dashboard-widgets-using-react-grid-layout/)
- [Firebase Realtime Database conflict resolution](https://groups.google.com/g/firebase-talk/c/Lvdp_0xPBeI)

### Caching Strategies (HIGH Confidence)
- [Keeping things fresh with stale-while-revalidate | web.dev](https://web.dev/articles/stale-while-revalidate)
- [Understanding Stale-While-Revalidate | DebugBear](https://www.debugbear.com/docs/stale-while-revalidate)
- [Caching Serverless Function Responses | Vercel](https://vercel.com/docs/functions/serverless-functions/edge-caching)

### Vercel Serverless (MEDIUM Confidence)
- [What can I do about Vercel serverless functions timing out?](https://vercel.com/kb/guide/what-can-i-do-about-vercel-serverless-functions-timing-out)
- [Vercel Edge Explained | Upstash Blog](https://upstash.com/blog/vercel-edge)

---

**Pitfalls research for:** Weather Integration & Dashboard Customization
**Researched:** 2026-02-02
**Confidence:** HIGH (iOS PWA limitations verified with 2025-2026 documentation, weather API costs verified with official pricing pages)
**Next step:** Use these pitfalls to inform roadmap phase structure, ensuring iOS-specific testing and Firebase persistence are not deferred
