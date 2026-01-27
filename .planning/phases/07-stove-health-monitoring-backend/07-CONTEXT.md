# Phase 7: Stove Health Monitoring Backend - Context

**Gathered:** 2026-01-27
**Status:** Ready for planning

<domain>
## Phase Boundary

Automated stove health monitoring system that continuously checks stove connection status via cron job, detects unexpected states by comparing against both stove schedule and Netatmo heating demand, and logs all monitoring events to Firestore. This phase establishes the monitoring infrastructure and detection logic. UI dashboard and alerts are handled in Phase 10.

</domain>

<decisions>
## Implementation Decisions

### Check frequency & timing
- Fixed 1-minute interval for all users (not user-configurable)
- 24/7 monitoring - checks run continuously, even during night hours
- All users checked in single cron execution (no batching)
- Individual user check failures: Claude's discretion on retry strategy (skip vs retry)

### State detection logic
- Use both signals for detection: stove's own schedule + Netatmo heating demand
- Distinguish between connection failures (stove offline) vs state mismatches (online but wrong state)
- Flag only hard failures (unreachable stove or critically wrong state)
- Intermediate state handling (starting/cooling): Claude's discretion on transition tolerance

### Dead man's switch behavior
- Trigger threshold: 10+ minutes with no cron execution
- Action: Alert admin + attempt one fallback check to confirm system is truly down
- Distinguish between "cron service not running" vs "cron running but all checks failing"
- Auto-resume monitoring when cron starts working again (no manual intervention required)
- Alert routing: Claude's discretion (admin only vs admin + affected users)

### Event logging detail
- Log every health check (not just changes) - complete audit trail
- Log level: Moderate detail - timestamp, userId, stove status, current state, expected state, Netatmo demand, key metrics
- Combined log structure: Single Firestore entry per cron run with all individual checks as sub-documents
- Retention: 7 days (matches Phase 10 dashboard requirement for "past 7 days of cron execution logs")

### Claude's Discretion
- Retry strategy for individual user check failures
- Exact transition state tolerance (how long to wait before flagging "stuck in starting")
- Dead man's switch alert routing (who gets notified)
- Firestore collection structure and indexing strategy
- Error categorization and severity levels

</decisions>

<specifics>
## Specific Ideas

- Follow existing v1.0 patterns: HMAC-secured cron webhook (like Phase 5)
- Reuse existing netatmoTokenHelper.js for API calls and token management
- Similar logging approach to Phase 2 delivery status tracking
- Dead man's switch alert should reuse existing push notification infrastructure

</specifics>

<deferred>
## Deferred Ideas

None - discussion stayed within phase scope

</deferred>

---

*Phase: 07-stove-health-monitoring-backend*
*Context gathered: 2026-01-27*
