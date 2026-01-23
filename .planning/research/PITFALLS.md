# Pitfalls Research - PWA Push Notifications with FCM

**Domain:** PWA Push Notifications (Firebase Cloud Messaging)
**Researched:** 2026-01-23
**Confidence:** HIGH

## Critical Pitfalls

### Pitfall 1: FCM Tokens Not Persisting After Browser Restart

**What goes wrong:**
Tokens are obtained and stored, but after browser close/restart, the token is either lost or becomes stale. Device appears registered in Firebase but notifications don't arrive. This is the EXACT issue the project is currently experiencing.

**Why it happens:**
- Token retrieved from FCM but not stored in durable location (localStorage, IndexedDB)
- Token stored in Firebase but app doesn't check for existing valid token on startup
- Service Worker registration lifecycle not properly managed - SW deregistered on browser close
- No "get token at least once a month" refresh logic (FCM requirement for staleness prevention)
- iOS-specific: FCM tokens change automatically without user action on iOS devices

**How to avoid:**
1. **Startup token check**: On every app load, check if valid token exists BEFORE requesting new one
2. **Monthly refresh**: Implement scheduled token refresh (at least weekly in practice, monthly minimum)
3. **Token timestamp tracking**: Store `createdAt` and `lastRefreshed` timestamps in Firebase
4. **Service Worker persistence**: Ensure SW remains registered across browser sessions
5. **iOS token refresh listener**: Implement aggressive token refresh detection on iOS (check on every app open)

**Warning signs:**
- User reports "notifications worked once, then stopped"
- Firebase Console shows device registered but message delivery fails with "NotRegistered" error
- Multiple token entries per user in Firebase (token accumulation)
- Token age in Firebase > 30 days without `lastUsed` update

**Phase to address:**
**Phase 1: Token Lifecycle Fixes** - This is the foundational bug fix before adding features

---

### Pitfall 2: Service Worker Scope and Registration Timing Issues

**What goes wrong:**
Service Worker fails to register, registers with wrong scope, or registers too late. FCM token acquisition fails or notifications don't display in background. Multiple service workers conflict (PWA + FCM).

**Why it happens:**
- Service Worker file not at root (`/firebase-messaging-sw.js` instead of `/public/firebase-messaging-sw.js`)
- MIME type error: Server returns HTML 404 page instead of JavaScript file
- Next.js/Serwist auto-generated SW conflicts with Firebase Messaging SW
- Registration happens before user interaction (blocked by iOS)
- `skipWaiting()` called incorrectly, overwriting user's notification handlers
- Development mode issues: Turbopack hot reload breaks SW registration

**How to avoid:**
1. **Single unified SW**: Merge Firebase Messaging handlers into Serwist-generated `sw.js`
2. **Root-level placement**: Ensure SW file served from `/sw.js` or `/firebase-messaging-sw.js` at domain root
3. **Correct MIME type**: Verify server returns `Content-Type: application/javascript`
4. **User gesture requirement**: Only call `getToken()` AFTER user clicks "Enable Notifications"
5. **Registration verification**: Check `navigator.serviceWorker.ready` BEFORE calling `getToken()`
6. **Dev mode handling**: Gracefully handle SW failures in development (current code already does this at line 211-214)

**Warning signs:**
- Console error: "Failed to register ServiceWorker: A bad HTTP response code (404)"
- Console error: "The script has an unsupported MIME type ('text/html')"
- Multiple SW registrations in DevTools → Application → Service Workers
- Notifications work in production but not in development
- User granted permission but token acquisition fails

**Phase to address:**
**Phase 1: Token Lifecycle Fixes** - Fix SW registration before token persistence
**Phase 2: Production Infrastructure** - Merge SW files for production reliability

---

### Pitfall 3: iOS PWA Permission State Lies

**What goes wrong:**
`Notification.permission` returns incorrect state after user manually changes settings in iOS System Settings. App shows "notifications enabled" but user disabled them in Settings, or vice versa. Silent failures: notifications aren't sent but no error occurs.

**Why it happens:**
- iOS doesn't update `Notification.permission` when user changes settings outside the app
- `getNotificationSettings()` doesn't return correct current state on iOS PWA
- Permission state persists in app memory but resets after PWA close (iOS bug)
- App asks for permission repeatedly even if already granted (permission state reset after background)

**How to avoid:**
1. **Don't trust permission state alone**: Implement actual delivery verification
2. **Test send on settings page**: Add "Send Test Notification" button to verify delivery
3. **Monitor delivery failures**: Track FCM API responses for "NotRegistered" and "InvalidRegistration" errors
4. **Permission re-check on focus**: Check permission state when app returns from background
5. **Fail-safe monitoring**: Use Phase 3 monitoring to detect silent failures (sent but not delivered)
6. **User guidance**: Add troubleshooting UI: "Not receiving notifications? Check Settings → Notifications → [App Name]"

**Warning signs:**
- User reports "enabled notifications but not receiving them"
- `Notification.permission === 'granted'` but test notification fails
- iOS users only: Android users unaffected
- Permission prompt appears repeatedly despite being granted

**Phase to address:**
**Phase 2: Production Infrastructure** - Add delivery monitoring and test notification feature
**Phase 3: User Features** - Build troubleshooting UI and delivery verification

---

### Pitfall 4: Token Accumulation Without Cleanup

**What goes wrong:**
Firebase accumulates hundreds of stale tokens per user (every browser restart creates new token). Sending notifications iterates over all tokens, wasting FCM quota and causing performance issues. Some tokens fail (NotRegistered), but app doesn't remove them.

**Why it happens:**
- No cleanup logic for stale tokens (your code has this commented out at line 483-510)
- App doesn't detect and remove tokens that return "NotRegistered" error
- No expiration tracking: tokens older than 270 days (Android) or indefinite (iOS/Web) never removed
- Multiple devices per user without device identification (can't distinguish iPhone vs iPad vs Desktop)

**How to avoid:**
1. **Server-side cleanup API**: Create `/api/notifications/cleanup` (uses Admin SDK with write access)
2. **Remove failed tokens**: When FCM returns NotRegistered/InvalidRegistration, delete that token immediately
3. **Age-based cleanup**: Remove tokens with `lastUsed > 90 days` (more aggressive than FCM's 270 days)
4. **Device fingerprinting**: Store `userAgent` + `platform` to identify unique devices (already in code line 290-292)
5. **Startup deduplication**: Check if token already exists for this device before creating new entry
6. **Periodic cleanup job**: Run cleanup on cron (weekly) or on user settings page load

**Warning signs:**
- Firebase shows 10+ tokens per user
- Notification send time increases over time (iterating stale tokens)
- FCM Console shows high percentage of "NotRegistered" errors
- Token storage costs increasing unnecessarily

**Phase to address:**
**Phase 1: Token Lifecycle Fixes** - Implement cleanup API and deduplication
**Phase 2: Production Infrastructure** - Add automated cleanup job

---

### Pitfall 5: No Delivery Monitoring = Silent Failures

**What goes wrong:**
Notifications appear "sent" in server logs, but user never receives them. No way to detect delivery failures. False positive monitoring: FCM "Sends" metric counts enqueued messages, not delivered/displayed ones.

**Why it happens:**
- Only tracking FCM API `send()` success, not actual delivery
- FCM "Sends" metric != "Delivered" metric != "Impressions" (displayed to user)
- iOS proxied notifications: Analytics only reported if app opens (delayed/missing metrics)
- No correlation between sent message ID and delivery confirmation
- Foreground vs background delivery handled differently (background = service worker, foreground = `onMessage`)

**How to avoid:**
1. **Track all three metrics**:
   - **Sent**: FCM API accepted message (easy to track)
   - **Delivered**: Device received message (requires client-side reporting)
   - **Displayed**: Notification shown to user (requires service worker tracking)
2. **Client-side delivery reporting**: In SW, send delivery confirmation to `/api/notifications/delivered`
3. **Store message IDs**: Save FCM message ID with timestamp for correlation
4. **Monitor failure patterns**: Track which token/device has consistent delivery failures
5. **User-visible status**: Show "Last notification received: 2 hours ago" in settings
6. **Test notification feature**: Let user trigger test send and confirm receipt

**Warning signs:**
- User reports "never received notification" but server logs show "sent successfully"
- FCM Console: High "Sends" count but low "Impressions" count
- No way to debug why specific user isn't receiving notifications
- Support tickets: "Notifications don't work" (no data to diagnose)

**Phase to address:**
**Phase 2: Production Infrastructure** - Build delivery monitoring and failure detection
**Phase 3: User Features** - Add notification history and delivery status UI

---

### Pitfall 6: Ignoring Notification Preferences = Notification Fatigue

**What goes wrong:**
User receives too many notifications (every INFO-level stove event), gets annoyed, disables ALL notifications at OS level. App loses critical error notification capability because user was spammed with low-value alerts.

**Why it happens:**
- No granular preference controls (all-or-nothing)
- Default preferences too noisy (INFO + WARNING + ERROR + CRITICAL all enabled)
- No rate limiting (10 errors in 1 minute = 10 notifications)
- Testing in production: Devs trigger test notifications to real users
- Preference changes require app restart to take effect (no real-time updates)

**How to avoid:**
1. **Granular defaults**: Start conservative (only CRITICAL + ERROR enabled by default)
2. **Category master toggles**: User can disable entire categories (errors, scheduler, maintenance)
3. **Severity filtering**: Within errors, let user choose which severities to receive
4. **Rate limiting**: Max 1 notification per category per 5 minutes
5. **Preference precheck**: ALWAYS check preferences before sending (current code does this via `shouldSendErrorNotification`)
6. **Fail-safe behavior**: If preference check fails, SEND anyway (critical notifications can't be lost)
7. **Testing isolation**: Use separate test user ID or test-only notification type

**Warning signs:**
- User disabled notifications at OS level
- High notification volume in Firebase Console (>100/day per user)
- Short time between "enabled notifications" and "disabled notifications" (minutes/hours)
- User complaints: "Too many alerts"

**Phase to address:**
**Phase 2: Production Infrastructure** - Add rate limiting to notification triggers
**Phase 3: User Features** - Enhance preference UI with rate limiting info

---

### Pitfall 7: Service Worker Update Conflicts

**What goes wrong:**
New service worker version deployed, but old SW keeps running. Users stuck on old notification handlers. Notifications stop working after deployment. Multiple SW versions fight for control.

**Why it happens:**
- `skipWaiting()` not called: New SW waits for all tabs to close before activating
- User never closes all tabs: New SW never takes over (Progressive Web Apps often stay open for days)
- Service worker updated during active notification listening: `onMessage` handler breaks
- Development "Update on reload" enabled, masking production update issues
- Service worker caching itself: Old SW served from cache, new version never downloads

**How to avoid:**
1. **Immediate activation**: Call `skipWaiting()` in SW `install` event (with caution)
2. **Client reload prompt**: Detect new SW waiting, prompt user to reload
3. **Version tracking**: Add SW version number, log to console on activation
4. **Update check on focus**: Check for updates when app gains focus (every hour)
5. **Force update API**: Admin endpoint to trigger client-side update check
6. **Notification handler versioning**: Design handlers to be backward compatible across SW updates

**Warning signs:**
- DevTools shows "waiting to activate" SW that never activates
- Notification handlers change in new deployment but users don't see changes
- Console error after deployment: "notification handler undefined"
- Users on different SW versions receive different notification behaviors

**Phase to address:**
**Phase 2: Production Infrastructure** - Implement SW update detection and user prompts
**Phase 4: Testing Infrastructure** - Add SW version tracking and update testing

---

### Pitfall 8: Multi-Device Synchronization Race Conditions

**What goes wrong:**
User has iPhone, iPad, and Desktop browser all registered. Disables notifications on iPhone Settings page, but iPad and Desktop not updated. Sends notification to all 3 devices, iPhone silently fails, user confused why only 2 devices received it. Token refresh on one device doesn't propagate to others.

**Why it happens:**
- Preferences stored per-user, not per-device (correct) but no device status tracking
- No "token validity" field: Can't mark specific token as invalid without deleting it
- iOS permission changes don't propagate to Firebase
- Race condition: Two devices call `getFCMToken()` simultaneously, one overwrites the other
- No device identification: Can't tell which token belongs to which device

**How to avoid:**
1. **Device identification**: Store `deviceId` (hash of userAgent) with each token
2. **Token status field**: Add `status: 'active' | 'invalid' | 'revoked'` to token records
3. **Failed token marking**: When send fails, mark token as invalid (don't delete immediately)
4. **Periodic revalidation**: On app startup, verify token still valid with FCM
5. **Device list UI**: Show user "Registered devices" with last-used timestamps
6. **Graceful multi-send**: If 1/3 devices fails, still succeed overall (don't throw error)
7. **Atomic token updates**: Use Firebase transaction when updating token fields

**Warning signs:**
- Inconsistent delivery: Sometimes works, sometimes doesn't (depends on which device)
- User reports "works on phone but not tablet"
- Firebase shows duplicate tokens with slightly different timestamps
- Race condition errors in Firebase logs during token registration

**Phase to address:**
**Phase 1: Token Lifecycle Fixes** - Add device identification and status field
**Phase 3: User Features** - Build device management UI

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Store VAPID key in client-side code (hardcoded) | Skip env var configuration | Security vulnerability if repo becomes public | Never (already avoided - using env vars) |
| Skip token refresh logic | Faster initial implementation | Tokens become stale after 30 days, notifications fail | Never - implement from day 1 |
| Use polling instead of FCM delivery webhooks | Simpler implementation (no webhook endpoint needed) | High latency, can't detect delivery failures | Early MVP only, replace in Phase 2 |
| Store all notification history in client-side | No backend storage needed | Doesn't sync across devices, lost on cache clear | Testing/dev only, needs server storage in production |
| Disable service worker in development | Faster dev iteration (no SW caching) | Production bugs not caught in dev | Acceptable but test in production-like staging regularly |
| Send all notifications with priority: "high" | Ensures delivery on Android doze mode | Drains battery, FCM may throttle your app | Never - use high only for critical notifications |
| Skip preferences implementation | Faster MVP launch | User notification fatigue leads to OS-level disable | Acceptable for MVP with <10 users, required for Phase 3 |

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Firebase Admin SDK | Using client-side SDK to send notifications | Use Admin SDK server-side only (API routes) |
| Next.js + Serwist | Two separate service workers (Serwist + Firebase) | Merge Firebase handlers into Serwist-generated SW |
| iOS Safari PWA | Requesting permission before PWA installed | Check `isPWA()` before calling `requestPermission()` |
| Netatmo/Scheduler Integration | Triggering notification directly in integration code | Always use centralized `triggerNotification()` system |
| Firebase Realtime DB | Using `set()` to update token (overwrites other fields) | Use `update()` with `filterUndefined()` (project pattern) |
| FCM Token Validation | Assuming token valid forever | Implement token refresh and expiration checking |
| Service Worker Registration | Calling `register()` multiple times on each page load | Check `navigator.serviceWorker.getRegistration()` first |
| VAPID Key Timing | Loading env var at module level (SSR issues) | Load env var in function scope (current code line 24-26) |

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Sending to all tokens without filtering stale ones | Increasing send time, FCM quota waste | Implement token cleanup and validity checks | >50 tokens per user (accumulation over months) |
| No pagination on notification history | Slow settings page load | Paginate history, limit to 50 most recent | >100 notifications sent per user |
| Foreground message handler creates duplicate notifications | User sees 2 notifications for same event | Check if notification already displayed by SW | All users on iOS with app open (foreground) |
| Service worker bundle too large | Slow SW installation, timeouts | Code-split Firebase SDK, lazy load messaging module | SW bundle >500KB |
| Synchronous token refresh on every app load | 2-3 second delay on app startup | Check token age, only refresh if >7 days old | All users, every app open |
| Loading full notification preferences on every send | Database read overhead | Cache preferences in memory for 5 minutes | >1000 notifications/day |
| No batching for multi-device sends | Multiple FCM API calls per notification | Use FCM multicast (send to multiple tokens in 1 call) | User has >3 devices |

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| VAPID key in git repository | Anyone can send notifications as your app | Use environment variables, never commit `.env.local` |
| No authentication on `/api/notifications/send` | Anyone can spam your users | Require `ADMIN_SECRET` header or session verification |
| Client-side user ID spoofing | User A can send notification to User B | Always get `userId` from session token server-side |
| Storing FCM Admin private key in client bundle | Complete Firebase takeover | Only use Admin SDK in API routes (server-side) |
| No rate limiting on notification endpoints | DDoS via notification spam | Implement rate limiting (max 10 notifications/minute per user) |
| Exposing all user tokens in API response | Privacy leak, token harvesting | Only return token count, not actual token strings |
| Notification content includes sensitive data | Data leak via notification history/logs | Keep notification content generic, link to in-app detail page |
| No input validation on notification data | XSS via notification title/body | Sanitize all notification content server-side |

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Permission prompt on app launch (before user interaction) | Immediate annoyance, likely denial | Wait for user to navigate to settings page and click "Enable" |
| No explanation before permission prompt | User doesn't understand value, denies permission | Show value proposition screen first: "Get alerts for critical errors" |
| Generic notification titles | User can't distinguish notification importance | Use emoji + severity prefix: "🚨 CRITICAL: Stove Error E01" |
| Notifications without actionable next step | User frustrated, doesn't know what to do | Include deep link to relevant page (errors page, scheduler page) |
| No way to test if notifications work | User unsure if setup successful | Add "Send Test Notification" button on settings page |
| Permission denied but no recovery guidance | User stuck, thinks feature broken | Show help text: "Enable in Settings → Notifications → [App Name]" |
| Notification arrives but app page not updated | Stale data confusion | Trigger data refresh when notification clicked |
| No notification sound/vibration on critical errors | User misses critical alert | Set `requireInteraction: true` for critical notifications |
| Notification history not accessible | User can't review past alerts | Build notification history page (Phase 3 feature) |
| Disabling category disables ALL subcategories | Lost critical alerts (e.g., disable errors, lose CRITICAL) | Keep CRITICAL always enabled regardless of category toggle |

## "Looks Done But Isn't" Checklist

- [ ] **Token Registration:** Often missing token refresh logic - verify monthly refresh implemented
- [ ] **Service Worker:** Often missing foreground message handling - verify `onMessage` listener active
- [ ] **iOS Support:** Often missing PWA install check - verify `isPWA()` guard before requesting permission
- [ ] **Delivery Monitoring:** Often missing actual delivery confirmation - verify not just relying on FCM send success
- [ ] **Token Cleanup:** Often missing stale token removal - verify cleanup API exists and runs
- [ ] **Multi-Device:** Often missing device identification - verify can distinguish iPhone from iPad from Desktop
- [ ] **Error Handling:** Often missing "permission denied" recovery UI - verify user guidance displayed
- [ ] **Preferences:** Often missing fail-safe behavior - verify critical notifications sent even if preference check fails
- [ ] **Testing:** Often missing test notification feature - verify users can self-verify setup
- [ ] **Rate Limiting:** Often missing notification throttling - verify max 1 notification per category per 5 minutes
- [ ] **SW Updates:** Often missing update detection - verify new SW versions activate without requiring manual browser restart
- [ ] **Security:** Often missing authentication on send API - verify ADMIN_SECRET or session required

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Token Accumulation | LOW | Run cleanup API, delete tokens with `lastUsed > 90 days` |
| Service Worker Conflict | MEDIUM | Merge SW files, redeploy, users must hard refresh (Cmd+Shift+R) |
| iOS Permission State Lies | LOW | Add test notification button, user can verify delivery themselves |
| No Delivery Monitoring | HIGH | Requires new API endpoint + SW message handler + Firebase schema changes |
| Permission Denied (user-level) | MEDIUM | User must manually enable in iOS Settings → Notifications → [App] |
| Stale Token Not Refreshed | LOW | Force token refresh on next app load (delete old token, get new one) |
| Service Worker Not Updating | LOW | Add `skipWaiting()` and reload prompt, deploy update |
| Multi-Device Race Condition | MEDIUM | Add device ID field to existing tokens, migrate data |
| Notification Fatigue | HIGH | Cannot recover - user disabled at OS level, must re-engage with value prop |
| Token Persistence Bug | MEDIUM | Implement startup token check, existing users must re-enable notifications |

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| FCM Tokens Not Persisting | Phase 1: Token Lifecycle Fixes | Token exists in Firebase after browser restart |
| Service Worker Registration Issues | Phase 1: Token Lifecycle Fixes | DevTools shows SW active, no registration errors in console |
| iOS PWA Permission State Lies | Phase 2: Production Infrastructure | Test notification button works, delivery monitoring detects failures |
| Token Accumulation Without Cleanup | Phase 1: Token Lifecycle Fixes | Max 3-5 tokens per user (1 per device type) |
| No Delivery Monitoring | Phase 2: Production Infrastructure | Settings page shows "Last notification received: X minutes ago" |
| Notification Preferences Ignored | Phase 3: User Features | Disable WARNING, send test, confirm not received |
| Service Worker Update Conflicts | Phase 2: Production Infrastructure | Deploy new version, users see update prompt within 1 hour |
| Multi-Device Race Conditions | Phase 1: Token Lifecycle Fixes | Register 2 devices, both receive notification, Firebase shows 2 distinct tokens |

## Sources

### Official Documentation (HIGH Confidence)
- [Best practices for FCM registration token management | Firebase](https://firebase.google.com/docs/cloud-messaging/manage-tokens)
- [Understanding message delivery | Firebase](https://firebase.google.com/docs/cloud-messaging/understand-delivery)
- [Sending web push notifications | Apple Developer](https://developer.apple.com/documentation/usernotifications/sending-web-push-notifications-in-web-apps-and-browsers)
- [Receive messages in Web apps | Firebase](https://firebase.google.com/docs/cloud-messaging/web/receive-messages)

### Technical Issues & Discussions (MEDIUM Confidence)
- [FCM Push notifications stop working on PWA | Apple Developer Forums](https://developer.apple.com/forums/thread/745759)
- [Firebase (FCM) Service Worker Registration Issues | GitHub firebase/flutterfire #12586](https://github.com/firebase/flutterfire/issues/12586)
- [PWA Notification Permission Not Persistent on iOS | GitHub odoo/odoo #165822](https://github.com/odoo/odoo/issues/165822)
- [getNotificationSettings() doesn't return correct settings in PWA | GitHub firebase/flutterfire #11369](https://github.com/firebase/flutterfire/issues/11369)

### Community Best Practices (MEDIUM Confidence)
- [Managing Cloud Messaging Tokens | Firebase Blog](https://firebase.blog/posts/2023/04/managing-cloud-messaging-tokens/)
- [Understanding FCM Message Delivery on Android | Firebase Blog](https://firebase.blog/posts/2024/07/understand-fcm-delivery-rates/)
- [PWA on iOS: Limitations and Safari Support | MagicBell](https://www.magicbell.com/blog/pwa-ios-limitations-safari-support-complete-guide)
- [Handling Service Worker Updates | What Web Can Do](https://whatwebcando.today/articles/handling-service-worker-updates/)

### Known Patterns from Project Code
- Current implementation (lines 24-26): VAPID key loaded in function scope (prevents SSR issues)
- Current implementation (lines 211-214): Dev mode graceful SW failure handling
- Current implementation (line 290-292): Device fingerprinting with userAgent + platform
- Known issue: Token cleanup commented out (lines 483-510) - requires Admin SDK migration

---

**Pitfalls research for:** PWA Push Notifications with FCM
**Researched:** 2026-01-23
**Next step:** Use these pitfalls to inform roadmap phase structure and success criteria
