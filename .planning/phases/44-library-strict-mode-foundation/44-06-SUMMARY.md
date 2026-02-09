---
phase: 44-library-strict-mode-foundation
plan: 06
subsystem: lib/hooks
tags: [typescript, strict-mode, hooks, pwa, type-safety]
dependency_graph:
  requires: ["44-01"]
  provides: ["Strictly typed PWA hooks", "Geofencing types", "Background sync types"]
  affects: ["Components using PWA hooks", "Geofencing UI", "Offline functionality"]
tech_stack:
  added: []
  patterns:
    - "Export interfaces from utility modules for hook consumption"
    - "BeforeInstallPromptEvent interface for non-standard PWA events"
    - "Type state variables with proper nullable types (Date | null, string | null)"
    - "Handle unknown catch blocks with instanceof Error checks"
    - "Pragmatic any for external API response mapping (Netatmo rooms)"
key_files:
  created: []
  modified:
    - lib/hooks/useGeofencing.ts
    - lib/pwa/geofencing.ts
    - lib/hooks/useOnlineStatus.ts
    - lib/hooks/usePWAInstall.ts
    - lib/hooks/useBackgroundSync.ts
    - lib/hooks/usePeriodicSync.ts
    - lib/hooks/useScheduleData.ts
    - lib/hooks/useRoomStatus.ts
decisions:
  - "Export GeofenceConfig, GeofenceActions, GeofenceStatus types from pwa/geofencing.ts for hook reuse"
  - "Define BeforeInstallPromptEvent interface locally in usePWAInstall (non-standard API)"
  - "Use pragmatic any for room mapping in useRoomStatus (external Netatmo API shape)"
  - "Type command IDs as number to match backgroundSync module signature"
metrics:
  duration_minutes: 11
  tasks_completed: 2
  files_modified: 8
  errors_fixed: 39
  tests_verified: 236
  completed_at: "2026-02-09"
---

# Phase 44 Plan 06: Hooks & PWA Strict Mode Summary

**Type-safe React hooks for PWA capabilities and data fetching with zero tsc strict-mode errors.**

## Objective

Fix all strict-mode tsc errors in React hooks and PWA utility files (39 errors across 8 files). These custom React hooks provide PWA capabilities (geofencing, online status, background sync, periodic sync, install prompt) and data fetching (schedule data, room status).

## Tasks Completed

### Task 1: Fix useGeofencing.ts and pwa/geofencing.ts (18 errors)

**Commit:** `0c89e7a`

**Changes:**
- Exported `GeofenceConfig`, `GeofenceActions`, `GeofenceStatus`, `GeofenceAction`, `GeofenceOptions` interfaces from pwa/geofencing.ts
- Added `UseGeofencingReturn` interface defining complete hook return type
- Typed all useState calls with proper nullable types (`boolean | null`, `number | null`, `GeofenceConfig | null`, `string | null`)
- Typed useRef with proper null types (`useRef<boolean | null>(null)`, `useRef<number | null>(null)`)
- Typed function parameters: `setHomeLocation(options: { radius?: number; actions?: GeofenceActions })`, `updateActions(actions: GeofenceActions)`
- Handled unknown catch blocks with `instanceof Error` checks
- Fixed undefined vs null handling in `getGeofenceConfig()` with `?? null` operator
- Used `GeolocationPositionError` type for permission error code check

**Files:**
- lib/hooks/useGeofencing.ts: 17 errors → 0 errors
- lib/pwa/geofencing.ts: 1 error → 0 errors

### Task 2: Fix remaining hooks (21 errors)

**Commit:** `bdbfc68`

**useOnlineStatus.ts (6 errors → 0 errors):**
- Typed `lastOnlineAt` and `offlineSince` state as `Date | null`
- All Date assignments now type-safe

**usePWAInstall.ts (4 errors → 0 errors):**
- Defined `BeforeInstallPromptEvent` interface extending Event with `prompt()` and `userChoice` methods
- Typed `deferredPromptRef` as `useRef<BeforeInstallPromptEvent | null>(null)`
- Typed event handler parameter: `(e: MediaQueryListEvent)`
- Cast beforeinstallprompt event: `e as BeforeInstallPromptEvent`

**useBackgroundSync.ts (4 errors → 0 errors):**
- Typed `handleMessage` parameter: `(event: MessageEvent)`
- Typed `queueStoveCommand` parameters: `(action: string, data: Record<string, unknown> = {})`
- Typed `handleRetry` and `handleCancel` parameters: `(commandId: number)`
- Updated `UseBackgroundSyncReturn` interface to reflect number type for command IDs

**usePeriodicSync.ts (3 errors → 0 errors):**
- Typed `error` state as `string | null`
- Handled unknown catch blocks with `instanceof Error` checks in both register/unregister

**useScheduleData.ts (2 errors → 0 errors):**
- Defined `Schedule` interface with `selected?: boolean` and index signature
- Typed all state variables: `Schedule[]`, `string | null`
- Handled unknown catch block with `instanceof Error` check
- Fixed `.find(s => s.selected)` type error with Schedule interface

**useRoomStatus.ts (2 errors → 0 errors):**
- Typed room parameter in `.map()`: `(room: any)` (pragmatic any for external Netatmo API)
- Handled unknown catch block with `instanceof Error` check

## Verification

```bash
# All target files have 0 tsc errors
npx tsc --noEmit 2>&1 | grep -E "^lib/hooks/(useGeofencing|useOnlineStatus|usePWAInstall|useBackgroundSync|usePeriodicSync|useScheduleData|useRoomStatus)\.ts:" | wc -l
# Output: 0

npx tsc --noEmit 2>&1 | grep -E "^lib/pwa/geofencing\.ts:" | wc -l
# Output: 0

# Related tests pass
npm test -- --testPathPatterns="(geofencing|online|pwa|sync|schedule|room)"
# Test Suites: 19 passed, Tests: 236 passed
```

## Deviations from Plan

None - plan executed exactly as written.

## Success Criteria

- ✅ useGeofencing.ts: 0 tsc errors (was 17)
- ✅ pwa/geofencing.ts: 0 tsc errors (was 1)
- ✅ useOnlineStatus.ts: 0 tsc errors (was 6)
- ✅ usePWAInstall.ts: 0 tsc errors (was 4)
- ✅ useBackgroundSync.ts: 0 tsc errors (was 4)
- ✅ usePeriodicSync.ts: 0 tsc errors (was 3)
- ✅ useScheduleData.ts: 0 tsc errors (was 2)
- ✅ useRoomStatus.ts: 0 tsc errors (was 2)
- ✅ No behavioral changes to any hook
- ✅ All related tests passing (236 tests)

## Key Patterns

**1. Export utility types for hook consumption:**
```typescript
// lib/pwa/geofencing.ts
export interface GeofenceConfig { ... }
export interface GeofenceActions { ... }

// lib/hooks/useGeofencing.ts
import { type GeofenceConfig, type GeofenceActions } from '@/lib/pwa/geofencing';
```

**2. Non-standard browser API interfaces:**
```typescript
// Define locally when not in @types
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}
```

**3. Proper nullable state typing:**
```typescript
const [isHome, setIsHome] = useState<boolean | null>(null);
const [distance, setDistance] = useState<number | null>(null);
const [lastOnlineAt, setLastOnlineAt] = useState<Date | null>(null);
```

**4. Unknown catch block handling:**
```typescript
catch (err) {
  setError(err instanceof Error ? err.message : 'Unknown error');
}
```

**5. Pragmatic any for external APIs:**
```typescript
// When mapping external API responses with unknown shape
const roomList = (data.rooms || []).map((room: any) => ({ ... }));
```

## Impact

- **Type Safety:** All PWA hook consumers now have proper TypeScript support with autocomplete and type checking
- **Runtime Safety:** Proper null checks prevent runtime errors in geofencing, online detection, and background sync
- **Developer Experience:** Clear interfaces document hook capabilities and return shapes
- **No Behavioral Changes:** All hooks maintain exact same runtime behavior, only internal types added
- **Test Coverage:** 236 related tests passing confirms no regression

## Self-Check: PASSED

```bash
# Verify all modified files exist
[ -f "lib/hooks/useGeofencing.ts" ] && echo "FOUND" || echo "MISSING"
# Output: FOUND

[ -f "lib/pwa/geofencing.ts" ] && echo "FOUND" || echo "MISSING"
# Output: FOUND

[ -f "lib/hooks/useOnlineStatus.ts" ] && echo "FOUND" || echo "MISSING"
# Output: FOUND

[ -f "lib/hooks/usePWAInstall.ts" ] && echo "FOUND" || echo "MISSING"
# Output: FOUND

[ -f "lib/hooks/useBackgroundSync.ts" ] && echo "FOUND" || echo "MISSING"
# Output: FOUND

[ -f "lib/hooks/usePeriodicSync.ts" ] && echo "FOUND" || echo "MISSING"
# Output: FOUND

[ -f "lib/hooks/useScheduleData.ts" ] && echo "FOUND" || echo "MISSING"
# Output: FOUND

[ -f "lib/hooks/useRoomStatus.ts" ] && echo "FOUND" || echo "MISSING"
# Output: FOUND

# Verify commits exist
git log --oneline --all | grep -q "0c89e7a" && echo "FOUND: 0c89e7a" || echo "MISSING: 0c89e7a"
# Output: FOUND: 0c89e7a

git log --oneline --all | grep -q "bdbfc68" && echo "FOUND: bdbfc68" || echo "MISSING: bdbfc68"
# Output: FOUND: bdbfc68
```

**All files exist. All commits present. Self-check PASSED.**
