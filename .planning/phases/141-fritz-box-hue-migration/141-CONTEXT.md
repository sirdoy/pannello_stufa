# Phase 141: Fritz!Box & Hue Migration - Context

**Gathered:** 2026-03-27
**Status:** Ready for planning

<domain>
## Phase Boundary

Migrate `useNetworkData` (Fritz!Box) and `useLightsData` (Hue) from HTTP polling to WebSocket as primary data channel. HTTP polling becomes automatic fallback when WS is unavailable. The Fritz!Box sparkline buffer and bandwidth history must survive WS/polling transitions without data loss or reset. No UI changes — both hooks' public interfaces stay the same.

</domain>

<decisions>
## Implementation Decisions

### Fallback Trigger (carried from Phase 140)
- **D-01:** Same pattern as stove: `readyState === OPEN` → WS primary, polling suppressed via `interval: isWsConnected ? null : existingInterval`. When WS disconnects, polling activates immediately.
- **D-02:** Fritz!Box: `alwaysActive: false` preserved (non-safety-critical). Hue: `alwaysActive: false` preserved.

### Fritz!Box WS Data Mapping
- **D-03:** WS `FritzBoxData` delivers `devices`, `bandwidth`, and `wan` as a single payload. The `handleMessage` callback maps all three to existing state in one pass (vs HTTP's 3 parallel fetches).
- **D-04:** Bandwidth unit conversion: WS provides `upstream_bps`/`downstream_bps` (bits per second). Convert to Mbps (`/ 1_000_000`) in handleMessage to match existing sparkline format (`SparklinePoint.mbps`).
- **D-05:** WAN field mapping: WS `FritzBoxWan.is_connected` → `connected`, `FritzBoxWan.uptime` → `uptime`, `FritzBoxWan.max_downstream_bps` / 1_000_000 → `linkSpeed` (Mbps).
- **D-06:** Device mapping: WS `FritzBoxDevice.status` (0|1) → `active` boolean. WS `FritzBoxDevice` has `ip`/`name`/`mac` — map to existing `DeviceData` shape.

### Sparkline Buffer Preservation (MIG-06)
- **D-07:** Sparkline buffer append logic is shared between WS and HTTP paths. Both append `{ time: Date.now(), mbps: value }` to the same `downloadHistory`/`uploadHistory` state arrays with the same `SPARKLINE_MAX_POINTS` (120) cap.
- **D-08:** On WS→polling transition: no buffer reset. The polling path continues appending to the same arrays. On polling→WS transition: no buffer reset. The WS path continues appending. The history seed (`/api/fritzbox/bandwidth-history?range=1h`) runs once on mount regardless of source.
- **D-09:** The `snapshot` message on subscribe provides immediate data — sparkline gets a point immediately on WS connect, no gap.

### Fritz!Box Side Effects
- **D-10:** Device category enrichment (`enrichDevicesWithCategories`) fires on both WS and HTTP data updates. The `enrichedMacsRef` set ensures idempotent re-enrichment (already-enriched MACs are skipped).
- **D-11:** Health computation runs identically on both WS and HTTP data. The hysteresis refs (`healthRef`, `consecutiveReadingsRef`) persist across source transitions.

### Hue WS Data Mapping
- **D-12:** WS `HueData` has `lights: Record<string, HueLight>` and `groups: Record<string, HueGroup>` (keyed by ID). Convert to arrays in handleMessage: `Object.entries(data.lights).map(([id, light]) => ({ ...light, light_id: id }))` and similar for groups.
- **D-13:** WS `HueLightState` has flat fields (`on`, `bri`, `ct`, `colormode`, `reachable`). The current `useLightsData` expects `HueLight` with `on` as boolean and `brightness` as number. Adapter maps `bri` → `brightness`, keeps `on` as-is.
- **D-14:** Scenes are NOT included in the WS `HueData` payload. Scenes must continue to be fetched via HTTP (`/api/hue/scenes`). Fetch scenes once on mount and on each WS data update (fire-and-forget, since scenes change rarely).

### Hue Connection State
- **D-15:** When WS is OPEN and receiving `hue` topic messages → `connected=true`, `stale=false`. When WS disconnects → fall back to `checkConnection()` via `/api/hue/status` endpoint to determine `connected` and `stale` state.
- **D-16:** Initial `checkConnection()` on mount is preserved — needed for the period before WS connects. Once WS sends first `hue` snapshot, connection state derives from WS.
- **D-17:** The `reconnect` flag handling in HTTP responses (`groupsData.reconnect`) only applies in polling fallback mode.

### WS Subscription Pattern (carried from Phase 140)
- **D-18:** Ref pattern for side-effect functions (enrichDevicesWithCategories, health computation) to avoid stale closures in WS useEffect.
- **D-19:** `subscribe(topic, handleMessage)` in useEffect with `unsubscribe()` cleanup. Dependencies: `[subscribe, unsubscribe]`.

### Claude's Discretion
- Whether to split Fritz!Box WS handling into a helper function or inline in handleMessage
- Whether to create a shared `mapFritzBoxWsData` adapter or inline the mapping
- Whether Hue scenes fetch should be a separate useEffect or triggered inside handleMessage
- Test mocking approach for WS subscribe/unsubscribe in both hooks
- Whether `checkConnection()` still runs periodically in WS mode or only on mount

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### WebSocket Spec
- `docs/api/websocket.md` — Complete WS protocol, FritzBoxData and HueData payload interfaces, snapshot-on-subscribe behavior, reconnection strategy

### WS Infrastructure (Phase 139)
- `lib/hooks/useWebSocketManager.ts` — Shared WS manager: subscribe/unsubscribe API, ReadyState export
- `app/context/WebSocketContext.ts` — WebSocketContext + useWebSocketContext() hook
- `types/websocket.ts` — FritzBoxData, FritzBoxBandwidth, FritzBoxWan, FritzBoxDevice, HueData, HueLight, HueGroup, HueLightState, TopicDataMap

### Phase 140 Reference Implementation
- `app/components/devices/stove/hooks/useStoveData.ts` — Completed WS migration. Shows subscribe/unsubscribe pattern, ref pattern for side-fetches, `isWsConnected ? null : interval` fallback, handleMessage mapping.

### Current Fritz!Box Hook
- `app/components/devices/network/hooks/useNetworkData.ts` — Current polling implementation. Primary migration target. Shows sparkline buffering, health computation, device enrichment, 3-endpoint fetch pattern.
- `app/components/devices/network/networkHealthUtils.ts` — Health computation with hysteresis
- `app/components/devices/network/types.ts` — BandwidthData, DeviceData, WanData, SparklinePoint, UseNetworkDataReturn types

### Current Hue Hook
- `app/components/devices/lights/hooks/useLightsData.ts` — Current polling implementation. Shows checkConnection, fetchData (3-endpoint), group sorting, derived state, dynamic styling.
- `types/hueProxy.ts` — HueLight, HueGroup, HueScene types (HTTP shapes)

### Polling Infrastructure
- `lib/hooks/useAdaptivePolling.ts` — Polling hook with alwaysActive, interval, immediate options. Becomes fallback-only path.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `useWebSocketContext()` — Provides subscribe/unsubscribe/readyState from shared WS manager
- `useAdaptivePolling` — Existing polling hook, becomes fallback path
- `FritzBoxData` / `HueData` (types/websocket.ts) — WS payload types already defined
- Phase 140 `useStoveData` — Reference implementation for WS-primary + polling-fallback pattern
- `enrichDevicesWithCategories` — Existing category enrichment, works with any DeviceData source
- `computeNetworkHealth` — Health computation, works with any data source

### Established Patterns
- **WS subscribe in useEffect** with ref pattern for side-effects (Phase 140)
- **`isWsConnected ? null : interval`** to suppress polling when WS is live
- **Snapshot-on-subscribe** eliminates data gap on WS connect
- **Fire-and-forget enrichment** with idempotent ref tracking

### Integration Points
- `useNetworkData` subscribes to `'fritzbox'` topic
- `useLightsData` subscribes to `'hue'` topic
- No changes to NetworkCard, LightsCard orchestrators — hook interfaces unchanged
- No changes to command hooks (useNetworkCommands, useLightsCommands) — commands stay REST

</code_context>

<specifics>
## Specific Ideas

- Fritz!Box WS sends bandwidth in bps (bits/second) while the HTTP proxy returns Mbps. The conversion factor is 1_000_000. This is critical for sparkline continuity.
- WS `FritzBoxDevice` has `status: 0|1` while HTTP `DeviceData` has `active: boolean`. Need to map `status === 1` → `active: true`.
- WS `HueData.lights` is `Record<string, HueLight>` (keyed by light_id) while the hook uses `HueLight[]` with `light_id` as a property. Same for groups.
- Hue scenes are NOT in the WS payload — they must continue as HTTP fetch.
- The `reconnect` flag in Hue HTTP responses is a proxy health signal that doesn't exist in WS — only relevant in polling fallback mode.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 141-fritz-box-hue-migration*
*Context gathered: 2026-03-27*
