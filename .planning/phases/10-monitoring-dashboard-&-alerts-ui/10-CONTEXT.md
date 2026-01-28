# Phase 10: Monitoring Dashboard & Alerts UI - Context

**Gathered:** 2026-01-28
**Status:** Ready for planning

<domain>
## Phase Boundary

Dashboard for visualizing stove health monitoring status with real-time indicators and push notification system for critical alerts. Displays connection status, cron health (dead man's switch), and 7-day event history. Users can view monitoring events and receive push notifications for critical health issues.

</domain>

<decisions>
## Implementation Decisions

### Dashboard layout & status display
- New dedicated `/monitoring` page (separate from /thermostat)
- Single-column timeline view (unified chronological flow, not card-based)
- Top section (above fold) shows:
  - Current stove connection status
  - Dead man's switch status
  - Latest monitoring event
  - Quick action buttons (manual health check, settings)
- Dead man's switch displays detailed panel:
  - Missed runs count (how many consecutive failures)
  - Next expected run timestamp
  - Trend indicator (improving/degrading)

### History visualization & filtering
- Chronological event stream (newest first, simple list)
- Compact event display by default:
  - Icon + timestamp + one-line summary
  - High density for quick scanning
- Tap event to expand inline (accordion style)
  - Expanded view shows full details in-place
  - Preserves timeline context
- Filtering capabilities:
  - Filter by event type (connection, state mismatch, cron execution, alerts)
  - Filter by severity/status (errors, warnings, normal, success)
  - NO date range picker or search (keep it simple)

### Health status indicators
- Connection status: Color-coded badge system
  - Green = online
  - Yellow = degraded
  - Red = offline
- Accompanied by metadata:
  - Last-seen timestamp ("Last online 5 minutes ago")
  - Connection quality/strength indicator
  - Current stove state (ON/OFF/STARTING)
  - Uptime percentage (last 24h: "99.8% uptime")
- State differentiation: Color + iconography
  - Good state: green + checkmark icon
  - Problem state: red/yellow + warning icon
  - Accessibility through dual encoding (not color-only)
- Unexpected state detection (scheduled ON but actually OFF):
  - Special event in timeline with warning icon
  - NO top banner (avoid alert fatigue)
  - Chronological context preserved in stream

### Claude's Discretion
- Exact icon designs (checkmark, warning, connection indicators)
- Timeline scroll behavior and infinite loading strategy
- Quick action button implementations
- Mobile vs desktop layout adjustments
- Loading states and skeleton designs
- Error handling for API failures

</decisions>

<specifics>
## Specific Ideas

- Timeline should feel like a monitoring feed - clear, scannable, chronological
- Dead man's switch panel should give confidence: "I know the system is running"
- Compact events with tap-to-expand keeps information dense but accessible
- Color + icon redundancy ensures colorblind users can distinguish states
- No unnecessary alerts (warning banners) - timeline events sufficient for most issues

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 10-monitoring-dashboard-&-alerts-ui*
*Context gathered: 2026-01-28*
