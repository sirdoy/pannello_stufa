# Phase 143: Netatmo Migration - Context

**Gathered:** 2026-03-28
**Status:** Ready for planning

<domain>
## Phase Boundary

Migrate Netatmo thermostat data from HTTP polling to WebSocket as primary data channel. This requires extracting a `useThermostatData` hook (currently data fetching is inline in ThermostatCard.tsx and thermostat/page.tsx — unlike all other providers which have dedicated data hooks). HTTP polling becomes automatic fallback when WS is unavailable. An adapter layer normalises the raw `Record<string, unknown>` WS payload into the existing typed Netatmo shape. No UI changes.

</domain>

<decisions>
## Implementation Decisions

### Hook Extraction (prerequisite — unique to Netatmo)
- **D-01:** Unlike all other providers (stove, network, lights, sonos, dirigera), Netatmo has NO dedicated data hook. ThermostatCard.tsx and thermostat/page.tsx both fetch data independently with inline `useAdaptivePolling` / `setInterval`. A `useThermostatData` hook must be extracted FIRST before WS migration.
- **D-02:** The hook should be created at `app/components/devices/thermostat/hooks/useThermostatData.ts` following the directory convention of other provider hooks.
- **D-03:** The extracted hook encapsulates: connection check (health), topology fetch (homesdata), status polling (homestatus), staleness tracking. Both ThermostatCard and thermostat/page.tsx consume it.

### WS Payload Adapter
- **D-04:** The WS `netatmo` topic sends the raw Netatmo cloud API `homestatus` response as `Record<string, unknown>`. The envelope is `{ body: { home: { id, rooms: [...], modules: [...] } }, status: "ok", time_server: number }`. An adapter function maps this into the existing internal interfaces used by ThermostatCard and page.tsx.
- **D-05:** The adapter extracts `body.home.rooms` and `body.home.modules` from the raw WS payload and maps them to the existing `RoomStatus[]` and `ModuleStatus[]` shapes used by the components. Field mapping: `therm_measured_temperature` → `temperature`, `therm_setpoint_temperature` → `setpoint`, `therm_setpoint_mode` → `mode`, `heating_power_request > 0` → `heating`.
- **D-06:** If the WS payload is `null` (Netatmo cloud hasn't responded since server start), the adapter returns null and the hook falls back to HTTP polling.
- **D-19:** [auto] The adapter is a standalone utility function (not inline in handleMessage). Rationale: it's the most complex adapter of all 6 providers (nested Netatmo envelope → flat internal types), standalone is testable independently and consistent with lights adapter pattern.

### Data Scope (WS vs HTTP)
- **D-07:** `homestatus` (room temperatures, heating status, module battery/reachable) — via WS as primary, HTTP polling as fallback.
- **D-08:** `homesdata` (topology: home structure, rooms list, module list, schedules) — remains as HTTP side-fetch. This is structural data that changes rarely (only when rooms/devices are added/removed). Fetched on mount only.
- **D-09:** Schedules (active schedule, switch schedule, sync schedule) — remain as HTTP via existing `useScheduleData` hook and API routes. Not part of WS payload.
- **D-10:** Health check (connection status) — remains as HTTP side-fetch on mount.
- **D-11:** Calibration, mode changes, temperature setpoints — remain as HTTP POST commands (WS is read-only push per spec).

### Hook Return Type
- **D-20:** [auto] Single hook returns full data (rooms, modules, topology, health, staleness, loading state). ThermostatCard derives the subset it needs from the full return. Matches useSonosData pattern where the card uses a subset of the hook's data.

### Topology Re-fetch Strategy
- **D-21:** [auto] Topology (homesdata) is fetched only on mount — not re-fetched after WS data updates. Topology is structural data that changes rarely, consistent with D-08/D-14 decisions.

### Fallback Trigger (carried from Phase 140/141/142)
- **D-12:** Same pattern as all other providers: `readyState === OPEN` → WS primary, polling suppressed via `interval: isWsConnected ? null : existingInterval`. When WS disconnects, polling activates immediately.
- **D-13:** `alwaysActive: false` preserved — thermostat is non-safety-critical (matches current ThermostatCard behavior).

### Page.tsx Polling Normalization
- **D-22:** [auto] The page.tsx raw `setInterval(30000)` is migrated to `useAdaptivePolling` during hook extraction for consistency with ThermostatCard's existing usage. The hook normalises all polling through `useAdaptivePolling`.

### Side-Fetch Pattern (carried from Phase 140)
- **D-14:** Side-fetches (topology/homesdata, health) fire on mount. Status side-fetches are not needed — WS provides the homestatus data directly.
- **D-15:** Side-fetches use ref pattern to avoid stale closures in WS useEffect callbacks.

### Staleness Handling (carried from Phase 140/141/142)
- **D-16:** WS messages: `isStale=false`, use message `ts` field as freshness indicator. HTTP polling: continue using existing staleness logic.

### WS Subscription Pattern (carried from Phase 140/141/142)
- **D-17:** `subscribe('netatmo', handleMessage)` in useEffect with `unsubscribe()` cleanup.
- **D-18:** Ref pattern for side-effect functions to avoid stale closures.

### Test Mocking
- **D-23:** [auto] Mock `useWebSocketContext` with `jest.fn` subscribe/unsubscribe — established pattern from Phase 140-142 test suites. The standalone adapter function (D-19) gets its own unit tests with raw payload fixtures.

### Claude's Discretion
- Internal naming of adapter helper functions (e.g., `mapRooms`, `mapModules`)
- Exact error handling within the adapter for malformed payloads (type guards vs try/catch)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### WebSocket Spec
- `docs/api/websocket.md` — Complete WS protocol, NetatmoData payload definition, snapshot-on-subscribe behavior
- `docs/api/websocket.md` §netatmo — Raw Netatmo cloud API homestatus response as `Record<string, unknown>`, full envelope structure

### WS Infrastructure (Phase 139)
- `lib/hooks/useWebSocketManager.ts` — Shared WS manager: subscribe/unsubscribe API, ReadyState export
- `app/context/WebSocketContext.ts` — WebSocketContext + useWebSocketContext() hook
- `types/websocket.ts` — NetatmoData type (`Record<string, unknown>`), TopicDataMap

### Phase 140 Reference Implementation
- `app/components/devices/stove/hooks/useStoveData.ts` — Completed WS migration. Shows subscribe/unsubscribe pattern, ref pattern for side-fetches, `isWsConnected ? null : interval` fallback, handleMessage mapping.

### Phase 141 Reference (Fritz!Box & Hue)
- `app/components/devices/network/hooks/useNetworkData.ts` — Fritz!Box WS migration with sparkline buffer
- `app/components/devices/lights/hooks/useLightsData.ts` — Hue WS migration with Record-to-array conversion

### Phase 142 Reference (Sonos & DIRIGERA)
- `app/components/devices/sonos/hooks/useSonosData.ts` — Sonos WS migration with health/playback side-fetches
- `app/components/devices/dirigera/hooks/useDirigeraData.ts` — DIRIGERA WS migration with in-hook summary derivation

### Current Netatmo Code (migration targets)
- `app/components/devices/thermostat/ThermostatCard.tsx` — Dashboard card with inline data fetching (useAdaptivePolling 60s, alwaysActive:false). Primary migration target.
- `app/thermostat/page.tsx` — Full thermostat page with inline polling (setInterval 30s). Secondary migration target.
- `types/netatmoProxy.ts` — Existing typed interfaces: NetatmoProxyHomestatusResponse, NetatmoProxyRoomMeasurement, NetatmoProxyRoom, NetatmoProxyModule
- `lib/netatmo/netatmoProxy.ts` — Server-side proxy client (HTTP routes stay, adapter maps WS payload to same shapes)
- `app/api/netatmo/homestatus/route.ts` — HTTP endpoint for homestatus (fallback path)
- `app/api/netatmo/homesdata/route.ts` — HTTP endpoint for topology (stays as HTTP)
- `app/api/netatmo/health/route.ts` — HTTP endpoint for health check (stays as HTTP)

### Netatmo REST API Reference
- `docs/api/netatmo.md` — Full field-by-field documentation for homestatus response (the WS payload mirrors this)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `useWebSocketContext()` — WS connection state and subscribe/unsubscribe API (Phase 139)
- `useAdaptivePolling()` — Polling with visibility awareness, `interval: null` disables (used in ThermostatCard)
- `useDeviceStaleness('thermostat')` — Existing staleness tracking for thermostat device
- `useScheduleData()` — Schedule management hook (stays independent, not part of WS migration)
- `useRetryableCommand()` — Command retry infrastructure (stays independent)
- `ReadyState` from `useWebSocketManager` — WS connection state enum

### Established Patterns
- **WS-primary + HTTP fallback:** 5 providers already migrated with identical pattern (subscribe in useEffect, `isWsConnected ? null : interval` for polling control)
- **Ref pattern:** All migrated hooks use refs for side-fetch functions to avoid stale closures in WS callbacks
- **Standalone adapter:** Lights hook uses adapter for Record-to-array; Netatmo adapter will be standalone (D-19) for the more complex nested envelope mapping
- **Side-fetch on mount:** Structural data (topology) fetched once on mount via HTTP, not through WS

### Integration Points
- `app/components/DashboardCards.tsx` — Imports ThermostatCard, no change needed (hook extraction is internal)
- `app/thermostat/page.tsx` — Will consume new useThermostatData hook instead of inline fetching
- `app/thermostat/components/ThermostatTabs.tsx` — Receives data as props from page.tsx
- `app/components/netatmo/RoomCard.tsx` — Receives room data as props from page.tsx

</code_context>

<specifics>
## Specific Ideas

- The Netatmo WS adapter is the most complex of all 6 providers because the WS payload is raw `Record<string, unknown>` (the full Netatmo cloud API response), not a typed interface like the other 5 providers. Robust type guards / parsing are needed.
- ThermostatCard currently uses `topology ? 60000 : null` to gate polling on connection — the hook should preserve this behavior (only poll when connected/topology loaded).
- The page.tsx uses a raw `setInterval(30000)` instead of `useAdaptivePolling` — normalised to `useAdaptivePolling` per D-22.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 143-netatmo-migration*
*Context gathered: 2026-03-28*
