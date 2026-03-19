---
phase: 96-polling-simplification
plan: 01
subsystem: stove-data-fetching
tags: [polling, firebase-removal, staleness, simplification]
requirements_completed: [POLL-01, POLL-02, POLL-03, POLL-08]
dependency_graph:
  requires: []
  provides: [useStoveData-simplified, stove-staleness-thresholds]
  affects: [StoveCard, StovePage, StoveBanners, StovePageBanners, StoveStatus]
tech_stack:
  added: []
  patterns: [useAdaptivePolling, device-specific-staleness-threshold]
key_files:
  created: []
  modified:
    - app/components/devices/stove/hooks/useStoveData.ts
    - lib/pwa/stalenessDetector.ts
    - lib/hooks/useDeviceStaleness.ts
    - app/components/devices/stove/components/StoveStatus.tsx
    - app/components/devices/stove/components/StoveBanners.tsx
    - app/components/devices/stove/StoveCard.tsx
    - app/stove/components/StovePageBanners.tsx
    - app/stove/page.tsx
    - __tests__/components/devices/stove/hooks/useStoveData.test.ts
    - __tests__/components/devices/stove/components/StoveStatus.test.tsx
    - __tests__/components/devices/stove/components/StoveBanners.test.tsx
    - __tests__/components/devices/stove/StoveCard.orchestrator.test.tsx
    - __tests__/stove/StovePage.test.tsx
    - lib/pwa/__tests__/stalenessDetector.test.ts
  deleted:
    - app/api/stove/sync-external-state/route.ts
    - __tests__/components/StoveCard.externalSync.test.tsx
decisions:
  - "useAdaptivePolling at 60s with alwaysActive:true replaces custom Firebase RTDB + polling loop"
  - "isVisible moved from useStoveData return into StoveStatus component directly via useVisibility hook"
  - "StoveCard.externalSync.test.tsx deleted — tested dead code from removed Firebase sync feature"
metrics:
  duration: 9 minutes
  completed: 2026-03-18
  tasks_completed: 2
  tests_passing: 199
  files_modified: 14
  files_deleted: 2
  lines_removed: ~265
---

# Phase 96 Plan 01: Stove Polling Simplification Summary

Replaced complex Firebase RTDB connection monitor + real-time listener + sandbox listeners + custom adaptive polling loop with a single `useAdaptivePolling(60s, alwaysActive:true)` call, removing ~265 lines of code and eliminating all Firebase client dependency from the stove hook.

## What Was Done

### Task 1: Rewrite useStoveData

**Removed from useStoveData.ts:**
- `import { ref, onValue } from 'firebase/database'` and `import { db } from '@/lib/firebase'`
- Firebase connection monitor useEffect (`.info/connected` listener)
- Firebase real-time state listener useEffect (`stove/state` listener)
- Sandbox Firebase listeners useEffect (3 listeners on `sandbox/...`)
- Custom adaptive polling useEffect (15s/60s/10s timeout loop)
- `isFirebaseConnected`, `usePollingFallback`, `lastFirebaseUpdateRef`, `isFirstConnectionRef`, `previousStatusRef`, `previousFanLevelRef`, `previousPowerLevelRef`, `pollingStartedRef` state/refs
- `sync-external-state` POST block in `fetchStatusAndUpdate`
- `isFirebaseConnected`, `usePollingFallback`, `isVisible` from `UseStoveDataReturn` interface

**Added to useStoveData.ts:**
- `import { useAdaptivePolling } from '@/lib/hooks/useAdaptivePolling'`
- Single `useAdaptivePolling({ callback: fetchStatusAndUpdate, interval: 60000, alwaysActive: true, immediate: true })` call
- Stove-specific staleness thresholds: `isAccesa ? 90000 : 180000`

**Deleted:** `app/api/stove/sync-external-state/route.ts` (was syncing poll results back to Firebase)

**Staleness improvements:**
- `getDeviceStaleness(deviceId, thresholdMs?)` — optional custom threshold parameter
- `useDeviceStaleness(deviceId, thresholdMs?)` — threads threshold to detector
- Added test for custom threshold behavior

### Task 2: Clean Up Consumer Chain

**StoveBanners.tsx:** Removed `isFirebaseConnected` prop and Firebase disconnected warning banner.

**StoveCard.tsx:** Removed `isFirebaseConnected` prop pass-through. `isVisible` prop removed from StoveStatus (StoveStatus now calls `useVisibility()` directly).

**StovePageBanners.tsx:** Removed `isFirebaseConnected` prop, Firebase banner, and simplified conditional from `(!isFirebaseConnected || hasPendingCommands)` to `hasPendingCommands`.

**stove/page.tsx:** Removed `isFirebaseConnected` prop pass-through.

**Tests updated:** StoveBanners, StoveStatus, StovePage, StoveCard.orchestrator — all `isFirebaseConnected`/`usePollingFallback`/`isVisible` prop references removed.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] StoveStatus test failing after isVisible prop removal**
- **Found during:** Task 2 verification
- **Issue:** `StoveStatus.test.tsx` still passed `isVisible={false}` as a prop after `isVisible` was removed from the interface (moved to internal `useVisibility()` call)
- **Fix:** Updated test to mock `useVisibility` and control visibility state that way
- **Files modified:** `__tests__/components/devices/stove/components/StoveStatus.test.tsx`
- **Commit:** 5707677

**2. [Rule 1 - Dead Code] StoveCard.externalSync.test.tsx tests deleted functionality**
- **Found during:** Post-task verification
- **Issue:** File tested Firebase sync logic (deleted) and old adaptive polling intervals (10s/15s/60s based on Firebase state, replaced by fixed 60s). Keeping it would be misleading.
- **Fix:** Deleted the file
- **Files modified:** `__tests__/components/StoveCard.externalSync.test.tsx` (deleted)
- **Commit:** 5707677

## Self-Check: PASSED

- useStoveData.ts: FOUND
- stalenessDetector.ts: FOUND
- useDeviceStaleness.ts: FOUND
- sync-external-state/route.ts: CONFIRMED DELETED
- Commit 71023c0 (Task 1): FOUND
- Commit 5707677 (Task 2): FOUND
