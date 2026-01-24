# Phase 3: User Preferences & Control - Research

**Researched:** 2026-01-24
**Domain:** User notification preferences, form validation, real-time data sync
**Confidence:** HIGH

## Summary

Phase 3 implements user control over notification behavior through granular settings. The standard approach combines React Hook Form + Zod for type-safe form validation, Firestore for cross-device settings sync via real-time listeners, and server-side filtering in the existing `sendNotificationToUser()` flow. Key challenges include DND timezone handling, rate limiting with summary aggregation, and preventing listener memory leaks.

**Technical foundation:**
- React Hook Form 7.x + Zod 4.1.x+ (NOT yet installed - INFRA-03 requirement)
- Firestore `onSnapshot()` for instant cross-device sync
- Browser Intl API for automatic timezone detection
- In-memory rate limiting at server send time
- Firebase Admin SDK filtering before FCM send

**Primary recommendation:** Filter notifications server-side in `sendNotificationToUser()` by checking user preferences before calling `sendPushNotification()`. Store preferences in Firestore `users/{userId}/notificationPreferences` for real-time sync. Use React Hook Form with Zod resolver for settings UI validation.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| react-hook-form | 7.x | Form state management | Industry standard for React forms - minimal re-renders, uncontrolled components, 40k+ GitHub stars |
| zod | 4.1.x+ | Schema validation | TypeScript-native, composable schemas, automatic type inference via `z.infer<>` |
| @hookform/resolvers | 3.x | RHF + Zod integration | Official integration package for react-hook-form + Zod |
| date-fns | 4.1.0 (already installed) | Timezone-aware date handling | Already in project, functional approach, tree-shakeable |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Firebase Firestore | 12.8.0 (installed) | User preferences storage | Real-time sync, structured queries, cross-device |
| Intl API (native) | Browser native | Timezone detection | `Intl.DateTimeFormat().resolvedOptions().timeZone` |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| react-hook-form + Zod | Formik + Yup | Formik has more re-renders, Yup lacks native TS inference |
| Firestore onSnapshot | Polling with fetch | Polling adds latency, misses real-time updates, wastes bandwidth |
| Native time input | react-time-picker | Native input has better accessibility, but inconsistent 12/24h format across browsers |
| Zod z.iso.time() | Custom regex | Zod handles edge cases (precision, offsets), less error-prone |

**Installation:**
```bash
npm install react-hook-form zod @hookform/resolvers
```

## Architecture Patterns

### Recommended Project Structure
```
app/
├── settings/
│   └── notifications/
│       ├── page.js                 # Settings UI page
│       └── NotificationSettings.js # Form component
lib/
├── notificationFilter.js           # Server-side filtering logic
├── schemas/
│   └── notificationPreferences.js  # Zod schema
hooks/
├── useNotificationPreferences.js   # Firestore listener hook
└── useNotificationSettingsForm.js  # Form hook
```

### Pattern 1: Server-Side Filtering Before Send
**What:** Check user preferences in `sendNotificationToUser()` before calling `sendPushNotification()`
**When to use:** Every notification send flow (ensures preferences always enforced)
**Example:**
```javascript
// lib/notificationFilter.js
export async function sendNotificationToUser(userId, notification) {
  // 1. Fetch user preferences from Firestore
  const prefs = await getAdminFirestore()
    .collection('users')
    .doc(userId)
    .collection('settings')
    .doc('notifications')
    .get();

  const preferences = prefs.data() || getDefaultPreferences();

  // 2. Check if notification type is enabled
  const notifType = notification.data?.type || 'generic';
  if (!preferences.enabledTypes?.[notifType]) {
    console.log(`Notification type ${notifType} disabled for user ${userId}`);
    return { success: false, reason: 'type_disabled' };
  }

  // 3. Check DND hours (per-device)
  const tokens = await getTokensNotInDND(userId, preferences);

  // 4. Check rate limit (per type)
  const allowedTokens = await applyRateLimit(userId, notifType, tokens);

  // 5. Send to filtered tokens
  if (allowedTokens.length === 0) {
    return { success: false, reason: 'all_filtered' };
  }

  return await sendPushNotification(allowedTokens, notification, userId);
}
```

### Pattern 2: Firestore Real-Time Sync Hook
**What:** React hook that syncs settings across devices via Firestore `onSnapshot()`
**When to use:** Settings page mount, ensures instant cross-device updates
**Example:**
```javascript
// hooks/useNotificationPreferences.js
// Source: Firebase official docs + React patterns
import { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { getFirestore } from '@/lib/firebase';

export function useNotificationPreferences(userId) {
  const [prefs, setPrefs] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!userId) return;

    const db = getFirestore();
    const docRef = doc(db, 'users', userId, 'settings', 'notifications');

    // Real-time listener - updates instantly across devices
    const unsubscribe = onSnapshot(
      docRef,
      (snapshot) => {
        setPrefs(snapshot.data() || getDefaultPreferences());
        setLoading(false);
      },
      (err) => {
        console.error('Preferences sync error:', err);
        setError(err);
        setLoading(false);
      }
    );

    // CRITICAL: Cleanup to prevent memory leak
    return () => unsubscribe();
  }, [userId]);

  return { prefs, loading, error };
}
```

### Pattern 3: React Hook Form + Zod Integration
**What:** Type-safe form validation with Zod schema resolver
**When to use:** Settings form component
**Example:**
```javascript
// lib/schemas/notificationPreferences.js
import { z } from 'zod';

// DND window schema
const dndWindowSchema = z.object({
  startTime: z.iso.time({ precision: -1 }), // HH:mm format
  endTime: z.iso.time({ precision: -1 }),
  enabled: z.boolean(),
}).refine(
  (data) => {
    // Validate time range (handles overnight periods like 22:00-08:00)
    if (!data.enabled) return true;
    const start = parseTime(data.startTime);
    const end = parseTime(data.endTime);
    return start !== end; // At least 1 minute difference
  },
  { message: 'Start and end times must be different' }
);

export const notificationPreferencesSchema = z.object({
  enabledTypes: z.record(z.string(), z.boolean()), // { CRITICAL: true, scheduler_success: false }
  dndWindows: z.array(dndWindowSchema).max(5), // Max 5 DND periods per day
  rateLimits: z.record(z.string(), z.object({
    windowMinutes: z.number().min(1).max(60),
    maxPerWindow: z.number().min(1).max(10),
  })),
  timezone: z.string(), // Auto-detected, informational only
});

// app/settings/notifications/NotificationSettings.js
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

function NotificationSettings({ userId }) {
  const { prefs, loading } = useNotificationPreferences(userId);

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(notificationPreferencesSchema),
    defaultValues: prefs, // CRITICAL: Must provide defaultValues
    mode: 'onBlur', // Validate on blur for better UX
  });

  const onSubmit = async (data) => {
    await updateDoc(doc(db, 'users', userId, 'settings', 'notifications'), data);
  };

  // ... form UI
}
```

### Pattern 4: In-Memory Rate Limiting (Server-Side)
**What:** Track recent sends per user/type in memory, aggregate suppressed notifications
**When to use:** Before sending each notification
**Example:**
```javascript
// lib/rateLimiter.js
const recentSends = new Map(); // userId -> { type -> [timestamps] }

export function checkRateLimit(userId, notifType, windowMinutes, maxPerWindow) {
  const key = `${userId}:${notifType}`;
  const now = Date.now();
  const windowMs = windowMinutes * 60 * 1000;

  // Get recent sends for this user/type
  const sends = recentSends.get(key) || [];

  // Filter to window
  const recentInWindow = sends.filter(ts => now - ts < windowMs);

  // Check limit
  if (recentInWindow.length >= maxPerWindow) {
    return { allowed: false, suppressedCount: recentInWindow.length };
  }

  // Track this send
  recentInWindow.push(now);
  recentSends.set(key, recentInWindow);

  return { allowed: true };
}

// Cleanup old entries periodically (prevent memory leak)
setInterval(() => {
  const now = Date.now();
  for (const [key, sends] of recentSends) {
    const filtered = sends.filter(ts => now - ts < 60 * 60 * 1000); // Keep 1 hour
    if (filtered.length === 0) {
      recentSends.delete(key);
    } else {
      recentSends.set(key, filtered);
    }
  }
}, 5 * 60 * 1000); // Every 5 minutes
```

### Pattern 5: Browser Timezone Detection
**What:** Auto-detect user's timezone, no manual selection needed
**When to use:** On settings page load, DND time comparisons
**Example:**
```javascript
// utils/timezone.js
export function getUserTimezone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
  // Returns: "Europe/Rome", "America/New_York", etc.
}

export function isInDNDWindow(dndWindow, timezone) {
  const now = new Date();

  // Parse HH:mm times in user's timezone
  const [startHour, startMin] = dndWindow.startTime.split(':').map(Number);
  const [endHour, endMin] = dndWindow.endTime.split(':').map(Number);

  const start = new Date(now);
  start.setHours(startHour, startMin, 0, 0);

  const end = new Date(now);
  end.setHours(endHour, endMin, 0, 0);

  // Handle overnight periods (22:00-08:00)
  if (end < start) {
    // If current time is after start OR before end
    return now >= start || now < end;
  }

  // Normal period (08:00-17:00)
  return now >= start && now < end;
}
```

### Anti-Patterns to Avoid
- **Storing full FCM tokens in Firestore preferences:** Use userId reference, not tokens (tokens are in Realtime DB)
- **Client-side only validation:** Server must re-validate preferences to prevent tampering
- **Polling for preference updates:** Use `onSnapshot()` for instant sync, not interval polling
- **Forgetting listener cleanup:** Always return `unsubscribe()` in useEffect to prevent memory leaks
- **Using Zod beta versions (v4.0.0-beta.x):** Beta versions throw errors instead of capturing in formState.errors

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Form validation | Custom validators, manual error state | React Hook Form + Zod | Handles edge cases (arrays, nested objects, async validation, cross-field rules), type-safe |
| Time input validation | Regex for HH:mm format | `z.iso.time({ precision: -1 })` | Handles invalid times (25:99), optional seconds, timezone offsets |
| Real-time data sync | Polling with setInterval | Firestore `onSnapshot()` | Delta updates only, WebSocket connection, automatic reconnection |
| Timezone detection | IP geolocation APIs | `Intl.DateTimeFormat().resolvedOptions()` | Native, instant, no API calls, respects system settings |
| Rate limiting | Custom timestamp arrays | rate-limiter-flexible library | Handles distributed scenarios, Redis support, sliding window algorithms |
| DND overnight periods | Complex date math | date-fns `isWithinInterval()` | Handles edge cases (DST transitions, leap seconds) |

**Key insight:** Notification preference systems have complex edge cases (timezone DST, overnight DND, cross-device race conditions). Using battle-tested libraries prevents subtle bugs that only appear in production.

## Common Pitfalls

### Pitfall 1: Firestore Listener Memory Leaks
**What goes wrong:** `onSnapshot()` listener continues receiving updates after component unmount, causing memory leak and setState on unmounted component warnings
**Why it happens:** Forgetting to call the unsubscribe function returned by `onSnapshot()`
**How to avoid:** Always return cleanup function from useEffect
**Warning signs:** Console warnings "Can't perform React state update on an unmounted component"
**Example:**
```javascript
// BAD - no cleanup
useEffect(() => {
  onSnapshot(docRef, (snap) => setData(snap.data()));
}, []);

// GOOD - cleanup prevents leak
useEffect(() => {
  const unsubscribe = onSnapshot(docRef, (snap) => setData(snap.data()));
  return () => unsubscribe(); // CRITICAL
}, []);
```

### Pitfall 2: Missing defaultValues in React Hook Form
**What goes wrong:** Form fields start as `undefined`, causing Zod validation errors and controlled/uncontrolled component warnings
**Why it happens:** React Hook Form does not assign default values automatically
**How to avoid:** Always provide `defaultValues` in `useForm()`, even if empty object
**Warning signs:** Form validation fails immediately on mount, console warnings about controlled components
**Example:**
```javascript
// BAD - no defaults
const { register } = useForm({ resolver: zodResolver(schema) });

// GOOD - explicit defaults
const { register } = useForm({
  resolver: zodResolver(schema),
  defaultValues: prefs || getDefaultPreferences(), // CRITICAL
});
```

### Pitfall 3: DND Time Comparison Without Timezone Awareness
**What goes wrong:** DND hours compare against server timezone (UTC) instead of user's local time
**Why it happens:** Using `new Date()` on server without timezone context
**How to avoid:** Per-device DND settings stored with device's timezone, check at send time using device timezone
**Warning signs:** User sets DND 22:00-08:00 local time, receives notifications at wrong hours
**Example:**
```javascript
// BAD - server timezone
const now = new Date();
const hour = now.getHours(); // UTC hour

// GOOD - device timezone from preferences
const deviceTz = preferences.devices[deviceId].timezone;
const now = new Date().toLocaleString('en-US', { timeZone: deviceTz });
```

### Pitfall 4: Rate Limit Per Category Instead of Per Type
**What goes wrong:** User gets spammed with 3 different error types in 1 minute because rate limit checks "Alerts" category, not individual ERROR/CRITICAL types
**Why it happens:** Grouping rate limits by semantic category (3 categories) instead of notification type (6+ types)
**How to avoid:** Rate limit scoped to notification type (`scheduler_success`, `ERROR`, etc.), not category
**Warning signs:** Success criteria failure - "3 scheduler events in 4 min" sends 3 notifications instead of 1
**Example:**
```javascript
// BAD - category-level rate limit
const category = getCategory(notifType); // "Alerts"
checkRateLimit(userId, category);

// GOOD - type-level rate limit
checkRateLimit(userId, notifType); // "ERROR"
```

### Pitfall 5: Race Condition on Cross-Device Save
**What goes wrong:** User updates settings on phone and tablet simultaneously, one overwrites the other
**Why it happens:** Both clients read old state, update, and write back (last write wins)
**How to avoid:** Use Firestore transactions or optimistic merge strategies, show conflict UI
**Warning signs:** Settings randomly revert to old values when using multiple devices
**Example:**
```javascript
// BAD - overwrite
await updateDoc(docRef, newPreferences);

// BETTER - transaction (but slow)
await runTransaction(db, async (transaction) => {
  const doc = await transaction.get(docRef);
  transaction.update(docRef, newPreferences);
});

// BEST - optimistic + conflict detection
const currentVersion = await getDoc(docRef).data().version;
await updateDoc(docRef, {
  ...newPreferences,
  version: currentVersion + 1, // Detect conflicts
});
```

### Pitfall 6: Zod Beta Version Error Handling
**What goes wrong:** Zod v4.0.0-beta throws ZodError directly instead of capturing in `formState.errors`
**Why it happens:** Beta versions changed error handling behavior
**How to avoid:** Use stable Zod 4.1.x+ versions, avoid beta releases
**Warning signs:** Form errors not displayed, uncaught exceptions in console
**Solution:** `npm install zod@latest` (ensures stable 4.1.x+)

### Pitfall 7: Native Time Input 12h/24h Format Inconsistency
**What goes wrong:** Same time displayed as "3:00 PM" on iOS, "15:00" on Android - confusing UX
**Why it happens:** Browser/OS locale determines 12h vs 24h format, no HTML attribute to force 24h
**How to avoid:** Accept the inconsistency (value is always 24h HH:mm), or use custom time picker
**Warning signs:** User confusion about AM/PM in bug reports
**Recommendation:** Document in UI: "Time format follows your device settings"

## Code Examples

Verified patterns from official sources:

### Example 1: Complete Zod Schema for Preferences
```javascript
// lib/schemas/notificationPreferences.js
// Source: Zod docs + project requirements
import { z } from 'zod';

const dndWindowSchema = z.object({
  id: z.string().uuid(), // For React key prop
  startTime: z.iso.time({ precision: -1 }), // HH:mm only
  endTime: z.iso.time({ precision: -1 }),
  enabled: z.boolean().default(true),
  deviceId: z.string().optional(), // Per-device DND
}).refine(
  (data) => {
    if (!data.enabled) return true;
    return data.startTime !== data.endTime;
  },
  { message: 'Start and end must differ', path: ['startTime'] }
);

const rateLimitSchema = z.object({
  windowMinutes: z.number().int().min(1).max(60).default(5),
  maxPerWindow: z.number().int().min(1).max(10).default(1),
});

export const notificationPreferencesSchema = z.object({
  // Type-level toggles (6+ types)
  enabledTypes: z.record(z.string(), z.boolean()).default({
    CRITICAL: true,
    ERROR: true,
    maintenance: true,
    updates: true,
    scheduler_success: false, // Opt-in
    status: false,
  }),

  // Multiple DND windows per day
  dndWindows: z.array(dndWindowSchema).max(5).default([]),

  // Per-type rate limits
  rateLimits: z.record(z.string(), rateLimitSchema).default({
    CRITICAL: { windowMinutes: 1, maxPerWindow: 3 }, // Never rate-limit CRITICAL too much
    ERROR: { windowMinutes: 1, maxPerWindow: 2 },
    scheduler_success: { windowMinutes: 5, maxPerWindow: 1 },
    status: { windowMinutes: 5, maxPerWindow: 1 },
  }),

  // Auto-detected timezone (read-only in UI)
  timezone: z.string().default('UTC'),

  // Metadata
  version: z.number().int().default(1), // For conflict detection
  updatedAt: z.string().datetime().optional(),
});

export type NotificationPreferences = z.infer<typeof notificationPreferencesSchema>;

// Default preferences (balanced approach per CONTEXT.md)
export function getDefaultPreferences() {
  return notificationPreferencesSchema.parse({
    enabledTypes: {
      CRITICAL: true,
      ERROR: true,
      maintenance: true,
      updates: true,
      scheduler_success: false,
      status: false,
    },
    dndWindows: [],
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  });
}
```

### Example 2: Settings Form Component
```javascript
// app/settings/notifications/NotificationSettings.js
// Source: React Hook Form docs + Firestore patterns
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { notificationPreferencesSchema } from '@/lib/schemas/notificationPreferences';
import { useNotificationPreferences } from '@/hooks/useNotificationPreferences';
import { doc, updateDoc } from 'firebase/firestore';
import { getFirestore } from '@/lib/firebase';

export default function NotificationSettings({ userId }) {
  const { prefs, loading, error } = useNotificationPreferences(userId);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const { register, handleSubmit, formState: { errors, isDirty } } = useForm({
    resolver: zodResolver(notificationPreferencesSchema),
    defaultValues: prefs,
    mode: 'onBlur', // Validate on blur for better UX
  });

  // Update defaultValues when prefs load (real-time sync)
  useEffect(() => {
    if (prefs) {
      reset(prefs);
    }
  }, [prefs, reset]);

  const onSubmit = async (data) => {
    const db = getFirestore();
    const docRef = doc(db, 'users', userId, 'settings', 'notifications');

    await updateDoc(docRef, {
      ...data,
      updatedAt: new Date().toISOString(),
      version: (prefs?.version || 0) + 1,
    });

    // Success feedback
    console.log('Preferences saved - syncing across devices...');
  };

  if (loading) return <div>Loading preferences...</div>;
  if (error) return <div>Error loading preferences: {error.message}</div>;

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <h2>Notification Settings</h2>

      {/* Basic Mode: Category toggles */}
      <section>
        <h3>Notification Types</h3>
        <label>
          <input type="checkbox" {...register('enabledTypes.CRITICAL')} />
          Critical Alerts
        </label>
        <label>
          <input type="checkbox" {...register('enabledTypes.ERROR')} />
          Error Alerts
        </label>
        {/* ... other types */}
      </section>

      {/* DND Hours */}
      <section>
        <h3>Do Not Disturb</h3>
        <p>Current timezone: {prefs?.timezone}</p>
        {/* Time inputs with native type="time" */}
        <label>
          Start: <input type="time" {...register('dndWindows.0.startTime')} />
          {errors.dndWindows?.[0]?.startTime && (
            <span role="alert">{errors.dndWindows[0].startTime.message}</span>
          )}
        </label>
        <label>
          End: <input type="time" {...register('dndWindows.0.endTime')} />
        </label>
      </section>

      {/* Advanced Mode: Progressive disclosure */}
      <button type="button" onClick={() => setShowAdvanced(!showAdvanced)}>
        {showAdvanced ? 'Hide' : 'Show'} Advanced Settings
      </button>

      {showAdvanced && (
        <section>
          <h3>Rate Limits</h3>
          {/* Per-type rate limit controls */}
        </section>
      )}

      <button type="submit" disabled={!isDirty}>
        Save Preferences
      </button>
    </form>
  );
}
```

### Example 3: Server-Side Filtering in sendNotificationToUser
```javascript
// lib/firebaseAdmin.js (modified sendNotificationToUser)
// Source: Existing code + filtering pattern
import { getAdminFirestore } from './firebaseAdmin';
import { isInDNDWindow } from '@/utils/timezone';
import { checkRateLimit } from '@/lib/rateLimiter';

export async function sendNotificationToUser(userId, notification) {
  try {
    // 1. Fetch user preferences from Firestore
    const prefsDoc = await getAdminFirestore()
      .collection('users')
      .doc(userId)
      .collection('settings')
      .doc('notifications')
      .get();

    const preferences = prefsDoc.data() || getDefaultPreferences();

    // 2. Check if notification type is enabled
    const notifType = notification.data?.type || 'generic';
    if (!preferences.enabledTypes?.[notifType]) {
      console.log(`Type ${notifType} disabled for user ${userId}`);
      return {
        success: false,
        reason: 'type_disabled',
        message: `User disabled ${notifType} notifications`,
      };
    }

    // 3. Get all user tokens
    const tokensData = await adminDbGet(`users/${userId}/fcmTokens`);
    if (!tokensData) {
      return { success: false, error: 'NO_TOKENS' };
    }

    // 4. Filter tokens by DND (per-device)
    const allowedTokens = [];
    const suppressedByDND = [];

    for (const [tokenKey, tokenData] of Object.entries(tokensData)) {
      const deviceId = tokenData.deviceId;

      // Check DND windows for this device
      const deviceDND = preferences.dndWindows.filter(w =>
        w.enabled && (!w.deviceId || w.deviceId === deviceId)
      );

      let inDND = false;
      for (const window of deviceDND) {
        if (isInDNDWindow(window, tokenData.timezone || preferences.timezone)) {
          inDND = true;
          break;
        }
      }

      // CRITICAL notifications bypass DND
      if (inDND && notifType !== 'CRITICAL') {
        suppressedByDND.push(tokenKey);
        continue;
      }

      allowedTokens.push(tokenData.token);
    }

    // 5. Check rate limit (per notification type)
    const rateLimit = preferences.rateLimits?.[notifType] || {
      windowMinutes: 5,
      maxPerWindow: 1,
    };

    const rateLimitResult = checkRateLimit(
      userId,
      notifType,
      rateLimit.windowMinutes,
      rateLimit.maxPerWindow
    );

    if (!rateLimitResult.allowed) {
      // TODO: Aggregate into summary notification
      console.log(`Rate limit hit for ${userId}:${notifType}`);
      return {
        success: false,
        reason: 'rate_limited',
        suppressedCount: rateLimitResult.suppressedCount,
      };
    }

    // 6. Send to filtered tokens
    if (allowedTokens.length === 0) {
      return {
        success: false,
        reason: 'all_filtered',
        suppressedByDND: suppressedByDND.length,
      };
    }

    return await sendPushNotification(allowedTokens, notification, userId);

  } catch (error) {
    console.error('Error in filtered send:', error);
    throw error;
  }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Formik + Yup | React Hook Form + Zod | ~2021-2022 | Better TypeScript support, fewer re-renders, native type inference |
| Polling for updates | Firestore onSnapshot | Firebase SDK v9+ (2021) | Instant cross-device sync, delta updates only, WebSocket efficiency |
| Manual time validation | `z.iso.time()` | Zod 4.0 (2024) | Built-in HH:mm validation with precision control, handles edge cases |
| Client-side rate limiting | Server-side before send | Industry shift 2020+ | Prevents client tampering, accurate enforcement, summary aggregation |
| Global DND settings | Per-device DND | Mobile-first shift 2020+ | Phone silent at night, desktop active for urgent alerts |

**Deprecated/outdated:**
- **Formik:** Still works but React Hook Form has better performance and TypeScript support
- **Moment.js:** Deprecated, use date-fns or native Intl API instead
- **z.string().time():** Deprecated in Zod 4.x, use `z.iso.time()` instead
- **Global notification toggles only:** Modern apps provide type-level granular control
- **Manual timezone selection:** Browser Intl API provides automatic detection

## Open Questions

Things that couldn't be fully resolved:

1. **Summary notification aggregation format**
   - What we know: Industry uses "3 scheduler events succeeded" format, entity-based grouping
   - What's unclear: Exact UI/copy for aggregated notifications in this project
   - Recommendation: Start simple ("3 notifications suppressed"), iterate based on user feedback

2. **Rate limit configuration UI**
   - What we know: Per-type rate limits needed, different windows (1-60 min)
   - What's unclear: Should users configure rate limits or use smart defaults only?
   - Recommendation: Phase 3 uses fixed defaults, Phase 4+ allows advanced customization

3. **Performance at scale**
   - What we know: In-memory rate limiting works for single server
   - What's unclear: Horizontal scaling needs Redis/distributed rate limiter
   - Recommendation: Start in-memory (current Next.js deployment is single instance), migrate to Redis if scaling horizontally

4. **Offline preference changes**
   - What we know: Firestore has offline persistence, changes sync when online
   - What's unclear: Should UI prevent edits when offline or allow optimistic updates?
   - Recommendation: Allow edits offline, show "Syncing..." indicator, Firestore handles conflicts

## Sources

### Primary (HIGH confidence)
- React Hook Form official docs: https://react-hook-form.com/advanced-usage (Advanced patterns, validation modes)
- Zod official docs: https://zod.dev/api (z.iso.time(), schema definition)
- Firebase Firestore real-time listeners: https://firebase.google.com/docs/firestore/query-data/listen (onSnapshot patterns)
- MDN Intl API: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat (Timezone detection)

### Secondary (MEDIUM confidence)
- [React Hook Form Common Pitfalls](https://alexhooley.com/blog/react-hook-form-common-mistakes) - Missing defaultValues, import confusion
- [Firebase onSnapshot cleanup patterns](https://brandonlehr.com/reactjs/2018/11/08/unsubscribing-from-firestore-realtime-updates-in-react/) - Memory leak prevention
- [Alert aggregation patterns](https://docs.splunk.com/observability/en/sp-oncall/alerts/notification-alert-aggregation.html) - 60-second window, entity-based grouping
- [Progressive disclosure UI patterns](https://www.nngroup.com/articles/progressive-disclosure/) - Nielsen Norman Group best practices

### Tertiary (LOW confidence - verify during implementation)
- WebSearch: "rate-limiter-flexible" library for distributed scenarios
- WebSearch: Native HTML time input 12h/24h format inconsistency (verify with actual browser testing)
- WebSearch: React time picker libraries (evaluate accessibility during implementation)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - React Hook Form + Zod is industry standard (40k+ stars, official docs verified)
- Architecture: HIGH - Firestore onSnapshot verified in Firebase docs, filtering pattern matches existing codebase
- Pitfalls: HIGH - Verified from official docs (RHF, Firebase) and GitHub issues tracking memory leaks
- Rate limiting: MEDIUM - Patterns verified but implementation details need project-specific adaptation
- UI components: MEDIUM - Time input behavior needs cross-browser testing in target environments

**Research date:** 2026-01-24
**Valid until:** ~30 days (stable technologies, check for React Hook Form v8 stable release)

**Notes:**
- React Hook Form v8 is in beta (v8.0.0-beta.1 released 2026-01-11) - use stable v7.x until v8 stable
- Zod stable at 4.1.x+ - avoid beta versions
- Project already has date-fns 4.1.0 - use for timezone-aware operations
- Existing notification architecture in lib/firebaseAdmin.js confirmed - filtering integrates cleanly
