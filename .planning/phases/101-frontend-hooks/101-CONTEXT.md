# Phase 101: Frontend Hooks - Context

**Gathered:** 2026-03-19
**Status:** Ready for planning

<domain>
## Phase Boundary

Update useStoveData, useStoveCommands, and stoveStatusUtils to work with proxy response shapes. The stove card and stove page must display stove_state (exact string equality), handle 202 Accepted for commands, show error_code/error_description from proxy, and use data_freshness instead of custom timestamp-based staleness. No new UI features — this is a transport adaptation.

</domain>

<decisions>
## Implementation Decisions

### Status string mapping
- Rewrite `stoveStatusUtils.ts` with new proxy strings directly: `working`, `off`, `igniting`, `standby`, `cleaning`, `alarm`, `modulating`
- No translation layer — old WiNet strings (WORK, OFF, START, WAIT, ERROR, CLEAN, MODULATION) deleted entirely
- Exact equality checks (`===`) against `stove_state` string union — no regex or substring matching
- Status-to-display mapping preserves existing Ember Noir theme colors and icons (just the string keys change)

### Staleness strategy
- Replace `useDeviceStaleness('stove', thresholdMs)` call in `useStoveData` with `data_freshness` from the proxy status response
- `data_freshness: 'LIVE'` → not stale; `data_freshness: 'STALE'` → show staleness indicator
- Remove the dynamic threshold logic (90s on / 180s off) — proxy decides freshness based on its own 180s threshold
- The staleness display UI (StoveStatus component rendering staleness info) remains — only the data source changes
- `useDeviceStaleness` hook itself is NOT deleted (other devices may use it) — just removed from useStoveData

### Command response handling
- `useStoveCommands` continues using `response.ok` for success detection — covers both 200 and 202
- Extract `suggested_poll_delay_s` from 202 response body when available
- After command success, delay `fetchStatusAndUpdate()` by `suggested_poll_delay_s * 1000` ms instead of calling immediately (stove state transitions are slow)
- Handle 409 Conflict (state gating) as a user-facing error: "Command not allowed in current state"

### Error display
- When `stove_state === 'alarm'`, read `error_code` and `error_description` from proxy status response
- Display error info in StoveBanners component (existing error banner location)
- Format: show `error_description` as the banner message, include `error_code` as secondary info
- Clear error display when `stove_state` transitions away from `alarm`

### useStoveData response parsing
- `fetchStatusAndUpdate()` reads `stove_state`, `power_level`, `fan_level`, `data_freshness`, `error_code`, `error_description` from `/stove/status` response
- Remove separate `/stove/fan` and `/stove/power` fetches — the combined `/stove/status` response already includes `power_level` and `fan_level`
- This reduces 3 API calls per poll to 1 — simpler and more efficient

### Claude's Discretion
- Exact staleness indicator UI when data_freshness is STALE (badge, banner, or opacity change)
- Whether to add suggested_poll_delay_s as a timeout or use a simpler fixed delay
- Test file organization for the rewritten stoveStatusUtils

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Proxy API specification
- `docs/api/thermorossi.md` — Complete proxy API: status response shape (stove_state, data_freshness, error_code, error_description), 202 Accepted pattern, state gating table, state mapping reference
- `docs/api/README.md` — HA proxy authentication, RFC 9457 error format

### Frontend files to modify
- `app/components/devices/stove/hooks/useStoveData.ts` — Main data hook: polling, staleness, state management (311 lines)
- `app/components/devices/stove/hooks/useStoveCommands.ts` — Command handlers with retry infrastructure (274 lines)
- `app/components/devices/stove/stoveStatusUtils.ts` — Status-to-display mapping, pure functions (367 lines)
- `app/components/devices/stove/StoveCard.tsx` — Orchestrator passing data to sub-components (186 lines)

### Staleness infrastructure (reference, not to delete)
- `lib/hooks/useDeviceStaleness.ts` — Current staleness hook (72 lines) — remove from stove, keep for other devices
- `lib/pwa/stalenessDetector.ts` — IndexedDB-based staleness service (138 lines) — unchanged

### Proxy client (read-only reference)
- `lib/thermorossiProxy.ts` — Proxy convenience wrappers (getStatus returns ThermorossiStatusResponse)
- `types/thermorossiProxy.ts` — All type definitions including stove_state union literal

### Prior phase context
- `.planning/phases/99-proxy-client-foundation/99-CONTEXT.md` — Client pattern decisions, type definitions
- `.planning/phases/100-control-endpoints/100-CONTEXT.md` — Command wrapper decisions, 202 pattern, no backward compat

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `useAdaptivePolling` hook: already wired in useStoveData with `alwaysActive: true`, 60s interval — unchanged
- `useRetryableCommand` hook: retry infrastructure in useStoveCommands — unchanged, just response handling adapts
- StoveCard orchestrator pattern: sub-components (StoveStatus, StoveBanners, StovePrimaryActions, etc.) receive props — only prop shapes change
- Ember Noir theme colors/icons in stoveStatusUtils: preserve all visual properties, just update string keys

### Established Patterns
- Orchestrator pattern: useStoveData returns 41 state properties, StoveCard distributes to children
- Fire-and-forget analytics on commands: keep as cross-cutting concern
- `fetchStatusAndUpdate()` is the central polling callback — single place to update response parsing

### Integration Points
- `useStoveData` → calls `/api/stove/status` (already returns proxy shape since Phase 99)
- `useStoveData` → calls `/api/stove/getPower` and `/api/stove/getFan` (can be removed — status includes both)
- `useStoveCommands` → calls `/api/stove/ignite`, `/shutdown`, `/setPower`, `/setFan` (already return 202 since Phase 100)
- `stoveStatusUtils` → consumed by StoveStatus, StovePrimaryActions, StoveBanners, StoveModeControl sub-components

</code_context>

<specifics>
## Specific Ideas

- The 3→1 API call consolidation (status includes power_level + fan_level) is a direct efficiency win from the proxy's combined response
- `suggested_poll_delay_s` enables smarter post-command polling: 15s for ignit/shutdown, 5s for settings changes
- The stove_state string union from `types/thermorossiProxy.ts` should be the single source of truth — stoveStatusUtils imports it rather than redefining

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 101-frontend-hooks*
*Context gathered: 2026-03-19*
