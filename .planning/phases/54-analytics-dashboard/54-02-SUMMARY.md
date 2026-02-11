---
phase: 54-analytics-dashboard
plan: 02
subsystem: analytics
tags: [tdd, service, pure-function]
dependency_graph:
  requires: []
  provides: [pellet-estimation-service]
  affects: [analytics-aggregation, consumption-charts]
tech_stack:
  added: []
  patterns: [pure-function, tdd-red-green-refactor]
key_files:
  created:
    - lib/pelletEstimationService.ts
    - lib/__tests__/pelletEstimationService.test.ts
  modified: []
decisions: []
metrics:
  duration_minutes: 3.6
  tasks_completed: 1
  files_created: 2
  tests_added: 19
  commits: 2
  completed_date: 2026-02-11
---

# Phase 54 Plan 02: Pellet Consumption Estimation Service Summary

**One-liner:** Pure TypeScript function calculating pellet consumption (kg) from stove power levels and runtime hours with user calibration support

## What Was Built

Implemented a pure, side-effect-free service for estimating pellet consumption based on stove usage data. The service provides:

- **Base consumption rates**: 0.6-2.0 kg/h for power levels 1-5
- **Calibration factor**: User adjustment multiplier (default 1.0) for real-world variance
- **Cost estimation**: Configurable pellet price per kg (default €0.50)
- **Smart fallback**: Unknown power levels use medium rate (1.2 kg/h)
- **Breakdown**: Per-power-level aggregation with hours and kg
- **Daily average**: Total consumption divided by data points (NaN-safe)
- **Precision**: All numbers rounded to 2 decimal places

**TDD Execution:**
- RED: 19 test cases covering all requirements (commit 54bf7b0)
- GREEN: Minimal implementation passing all tests (commit 7b746bc)
- REFACTOR: Clean code, no refactoring needed

## Technical Implementation

### Core Function Signature
```typescript
function estimatePelletConsumption(
  usageData: UsageDataPoint[],
  calibrationFactor?: number,  // default: 1.0
  pelletCostPerKg?: number     // default: 0.50 EUR
): ConsumptionEstimate
```

### Input/Output Types
```typescript
interface UsageDataPoint {
  powerLevel: number;
  hours: number;
}

interface ConsumptionEstimate {
  totalKg: number;
  costEstimate: number;
  dailyAverage: number;
  byPowerLevel: Record<number, { hours: number; kg: number }>;
}
```

### Test Coverage
19 tests covering:
- Base consumption rate exports validation
- Single and multiple power level calculations
- Calibration factor application (< 1, = 1, > 1)
- Custom cost per kg support
- Unknown power level fallback (levels 0, 6)
- Edge cases: empty array, zero hours, NaN guards
- Rounding precision (2 decimal places)
- Daily average calculation
- byPowerLevel breakdown with aggregation

## Files Created

### lib/pelletEstimationService.ts (112 lines)
Pure function service with:
- Exported constants: BASE_CONSUMPTION_RATES, DEFAULT_PELLET_COST_PER_KG
- Exported types: UsageDataPoint, ConsumptionEstimate
- Core function: estimatePelletConsumption()
- No dependencies on Firebase, localStorage, or external APIs

### lib/__tests__/pelletEstimationService.test.ts (227 lines)
Comprehensive test suite with 19 test cases organized into 7 describe blocks:
- Base exports validation
- Basic calculations
- Calibration factor behavior
- Custom cost handling
- Unknown power level fallback
- Edge cases and precision
- Daily average calculation
- Power level breakdown aggregation

## Deviations from Plan

None - plan executed exactly as written. All test cases from the behavior section were implemented and pass.

## Integration Points

**Provided for future use:**
- `estimatePelletConsumption()` will be called by analytics aggregation service (Phase 54, Plan TBD)
- Types exported for use in analytics components and API routes
- Constants available for UI display (consumption rate reference table)

**No integrations yet:**
- Service is standalone and not yet called by any other code
- Ready for integration in upcoming analytics aggregation plan

## Verification

✅ All 19 tests pass: `npx jest lib/__tests__/pelletEstimationService.test.ts`
✅ No TypeScript errors: `npx tsc --noEmit` (pelletEstimationService clean)
✅ Pure function: No side effects, no external dependencies
✅ Type exports: UsageDataPoint and ConsumptionEstimate ready for reuse

## Success Criteria

- [x] RED: Tests written first, all failed initially (module not found)
- [x] GREEN: Implementation passes all 19 tests
- [x] Pure function with no side effects (no Firebase, no localStorage)
- [x] All numbers rounded to 2 decimals (parseFloat + toFixed)
- [x] Exported constants for use by aggregation service

## Next Steps

**Immediate (Phase 54):**
1. Implement analytics event logger (Plan 03) - logs stove state changes
2. Create aggregation service using pelletEstimationService (Plan TBD)
3. Build consumption chart component consuming estimates (Plan TBD)

**Future:**
- Add user calibration UI (modal for adjusting factor based on real bag consumption)
- Historical trend analysis using daily aggregated estimates
- Cost alerts when consumption exceeds budget threshold

## Self-Check: PASSED

**Files exist:**
```
✓ lib/pelletEstimationService.ts
✓ lib/__tests__/pelletEstimationService.test.ts
```

**Commits exist:**
```
✓ 54bf7b0 - test(54-02): add failing tests for pellet estimation service
✓ 7b746bc - feat(54-02): implement pellet estimation service
```

**Tests pass:**
```
✓ 19/19 tests passing
✓ No TypeScript errors in pelletEstimationService files
```

---

**Summary created:** 2026-02-11
**Execution time:** 3.6 minutes
**Commits:** 2 (RED + GREEN)
**Tests:** 19 passing
