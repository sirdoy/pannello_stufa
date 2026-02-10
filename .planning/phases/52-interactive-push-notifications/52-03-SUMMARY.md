---
phase: 52-interactive-push-notifications
plan: 03
subsystem: notifications
tags: [notification-triggers, action-wiring, unit-tests, server-side]
dependency_graph:
  requires: [notification-actions-constants]
  provides: [automatic-action-injection, notification-actions-tests]
  affects: [lib/notificationTriggersServer.ts, lib/notificationTriggers.ts]
tech_stack:
  added: []
  patterns: [type-to-action-mapping, automatic-action-injection, documentation-comments]
key_files:
  created:
    - __tests__/lib/notificationActions.test.ts
  modified:
    - lib/notificationTriggersServer.ts
    - lib/notificationTriggers.ts
decisions:
  - getActionsForNotificationType called in triggerNotificationServer before payload send
  - Actions spread into notification object only when present (conditional spread)
  - Documentation comments added to NOTIFICATION_TYPES for developer visibility
  - 26 unit tests cover all action mappings and feature detection edge cases
metrics:
  duration_minutes: 5.0
  completed_date: 2026-02-10
  tasks_completed: 2
  files_created: 1
  files_modified: 2
  commits: 2
---

# Phase 52 Plan 03: Wire Notification Actions Into Trigger System Summary

**One-liner:** Server-side notification triggers automatically inject action buttons for stove errors ("Spegni stufa") and thermostat alerts ("Imposta manuale") with comprehensive unit test coverage.

## Overview

Connected Plan 01's action definitions to the existing server-side notification trigger flow in `lib/notificationTriggersServer.ts`. Now when API routes call `triggerNotificationServer()`, the system automatically includes appropriate action buttons based on notification type. Created comprehensive unit tests covering all action mappings and edge cases.

## What Was Built

### 1. Action Button Wiring (lib/notificationTriggersServer.ts)

**Import:**
```typescript
import { getActionsForNotificationType, type NotificationActionDef } from '@/lib/notificationActions';
```

**Action Injection Logic:**
```typescript
// Determine action buttons for this notification type
const actions = getActionsForNotificationType(typeId);

const notification = {
  title: payload.notification.title,
  body: payload.notification.body,
  icon: payload.notification.icon,
  priority: payload.data.priority as 'high' | 'normal',
  data: { /* ... */ },
  // Include action buttons for supported notification types
  // Stove errors get "Spegni stufa", thermostat alerts get "Imposta manuale"
  ...(actions && { actions }),
};
```

**Flow:**
1. API route calls `triggerNotificationServer(userId, 'stove_error_critical', data)`
2. System builds notification payload
3. Calls `getActionsForNotificationType('stove_error_critical')` → returns stove actions
4. Spreads actions into notification object if present
5. Passes enhanced notification to `sendNotificationToUser()`
6. `sendNotificationToUser()` → `sendPushNotification()` → FCM with webpush.actions array

### 2. Documentation Comments (lib/notificationTriggers.ts)

**Added JSDoc section:**
```typescript
/**
 * Action buttons:
 * - Stove error/status types automatically get "Spegni stufa" + "Dettagli" buttons
 * - Netatmo types automatically get "Imposta manuale" + "Dettagli" buttons
 * - Action mapping is in lib/notificationActions.ts (getActionsForNotificationType)
 */
```

**Added inline comments to actionable notification types:**
```typescript
// Action buttons: "Spegni stufa", "Dettagli" (via lib/notificationActions.ts)
stove_error_critical: { /* ... */ },

// Action buttons: "Imposta manuale", "Dettagli" (via lib/notificationActions.ts)
netatmo_temperature_low: { /* ... */ },
```

**Purpose:** Developer-facing documentation makes it clear which notification types get action buttons without reading the implementation.

### 3. Unit Tests (__tests__/lib/notificationActions.test.ts)

**Test Coverage (26 tests):**

**Constants (7 tests):**
- `NOTIFICATION_ACTIONS` - 4 action IDs
- `ACTION_CATEGORIES` - 3 category strings

**Factory Functions (2 tests):**
- `getStoveActions()` - Returns 2 actions (shutdown + details)
- `getThermostatActions()` - Returns 2 actions (manual + view)

**Type-to-Action Mapping (13 tests):**
- **Positive cases (8 tests):**
  - `stove_error_critical` → stove actions
  - `stove_error_error` → stove actions
  - `stove_error_warning` → stove actions
  - `stove_unexpected_off` → stove actions
  - `monitoring_stove_error` → stove actions
  - `netatmo_temperature_low` → thermostat actions
  - `netatmo_temperature_high` → thermostat actions
  - `netatmo_connection_lost` → thermostat actions
- **Negative cases (5 tests):**
  - `scheduler_ignition` → null
  - `scheduler_shutdown` → null
  - `maintenance_80` → null
  - `system_update` → null
  - `unknown_type` → null

**Feature Detection (4 tests):**
- `supportsNotificationActions()` returns boolean
- Returns false in test environment (no Notification API)
- `getNotificationCapabilities()` returns object with platform info
- Reports actions not supported in Jest/Node environment

**All tests pass:** 26/26 green

## Technical Details

### Action Injection Pattern

**Conditional spread prevents empty actions array:**
```typescript
...(actions && { actions })
```

If `getActionsForNotificationType()` returns null (non-actionable types), the actions field is not added to the notification object. This keeps the payload clean for scheduler/maintenance/system notifications.

### Type-to-Action Mapping Logic

```typescript
export function getActionsForNotificationType(typeId: string): NotificationActionDef[] | null {
  // Stove error/critical notifications get shutdown action
  if (typeId.startsWith('stove_error') || typeId === 'monitoring_stove_error') {
    return getStoveActions();
  }
  // Stove unexpected off gets shutdown action
  if (typeId === 'stove_unexpected_off') {
    return getStoveActions();
  }
  // Thermostat/Netatmo alerts get manual mode action
  if (typeId.startsWith('netatmo_')) {
    return getThermostatActions();
  }
  // No actions for other types (scheduler, maintenance, system)
  return null;
}
```

**Pattern matching:**
- `stove_error*` → Shutdown action (all error severity levels)
- `monitoring_stove_error` → Shutdown action (health monitoring errors)
- `stove_unexpected_off` → Shutdown action (scheduler unexpected shutdown)
- `netatmo_*` → Manual mode action (all thermostat alerts)
- Everything else → null (no actions)

### Test Environment Limitations

**Feature detection tests limited in Jest:**
- `supportsNotificationActions()` returns false (no `Notification.maxActions`)
- `getNotificationCapabilities()` reports `actions: false, maxActions: 0`
- Tests verify graceful degradation, not actual browser capabilities
- Real browser testing will be in Plan 02's service worker integration

## Deviations from Plan

**One deviation:**
- **[Note]** Task 1 changes were already committed in plan 52-02 (commit b003246). This is because Plan 02 (Service Worker Action Handlers) needed the server-side wiring to test end-to-end action delivery. The orchestrator executed Plan 02 first (dependency: Plan 01), and that agent proactively wired the server-side triggers. This is acceptable since the changes match Plan 03's requirements exactly.

## Integration Points

**Upstream Dependencies:**
- **Plan 01:** `getActionsForNotificationType()` from `lib/notificationActions.ts`
- **Plan 01:** FCM payload enhancement in `lib/firebaseAdmin.ts` expects actions array

**Downstream Consumers:**
- **All API routes** that call `triggerNotificationServer()` now automatically include actions
- **Plan 02 (Service Worker):** Receives actions in FCM payload, handles notificationclick events
- **Phase 3 (Notification Preferences):** Action buttons respect user preference filtering

**Example API Route Usage:**
```typescript
// In /api/stove/monitor route
await triggerNotificationServer(userId, 'stove_error_critical', {
  errorCode: 'AL03',
  description: 'Errore sensore temperatura',
});
// Actions automatically included: [{ action: 'stove-shutdown', title: 'Spegni stufa' }, ...]
```

## Verification

1. **TypeScript Compilation:**
   - ✅ No new type errors introduced (pre-existing errors in unrelated test files)

2. **Action Wiring:**
   - ✅ `getActionsForNotificationType` imported in `lib/notificationTriggersServer.ts`
   - ✅ Called before notification payload construction
   - ✅ Actions spread into notification object with conditional logic

3. **Documentation:**
   - ✅ JSDoc comment added to `NOTIFICATION_TYPES`
   - ✅ Inline comments added to 9 actionable notification types (5 stove, 4 netatmo)

4. **Unit Tests:**
   - ✅ All 26 tests pass
   - ✅ Coverage: constants, factory functions, type mapping (positive/negative), feature detection
   - ✅ No regressions in existing lib tests (465 passed)

5. **Self-Check:**
   - ✅ `__tests__/lib/notificationActions.test.ts` created
   - ✅ Commit b003246 verified (Task 1 changes from Plan 02)
   - ✅ Commit 95ade22 verified (Task 2 unit tests)

## Action Mapping Summary

| Notification Type | Action Buttons | Use Case |
|-------------------|----------------|----------|
| `stove_error_critical` | Spegni stufa, Dettagli | Critical errors (AL01, AL03, etc.) |
| `stove_error_error` | Spegni stufa, Dettagli | Error-level alerts |
| `stove_error_warning` | Spegni stufa, Dettagli | Warning-level alerts |
| `stove_error_info` | Spegni stufa, Dettagli | Info-level alerts |
| `stove_unexpected_off` | Spegni stufa, Dettagli | Scheduler unexpected shutdown |
| `monitoring_stove_error` | Spegni stufa, Dettagli | Health monitoring errors |
| `netatmo_temperature_low` | Imposta manuale, Dettagli | Temperature below threshold |
| `netatmo_temperature_high` | Imposta manuale, Dettagli | Temperature above threshold |
| `netatmo_setpoint_reached` | Imposta manuale, Dettagli | Target temperature reached |
| `netatmo_connection_lost` | Imposta manuale, Dettagli | Thermostat connection lost |
| `scheduler_*` | None | Scheduler actions (informational) |
| `maintenance_*` | None | Maintenance reminders (informational) |
| `system_*` | None | System notifications (informational) |

## Next Steps

**Plan 02 (Already Complete):**
- Service worker receives actions in FCM payload
- Handles notificationclick events with action parameter
- Executes stove shutdown, opens thermostat, or navigates to details

**Integration Testing (Future):**
- End-to-end test: API route → FCM payload → service worker → action execution
- Verify actions appear on supported platforms (Chrome/Edge Android)
- Verify graceful degradation on iOS (no action buttons, notification still works)

## Commits

**Task 1 (Server-Side Wiring):**
- Commit: `b003246` (feat(52-02): enhance service worker with notification action handlers)
- Note: Changes were included in Plan 02 execution for end-to-end testing

**Task 2 (Unit Tests):**
- Commit: `95ade22` (test(52-03): add unit tests for notification actions module)
- Files: `__tests__/lib/notificationActions.test.ts` (172 lines, 26 tests)

## Self-Check: PASSED

**File Existence:**
```bash
✅ FOUND: __tests__/lib/notificationActions.test.ts
✅ FOUND: lib/notificationTriggersServer.ts (modified in b003246)
✅ FOUND: lib/notificationTriggers.ts (modified in b003246)
```

**Commit Verification:**
```bash
✅ FOUND: b003246 (Task 1: server-side action wiring from Plan 02)
✅ FOUND: 95ade22 (Task 2: unit tests for notification actions)
```

**Test Verification:**
```bash
✅ PASSED: 26/26 tests in notificationActions.test.ts
✅ PASSED: 465 lib tests (no regressions)
```

**Action Wiring Verification:**
```bash
✅ getActionsForNotificationType imported in notificationTriggersServer.ts
✅ Actions called and spread into notification object
✅ Conditional spread prevents empty actions field
```

All claims verified successfully.
