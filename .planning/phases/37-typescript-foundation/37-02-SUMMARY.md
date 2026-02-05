---
phase: 37
plan: 02
subsystem: types
tags: [typescript, types, firebase, api]

dependency-graph:
  requires: [37-01]
  provides: [TYPE-01, TYPE-02]
  affects: [37-03, 38-*, 39-*, 40-*, 41-*, 42-*]

tech-stack:
  added: []
  patterns:
    - Barrel export pattern for type modules
    - Type guards (isApiSuccess, isApiError)
    - Union types for API responses and error codes
    - Interface extension (ApiSuccessResponse -> StoveStatusResponse)

file-tracking:
  created:
    - types/index.ts
    - types/firebase/index.ts
    - types/firebase/stove.ts
    - types/firebase/maintenance.ts
    - types/firebase/notifications.ts
    - types/firebase/devices.ts
    - types/api/index.ts
    - types/api/errors.ts
    - types/api/responses.ts
  modified: []

decisions:
  - id: TYPE-BARREL
    choice: Three-level barrel exports
    rationale: Supports both @/types and @/types/firebase, @/types/api imports
  - id: TYPE-GUARD-IMPL
    choice: Runtime type guards included in responses.ts
    rationale: Enables safe API response narrowing without external dependencies

metrics:
  duration: 3 min
  completed: 2026-02-05
---

# Phase 37 Plan 02: Core Type Definitions Summary

Core type definitions for Firebase data structures and API response patterns using barrel export structure.

## Tasks Completed

| # | Task | Commit | Key Files |
|---|------|--------|-----------|
| 1 | Create Firebase data structure types (TYPE-01) | 3274bd7 | types/firebase/*.ts |
| 2 | Create API response/error types (TYPE-02) | da2b76e | types/api/*.ts |
| 3 | Create root barrel export | 0948c56 | types/index.ts |

## What Was Built

### Firebase Types (types/firebase/)

| File | Types Exported | Purpose |
|------|---------------|---------|
| stove.ts | StoveStatus, StovePowerLevel, StoveState, StoveCommand | Stove state and control |
| maintenance.ts | MaintenanceType, MaintenanceHistoryEntry, MaintenanceRecord | Maintenance tracking |
| notifications.ts | NotificationType, NotificationStatus, FCMToken, NotificationPreferences, NotificationHistoryEntry | Push notification system |
| devices.ts | DeviceType, ConnectionStatus, DeviceBase, ThermostatDevice, HueDevice, Device | Device registry |

### API Types (types/api/)

| File | Types Exported | Purpose |
|------|---------------|---------|
| errors.ts | HttpStatus, ErrorCode | HTTP status codes and error code union |
| responses.ts | ApiSuccessResponse, ApiErrorResponse, ApiResponse, StoveStatusResponse, PaginatedResponse | API response shapes |

### Type Guards

```typescript
import { isApiSuccess, isApiError } from '@/types';

if (isApiSuccess(response)) {
  // response is ApiSuccessResponse
}
```

## Usage Examples

```typescript
// Import from root barrel
import type { StoveState, ApiResponse, ErrorCode } from '@/types';
import { isApiSuccess } from '@/types';

// Or import from specific subdirectory
import type { StoveState } from '@/types/firebase';
import type { ApiResponse } from '@/types/api';
```

## Deviations from Plan

None - plan executed exactly as written.

## Verification Results

| Check | Result |
|-------|--------|
| types/firebase/ contains 5 files | PASS |
| types/api/ contains 3 files | PASS |
| types/index.ts barrel exists | PASS |
| TypeScript compilation | PASS |
| Import from @/types | PASS |
| TYPE-01 satisfied | PASS |
| TYPE-02 satisfied | PASS |

## Key Type Definitions

### StoveStatus (most used)
```typescript
type StoveStatus = 'off' | 'igniting' | 'running' | 'modulating' | 'shutdown' | 'error' | 'standby';
```

### ErrorCode (32 values)
Derived from lib/core/apiErrors.js ERROR_CODES - includes stove, netatmo, hue, and general error codes.

### ApiResponse Pattern
```typescript
type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;
```

## Next Phase Readiness

**37-03 can now:**
- Import types for migrating lib/core/*.js to TypeScript
- Use ApiResponse type for gradual API route migration
- Reference FirebaseTypes for data validation

**Dependencies satisfied:**
- TYPE-01: Firebase types available at @/types/firebase
- TYPE-02: API types available at @/types/api
