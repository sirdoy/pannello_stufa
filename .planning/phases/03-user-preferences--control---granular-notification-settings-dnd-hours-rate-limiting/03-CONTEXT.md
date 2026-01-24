# Phase 3: User Preferences & Control - Context

**Gathered:** 2026-01-24
**Status:** Ready for planning

<domain>
## Phase Boundary

Users control notification behavior through granular settings - enable/disable notification types, configure quiet hours (DND), and prevent spam via rate limiting. This is about **user control over existing notifications**, not adding new notification types or features.

</domain>

<decisions>
## Implementation Decisions

### Notification Category System
- **Three semantic categories**: Alerts (CRITICAL/ERROR), System (maintenance/updates), Routine (scheduler_success/status)
- **Default for new users**: Balanced approach - Alerts + System enabled, Routine disabled (opt-in)
- **Type-level granular control**: Each notification type independently controllable (CRITICAL, ERROR, INFO, scheduler_success, etc.) for maximum user flexibility
- **Fixed mapping in code**: Category-to-type mapping is hardcoded (simple, predictable)
  - Alerts = [CRITICAL, ERROR]
  - System = [maintenance, updates]
  - Routine = [scheduler_success, status]

### DND Hours Behavior
- **CRITICAL bypass only**: CRITICAL notifications delivered immediately during DND, all others dropped (not queued)
- **Multiple windows per day**: Support multiple DND periods (e.g., lunch break 13:00-14:00 + nighttime 22:00-08:00)
- **Browser/device timezone**: Use device's current timezone automatically (no manual timezone selection)
- **Per-device settings**: Each device has its own DND schedule (phone silences at night, desktop doesn't)

### Rate Limiting Strategy
- **Per notification type scoping**: Independent rate limits for each type (e.g., max 1 scheduler_success per 5 min, max 1 ERROR per 5 min)
- **Aggregated summaries**: Suppressed notifications are aggregated into summary notifications (e.g., "3 scheduler events succeeded in last 5 min")
- **Configurable per type**: Different rate windows for different types (Scheduler: 5 min, Errors: 1 min, CRITICAL: no limit, etc.)
- **Always active**: Rate limits apply even during DND hours (even CRITICAL notifications are rate-limited to prevent spam)

### Settings UI & Sync
- **Dedicated page**: `/settings/notifications` - full page for notification preferences
- **Advanced/Basic modes**: Basic mode shows category toggles + DND; Advanced mode expands to type-level controls and rate limits (progressive disclosure)
- **Real-time sync**: Changes sync across devices instantly via Firebase listeners (not just on page load)
- **Save button required**: Explicit "Save Preferences" button to apply changes (allows cancel/revert before committing)

### Claude's Discretion
- Exact UI component design (toggles, time pickers, etc.)
- Error handling for sync failures
- Loading states during preference fetch
- Validation rules for DND time ranges

</decisions>

<specifics>
## Specific Ideas

- Success criteria from ROADMAP.md must be met:
  - User disables "Scheduler" notifications → scheduler events no longer trigger push (other types still work)
  - User sets DND 22:00-08:00 in Europe/Rome → no notifications during those hours
  - Scheduler fires 3 events within 4 minutes → user receives only 1 notification (rate limit: max 1 per category per 5 min)
  - User updates on phone → immediately sees same settings on tablet (cross-device sync)
  - New user sees only CRITICAL and ERROR enabled by default (conservative defaults) → **UPDATED TO: Alerts + System enabled (balanced)**

- Per-device DND means user can have phone silent at night while desktop stays active for urgent alerts

- Real-time sync via Firebase listeners ensures instant reflection across devices (matches success criteria "immediately")

</specifics>

<deferred>
## Deferred Ideas

None - discussion stayed within phase scope

</deferred>

---

*Phase: 03-user-preferences--control---granular-notification-settings-dnd-hours-rate-limiting*
*Context gathered: 2026-01-24*
