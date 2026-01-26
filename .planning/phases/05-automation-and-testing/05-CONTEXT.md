# Phase 5: Automation & Testing - Context

**Gathered:** 2026-01-26
**Status:** Ready for planning

<domain>
## Phase Boundary

Zero-touch token hygiene with automated cleanup and comprehensive E2E testing infrastructure. Automated weekly cleanup removes stale tokens without manual intervention. E2E tests verify critical flows (token persistence, service worker lifecycle, notification delivery, preference filtering) across multiple browsers. CI/CD integration blocks merges on test failures. Admin panel enhanced with testing templates and capabilities.

</domain>

<decisions>
## Implementation Decisions

### Cron Cleanup Automation
- Platform: **cron-job.org** (external cron service)
- Failure handling: **Email alert** to admin on cleanup failure
- Execution schedule: Claude's discretion (weekly recommended per success criteria)
- Cleanup scope: Claude's discretion (tokens + orphaned devices relationship)

### E2E Test Coverage
- Test flows (all selected):
  - Token persistence (browser restart test per success criteria #2)
  - Service worker lifecycle (registration, updates, message handling)
  - Notification delivery end-to-end (API → FCM → browser)
  - User preference filtering (DND, rate limits, type toggles)
- Browser matrix: **Chromium + Firefox + WebKit** (comprehensive PWA testing)
- Test data strategy: **Test users in production Firebase** (e.g., test@example.com with cleanup)
- Test environment: Claude's discretion (production vs preview vs localhost tradeoffs)

### CI/CD Pipeline Integration
- Test execution trigger: **On every PR** (per success criteria #4)
- Failure behavior: **Block merge** (strict quality gate)
- Execution time budget: **5 minutes max** (requires parallelization strategy)
- Test result reporting: **GitHub PR comment** (summary with pass/fail)

### Admin Testing Improvements
- Template dropdown design: Claude's discretion (fixed 3 vs customizable)
- Test feedback display: Claude's discretion (leverage Phase 2 delivery tracking)
- Test notification history: **Full test history** (log all test sends like production notifications)
- Additional testing capabilities:
  - **Priority level selection** (test CRITICAL, HIGH, NORMAL, LOW handling)
  - **Bulk device testing** (broadcast to all devices at once)
  - **Scheduled test sends** (future-scheduled notifications for DND testing)

### Claude's Discretion
- Cron execution frequency (weekly recommended for 90-day threshold)
- Cron cleanup scope (tokens only vs tokens + orphaned devices)
- E2E test environment selection (balance realism vs resource usage)
- Template dropdown UX (simplicity vs flexibility)
- Test feedback detail level (leverage existing Phase 2 infrastructure)
- Playwright parallelization strategy to meet 5-minute budget
- Test user cleanup strategy

</decisions>

<specifics>
## Specific Ideas

- cron-job.org chosen over Vercel Cron or Firebase Scheduled Functions
- 5-minute test budget is aggressive for 3 browsers - requires parallel execution
- Full test history means test notifications visible in Phase 4 notification history UI
- Priority/bulk/scheduled testing capabilities extend beyond basic success criteria
- Email alerts for cron failures assume email delivery setup exists or will be configured

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 05-automation-and-testing*
*Context gathered: 2026-01-26*
