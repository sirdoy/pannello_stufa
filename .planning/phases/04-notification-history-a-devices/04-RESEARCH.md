# Phase 4: Notification History & Devices - Research

**Researched:** 2026-01-25
**Domain:** Firestore notification logging, infinite scroll pagination, device management UI
**Confidence:** HIGH

## Summary

Phase 4 implements notification history with infinite scroll pagination and enhanced device management UI. The research reveals that the codebase **already has critical infrastructure in place**:

- **Firestore logging system** (`lib/notificationLogger.js`) writing to `notificationLogs` collection
- **Device API** (`/api/notifications/devices`) returning device list with status calculation
- **FCM token management** with deviceId deduplication and automatic cleanup

**Key findings:**
1. Firestore's cursor-based pagination with `startAfter()` + `limit()` is the standard approach for infinite scroll
2. Firestore TTL policies can automate 90-day cleanup for GDPR compliance but have 24-hour deletion lag (requires query filtering)
3. Device naming and status tracking already implemented - UI components are the missing piece
4. Standard inbox patterns emphasize read/unread states, type filtering, and quick actions

**Primary recommendation:** Build on existing `notificationLogger.js` infrastructure with client-side Firestore queries for pagination. Use Firestore security rules to restrict each user to their own logs. Implement TTL policy for auto-cleanup with client-side date filtering as safeguard.

## Standard Stack

The established libraries/tools for notification history and device management in Next.js/Firebase apps:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `firebase-admin/firestore` | 13.6.0 | Server-side Firestore operations | Already integrated, used in `notificationLogger.js` |
| `firebase/firestore` | 12.8.0 | Client-side Firestore queries | Already integrated for pagination/real-time |
| `date-fns` | 4.1.0 | Date formatting and manipulation | Already in package.json, INFRA-05 requirement |
| `react-infinite-scroll-component` | 6.1.1 | Infinite scroll UI component | Industry standard, 5.5k+ stars, simple API |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Firestore TTL policies | N/A | Auto-delete old documents | GDPR 90-day retention (HIST-05) |
| Firestore composite indexes | N/A | Optimize multi-field queries | userId + timestamp + type filtering |
| `ua-parser-js` | 2.0.8 | Device info parsing | Already in use for device fingerprinting |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Firestore | Realtime Database (RTDB) | RTDB lacks complex querying needed for filtering by type/status/date |
| react-infinite-scroll-component | Custom IntersectionObserver | Custom solution adds complexity, library is lightweight (17KB) |
| Firestore TTL | Scheduled Cloud Function | TTL is native and free; Cloud Function costs runtime + invocations |

**Installation:**
```bash
npm install react-infinite-scroll-component
# Firestore and date-fns already installed
```

## Architecture Patterns

### Recommended Project Structure
```
lib/
├── notificationLogger.js           # ✅ Already exists - server logging
├── notificationHistoryService.js   # NEW - client query helpers
└── schemas/
    └── notificationHistory.js      # NEW - Zod schema for validation

app/api/notifications/
├── history/route.js                # NEW - paginated history endpoint
└── devices/
    ├── route.js                    # ✅ Already exists
    ├── [tokenKey]/route.js         # NEW - update device name
    └── [tokenKey]/delete/route.js  # NEW - remove device

app/settings/
├── notifications/
│   └── history/
│       └── page.js                 # NEW - notification inbox UI
└── devices/
    └── page.js                     # ✅ Already exists - enhance with naming

components/notifications/
├── NotificationInbox.js            # NEW - infinite scroll list
├── NotificationItem.js             # NEW - single notification card
├── NotificationFilters.js          # NEW - type/status filters
└── DeviceListItem.js               # NEW - device row with rename/remove
```

### Pattern 1: Firestore Cursor-Based Pagination
**What:** Use Firestore's `startAfter()` with document snapshots as cursors for efficient pagination

**When to use:** Infinite scroll with dynamic data where users can add/delete items

**Example:**
```javascript
// lib/notificationHistoryService.js
import { getAdminFirestore } from './firebaseAdmin.js';
import { Timestamp } from 'firebase-admin/firestore';

export async function getNotificationHistory(userId, options = {}) {
  const db = getAdminFirestore();
  const {
    limit = 50,
    startAfter = null,  // DocumentSnapshot from previous page
    type = null,        // Filter by type
    status = null       // Filter by status
  } = options;

  let query = db.collection('notificationLogs')
    .where('userId', '==', userId)
    .orderBy('timestamp', 'desc');

  // Apply filters
  if (type) {
    query = query.where('type', '==', type);
  }
  if (status) {
    query = query.where('status', '==', status);
  }

  // Pagination cursor
  if (startAfter) {
    query = query.startAfter(startAfter);
  }

  // Apply limit
  query = query.limit(limit);

  const snapshot = await query.get();

  const notifications = [];
  let lastDoc = null;

  snapshot.forEach(doc => {
    notifications.push({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp.toDate().toISOString(),
    });
    lastDoc = doc; // Last document for next cursor
  });

  return {
    notifications,
    lastDoc,           // Pass to client as cursor
    hasMore: snapshot.size === limit,
  };
}
```

**Source:** [Firebase Firestore Query Cursors](https://firebase.google.com/docs/firestore/query-data/query-cursors)

### Pattern 2: Client-Side Infinite Scroll with react-infinite-scroll-component
**What:** Trigger load more when user scrolls to bottom, append new items to existing list

**When to use:** User-facing inbox/feed UI with paginated data

**Example:**
```javascript
// app/settings/notifications/history/NotificationInbox.js
'use client';
import { useState, useEffect } from 'react';
import InfiniteScroll from 'react-infinite-scroll-component';

export default function NotificationInbox() {
  const [notifications, setNotifications] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [hasMore, setHasMore] = useState(true);

  const fetchNotifications = async () => {
    const params = new URLSearchParams({
      limit: 50,
      ...(cursor && { cursor })  // Cursor as base64 encoded snapshot
    });

    const res = await fetch(`/api/notifications/history?${params}`);
    const data = await res.json();

    setNotifications(prev => [...prev, ...data.notifications]);
    setCursor(data.cursor);
    setHasMore(data.hasMore);
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  return (
    <InfiniteScroll
      dataLength={notifications.length}
      next={fetchNotifications}
      hasMore={hasMore}
      loader={<div>Loading...</div>}
      endMessage={<div>No more notifications</div>}
    >
      {notifications.map(notif => (
        <NotificationItem key={notif.id} notification={notif} />
      ))}
    </InfiniteScroll>
  );
}
```

**Source:** [LogRocket - Infinite Scroll in React](https://blog.logrocket.com/react-infinite-scroll/)

### Pattern 3: Firestore TTL Policy for GDPR Compliance
**What:** Configure TTL policy on `notificationLogs` collection to auto-delete documents after 90 days

**When to use:** GDPR-compliant data retention without manual cleanup jobs

**Example:**
```javascript
// Firestore TTL policy configuration (via Firebase Console or gcloud CLI)
// Collection: notificationLogs
// Field: timestamp (must be Firestore Timestamp type)
// TTL: 90 days

// gcloud CLI command:
// gcloud firestore fields ttls update timestamp \
//   --collection-group=notificationLogs \
//   --enable-ttl \
//   --ttl-days=90
```

**Important caveats:**
- Deletion happens **within 24 hours** after expiration (not instant)
- Expired docs still appear in queries until deleted
- **Must filter client-side**: Add `.where('timestamp', '>', ninetyDaysAgo)` to queries

**Source:** [Firebase Firestore TTL Policies](https://firebase.google.com/docs/firestore/ttl)

### Pattern 4: Firestore Security Rules for User-Specific Logs
**What:** Restrict Firestore read/write to user's own notification logs

**When to use:** Client-side Firestore queries that must be secure

**Example:**
```javascript
// firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /notificationLogs/{logId} {
      // Allow read if document belongs to requesting user
      allow read: if request.auth != null
                  && resource.data.userId == request.auth.uid;

      // Only server (Admin SDK) can write
      allow write: if false;
    }
  }
}
```

**Source:** [Firebase Security Rules - User-Specific Data](https://firebase.google.com/docs/firestore/security/rules-conditions)

### Pattern 5: Device Naming with Optimistic UI Updates
**What:** Update device name locally first, then persist to server; rollback on failure

**When to use:** Inline editable fields in device list for better UX

**Example:**
```javascript
// components/notifications/DeviceListItem.js
'use client';
import { useState } from 'react';

export default function DeviceListItem({ device, onUpdate }) {
  const [name, setName] = useState(device.displayName);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState(null);

  const handleSave = async () => {
    const previousName = device.displayName;

    // Optimistic update
    onUpdate(device.id, { displayName: name });
    setIsEditing(false);

    try {
      const res = await fetch(`/api/notifications/devices/${device.tokenKey}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ displayName: name }),
      });

      if (!res.ok) throw new Error('Failed to update');
    } catch (err) {
      // Rollback on failure
      onUpdate(device.id, { displayName: previousName });
      setName(previousName);
      setError('Failed to save name');
    }
  };

  return (
    <div>
      {isEditing ? (
        <input value={name} onChange={(e) => setName(e.target.value)} />
      ) : (
        <span onClick={() => setIsEditing(true)}>{name}</span>
      )}
      {error && <span className="text-error">{error}</span>}
    </div>
  );
}
```

### Anti-Patterns to Avoid

**❌ Using RTDB for notification logs**
- RTDB lacks complex querying (can't filter by userId + type + timestamp efficiently)
- No built-in pagination cursors - must implement manual offset logic
- JSON structure grows unbounded without TTL

**❌ Offset-based pagination (`skip()` / `limit()`)**
- Firestore doesn't support `offset()` natively
- Emulating with client-side skip is inefficient at scale (reads all skipped docs)
- Cursor-based pagination is O(1) per page, offset is O(n)

**❌ Storing full FCM token in UI**
- Security risk if token leaked in client logs/network inspector
- Use `tokenPrefix` (first 20 chars) for display
- Full token only server-side for sending notifications

**❌ Manual cleanup jobs for old notifications**
- Cloud Functions cost runtime + invocations
- Firestore TTL is native, free, and automatic
- TTL + client-side filter is simpler and more reliable

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Infinite scroll detection | Custom scroll event listeners | `react-infinite-scroll-component` | Handles edge cases (resize, fast scroll, initial load), battle-tested |
| Firestore pagination cursors | Manual document offset tracking | `startAfter()` + `DocumentSnapshot` | Built-in, efficient, handles concurrent writes |
| Date range filtering | String comparison on ISO dates | `date-fns` + Firestore `Timestamp` | Type-safe, timezone-aware, consistent with INFRA-05 |
| Old data cleanup | Scheduled Cloud Functions | Firestore TTL policies | Free, automatic, no maintenance |
| Device fingerprinting | Browser canvas/audio fingerprinting | `ua-parser-js` + deviceId hash | Already implemented in `deviceFingerprint.js`, stable across browser updates |

**Key insight:** The codebase already solves most backend challenges. Phase 4 is primarily **UI implementation** leveraging existing APIs (`/api/notifications/devices`, `notificationLogger.js` Firestore collection).

## Common Pitfalls

### Pitfall 1: TTL Deletion Lag Breaking Queries
**What goes wrong:** Firestore TTL deletes docs within 24 hours (not instant). Queries return expired docs until deletion runs.

**Why it happens:** TTL is async batch process, not synchronous trigger

**How to avoid:**
```javascript
// ALWAYS filter by timestamp in queries
const ninetyDaysAgo = new Date();
ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

const query = db.collection('notificationLogs')
  .where('userId', '==', userId)
  .where('timestamp', '>', Timestamp.fromDate(ninetyDaysAgo))  // ← Critical
  .orderBy('timestamp', 'desc');
```

**Warning signs:** Users see notifications older than 90 days in UI

**Source:** [Google Cloud - TTL Policies](https://cloud.google.com/blog/products/databases/manage-storage-costs-using-time-to-live-in-firestore)

### Pitfall 2: Composite Index Missing for Filtered Queries
**What goes wrong:** Query with `userId + type + timestamp` filters fails with "index not found" error

**Why it happens:** Firestore requires composite index for multi-field queries

**How to avoid:**
1. Run query once to trigger index creation prompt in logs
2. Follow link to Firebase Console to create index
3. Or define in `firestore.indexes.json`:
```json
{
  "indexes": [
    {
      "collectionGroup": "notificationLogs",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "type", "order": "ASCENDING" },
        { "fieldPath": "timestamp", "order": "DESCENDING" }
      ]
    }
  ]
}
```

**Warning signs:** Query throws error mentioning "composite index" or shows Firebase Console link

**Source:** [Firebase Firestore Indexes](https://firebase.google.com/docs/firestore/query-data/indexing)

### Pitfall 3: Infinite Scroll Memory Leak
**What goes wrong:** Notification list grows unbounded, causing browser memory issues after 500+ notifications

**Why it happens:** React keeps all loaded notifications in state without pagination reset

**How to avoid:**
- Implement "Back to Top" button that resets state
- Limit max loaded notifications (e.g., 200 items)
- Use virtual scrolling for very large lists (react-window)

```javascript
// Option 1: Max items cap
const MAX_NOTIFICATIONS = 200;

const fetchMore = async () => {
  if (notifications.length >= MAX_NOTIFICATIONS) {
    setHasMore(false);
    return;
  }
  // ... fetch logic
};

// Option 2: Virtual scrolling (for 1000+ items)
// import { FixedSizeList } from 'react-window';
```

**Warning signs:** Browser tab becomes sluggish after scrolling extensively

### Pitfall 4: Device Remove Without Confirmation
**What goes wrong:** User accidentally removes wrong device, loses notifications

**Why it happens:** No confirmation dialog for destructive action

**How to avoid:**
```javascript
const handleRemoveDevice = async (device) => {
  const confirmed = window.confirm(
    `Remove "${device.displayName}"? This device will stop receiving notifications.`
  );

  if (!confirmed) return;

  // ... proceed with deletion
};
```

**Warning signs:** User reports unexpected device removal

### Pitfall 5: Not Updating lastUsed Timestamp
**What goes wrong:** Active devices show as "stale" after 30 days despite regular use

**Why it happens:** `lastUsed` timestamp not updated when notifications are sent

**How to avoid:**
Notification sending should update `lastUsed` timestamp (already implemented in `firebaseAdmin.js` via `updateLastUsed()` in token refresh logic). Ensure this runs for all successful sends:

```javascript
// In sendPushNotification after successful send
await adminDbUpdate(`users/${userId}/fcmTokens/${tokenKey}`, {
  lastUsed: new Date().toISOString()
});
```

**Warning signs:** Devices marked "stale" despite receiving notifications

## Code Examples

Verified patterns from official sources and codebase:

### Firestore Query with Pagination
```javascript
// Source: Firebase official docs + existing notificationLogger.js pattern
import { getAdminFirestore } from '@/lib/firebaseAdmin';
import { Timestamp } from 'firebase-admin/firestore';

export async function getNotificationHistory(userId, { limit = 50, cursor = null, type = null }) {
  const db = getAdminFirestore();

  let query = db.collection('notificationLogs')
    .where('userId', '==', userId)
    .orderBy('timestamp', 'desc');

  if (type) {
    query = query.where('type', '==', type);
  }

  if (cursor) {
    // cursor is DocumentSnapshot from previous page
    query = query.startAfter(cursor);
  }

  query = query.limit(limit);

  const snapshot = await query.get();
  const notifications = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    timestamp: doc.data().timestamp.toDate().toISOString(),
  }));

  return {
    notifications,
    lastDoc: snapshot.docs[snapshot.docs.length - 1],
    hasMore: snapshot.size === limit,
  };
}
```

### Device Naming API Route
```javascript
// app/api/notifications/devices/[tokenKey]/route.js
import { withAuthAndErrorHandler, success, parseJsonOrThrow, validateRequired } from '@/lib/core';
import { adminDbUpdate, adminDbGet } from '@/lib/firebaseAdmin';

export const PATCH = withAuthAndErrorHandler(async (request, context, session) => {
  const userId = session.user.sub;
  const { tokenKey } = await context.params;
  const body = await parseJsonOrThrow(request);
  const { displayName } = body;

  validateRequired(displayName, 'displayName');

  // Verify token belongs to user
  const tokenData = await adminDbGet(`users/${userId}/fcmTokens/${tokenKey}`);
  if (!tokenData) {
    return error('Device not found', 404);
  }

  // Update display name
  await adminDbUpdate(`users/${userId}/fcmTokens/${tokenKey}`, {
    displayName,
    updatedAt: new Date().toISOString(),
  });

  return success({ message: 'Device name updated', displayName });
}, 'Notifications/DeviceName');
```

### Notification Item Component
```javascript
// components/notifications/NotificationItem.js
import { formatDistanceToNow } from 'date-fns';
import { it } from 'date-fns/locale';

export default function NotificationItem({ notification }) {
  const getIcon = (type) => {
    const icons = {
      error: '🚨',
      scheduler: '⏰',
      maintenance: '🔧',
      test: '🧪',
      generic: 'ℹ️',
    };
    return icons[type] || 'ℹ️';
  };

  const getStatusBadge = (status) => {
    const badges = {
      sent: { text: 'Inviata', variant: 'success' },
      delivered: { text: 'Consegnata', variant: 'success' },
      failed: { text: 'Fallita', variant: 'error' },
    };
    return badges[status] || badges.sent;
  };

  return (
    <div className="p-4 border-b">
      <div className="flex items-start gap-3">
        <span className="text-2xl">{getIcon(notification.type)}</span>
        <div className="flex-1">
          <div className="flex justify-between items-start">
            <h3 className="font-semibold">{notification.title}</h3>
            <Badge variant={getStatusBadge(notification.status).variant}>
              {getStatusBadge(notification.status).text}
            </Badge>
          </div>
          <p className="text-sm text-neutral-600 mt-1">{notification.body}</p>
          <p className="text-xs text-neutral-500 mt-2">
            {formatDistanceToNow(new Date(notification.timestamp), {
              addSuffix: true,
              locale: it
            })}
          </p>
        </div>
      </div>
    </div>
  );
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Realtime Database for logs | Firestore for structured queries | Dec 2022 (Firestore TTL release) | Enables filtering, pagination, auto-cleanup |
| Manual cleanup cron jobs | Firestore TTL policies | Dec 2022 | Reduces maintenance, free auto-deletion |
| Offset pagination (`skip(n)`) | Cursor-based (`startAfter()`) | Always (Firestore limitation) | O(1) vs O(n) performance |
| Device tokens without metadata | Device fingerprinting + naming | iOS 16.4 PWA push (Mar 2023) | Multi-device support, user-friendly naming |
| Global notification preferences | Per-device DND windows | Phase 3 (Jan 2026) | Device-specific control |

**Deprecated/outdated:**
- **Firebase Cloud Messaging REST API v1 (legacy)**: Replaced by HTTP v1 API (Jun 2024). Admin SDK already uses v1.
- **Manual token cleanup loops**: Firestore TTL + auto-removal on UNREGISTERED errors (current implementation in `firebaseAdmin.js`)
- **Storing notification history in RTDB**: Firestore is standard for queryable logs with TTL

## Open Questions

Things that couldn't be fully resolved:

1. **Firestore TTL deployment timing**
   - What we know: TTL policies can be set via Firebase Console or gcloud CLI
   - What's unclear: Does TTL require Firestore to be in Native mode vs Datastore mode? (Project likely already Native)
   - Recommendation: Verify in Firebase Console under Firestore → Settings → Mode. If Datastore mode, contact Firebase support for migration.

2. **Notification read/unread status**
   - What we know: Current schema in `notificationLogger.js` only tracks `status: 'sent' | 'delivered' | 'failed'`
   - What's unclear: Should we add `readStatus: 'unread' | 'read'` field for inbox UX? Requirements mention filtering but not read status.
   - Recommendation: **Defer to planning phase**. If HIST-04 filtering includes read/unread, add field + update mechanism.

3. **Client-side vs Server-side pagination**
   - What we know: Client-side Firestore queries are faster (no API round-trip) but require security rules
   - What's unclear: Does Auth0 `user.sub` match Firebase Auth UID for security rules? (Project uses Auth0, not Firebase Auth)
   - Recommendation: Use **server-side API route** (`/api/notifications/history`) with session validation. Simpler security model, consistent with existing APIs.

4. **Device last-used auto-update on notification send**
   - What we know: `lastUsed` timestamp critical for stale device detection (30+ days)
   - What's unclear: Current `sendPushNotification()` doesn't update `lastUsed` on every send (only on token refresh)
   - Recommendation: Add `lastUsed` update in `sendPushNotification()` success path. Fire-and-forget to avoid blocking sends.

## Sources

### Primary (HIGH confidence)
- [Firebase Firestore Query Cursors](https://firebase.google.com/docs/firestore/query-data/query-cursors) - Official pagination documentation
- [Firebase Firestore TTL Policies](https://firebase.google.com/docs/firestore/ttl) - Auto-delete for GDPR compliance
- [Firebase Security Rules Conditions](https://firebase.google.com/docs/firestore/security/rules-conditions) - User-specific data patterns
- [Firebase FCM Token Management Best Practices](https://firebase.google.com/docs/cloud-messaging/manage-tokens) - Token lifecycle and stale removal
- Codebase: `lib/notificationLogger.js` - Existing Firestore logging implementation
- Codebase: `app/api/notifications/devices/route.js` - Device list API with status calculation

### Secondary (MEDIUM confidence)
- [LogRocket - Infinite Scroll in React (2025)](https://blog.logrocket.com/react-infinite-scroll/) - React patterns, verified March 2025
- [Google Cloud Blog - Firestore TTL](https://cloud.google.com/blog/products/databases/manage-storage-costs-using-time-to-live-in-firestore) - TTL use cases and caveats
- [react-infinite-scroll-component npm](https://www.npmjs.com/package/react-infinite-scroll-component) - Library documentation v6.1.1
- [Knock Docs - Notification Feed UI](https://docs.knock.app/in-app-ui/react/feed) - Modern inbox patterns (filtering, status)
- [PatternFly Notification Drawer](https://www.patternfly.org/components/notification-drawer/design-guidelines/) - Enterprise UI guidelines

### Tertiary (LOW confidence)
- [SaaS Inbox UI Examples](https://www.saasframe.io/categories/inbox) - Visual inspiration, not technical guidance
- [Medium - Firestore Pagination](https://medium.com/@abbasmithaiwala/conquering-firebase-pagination-your-guide-to-smooth-infinite-scrolling-bb50591edf5c) - Third-party tutorial, patterns align with official docs

## Metadata

**Confidence breakdown:**
- Standard stack: **HIGH** - Libraries already in package.json, Firestore already configured
- Architecture: **HIGH** - Patterns verified in Firebase official docs + existing codebase implementation
- Pitfalls: **MEDIUM** - Based on community reports and best practices, not project-specific testing

**Research date:** 2026-01-25
**Valid until:** 60 days (stable technologies - Firebase, React patterns unlikely to change rapidly)
