---
phase: 54-analytics-dashboard
plan: 03
subsystem: analytics
tags: [aggregation, cron, daily-stats, pellet-estimation]
dependency_graph:
  requires: [54-01-types-consent, 54-02-pellet-estimation]
  provides: [daily-stats-aggregation, analytics-cron]
  affects: [dashboard-queries, event-retention]
tech_stack:
  added: []
  patterns: [fire-and-forget, event-session-pairing, cron-endpoint]
key_files:
  created:
    - lib/analyticsAggregationService.ts
    - lib/__tests__/analyticsAggregationService.test.ts
    - app/api/cron/aggregate-analytics/route.ts
  modified: []
decisions:
  - Session pairing algorithm: ignite->shutdown with power_change splitting time between power levels
  - Unclosed sessions handled: calculate hours until end of day (23:59:59)
  - Fire-and-forget pattern: errors logged but never thrown to prevent blocking
  - 7-day retention for raw events: balances dashboard utility with storage costs
metrics:
  duration_minutes: 4.5
  completed_date: 2026-02-11
---

# Phase 54 Plan 03: Daily Analytics Aggregation

**One-liner:** Event session pairing algorithm transforms raw stove events into queryable DailyStats with power-level breakdowns and pellet estimates

## Completed Tasks

| Task | Description | Commit | Files |
|------|-------------|--------|-------|
| 1 | Create analytics aggregation service | e7330ea | lib/analyticsAggregationService.ts, lib/__tests__/analyticsAggregationService.test.ts |
| 2 | Create aggregation cron endpoint | fd915bd | app/api/cron/aggregate-analytics/route.ts, lib/analyticsAggregationService.ts |

## Implementation Summary

### Task 1: Analytics Aggregation Service

Created `lib/analyticsAggregationService.ts` with session-pairing algorithm:

**Event processing flow:**
1. Sort events by timestamp ascending
2. Track session state (ignite starts session, shutdown ends it)
3. Split runtime by power level using `power_change` events
4. Accumulate hours per power level and source (automation vs manual)
5. Handle unclosed sessions (stove still running at midnight)
6. Calculate pellet estimates from usage data

**Key functions:**
- `aggregateDailyStats(dateKey)`: Main aggregation logic
- `saveDailyStats(stats)`: Fire-and-forget save to Firebase
- `createEmptyStats(dateKey)`: Zero-value stats for days with no events

**Test coverage (10 tests):**
- Empty stats when no events exist
- Single ignite+shutdown session hours calculation
- Power_change events split time correctly
- Automation vs manual hours tracking by source
- Ignition/shutdown counts
- Pellet estimation integration
- Unclosed session handling (end of day)
- Firebase path verification
- Fire-and-forget error handling

**Type fixes:**
- Added undefined guard for `byPowerLevel` array access (noUncheckedIndexedAccess compliance)

### Task 2: Aggregation Cron Endpoint

Created `app/api/cron/aggregate-analytics/route.ts`:

**Endpoint:** `GET /api/cron/aggregate-analytics?secret=xxx`

**Flow:**
1. Calculate yesterday's date (YYYY-MM-DD)
2. Call `aggregateDailyStats(dateKey)`
3. Call `saveDailyStats(stats)`
4. Call `cleanupOldAnalyticsEvents(7)` for retention
5. Log execution using `logCronExecution`

**Protection:** `withCronSecret` middleware (same pattern as scheduler/check)

**Error handling:** Fire-and-forget pattern - always returns `success()`, logs errors via `logCronExecution`

**Type fixes:**
- Non-null assertion for `dateKey` (ISO date split always has T separator)

## Deviations from Plan

None - plan executed exactly as written.

## Technical Decisions

### 1. Session Pairing Algorithm
**Decision:** Pair `stove_ignite` with next `stove_shutdown`, using `power_change` events to split time between power levels

**Rationale:**
- Accurately captures multi-power-level sessions
- Handles unclosed sessions gracefully (midnight cutoff)
- Maintains per-level accuracy for pellet estimation

**Alternatives considered:**
- Simple total runtime calculation (loses power-level detail)
- Snapshot-based approach (requires more frequent events)

### 2. Unclosed Session Handling
**Decision:** Calculate hours until 23:59:59.999 of the date being aggregated

**Rationale:**
- Daily aggregation boundary must be consistent
- Next day's aggregation will handle continuation
- Prevents double-counting hours across midnight

### 3. 7-Day Retention for Raw Events
**Decision:** Clean up events older than 7 days after aggregation

**Rationale:**
- Matches `cronExecutionLogger` pattern (24-hour retention)
- Raw events only needed for debugging recent issues
- Aggregated stats provide long-term historical data
- Reduces Firebase storage costs

**Alternatives considered:**
- 30-day retention (excessive for debugging use case)
- No cleanup (unbounded growth risk)

## Dependencies

**Requires:**
- 54-01: `AnalyticsEvent`, `DailyStats` types
- 54-02: `estimatePelletConsumption` service

**Provides:**
- `aggregateDailyStats`: Core aggregation function
- `saveDailyStats`: Stats persistence
- `/api/cron/aggregate-analytics`: Nightly aggregation trigger

**Affects:**
- 54-04+: Dashboard queries will read from `analyticsStats/daily/{date}`
- Event retention: Raw events older than 7 days removed automatically

## Verification

✅ All 10 aggregation service tests pass
✅ No TypeScript errors (full project check)
✅ Cron endpoint follows existing patterns (withCronSecret, success, logCronExecution)
✅ Fire-and-forget error handling (never throws, logs errors)
✅ Session pairing algorithm handles all event types correctly

## Self-Check: PASSED

**Created files exist:**
```
✅ lib/analyticsAggregationService.ts
✅ lib/__tests__/analyticsAggregationService.test.ts
✅ app/api/cron/aggregate-analytics/route.ts
```

**Commits exist:**
```
✅ e7330ea: feat(54-03): create analytics aggregation service
✅ fd915bd: feat(54-03): create aggregation cron endpoint
```

## Next Steps

**Plan 54-04:** Create analytics query API endpoint
- Read aggregated stats from Firebase
- Support period filters (7/30/90 days)
- Calculate totals and averages for dashboard display

**Note:** Cron scheduling (GitHub Actions workflow) will be handled separately in Phase 54 Plan 08 (not this plan's concern).
