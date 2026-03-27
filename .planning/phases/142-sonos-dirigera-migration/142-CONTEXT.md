# Phase 142: Sonos & DIRIGERA Migration - Context

**Gathered:** 2026-03-27
**Status:** Ready for planning

<domain>
## Phase Boundary

Migrate `useSonosData` and `useDirigeraData` from HTTP polling to WebSocket as primary data channel. HTTP polling becomes automatic fallback when WS is unavailable. Both hooks' public interfaces (`UseSonosDataReturn`, `UseDirigeraDataReturn`) stay the same. No UI changes.

</domain>

<decisions>
## Implementation Decisions

### Fallback Trigger (carried from Phase 140/141)
- **D-01:** Same pattern as stove/fritzbox/hue: `readyState === OPEN` → WS primary, polling suppressed via `interval: isWsConnected ? null : existingInterval`. When WS disconnects, polling activates immediately.
- **D-02:** Both Sonos and DIRIGERA: `alwaysActive: false` preserved (non-safety-critical, matches current behavior).

### Sonos WS Data Mapping
- **D-03:** WS `SonosData` provides `speakers: SonosSpeaker[]` and `groups: SonosGroup[]`. The `groups` array maps directly to the current `zones` concept — both have `group_id`, `label`, `coordinator_uid`, `coordinator_name`, `member_count`, `members`. Use groups as zones directly.
- **D-04:** Derive `speakerCount` from `speakers.length` and `zoneCount` from `groups.length` in the handleMessage callback.
- **D-05:** `nowPlaying` (playback state) is NOT included in the WS `sonos` topic payload. Playback must continue as HTTP side-fetch: fetch playback for up to 5 zones after each WS data update. Same fire-and-forget pattern as stove's scheduler/maintenance.
- **D-06:** `health` (SonosHealthResponse: connected, data_freshness, device_count) is NOT included in the WS payload. Health must continue as HTTP side-fetch on mount and after each data update.

### DIRIGERA WS Data Mapping
- **D-07:** WS `DirigeraData` provides `sensors: DirigeraSensor[]`. The summary stats (`total_sensors`, `offline_count`, `low_battery_count`, `open_count`) are computed in-hook from the raw sensors array — no HTTP call to `/api/dirigera/sensors/summary` needed when WS is active.
- **D-08:** Summary derivation logic: `total_sensors = sensors.length`, `offline_count = sensors.filter(s => !s.is_reachable).length`, `low_battery_count = sensors.filter(s => s.battery_percentage !== null && s.battery_percentage <= 20).length`, `open_count = sensors.filter(s => s.type === 'openCloseSensor' && s.is_open).length`.
- **D-09:** `health` (DirigeraHealthResponse: firmware_version, connected_sensors, is_reachable) is NOT included in the WS payload. Health must continue as HTTP side-fetch on mount and after each data update.
- **D-10:** The `computeDirigeraHealth` function continues to work from the summary — either WS-derived or HTTP-fetched — no change needed.

### Side-Fetch Pattern (carried from Phase 140)
- **D-11:** Side-fetches (Sonos health + playback, DIRIGERA health) fire on mount AND after each data update regardless of source (WS or HTTP). Same pattern as stove's `fetchSchedulerMode` / `fetchMaintenanceStatus`.
- **D-12:** Side-fetches use ref pattern to avoid stale closures in WS useEffect callbacks.

### Staleness Handling
- **D-13:** WS messages: `isStale=false`, use message `ts` field as freshness indicator. HTTP polling: continue using existing error/success logic for staleness.
- **D-14:** When WS is connected and sending data, health side-fetch staleness fields (`data_freshness`) are ignored in favor of WS-derived freshness.

### WS Subscription Pattern (carried from Phase 140/141)
- **D-15:** `subscribe('sonos', handleMessage)` / `subscribe('dirigera', handleMessage)` in useEffect with `unsubscribe()` cleanup.
- **D-16:** Ref pattern for side-effect functions to avoid stale closures.

### Claude's Discretion
- Whether to create helper adapter functions or inline mapping in handleMessage
- Whether Sonos playback side-fetch should be a separate useEffect or triggered inside handleMessage
- Whether DIRIGERA summary derivation should be a standalone utility function or inline
- Test mocking approach for WS subscribe/unsubscribe in both hooks
- Whether to keep the visibility-based interval adjustment (`isVisible ? 60000 : 300000`) in fallback mode or use a fixed interval

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### WebSocket Spec
- `docs/api/websocket.md` — Complete WS protocol, SonosData and DirigeraData payload interfaces, snapshot-on-subscribe behavior, reconnection strategy
- `docs/api/websocket.md` §sonos — SonosSpeaker, SonosGroupMember, SonosGroup, SonosData interfaces
- `docs/api/websocket.md` §dirigera — DirigeraBaseSensor, DirigeraContactSensor, DirigeraMotionSensor, DirigeraSensor, DirigeraData interfaces

### WS Infrastructure (Phase 139)
- `lib/hooks/useWebSocketManager.ts` — Shared WS manager: subscribe/unsubscribe API, ReadyState export
- `app/context/WebSocketContext.ts` — WebSocketContext + useWebSocketContext() hook
- `types/websocket.ts` — SonosData, SonosSpeaker, SonosGroup, SonosGroupMember, DirigeraData, DirigeraSensor, TopicDataMap

### Phase 140 Reference Implementation
- `app/components/devices/stove/hooks/useStoveData.ts` — Completed WS migration. Shows subscribe/unsubscribe pattern, ref pattern for side-fetches, `isWsConnected ? null : interval` fallback, handleMessage mapping.

### Phase 141 Reference (Fritz!Box & Hue)
- `app/components/devices/network/hooks/useNetworkData.ts` — Fritz!Box WS migration with sparkline buffer preservation
- `app/components/devices/lights/hooks/useLightsData.ts` — Hue WS migration with scenes side-fetch and Record-to-array conversion

### Current Sonos Hook
- `app/components/devices/sonos/hooks/useSonosData.ts` — Current polling implementation. Primary migration target. Shows multi-endpoint fetch (health, zones, playback per zone), Promise.allSettled pattern.
- `types/sonosProxy.ts` — SonosHealthResponse, SonosZoneResponse, SonosPlaybackResponse, SonosDeviceResponse types (HTTP shapes)

### Current DIRIGERA Hook
- `app/components/devices/dirigera/hooks/useDirigeraData.ts` — Current polling implementation. Primary migration target. Shows parallel health+summary fetch, computeDirigeraHealth derivation.
- `types/dirigeraProxy.ts` — DirigeraHealthResponse, SensorSummaryResponse types (HTTP shapes)

### Polling Infrastructure
- `lib/hooks/useAdaptivePolling.ts` — Polling hook with alwaysActive, interval, immediate options. Becomes fallback-only path.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `useWebSocketContext()` — Provides subscribe/unsubscribe/readyState from shared WS manager
- `useAdaptivePolling` — Existing polling hook, becomes fallback path. Has `alwaysActive` flag.
- `SonosData` / `DirigeraData` (types/websocket.ts) — WS payload types already defined with correct interfaces
- Phase 140 `useStoveData` — Reference implementation for WS-primary + polling-fallback pattern with side-fetches
- Phase 141 `useNetworkData` / `useLightsData` — Reference for multi-field mapping and side-fetch patterns
- `computeDirigeraHealth()` — Existing health derivation function, works with any summary source

### Established Patterns
- **WS subscribe in useEffect** with ref pattern for side-effects (Phase 140/141)
- **`isWsConnected ? null : interval`** to suppress polling when WS is live
- **Snapshot-on-subscribe** eliminates data gap on WS connect
- **Fire-and-forget side-fetches** triggered after data update (scheduler, maintenance, scenes)
- **Promise.allSettled** for batched zone playback fetches (current Sonos pattern)

### Integration Points
- `useSonosData` subscribes to `'sonos'` topic via `useWebSocketContext()`
- `useDirigeraData` subscribes to `'dirigera'` topic via `useWebSocketContext()`
- No changes to SonosCard, DirigeraCard orchestrators — hook interfaces unchanged
- No changes to command hooks (useSonosCommands) — commands stay REST
- No changes to useSonosFullData, useSonosQueue, useSonosHistory — these are detail/page hooks, not dashboard hooks

</code_context>

<specifics>
## Specific Ideas

- WS `SonosData.groups` structure is identical to HTTP `SonosZoneResponse[]` — both have `group_id`, `label`, `coordinator_uid`, `coordinator_name`, `member_count`, `members`. Direct passthrough, no adapter needed.
- WS `SonosData.speakers` is new data not in current hook return — can be stored internally but isn't part of the current public interface.
- DIRIGERA summary computation from raw sensors eliminates one HTTP round-trip when WS is active. The HTTP `/api/dirigera/sensors/summary` endpoint applies the same logic server-side.
- Both hooks are simpler than Fritz!Box (no sparkline buffer) and Hue (no Record-to-array conversion for groups). This should be a straightforward application of the established pattern.
- The Sonos playback side-fetch is the most complex part: `Promise.allSettled` for up to 5 zones, pick the "most interesting" (first PLAYING, else first available).

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 142-sonos-dirigera-migration*
*Context gathered: 2026-03-27*
