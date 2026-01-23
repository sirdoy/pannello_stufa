---
phase: 01-token-lifecycle-foundation
plan: 05
subsystem: notifications
tags: [fcm, token-cleanup, invalid-tokens, cron, firebase-admin]

requires:
  - 01-03-token-registration-enhancement

provides:
  - invalid-token-detection
  - real-time-token-removal
  - scheduled-cleanup-endpoint
  - stale-token-cleanup

affects:
  - 01-06-token-refresh-automation

tech-stack:
  added: []
  patterns:
    - "Invalid token detection on FCM send errors"
    - "Asynchronous token cleanup (non-blocking)"
    - "Batch database updates for efficiency"
    - "Bearer token authentication for cron endpoints"
    - "90-day staleness threshold"

key-files:
  created:
    - app/api/notifications/cleanup/route.js
  modified:
    - lib/firebaseAdmin.js
    - .env.example

decisions:
  - decision: "Remove invalid tokens asynchronously on send errors"
    rationale: "Don't block notification response while cleaning up database"
    impact: "Faster response time, eventual consistency for cleanup"

  - decision: "Use 90-day threshold for stale token cleanup"
    rationale: "Balance between removing truly stale tokens and keeping valid but infrequently used devices"
    impact: "Prevents unbounded token growth while preserving occasionally-used devices"

  - decision: "Batch database updates for cleanup endpoint"
    rationale: "Single ref().update() is more efficient than multiple remove() calls"
    impact: "Faster cleanup, reduced database operations"

metrics:
  duration: 10.0
  tasks: 3
  commits: 3
  files_modified: 3
  lines_added: 235
  lines_removed: 18
  completed: 2026-01-23
---

# Phase 1 Plan 05: Invalid Token Cleanup Summary

**One-liner:** Real-time invalid token detection on FCM errors with scheduled cleanup of 90+ day stale tokens via cron endpoint.

## What Was Built

Implemented two-tier token cleanup system:
1. **Real-time cleanup**: Invalid tokens (UNREGISTERED, INVALID_ARGUMENT errors) removed immediately when FCM send fails
2. **Scheduled cleanup**: Cron endpoint removes tokens inactive >90 days

## Tasks Completed

| # | Task | Commit | Status |
|---|------|--------|--------|
| 1 | Update sendPushNotification with invalid token detection | fb2bf71 | ✅ Complete |
| 2 | Create cleanup API endpoint | 4728e06 | ✅ Complete |
| 3 | Document CRON_SECRET environment variable | 4876361 | ✅ Complete |

## Key Changes

### lib/firebaseAdmin.js

**Added invalid token detection system:**

1. **INVALID_TOKEN_ERRORS constant** - Three FCM error codes that indicate permanently invalid tokens:
   - `messaging/registration-token-not-registered`
   - `messaging/invalid-argument`
   - `messaging/invalid-registration-token`

2. **removeInvalidToken helper** - Searches all users and removes matching token:
   - Scans entire `users/{userId}/fcmTokens` tree
   - Uses batch update for efficiency
   - Logs removal for monitoring

3. **Enhanced sendPushNotification** - Detects and removes invalid tokens:
   - Single token: Catches error, removes if invalid code
   - Multi-token: Checks each response, collects invalid tokens
   - Removes tokens asynchronously (doesn't block response)
   - Returns `invalidTokensRemoved` count

### app/api/notifications/cleanup/route.js (NEW)

**Created scheduled cleanup endpoint:**

- **POST handler** - Protected by CRON_SECRET bearer token:
  - Scans all user tokens
  - Uses `lastUsed` or `createdAt` timestamp
  - Removes tokens >90 days old
  - Removes tokens without timestamps
  - Batch update for efficiency
  - Returns scanned/removed counts

- **GET handler** - Health check / documentation endpoint

**Authentication:**
```bash
curl -X POST https://your-app.com/api/notifications/cleanup \
  -H "Authorization: Bearer $CRON_SECRET"
```

### .env.example

Updated CRON_SECRET documentation:
- Added reference to cleanup endpoint
- Added generation command

## Technical Decisions

### 1. Asynchronous Token Removal

**Decision:** Remove invalid tokens asynchronously (don't await)

**Why:**
- Notification send should fail fast
- Cleanup is non-critical side effect
- User doesn't need to wait for database update

**Implementation:**
```javascript
// Don't block response
removeInvalidToken(token).catch(console.error);
```

### 2. 90-Day Staleness Threshold

**Decision:** Consider tokens >90 days inactive as stale

**Why:**
- Users may have devices they use seasonally (vacation home)
- 90 days balances cleanup vs. preserving valid devices
- Aligns with Firebase recommendations

**Future consideration:** Make configurable via env var if needed

### 3. Batch Database Updates

**Decision:** Collect all deletions, apply in single update()

**Why:**
- Single database operation vs. many remove() calls
- Atomic update (all or nothing)
- Better performance at scale

**Trade-off:** Memory usage grows with token count (acceptable for expected scale)

## Verification Results

✅ **Must-haves satisfied:**
1. Invalid tokens removed on UNREGISTERED error ✓
2. Cleanup endpoint exists and removes 90+ day tokens ✓
3. Endpoint protected with bearer token auth ✓
4. Stale token count returned in response ✓

✅ **Artifacts verified:**
1. `app/api/notifications/cleanup/route.js` created (140 lines) ✓
2. `lib/firebaseAdmin.js` contains "messaging/registration-token-not-registered" ✓

✅ **Key links verified:**
1. Cleanup route imports `getAdminDatabase` ✓
2. firebaseAdmin.js calls `removeInvalidToken` on error ✓

## Deviations from Plan

**None** - Plan executed exactly as written.

## Integration Notes

### For cron-job.org Setup

1. **Generate CRON_SECRET:**
   ```bash
   openssl rand -hex 32
   ```

2. **Add to environment variables:**
   - Local: `.env.local`
   - Production: Vercel environment variables

3. **Configure cron job:**
   - URL: `https://your-app.com/api/notifications/cleanup`
   - Method: POST
   - Headers: `Authorization: Bearer YOUR_CRON_SECRET`
   - Schedule: Daily (recommended: 3am UTC)

### Testing Cleanup Endpoint

**Health check:**
```bash
curl https://your-app.com/api/notifications/cleanup
```

**Run cleanup:**
```bash
curl -X POST https://your-app.com/api/notifications/cleanup \
  -H "Authorization: Bearer $CRON_SECRET"
```

**Expected response:**
```json
{
  "success": true,
  "removed": 5,
  "scanned": 100,
  "timestamp": "2026-01-23T19:15:00Z"
}
```

## Next Phase Readiness

**Ready for 01-06 (Token Refresh Automation):**
- ✅ Invalid token detection working
- ✅ Cleanup infrastructure in place
- ✅ Database stays clean automatically

**Blockers/Concerns:** None

**Phase 1 Progress:** 5 of 6 plans complete (~83%)

## Performance Impact

**Real-time cleanup:**
- Near-zero overhead (async operation)
- No impact on notification send latency
- Error cases cleaned up automatically

**Scheduled cleanup:**
- Runs daily during low-traffic hours
- O(n) where n = total tokens across all users
- Expected runtime: <5 seconds for 1000 tokens

**Database benefits:**
- Prevents unbounded token growth
- Improves query performance (fewer records)
- Reduces FCM quota waste

## Lessons Learned

1. **Error codes matter** - FCM has specific codes for different failure types, important to distinguish transient vs. permanent failures

2. **Batch updates scale better** - Single update() with many paths is significantly faster than many remove() calls

3. **Async cleanup is sufficient** - Token removal is not time-sensitive, async approach keeps response times fast

## Files Modified

```
app/api/notifications/cleanup/route.js   +140 (new file)
lib/firebaseAdmin.js                     +92 -17
.env.example                             +2 -1
```

**Total:** 3 files, 235 additions, 18 deletions

---

**Execution time:** 10.0 minutes
**Commits:** fb2bf71, 4728e06, 4876361
**Next:** 01-06 Token Refresh Automation
