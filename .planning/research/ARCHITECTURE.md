# Architecture Research: PWA Push Notifications

**Domain:** PWA Push Notification System Enhancement
**Researched:** 2026-01-23
**Confidence:** HIGH

## Standard Architecture for Production PWA Notifications

### System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     CLIENT LAYER (Browser/PWA)                   │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │ UI Controls │  │ Token Manager│  │ Service Worker       │  │
│  │ (Settings)  │  │ (Client SDK) │  │ (FCM Background)     │  │
│  └──────┬──────┘  └──────┬───────┘  └──────────┬───────────┘  │
│         │                │                      │               │
├─────────┴────────────────┴──────────────────────┴───────────────┤
│                      API LAYER (Next.js)                         │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐    │
│  │ /register   │  │ /preferences│  │ /trigger            │    │
│  │ Token Mgmt  │  │ User Prefs  │  │ Send Notifications  │    │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────────────┘    │
│         │                │                 │                    │
├─────────┴────────────────┴─────────────────┴────────────────────┤
│                    SERVICE LAYER (Business Logic)                │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────┐ │
│  │ Token Lifecycle  │  │ Preference Check │  │ History Log  │ │
│  │ Service          │  │ Service          │  │ Service      │ │
│  └────────┬─────────┘  └────────┬─────────┘  └──────┬───────┘ │
│           │                     │                    │          │
├───────────┴─────────────────────┴────────────────────┴──────────┤
│                  REPOSITORY LAYER (Data Access)                  │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────┐ │
│  │ Token Repository │  │ Prefs Repository │  │ History Repo │ │
│  │ (Admin SDK)      │  │ (Admin SDK)      │  │ (Admin SDK)  │ │
│  └────────┬─────────┘  └────────┬─────────┘  └──────┬───────┘ │
│           │                     │                    │          │
├───────────┴─────────────────────┴────────────────────┴──────────┤
│                     DATA LAYER (Firebase RTDB)                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ users/{userId}/                                           │  │
│  │   fcmTokens/{tokenKey}/    - Token storage              │  │
│  │   notificationPreferences/ - User preferences            │  │
│  │   notificationHistory/     - Sent notifications          │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ notificationStats/         - System-wide metrics         │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              ▲
                              │ Push via FCM
                         Firebase Cloud
                          Messaging
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| **Token Manager** | Request permissions, obtain FCM token, register with backend | Firebase Messaging SDK in Service Worker |
| **Service Worker** | Handle background notifications, token refresh events | firebase-messaging-sw.js with FCM listener |
| **Preference UI** | User controls for notification types, toggle switches | React component with real-time Firebase sync |
| **Token Lifecycle Service** | Register, refresh, cleanup invalid tokens | Server-side service with Admin SDK |
| **Preference Check Service** | Verify user wants notification before sending | Server-side middleware pattern |
| **History Log Service** | Record all sent notifications for audit/debugging | Server-side write to Firebase |
| **Token Repository** | CRUD operations for FCM tokens in Firebase | BaseRepository pattern with Admin SDK |
| **History Repository** | CRUD operations for notification history | BaseRepository pattern with Admin SDK |
| **Monitoring Dashboard** | Display metrics, test panel, delivery status | Admin UI with real-time Firebase queries |

## Recommended Project Structure

```
lib/
├── repositories/
│   ├── base/
│   │   └── BaseRepository.js          # Existing base class
│   ├── NotificationTokenRepository.js  # NEW: Token CRUD
│   └── NotificationHistoryRepository.js # NEW: History CRUD
├── services/
│   ├── NotificationTokenService.js     # NEW: Token lifecycle logic
│   └── NotificationHistoryService.js   # NEW: History tracking logic
├── notificationService.js              # EXISTING: Client-side token/permissions
├── notificationPreferencesService.js   # EXISTING: Preferences check
└── firebaseAdmin.js                    # EXISTING: Admin SDK operations

app/
├── api/
│   └── notifications/
│       ├── register/route.js           # EXISTING: Token registration
│       ├── unregister/route.js         # EXISTING: Token removal
│       ├── preferences/route.js        # EXISTING: Preference management
│       ├── trigger/route.js            # EXISTING: Send notifications
│       ├── test/route.js               # EXISTING: Test notification
│       ├── history/route.js            # NEW: Get user history
│       ├── cleanup/route.js            # NEW: Remove stale tokens
│       └── stats/route.js              # NEW: Admin metrics
└── settings/
    └── notifications/
        ├── page.js                      # EXISTING: Preferences UI
        ├── components/
        │   ├── PreferencesPanel.js      # EXISTING: Toggle controls
        │   ├── HistoryPanel.js          # NEW: Notification history
        │   ├── MonitoringPanel.js       # NEW: Admin monitoring (conditional)
        │   └── TestPanel.js             # NEW: Admin test tools (conditional)

public/
└── firebase-messaging-sw.js            # EXISTING: Service Worker
```

### Structure Rationale

- **repositories/**: Data access layer following existing Repository Pattern with Admin SDK
- **services/**: Business logic layer that orchestrates repositories and enforces rules
- **API routes**: Thin controllers that delegate to services (existing pattern)
- **Components**: UI split by concern (preferences, history, monitoring, testing)

## Architectural Patterns

### Pattern 1: Token Lifecycle Management

**What:** Centralized handling of FCM token registration, refresh, and cleanup

**When to use:** Any PWA notification system requires token management

**Trade-offs:**
- ✅ Prevents duplicate tokens, handles refresh automatically
- ✅ Cleans up stale tokens to reduce FCM quota usage
- ⚠️ Requires background job for cleanup (can use cron or manual trigger)

**Example:**
```typescript
// lib/services/NotificationTokenService.js
export class NotificationTokenService {
  constructor() {
    this.tokenRepo = new NotificationTokenRepository();
  }

  async registerToken(userId, token, metadata) {
    // 1. Sanitize token as Firebase key
    const tokenKey = this.sanitizeKey(token);

    // 2. Check if already registered
    const existing = await this.tokenRepo.getToken(userId, tokenKey);
    if (existing) {
      // Update lastUsed timestamp
      await this.tokenRepo.updateToken(userId, tokenKey, {
        lastUsed: new Date().toISOString(),
      });
      return { existed: true };
    }

    // 3. Register new token
    await this.tokenRepo.createToken(userId, tokenKey, {
      token,
      createdAt: new Date().toISOString(),
      lastUsed: new Date().toISOString(),
      ...metadata,
    });

    return { existed: false };
  }

  async cleanupStaleTokens(userId, maxAgeMs = 90 * 24 * 60 * 60 * 1000) {
    const tokens = await this.tokenRepo.getTokens(userId);
    const now = Date.now();

    for (const [tokenKey, tokenData] of Object.entries(tokens)) {
      const createdAt = new Date(tokenData.createdAt).getTime();
      if (now - createdAt > maxAgeMs) {
        await this.tokenRepo.removeToken(userId, tokenKey);
      }
    }
  }
}
```

### Pattern 2: Notification History with Audit Trail

**What:** Log every notification sent with metadata for debugging and compliance

**When to use:** Production systems requiring audit trails, debugging delivery issues

**Trade-offs:**
- ✅ Enables debugging ("Was notification sent?", "When?", "To which device?")
- ✅ Provides user-facing history ("My recent notifications")
- ✅ Supports compliance/audit requirements
- ⚠️ Increases database writes (1 write per notification sent)
- ⚠️ Requires pagination for users with many notifications

**Example:**
```typescript
// lib/services/NotificationHistoryService.js
export class NotificationHistoryService {
  constructor() {
    this.historyRepo = new NotificationHistoryRepository();
  }

  async logNotification(userId, notification, deliveryResult) {
    const historyEntry = {
      typeId: notification.typeId,
      title: notification.title,
      body: notification.body,
      sentAt: new Date().toISOString(),
      sentTo: deliveryResult.successCount,
      failed: deliveryResult.failureCount,
      metadata: notification.data || {},
    };

    // Push to user's history (Firebase generates key)
    await this.historyRepo.addEntry(userId, historyEntry);

    // Update stats
    await this.historyRepo.incrementDailyStat(
      new Date().toISOString().split('T')[0], // YYYY-MM-DD
      notification.typeId
    );
  }

  async getUserHistory(userId, limit = 50, offset = 0) {
    return this.historyRepo.getHistory(userId, limit, offset);
  }
}
```

### Pattern 3: Preference-Aware Notification Trigger

**What:** Check user preferences before sending every notification

**When to use:** Required for user-controllable notification settings

**Trade-offs:**
- ✅ Respects user preferences, reduces notification fatigue
- ✅ Granular control (category + sub-options)
- ⚠️ Adds latency (1 Firebase read per notification)
- ⚠️ Fail-safe behavior needed (send if preference check fails)

**Example:**
```typescript
// lib/services/NotificationTriggerService.js
export class NotificationTriggerService {
  constructor() {
    this.prefsService = notificationPreferencesService;
    this.historyService = new NotificationHistoryService();
    this.adminService = firebaseAdmin;
  }

  async trigger(userId, typeId, notificationData) {
    // 1. Resolve notification type to category + field
    const { category, field } = this.resolveType(typeId);

    // 2. Check user preferences
    const shouldSend = await this.prefsService.shouldSend(userId, category, field);
    if (!shouldSend) {
      return { sent: false, reason: 'User preferences' };
    }

    // 3. Get user's FCM tokens
    const tokens = await this.adminService.getUserTokens(userId);
    if (!tokens.length) {
      return { sent: false, reason: 'No tokens registered' };
    }

    // 4. Send notification
    const result = await this.adminService.sendNotification(tokens, notificationData);

    // 5. Log to history
    await this.historyService.logNotification(userId, { typeId, ...notificationData }, result);

    return { sent: true, ...result };
  }
}
```

### Pattern 4: Repository Pattern with Admin SDK

**What:** Extend BaseRepository for notification-specific data access

**When to use:** Follows existing codebase pattern, enforces consistent data operations

**Trade-offs:**
- ✅ Consistent with existing architecture (StoveStateRepository, MaintenanceRepository)
- ✅ Centralizes Firebase path management
- ✅ Automatic undefined filtering (Firebase requirement)
- ⚠️ Admin SDK bypasses security rules (acceptable for server-side)

**Example:**
```typescript
// lib/repositories/NotificationTokenRepository.js
import { BaseRepository } from './base/BaseRepository';

export class NotificationTokenRepository extends BaseRepository {
  constructor() {
    super('users'); // Base path
  }

  async getTokens(userId) {
    return this.get(`${userId}/fcmTokens`) || {};
  }

  async getToken(userId, tokenKey) {
    return this.get(`${userId}/fcmTokens/${tokenKey}`);
  }

  async createToken(userId, tokenKey, tokenData) {
    return this.set(`${userId}/fcmTokens/${tokenKey}`, this.withTimestamp(tokenData, 'createdAt'));
  }

  async updateToken(userId, tokenKey, updates) {
    return this.update(`${userId}/fcmTokens/${tokenKey}`, this.withTimestamp(updates));
  }

  async removeToken(userId, tokenKey) {
    return this.remove(`${userId}/fcmTokens/${tokenKey}`);
  }
}
```

## Data Flow

### Token Registration Flow

```
User clicks "Enable Notifications"
    ↓
[Client] notificationService.requestNotificationPermission()
    ↓ (Browser prompt)
User grants permission
    ↓
[Client] notificationService.getFCMToken(userId)
    ↓ (Firebase Messaging SDK)
Service Worker obtains FCM token
    ↓
[Client] POST /api/notifications/register { token, userAgent, platform, isPWA }
    ↓
[API Route] withAuthAndErrorHandler → extract userId from session
    ↓
[Service] NotificationTokenService.registerToken(userId, token, metadata)
    ↓
[Repository] NotificationTokenRepository.createToken(userId, sanitizedKey, data)
    ↓
[Firebase] users/{userId}/fcmTokens/{sanitizedKey} = { token, createdAt, lastUsed, ... }
    ↓
[Response] { success: true, token }
```

### Notification Send Flow

```
Trigger event (error, scheduler, maintenance, etc.)
    ↓
[Trigger Code] triggerNotificationServer(userId, typeId, data)
    ↓
[Service] NotificationTriggerService.trigger(userId, typeId, data)
    ↓
[Check 1] Resolve typeId → { category, field }
    ↓
[Check 2] notificationPreferencesService.shouldSend(userId, category, field)
    ↓ (Firebase read: users/{userId}/notificationPreferences)
Preference check: enabled & field enabled?
    ↓ YES
[Repository] Get user's FCM tokens
    ↓ (Firebase read: users/{userId}/fcmTokens)
[Admin SDK] sendNotificationToUser(userId, notification)
    ↓ (FCM API call)
Firebase Cloud Messaging → User's devices
    ↓
[Service] NotificationHistoryService.logNotification(userId, notification, result)
    ↓ (Firebase write: users/{userId}/notificationHistory)
Log entry created with delivery status
    ↓
[Response] { sent: true, successCount, failureCount }
```

### Monitoring Dashboard Flow

```
Admin opens /settings/notifications
    ↓
[Client] Check if user is admin (ADMIN_USER_ID check)
    ↓ YES → Show MonitoringPanel & TestPanel
[Component] MonitoringPanel fetches stats
    ↓
[API] GET /api/notifications/stats
    ↓
[Service] Aggregate metrics from notificationStats and user histories
    ↓
[Response] { totalSent, successRate, byType, recentDeliveries }
    ↓
[UI] Display charts, tables, delivery status
```

### History Retrieval Flow

```
User opens /settings/notifications
    ↓
[Component] HistoryPanel useEffect()
    ↓
[API] GET /api/notifications/history?limit=50&offset=0
    ↓
[Service] NotificationHistoryService.getUserHistory(userId, limit, offset)
    ↓
[Repository] NotificationHistoryRepository.getHistory(userId, limit, offset)
    ↓ (Firebase query: orderByChild('sentAt').limitToLast(limit))
[Firebase] users/{userId}/notificationHistory sorted by sentAt DESC
    ↓
[Response] { history: [...], hasMore: boolean }
    ↓
[UI] Display notification cards with timestamps, infinite scroll
```

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 0-1k users | Current architecture sufficient. Single Firebase RTDB node, no sharding needed. Token cleanup manual or weekly cron. |
| 1k-10k users | Add pagination to history queries (limit=50, offset). Implement token cleanup cron (daily). Add database indexes for `sentAt` field. |
| 10k-100k users | Consider Cloud Functions for token cleanup. Add monitoring for FCM quota (1M free messages/month). Implement notification batching if sending to many users simultaneously. |
| 100k+ users | Shard notification history by month (`notificationHistory/{YYYY-MM}/{userId}`). Use Cloud Firestore instead of RTDB for better query performance. Implement rate limiting on notification sends. |

### Scaling Priorities

1. **First bottleneck:** Firebase RTDB read/write limits (100k concurrent connections)
   - **Fix:** Implement caching for preference checks (Redis or in-memory)
   - **Fix:** Batch history writes (queue → write every 10s)

2. **Second bottleneck:** FCM quota exceeded (1M free messages/month)
   - **Fix:** Aggregate notifications (e.g., "3 new errors" instead of 3 separate notifications)
   - **Fix:** Implement quiet hours (don't send non-critical notifications at night)

## Anti-Patterns

### Anti-Pattern 1: Storing Raw FCM Tokens as Firebase Keys

**What people do:** Use FCM token directly as Firebase key without sanitization

**Why it's wrong:** Firebase paths cannot contain `.`, `$`, `#`, `[`, `]`, `/`. FCM tokens often contain colons and other special characters, causing write failures.

**Do this instead:** Sanitize token before using as key (existing pattern in `register/route.js`):
```javascript
function sanitizeFirebaseKey(token) {
  return token
    .replace(/\./g, '_DOT_')
    .replace(/\$/g, '_DOL_')
    .replace(/#/g, '_HSH_')
    .replace(/\[/g, '_LBR_')
    .replace(/\]/g, '_RBR_')
    .replace(/\//g, '_SLS_');
}
```

### Anti-Pattern 2: Skipping Token Refresh Handling

**What people do:** Register token once, never handle refresh events

**Why it's wrong:** FCM tokens can be invalidated when user clears app data, reinstalls app, or FCM periodically refreshes them. Sending to invalid tokens wastes quota and results in delivery failures.

**Do this instead:** Implement token refresh listener in Service Worker:
```javascript
// public/firebase-messaging-sw.js
messaging.onTokenRefresh(async () => {
  const newToken = await messaging.getToken();
  // Re-register with backend
  fetch('/api/notifications/register', {
    method: 'POST',
    body: JSON.stringify({ token: newToken, ... }),
  });
});
```

### Anti-Pattern 3: Ignoring Notification History Pagination

**What people do:** Query entire notification history with `get(users/{userId}/notificationHistory)`

**Why it's wrong:** As users receive more notifications, the history grows unbounded. Fetching all history causes slow queries, high bandwidth usage, and poor UX.

**Do this instead:** Implement pagination with Firebase queries:
```javascript
// Get latest 50 notifications
const query = ref(db, `users/${userId}/notificationHistory`)
  .orderByChild('sentAt')
  .limitToLast(50);

// For next page, use offset or cursor-based pagination
```

### Anti-Pattern 4: Sending Notifications Without Preference Check

**What people do:** Send notification directly without checking user preferences

**Why it's wrong:** Users cannot control notification types, leading to notification fatigue and users disabling all notifications or uninstalling PWA.

**Do this instead:** Always check preferences before sending (existing pattern):
```javascript
const shouldSend = await shouldSendErrorNotification(userId, 'critical');
if (shouldSend) {
  await sendNotificationToUser(userId, notification);
}
```

### Anti-Pattern 5: Using Client SDK for Admin Operations

**What people do:** Use Firebase Client SDK (`firebase/database`) for token management and sending notifications

**Why it's wrong:**
- Client SDK requires public read/write rules (security risk)
- Cannot send notifications (requires Admin SDK)
- Subject to client-side tampering

**Do this instead:** Use Admin SDK for all server-side operations (existing pattern):
```javascript
// ✅ Server-side API route
import { adminDbSet, sendNotificationToUser } from '@/lib/firebaseAdmin';

export async function POST(request) {
  await adminDbSet(`users/${userId}/fcmTokens/${tokenKey}`, data);
  await sendNotificationToUser(userId, notification);
}
```

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| Firebase Cloud Messaging | Admin SDK + Client SDK | Admin SDK for sending (server), Client SDK for registration (browser) |
| Firebase Realtime Database | Admin SDK (server) | All writes via Admin SDK, bypasses security rules |
| Service Worker (Serwist) | Coexist with FCM SW | Both `sw.js` (Serwist) and `firebase-messaging-sw.js` can coexist |
| Auth0 | Session-based auth | Use `withAuthAndErrorHandler` wrapper for API routes (existing pattern) |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| UI ↔ API Routes | REST JSON | Standard Next.js pattern, client-side fetch |
| API Routes ↔ Services | Direct function calls | Services are server-side only, no HTTP layer |
| Services ↔ Repositories | Direct function calls | Repository pattern encapsulates Firebase operations |
| Client ↔ Service Worker | postMessage() | For token refresh events, background sync |

## Build Order Implications

Based on dependencies between components, suggested build order for roadmap:

### Phase 1: Foundation (Token & History Infrastructure)
**Why first:** Required by all other features
- NotificationTokenRepository (extends BaseRepository)
- NotificationHistoryRepository (extends BaseRepository)
- NotificationTokenService (business logic for tokens)
- NotificationHistoryService (business logic for history)

### Phase 2: Monitoring Backend (Data Collection)
**Why second:** Need data before building dashboard
- `/api/notifications/history` endpoint (get user history)
- `/api/notifications/stats` endpoint (admin metrics)
- `/api/notifications/cleanup` endpoint (remove stale tokens)
- Integrate history logging into existing `/api/notifications/trigger`

### Phase 3: UI Components (User-Facing Features)
**Why third:** Backend ready, now build UI
- HistoryPanel component (user's notification history)
- MonitoringPanel component (admin metrics dashboard)
- TestPanel component (admin testing tools)
- Integrate panels into existing `/settings/notifications` page

### Phase 4: Token Lifecycle Automation (Background Jobs)
**Why last:** Foundation solid, add automation
- Cron job for token cleanup (weekly)
- Token refresh handling in Service Worker
- Stale token detection and removal

### Dependency Graph

```
Phase 1 (Foundation)
    ↓ (Services depend on Repositories)
Phase 2 (Monitoring Backend)
    ↓ (API routes depend on Services)
Phase 3 (UI Components)
    ↓ (UI depends on API endpoints)
Phase 4 (Automation)
    (Can run in parallel with Phase 3)
```

## Integration with Existing Architecture

### Aligns With Current Patterns

| Pattern | Existing Example | Notification Implementation |
|---------|------------------|---------------------------|
| Repository Pattern | `StoveStateRepository`, `MaintenanceRepository` | `NotificationTokenRepository`, `NotificationHistoryRepository` |
| Service Layer | `schedulerService.js`, `maintenanceService.js` | `NotificationTokenService`, `NotificationHistoryService` |
| Admin SDK Usage | `firebaseAdmin.js` operations | All notification data operations use Admin SDK |
| API Route Structure | `/api/schedules/*`, `/api/maintenance/*` | `/api/notifications/*` (already exists, extend) |
| Environment-Aware | `environmentHelper.js` for sandbox/production | Notification system respects same environment paths |
| Client Components | `StoveCard.js`, `ThermostatCard.js` | `HistoryPanel.js`, `MonitoringPanel.js` |

### New Concepts Introduced

1. **Notification History Tracking**: New concept not present in existing systems
   - Audit trail for all sent notifications
   - User-facing history panel
   - Admin metrics dashboard

2. **Token Lifecycle Management**: Extends existing token registration
   - Token refresh handling
   - Stale token cleanup
   - Token validation

3. **Admin Conditional UI**: Role-based component rendering
   - Check `ADMIN_USER_ID` environment variable
   - Show MonitoringPanel & TestPanel only for admin
   - Follows existing pattern (but more explicit)

### Firebase Schema Extensions

```javascript
// EXISTING (v1.76.1)
users/{userId}/
  fcmTokens/{tokenKey}/          // ✅ Already exists
    token, createdAt, lastUsed, userAgent, platform, isPWA
  notificationPreferences/        // ✅ Already exists
    errors/, scheduler/, maintenance/, netatmo/, hue/, system/

// NEW (Milestone)
users/{userId}/
  notificationHistory/{entryKey}/ // 🆕 Add this
    typeId, title, body, sentAt, sentTo, failed, metadata/

notificationStats/                // 🆕 Add this (system-wide)
  daily/{YYYY-MM-DD}/
    totalSent, successRate, byType/
  allTime/
    totalSent, successRate, mostFrequent
```

## Sources

- [FCM Architectural Overview | Firebase](https://firebase.google.com/docs/cloud-messaging/fcm-architecture)
- [Scalable Notification System for a PWA Using FCM](https://amal-krishna.medium.com/scalable-notification-system-for-a-pwa-using-fcm-6a4b8aa093af)
- [Lifecycle of Push Notification Device Tokens](https://medium.com/@chunilalkukreja/lifecycle-of-fcm-device-tokens-61681bb6fbcf)
- [How To Build a Robust Push Notifications for PWAs](https://yundrox.dev/posts/claritybox/how-to-build-robust-pwa-push-notification/)
- [Best practices for FCM registration token management](https://firebase.google.com/docs/cloud-messaging/manage-tokens)
- [Designing a notification system | Notification database design](https://tannguyenit95.medium.com/designing-a-notification-system-1da83ca971bc)
- [Scalable Notification System Design for 50 Million Users](https://dev.to/ndohjapan/scalable-notification-system-design-for-50-million-users-database-design-4cl)
- [How to Design a Notification System: A Complete Guide](https://www.systemdesignhandbook.com/guides/design-a-notification-system/)

---
*Architecture research for: PWA Push Notification System Enhancement*
*Researched: 2026-01-23*
*Confidence: HIGH - Based on official Firebase documentation (updated Jan 2026), community best practices, and existing codebase patterns*
