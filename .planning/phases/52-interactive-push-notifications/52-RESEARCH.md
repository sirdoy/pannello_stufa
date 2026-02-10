# Phase 52: Interactive Push Notifications - Research

**Researched:** 2026-02-10
**Domain:** Web Push Notification Actions, FCM platform-specific payloads, Service Worker notificationclick handling, Background Sync integration
**Confidence:** MEDIUM-HIGH

## Summary

Interactive push notifications allow users to perform actions directly from notification banners without opening the app. The Web Notifications API provides an `actions` array on notification options, which displays as buttons on supported platforms. Service workers handle the `notificationclick` event with `event.action` to detect which button was clicked.

Browser support is excellent on Chrome/Edge/Opera (79.98% global coverage) but **iOS Safari does not support notification actions** through 26.3 - a critical limitation since this PWA targets iOS users. Android Chrome fully supports notification actions. Graceful degradation to tap-to-open is mandatory.

Firebase Cloud Messaging requires platform-specific payloads: iOS uses `apns.payload.aps.category` (though iOS Safari PWA won't render action buttons), Android uses `android.notification.clickAction`. The existing Background Sync implementation (Phase 38, `lib/pwa/backgroundSync.ts`) can queue API calls triggered by notification actions when offline.

**Primary recommendation:** Implement notification actions with Chrome/Android as primary target, iOS Safari as fallback (tap-to-open). Use existing Background Sync infrastructure for offline action handling. Feature detection is critical.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| firebase-admin | 13.6.0 | Send FCM with platform-specific payloads | Already installed, supports apns/android config objects |
| Serwist | 9.0.0 | Service worker management, already handles push events | Already installed (app/sw.ts), extends to handle actions |
| Background Sync API | Native | Queue offline notification actions | Already implemented in lib/pwa/backgroundSync.ts |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| IndexedDB (Dexie) | 4.2.1 | Store action click metadata for analytics | Already installed, existing STORES.COMMAND_QUEUE pattern |
| Web Notifications API | Native | notification.actions array, NotificationEvent.action | Browser native, no install needed |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Web Notifications actions | Deep links only | Deep links work on all platforms but require app open, losing "quick action" UX benefit |
| FCM Data-only messages | Notification messages with actions | Data-only requires app in foreground, notification messages work in background |
| Custom action queue | Background Sync API | Custom queue duplicates existing Background Sync, adds complexity |

**Installation:**
```bash
# No new packages needed - all capabilities already installed
```

## Architecture Patterns

### Recommended Project Structure
```
app/
├── sw.ts                                    # EXTEND: Add notificationclick handler with action detection
lib/
├── pwa/
│   ├── backgroundSync.ts                    # EXISTING: Already queues commands offline
│   └── notificationActions.ts               # NEW: Action definitions, feature detection
├── firebaseAdmin.ts                         # EXTEND: Add sendNotificationWithActions()
└── notificationService.ts                   # EXTEND: Client-side permission check
app/api/notifications/
├── send/route.ts                            # EXTEND: Accept actions in payload
└── action-executed/route.ts                 # NEW: Log action executions for analytics
```

### Pattern 1: Defining Notification Actions
**What:** Actions array defines buttons shown on notification
**When to use:** When creating notification payload (server-side FCM send)
**Example:**
```typescript
// Source: MDN Notifications API + Firebase docs
interface NotificationAction {
  action: string;  // Unique ID (checked in service worker)
  title: string;   // Button label shown to user
  icon?: string;   // Optional icon URL
}

// Stove shutdown notification with action
const stoveErrorNotification = {
  title: 'Errore Stufa',
  body: 'Codice errore 05 - Temperatura eccessiva',
  icon: '/icons/icon-192.png',
  actions: [
    {
      action: 'stove-shutdown',
      title: 'Spegni stufa',
      icon: '/icons/power-off.png'
    },
    {
      action: 'view-details',
      title: 'Dettagli'
    }
  ],
  data: {
    url: '/',
    errorCode: '05'
  }
};

// Service worker shows notification
registration.showNotification(
  stoveErrorNotification.title,
  stoveErrorNotification
);
```

### Pattern 2: Handling notificationclick with Actions
**What:** Service worker detects which action button was clicked via event.action
**When to use:** In app/sw.ts notificationclick event listener
**Example:**
```typescript
// Source: MDN ServiceWorkerGlobalScope notificationclick + existing app/sw.ts pattern
self.addEventListener('notificationclick', (event) => {
  console.log('[sw.ts] Notification clicked, action:', event.action);
  event.notification.close();

  // event.action is empty string if user clicked notification body
  if (event.action === 'stove-shutdown') {
    // User clicked "Spegni stufa" button
    event.waitUntil(
      (async () => {
        // Check if online - execute immediately
        if (navigator.onLine) {
          await fetch('/api/stove/shutdown', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ source: 'notification-action' })
          });
        } else {
          // Offline - queue via Background Sync (existing pattern)
          await queueCommandInIndexedDB('stove/shutdown', {
            source: 'notification-action-offline'
          });
        }

        // Log action execution
        await fetch('/api/notifications/action-executed', {
          method: 'POST',
          body: JSON.stringify({
            action: 'stove-shutdown',
            timestamp: new Date().toISOString()
          })
        });
      })()
    );

  } else if (event.action === 'thermostat-manual') {
    // User clicked "Imposta manuale" on thermostat notification
    event.waitUntil(
      clients.openWindow('/thermostat?mode=manual')
    );

  } else {
    // User clicked notification body (no action button)
    const urlToOpen = event.notification.data?.url || '/';
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true })
        .then((clientList) => {
          for (const client of clientList) {
            if (client.url.includes(self.location.origin)) {
              return client.focus().then(() => {
                if ('navigate' in client) {
                  (client as WindowClient).navigate(urlToOpen);
                }
              });
            }
          }
          return clients.openWindow(urlToOpen);
        })
    );
  }
});
```

### Pattern 3: Platform-Specific FCM Payloads
**What:** iOS uses aps.category, Android uses clickAction for notification actions
**When to use:** Server-side when sending FCM via Admin SDK
**Example:**
```typescript
// Source: Firebase Cloud Messaging cross-platform docs
import { getMessaging } from 'firebase-admin/messaging';

interface NotificationWithActions {
  userId: string;
  notification: {
    title: string;
    body: string;
    icon?: string;
  };
  actions: Array<{ action: string; title: string }>;
  data?: Record<string, string>;
}

export async function sendNotificationWithActions(
  payload: NotificationWithActions
): Promise<void> {
  const messaging = getMessaging();

  // Get user's FCM tokens
  const tokens = await getUserFCMTokens(payload.userId);

  for (const tokenRecord of tokens) {
    const { token, platform } = tokenRecord;

    const message: any = {
      token,
      notification: {
        title: payload.notification.title,
        body: payload.notification.body
      },
      data: payload.data || {},
      webpush: {
        notification: {
          icon: payload.notification.icon || '/icons/icon-192.png',
          // Web push actions - works on Chrome/Edge/Opera
          actions: payload.actions.map(a => ({
            action: a.action,
            title: a.title
          }))
        }
      }
    };

    // Platform-specific config (iOS Safari doesn't render actions, but set category anyway)
    if (platform === 'ios') {
      message.apns = {
        payload: {
          aps: {
            category: 'STOVE_ACTIONS', // Must match registered category in iOS app
            sound: 'default'
          }
        }
      };
    } else if (platform === 'android') {
      message.android = {
        notification: {
          clickAction: 'STOVE_ACTION', // Intent filter in Android app
          priority: 'high'
        }
      };
    }

    await messaging.send(message);
  }
}
```

### Pattern 4: Feature Detection and Graceful Degradation
**What:** Detect if browser supports notification actions, fallback to tap-to-open
**When to use:** Client-side notification permission flow, server-side payload construction
**Example:**
```typescript
// Source: Project's existing isNotificationSupported() pattern + MDN
export function supportsNotificationActions(): boolean {
  if (typeof window === 'undefined') return false;
  if (!('Notification' in window)) return false;

  // Chrome 53+, Edge 18+, Opera 39+ support actions
  // iOS Safari does NOT support actions (all versions through 26.3)
  // Check via Notification.maxActions (returns 0 if unsupported)
  try {
    return 'maxActions' in Notification && Notification.maxActions > 0;
  } catch {
    return false;
  }
}

// Client-side: Show different UI based on support
export function getNotificationCapabilities() {
  return {
    supported: isNotificationSupported(),
    actions: supportsNotificationActions(),
    backgroundSync: 'SyncManager' in window,
    platform: isIOS() ? 'ios' : 'other'
  };
}

// Server-side: Send actions only if platform supports
export async function sendNotification(userId: string, notification: any) {
  const tokens = await getUserFCMTokens(userId);

  for (const tokenRecord of tokens) {
    const payload: any = { ...notification };

    // iOS Safari: Remove actions, rely on tap-to-open
    if (tokenRecord.platform === 'ios') {
      delete payload.webpush?.notification?.actions;
      payload.data = {
        ...payload.data,
        fallback: 'tap-to-open' // Client can show instruction
      };
    }

    await sendFCM(tokenRecord.token, payload);
  }
}
```

### Pattern 5: Background Sync Integration for Offline Actions
**What:** Queue notification action API calls when offline, execute on reconnect
**When to use:** In notificationclick handler when navigator.onLine is false
**Example:**
```typescript
// Source: Existing lib/pwa/backgroundSync.ts + service worker integration
import { queueCommand } from '@/lib/pwa/backgroundSync';

// In app/sw.ts notificationclick handler
self.addEventListener('notificationclick', (event) => {
  if (event.action === 'stove-shutdown') {
    event.waitUntil(
      (async () => {
        if (navigator.onLine) {
          // Online: Execute immediately
          await fetch('/api/stove/shutdown', {
            method: 'POST',
            body: JSON.stringify({ source: 'notification-action' })
          });
        } else {
          // Offline: Queue command (existing Background Sync infrastructure)
          // This duplicates queueCommand() from lib, but in SW context must use IndexedDB directly
          const db = await openDB(); // Existing SW IndexedDB helper
          const command = {
            endpoint: 'stove/shutdown',
            method: 'POST',
            data: { source: 'notification-action-offline' },
            status: 'pending',
            timestamp: new Date().toISOString(),
            retries: 0,
            lastError: null
          };

          const transaction = db.transaction('commandQueue', 'readwrite');
          const store = transaction.objectStore('commandQueue');
          await store.add(command);

          // Register sync (existing pattern in app/sw.ts Background Sync handler)
          await self.registration.sync.register('stove-command-sync');

          // Notify user action queued
          await self.registration.showNotification('Comando in coda', {
            body: 'Il comando verrà eseguito al ripristino della connessione',
            tag: 'command-queued'
          });
        }
      })()
    );
  }
});

// Existing sync event handler in app/sw.ts already processes queue
self.addEventListener('sync', (event) => {
  if (event.tag === 'stove-command-sync') {
    event.waitUntil(processCommandQueue()); // Existing function
  }
});
```

### Anti-Patterns to Avoid
- **Assuming iOS Safari supports actions:** Always feature-detect and provide fallback
- **Not closing notification after action:** User expects notification to dismiss (call event.notification.close())
- **Sync API calls without waitUntil():** Service worker terminates prematurely, request fails
- **Hardcoded action IDs in multiple places:** Define action constants in shared module
- **No offline handling:** Notification actions must work offline via Background Sync queue

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Platform detection for FCM payloads | Custom user-agent parsing | Existing platform field in fcmTokens record | Already stored during token registration (lib/notificationService.ts getFCMToken) |
| Offline action queue | Custom IndexedDB transaction logic | Existing Background Sync infrastructure (lib/pwa/backgroundSync.ts) | Already handles queue, retry, exponential backoff, sync registration |
| Feature detection library | Third-party UA sniffing | Native Notification.maxActions check + existing isIOS() | Browser native API more reliable than UA parsing |
| Action button analytics | Custom event tracking | Firebase Analytics or existing notificationLogger.ts pattern | Existing logging infrastructure, just add action field |

**Key insight:** Notification actions appear simple but have complex failure modes (platform incompatibility, offline state, service worker lifecycle). Reuse existing patterns (Background Sync, platform detection, logging) rather than building parallel systems.

## Common Pitfalls

### Pitfall 1: iOS Safari False Expectations
**What goes wrong:** Developer assumes notification actions work on iOS Safari PWA, users see no buttons
**Why it happens:** iOS Safari supports web push (16.4+) but NOT notification actions (confirmed unsupported through 26.3)
**How to avoid:**
- Feature-detect with `Notification.maxActions > 0` check
- Server-side: Don't send actions to iOS tokens (check platform field)
- Client-side: Show different permission prompt text ("Tap notification to open" vs "Use action buttons")
**Warning signs:** iOS testers report "buttons don't show up", CanIUse shows "Not supported" for Safari

### Pitfall 2: Service Worker Termination Mid-Action
**What goes wrong:** Notification action triggers API call, but service worker terminates before completion
**Why it happens:** Service workers have short idle timeout (~30s), browser kills them to save resources
**How to avoid:**
- **Always wrap async work in event.waitUntil()** - extends service worker lifetime until Promise resolves
- Keep action handlers fast (<10s) - offload long work to queued sync events
- Example: `event.waitUntil(fetch('/api/stove/shutdown'))` NOT `fetch('/api/stove/shutdown')`
**Warning signs:** Intermittent action failures, "service worker registration not found" errors in logs

### Pitfall 3: Action ID Collisions and Typos
**What goes wrong:** event.action === 'stov-shutdown' (typo) never matches, fallback to tap-to-open always
**Why it happens:** Action IDs are strings, no compile-time checking, easy to misspell in notification send vs handler
**How to avoid:**
- Define action constants: `export const ACTIONS = { STOVE_SHUTDOWN: 'stove-shutdown' }` in shared module
- Use TypeScript enums or const objects for compile-time safety
- Add logging: `console.log('Clicked action:', event.action)` to debug mismatches
**Warning signs:** Actions "not working" but no errors, logs show empty event.action when button clicked

### Pitfall 4: Offline Actions Without Feedback
**What goes wrong:** User clicks "Spegni stufa" while offline, nothing happens, user clicks 5 more times, creates duplicate queue
**Why it happens:** No immediate feedback that action was queued (only executes on reconnect)
**How to avoid:**
- Show confirmation notification: "Comando in coda, verrà eseguito al ripristino connessione"
- Use notification tag to prevent duplicates: `tag: 'stove-shutdown-queued'` (replaces previous)
- Client-side: Update UI badge with pending command count (existing getPendingCount() pattern)
**Warning signs:** Users report "clicked multiple times, nothing happened", duplicate API calls on reconnect

### Pitfall 5: Rate Limiting Not Applied to Actions
**What goes wrong:** User can bypass rate limits by clicking action buttons repeatedly (no frontend throttle)
**Why it happens:** Rate limiter in /api/notifications/send, but action endpoint /api/stove/shutdown has no rate limit
**How to avoid:**
- Apply Phase 49 persistent rate limiter to action endpoints (stove/shutdown, thermostat/set-mode)
- Use same rate limit keys: `rateLimits/${userId}/stove-shutdown-action`
- Log action source in request: `{ source: 'notification-action' }` for analytics/debugging
**Warning signs:** Spam of shutdown commands, API quota exceeded, Firebase write quota hit

### Pitfall 6: Missing Platform-Specific Payload
**What goes wrong:** FCM message sent without apns/android config, iOS gets malformed notification, Android uses default click behavior
**Why it happens:** Developer only sets webpush.notification.actions, forgets platform-specific wrappers
**How to avoid:**
- Always set apns.payload.aps.category for iOS (even though actions won't render, category might be used in future)
- Always set android.notification.clickAction for Android (defines intent filter)
- Test on both platforms before production release
**Warning signs:** iOS notifications don't show up at all, Android notifications open app launcher instead of app

## Code Examples

Verified patterns from official sources and existing project code:

### Show Notification with Actions (Service Worker)
```typescript
// Source: app/sw.ts existing push handler + MDN showNotification
self.addEventListener('push', (event) => {
  const payload = event.data.json();

  const notificationOptions = {
    body: payload.notification.body,
    icon: payload.notification.icon || '/icons/icon-192.png',
    badge: '/icons/icon-72.png',
    tag: payload.data?.type || 'default',
    requireInteraction: payload.data?.priority === 'high',
    data: payload.data,
    // Actions array (Chrome/Edge/Opera only)
    actions: payload.notification.actions || []
  };

  event.waitUntil(
    self.registration.showNotification(
      payload.notification.title,
      notificationOptions
    )
  );
});
```

### Handle Action Click (Service Worker)
```typescript
// Source: MDN notificationclick + existing app/sw.ts pattern
self.addEventListener('notificationclick', (event) => {
  console.log('[sw.ts] Action clicked:', event.action);
  event.notification.close();

  if (event.action === 'stove-shutdown') {
    event.waitUntil(executeStoveShutdown());
  } else if (event.action === 'thermostat-manual') {
    event.waitUntil(clients.openWindow('/thermostat?mode=manual'));
  } else {
    // No action (body click)
    event.waitUntil(openApp(event.notification.data?.url));
  }
});

async function executeStoveShutdown() {
  if (navigator.onLine) {
    const response = await fetch('/api/stove/shutdown', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ source: 'notification-action' })
    });
    if (response.ok) {
      await self.registration.showNotification('Stufa spenta', {
        body: 'Comando eseguito con successo',
        tag: 'stove-shutdown-success'
      });
    }
  } else {
    // Queue for Background Sync (existing pattern)
    await queueCommandInIndexedDB('stove/shutdown', { source: 'notification-action' });
    await self.registration.sync.register('stove-command-sync');
  }
}
```

### Send Notification with Actions (Server)
```typescript
// Source: Firebase Admin SDK docs + existing lib/firebaseAdmin.ts
import { getMessaging } from 'firebase-admin/messaging';

export async function sendStoveErrorNotification(
  userId: string,
  errorCode: string,
  errorMessage: string
) {
  const tokens = await getUserFCMTokens(userId);

  for (const tokenRecord of tokens) {
    const message: any = {
      token: tokenRecord.token,
      notification: {
        title: 'Errore Stufa',
        body: `${errorMessage} (codice ${errorCode})`
      },
      data: {
        type: 'stove-error',
        errorCode,
        url: '/'
      }
    };

    // Web push actions (Chrome/Android only)
    message.webpush = {
      notification: {
        icon: '/icons/icon-192.png',
        actions: [
          { action: 'stove-shutdown', title: 'Spegni stufa' },
          { action: 'view-details', title: 'Dettagli' }
        ]
      }
    };

    // iOS: Category (actions won't render but set anyway)
    if (tokenRecord.platform === 'ios') {
      message.apns = {
        payload: {
          aps: {
            category: 'STOVE_ERROR_ACTIONS',
            sound: 'default'
          }
        }
      };
    }

    // Android: Click action intent
    if (tokenRecord.platform === 'android') {
      message.android = {
        notification: {
          clickAction: 'STOVE_ERROR_ACTION',
          priority: 'high'
        }
      };
    }

    await getMessaging().send(message);
  }
}
```

### Feature Detection (Client)
```typescript
// Source: Project's lib/notificationService.ts pattern + MDN Notification.maxActions
export function getNotificationCapabilities() {
  if (typeof window === 'undefined') {
    return {
      supported: false,
      actions: false,
      maxActions: 0,
      platform: 'server'
    };
  }

  const supported = isNotificationSupported(); // Existing function
  let maxActions = 0;

  try {
    if ('Notification' in window && 'maxActions' in Notification) {
      maxActions = Notification.maxActions;
    }
  } catch (e) {
    console.warn('Failed to check maxActions:', e);
  }

  return {
    supported,
    actions: maxActions > 0,
    maxActions,
    platform: isIOS() ? 'ios' : 'other',
    backgroundSync: 'SyncManager' in window
  };
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Notification click → open app | Notification actions → direct control | Chrome 53 (2016), iOS never | Users can act without opening app (Chrome/Android only) |
| Manual platform detection via UA | Notification.maxActions feature detection | Notifications API Standard (2026-01-20) | More reliable than UA parsing, avoids false positives |
| In-memory action queue | Background Sync API + IndexedDB | Background Sync spec stable (2019) | Survives service worker restarts, browser kills |
| Generic FCM payload | Platform-specific apns/android config | FCM v1 API (2018) | Enables iOS category, Android intents, per-platform customization |

**Deprecated/outdated:**
- **GCM (Google Cloud Messaging):** Shut down April 2019, replaced by FCM
- **notification.data.click_action (legacy FCM):** Deprecated in FCM v1, use platform-specific clickAction/category
- **firebase-messaging-sw.js separate file:** Serwist v9 consolidates into app/sw.ts, no separate FCM worker needed

## Open Questions

1. **iOS Category Registration**
   - What we know: iOS requires category pre-registered in app, apns.aps.category references it
   - What's unclear: Does iOS Safari PWA support category registration? (Native app uses UNNotificationCategory)
   - Recommendation: Set category in payload anyway (future-proof), document as "not functional on iOS Safari" in code comments

2. **Rate Limiting for Notification Actions**
   - What we know: Phase 49 implements persistent rate limiting for notifications
   - What's unclear: Should action endpoints (stove/shutdown) have separate rate limits or share notification limit?
   - Recommendation: Separate limits - notification send rate != action execution rate (different abuse vectors)

3. **Action Analytics Granularity**
   - What we know: Existing notificationLogger.ts logs notification sends
   - What's unclear: Should action clicks be logged separately or as notification interaction events?
   - Recommendation: Separate log - action execution != notification view, track action success/failure for debugging

## Sources

### Primary (HIGH confidence)
- [MDN ServiceWorkerGlobalScope: notificationclick event](https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerGlobalScope/notificationclick_event) - Complete API reference with code examples
- [Firebase Cloud Messaging: Customize messages cross-platform](https://firebase.google.com/docs/cloud-messaging/customize-messages/cross-platform) - Platform-specific payload structure
- [CanIUse: Notification.actions](https://caniuse.com/mdn-api_notification_actions) - Browser support data (79.98% global, iOS Safari unsupported)
- Project codebase: app/sw.ts (existing push/notificationclick handlers), lib/pwa/backgroundSync.ts (offline queue)

### Secondary (MEDIUM confidence)
- [MDN Background Synchronization API](https://developer.mozilla.org/en-US/docs/Web/API/Background_Synchronization_API) - Offline action queue integration
- [WebKit: Web Push for iOS/iPadOS](https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/) - Confirms iOS Safari push support but no actions
- [Chrome Developers: Notification Actions](https://developer.chrome.com/blog/notification-actions) - Best practices and examples
- [Notifications API Standard (2026-01-20)](https://notifications.spec.whatwg.org/) - Latest specification

### Tertiary (LOW confidence - needs validation)
- GitHub issues about iOS category registration for PWAs - no official Apple documentation found
- Third-party blog posts about action button styling - not standardized, browser-dependent

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All dependencies already installed (firebase-admin, Serwist, Background Sync)
- Architecture: HIGH - Clear integration points with existing SW and Background Sync
- Pitfalls: MEDIUM-HIGH - iOS Safari limitation well-documented, other pitfalls from MDN/experience
- Platform-specific payloads: MEDIUM - Firebase docs clear, but iOS Safari action support is definitively NO

**Research date:** 2026-02-10
**Valid until:** 30 days (stable APIs, but iOS Safari support status could change in future iOS versions)

**Critical finding:** iOS Safari does NOT support notification actions through version 26.3. This affects all iPhone users who are a primary target for this PWA. Graceful degradation to tap-to-open is MANDATORY, not optional.
