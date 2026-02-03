---
phase: 28
plan: 01
subsystem: dashboard-preferences
tags: [firebase, api, auth0, per-user, navigation]
dependency-graph:
  requires: [25-01, 25-03]
  provides: [per-user-dashboard-api, dashboard-settings-route]
  affects: [28-02]
tech-stack:
  added: []
  patterns: [per-user-firebase-path, auth0-session-userId]
key-files:
  created: []
  modified:
    - app/api/config/dashboard/route.js
    - lib/services/dashboardPreferencesService.js
    - lib/devices/deviceTypes.js
decisions:
  - Per-user Firebase path for dashboard preferences (not shared app-wide)
  - User paths do not need getEnvironmentPath (already isolated by userId)
  - Icon field added to DEFAULT_CARD_ORDER for UI display
metrics:
  duration: ~3 min
  completed: 2026-02-03
---

# Phase 28 Plan 01: Per-user Dashboard Preferences Infrastructure

Per-user Firebase storage for dashboard preferences with Auth0 authentication and menu navigation.

## What Was Built

### 1. API Route Refactored for Per-user Storage

**File:** `app/api/config/dashboard/route.js`

- Extracts userId from Auth0 session (`session.user.sub`)
- Uses Firebase path `users/${userId}/dashboardPreferences` (not shared config)
- Removed `getEnvironmentPath` - user paths are already isolated per user
- Added icon field to DEFAULT_CARD_ORDER

```javascript
// GET handler signature
export const GET = withAuthAndErrorHandler(async (request, context, session) => {
  const userId = session.user.sub;
  const dashboardPath = `users/${userId}/dashboardPreferences`;
  // ...
});
```

### 2. Client Service Updated for Per-user Storage

**File:** `lib/services/dashboardPreferencesService.js`

All three functions now accept userId as first parameter:
- `getDashboardPreferences(userId)` - Read once
- `setDashboardPreferences(userId, { cardOrder })` - Write
- `subscribeToDashboardPreferences(userId, callback)` - Real-time subscription

Key changes:
- Graceful fallback to defaults when userId is missing
- Throws error on setDashboardPreferences if userId missing
- Icon field added to DEFAULT_CARD_ORDER

### 3. Navigation Menu Entry Added

**File:** `lib/devices/deviceTypes.js`

Added DASHBOARD to SETTINGS_MENU:
```javascript
DASHBOARD: {
  id: 'dashboard',
  name: 'Personalizza home',
  icon: '🏠',
  route: '/settings/dashboard',
  description: 'Ordine e visibilità card',
},
```

Position: After LOCATION, before LOG.

## Commits

| Hash | Description |
|------|-------------|
| afc5e00 | feat(28-01): refactor dashboard API for per-user storage |
| 63a42c8 | feat(28-01): refactor client service for per-user storage |
| 486d499 | feat(28-01): add dashboard settings to navigation menu |

## Decisions Made

| Decision | Rationale |
|----------|-----------|
| Per-user Firebase path | Each user has independent dashboard customization |
| No getEnvironmentPath for user paths | User paths are already namespaced by userId |
| Icon field in DEFAULT_CARD_ORDER | Needed for settings UI display |
| Menu after LOCATION | Groups customization settings together |

## Deviations from Plan

None - plan executed exactly as written.

## Technical Notes

### Firebase Path Structure

```
Before: config/dashboard (shared)
After:  users/{userId}/dashboardPreferences (per-user)
```

### DEFAULT_CARD_ORDER Structure

```javascript
{
  id: 'stove',        // Unique identifier
  label: 'Stufa',     // Display name (Italian)
  icon: '🔥',         // Emoji for UI
  visible: true       // Show/hide on dashboard
}
```

## Next Phase Readiness

Ready for 28-02:
- API accepts per-user preferences
- Service methods ready for settings page consumption
- Menu route `/settings/dashboard` registered
- Settings page component needed next
