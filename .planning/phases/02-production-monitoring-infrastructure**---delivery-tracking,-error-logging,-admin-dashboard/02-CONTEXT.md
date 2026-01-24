# Phase 2: Production Monitoring Infrastructure - Context

**Gathered:** 2026-01-24
**Status:** Ready for planning

<domain>
## Phase Boundary

Complete visibility into notification delivery for administrators. Track sent/delivered/failed notifications with error logging, provide admin dashboard with delivery metrics and trends, enable test notification sending. User-facing features (preferences, history, device management) are separate phases.

</domain>

<decisions>
## Implementation Decisions

### Dashboard Layout & Visualization
- **Primary metric:** Total notifications sent today (big number prominently displayed)
- **Chart type:** Claude's discretion for 7-day delivery trends (optimize for monitoring delivery health)
- **Update mechanism:** Manual refresh button only (no auto-polling - simpler, less server load)
- **Location:** Claude's discretion (analyze app structure - likely /debug or /admin route)

### Error Logging & Diagnostics
- **Most critical info:** Claude's discretion (prioritize most actionable diagnostic data from FCM errors, device info, notification content)
- **Filtering:** Multiple filters available - by error type (FCM error codes), by time period, and by device/user (flexible investigation)
- **Retention policy:** Keep last 30 days only (auto-delete older logs to prevent unbounded growth)
- **Error actions:** View device details button (jump to device info page with token, registration date, browser)

### Test Notification Workflow
- **Device selection:** Both single device dropdown AND broadcast to all devices option
- **Message input:** Both predefined templates (Error Alert, Success, Maintenance) AND custom message input
- **Feedback:** Full trace showing notification journey (sent → FCM → delivered with detailed logging for debugging)
- **Logging:** Same log as real notifications with 'test' tag (filterable, keeps all data together)

### Alerting & Thresholds
- **Warning threshold:** Below 90% delivery rate (strict monitoring - catch issues early)
- **Notification method:** Claude's discretion (pick most reliable - consider push, dashboard banner, or email)
- **Rate limiting:** Claude's discretion (balance awareness vs alert fatigue)
- **Calculation window:** Last hour rolling window (recent performance - catches issues quickly)

### Claude's Discretion
- Best chart type for 7-day trends (Recharts library available)
- Dashboard route location based on existing app structure
- Prioritization of error log fields (FCM error, device, notification content)
- Alert delivery method (most reliable for monitoring failures)
- Alert rate limiting strategy (prevent fatigue while maintaining awareness)

</decisions>

<specifics>
## Specific Ideas

- Dashboard should show delivery rate with target indicator (85%+ = green per success criteria)
- Use Recharts library for visualizations (already available in project)
- FCM error codes to capture: NotRegistered, InvalidRegistration, MismatchedCredential, etc.
- Test templates: "Error Alert", "Scheduler Success", "Maintenance Reminder" (from Phase 5 success criteria)
- Device dropdown should show friendly names like "Kitchen iPad", "Federico's Phone"
- Delivery confirmation timing example from success criteria: "within 5 seconds"

</specifics>

<deferred>
## Deferred Ideas

None - discussion stayed within phase scope (monitoring infrastructure only, no user features)

</deferred>

---

*Phase: 02-production-monitoring-infrastructure*
*Context gathered: 2026-01-24*
