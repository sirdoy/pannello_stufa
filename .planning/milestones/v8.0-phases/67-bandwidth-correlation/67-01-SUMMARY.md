---
phase: 67-bandwidth-correlation
plan: 01
subsystem: network-monitoring
tags: [tdd, data-layer, pearson-correlation, react-hooks]
dependency_graph:
  requires: [network-types, bandwidth-history-hook]
  provides: [pearson-utility, correlation-hook, correlation-types]
  affects: [network-page]
tech_stack:
  added: []
  patterns: [tdd-red-green, minute-alignment, buffer-capping]
key_files:
  created:
    - lib/utils/pearsonCorrelation.ts
    - lib/utils/__tests__/pearsonCorrelation.test.ts
    - app/network/hooks/useBandwidthCorrelation.ts
    - app/network/hooks/__tests__/useBandwidthCorrelation.test.ts
  modified:
    - app/components/devices/network/types.ts
decisions:
  - Pearson correlation returns 0 for invalid inputs (empty/mismatched/single element)
  - Minute-level timestamp alignment prevents duplicate points from fast polling
  - Averaging strategy when same minute receives multiple data points
  - MIN_CORRELATION_POINTS=30 (minimum for meaningful Pearson correlation)
  - MAX_CORRELATION_POINTS=2000 (7-day max at 1-minute intervals)
  - Italian insight text with 5 correlation levels (strong/moderate positive/negative/none)
  - Coefficient thresholds - strong >0.7, moderate >0.3, none -0.3 to 0.3
  - Active hours calculation assumes ~30s between measurements
  - Status transitions - stove-off (no data) -> collecting (<30 points) -> ready (30+ points)
metrics:
  duration_minutes: 4
  tasks_completed: 2
  files_created: 4
  files_modified: 1
  tests_added: 20
  completed_date: 2026-02-16
---

# Phase 67 Plan 01: Bandwidth Correlation Data Layer Summary

**One-liner:** Pearson correlation algorithm + useBandwidthCorrelation hook with minute-aligned buffering, Italian insights, and TDD coverage (20 tests)

## Objective Completed

Created the complete data layer for bandwidth-stove power correlation analysis:

1. **Pearson correlation utility** - Mathematical foundation with edge case handling
2. **Correlation types** - TypeScript interfaces for data points, insights, and hook return
3. **useBandwidthCorrelation hook** - React hook managing correlation state with buffering and insight generation

**Purpose achieved:** Provides the computation and state management layer that chart and insight components (Plan 02) will consume.

## Tasks Completed

### Task 1: Pearson Correlation Utility + Types (TDD)

**Commit:** e35ded4

**Files:**
- `lib/utils/pearsonCorrelation.ts` - Pearson correlation coefficient calculation
- `lib/utils/__tests__/pearsonCorrelation.test.ts` - 9 test cases covering all edge cases
- `app/components/devices/network/types.ts` - Added correlation type definitions

**Implementation:**
- Pearson formula: r = [nΣXY - (ΣX)(ΣY)] / sqrt[(nΣX² - (ΣX)²)(nΣY² - (ΣY)²)]
- Returns 0 for invalid inputs (empty arrays, mismatched lengths, single element)
- Guards against division by zero when denominator is 0 (constant values)
- Uses non-null assertion `yValues[i]!` for noUncheckedIndexedAccess compliance

**Test coverage:**
- Empty arrays → 0
- Mismatched lengths → 0
- Single element → 0
- Perfect positive correlation (r=1.0)
- Perfect negative correlation (r=-1.0)
- No correlation (constant y values) → 0
- Moderate correlation (0.3 < r < 0.7)
- Division by zero guards (constant x or y) → 0

**Types added:**
```typescript
CorrelationDataPoint       // time, bandwidth, powerLevel
CorrelationInsightLevel    // strong/moderate positive/negative/none
CorrelationInsight         // coefficient, level, description, dataPointCount, activeHours
CorrelationStatus          // ready | collecting | insufficient | stove-off
UseBandwidthCorrelationReturn  // Hook return interface
```

### Task 2: useBandwidthCorrelation Hook (TDD)

**Commit:** e877ced

**Files:**
- `app/network/hooks/useBandwidthCorrelation.ts` - Correlation hook implementation
- `app/network/hooks/__tests__/useBandwidthCorrelation.test.ts` - 11 test cases

**Implementation details:**
- **Minute alignment:** `Math.round(timestamp / 60000) * 60000` prevents duplicate points from fast polling
- **Averaging:** When same minute receives multiple points, averages bandwidth and powerLevel
- **Null filtering:** Ignores data points when `powerLevel === null` (stove off)
- **Buffer management:** Caps at 2000 points via `.slice(-MAX_CORRELATION_POINTS)`
- **Status logic:**
  - `stove-off`: No data points collected yet
  - `collecting`: 1-29 points (insufficient for correlation)
  - `ready`: 30+ points (Pearson correlation computed)

**Insight generation:**
- Extracts parallel arrays: `chartData.map(p => p.bandwidth)` and `chartData.map(p => p.powerLevel)`
- Computes Pearson coefficient via `calculatePearsonCorrelation()`
- Maps coefficient to Italian text:

| Coefficient Range | Level | Italian Description |
|-------------------|-------|---------------------|
| r > 0.7 | strong-positive | "Correlazione forte positiva: la banda aumenta con la potenza della stufa" |
| r > 0.3 | moderate-positive | "Correlazione moderata: la banda tende ad aumentare con il riscaldamento" |
| -0.3 to 0.3 | none | "Nessuna correlazione significativa tra banda e riscaldamento" |
| r > -0.7 | moderate-negative | "Correlazione moderata: la banda tende a diminuire durante il riscaldamento" |
| r ≤ -0.7 | strong-negative | "Correlazione forte negativa: la banda diminuisce con l'aumento della potenza" |

**Active hours calculation:**
- Formula: `(pointCount * 30) / 3600`
- Assumes ~30 seconds between measurements
- Example: 30 points = 0.25 hours

**Test coverage:**
1. Initial state (stove-off, empty data)
2. Null powerLevel filtering (stove remains off)
3. Collecting state transition (15 points)
4. Ready state transition (30+ points, insight generated)
5. Minute alignment and averaging
6. Strong positive correlation (r > 0.7)
7. Active hours calculation
8. Buffer cap at 2000 points
9. Strong negative correlation (r < -0.7)
10. Moderate positive correlation
11. No correlation (constant power)

## Verification Results

**All tests pass:**
```bash
npm test -- --testPathPatterns="(pearsonCorrelation|useBandwidthCorrelation)"
✓ lib/utils/__tests__/pearsonCorrelation.test.ts (9 tests)
✓ app/network/hooks/__tests__/useBandwidthCorrelation.test.ts (11 tests)
Test Suites: 2 passed
Tests: 20 passed
```

**TypeScript compilation:** Types added to existing file, no new errors introduced.

## Deviations from Plan

None - plan executed exactly as written.

## Key Decisions

1. **Minute-level alignment** - Chosen over second-level to prevent duplicate points from 30s polling interval while maintaining sufficient granularity for correlation analysis

2. **Averaging duplicate points** - When same minute receives multiple data points, average bandwidth and powerLevel rather than keeping latest or discarding (provides smoother data)

3. **Stove-off filtering** - `powerLevel === null` points are completely filtered out rather than storing with special marker (cleaner data buffer, prevents correlation pollution)

4. **Coefficient thresholds** - Used research-recommended thresholds (0.3, 0.7) for correlation strength categorization

5. **Active hours assumption** - Assumes ~30s between measurements based on network polling interval (30s visible, 5min hidden)

6. **Buffer cap strategy** - Keeps newest 2000 points when cap reached via `.slice(-MAX)` (FIFO queue behavior)

7. **Status transitions** - Three-state model (stove-off → collecting → ready) provides clear UI feedback at each stage

## Integration Points

**Consumes:**
- `@/lib/utils/pearsonCorrelation` - Mathematical correlation calculation
- `@/app/components/devices/network/types` - TypeScript interfaces

**Provides for Plan 02:**
- `useBandwidthCorrelation()` hook with:
  - `chartData: CorrelationDataPoint[]` - Buffered paired data for scatter chart
  - `insight: CorrelationInsight | null` - Italian correlation description
  - `status: CorrelationStatus` - UI state indicator
  - `addDataPoint(bandwidth, powerLevel, timestamp)` - Data ingestion function
  - `pointCount`, `minPoints` - Progress indicators

**Expected usage in Plan 02:**
```typescript
const correlation = useBandwidthCorrelation();

// Feed data from network + stove hooks
useEffect(() => {
  if (bandwidth && stovePower !== undefined) {
    correlation.addDataPoint(
      bandwidth.download,
      stovePower,
      bandwidth.timestamp
    );
  }
}, [bandwidth, stovePower]);

// Render based on status
{correlation.status === 'ready' && (
  <CorrelationChart data={correlation.chartData} />
  <CorrelationInsight insight={correlation.insight} />
)}
```

## Patterns Applied

**TDD Red-Green-Refactor:**
- RED: Created failing tests first (module not found errors)
- GREEN: Implemented minimal code to pass all tests
- No refactor needed (implementation was clean on first pass)

**Minute alignment pattern:**
```typescript
const roundedTime = Math.round(timestamp / 60000) * 60000;
```

**Buffer capping pattern:**
```typescript
if (updated.length > MAX_CORRELATION_POINTS) {
  return updated.slice(-MAX_CORRELATION_POINTS);
}
```

**Parallel array extraction:**
```typescript
const bandwidthValues = chartData.map(p => p.bandwidth);
const powerLevelValues = chartData.map(p => p.powerLevel);
const coefficient = calculatePearsonCorrelation(bandwidthValues, powerLevelValues);
```

## Testing Strategy

**Unit tests (Pearson utility):**
- Mathematical correctness (perfect correlations return ±1.0)
- Edge case handling (empty, mismatched, single element)
- Division by zero guards (constant values)

**Integration tests (Hook):**
- State management (useState, useMemo, useCallback)
- React hook behavior (renderHook from @testing-library/react)
- Data flow (input → buffering → correlation → insight)
- Status transitions (stove-off → collecting → ready)

**Test isolation:**
- Pearson utility is pure function (no dependencies)
- Hook tests use renderHook (no component mounting needed)
- No mocking required (all logic is self-contained)

## Files Summary

| File | Lines | Purpose | Tests |
|------|-------|---------|-------|
| lib/utils/pearsonCorrelation.ts | 42 | Pearson correlation algorithm | 9 |
| app/network/hooks/useBandwidthCorrelation.ts | 166 | Correlation hook with buffering | 11 |
| app/components/devices/network/types.ts | +38 | Type definitions (correlation) | - |

**Total:** 5 files (4 created, 1 modified), 246 lines added, 20 tests

## Next Steps (Plan 02)

Plan 02 will build the UI layer on top of this data foundation:

1. **CorrelationChart component** - Recharts scatter plot visualization
2. **CorrelationInsight component** - Italian insight display with status badges
3. **Network page integration** - Wire hook to network + stove data sources

**Data contract established:**
- Chart consumes `CorrelationDataPoint[]` (time, bandwidth, powerLevel)
- Insight consumes `CorrelationInsight` (coefficient, level, description, stats)
- Status drives conditional rendering (empty/collecting/ready states)

## Self-Check: PASSED

**Created files exist:**
```bash
✓ lib/utils/pearsonCorrelation.ts
✓ lib/utils/__tests__/pearsonCorrelation.test.ts
✓ app/network/hooks/useBandwidthCorrelation.ts
✓ app/network/hooks/__tests__/useBandwidthCorrelation.test.ts
```

**Modified files exist:**
```bash
✓ app/components/devices/network/types.ts (correlation types appended)
```

**Commits exist:**
```bash
✓ e35ded4: test(67-01): add failing test for Pearson correlation utility
✓ e877ced: feat(67-01): implement useBandwidthCorrelation hook with TDD
```

**Tests pass:**
```bash
✓ 20/20 tests passing (9 Pearson + 11 hook)
✓ Test Suites: 2 passed
```

**TypeScript:** No new errors introduced (pre-existing 181 errors unchanged)

---

**Phase 67 Plan 01 execution complete.**
**Duration:** 4 minutes
**Status:** ✅ All success criteria met
