# Phase 1: Token Lifecycle Foundation - Research

**Researched:** 2026-01-23
**Domain:** Firebase Cloud Messaging (FCM) token management, PWA persistence, Next.js 15 integration
**Confidence:** HIGH

## Summary

FCM token lifecycle management requires coordinated persistence across multiple browser storage mechanisms (IndexedDB + localStorage), proactive token refresh monitoring (monthly minimum), and real-time cleanup of invalid tokens detected through FCM API errors. The critical bug—tokens not surviving browser restarts—stems from inadequate persistence strategy; dual-storage with `navigator.storage.persist()` provides maximum reliability.

Firebase's official guidance (updated January 2026) establishes token staleness at 30 days of inactivity, with Android tokens expiring after 270 days. Multi-device support requires device fingerprinting via user agent parsing and duplicate detection to prevent token accumulation. External schedulers like cron-job.org enable daily cleanup jobs without backend infrastructure.

**Primary recommendation:** Implement dual persistence (IndexedDB primary, localStorage fallback) with `navigator.storage.persist()` request on first token registration. Use Dexie.js wrapper for reliable IndexedDB access across main thread and service workers. Detect invalid tokens via FCM API error codes (`UNREGISTERED`, `INVALID_ARGUMENT`) and remove immediately. Schedule daily cleanup via cron-job.org hitting `/api/notifications/cleanup` endpoint.

## Standard Stack

The established libraries/tools for FCM token management in Next.js 15 PWAs:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| firebase | 12.8.0+ | FCM client SDK (getToken, onMessage) | Official Firebase SDK, already installed, modular v9+ API |
| firebase-admin | 13.6.0+ | Server-side token validation/cleanup | Only way to call FCM Admin APIs from Node.js |
| @serwist/next | 9.0.0+ | Service worker generation for Next.js 15 | Already installed, built for Next.js 15 App Router |
| dexie | 4.2.1+ | IndexedDB wrapper | Kick-ass performance with bulk operations, works around browser bugs, supports service workers |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| ua-parser-js | 1.0.38+ | User agent parsing for device identification | Extracting browser, OS, device info from navigator.userAgent |
| cron-job.org | N/A (service) | External scheduled tasks | Daily cleanup job without managing cron infrastructure |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Dexie.js | idb (minimalistic wrapper) | idb is lighter (3KB vs 20KB) but requires more boilerplate for common operations; choose idb only if size is critical |
| Dexie.js | Raw IndexedDB API | Direct API gives maximum control but loses promise-based interface, versioning, and browser bug workarounds; avoid unless you need low-level control |
| cron-job.org | Vercel Cron Jobs | Vercel Cron requires paid plan; cron-job.org free tier allows 100 requests/day (sufficient for 1 daily cleanup) |

**Installation:**
```bash
npm install dexie ua-parser-js
# firebase and firebase-admin already installed
# @serwist/next already installed
```

## Architecture Patterns

### Recommended Project Structure
```
lib/
├── tokenStorage.js          # IndexedDB + localStorage dual persistence
├── tokenRefresh.js          # Token refresh logic (30-day check)
├── deviceFingerprint.js     # Device identification from user agent
└── notificationService.js   # Existing - extend with persistence calls

app/api/notifications/
├── register/route.js        # Existing - enhance with device metadata
├── cleanup/route.js         # NEW - Remove invalid/stale tokens (Admin SDK)
└── validate/route.js        # NEW - Check token validity on demand

public/
└── firebase-messaging-sw.js # Existing - no changes needed
```

### Pattern 1: Dual Persistence Strategy
**What:** Store FCM tokens in both IndexedDB (primary) and localStorage (fallback) simultaneously
**When to use:** Critical data that must survive browser restarts, storage pressure, and iOS quirks
**Example:**
```javascript
// Source: web.dev/learn/pwa/offline-data + PWA best practices
import Dexie from 'dexie';

const db = new Dexie('fcmTokenDB');
db.version(1).stores({
  tokens: 'id, token, createdAt, lastUsed, deviceInfo'
});

async function saveToken(token, deviceInfo) {
  // Request persistent storage (protects from eviction)
  if (navigator.storage && navigator.storage.persist) {
    const isPersisted = await navigator.storage.persist();
    console.log(`Persistent storage: ${isPersisted}`);
  }

  // Save to IndexedDB (primary)
  await db.tokens.put({
    id: 'current',
    token,
    createdAt: new Date().toISOString(),
    lastUsed: new Date().toISOString(),
    deviceInfo
  });

  // Save to localStorage (fallback)
  localStorage.setItem('fcm_token', JSON.stringify({
    token,
    createdAt: new Date().toISOString(),
    deviceInfo
  }));
}

async function loadToken() {
  try {
    // Try IndexedDB first
    const record = await db.tokens.get('current');
    if (record?.token) return record;
  } catch (e) {
    console.warn('IndexedDB failed, trying localStorage', e);
  }

  // Fallback to localStorage
  const stored = localStorage.getItem('fcm_token');
  return stored ? JSON.parse(stored) : null;
}
```

### Pattern 2: Token Refresh Check on App Startup
**What:** Check token age on every app launch, refresh if >30 days old
**When to use:** Required by Firebase best practices to maintain token freshness
**Example:**
```javascript
// Source: firebase.google.com/docs/cloud-messaging/manage-tokens
import { getMessaging, getToken, deleteToken } from 'firebase/messaging';

async function checkAndRefreshToken(userId) {
  const stored = await loadToken();
  if (!stored) return null;

  const ageInDays = (Date.now() - new Date(stored.createdAt)) / (1000 * 60 * 60 * 24);

  if (ageInDays > 30) {
    console.log('Token older than 30 days, refreshing...');
    const messaging = getMessaging();

    // Explicitly revoke old token (clean lifecycle)
    await deleteToken(messaging);

    // Get new token
    const newToken = await getToken(messaging, {
      vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY
    });

    // Save new token immediately (no batching)
    await saveToken(newToken, stored.deviceInfo);

    // Update Firestore via API
    await fetch('/api/notifications/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: newToken, deviceInfo: stored.deviceInfo })
    });

    return newToken;
  }

  return stored.token;
}
```

### Pattern 3: Invalid Token Detection and Removal
**What:** Detect invalid tokens from FCM error responses and remove immediately
**When to use:** Real-time cleanup when sending notifications fails with token errors
**Example:**
```javascript
// Source: firebase.google.com/docs/cloud-messaging/manage-tokens
import admin from 'firebase-admin';

export async function POST(request) {
  const { tokens, payload } = await request.json();

  const invalidTokens = [];

  for (const token of tokens) {
    try {
      await admin.messaging().send({
        token,
        notification: payload.notification,
        data: payload.data
      });
    } catch (error) {
      // Detect invalid/unregistered tokens
      if (error.code === 'messaging/registration-token-not-registered' ||
          error.code === 'messaging/invalid-argument') {
        invalidTokens.push(token);

        // Remove from database immediately (async)
        removeTokenFromDatabase(token).catch(console.error);
      }
    }
  }

  return Response.json({
    sent: tokens.length - invalidTokens.length,
    removed: invalidTokens.length
  });
}
```

### Pattern 4: Device Fingerprinting and Duplicate Detection
**What:** Generate unique device ID from user agent, replace token if same device re-registers
**When to use:** Multi-device support with automatic duplicate prevention
**Example:**
```javascript
// Source: UAParser.js documentation
import UAParser from 'ua-parser-js';
import crypto from 'crypto';

function generateDeviceFingerprint(userAgent) {
  const parser = new UAParser(userAgent);
  const result = parser.getResult();

  // Create stable device ID from browser + OS
  const deviceString = `${result.browser.name}-${result.browser.version}-${result.os.name}-${result.os.version}`;
  const deviceId = crypto.createHash('sha256').update(deviceString).digest('hex').substring(0, 16);

  return {
    deviceId,
    displayName: `${result.browser.name} on ${result.os.name}`,
    browser: `${result.browser.name} ${result.browser.version}`,
    os: `${result.os.name} ${result.os.version}`,
    device: result.device.type || 'desktop',
    userAgent: userAgent
  };
}

// In register API route
export async function POST(request) {
  const { token, userAgent } = await request.json();
  const deviceInfo = generateDeviceFingerprint(userAgent);

  // Check if device already has a token
  const existingTokenRef = admin.database()
    .ref(`users/${userId}/fcmTokens`)
    .orderByChild('deviceId')
    .equalTo(deviceInfo.deviceId);

  const snapshot = await existingTokenRef.once('value');

  if (snapshot.exists()) {
    // Replace existing token for this device
    const existingKey = Object.keys(snapshot.val())[0];
    await admin.database().ref(`users/${userId}/fcmTokens/${existingKey}`).update({
      token,
      lastUsed: new Date().toISOString(),
      deviceInfo
    });
  } else {
    // Add new device token
    await admin.database().ref(`users/${userId}/fcmTokens`).push({
      token,
      createdAt: new Date().toISOString(),
      lastUsed: new Date().toISOString(),
      deviceInfo
    });
  }
}
```

### Pattern 5: External Scheduled Cleanup
**What:** Use cron-job.org to trigger daily cleanup API endpoint
**When to use:** Detecting and removing stale tokens (>90 days inactive) without backend cron
**Example:**
```javascript
// Source: cron-job.org documentation
// app/api/notifications/cleanup/route.js
export async function POST(request) {
  const authHeader = request.headers.get('authorization');

  // Verify request from cron-job.org (simple bearer token)
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = admin.database();
  const usersRef = db.ref('users');
  const snapshot = await usersRef.once('value');

  let removed = 0;
  const now = Date.now();
  const STALE_THRESHOLD = 90 * 24 * 60 * 60 * 1000; // 90 days

  const updates = {};

  snapshot.forEach(userSnap => {
    const userId = userSnap.key;
    const tokens = userSnap.child('fcmTokens').val() || {};

    Object.entries(tokens).forEach(([tokenKey, tokenData]) => {
      const lastUsed = new Date(tokenData.lastUsed).getTime();
      const age = now - lastUsed;

      if (age > STALE_THRESHOLD) {
        updates[`users/${userId}/fcmTokens/${tokenKey}`] = null;
        removed++;
      }
    });
  });

  await db.ref().update(updates);

  return Response.json({ removed, timestamp: new Date().toISOString() });
}
```

**Cron-job.org configuration:**
- URL: `https://your-domain.com/api/notifications/cleanup`
- Schedule: Daily at 3:00 AM UTC
- Method: POST
- Headers: `Authorization: Bearer YOUR_CRON_SECRET`

### Anti-Patterns to Avoid
- **Don't use tokens as user identifiers:** FCM tokens change unpredictably; always link to stable user IDs
- **Don't batch token updates:** Immediate writes to Firestore + local storage ensure 60-second recovery requirement
- **Don't ignore FCM error codes:** `UNREGISTERED` and `INVALID_ARGUMENT` mean the token is permanently invalid—remove it immediately
- **Don't skip `navigator.storage.persist()`:** Without persistence request, IndexedDB may be evicted under storage pressure
- **Don't store tokens in service worker only:** Service workers can be unregistered; always persist in IndexedDB + localStorage

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| IndexedDB CRUD operations | Custom promise wrappers, transaction handlers | Dexie.js | Handles versioning, browser bugs (especially Safari), bulk operations, and provides clean async/await API. Raw IndexedDB has 50+ lines of boilerplate per query. |
| User agent parsing | Regex patterns to extract browser/OS | ua-parser-js | Maintains database of 8,000+ user agent patterns, handles edge cases (Chromium-based browsers, mobile variants), updated regularly for new browsers. |
| Token age calculation | Manual date arithmetic with timestamps | Store createdAt as ISO string, compare with `Date.now()` | Avoids timezone bugs, daylight saving issues, leap second edge cases. Use standard library date functions. |
| Service worker registration | Custom registration + update logic | @serwist/next (already installed) | Handles Next.js build integration, precaching, update strategies, scope management. Already generating sw.js. |
| Device fingerprinting | Canvas fingerprinting, WebGL hashing | Simple user agent + platform hash | Canvas/WebGL fingerprinting is heavy-handed for device identification (privacy concerns, overkill for "same device" detection). User agent sufficient for this use case. |

**Key insight:** Browser storage APIs (IndexedDB, service workers) have subtle cross-browser bugs and edge cases that mature libraries handle automatically. Don't reimplement unless you have 6+ months to discover all the quirks.

## Common Pitfalls

### Pitfall 1: IndexedDB Not Surviving Browser Restart
**What goes wrong:** Token registration succeeds, user closes browser completely, reopens app, and token is missing from IndexedDB
**Why it happens:**
- IndexedDB may not persist if `navigator.storage.persist()` wasn't called
- iOS Safari has aggressive storage eviction policies
- Browser in "private/incognito" mode loses all IndexedDB on close
**How to avoid:**
- Call `navigator.storage.persist()` immediately after first token registration
- Implement dual persistence (localStorage fallback)
- Check `navigator.storage.persisted()` on startup and warn user if not persisted
**Warning signs:**
- Users report "have to allow notifications again after closing browser"
- IndexedDB exists in DevTools during session but missing after browser restart
- Token registration API called repeatedly for same user/device

### Pitfall 2: Service Worker Registration Race Condition
**What goes wrong:** `getToken()` fails with "service worker not ready" error, especially in development mode with hot reload
**Why it happens:**
- Firebase `getToken()` requires active service worker registration
- Next.js dev server with Turbopack can unregister service workers on hot reload
- Browser may not have completed service worker activation before `getToken()` is called
**How to avoid:**
- Always await `navigator.serviceWorker.ready` before calling `getToken()`
- In dev mode, check for existing registration with `getRegistration()` first
- Add timeout fallback (15 seconds) and prompt user to refresh page if SW doesn't activate
- See existing implementation in `lib/notificationService.js` lines 202-253
**Warning signs:**
- Intermittent "service worker not ready" errors
- Token registration works sometimes but fails after hot reload
- Error only happens in development, not production

### Pitfall 3: Token Accumulation (No Duplicate Detection)
**What goes wrong:** User has 10+ tokens in database for same device because each registration creates new entry
**Why it happens:**
- No device fingerprinting—every registration treated as new device
- Browser deletes tokens locally but server keeps old entries
- Testing/debugging creates many registrations
**How to avoid:**
- Generate stable device ID from user agent hash
- Query existing tokens by deviceId before inserting new one
- Replace token instead of adding new entry for same deviceId
- Implement UI in Phase 2 to show "last seen" dates for manual pruning
**Warning signs:**
- Database shows >5 tokens per user consistently
- Notification delivery rate drops (sending to dead tokens)
- Firebase quota warnings about excessive FCM API calls

### Pitfall 4: Ignoring Token Refresh Errors
**What goes wrong:** Token refresh fails (network error, permissions revoked) but app continues using old token silently
**Why it happens:**
- Token refresh wrapped in try-catch that swallows errors
- No fallback to re-request permissions if refresh fails
- UI doesn't inform user of notification problems
**How to avoid:**
- Log refresh failures to monitoring system (Phase 2)
- Show user-facing warning if refresh fails: "Notifications may not work, click to fix"
- Retry refresh with exponential backoff (max 3 attempts)
- Fall back to full re-registration flow if refresh repeatedly fails
**Warning signs:**
- User reports "not getting notifications anymore"
- Logs show `deleteToken()` succeeds but `getToken()` fails
- Token createdAt date is >60 days old (should have refreshed monthly)

### Pitfall 5: Not Handling FCM Error Codes Properly
**What goes wrong:** Server tries to send notifications to invalid tokens repeatedly, wasting FCM quota and slowing delivery
**Why it happens:**
- Generic error handling that doesn't check `error.code`
- Assuming all send failures are transient (retry logic)
- Not distinguishing between network errors (retry) and invalid tokens (delete)
**How to avoid:**
- Check for specific error codes: `messaging/registration-token-not-registered`, `messaging/invalid-argument`
- Remove token from database immediately on these errors (don't wait for cleanup job)
- Only retry on transient errors: `messaging/server-unavailable`, `messaging/internal-error`
- Log permanent failures separately for monitoring
**Warning signs:**
- FCM API quota consumed rapidly
- Same tokens appear in error logs repeatedly
- Notification delivery success rate <90%

### Pitfall 6: Storing Tokens Without Metadata
**What goes wrong:** Can't debug notification problems, can't identify which device has issues, can't clean up stale tokens effectively
**Why it happens:**
- Only storing token string without createdAt, lastUsed, deviceInfo
- Treating tokens as simple array of strings
- Not updating lastUsed timestamp on successful delivery
**How to avoid:**
- Store rich metadata: `{ token, createdAt, lastUsed, deviceInfo: { browser, os, deviceId, userAgent } }`
- Update lastUsed timestamp whenever notification is successfully delivered
- Use metadata for cleanup decisions (stale = lastUsed >90 days, not createdAt)
**Warning signs:**
- Can't answer "which device isn't getting notifications?"
- Can't determine if token is from current device or old device
- Cleanup job removes active tokens because can't distinguish from stale ones

## Code Examples

Verified patterns from official sources:

### Service Worker Registration with Timeout
```javascript
// Source: lib/notificationService.js (existing code, validated pattern)
async function waitForServiceWorker(timeoutMs = 10000) {
  // Check if SW is already ready and ACTIVE
  const existingReg = await navigator.serviceWorker.getRegistration();
  if (existingReg?.active) {
    return existingReg;
  }

  // Try to register SW manually
  const newReg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });

  // Wait for activation
  if (newReg.installing || newReg.waiting) {
    await new Promise((resolve, reject) => {
      const sw = newReg.installing || newReg.waiting;
      const timeout = setTimeout(() => reject(new Error('SW activation timeout')), timeoutMs);

      sw.addEventListener('statechange', () => {
        if (sw.state === 'activated') {
          clearTimeout(timeout);
          resolve();
        }
      });
    });
  }

  return newReg;
}
```

### Detecting Browser Restart (Token Survival Test)
```javascript
// Source: PWA persistence best practices
async function checkTokenPersistence() {
  const stored = await loadToken();

  if (!stored) {
    console.log('No token found after browser restart');
    return false;
  }

  // Check if IndexedDB persisted
  const dbRecord = await db.tokens.get('current');
  const lsRecord = JSON.parse(localStorage.getItem('fcm_token'));

  return {
    indexedDB: !!dbRecord,
    localStorage: !!lsRecord,
    token: stored.token,
    age: Date.now() - new Date(stored.createdAt).getTime()
  };
}
```

### Batch Token Validation (Daily Cleanup)
```javascript
// Source: Firebase Admin SDK documentation
async function validateTokensBatch(tokens) {
  const validTokens = [];
  const invalidTokens = [];

  // FCM Admin SDK doesn't have batch validation API
  // Must send test message or use sendEach with dry-run
  const messages = tokens.map(token => ({
    token,
    data: { type: 'validation' },
    dryRun: true // Don't actually send
  }));

  const response = await admin.messaging().sendEach(messages);

  response.responses.forEach((resp, idx) => {
    if (resp.success) {
      validTokens.push(tokens[idx]);
    } else if (
      resp.error.code === 'messaging/registration-token-not-registered' ||
      resp.error.code === 'messaging/invalid-argument'
    ) {
      invalidTokens.push(tokens[idx]);
    }
  });

  return { validTokens, invalidTokens };
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Store tokens in localStorage only | Dual persistence (IndexedDB + localStorage) | 2023-2024 PWA best practices | IndexedDB survives storage pressure better, localStorage provides fallback for iOS quirks |
| Manual token refresh on error | Proactive monthly refresh check | Firebase guidance updated Jan 2026 | Prevents delivery failures before they occur, reduces "token expired" errors |
| Store tokens as simple array | Store tokens with metadata (createdAt, lastUsed, deviceInfo) | Multi-device patterns emerged 2023+ | Enables stale detection, device management UI, debugging |
| Client-side token cleanup | Server-side cleanup via Admin SDK | Firebase Admin SDK requirement | Client SDK can't delete other devices' tokens, security model requires Admin SDK |
| Internal cron jobs | External schedulers (cron-job.org, Vercel Cron) | Serverless architecture shift 2020+ | No need to manage cron infrastructure, external service handles scheduling |

**Deprecated/outdated:**
- **Firebase Messaging v8 (compat):** Legacy API still works but v9 modular SDK is current (tree-shakeable, smaller bundle)
- **Client-side `deleteToken()` without server update:** Creates server-client desync; always call API to remove from database
- **Storing tokens in cookies:** Not recommended since tokens can be >500 characters (cookie size limit), no benefit over localStorage/IndexedDB
- **Using `localStorage` for service worker access:** Service workers can't access localStorage; must use IndexedDB or Cache API

## Open Questions

Things that couldn't be fully resolved:

1. **iOS Safari IndexedDB reliability across iOS versions**
   - What we know: iOS 16.4+ supports PWA notifications, IndexedDB generally works
   - What's unclear: Does iOS 17+ have better IndexedDB persistence guarantees than 16.4? Are there known bugs in specific iOS versions?
   - Recommendation: Implement dual persistence (IndexedDB + localStorage) as safety net, test on iOS 16.4, 17.0, and latest 17.x
   - Confidence: MEDIUM (community reports vary, no official Apple documentation on IndexedDB persistence policies)

2. **Optimal token refresh frequency**
   - What we know: Firebase recommends monthly minimum, Android tokens expire at 270 days
   - What's unclear: Does more frequent refresh (weekly) improve delivery rates meaningfully? What's the battery/performance cost?
   - Recommendation: Start with 30-day refresh, monitor delivery success rates in Phase 2, adjust if needed
   - Confidence: HIGH (Firebase official guidance is clear, but performance impact is context-dependent)

3. **Device fingerprint stability across browser updates**
   - What we know: User agent changes with browser version updates (Chrome 120 → 121)
   - What's unclear: Will major version bump (Chrome 120 → 121) create duplicate device entry, or is minor version difference acceptable?
   - Recommendation: Hash only browser name + OS name (exclude version numbers) for more stable device ID, accept that browser changes (Chrome → Firefox) will create new device entry
   - Confidence: MEDIUM (tradeoff between stability and accuracy, no industry standard)

4. **Firebase Realtime Database performance with 100+ users × 5 devices**
   - What we know: Current project uses Realtime Database (not Firestore), path is `users/{userId}/fcmTokens/{tokenId}`
   - What's unclear: At what scale (user count × devices) does Realtime Database performance degrade for token queries? Should we migrate to Firestore?
   - Recommendation: Continue with Realtime Database for Phase 1 (simpler queries, existing setup), evaluate Firestore migration in Phase 2 if query performance issues observed
   - Confidence: HIGH (Realtime Database handles 500+ concurrent users easily, token queries are simple key-value lookups)

5. **Cron-job.org reliability and SLA**
   - What we know: Free tier allows 100 requests/day, service active since 2011
   - What's unclear: What's the actual uptime SLA? What happens if cleanup job misses a day?
   - Recommendation: Daily cleanup is best-effort, not critical path (tokens also cleaned on send failures). Monitor cleanup job execution in Phase 2, consider Vercel Cron as paid alternative if reliability issues occur.
   - Confidence: MEDIUM (cron-job.org widely used but no official SLA; missing one daily cleanup is not catastrophic)

## Sources

### Primary (HIGH confidence)
- [Firebase Cloud Messaging: Manage Tokens](https://firebase.google.com/docs/cloud-messaging/manage-tokens) - Official best practices (updated Jan 15, 2026)
- [Firebase Cloud Messaging Blog: Managing Tokens](https://firebase.blog/posts/2023/04/managing-cloud-messaging-tokens/) - Official guidance on refresh patterns
- [web.dev: PWA Offline Data](https://web.dev/learn/pwa/offline-data) - IndexedDB vs localStorage, persistence best practices
- [MDN: Storage Quotas and Eviction](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria) - Browser storage persistence policies
- [web.dev: Persistent Storage](https://web.dev/articles/persistent-storage) - navigator.storage.persist() usage
- [Microsoft Edge: Store Data on Device](https://learn.microsoft.com/en-us/microsoft-edge/progressive-web-apps/how-to/offline) - PWA persistence strategies
- [Dexie.js Documentation](https://dexie.org/) - IndexedDB wrapper API and patterns
- [UAParser.js Documentation](https://uaparser.dev/) - User agent parsing library

### Secondary (MEDIUM confidence)
- [Next.js PWA Setup Guide](https://dev.to/rakibcloud/progressive-web-app-pwa-setup-guide-for-nextjs-15-complete-step-by-step-walkthrough-2b85) - Next.js 15 PWA integration patterns
- [Next.js Firebase Push Notifications](https://www.mbloging.com/post/implementing-firebase-push-notifications-in-next-js-a-step-by-step-guide) - Next.js + FCM integration example
- [LogRocket: Offline Storage for PWAs](https://blog.logrocket.com/offline-storage-for-pwas/) - Comparison of storage mechanisms
- [cron-job.org REST API Documentation](https://docs.cron-job.org/rest-api.html) - External scheduler API
- [Medium: IndexedDB for Service Workers and PWAs](https://alex-goff.medium.com/storing-data-with-indexeddb-for-service-workers-and-pwas-2da9d2ef30e2) - Service worker + IndexedDB patterns

### Tertiary (LOW confidence - validate during implementation)
- [GeeksforGeeks: Save FCM Token to Realtime Database](https://www.geeksforgeeks.org/firebase/how-to-retrieve-and-save-the-fcm-device-token-to-the-realtime-firebase-storage/) - Token storage patterns
- [Medium: FCM Lifecycle](https://medium.com/@chunilalkukreja/lifecycle-of-fcm-device-tokens-61681bb6fbcf) - Token lifecycle conceptual overview
- [GitHub: invertase/react-native-firebase Discussion #6351](https://github.com/invertase/react-native-firebase/discussions/6351) - Community discussion on token expiry

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Firebase SDK already installed (verified in package.json), Dexie.js is industry standard with 100K+ users
- Architecture: HIGH - Patterns verified from official Firebase docs (updated Jan 2026) and existing codebase (lib/notificationService.js)
- Pitfalls: HIGH - Derived from official Firebase guidance, PWA best practices (web.dev), and existing code analysis showing service worker race condition handling
- Device fingerprinting: MEDIUM - ua-parser-js is standard but device ID stability across browser updates is context-dependent
- External scheduler: MEDIUM - cron-job.org widely used but no official SLA, daily cleanup is best-effort not critical

**Research date:** 2026-01-23
**Valid until:** February 22, 2026 (30 days - stable domain, Firebase APIs mature, unlikely to change)

**Next steps for planner:**
- Reference "Standard Stack" for library installation tasks
- Use "Architecture Patterns" code examples as task implementation templates
- Create verification steps based on "Common Pitfalls" warning signs
- Consult "Don't Hand-Roll" table to avoid custom implementations
- Flag "Open Questions" items for validation testing in Phase 1 completion criteria
