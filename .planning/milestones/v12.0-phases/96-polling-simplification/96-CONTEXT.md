# Phase 96: Polling Simplification - Context

**Gathered:** 2026-03-18
**Status:** Ready for planning

<domain>
## Phase Boundary

Unify all device hooks to 60s useAdaptivePolling, remove Firebase RTDB real-time stove listener and sync-external-state. No new features — purely simplifying the data fetching layer.

</domain>

<decisions>
## Implementation Decisions

### Stove hook rewrite
- Replace custom setTimeout loop + Firebase RTDB onValue listener with useAdaptivePolling
- Use `alwaysActive: true` at 60s interval (stove is safety-critical, polling never pauses)
- No `initialDelay` — stove card loads first (consistent with v9.0 SUSP-03 safety priority)
- Remove all Firebase RTDB real-time listener code from useStoveData
- Stove data fetched via API route only (same as all other devices)

### Staleness thresholds
- Adjust stove staleness: 90s when on, 180s when off (1.5x the 60s polling interval)
- Other devices keep existing staleness logic (already compatible with 60s)

### sync-external-state removal
- Remove `/api/stove/sync-external-state` API route entirely
- Remove all calls to sync-external-state from useStoveData
- No other consumers exist — clean deletion

### Other device hooks
- ThermostatCard: change interval from 30s to 60s (keep existing useAdaptivePolling usage)
- LightsCard: change interval from 30s to 60s (keep existing useAdaptivePolling usage)
- NetworkCard: change visible interval from 30s to 60s, keep 5min hidden (already useAdaptivePolling)
- RaspiCard/RaspiFullData: change visible interval from 30s to 60s, keep 5min hidden (already useAdaptivePolling)
- Preserve existing initialDelay stagger values for all non-stove cards

### useDeviceStaleness
- Change from 5s setInterval to 60s interval (aligned with polling cadence)
- Keep visibility awareness (pause when hidden)
- No functional change — just less frequent threshold checks

### Claude's Discretion
- Exact cleanup of unused imports/types after RTDB listener removal
- Whether to simplify useStoveData internal state (fewer refs needed without RTDB)
- Test updates for changed intervals and removed functionality

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Polling infrastructure
- `lib/hooks/useAdaptivePolling.ts` — Core polling hook all devices must use, supports alwaysActive/initialDelay/visibility
- `lib/hooks/useDeviceStaleness.ts` — Staleness monitoring hook, currently 5s interval

### Stove data (primary rewrite target)
- `app/components/devices/stove/hooks/useStoveData.ts` — Custom polling + Firebase RTDB listener to be replaced
- `app/api/stove/sync-external-state/route.ts` — API route to be deleted

### Other device hooks (interval changes only)
- `app/components/devices/lights/hooks/useLightsData.ts` — Currently 30s, change to 60s
- `app/components/devices/network/hooks/useNetworkData.ts` — Currently 30s/5min, change to 60s/5min
- `app/components/devices/raspi/hooks/useRaspiData.ts` — Currently 30s/5min, change to 60s/5min
- `app/components/devices/raspi/hooks/useRaspiFullData.ts` — Currently 30s/5min, change to 60s/5min
- `app/components/devices/thermostat/ThermostatCard.tsx` — Inline useAdaptivePolling at 30s, change to 60s

### Requirements
- `.planning/REQUIREMENTS.md` — POLL-01 through POLL-08

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `useAdaptivePolling`: Fully featured hook with alwaysActive, initialDelay, visibility awareness — stove hook must adopt this
- `useVisibility`: Page Visibility API hook, already used by useAdaptivePolling internally
- All non-stove device hooks already use useAdaptivePolling — only interval change needed

### Established Patterns
- `alwaysActive: true` for safety-critical polling (v7.0 decision, stove only)
- `initialDelay` stagger: stove=0ms (priority), thermostat=50ms, lights=100ms, network=500ms, raspi=600ms
- Visibility-aware intervals: shorter when visible, longer when hidden (network/raspi use 30s/5min)
- Error resilience: preserve cached data on fetch errors (stale flag, not error state)

### Integration Points
- useStoveData is consumed by StoveCard orchestrator (`app/components/devices/stove/StoveCard.tsx`)
- useDeviceStaleness is consumed by StoveCard and ThermostatCard for staleness indicators
- Firebase RTDB imports in useStoveData (onValue, ref, off, get) — all removed after rewrite
- sync-external-state route may be referenced in tests — check and clean up

</code_context>

<specifics>
## Specific Ideas

No specific requirements — straightforward infrastructure simplification following established useAdaptivePolling pattern.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 96-polling-simplification*
*Context gathered: 2026-03-18*
