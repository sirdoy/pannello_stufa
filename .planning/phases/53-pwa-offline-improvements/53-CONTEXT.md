# Phase 53: PWA Offline Improvements - Context

**Gathered:** 2026-02-11
**Status:** Ready for planning

<domain>
## Phase Boundary

Offline mode enhanced with staleness indicators, command queuing UI, and guided PWA install prompt. Users get clear feedback when offline, controls become safe (no actions on stale state), pending commands are visible and cancellable, and a guided install prompt improves PWA adoption. This phase covers offline awareness, safety, queue visibility, and install prompting — not new device capabilities or notification changes.

</domain>

<decisions>
## Implementation Decisions

### Offline awareness UI
- Sticky top banner when offline — fixed at the very top, pushes content down
- Dark/muted background matching Ember Noir theme — informational, not alarming (no red/amber)
- Banner shows "Offline" status + timestamp of last successful data update
- Device cards show staleness via dimming + "Last update: X ago" text when cached data older than threshold
- Online→offline and offline→online transitions: Claude's discretion on animation approach

### Control safety behavior
- Controls hidden entirely when offline — buttons/sliders disappear, only status info remains
- Claude decides lockdown scope: full lockdown vs selective based on control risk level (e.g., stove ignite vs read-only display)
- Mid-action going offline: action is cancelled immediately with "Connection lost — action cancelled" notification
- No silent queuing of interrupted actions — explicit cancellation for safety
- Gradual staleness vs binary offline threshold: Claude's discretion on intermediate warning states

### Command queue visibility
- Pending commands shown inside the offline banner — banner expands to list them
- Full detail per command: device name, action description, timestamp, and cancel button
- User can cancel individual queued commands before sync
- Reconnect confirmation style: Claude's discretion (simple toast vs per-command results)
- Command expiration policy: Claude's discretion on whether commands expire after extended offline periods (safety consideration for stove control)

### PWA install prompt
- Bottom sheet style — slides up from bottom, mobile-native feel
- Prompt messaging and benefits copy: Claude's discretion, matching Ember Noir tone
- Appears after 2+ visits (per success criteria)
- Dismiss behavior and timing: Claude's discretion
- Re-prompt strategy after dismissal: Claude's discretion (30-day tracking available per spec)

### Claude's Discretion
- Offline→online transition animation style
- Gradual staleness thresholds vs binary offline detection
- Full lockdown vs selective control hiding based on risk
- Reconnect sync feedback format (toast vs per-command)
- Command queue expiration timeout
- Install prompt messaging, dismiss timing, and re-prompt frequency

</decisions>

<specifics>
## Specific Ideas

- Offline banner should feel like "informational" not "error" — the app still shows cached data, it's not broken
- Controls hidden (not grayed) when offline — cleaner look, less confusing than disabled buttons
- Mid-action interruption cancels explicitly rather than silently queuing — user must know the action didn't happen
- Pending commands expandable inside the offline banner keeps everything in one place (no separate panel)
- Bottom sheet for install prompt — follows mobile platform conventions (iOS/Android native patterns)

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 53-pwa-offline-improvements*
*Context gathered: 2026-02-11*
