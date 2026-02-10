---
phase: 52-interactive-push-notifications
plan: 01
subsystem: notifications
tags: [fcm, push-notifications, actions, feature-detection]
dependency_graph:
  requires: []
  provides: [notification-actions-constants, notification-feature-detection, fcm-actions-payload]
  affects: [lib/firebaseAdmin.ts, lib/notificationService.ts]
tech_stack:
  added: [notification-actions-api]
  patterns: [shared-constants, feature-detection, platform-specific-payloads]
key_files:
  created:
    - lib/notificationActions.ts
  modified:
    - lib/firebaseAdmin.ts
    - lib/notificationService.ts
decisions:
  - Const objects over enums for action constants (better tree-shaking)
  - Standalone feature detection in notificationActions.ts (avoids circular dependencies)
  - Platform-specific payload fields (webpush.actions, apns.category, android.clickAction)
  - Helper function getCategoryForActions() maps notification type to action category
metrics:
  duration_minutes: 2.9
  completed_date: 2026-02-10
  tasks_completed: 2
  files_created: 1
  files_modified: 2
  commits: 2
---

# Phase 52 Plan 01: Interactive Push Notification Foundation Summary

**One-liner:** Shared action constants module, feature detection for notification actions, and FCM payload enhancement to include webpush/apns/android action configurations.

## Overview

Created the foundation for interactive push notifications by establishing shared action constants, client-side feature detection, and server-side FCM payload enhancement. This enables action buttons on notifications for supported platforms (Chrome/Edge Android, limited iOS support).

## What Was Built

### 1. Notification Actions Module (lib/notificationActions.ts)

**Action Constants:**
- `NOTIFICATION_ACTIONS` - Action IDs (stove-shutdown, view-details, thermostat-manual, thermostat-view)
- `ACTION_CATEGORIES` - Category strings for iOS/Android (STOVE_ERROR_ACTIONS, THERMOSTAT_ALERT_ACTIONS, etc.)

**Factory Functions:**
- `getStoveActions()` - Returns stove-related action definitions (shutdown + details)
- `getThermostatActions()` - Returns thermostat-related action definitions (manual mode + details)
- `getActionsForNotificationType(typeId)` - Maps notification type to appropriate actions

**Feature Detection:**
- `supportsNotificationActions()` - Browser capability check with SSR guards
- `getNotificationCapabilities()` - Comprehensive capability object (platform, maxActions, etc.)

### 2. Enhanced FCM Payload (lib/firebaseAdmin.ts)

**Changes:**
- Extended `NotificationPayload` interface to accept optional `actions: NotificationActionDef[]`
- Added `getCategoryForActions()` helper to map notification type to platform category
- Enhanced `webpush.notification` to include actions array when provided
- Added `apns.payload.aps.category` for iOS native app action categories (future-proof for PWA support)
- Added `android.notification.clickAction` for Android intent filtering

**Platform-Specific Handling:**
- **WebPush (Chrome/Edge):** Actions array included in notification payload
- **iOS (APNS):** Category field added (currently PWA doesn't support actions, but prepared for future)
- **Android (FCM):** ClickAction field for intent-based action handling

### 3. Client-Side Feature Detection (lib/notificationService.ts)

**Re-exports:**
- `supportsNotificationActions` from notificationActions.ts
- `getNotificationCapabilities` from notificationActions.ts

This allows client components to check action support before requesting actions from the server.

## Technical Details

### Action ID Pattern

```typescript
export const NOTIFICATION_ACTIONS = {
  STOVE_SHUTDOWN: 'stove-shutdown',
  STOVE_VIEW_DETAILS: 'view-details',
  THERMOSTAT_MANUAL: 'thermostat-manual',
  THERMOSTAT_VIEW: 'thermostat-view',
} as const;
```

**Why const objects over enums:**
- Better tree-shaking (unused actions are eliminated in production build)
- No runtime overhead (enums generate runtime code)
- TypeScript still provides type safety via `as const`

### Feature Detection Pattern

```typescript
export function supportsNotificationActions(): boolean {
  if (typeof window === 'undefined') return false; // SSR guard
  if (!('Notification' in window)) return false;
  try {
    return 'maxActions' in Notification && (Notification as any).maxActions > 0;
  } catch {
    return false;
  }
}
```

**Key considerations:**
- SSR safety (returns false on server)
- Graceful degradation (try/catch for environment inconsistencies)
- Checks `Notification.maxActions` (Chrome/Edge: 2, iOS Safari PWA: 0)

### FCM Payload Enhancement

**WebPush Actions:**
```typescript
webpush: {
  notification: {
    // ... existing fields
    ...(notification.actions && notification.actions.length > 0 && {
      actions: notification.actions.map(a => ({
        action: a.action,
        title: a.title,
        ...(a.icon && { icon: a.icon }),
      })),
    }),
  },
}
```

**iOS Category:**
```typescript
apns: {
  payload: {
    aps: {
      // ... existing fields
      ...(notification.actions && notification.actions.length > 0 && {
        category: getCategoryForActions(notification.data?.type),
      }),
    },
  },
}
```

**Android ClickAction:**
```typescript
android: {
  notification: {
    // ... existing fields
    ...(notification.actions && notification.actions.length > 0 && {
      clickAction: getCategoryForActions(notification.data?.type),
    }),
  },
}
```

### Category Mapping

`getCategoryForActions()` maps notification type to action category:
- `stove_error*` → `STOVE_ERROR_ACTIONS`
- `netatmo_*` → `THERMOSTAT_ALERT_ACTIONS`
- `maintenance` → `MAINTENANCE_ACTIONS`
- Default → `STOVE_STATUS_ACTIONS`

## Deviations from Plan

None - plan executed exactly as written.

## Integration Points

**Consumers of this module:**
- **Plan 02 (Service Worker):** Will import action constants for notificationclick event handling
- **Plan 03 (Notification Triggers):** Will call `getActionsForNotificationType()` to include actions in payloads
- **Client Components:** Can use `supportsNotificationActions()` for feature-aware UI

**Key Links:**
- `lib/notificationActions.ts` → `lib/firebaseAdmin.ts` (action definitions imported)
- `lib/notificationActions.ts` → `lib/notificationService.ts` (feature detection re-exported)
- `lib/firebaseAdmin.ts` consumed by all API routes that send notifications

## Verification

1. **File Existence:**
   - ✅ `lib/notificationActions.ts` created with all exports
   - ✅ `lib/firebaseAdmin.ts` enhanced with actions support
   - ✅ `lib/notificationService.ts` re-exports feature detection

2. **TypeScript Compilation:**
   - ✅ No new type errors introduced (pre-existing errors in dependencies unrelated to changes)

3. **Export Verification:**
   - ✅ `NOTIFICATION_ACTIONS` exported
   - ✅ `ACTION_CATEGORIES` exported
   - ✅ `getStoveActions()` exported
   - ✅ `getThermostatActions()` exported
   - ✅ `supportsNotificationActions()` exported
   - ✅ `getNotificationCapabilities()` exported
   - ✅ `getActionsForNotificationType()` exported

4. **Module Independence:**
   - ✅ No circular dependencies
   - ✅ `notificationActions.ts` is standalone (doesn't import from notificationService)
   - ✅ Feature detection works on server (returns false) and client

## Platform Support Matrix

| Platform | Action Support | Implementation |
|----------|---------------|----------------|
| Chrome/Edge (Desktop) | ✅ Yes (maxActions: 2) | webpush.notification.actions |
| Chrome/Edge (Android) | ✅ Yes (maxActions: 2) | webpush.notification.actions + android.clickAction |
| Firefox (Desktop/Android) | ✅ Yes (maxActions: 2) | webpush.notification.actions |
| Safari (macOS) | ⚠️ Experimental | webpush.notification.actions |
| Safari (iOS PWA) | ❌ No (maxActions: 0) | apns.category prepared for future |
| iOS Native App | ✅ Yes | apns.category (requires UNNotificationCategory registration) |

**Notes:**
- iOS Safari PWA currently doesn't support notification actions (as of iOS 16.4-17.x)
- `apns.category` is included for future-proofing and native app compatibility
- `supportsNotificationActions()` will correctly return false on iOS PWA

## Next Steps

**Plan 02 (Service Worker):**
- Import `NOTIFICATION_ACTIONS` constants
- Handle `notificationclick` event with action parameter
- Implement action-specific logic (stove shutdown, navigate to details, etc.)

**Plan 03 (Notification Triggers):**
- Import `getActionsForNotificationType()`
- Include actions in notification payloads when calling `sendPushNotification()`
- Test action delivery on supported platforms

## Self-Check: PASSED

**File Existence:**
```bash
✅ FOUND: lib/notificationActions.ts
✅ FOUND: lib/firebaseAdmin.ts (modified)
✅ FOUND: lib/notificationService.ts (modified)
```

**Commit Verification:**
```bash
✅ FOUND: 71631b5 (Task 1: notification actions module)
✅ FOUND: c224bb6 (Task 2: FCM payload enhancement)
```

**Export Verification:**
All 7 expected exports present in `lib/notificationActions.ts`:
- NOTIFICATION_ACTIONS ✅
- ACTION_CATEGORIES ✅
- getStoveActions ✅
- getThermostatActions ✅
- supportsNotificationActions ✅
- getNotificationCapabilities ✅
- getActionsForNotificationType ✅

All claims verified successfully.
