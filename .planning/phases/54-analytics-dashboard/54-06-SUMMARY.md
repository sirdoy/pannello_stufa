---
phase: 54-analytics-dashboard
plan: 06
subsystem: analytics
tags: [recharts, visualization, charts, ember-noir]
dependency_graph:
  requires:
    - analytics.ts types
    - DeliveryChart.tsx pattern
  provides:
    - UsageChart component (stacked hours by power level)
    - ConsumptionChart component (pellet kg with average)
    - WeatherCorrelation component (dual-axis correlation)
  affects:
    - analytics dashboard assembly (plan 54-07)
tech_stack:
  added:
    - recharts BarChart, ComposedChart
  patterns:
    - Stacked bar charts with power level color progression
    - Reference lines for averages
    - Dual Y-axis for correlation visualization
    - Dark-first Ember Noir chart styling
key_files:
  created:
    - app/components/analytics/UsageChart.tsx
    - app/components/analytics/ConsumptionChart.tsx
    - app/components/analytics/WeatherCorrelation.tsx
  modified: []
decisions:
  - "Power level color scheme: slate→amber→ember→orange→red (low to high heat intensity)"
  - "Ocean blue (#437dae) for temperature line: Contrasts with warm ember palette"
  - "Empty states guide users: 'No usage data', 'No consumption data', 'Weather data unavailable'"
  - "Period summary below ConsumptionChart: Total kg, daily average, estimated cost"
metrics:
  duration_minutes: 3.8
  completed_date: "2026-02-11"
  tasks_completed: 2
  files_created: 3
  commits: 2
---

# Phase 54 Plan 06: Analytics Chart Components Summary

**Three Recharts visualization components: usage hours, pellet consumption, weather correlation**

## Overview

Created three chart components for the analytics dashboard using Recharts library. All follow the existing DeliveryChart.tsx pattern with dark-first Ember Noir styling, loading/empty states, and custom tooltips. Charts visualize stove usage hours by power level, pellet consumption with cost estimates, and weather-consumption correlation using dual Y-axes.

## What Was Built

### UsageChart.tsx (211 lines)
- Stacked bar chart showing daily stove usage hours broken down by power level (1-5)
- Color progression from cool to hot: slate→amber→ember→orange→red
- Custom tooltip displays hours per level and total
- Loading state and empty state with helpful message
- ResponsiveContainer with 300px height

### ConsumptionChart.tsx (204 lines)
- Bar chart showing daily pellet consumption in kg
- Reference line showing daily average consumption
- Custom tooltip displays kg and EUR cost
- Period summary below chart: total kg, daily average, estimated cost
- Loading and empty states matching UsageChart pattern

### WeatherCorrelation.tsx (218 lines)
- ComposedChart with dual Y-axes (pellet kg left, temperature right)
- Filters data to only show days with weather data available
- Ocean blue temperature line overlaid on ember pellet bars
- Custom tooltip shows consumption, temperature, and usage hours
- Empty state guides users: "Weather data unavailable - correlations require weather data from cron"
- 350px height (taller for dual-axis readability)

## Technical Implementation

**Recharts Pattern (from DeliveryChart.tsx):**
- `ResponsiveContainer` with 100% width
- `CartesianGrid` with strokeDasharray "3 3", opacity 10%
- `XAxis`/`YAxis` with currentColor, opacity 60%, 12px font
- Custom tooltips with dark bg, white/10% borders, colored indicators
- Legend with 12px font, circle icons
- Bar radius `[4, 4, 0, 0]` for top-rounded corners

**Data Transformation:**
```typescript
// UsageChart
{
  displayDate: format(parseISO(stat.date), 'MMM dd'),
  date: stat.date,
  level1-5: stat.byPowerLevel[1-5] || 0,
  total: stat.totalHours,
}

// ConsumptionChart
{
  displayDate: format(parseISO(stat.date), 'MMM dd'),
  date: stat.date,
  pelletKg: stat.pelletEstimate.totalKg,
  costEur: stat.pelletEstimate.costEstimate,
}

// WeatherCorrelation (filtered to avgTemperature !== undefined)
{
  displayDate: format(parseISO(stat.date), 'MMM dd'),
  date: stat.date,
  consumptionKg: stat.pelletEstimate.totalKg,
  usageHours: stat.totalHours,
  avgTemperature: stat.avgTemperature,
}
```

**Dual Y-Axis Implementation (WeatherCorrelation):**
```tsx
<YAxis yAxisId="left" label="Pellet (kg)" />
<YAxis yAxisId="right" orientation="right" label="Temp (°C)" />
<Bar yAxisId="left" dataKey="consumptionKg" fill="#ed6f10" />
<Line yAxisId="right" dataKey="avgTemperature" stroke="#437dae" />
```

## Design Decisions

**1. Power Level Color Scheme**
- Level 1 (lowest): `#94a3b8` slate - cool gray
- Level 2: `#f59e0b` amber - warming up
- Level 3 (medium): `#ed6f10` ember-500 - brand color
- Level 4: `#ea580c` orange-600 - high heat
- Level 5 (max): `#dc2626` red-600 - maximum intensity
- Rationale: Visual progression from cool to hot matches thermal reality

**2. Ocean Blue for Temperature**
- Color: `#437dae` (ocean-ish blue)
- Rationale: Cool blue contrasts with warm ember/orange pellet colors, making dual-axis data distinguishable

**3. Period Summary in ConsumptionChart**
- Positioned below chart with flex gap-6
- Shows: Total kg, daily average kg, estimated cost EUR
- Size: xs with secondary variant (subtle but readable)
- Rationale: Provides immediate actionable insights without opening separate modal

**4. Empty State Messaging**
- UsageChart: "No usage data for this period"
- ConsumptionChart: "No consumption data for this period"
- WeatherCorrelation: "Weather data unavailable - correlations require weather data from cron"
- Rationale: Specific messages guide users to understand why data is missing

## Testing

**TypeScript Compilation:**
```bash
npx tsc --noEmit --project tsconfig.json
# Result: 0 errors in all three chart components
```

**Verification Checks:**
- ✅ All charts use 'use client' directive (Recharts requires browser APIs)
- ✅ All charts handle loading state (h-[300px]/[350px] flex center with Text)
- ✅ All charts handle empty state (specific messages)
- ✅ UsageChart meets min 50 lines (211 lines)
- ✅ ConsumptionChart meets min 40 lines (204 lines)
- ✅ WeatherCorrelation meets min 60 lines (218 lines)
- ✅ WeatherCorrelation uses ComposedChart with dual YAxis
- ✅ Styling follows DeliveryChart pattern (currentColor, opacity, dark theme)

## Deviations from Plan

None - plan executed exactly as written. All three charts follow the DeliveryChart pattern precisely, meet minimum line requirements, and implement required features (stacked bars, reference line, dual axes, loading/empty states, custom tooltips).

## Files

**Created:**
- `app/components/analytics/UsageChart.tsx` (211 lines)
- `app/components/analytics/ConsumptionChart.tsx` (204 lines)
- `app/components/analytics/WeatherCorrelation.tsx` (218 lines)

**Modified:**
None

## Commits

| Task | Commit | Files | Description |
|------|--------|-------|-------------|
| 1 | 75bfc2d | 2 | Create UsageChart and ConsumptionChart components |
| 2 | f43f501 | 1 | Create WeatherCorrelation chart component |

## Next Steps

Plan 54-07 will assemble these chart components into the analytics dashboard page (`app/analytics/page.tsx`), integrating with the stats API routes and consent checking logic.

## Self-Check: PASSED

**Files created:**
```bash
[ -f "app/components/analytics/UsageChart.tsx" ] && echo "FOUND: UsageChart.tsx"
# FOUND: UsageChart.tsx

[ -f "app/components/analytics/ConsumptionChart.tsx" ] && echo "FOUND: ConsumptionChart.tsx"
# FOUND: ConsumptionChart.tsx

[ -f "app/components/analytics/WeatherCorrelation.tsx" ] && echo "FOUND: WeatherCorrelation.tsx"
# FOUND: WeatherCorrelation.tsx
```

**Commits exist:**
```bash
git log --oneline --all | grep -q "75bfc2d" && echo "FOUND: 75bfc2d"
# FOUND: 75bfc2d

git log --oneline --all | grep -q "f43f501" && echo "FOUND: f43f501"
# FOUND: f43f501
```

All claims verified. Plan 54-06 complete.
