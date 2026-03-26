# Phase 140: Stove Migration - Context

**Gathered:** 2026-03-26
**Status:** Ready for planning

<domain>
## Phase Boundary

Migrate `useStoveData` from HTTP polling (useAdaptivePolling) to WebSocket as primary data channel. HTTP polling becomes automatic fallback when the WS connection is unavailable. The `alwaysActive` behavior (polling continues even with tab hidden) must be preserved in fallback mode. No UI changes — the hook's public interface (`UseStoveDataReturn`) stays the same.

</domain>

<decisions>
## Implementation Decisions

### Fallback Trigger
- **D-01:** When `readyState === OPEN`, WS is primary — polling is suppressed (not started or paused). When `readyState !== OPEN`, polling activates automatically with existing `useAdaptivePolling` config (60s, alwaysActive:true). The readyState from the WebSocketContext drives the switch.

### Data Mapping (WS vs HTTP)
- **D-02:** WS `ThermorossiData` payload maps directly to core state: `stove_state` → `status`, `power_level` → `powerLevel`, `fan_level` → `fanLevel`, `error_code` → `errorCode`, `error_description` → `errorDescription`.
- **D-03:** Staleness handling differs by source: WS messages are inherently fresh — set `isStale=false` and use the message `ts` field (unix seconds) as `cachedAt`. HTTP polling responses continue using `data_freshness` and `last_poll_at` fields from the proxy response as they do today.

### WS-to-Polling Transition
- **D-04:** Immediate switch, no grace period. When WS reconnects (`readyState` transitions to `OPEN`), polling stops on next interval check. The WS `snapshot` message (sent immediately on subscribe) provides fresh data — no gap possible.
- **D-05:** When WS disconnects (`readyState` leaves `OPEN`), polling activates immediately. No delay — stove monitoring is safety-critical.

### Scheduler & Maintenance Side-Fetches
- **D-06:** Scheduler mode (`fetchSchedulerMode`) and maintenance status (`fetchMaintenanceStatus`) remain as HTTP calls — they are not included in the WS `thermorossi` topic payload. They are triggered after each data update regardless of source (WS message or HTTP poll).
- **D-07:** `checkVersion()` also remains as HTTP call, triggered after data update.

### alwaysActive Preservation
- **D-08:** The `alwaysActive: true` flag applies only to the polling fallback path. When WS is connected, the WS connection itself is persistent (react-use-websocket keeps it open regardless of tab visibility). The alwaysActive behavior is inherently satisfied by WS and explicitly preserved in polling fallback.

### Claude's Discretion
- Whether to create a dedicated `useStoveWebSocket` helper hook or inline the WS subscription logic directly in `useStoveData`
- How to structure the conditional polling (useAdaptivePolling with a dynamic `enabled` parameter vs conditional hook call)
- Test strategy: mocking approach for WS subscribe/unsubscribe in useStoveData tests
- Whether to use the `TopicDataMap['thermorossi']` type alias or import `ThermorossiData` directly

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### WebSocket Spec
- `docs/api/websocket.md` — Complete WS protocol, thermorossi payload interface, snapshot-on-subscribe behavior, reconnection strategy
- `docs/api/websocket.md` §thermorossi — ThermorossiData fields: stove_state, power_level, fan_level, error_code, error_description

### WS Infrastructure (Phase 139)
- `lib/hooks/useWebSocketManager.ts` — Shared WS manager: subscribe/unsubscribe API, ReadyState export, callback registry
- `app/context/WebSocketContext.ts` — WebSocketContext + useWebSocketContext() hook for consuming the manager
- `types/websocket.ts` — ThermorossiData type, Topic type, WebSocketMessage<T> envelope, TopicDataMap

### Current Stove Hook
- `app/components/devices/stove/hooks/useStoveData.ts` — Current polling implementation. Primary migration target. Shows all state, side-fetches, staleness logic.
- `app/components/devices/stove/hooks/useStoveCommands.ts` — Command hook (NOT migrated — commands stay REST)
- `types/thermorossiProxy.ts` — StoveState type, ThermorossiStatusResponse type (HTTP response shape)

### Polling Infrastructure
- `lib/hooks/useAdaptivePolling.ts` — Current polling hook with alwaysActive, interval, immediate options. Will become fallback-only path.

### Existing Tests
- `__tests__/components/devices/stove/hooks/useStoveData.test.ts` — Current test suite for useStoveData

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `useWebSocketContext()` — Provides subscribe/unsubscribe/readyState from shared WS manager
- `useAdaptivePolling` — Existing polling hook, becomes fallback path. Has `alwaysActive` flag.
- `ThermorossiData` (types/websocket.ts) — WS payload type already defined with correct fields
- `StoveState` (types/thermorossiProxy.ts) — Existing stove state union type
- `WebSocketMessage<T>` — Typed envelope with `ts` field for timestamp

### Established Patterns
- **Hook-based device architecture** — All device state via custom hooks. WS integration stays inside the hook.
- **Orchestrator pattern** — StoveCard.tsx is a thin orchestrator calling useStoveData + useStoveCommands. No changes needed there.
- **Staleness via proxy fields** — HTTP responses include `data_freshness` ('FRESH'|'STALE') and `last_poll_at`. WS path will derive staleness from message `ts`.

### Integration Points
- `useStoveData` subscribes to `'thermorossi'` topic via `useWebSocketContext()`
- `readyState` from context determines WS vs polling mode
- No changes to StoveCard, StoveStatus, or stove/page.tsx — hook interface is unchanged
- No changes to useStoveCommands — commands remain REST

</code_context>

<specifics>
## Specific Ideas

- The WS spec says "snapshot on subscribe" — the first message after subscribing contains the full current state. This eliminates any data gap when switching from polling to WS.
- The WS `ThermorossiData` has an index signature `[key: string]: unknown` — additional raw WiNet fields may arrive. The hook should only destructure the known fields and ignore extras.
- The `data_freshness` and `last_poll_at` fields exist only in the HTTP proxy response, not in the WS payload. Staleness for WS must be computed from the message `ts` field.
- `error_code` / `error_description` alarm handling logic should work identically regardless of data source (WS or HTTP).

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 140-stove-migration*
*Context gathered: 2026-03-26*
