# Phase 26: Weather Component - Research

**Researched:** 2026-02-02
**Domain:** Weather widget UI component, horizontal scrolling, skeleton loading, bottom sheet modals
**Confidence:** HIGH

## Summary

Phase 26 creates a weather card component that displays current conditions and a 5-day forecast, consuming the weather API infrastructure from Phase 25. The standard approach combines React component patterns with the existing Ember Noir design system components (SmartHomeCard, Skeleton, BottomSheet) and Lucide icons (45 weather icons available). The component follows Apple Weather widget layout: prominent current conditions on top, horizontal scrollable forecast row below, and bottom sheet for daily details.

The project already has all necessary infrastructure: SmartHomeCard for consistent card structure, Skeleton for loading states with shimmer animation, BottomSheet for forecast details, Lucide for weather icons, and date-fns for relative timestamps. No new dependencies needed. The key technical challenges are mapping WMO weather codes to Lucide icons, implementing horizontal scroll with touch-friendly interactions, and creating indoor/outdoor temperature comparison displays.

**Primary recommendation:** Use SmartHomeCard as base component, create Skeleton.WeatherCard following existing pattern (Skeleton.ThermostatCard reference), implement horizontal scroll with native CSS overflow-x-auto and snap points, use BottomSheet for forecast day details, and leverage Lucide weather icons with fill prop for solid style.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | 19.2.0 | Component framework | Already in project, modern hooks and suspense support |
| Next.js | 16.1.0 | App framework | Already in project, app router with server components |
| Lucide React | 0.562.0 | Icon library | Already in project, 45 weather icons available, tree-shakable SVGs |
| date-fns | 4.1.0 | Date utilities | Already in project, formatDistanceToNow for "X minutes ago" |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| class-variance-authority (CVA) | 0.7.1 | Variant styling | Already in project, used by all design system components |
| clsx / tailwind-merge | 2.1.1 / 3.4.0 | Class composition | Already in project, standard pattern for component styling |

### Project Components (Already Built)
| Component | Location | Purpose |
|-----------|----------|---------|
| SmartHomeCard | app/components/ui/SmartHomeCard.js | Base card structure with accent bar, header, status, controls |
| Skeleton | app/components/ui/Skeleton.js | Loading states with shimmer animation, namespace pattern |
| BottomSheet | app/components/ui/BottomSheet.js | Mobile-friendly modal from bottom, portal-based |
| Card | app/components/ui/Card.js | Base card component with elevation variants |
| Heading | app/components/ui/Heading.js | Typography component with semantic levels |
| Text | app/components/ui/Text.js | Body text with variant styling |
| Badge | app/components/ui/Badge.js | Status badges with pulse animation |
| EmptyState | app/components/ui/EmptyState.js | Empty/error state with icon and action |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Lucide icons | weather-icons-react | Dedicated weather library but last updated 7 years ago, larger bundle |
| Native CSS scroll | react-horizontal-scrolling-menu | Adds dependency for simple horizontal scroll, overcomplicated |
| BottomSheet | Radix Dialog | Already have BottomSheet wrapper around Dialog, consistent with project |
| Custom skeleton | react-loading-skeleton | Adds dependency, project already has custom Skeleton with Ember Noir styling |

**Installation:**
```bash
# No new dependencies needed - all libraries already in project
```

## Architecture Patterns

### Recommended Project Structure
```
app/components/weather/
├── WeatherCard.jsx            # Main weather card component
├── CurrentConditions.jsx      # Current weather display section
├── ForecastRow.jsx           # Horizontal scrollable forecast
├── ForecastDayCard.jsx       # Single day in forecast row
├── ForecastDaySheet.jsx      # Bottom sheet for day details
├── WeatherIcon.jsx           # Icon mapper (WMO code → Lucide)
└── weatherHelpers.js         # Temperature comparison, formatting utils

app/components/ui/
└── Skeleton.js               # Add Skeleton.WeatherCard
```

### Pattern 1: SmartHomeCard Structure for Consistency
**What:** Use SmartHomeCard as base to match other device cards (thermostat, stove, lights)
**When to use:** All weather card components
**Example:**
```jsx
// Reference: app/components/ui/SmartHomeCard.js (already implemented)
import { SmartHomeCard } from '@/app/components/ui';

<SmartHomeCard
  icon={<CloudSun className="w-8 h-8" />}
  title="Weather"
  colorTheme="ocean"  // Blue theme for weather
  isLoading={isLoading}
  error={!!error}
  errorMessage={error?.message}
>
  <SmartHomeCard.Status>
    <Badge variant="ocean">Updated 5 min ago</Badge>
  </SmartHomeCard.Status>

  <SmartHomeCard.Controls>
    {/* Current conditions + forecast */}
  </SmartHomeCard.Controls>
</SmartHomeCard>
```

### Pattern 2: Skeleton.WeatherCard Following Existing Patterns
**What:** Create namespace skeleton component matching card structure
**When to use:** Loading state while weather data fetches
**Example:**
```jsx
// Add to app/components/ui/Skeleton.js following existing patterns
// Reference: Skeleton.ThermostatCard (lines 148-225)

Skeleton.WeatherCard = function SkeletonWeatherCard() {
  return (
    <div className="space-y-4 sm:space-y-6 animate-spring-in">
      <Skeleton.Card className="overflow-visible transition-all duration-500">
        <div className="relative">
          <div className="p-6 sm:p-8">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-8 w-24" />
            </div>

            {/* Current conditions */}
            <div className="mb-6">
              <div className="flex items-center gap-4 mb-4">
                <Skeleton className="h-16 w-16 rounded-full" />
                <div>
                  <Skeleton className="h-12 w-24 mb-2" />
                  <Skeleton className="h-4 w-32" />
                </div>
              </div>

              {/* Weather details grid */}
              <div className="grid grid-cols-4 gap-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="text-center">
                    <Skeleton className="h-5 w-5 mx-auto mb-2 rounded-full" />
                    <Skeleton className="h-3 w-12 mx-auto" />
                  </div>
                ))}
              </div>
            </div>

            {/* Forecast row */}
            <div className="flex gap-3 overflow-x-hidden">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="flex-shrink-0 w-20 h-24 rounded-xl" />
              ))}
            </div>
          </div>
        </div>
      </Skeleton.Card>
    </div>
  );
};
```

### Pattern 3: Horizontal Scroll with Native CSS (No Library)
**What:** Native overflow-x-auto with snap points for touch-friendly scrolling
**When to use:** Forecast row with 5+ day cards
**Example:**
```jsx
// Reference: Skeleton.LightsCard scenes section (lines 286-302)
// Project already uses this pattern for horizontal scrolling

<div className="relative">
  {/* Fade gradient indicators (optional) */}
  <div className="absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-slate-900 to-transparent pointer-events-none z-10" />

  <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory">
    {forecastDays.map(day => (
      <ForecastDayCard
        key={day.date}
        day={day}
        className="flex-shrink-0 w-20 snap-start"
      />
    ))}
  </div>
</div>

// CSS utility classes needed (add to globals.css if not present):
// .scrollbar-hide::-webkit-scrollbar { display: none; }
// .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
```

### Pattern 4: BottomSheet for Forecast Details
**What:** Use existing BottomSheet component for day detail view
**When to use:** User taps forecast day card to see hourly breakdown
**Example:**
```jsx
// Reference: app/components/ui/BottomSheet.js (already implemented)
import { BottomSheet } from '@/app/components/ui';

function ForecastDaySheet({ day, isOpen, onClose }) {
  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title={day.dayName}
      icon={<CloudSun className="w-6 h-6" />}
      showHandle={true}
    >
      {/* Hourly breakdown */}
      <div className="space-y-4">
        <div>
          <Text variant="secondary" size="sm">Temperature Range</Text>
          <Text size="xl">{day.high}° / {day.low}°</Text>
        </div>

        {/* Extended stats */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Text variant="secondary" size="sm">UV Index</Text>
            <Text>{day.uvIndex}</Text>
          </div>
          <div>
            <Text variant="secondary" size="sm">Humidity</Text>
            <Text>{day.humidity}%</Text>
          </div>
        </div>
      </div>
    </BottomSheet>
  );
}
```

### Pattern 5: Lucide Weather Icon Mapping (WMO Codes → Icons)
**What:** Map Open-Meteo WMO weather codes (0-99) to Lucide weather icons with day/night variants
**When to use:** Displaying weather conditions anywhere
**Example:**
```jsx
// app/components/weather/WeatherIcon.jsx
import {
  Sun, Moon, Cloud, CloudSun, CloudMoon, Cloudy,
  CloudRain, CloudDrizzle, CloudSnow, CloudFog,
  CloudLightning, Wind, Tornado
} from 'lucide-react';

// WMO Weather Codes: https://open-meteo.com/en/docs
// Lucide has 45 weather icons - mapping subset to common codes
const WMO_TO_LUCIDE = {
  0: { day: Sun, night: Moon, label: 'Clear sky' },
  1: { day: Sun, night: Moon, label: 'Mainly clear' },
  2: { day: CloudSun, night: CloudMoon, label: 'Partly cloudy' },
  3: { day: Cloudy, night: Cloudy, label: 'Overcast' },
  45: { day: CloudFog, night: CloudFog, label: 'Fog' },
  48: { day: CloudFog, night: CloudFog, label: 'Depositing rime fog' },
  51: { day: CloudDrizzle, night: CloudDrizzle, label: 'Light drizzle' },
  53: { day: CloudDrizzle, night: CloudDrizzle, label: 'Moderate drizzle' },
  55: { day: CloudDrizzle, night: CloudDrizzle, label: 'Dense drizzle' },
  61: { day: CloudRain, night: CloudRain, label: 'Slight rain' },
  63: { day: CloudRain, night: CloudRain, label: 'Moderate rain' },
  65: { day: CloudRain, night: CloudRain, label: 'Heavy rain' },
  71: { day: CloudSnow, night: CloudSnow, label: 'Slight snow' },
  73: { day: CloudSnow, night: CloudSnow, label: 'Moderate snow' },
  75: { day: CloudSnow, night: CloudSnow, label: 'Heavy snow' },
  95: { day: CloudLightning, night: CloudLightning, label: 'Thunderstorm' },
  // ... additional mappings
};

export function WeatherIcon({ code, isNight = false, className, size = 24 }) {
  const mapping = WMO_TO_LUCIDE[code] || WMO_TO_LUCIDE[0];
  const IconComponent = isNight ? mapping.night : mapping.day;

  return (
    <IconComponent
      className={className}
      size={size}
      fill="currentColor"  // Filled/solid style
      strokeWidth={0}      // Remove outline
      aria-label={mapping.label}
    />
  );
}
```

### Pattern 6: Indoor/Outdoor Temperature Comparison
**What:** Display temperature difference with descriptive text
**When to use:** Comparing outdoor weather temp with indoor thermostat reading
**Example:**
```jsx
// app/components/weather/weatherHelpers.js
export function getTemperatureComparison(outdoorTemp, indoorTemp) {
  const diff = Math.abs(outdoorTemp - indoorTemp);
  const warmer = outdoorTemp > indoorTemp ? 'warmer' : 'cooler';

  if (diff < 1) {
    return 'Same as indoor temperature';
  }

  return `${diff.toFixed(1)}° ${warmer} than indoor`;
}

// Usage in component
import { getTemperatureComparison } from './weatherHelpers';

<div className="flex items-center gap-2">
  <Text variant="secondary" size="sm">
    {getTemperatureComparison(weatherData.current.temperature, thermostatTemp)}
  </Text>
</div>
```

### Pattern 7: Error State with Retry (Existing Pattern)
**What:** Use EmptyState component for error handling with retry button
**When to use:** Weather API fetch fails or location not set
**Example:**
```jsx
// Reference: Design system components
import { EmptyState, Button } from '@/app/components/ui';
import { CloudOff } from 'lucide-react';

if (error) {
  return (
    <EmptyState
      icon={<CloudOff className="w-12 h-12" />}
      title="Unable to load weather"
      description={error.message || "Check your connection and try again"}
      action={
        <Button variant="ember" onClick={handleRetry}>
          Retry
        </Button>
      }
      size="default"
    />
  );
}
```

### Anti-Patterns to Avoid
- **Building custom horizontal scroll library:** Native CSS with snap points is sufficient and touch-friendly
- **Creating custom loading states:** Use existing Skeleton.WeatherCard following project patterns
- **Custom icon library:** Lucide has 45 weather icons, sufficient coverage with solid style via fill prop
- **Inline weather code mapping:** Centralize in WeatherIcon component for reusability
- **Manual timestamp formatting:** Use date-fns formatDistanceToNow with addSuffix: true
- **Breaking SmartHomeCard pattern:** Weather card should match other device cards (thermostat, lights, stove)

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Horizontal scroll with snap | Custom JS scroll library (react-horizontal-scrolling-menu) | Native CSS overflow-x-auto + snap-x | Works on all devices, touch-friendly, no dependency |
| Skeleton loading | Custom placeholder divs | Existing Skeleton component with shimmer | Project has consistent loading states, Ember Noir styling |
| Bottom sheet modal | Custom modal from scratch | Existing BottomSheet component | Portal-based, scroll lock, ESC key handling, accessible |
| Weather icons | Custom SVG imports or icon font | Lucide weather icons with fill prop | 45 weather icons, tree-shakable, already in project |
| Relative timestamps | Manual Date math | date-fns formatDistanceToNow | Handles edge cases, localization support, "X minutes ago" format |
| WMO code interpretation | Hardcode descriptions everywhere | Centralized WeatherIcon component | Single source of truth, day/night variants, reusable |
| Temperature comparison | Inline calculations | weatherHelpers.js utility | Reusable logic, consistent formatting, testable |

**Key insight:** Project already has design system components (SmartHomeCard, Skeleton, BottomSheet) specifically built for this use case. Weather component should leverage these rather than recreating patterns. Lucide's 45 weather icons cover all common conditions without needing dedicated weather icon libraries.

## Common Pitfalls

### Pitfall 1: Icon Fill Style Not Working with Default Props
**What goes wrong:** Lucide icons appear outlined instead of filled/solid as required by CONTEXT.md
**Why it happens:** Lucide icons default to stroked outlines, need explicit fill + strokeWidth props
**How to avoid:** Always pass `fill="currentColor"` and `strokeWidth={0}` to icon components
**Warning signs:** Icons look outlined, missing the "filled/solid icon style (like iOS weather)" requirement
**Source:** [Lucide Filled Icons Guide](https://lucide.dev/guide/advanced/filled-icons)

### Pitfall 2: Horizontal Scroll Momentum Stops Abruptly on iOS
**What goes wrong:** Forecast row scrolling feels janky on iOS Safari, stops immediately
**Why it happens:** Missing `-webkit-overflow-scrolling: touch` for momentum scrolling
**How to avoid:** Add `[-webkit-overflow-scrolling:touch]` to scroll container
**Warning signs:** Scroll feels stiff on iOS devices, no momentum/inertia effect
**Source:** Community best practice for iOS Safari horizontal scroll

### Pitfall 3: Bottom Sheet Not Closing on Backdrop Click
**What goes wrong:** Users can't dismiss bottom sheet by tapping outside content area
**Why it happens:** Forgot to pass `closeOnBackdrop={true}` or backdrop click handler missing
**How to avoid:** BottomSheet defaults to `closeOnBackdrop={true}`, but verify prop is passed correctly
**Warning signs:** Only close button works, tapping outside sheet does nothing
**Source:** app/components/ui/BottomSheet.js implementation (line 84)

### Pitfall 4: Skeleton Component Props Don't Match Final Card
**What goes wrong:** Skeleton dimensions/structure differ from loaded card, causes layout shift
**Why it happens:** Skeleton created before finalizing card layout, props out of sync
**How to avoid:** Build Skeleton.WeatherCard AFTER WeatherCard finalized, match structure exactly
**Warning signs:** Visible layout jump when data loads, skeleton doesn't match card structure
**Source:** Best practice from existing Skeleton implementations (Skeleton.ThermostatCard)

### Pitfall 5: WMO Weather Code Day/Night Detection Wrong
**What goes wrong:** Wrong icon shown (sun at night, moon during day)
**Why it happens:** Using local time instead of location timezone, or comparing to wrong threshold
**How to avoid:** Use Open-Meteo's `current.is_day` field (0 = night, 1 = day) from API response
**Warning signs:** User reports seeing sun icon at night, especially in different timezones
**Source:** [Open-Meteo API Documentation](https://open-meteo.com/en/docs) - current.is_day parameter

### Pitfall 6: Forecast Row Scrolls Past Last Item (Too Much Whitespace)
**What goes wrong:** Horizontal scroll continues beyond last forecast card, shows empty space
**Why it happens:** Incorrect padding-right calculation or missing scroll-snap-align
**How to avoid:** Use `snap-mandatory` with `snap-start` on cards, no extra padding after last item
**Warning signs:** User can scroll past last day, sees blank space to the right
**Source:** CSS Scroll Snap specification and project's existing horizontal scroll implementation (Skeleton.LightsCard)

### Pitfall 7: Temperature Precision Inconsistency
**What goes wrong:** Sometimes shows 18°, other times 18.5°, inconsistent display
**Why it happens:** Not rounding consistently, or mixing server-side vs client-side formatting
**How to avoid:** Always use `.toFixed(1)` for temperature display as specified in CONTEXT.md
**Warning signs:** Temperature jumps between whole numbers and decimals on refresh
**Source:** CONTEXT.md requirement: "Celsius only, one decimal precision (18.5°C)"

## Code Examples

Verified patterns from official sources:

### Lucide Weather Icons with Filled Style
```jsx
// Source: https://lucide.dev/guide/advanced/filled-icons
import { CloudRain, Sun } from 'lucide-react';

// Correct: Filled/solid style (required by CONTEXT.md)
<CloudRain fill="currentColor" strokeWidth={0} className="text-blue-500" size={48} />
<Sun fill="#facc15" strokeWidth={0} size={64} />

// Wrong: Default outlined style (not matching iOS Weather widget aesthetic)
<CloudRain className="text-blue-500" size={48} />
```

### date-fns Relative Timestamp
```javascript
// Source: https://date-fns.org/v4.1.0/docs/formatDistanceToNow
import { formatDistanceToNow } from 'date-fns';

const cachedAt = weatherData.cachedAt; // Unix timestamp from API
const timeAgo = formatDistanceToNow(cachedAt, { addSuffix: true });
// Output: "5 minutes ago", "about 1 hour ago", "2 days ago"

// Display in UI
<Text variant="secondary" size="sm">
  Updated {timeAgo}
</Text>
```

### Horizontal Scroll with Snap Points (Native CSS)
```jsx
// Source: CSS Scroll Snap Module Level 1 + Project pattern (Skeleton.js line 288)
<div className="relative">
  {/* Fade gradient indicator (right side) */}
  <div className="absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-slate-900 to-transparent pointer-events-none z-10 [html:not(.dark)_&]:from-white" />

  <div className="
    flex gap-3
    overflow-x-auto
    pb-2
    scrollbar-hide
    snap-x snap-mandatory
    [-webkit-overflow-scrolling:touch]
  ">
    {forecastDays.map(day => (
      <div
        key={day.date}
        className="flex-shrink-0 w-20 snap-start cursor-pointer"
        onClick={() => openDaySheet(day)}
      >
        {/* Day card content */}
      </div>
    ))}
  </div>
</div>

/* Required CSS in globals.css */
.scrollbar-hide::-webkit-scrollbar { display: none; }
.scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
```

### SmartHomeCard Weather Implementation
```jsx
// Source: app/components/ui/SmartHomeCard.js (project implementation)
import { SmartHomeCard, Badge, Text } from '@/app/components/ui';
import { CloudSun } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export function WeatherCard({ weatherData, isLoading, error, onRetry }) {
  if (isLoading) {
    return <Skeleton.WeatherCard />;
  }

  if (error) {
    return (
      <SmartHomeCard
        icon={<CloudOff />}
        title="Weather"
        colorTheme="ocean"
        error={true}
        errorMessage="Unable to load weather"
      >
        <Button variant="ember" onClick={onRetry}>Retry</Button>
      </SmartHomeCard>
    );
  }

  const { current, daily, cachedAt } = weatherData;
  const timeAgo = formatDistanceToNow(cachedAt, { addSuffix: true });

  return (
    <SmartHomeCard
      icon={<CloudSun className="w-8 h-8" />}
      title="Weather"
      colorTheme="ocean"
    >
      <SmartHomeCard.Status>
        <Badge variant="ocean" size="sm">
          Updated {timeAgo}
        </Badge>
      </SmartHomeCard.Status>

      <SmartHomeCard.Controls>
        {/* Current conditions */}
        <CurrentConditions data={current} />

        {/* Forecast row */}
        <ForecastRow days={daily} />
      </SmartHomeCard.Controls>
    </SmartHomeCard>
  );
}
```

### BottomSheet for Forecast Day Details
```jsx
// Source: app/components/ui/BottomSheet.js (project implementation)
import { BottomSheet, Text, Heading } from '@/app/components/ui';
import { WeatherIcon } from '@/app/components/weather/WeatherIcon';

export function ForecastDaySheet({ day, isOpen, onClose }) {
  if (!day) return null;

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title={day.dayName}
      icon={<WeatherIcon code={day.weatherCode} size={24} />}
      showHandle={true}
      showCloseButton={true}
      closeOnBackdrop={true}
    >
      <div className="space-y-6">
        {/* Temperature range */}
        <div>
          <Text variant="secondary" size="sm" className="mb-1">
            Temperature Range
          </Text>
          <div className="flex items-baseline gap-2">
            <Text size="3xl" weight="bold">
              {day.tempMax.toFixed(1)}°
            </Text>
            <Text variant="secondary" size="xl">
              / {day.tempMin.toFixed(1)}°
            </Text>
          </div>
        </div>

        {/* Extended stats grid */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Text variant="secondary" size="sm">UV Index</Text>
            <Text size="lg">{day.uvIndex}</Text>
          </div>
          <div>
            <Text variant="secondary" size="sm">Humidity</Text>
            <Text size="lg">{day.humidity}%</Text>
          </div>
          <div>
            <Text variant="secondary" size="sm">Wind Speed</Text>
            <Text size="lg">{day.windSpeed} km/h</Text>
          </div>
          <div>
            <Text variant="secondary" size="sm">Precipitation</Text>
            <Text size="lg">{day.precipChance}%</Text>
          </div>
        </div>

        {/* Sunrise/Sunset */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Text variant="secondary" size="sm">Sunrise</Text>
            <Text>{day.sunrise}</Text>
          </div>
          <div>
            <Text variant="secondary" size="sm">Sunset</Text>
            <Text>{day.sunset}</Text>
          </div>
        </div>
      </div>
    </BottomSheet>
  );
}
```

### Weather Details Grid Layout (Responsive)
```jsx
// Responsive grid that adapts to screen size
// Mobile: 2 cols, Tablet: 4 cols, Desktop: 6 cols
<div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 mb-6">
  {/* Humidity */}
  <div className="flex flex-col items-center p-3 bg-slate-800/40 rounded-xl">
    <Droplets className="w-5 h-5 text-ocean-400 mb-1" fill="currentColor" strokeWidth={0} />
    <Text variant="tertiary" size="xs">Humidity</Text>
    <Text size="sm" weight="medium">{current.humidity}%</Text>
  </div>

  {/* Wind */}
  <div className="flex flex-col items-center p-3 bg-slate-800/40 rounded-xl">
    <Wind className="w-5 h-5 text-slate-400 mb-1" />
    <Text variant="tertiary" size="xs">Wind</Text>
    <Text size="sm" weight="medium">{current.windSpeed} km/h</Text>
  </div>

  {/* UV Index */}
  <div className="flex flex-col items-center p-3 bg-slate-800/40 rounded-xl">
    <Sun className="w-5 h-5 text-warning-400 mb-1" fill="currentColor" strokeWidth={0} />
    <Text variant="tertiary" size="xs">UV Index</Text>
    <Text size="sm" weight="medium">{current.uvIndex}</Text>
  </div>

  {/* Feels Like */}
  <div className="flex flex-col items-center p-3 bg-slate-800/40 rounded-xl">
    <Thermometer className="w-5 h-5 text-ember-400 mb-1" />
    <Text variant="tertiary" size="xs">Feels Like</Text>
    <Text size="sm" weight="medium">{current.feelsLike.toFixed(1)}°</Text>
  </div>

  {/* Pressure */}
  <div className="flex flex-col items-center p-3 bg-slate-800/40 rounded-xl">
    <Gauge className="w-5 h-5 text-slate-400 mb-1" />
    <Text variant="tertiary" size="xs">Pressure</Text>
    <Text size="sm" weight="medium">{current.pressure} hPa</Text>
  </div>

  {/* Visibility */}
  <div className="flex flex-col items-center p-3 bg-slate-800/40 rounded-xl">
    <Eye className="w-5 h-5 text-slate-400 mb-1" />
    <Text variant="tertiary" size="xs">Visibility</Text>
    <Text size="sm" weight="medium">{current.visibility} km</Text>
  </div>
</div>
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Weather icon fonts (weather-icons) | Lucide React tree-shakable SVGs | 2024-2025 | Smaller bundle, better tree-shaking, already in project |
| Custom scroll libraries (react-horizontal-scrolling-menu) | Native CSS scroll snap | CSS Scroll Snap Module (2019) | No dependency, touch-friendly, works everywhere |
| react-loading-skeleton | Project-specific Skeleton component | Project standard | Consistent Ember Noir styling, namespace pattern |
| Radix Dialog directly | BottomSheet wrapper component | Project standard | Consistent mobile UX, portal-based, scroll lock built-in |
| Custom modal implementations | Radix primitives | Project standard (Radix v1.0+) | Accessibility built-in, focus trap, ESC handling |

**Deprecated/outdated:**
- **weather-icons-react:** Last updated 7 years ago (2018), not maintained, Lucide covers weather icons
- **react-horizontal-scrolling-menu:** Adds 40KB for functionality achievable with native CSS
- **Custom timestamp formatting:** date-fns v4.0 (released 2024) has first-class timezone support and formatDistanceToNow

**Sources:**
- [Lucide React Documentation](https://lucide.dev/guide/packages/lucide-react) - Tree-shakable SVG icons
- [CSS Scroll Snap Module Level 1](https://www.w3.org/TR/css-scroll-snap-1/) - Native scroll snap specification
- [date-fns v4.0 Release](https://date-fns.org/) - First-class timezone support

## Open Questions

Things that couldn't be fully resolved:

1. **Indoor temperature source for comparison**
   - What we know: CONTEXT.md requires "indoor/outdoor comparison text: shows how much warmer/colder outside is vs thermostat reading"
   - What's unclear: Which thermostat reading (if multiple rooms) or which device temperature to use
   - Recommendation: Use main/default thermostat reading from Netatmo integration (Phase 1-3). If multiple rooms, use average indoor temp or primary room. Store preference in dashboard settings.

2. **Exact grid layout for weather details**
   - What we know: CONTEXT.md lists "humidity, wind, UV index, pressure, visibility" as required details
   - What's unclear: 2-column vs 3-column vs 4-column grid, responsive breakpoints
   - Recommendation: 2 cols mobile (< 640px), 4 cols tablet (640-1024px), 6 cols desktop (1024px+). Priority order: Humidity, Wind, UV, Feels Like, Pressure, Visibility. Example provided in Code Examples section.

3. **Temperature trend indicator implementation**
   - What we know: Requirement WEATHER-09 asks for "rising/falling arrow"
   - What's unclear: Compare current to forecast? To previous hour? Show numeric change?
   - Recommendation: Compare current temp to same time yesterday (requires historical data from weather cache). If not available, defer to future phase. Arrow only (no numeric change) to avoid clutter.

4. **Forecast day sheet hourly breakdown data availability**
   - What we know: CONTEXT.md specifies "day detail sheet shows both hourly breakdown AND extended stats"
   - What's unclear: Open-Meteo free tier provides hourly data, but Phase 25 API only fetches daily forecast
   - Recommendation: Phase 26 fetches daily only (matches existing API). Add hourly data fetch in Phase 27 when building location settings (can add hourly parameter to API call).

## Sources

### Primary (HIGH confidence)
- Lucide React Documentation - https://lucide.dev/guide/packages/lucide-react (Icon library, 45 weather icons)
- Lucide Filled Icons Guide - https://lucide.dev/guide/advanced/filled-icons (How to create solid/filled icons)
- date-fns v4 Documentation - https://date-fns.org/v4.1.0/docs/formatDistanceToNow (Relative timestamp formatting)
- CSS Scroll Snap Module - https://www.w3.org/TR/css-scroll-snap-1/ (Native horizontal scroll specification)
- Project Components - app/components/ui/ (SmartHomeCard, Skeleton, BottomSheet - already implemented)

### Secondary (MEDIUM confidence)
- [React Weather Widget Patterns](https://github.com/daniel-szulc/react-weather-widget) - Component architecture for weather widgets
- [Horizontal Scroll Best Practices](https://medium.com/@rexosariemen/implementing-horizontal-scroll-buttons-in-react-61e0bb431be) - React horizontal scrolling implementation
- [React Error Boundary with Retry](https://github.com/bvaughn/react-error-boundary/blob/main/README.md) - Error handling with retry button pattern
- [Skeleton Loading Best Practices](https://blog.logrocket.com/handling-react-loading-states-react-loading-skeleton/) - Skeleton screen implementation guide

### Tertiary (LOW confidence)
- Temperature comparison displays - Multiple hardware product pages show side-by-side indoor/outdoor displays, but no specific UI pattern standard found. Recommendation based on clarity and space efficiency.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries already in project, versions verified, Lucide weather icons confirmed (45 icons)
- Architecture: HIGH - Patterns verified against existing project components (SmartHomeCard, Skeleton, BottomSheet)
- Component patterns: HIGH - All referenced components exist in project with working implementations
- Lucide icon mapping: MEDIUM - WMO code mapping to Lucide icons requires manual mapping table, no direct 1:1 library
- Horizontal scroll: HIGH - Native CSS solution, project already uses pattern (Skeleton.LightsCard line 288)
- Temperature comparison: LOW - No standard UI pattern found, recommendation based on clarity

**Research date:** 2026-02-02
**Valid until:** 2026-03-04 (30 days - stable technologies, React/Lucide/date-fns unlikely to change significantly)

---

**Key Decisions from CONTEXT.md Honored:**
- Single unified card (current + forecast together) ✓
- Apple Weather widget layout style ✓
- Full weather details visible: humidity, wind, UV, pressure, visibility ✓
- Details grid of small icons/values ✓
- Filled/solid icon style (Lucide with fill prop) ✓
- Day/night icon variants (WeatherIcon component handles) ✓
- Static icons (no animation) ✓
- Natural weather colors for recognition ✓
- Celsius only, one decimal precision (18.5°C) ✓
- "Feels like" in details grid ✓
- Indoor/outdoor temperature comparison ✓
- Scrollable horizontal forecast row ✓
- Each day: day name + icon + high/low + precipitation chance ✓
- Bottom sheet for day details with hourly breakdown (data pending) ✓
- Skeleton loading design (Skeleton.WeatherCard to be added) ✓
- Error state layout (EmptyState + retry button pattern) ✓
- Bottom sheet styling (existing BottomSheet component) ✓

**Claude's Discretion Items Addressed:**
- Exact grid layout: 2/4/6 column responsive grid recommended ✓
- Indoor/outdoor comparison format: Text description ("X° warmer than indoor") ✓
- Skeleton loading design: Follow existing Skeleton.ThermostatCard pattern ✓
- Error state layout: EmptyState component with retry button ✓
- Bottom sheet styling: Use existing BottomSheet component with weather-specific content ✓
