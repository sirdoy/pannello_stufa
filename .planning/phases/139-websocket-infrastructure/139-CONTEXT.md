# Phase 139: WebSocket Infrastructure - Context

**Gathered:** 2026-03-26
**Status:** Ready for planning

<domain>
## Phase Boundary

Deliver a single shared WebSocket connection to `/ws/live` available app-wide. The connection handles auth, reconnects automatically with exponential backoff, and dispatches messages to per-topic consumers. TypeScript types exist for all 6 provider payloads.

This phase builds infrastructure only — no hooks are migrated from polling to WS yet (that's Phases 140-143). No UI changes (that's Phase 144).

</domain>

<decisions>
## Implementation Decisions

### Connection Manager Architecture
- **D-01:** Use a custom React hook (`useWebSocketManager`) wrapping `react-use-websocket` with a ref-based singleton pattern. This aligns with the existing hook ecosystem (useAdaptivePolling, useVisibility) and keeps the API familiar to the codebase.
- **D-02:** The manager hook is called once at app level (e.g., in a layout or provider) and exposes a subscribe/unsubscribe API. Individual device hooks will call subscribe with their topic and a callback.

### Auth Credential Source
- **D-03:** Use `NEXT_PUBLIC_WS_API_KEY` env var for browser-side WebSocket auth via `?api_key=` query parameter. This follows the existing `NEXT_PUBLIC_*` pattern used throughout the app for client-side config.
- **D-04:** The WS URL is constructed from `NEXT_PUBLIC_HA_API_URL` (or a new `NEXT_PUBLIC_WS_URL` if the WS endpoint differs from the REST base URL). Claude's discretion on the exact env var name based on what exists.

### Type Organization
- **D-05:** All WS payload types go in a single `types/websocket.ts` file — derived directly from `docs/api/websocket.md` spec. The file includes: `WebSocketMessage<T>`, `Topic` union, and all 6 provider data interfaces (`FritzBoxData`, `DirigeraData`, `NetatmoData`, `ThermorossiData`, `HueData`, `SonosData`).

### Topic Dispatch Pattern
- **D-06:** Callback registry pattern — the manager maintains a `Map<Topic, Set<(data: unknown) => void>>`. Each consumer hook registers a typed callback for its topic. The manager parses incoming JSON messages and dispatches to registered callbacks by `msg.topic` field.
- **D-07:** On subscribe, the manager sends `{"action": "subscribe", "topic": "..."}` to the server. On unsubscribe (when no more callbacks remain for a topic), it sends the unsubscribe message.

### Reconnection
- **D-08:** Use `react-use-websocket`'s built-in reconnection with exponential backoff (1s → 30s cap, 10 attempts). On every reconnect (`onOpen`), re-subscribe all topics that have active callbacks. This follows the spec requirement exactly.

### Claude's Discretion
- File placement within `lib/` vs `lib/hooks/` — use whichever fits best
- Whether to export a React context provider or just a hook — pragmatic choice based on how subscription state flows
- Test structure and mocking approach for WebSocket tests
- Whether `NEXT_PUBLIC_WS_URL` reuses `NEXT_PUBLIC_HA_API_URL` with protocol swap or needs a separate env var

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### WebSocket Spec
- `docs/api/websocket.md` — Complete WS protocol: endpoint, auth, message format, all 6 payload interfaces, reconnection strategy, error codes. This is the authoritative source for types and behavior.

### Auth
- `docs/api/auth.md` — API key creation and JWT login flows (referenced by WS auth section)

### Existing Infrastructure
- `lib/haClient.ts` — Shared HA proxy client (server-side). Shows env var pattern (`HA_API_URL`, `HA_API_KEY`) and error handling approach.
- `lib/hooks/useAdaptivePolling.ts` — Current polling infrastructure that WS will complement. Shows `alwaysActive`, `initialDelay`, visibility awareness patterns.
- `lib/hooks/useVisibility.ts` — Tab visibility hook used by adaptive polling.

### Device Data Hooks (will consume WS in later phases)
- `app/components/devices/stove/hooks/useStoveData.ts` — Stove polling hook (Phase 140 target)
- `app/components/devices/network/hooks/useNetworkData.ts` — Fritz!Box polling hook (Phase 141 target)
- `app/components/devices/lights/hooks/useLightsData.ts` — Hue polling hook (Phase 141 target)
- `app/components/devices/sonos/hooks/useSonosData.ts` — Sonos polling hook (Phase 142 target)
- `app/components/devices/dirigera/hooks/useDirigeraData.ts` — DIRIGERA polling hook (Phase 142 target)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `useAdaptivePolling` — Polling with visibility awareness, `alwaysActive` flag, `initialDelay`. WS fallback will continue using this.
- `useVisibility` — Tab visibility state. May be useful for WS connection management.
- `useOnlineStatus` — Network online/offline detection. Could inform WS reconnection behavior.
- `lib/haClient.ts` — Server-side HA proxy client with env var pattern and error mapping. WS client is client-side but follows similar config patterns.

### Established Patterns
- **Hook-based architecture** — All device state comes from custom hooks. WS manager should be a hook too.
- **Env var config** — `HA_API_URL` / `HA_API_KEY` for server-side, `NEXT_PUBLIC_*` for client-side.
- **TypeScript strict mode** — `strict: true` + `noUncheckedIndexedAccess`. All new types must be fully typed.
- **Function modules** — Proxy clients are function modules (not classes). WS manager can follow either pattern since `react-use-websocket` is hook-based.

### Integration Points
- **App layout** — WS provider/hook needs to be initialized at app level
- **Device hooks** — Each device's `use*Data` hook will subscribe to its WS topic in Phases 140-143
- **Env vars** — New `NEXT_PUBLIC_WS_API_KEY` (and possibly `NEXT_PUBLIC_WS_URL`) must be added to `.env.local`

</code_context>

<specifics>
## Specific Ideas

- The spec at `docs/api/websocket.md` includes a complete example `useProviderData` hook — this can serve as a reference implementation, but the actual implementation should use a shared connection (not per-hook connections as shown in the multi-topic warning).
- MAX 2 concurrent connections is a hard server limit — the shared manager pattern is mandatory, not optional.
- `react-use-websocket` v4.x is the suggested library with specific config options shown in the spec.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 139-websocket-infrastructure*
*Context gathered: 2026-03-26*
