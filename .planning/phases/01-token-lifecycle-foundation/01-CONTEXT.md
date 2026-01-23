# Phase 1: Token Lifecycle Foundation - Context

**Gathered:** 2026-01-23
**Status:** Ready for planning

<domain>
## Phase Boundary

Fix critical token persistence bug where FCM tokens don't survive browser restarts. Implement complete token lifecycle: registration, refresh (30+ days), cleanup (invalid tokens), and multi-device support (3-5 devices per user). Tokens must auto-recover within 60 seconds. Monitoring dashboards and user preferences are separate phases.

</domain>

<decisions>
## Implementation Decisions

### Token storage strategy
- **Dual persistence**: Store tokens in both IndexedDB (primary) and localStorage (fallback) for maximum reliability
- **Metadata alongside token**: Store token, createdAt, lastUsed, and deviceInfo (browser, OS) to enable cleanup and device identification
- **Claude's Discretion**: Service worker caching strategy and IndexedDB/localStorage sync implementation details

### Token refresh behavior
- **Immediate database updates**: Write refreshed tokens to Firestore and local storage immediately (no batching) to meet 60-second recovery requirement
- **Explicit token revocation**: Call FCM Admin SDK to unregister old token before issuing new one for clean lifecycle management
- **Claude's Discretion**: Timing of refresh checks (proactive vs reactive), retry strategy for failed refreshes, error handling UX

### Invalid token cleanup
- **Hybrid detection**: Real-time detection on notification send errors + daily scheduled validation job
- **External scheduler**: Use cron-job.org to trigger daily cleanup API endpoint (runs at scheduled time)
- **Daily cleanup frequency**: Balances Firebase costs with timely stale token removal
- **Claude's Discretion**: Async vs immediate removal during notification send, batch processing strategy

### Multi-device registration
- **Auto-generated names with rename option**: Initially name devices "Chrome on Windows", user can optionally rename to "Kitchen iPad" later in settings
- **Unlimited devices per user**: No artificial cap, rely on cleanup to prevent bloat
- **Replace on duplicate**: If same browser/OS registers again, replace existing token (don't create duplicate entry)
- **Detailed device metadata**: Track browser + version, OS + version, registration date, last used, screen size, timezone, user agent string for debugging

</decisions>

<specifics>
## Specific Ideas

- Success criteria testing needs to verify: browser restart survival, 60-second auto-removal, 3-device broadcast, token accumulation prevention, 30-day refresh
- Admin dashboard view (Phase 2) should show max 3-5 active tokens per user as health indicator
- Device identification format: auto-generate from UA string, allow user rename in future phase

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 01-token-lifecycle-foundation*
*Context gathered: 2026-01-23*
