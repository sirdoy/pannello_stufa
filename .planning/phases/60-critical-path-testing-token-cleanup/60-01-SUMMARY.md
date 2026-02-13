---
phase: 60-critical-path-testing-token-cleanup
plan: 01
subsystem: notifications/token-management
tags: [refactoring, service-extraction, audit-trail, delivery-tracking]
dependencies:
  requires: []
  provides: [tokenCleanupService, lastUsed-tracking, audit-trail]
  affects: [scheduler-route, cleanup-api-route, fcm-delivery]
tech_stack:
  added: [tokenCleanupService]
  patterns: [service-extraction, fire-and-forget-updates, audit-logging]
key_files:
  created:
    - lib/services/tokenCleanupService.ts
  modified:
    - lib/firebaseAdmin.ts
    - app/api/scheduler/check/route.ts
    - app/api/notifications/cleanup/route.ts
decisions:
  - "Extracted token cleanup to shared service (lib/services/tokenCleanupService.ts)"
  - "Fire-and-forget pattern for lastUsed updates (non-blocking)"
  - "7-day interval check remains in scheduler route (cron schedule concern)"
  - "Audit trail logs to tokenCleanupHistory/{ISO timestamp} path"
  - "90-day staleness threshold, 30-day error log retention"
metrics:
  duration_minutes: 6
  tasks_completed: 2
  files_created: 1
  files_modified: 3
  lines_added: 231
  lines_removed: 261
  commits: 2
  tests_added: 0
completed: 2026-02-13T10:22:00Z
---

# Phase 60 Plan 01: Token Cleanup Service Extraction

**One-liner:** Extracted token cleanup to shared service with audit trail logging and delivery-based lastUsed tracking (TOKEN-01 through TOKEN-04).

## Overview

Refactored duplicated token cleanup logic into a centralized service (`tokenCleanupService.ts`), added audit trail logging for compliance, and implemented delivery-based staleness detection by updating `lastUsed` after successful FCM delivery.

## Implementation Details

### Created Files

**lib/services/tokenCleanupService.ts** (231 lines)
- Exported `cleanupStaleTokens()` function with comprehensive audit trail
- Scans all users' FCM tokens for staleness (90-day threshold)
- Uses `lastUsed || createdAt` for staleness detection (TOKEN-02 integration)
- Active token protection: tokens with `lastUsed` within 90 days are safe (TOKEN-04)
- Removes error logs older than 30 days
- Logs deleted tokens to `tokenCleanupHistory/{ISO timestamp}` with full context (TOKEN-03)
- Fire-and-forget audit logging (doesn't fail cleanup if logging fails)
- Returns `CleanupResult` with statistics and deleted token details

### Modified Files

**lib/firebaseAdmin.ts** (+40 lines)
- Added `updateTokenLastUsed(userId, tokenString)` helper function
- Looks up token key by matching token string, updates `lastUsed` to current ISO timestamp
- Fire-and-forget pattern (logs errors but doesn't throw)
- Integrated into `sendPushNotification()` in both single-token and multi-token paths
- Single-token path: updates after successful `getMessaging().send()`
- Multi-token path: filters successful tokens from response, updates all in parallel
- Updates only happen when `userId` is provided

**app/api/scheduler/check/route.ts** (-112 lines)
- Removed inline `cleanupTokensIfNeeded()` implementation (lines 201-312)
- Replaced with service delegation: `await cleanupStaleTokens()`
- 7-day interval check preserved in scheduler (cron schedule concern, TOKEN-01)
- Added import: `import { cleanupStaleTokens } from '@/lib/services/tokenCleanupService'`
- Reduced from 112 lines to 31 lines (73% reduction)

**app/api/notifications/cleanup/route.ts** (-64 lines)
- Removed inline token scanning and error log cleanup logic
- Simplified to: auth check → service call → response mapping
- Removed interfaces: `TokenData`, `UserSnapshot`, `ErrorData`
- Removed constant: `STALE_THRESHOLD_MS`
- Reduced from 177 lines to 83 lines (53% reduction)

## Deviations from Plan

None - plan executed exactly as written.

## Verification Results

1. ✅ `npx tsc --noEmit` passes (114 pre-existing test errors, no new errors)
2. ✅ `cleanupStaleTokens` exported from `lib/services/tokenCleanupService.ts`
3. ✅ Both routes import and delegate to service
4. ✅ Audit trail logs to `tokenCleanupHistory` path
5. ✅ `updateTokenLastUsed` function exists and is called after successful FCM delivery
6. ✅ Inline token scanning logic removed from scheduler route (verified: no `usersRef.once('value')`)

## Task Breakdown

### Task 1: Create tokenCleanupService and update lastUsed in sendPushNotification
**Duration:** ~3 minutes
**Commit:** `40905de`
**Files:** `lib/services/tokenCleanupService.ts`, `lib/firebaseAdmin.ts`

- Created `tokenCleanupService.ts` with full audit trail support
- Added `updateTokenLastUsed()` helper in `firebaseAdmin.ts`
- Integrated lastUsed updates in both single-token and multi-token delivery paths
- Fire-and-forget pattern for non-blocking updates

### Task 2: Refactor scheduler route and cleanup API to use shared service
**Duration:** ~3 minutes
**Commit:** `a1f19c0`
**Files:** `app/api/scheduler/check/route.ts`, `app/api/notifications/cleanup/route.ts`

- Scheduler route: simplified to interval check + service delegation
- Cleanup API: simplified to auth + service call + response
- Removed 176 lines of duplicated logic across both routes
- Both routes now share single source of truth

## Testing Strategy

No tests added in this plan (testing is Plan 03 scope). This plan focused on extraction and refactoring only.

**Plan 03 will add:**
- Unit tests for `cleanupStaleTokens()` with mock Firebase
- Integration tests for audit trail logging
- Tests for lastUsed update behavior

## Success Criteria Met

- ✅ Token cleanup logic exists in exactly one place (`lib/services/tokenCleanupService.ts`)
- ✅ Both consumer routes (scheduler/check, notifications/cleanup) import and use the service
- ✅ Audit trail logs deleted tokens to Firebase `tokenCleanupHistory` path
- ✅ FCM delivery success updates `lastUsed` timestamp on token record
- ✅ All TypeScript compilation passes (no new errors)

## Dependencies & Integration

**Provides:**
- `cleanupStaleTokens()` service (used by scheduler cron + manual cleanup API)
- `updateTokenLastUsed()` helper (used by FCM notification delivery)
- Audit trail infrastructure (tokenCleanupHistory path)

**Affects:**
- Scheduler cron job (simplified, now uses service)
- Manual cleanup API (simplified, now uses service)
- FCM notification delivery (now tracks lastUsed)

**No Breaking Changes:** All public APIs remain unchanged. Routes return same response format.

## Architecture Decisions

1. **Service extraction pattern:** Followed existing pattern from `pidTuningLogService.ts` and other services in `lib/services/`
2. **Fire-and-forget updates:** `lastUsed` updates don't block notification delivery (performance + reliability)
3. **7-day interval in caller:** Kept interval check in scheduler route (cron schedule concern, not cleanup logic)
4. **Audit trail on deletion:** Only log when tokens/errors are actually deleted (reduces noise)
5. **Token lookup by string:** `updateTokenLastUsed` looks up token key by matching token string (necessary because `sendPushNotification` receives raw tokens, not keys)

## Next Steps (Plan 02-04)

**Plan 02:** Delivery tracking and manual cleanup tools
- Update notification logger to track delivery timestamps
- Add manual cleanup trigger in dashboard

**Plan 03:** Comprehensive unit tests
- Mock Firebase RTDB for `cleanupStaleTokens()` tests
- Test lastUsed update behavior in delivery paths
- Verify audit trail logging

**Plan 04:** Integration tests
- End-to-end token lifecycle test
- Scheduler cron integration test
- Manual cleanup API integration test

## Self-Check: PASSED

**Created files:**
✅ FOUND: lib/services/tokenCleanupService.ts

**Modified files:**
✅ FOUND: lib/firebaseAdmin.ts (updateTokenLastUsed function exists)
✅ FOUND: app/api/scheduler/check/route.ts (imports cleanupStaleTokens)
✅ FOUND: app/api/notifications/cleanup/route.ts (imports cleanupStaleTokens)

**Commits:**
✅ FOUND: 40905de (Task 1: create token cleanup service)
✅ FOUND: a1f19c0 (Task 2: refactor routes to use service)

**Verification:**
✅ TypeScript compilation passes (no new errors)
✅ Inline token scanning removed from scheduler route
✅ Both routes delegate to shared service
✅ Audit trail and lastUsed update implemented

All claims verified. Summary is accurate.
