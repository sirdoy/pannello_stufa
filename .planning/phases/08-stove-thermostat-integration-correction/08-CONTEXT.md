# Phase 8: Stove-Thermostat Integration Correction - Context

**Gathered:** 2026-01-27
**Status:** Ready for planning

<domain>
## Phase Boundary

Coordinate stove ignition with Netatmo thermostat using temporary setpoint overrides (not schedule modifications). Respect user intent by pausing automation when manual changes detected. Handle multi-room zones and prevent notification spam through intelligent throttling.

This phase does NOT modify weekly schedules - it applies temporary overrides that expire when stove turns off.

</domain>

<decisions>
## Implementation Decisions

### Setpoint Override Behavior
- **Boost amount**: User-configurable (stored in preferences, default +2°C)
- **Duration**: Until stove turns OFF (not time-based expiry)
- **Multi-room zones**: Configurable per zone (user sets which zones participate + individual boost amounts)
- **Max setpoint handling**: Cap at 30°C with alert notification when limit reached
- **Setpoint restore**: When stove turns OFF, restore previous setpoint (pre-override value)

### User Intent & Pause Logic
- **Manual detection**: Any setpoint change from app/device counts as manual (not just physical thermostat)
- **Pause duration**: Until next schedule slot begins (not fixed 30 minutes)
- **Stove during pause**: Respect pause - do NOT apply override if automation paused (user intent is sacred)
- **Pause visibility**: Display in dashboard with "Automation paused until HH:MM" + reason + countdown timer

### Trigger Conditions & Debouncing
- **Trigger state**: STARTING → ON transition (stove completes ignition)
- **Debouncing**: Stove must remain stable in ON state for 2 minutes before applying override
- **Early shutoff handling**: If stove turns OFF before 2-min timer, apply shorter 30s timer (handles quick restarts)
- **Override cancellation**: If stove OFF during initial 2-min debounce, cancel pending override

### Alert Strategy & Deduplication
- **Alert conditions**: User-configurable (which events trigger notifications, with sensible defaults)
- **Deduplication window**: Global throttle - max 1 notification total every 30 minutes across all coordination events
- **Notification content**: Actionable format with quick actions (e.g., 'Undo', 'Pause automation')
- **History logging**: Always log all events to Firestore regardless of notification throttling

### Claude's Discretion
- Default boost amount value (+2°C suggested)
- Default zone configuration for single-zone setups
- Notification default preferences (which events enabled by default)
- UI for zone configuration in preferences
- Debounce timer implementation details (memory vs Firestore)
- Exact notification action buttons and handlers

</decisions>

<specifics>
## Specific Ideas

- "User intent is sacred" - manual changes should always take precedence over automation
- Global throttle prevents notification fatigue (user sees max 1 alert per 30 min)
- Actionable notifications let users quickly undo/pause without opening app
- Restore previous setpoint (not schedule) preserves user's manual adjustments
- 30s retry timer handles edge case of quick stove restarts (better UX than strict 2-min rule)

</specifics>

<deferred>
## Deferred Ideas

None - discussion stayed within phase scope

</deferred>

---

*Phase: 08-stove-thermostat-integration-correction*
*Context gathered: 2026-01-27*
