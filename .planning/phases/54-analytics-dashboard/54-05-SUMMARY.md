---
phase: 54-analytics-dashboard
plan: 05
subsystem: analytics
tags: [api-routes, stats-cards, pellet-calibration, dashboard-api]
dependency_graph:
  requires: [54-01-types-consent, 54-02-pellet-estimation, 54-03-aggregation]
  provides: [stats-query-api, calibration-api, stats-cards-ui]
  affects: [dashboard-page, user-calibration-flow]
tech_stack:
  added: []
  patterns: [api-route-handler, design-system-composition, responsive-grid]
key_files:
  created:
    - app/api/analytics/stats/route.ts
    - app/api/analytics/calibrate/route.ts
    - app/components/analytics/StatsCards.tsx
  modified: []
decisions:
  - Stats API reads pre-aggregated daily stats from analyticsStats/daily path
  - Period filtering client-side after fetching all stats (simple and sufficient for expected data volume)
  - Calibration factor recalculates pellet totals with user-specific adjustment
  - StatsCards uses lucide-react icons per project standard (no emoji placeholders)
  - Glass card variant chosen for analytics dashboard aesthetic consistency
metrics:
  duration_minutes: 4.0
  completed_date: 2026-02-11
---

# Phase 54 Plan 05: Analytics API Routes and Stats Cards

**One-liner:** Stats query API with period filtering and user calibration, plus responsive StatsCards grid component for dashboard summary metrics

## Completed Tasks

| Task | Description | Commit | Files |
|------|-------------|--------|-------|
| 1 | Create analytics stats and calibrate API routes | 6446663 | app/api/analytics/stats/route.ts, app/api/analytics/calibrate/route.ts |
| 2 | Create StatsCards summary component | b231ac1 | app/components/analytics/StatsCards.tsx |

## Implementation Summary

### Task 1: Analytics API Routes

Created two API endpoints for analytics data retrieval and calibration:

**Stats API (`GET /api/analytics/stats`):**
- Query params: `period` (7, 30, or 90 days, defaults to 30)
- Reads pre-aggregated daily stats from Firebase RTDB (`analyticsStats/daily`)
- Filters stats within date range (ISO date string comparison)
- Reads user calibration settings from `users/{userId}/analyticsSettings`
- Calculates period totals:
  - Total hours (automation + manual)
  - Total pellet kg (recalculated with user calibration factor)
  - Total cost (pellet kg × user cost per kg)
  - Automation percentage (automation hours / total hours × 100)
- Returns filtered days array + totals object + calibration metadata

**Calibrate API (`POST /api/analytics/calibrate`):**
- Body: `{ actualKg, estimatedKg, pelletCostPerKg }` (all optional)
- Validates input (positive numbers required)
- Calculates calibration factor: `actualKg / estimatedKg` (rounded to 4 decimals)
- Saves to Firebase: `users/{userId}/analyticsSettings`
- Updates: `pelletCalibrationFactor`, `lastCalibrationDate`, `lastCalibrationActual`, `lastCalibrationEstimated`, `pelletCostPerKg`
- Returns success + updated fields

**Auth & Error Handling:**
- Both routes use `withAuthAndErrorHandler` (Auth0 session required)
- Both use `export const dynamic = 'force-dynamic'` for Next.js 15 API routes
- Environment paths via `getEnvironmentPath` for dev/prod separation

### Task 2: StatsCards Component

Created responsive summary cards grid component:

**Layout:**
- 2 columns on mobile, 4 columns on desktop (`grid-cols-2 lg:grid-cols-4`)
- 4 metric cards: Total Hours, Pellet Used, Estimated Cost, Automation %

**Card Structure:**
- Icon + label in top row (lucide-react icons with ember accent)
- Value + unit in bottom row (ember heading variant)
- Glass card variant with default padding

**Icons:**
- Clock (Total Hours)
- Flame (Pellet Used)
- Euro (Estimated Cost)
- Zap (Automation %)

**Loading State:**
- 4 skeleton cards with animated pulse
- Placeholder divs for icon and value areas

**Design System:**
- Uses `Card`, `Heading`, `Text` from UI library
- Follows Ember Noir color palette (ember-400 accents)
- No emoji icons (plan specified lucide-react only)

## Deviations from Plan

None - plan executed exactly as written.

## Technical Decisions

### 1. Period Filtering in Stats API
**Decision:** Filter daily stats in-memory after fetching all from Firebase

**Rationale:**
- Simple and sufficient for expected data volume (<365 days typically stored)
- Avoids complex Firebase query syntax (orderByChild + startAt/endAt)
- Aggregated stats are small objects (~200 bytes each)
- Future optimization: Firebase query if data volume becomes issue

**Alternatives considered:**
- Firebase orderByChild queries (more complex, marginal performance gain)
- Separate Firebase paths per period (data duplication)

### 2. Calibration Factor Precision
**Decision:** Round calibration factor to 4 decimal places

**Rationale:**
- Balances precision with readability
- Example: 1.0523 (actual 21kg / estimated 19.95kg)
- Sufficient accuracy for pellet consumption estimates
- Prevents floating-point display issues

### 3. StatsCards Icon Choice
**Decision:** Use lucide-react icons (Clock, Flame, Euro, Zap) instead of emoji

**Rationale:**
- Project standard per CLAUDE.md (design system uses lucide-react)
- Plan research used emoji as placeholders only
- Consistent visual style with rest of UI
- Better accessibility and sizing control

**Alternatives considered:**
- Emoji (❄️🔥💶⚡) - rejected per project patterns

### 4. Glass Card Variant
**Decision:** Use `variant="glass"` for StatsCards

**Rationale:**
- Consistent with analytics dashboard aesthetic
- Provides visual hierarchy (elevated from background)
- Ember accents pop against glass backdrop
- Matches plan specification

## Dependencies

**Requires:**
- 54-01: `AnalyticsEvent`, `DailyStats`, `CalibrationSettings`, `AnalyticsPeriod` types
- 54-02: `estimatePelletConsumption` service for pellet calculations
- 54-03: Daily aggregation creates `analyticsStats/daily/{date}` records

**Provides:**
- `/api/analytics/stats?period=30`: Query endpoint for dashboard data
- `/api/analytics/calibrate`: Calibration save endpoint
- `StatsCards`: Summary metrics component for dashboard page

**Affects:**
- 54-06/07: Dashboard page will consume these API endpoints
- User calibration flow: UI for submitting actual pellet consumption

## Verification

✅ All TypeScript compiles cleanly (no errors in stats, calibrate, StatsCards)
✅ Stats API filters by period (7/30/90 days) and applies user calibration
✅ Calibrate API validates input and persists to Firebase
✅ StatsCards uses design system components (Card, Heading, Text)
✅ No emoji in StatsCards (lucide-react icons only)
✅ Responsive grid layout (2 cols mobile, 4 cols desktop)
✅ Loading state implemented with skeleton placeholders

## Self-Check: PASSED

**Created files exist:**
```
✅ app/api/analytics/stats/route.ts (3003 bytes)
✅ app/api/analytics/calibrate/route.ts (1872 bytes)
✅ app/components/analytics/StatsCards.tsx (2231 bytes)
```

**Commits exist:**
```
✅ 6446663: feat(54-05): create analytics stats and calibrate API routes
✅ b231ac1: feat(54-05): create StatsCards summary component
```

**TypeScript verification:**
```
✅ No errors in analytics API routes
✅ No errors in StatsCards component
```

## Next Steps

**Plan 54-06:** Create analytics dashboard page
- Integrate StatsCards component
- Add period filter selector (7/30/90 days)
- Fetch data from `/api/analytics/stats` endpoint
- Add loading and error states

**Plan 54-07:** Create calibration UI flow
- Modal or form for entering actual pellet consumption
- Display current calibration factor
- Submit to `/api/analytics/calibrate` endpoint
- Refresh dashboard data after calibration
