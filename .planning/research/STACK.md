# Stack Research - Production-Grade PWA Push Notifications

**Domain:** PWA Push Notification System (FCM-based)
**Researched:** 2026-01-23
**Confidence:** HIGH

## Executive Summary

This stack builds on existing Firebase Cloud Messaging integration to achieve production-grade reliability: 100% token persistence across browser restarts, comprehensive monitoring, user preferences, and notification history. Focus is on what to ADD to existing FCM setup, not replace it.

**Key additions:**
- Robust token management (refresh/validation/cleanup)
- Cloud Firestore for notification history (better querying than Realtime DB)
- shadcn/ui + Recharts for monitoring dashboard
- React Hook Form + Zod for preferences
- Automated testing for service worker reliability

---

## Core Technologies (Existing - No Changes)

| Technology | Version | Purpose | Status |
|------------|---------|---------|--------|
| Next.js | 16.1.0 (current) | App Router framework | ✅ Keep |
| Firebase Client SDK | 12.8.0 (current) | FCM client messaging | ✅ Keep |
| Firebase Admin SDK | 13.6.0 (current) | Server-side notification sending | ✅ Keep |
| Firebase Realtime Database | N/A | FCM token storage | ✅ Keep for tokens |
| Serwist | 9.0.0 (current) | Service Worker management | ✅ Keep |
| Auth0 | 4.13.1 (current) | Authentication | ✅ Keep |

**Rationale:** Existing stack is current and appropriate. No migrations needed.

---

## New: Notification History Storage

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Cloud Firestore | Latest (via firebase 12.8.0) | Notification history | Better querying than Realtime DB for history filtering (by user, date, read status). Firebase official recommendation for complex queries. |

**Installation:**
```bash
# Already included in firebase package - no new installation
```

**Firestore vs Realtime Database:**
- Realtime DB: Good for tokens (simple key-value, low latency)
- Firestore: Better for history (complex queries, filtering, sorting)
- Use both: Realtime DB for tokens, Firestore for history

**Data Model:**
```javascript
// Collection: notifications/{userId}/history/{notificationId}
{
  id: string,
  userId: string,
  title: string,
  body: string,
  data: object,
  sentAt: Timestamp,
  readAt: Timestamp | null,
  deliveredAt: Timestamp | null,
  type: 'stove' | 'temperature' | 'maintenance' | 'system',
  priority: 'high' | 'normal' | 'low',
  deviceToken: string,
  status: 'sent' | 'delivered' | 'read' | 'failed'
}
```

**Confidence:** HIGH - Official Firebase guidance, current as of 2026-01-22 UTC

**Sources:**
- [Firebase: Choose a Database](https://firebase.google.com/docs/database/rtdb-vs-firestore)
- [Firestore Data Model](https://firebase.google.com/docs/firestore/data-model)

---

## New: Dashboard & Monitoring UI

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Recharts | ^2.x | Charts/graphs | All monitoring visualizations (delivery rates, notification volume) |
| date-fns | ^4.1.0 | Date formatting | Timestamp display, relative dates ("2 hours ago") |
| Lucide React | 0.562.0 (current) | Icons | Already installed, use for dashboard icons |

**Installation:**
```bash
# Charts
npm install recharts

# Date utilities
npm install date-fns

# Lucide already installed
```

**Why Recharts:**
- shadcn/ui uses Recharts under the hood (no abstraction lock-in)
- 53+ chart variations available
- Composition-based (full control)
- CSS variables for dark/light mode (matches Ember Noir design)
- Upgrading to v3 soon (currently v2 stable)

**Why date-fns over dayjs:**
- Better tree-shaking (1.6 KB per function vs 6+ KB for dayjs)
- Functional approach (immutable, composable)
- Excellent TypeScript support
- Already used by many Next.js projects

**Confidence:** HIGH - shadcn/ui official chart component, date-fns widely adopted

**Sources:**
- [shadcn/ui Charts](https://ui.shadcn.com/docs/components/chart)
- [date-fns vs dayjs comparison](https://www.dhiwise.com/post/date-fns-vs-dayjs-the-battle-of-javascript-date-libraries)

---

## New: User Preferences Form

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| React Hook Form | ^7.54.0 | Form state management | All preference forms (notification settings) |
| Zod | ^3.24.0 | Schema validation | Type-safe validation for preferences |
| @hookform/resolvers | ^3.9.0 | RHF + Zod integration | Bridge between React Hook Form and Zod |

**Installation:**
```bash
npm install react-hook-form zod @hookform/resolvers
```

**Why This Stack:**
- React Hook Form: Fast client-side validation, minimal re-renders
- Zod: TypeScript-first schema validation, shared client/server contract
- shadcn/ui Forms documented pattern (uses this exact stack)
- Validates: required fields, types, ranges, cross-field rules

**Example Schema:**
```typescript
import { z } from 'zod';

const preferencesSchema = z.object({
  enableNotifications: z.boolean(),
  notificationTypes: z.object({
    stoveStatus: z.boolean(),
    temperatureAlerts: z.boolean(),
    maintenanceReminders: z.boolean(),
    systemUpdates: z.boolean(),
  }),
  quietHours: z.object({
    enabled: z.boolean(),
    start: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
    end: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  }),
  deliveryMethod: z.enum(['push', 'email', 'both']),
});
```

**Confidence:** HIGH - Official shadcn/ui pattern, current versions

**Sources:**
- [shadcn/ui React Hook Form](https://ui.shadcn.com/docs/forms/react-hook-form)
- [Zod with React Hook Form](https://www.contentful.com/blog/react-hook-form-validation-zod/)

---

## New: FCM Token Management

| Strategy | Frequency | Purpose | Implementation |
|----------|-----------|---------|----------------|
| Token Refresh | Monthly | Detect stale tokens | Scheduled Cloud Function or cron API route |
| Token Validation | On send failure | Remove invalid tokens | Monitor error codes from FCM |
| Token Cleanup | Weekly | Delete expired tokens | Scheduled job + Firestore query |
| Token Timestamp | On every update | Track token freshness | Add `updatedAt` field to token documents |

**Error Codes to Monitor:**
```typescript
// HTTP v1 API error codes indicating invalid tokens
const INVALID_TOKEN_ERRORS = [
  'UNREGISTERED',        // HTTP 404 - token no longer valid
  'INVALID_ARGUMENT',    // HTTP 400 - invalid token (verify payload first)
  'messaging/invalid-registration-token',
  'messaging/registration-token-not-registered',
];
```

**Token Expiry Rules (2026):**
- Stale after: 1 month of inactivity (customizable)
- Expired after: 270 days of inactivity (Android, hard limit)
- Refresh interval: Monthly (Firebase recommendation)

**Implementation Pattern:**
```typescript
// pages/api/tokens/refresh.js
export default async function handler(req, res) {
  const tokensRef = ref(db, 'fcmTokens');
  const snapshot = await get(tokensRef);
  const now = Date.now();
  const oneMonthAgo = now - (30 * 24 * 60 * 60 * 1000);

  const staleTokens = [];
  snapshot.forEach((child) => {
    const token = child.val();
    if (token.updatedAt < oneMonthAgo) {
      staleTokens.push(child.key);
    }
  });

  // Delete stale tokens
  for (const tokenId of staleTokens) {
    await remove(ref(db, `fcmTokens/${tokenId}`));
  }

  res.json({ removed: staleTokens.length });
}
```

**Confidence:** HIGH - Official Firebase documentation, verified January 2026

**Sources:**
- [FCM Token Management Best Practices](https://firebase.google.com/docs/cloud-messaging/manage-tokens)
- [Managing Cloud Messaging Tokens](https://firebase.blog/posts/2023/04/managing-cloud-messaging-tokens/)

---

## New: Testing & Quality Assurance

| Tool | Version | Purpose | When to Use |
|------|---------|---------|-------------|
| Jest | 30.2.0 (current) | Unit/integration tests | Already installed, use for all tests |
| @testing-library/react | 16.3.1 (current) | Component testing | Already installed, use for UI tests |
| Playwright | ^1.49.0 | Service worker E2E tests | Add for SW/FCM integration tests |

**Installation:**
```bash
# Playwright for service worker testing
npm install -D @playwright/test
npx playwright install
```

**Why Playwright for Service Workers:**
- Jest mocks can't fully test service worker lifecycle
- Playwright runs real browser contexts with SW support
- Can test FCM token persistence across page reloads
- Incognito mode + NetworkService flag enables full SW testing

**Test Coverage Targets:**
```
- Token registration: ✅ Browser restart persistence
- Token refresh: ✅ Monthly refresh logic
- Notification reception: ✅ Foreground/background handling
- Permission prompts: ✅ User acceptance/denial flows
- Token cleanup: ✅ Stale token removal
- History storage: ✅ Firestore writes on notification
```

**Confidence:** MEDIUM - Playwright recommended but not required (can use Chrome DevTools)

**Sources:**
- [Testing in 2026: Jest & Full Stack Testing](https://www.nucamp.co/blog/testing-in-2026-jest-react-testing-library-and-full-stack-testing-strategies)
- [Testing Service Worker with Playwright](https://medium.com/ynap-tech/testing-service-worker-2f9ede60bae)

---

## New: FCM Testing Tools

| Tool | Purpose | When to Use |
|------|---------|-------------|
| fcmtest.com | Online FCM tester | Quick manual testing without code |
| pushtry.com | APNS/FCM tester | Cross-platform notification testing |
| fcm-push-cli | CLI testing tool | Automated testing in CI/CD |
| Firebase Console | Built-in tester | Official testing UI for FCM messages |

**Installation (CLI tool):**
```bash
# Optional: for automated testing
npm install -D fcm-push-cli
```

**Why Use Testing Tools:**
- Validate token format without sending real notifications
- Test custom data payloads before production
- Verify notification appearance on different devices
- Debug delivery issues without app changes

**Recommended Workflow:**
1. **Development:** Use fcmtest.com for quick validation
2. **Testing Panel:** Build in-app tester (part of milestone)
3. **CI/CD:** Use fcm-push-cli for automated tests
4. **Production:** Firebase Console for manual sends

**Confidence:** MEDIUM - Tools exist but not critical (can use Firebase Console)

**Sources:**
- [FCM Testing Tools](https://fcmtest.com/)
- [fcm-push-cli on GitHub](https://github.com/tastydev/fcm-push-cli)

---

## Supporting Libraries (Optional but Recommended)

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| react-hot-toast | ^2.4.1 | In-app notification toasts | Foreground notification display (lightweight) |
| clsx | ^2.1.1 | Conditional classNames | Styling notification components |
| tailwind-merge | ^2.7.0 | Merge Tailwind classes | Avoid class conflicts in components |

**Installation:**
```bash
npm install react-hot-toast clsx tailwind-merge
```

**Why These:**
- react-hot-toast: 2KB, better DX than building custom toast system
- clsx + tailwind-merge: Standard pattern for conditional Tailwind classes
- All lightweight, no breaking changes expected

**Confidence:** MEDIUM - Nice-to-have, not critical

---

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| Firestore | Realtime DB | If querying by simple userId (but Firestore is better) |
| Recharts | Chart.js | If you need canvas rendering (Recharts uses SVG) |
| date-fns | dayjs | If you prefer Moment.js-like API (but date-fns has better tree-shaking) |
| React Hook Form | Formik | If you already use Formik (but RHF is faster) |
| Playwright | Puppeteer | If you need simpler API (but Playwright has better SW support) |

---

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| OneSignal, Pusher, etc. | Replace FCM (requirement is to keep FCM) | Firebase Cloud Messaging |
| Moment.js | Deprecated, large bundle size (66KB) | date-fns (tree-shakeable) |
| Chart.js | Canvas-based, harder to style for dark mode | Recharts (SVG, CSS variables) |
| localStorage for tokens | Lost on browser restart | Realtime Database (cloud-persisted) |
| Custom notification service | Reinventing the wheel | FCM + proper token management |
| Firestore for tokens | Overkill, slower than Realtime DB | Realtime DB for tokens only |

---

## Stack Patterns by Use Case

### If you need email backup (future enhancement):
- Add SendGrid or Resend for email notifications
- Store email preferences in Firestore user preferences
- Trigger via Cloud Functions on notification creation

### If you need SMS backup (future enhancement):
- Add Twilio for SMS notifications
- Store phone numbers in user preferences
- Consider cost implications (SMS more expensive than push)

### If notification volume exceeds 1M/month:
- Implement batching for FCM sends (up to 500 tokens per batch)
- Use FCM Topics for broadcast messages
- Monitor FCM quotas (10K messages/second per project)

---

## Version Compatibility

| Package | Compatible With | Notes |
|---------|-----------------|-------|
| firebase@12.8.0 | Next.js 16.1.0 | ✅ Fully compatible |
| firebase-admin@13.6.0 | Node.js 18+ | ✅ Next.js 16 uses Node 18+ |
| recharts@2.x | React 19 | ✅ Compatible, v3 coming soon |
| react-hook-form@7.x | React 19 | ✅ Fully compatible |
| zod@3.x | TypeScript 5.x | ✅ Type-safe validation |
| @playwright/test@1.x | Next.js 16 | ✅ E2E testing compatible |

**Known Issues:**
- Recharts v3 is in progress (use v2 for now, straightforward upgrade later)
- Firebase SDK: Avoid mixing firebase and firebase-admin in client code

---

## Installation Summary

```bash
# Core additions (required)
npm install recharts date-fns react-hook-form zod @hookform/resolvers

# Testing (recommended)
npm install -D @playwright/test
npx playwright install

# Optional enhancements
npm install react-hot-toast clsx tailwind-merge

# CLI testing tool (optional)
npm install -D fcm-push-cli
```

**Total added bundle size (production):**
- Recharts: ~90 KB (with tree-shaking)
- date-fns: ~2 KB per function (tree-shakeable)
- React Hook Form: ~9 KB
- Zod: ~15 KB
- react-hot-toast: ~2 KB
- **Total: ~120 KB** (minimal impact)

---

## Sources

### Firebase Documentation (HIGH confidence)
- [FCM Token Management Best Practices](https://firebase.google.com/docs/cloud-messaging/manage-tokens) - Official Firebase docs, last updated 2026-01-15 UTC
- [Managing Cloud Messaging Tokens](https://firebase.blog/posts/2023/04/managing-cloud-messaging-tokens/) - Firebase blog
- [Choose a Database: Firestore vs Realtime DB](https://firebase.google.com/docs/database/rtdb-vs-firestore) - Firebase official comparison
- [Firestore Data Model](https://firebase.google.com/docs/firestore/data-model) - Last updated 2026-01-22 UTC

### Next.js + Firebase Integration (HIGH confidence)
- [Implementing Push Notifications with Next.js and FCM](https://dev.to/na1969na/implementing-push-notifications-with-nextjs-and-firebase-cloud-messaging-4n6o)
- [Firebase Admin with Next.js](https://rishi.app/blog/using-firebase-admin-with-next-js/)

### UI Component Libraries (HIGH confidence)
- [shadcn/ui Chart Component](https://ui.shadcn.com/docs/components/chart) - Official shadcn/ui docs
- [shadcn/ui React Hook Form](https://ui.shadcn.com/docs/forms/react-hook-form) - Official form pattern

### Library Comparisons (MEDIUM-HIGH confidence)
- [date-fns vs dayjs comparison](https://www.dhiwise.com/post/date-fns-vs-dayjs-the-battle-of-javascript-date-libraries)
- [Zod with React Hook Form](https://www.contentful.com/blog/react-hook-form-validation-zod/) - Published January 2025

### Testing (MEDIUM confidence)
- [Testing in 2026: Jest & Full Stack Testing](https://www.nucamp.co/blog/testing-in-2026-jest-react-testing-library-and-full-stack-testing-strategies)
- [Testing Service Worker](https://medium.com/ynap-tech/testing-service-worker-2f9ede60bae)

### Testing Tools (MEDIUM confidence)
- [FCM Test Online](https://fcmtest.com/)
- [fcm-push-cli on GitHub](https://github.com/tastydev/fcm-push-cli)

---

**Stack research for:** Production-Grade PWA Push Notifications with FCM
**Researched:** 2026-01-23
**Overall Confidence:** HIGH (Core stack verified with official sources, supporting libraries well-established)
