# Phase 55: Retry Infrastructure - Context

**Gathered:** 2026-02-11
**Status:** Ready for planning

<domain>
## Phase Boundary

Device commands and API calls recover automatically from transient failures with exponential backoff and idempotency protection. Users see clear feedback on failures, can manually retry offline devices, and are protected from duplicate physical actions (double-ignite, double-shutdown). Scope covers retry logic, toast feedback, idempotency keys, and request deduplication.

</domain>

<decisions>
## Implementation Decisions

### Failure feedback
- Error toasts are persistent until manually dismissed (tap X) — errors should not auto-disappear
- Success behavior, retry visibility, and error message detail level are Claude's discretion

### Manual retry UX
- Retry button appears in BOTH the error toast AND on the device card
- Toast notifies with inline Retry button; card shows error state with Retry button
- Toast auto-dismisses after user taps Retry or dismisses it; card keeps retry option until resolved
- Retry button visual state (spinner vs loading), retry limits, and auto-recovery behavior are Claude's discretion

### Idempotency scope
- ALL device commands get idempotency protection — stove, Hue lights, Netatmo thermostat
- Not limited to just ignite/shutdown — every command that triggers a physical action

### Deduplication window
- 2-second deduplication window prevents double-tap from sending duplicate commands
- All implementation details (scope per command type, visual feedback, toggle vs duplicate distinction, per-device vs global) are Claude's discretion

### Claude's Discretion
- Retry visibility: whether to show retries in progress or keep them silent until resolved/failed
- Error message detail: simple generic vs categorized per error type
- Success toast behavior: always show vs only after retries
- Retry button visual state during retry (spinner on button vs full card loading)
- Manual retry limits (unlimited vs capped)
- Auto-recovery: auto-clear error state when device comes back online vs require user action
- Idempotency key storage (client-side vs Firebase RTDB)
- Idempotency key TTL
- Duplicate notification (silent block vs subtle toast)
- Deduplication scope (all buttons vs critical only)
- Button visual feedback during dedup window
- Toggle intent handling (block same action only vs block everything)
- Deduplication scope (per-device vs global)

</decisions>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches. User gave Claude broad discretion on implementation details, with two firm decisions:
1. Error toasts must be persistent (not auto-dismiss)
2. Retry available in both toast and device card (dual placement)
3. Idempotency covers ALL device commands, not just stove

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 55-retry-infrastructure*
*Context gathered: 2026-02-11*
