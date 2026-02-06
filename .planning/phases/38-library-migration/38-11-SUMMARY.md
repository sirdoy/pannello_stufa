---
phase: 38-library-migration
plan: 11
subsystem: firebase-logging
tags: [typescript, firestore, firebase-admin, logging, notifications, query-types]
requires: [38-03]
provides: [firestore-query-pattern, logger-type-safety, notification-trigger-types]
affects: [38-12, 38-13]
tech-stack:
  added: []
  patterns: [firestore-query-type-pattern, interface-first-parameters, union-type-narrowing]
key-files:
  created: []
  modified:
    - lib/healthLogger.ts
    - lib/notificationLogger.ts
    - lib/notificationHistoryService.ts
    - lib/coordinationPauseCalculator.ts
    - lib/notificationTriggers.ts
    - lib/notificationTriggersServer.ts
decisions:
  - id: DEC-38-11-01
    title: Use Query<DocumentData, DocumentData> for Firestore query chains
    rationale: After first where() call, CollectionReference becomes Query. Using correct type prevents 5+ assignment errors per file.
    alternatives: [Cast each assignment, Restructure query logic]
    impact: High - establishes pattern for all Firestore query operations
  - id: DEC-38-11-02
    title: Interface-first approach for filter parameters
    rationale: Replace `{}` parameter types with named interfaces. Prevents property access errors and improves IDE autocomplete.
    alternatives: [Keep {}, Use Record<string, unknown>]
    impact: Medium - improves type safety for all logger query functions
  - id: DEC-38-11-03
    title: Type guard with 'in' operator for union type narrowing
    rationale: sendNotificationToUser returns union where not all branches have successCount/failureCount. Using 'in' operator safely extracts properties.
    alternatives: [Add type guard function, Restructure return type]
    impact: Low - isolated to notification trigger error handling
metrics:
  duration: ~5min
  completed: 2026-02-06
---

# Phase 38 Plan 11: Firestore Query Types & Logger Interfaces

**One-liner**: Fixed 43 TypeScript errors by adding Query types for Firestore chains and replacing `{}` parameter types with proper interfaces across 6 logger/notification files.

## Overview

This gap closure plan addressed the Firestore Query vs CollectionReference type mismatch pattern that occurred across all logger files. The core issue: Firestore's `where()` and `orderBy()` methods return `Query<DocumentData, DocumentData>`, but variables were typed as `CollectionReference`, causing assignment errors on every query chain operation.

Additionally, all filter/options parameters were typed as `{}`, preventing TypeScript from recognizing valid properties and causing 15+ "Property does not exist" errors.

## What Was Built

### Type Interfaces Added

**HealthLogFilter** (lib/healthLogger.ts):
```typescript
interface HealthLogFilter {
  startDate?: Date;
  endDate?: Date;
  hasStateMismatch?: boolean;
  limit?: number;
}
```

**NotificationLogFilter** (lib/notificationLogger.ts):
```typescript
interface NotificationLogFilter {
  startDate?: Date;
  endDate?: Date;
  status?: string;
  type?: string;
  limit?: number;
}
```

**NotificationHistoryFilter** (lib/notificationHistoryService.ts):
```typescript
interface NotificationHistoryFilter {
  limit?: number;
  cursor?: string | null;
  type?: string | null;
  status?: string | null;
}
```

**NotificationPreferencesData** (lib/notificationTriggersServer.ts):
```typescript
interface NotificationPreferencesData {
  enabledTypes?: Record<string, boolean>;
  dndWindows?: unknown[];
  rateLimits?: Record<string, unknown>;
  [key: string]: unknown;
}
```

**TriggerNotificationOptions** (lib/notificationTriggersServer.ts):
```typescript
interface TriggerNotificationOptions {
  skipPreferenceCheck?: boolean;
}
```

**NotificationPayloadData** (lib/notificationTriggers.ts):
```typescript
interface NotificationPayloadData {
  url?: string;
  [key: string]: unknown;
}
```

### Query Type Pattern

Before:
```typescript
let query = db.collection('healthMonitoring'); // CollectionReference
query = query.where(...); // ERROR: Type 'Query' not assignable to 'CollectionReference'
```

After:
```typescript
let query: Query<DocumentData, DocumentData> = db.collection('healthMonitoring');
query = query.where(...); // ✅ Type-safe
query = query.orderBy(...); // ✅ Type-safe
```

### Parameter Typing Pattern

Before:
```typescript
export async function getRecentHealthLogs(options = {}) {
  const startDate = options.startDate; // ERROR: Property 'startDate' does not exist on type '{}'
}
```

After:
```typescript
export async function getRecentHealthLogs(options: HealthLogFilter = {}) {
  const startDate = options.startDate; // ✅ Type-safe optional property
}
```

## Technical Decisions

### 1. Query Type for Firestore Chains
**Decision**: Import `Query` from `firebase-admin/firestore` and type query chain variables as `Query<DocumentData, DocumentData>`.

**Rationale**: Firestore's fluent API returns `Query` after filter/sort operations. Using `CollectionReference` type causes type errors on every assignment. The correct type allows TypeScript to validate the entire query chain.

**Impact**: Established reusable pattern for all Firestore query operations across codebase.

### 2. Interface-First Parameters
**Decision**: Define explicit interfaces for all filter/options parameters instead of using `{}` or `Record<string, unknown>`.

**Rationale**:
- Better IDE autocomplete
- Self-documenting code (interface defines contract)
- Catches typos at compile time
- Prevents accessing non-existent properties

**Impact**: Improved developer experience and caught 15+ property access errors.

### 3. Union Type Narrowing
**Decision**: Use `'successCount' in result` type guard for extracting properties from union types.

**Rationale**: `sendNotificationToUser` returns different shapes depending on success/failure. Not all branches have `successCount`/`failureCount`. Using `in` operator safely narrows the type.

**Alternatives Considered**:
- Type guard function - More verbose, same outcome
- Restructure return type - Would require firebaseAdmin.ts changes (out of scope)

### 4. HealthCheckResult stoveStatus Type
**Decision**: Type `stoveStatus` as `{ StatusDescription?: string } | string | null` to support both object and string formats.

**Rationale**: The stove API sometimes returns an object with `StatusDescription` property, other times a raw string. Using union type allows both patterns.

**Implementation**: Guard check before accessing `StatusDescription`:
```typescript
stoveStatus: typeof health.stoveStatus === 'object' && health.stoveStatus !== null
  ? health.stoveStatus.StatusDescription || null
  : health.stoveStatus || null
```

## Task Commits

| Task | Description | Commit | Files | Errors Fixed |
|------|-------------|--------|-------|--------------|
| 1 | Fix Firestore query types and parameter interfaces in logger files | cda2b34 | healthLogger.ts, notificationLogger.ts, notificationHistoryService.ts | 32 |
| 2 | Fix notification trigger and coordination pause calculator types | e81424f | notificationTriggersServer.ts, notificationTriggers.ts, coordinationPauseCalculator.ts | 11 |

**Total errors resolved**: 43

## Deviations from Plan

None - plan executed exactly as written.

## Verification Results

**Before**: 43 tsc errors across 6 files
**After**: 0 tsc errors

```bash
npx tsc --noEmit 2>&1 | grep -E "^lib/(healthLogger|notificationLogger|notificationHistoryService|notificationTriggers|coordinationPause)" | wc -l
# Result: 0
```

All files compile successfully with strict TypeScript checking.

## Key Patterns Established

### 1. Firestore Query Chain Pattern
```typescript
import { Query, DocumentData } from 'firebase-admin/firestore';

let query: Query<DocumentData, DocumentData> = db.collection('...');
query = query.where('field', '==', value);
query = query.orderBy('timestamp', 'desc');
query = query.limit(100);
```

**Reusable for**: All Firestore query operations in lib/ and app/api/

### 2. Filter Interface Pattern
```typescript
interface XxxFilter {
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  [key: string]?: unknown; // For extensibility
}

export async function getXxx(options: XxxFilter = {}) { ... }
```

**Reusable for**: Any service function accepting filter/options parameters

### 3. Unknown Data Casting Pattern
```typescript
const data = await adminDbGet('path') as SpecificInterface | null;

if (!data) {
  return defaults;
}

// Now TypeScript knows data shape
const value = data.property; // ✅ Type-safe
```

**Reusable for**: All Firebase data fetching with unknown return types

## Next Phase Readiness

**Phase 38 Gap Closure Status**: 11/X plans complete (188 errors → 145 errors)

**Blockers**: None

**Concerns**: None

**Dependencies Satisfied**:
- ✅ Firestore query pattern established for remaining lib/ files
- ✅ Interface-first parameter pattern ready for replication
- ✅ Union type narrowing pattern available for complex return types

**Ready for**: Plans 38-12+ (continue gap closure for remaining lib/ errors)

## Self-Check: PASSED

**Files created**: 0/0 verified (no new files)

**Files modified**: 6/6 verified
- ✅ lib/healthLogger.ts exists
- ✅ lib/notificationLogger.ts exists
- ✅ lib/notificationHistoryService.ts exists
- ✅ lib/coordinationPauseCalculator.ts exists
- ✅ lib/notificationTriggers.ts exists
- ✅ lib/notificationTriggersServer.ts exists

**Commits**: 2/2 verified
- ✅ cda2b34 (Task 1)
- ✅ e81424f (Task 2)

All claimed files exist, all commits present in git log.
