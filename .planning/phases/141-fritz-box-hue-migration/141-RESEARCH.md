# Phase 141: Fritz!Box & Hue Migration - Research

**Researched:** 2026-03-27
**Domain:** WebSocket migration — useNetworkData + useLightsData hooks
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Same fallback pattern as stove: `readyState === OPEN` → WS primary, polling suppressed via `interval: isWsConnected ? null : existingInterval`. When WS disconnects, polling activates immediately.
- **D-02:** Fritz!Box: `alwaysActive: false` preserved (non-safety-critical). Hue: `alwaysActive: false` preserved.
- **D-03:** WS `FritzBoxData` delivers `devices`, `bandwidth`, and `wan` as a single payload. The `handleMessage` callback maps all three to existing state in one pass (vs HTTP's 3 parallel fetches).
- **D-04:** Bandwidth unit conversion: WS provides `upstream_bps`/`downstream_bps` (bits per second). Convert to Mbps (`/ 1_000_000`) in handleMessage to match existing sparkline format (`SparklinePoint.mbps`).
- **D-05:** WAN field mapping: WS `FritzBoxWan.is_connected` → `connected`, `FritzBoxWan.uptime` → `uptime`, `FritzBoxWan.max_downstream_bps` / 1_000_000 → `linkSpeed` (Mbps).
- **D-06:** Device mapping: WS `FritzBoxDevice.status` (0|1) → `active` boolean. WS `FritzBoxDevice` has `ip`/`name`/`mac` — map to existing `DeviceData` shape.
- **D-07:** Sparkline buffer append logic is shared between WS and HTTP paths. Both append `{ time: Date.now(), mbps: value }` to the same `downloadHistory`/`uploadHistory` state arrays with the same `SPARKLINE_MAX_POINTS` (120) cap.
- **D-08:** On WS→polling transition: no buffer reset. The polling path continues appending to the same arrays. On polling→WS transition: no buffer reset. The WS path continues appending. The history seed (`/api/fritzbox/bandwidth-history?range=1h`) runs once on mount regardless of source.
- **D-09:** The `snapshot` message on subscribe provides immediate data — sparkline gets a point immediately on WS connect, no gap.
- **D-10:** Device category enrichment (`enrichDevicesWithCategories`) fires on both WS and HTTP data updates. The `enrichedMacsRef` set ensures idempotent re-enrichment (already-enriched MACs are skipped).
- **D-11:** Health computation runs identically on both WS and HTTP data. The hysteresis refs (`healthRef`, `consecutiveReadingsRef`) persist across source transitions.
- **D-12:** WS `HueData` has `lights: Record<string, HueLight>` and `groups: Record<string, HueGroup>` (keyed by ID). Convert to arrays in handleMessage: `Object.entries(data.lights).map(([id, light]) => ({ ...light, light_id: id }))` and similar for groups.
- **D-13:** WS `HueLightState` has flat fields (`on`, `bri`, `ct`, `colormode`, `reachable`). The current `useLightsData` expects `HueLight` with `on` as boolean and `brightness` as number. Adapter maps `bri` → `brightness`, keeps `on` as-is.
- **D-14:** Scenes are NOT included in the WS `HueData` payload. Scenes must continue to be fetched via HTTP (`/api/hue/scenes`). Fetch scenes once on mount and on each WS data update (fire-and-forget, since scenes change rarely).
- **D-15:** When WS is OPEN and receiving `hue` topic messages → `connected=true`, `stale=false`. When WS disconnects → fall back to `checkConnection()` via `/api/hue/status` endpoint to determine `connected` and `stale` state.
- **D-16:** Initial `checkConnection()` on mount is preserved — needed for the period before WS connects. Once WS sends first `hue` snapshot, connection state derives from WS.
- **D-17:** The `reconnect` flag handling in HTTP responses (`groupsData.reconnect`) only applies in polling fallback mode.
- **D-18:** Ref pattern for side-effect functions (enrichDevicesWithCategories, health computation) to avoid stale closures in WS useEffect.
- **D-19:** `subscribe(topic, handleMessage)` in useEffect with `unsubscribe()` cleanup. Dependencies: `[subscribe, unsubscribe]`.

### Claude's Discretion

- Whether to split Fritz!Box WS handling into a helper function or inline in handleMessage
- Whether to create a shared `mapFritzBoxWsData` adapter or inline the mapping
- Whether Hue scenes fetch should be a separate useEffect or triggered inside handleMessage
- Test mocking approach for WS subscribe/unsubscribe in both hooks
- Whether `checkConnection()` still runs periodically in WS mode or only on mount

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope

</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| MIG-04 | `useNetworkData` riceve dati Fritz!Box (devices, bandwidth, wan) via WebSocket come canale primario | D-03 to D-11, FritzBoxData type fully defined in types/websocket.ts, subscribe('fritzbox', handleMessage) pattern from useStoveData reference |
| MIG-05 | `useNetworkData` fallback automatico a polling HTTP se WebSocket non disponibile | D-01 + D-02: `interval: isWsConnected ? null : interval`, alwaysActive:false preserved, existing fetchData() becomes fallback |
| MIG-06 | Sparkline buffer e bandwidth history preservati durante transizioni WS/polling | D-07 to D-09: shared state arrays, no reset on transition, history seed on mount regardless of source |
| MIG-07 | `useLightsData` riceve dati luci via WebSocket come canale primario | D-12 to D-17, HueData type fully defined, Record→array adapter needed, scenes remain HTTP |
| MIG-08 | `useLightsData` fallback automatico a polling HTTP se WebSocket non disponibile | D-01 + D-02: same fallback pattern, `interval: isWsConnected ? null : (connected ? 60000 : null)` |

</phase_requirements>

## Summary

Phase 141 migrates two polling hooks — `useNetworkData` (Fritz!Box) and `useLightsData` (Hue) — to use WebSocket as the primary data channel, following the exact pattern established by `useStoveData` in Phase 140. The reference implementation is fully committed and readable. Both hooks will import `useWebSocketContext`, obtain `subscribe`/`unsubscribe`/`readyState`, suppress polling when `readyState === OPEN`, and register a `handleMessage` callback that maps WS payload types to existing hook state.

The principal complexity is in data mapping: Fritz!Box WS payloads arrive as a single object with bps units and integer-coded device status, while the hook state uses Mbps and boolean `active`. Hue WS payloads use `Record<string, HueLight>` (dict keyed by ID) while the hook uses flat arrays with `light_id` as a property, and `bri` must be mapped to `brightness`. Neither WS shape changes the public hook interfaces or the UI components consuming them.

Fritz!Box also has a sparkline continuity constraint (MIG-06): both the WS path and the polling path must append to the same `downloadHistory`/`uploadHistory` state arrays without resetting them on source transitions. The history seed on mount is source-agnostic and runs once regardless.

**Primary recommendation:** Mirror `useStoveData` exactly — subscribe in `useEffect([subscribe, unsubscribe])`, ref pattern for side-effect functions, `interval: isWsConnected ? null : existingInterval`, `alwaysActive: false` for both hooks. Inline the WS-to-hook mapping rather than extracting adapters.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| react-use-websocket | existing (installed) | WS connection via shared manager | Already in use via useWebSocketManager |
| useWebSocketContext | project hook | Subscribe/unsubscribe API distribution | Established in Phase 139, used in Phase 140 |
| useAdaptivePolling | project hook | HTTP polling fallback with alwaysActive/interval control | Established pattern, becomes fallback path |
| ReadyState | re-export from useWebSocketManager | WS connection state enum | Type-safe OPEN/CLOSED check |

### No New Dependencies

No new npm packages are required. All needed infrastructure was installed in Phase 139 and the pattern was proven in Phase 140.

## Architecture Patterns

### Recommended Project Structure

No structural changes. Both hooks remain in their current locations:

```
app/components/devices/network/hooks/useNetworkData.ts   ← modify in-place
app/components/devices/lights/hooks/useLightsData.ts     ← modify in-place
__tests__/components/devices/lights/hooks/useLightsData.test.ts   ← add WS tests
app/components/devices/network/__tests__/useNetworkData.test.ts   ← add WS tests
```

### Pattern 1: WS Subscribe in useEffect (from useStoveData)

**What:** Register a `handleMessage` callback for a topic inside `useEffect`. Cleanup calls `unsubscribe`.
**When to use:** Every migrated hook.

```typescript
// Source: app/components/devices/stove/hooks/useStoveData.ts
const { subscribe, unsubscribe, readyState } = useWebSocketContext();
const isWsConnected = readyState === ReadyState.OPEN;

useEffect(() => {
  const handleMessage = (raw: unknown) => {
    const data = raw as FritzBoxData;
    // map fields to state ...
  };
  subscribe('fritzbox', handleMessage);
  return () => { unsubscribe('fritzbox', handleMessage); };
}, [subscribe, unsubscribe]);
```

### Pattern 2: Polling Suppression When WS is Live

**What:** Pass `interval: isWsConnected ? null : existingInterval` to `useAdaptivePolling`. When `null`, `useAdaptivePolling` does not schedule any polling calls.
**When to use:** Both hooks.

```typescript
// Fritz!Box — visibility-aware interval, D-01 + D-02
const isVisible = useVisibility();
const pollInterval = isVisible ? 60000 : 300000;

useAdaptivePolling({
  callback: fetchData,
  interval: isWsConnected ? null : pollInterval,
  alwaysActive: false,
  immediate: true,
  initialDelay: 500,
});
```

```typescript
// Hue — connected-gated interval, D-01 + D-02
useAdaptivePolling({
  callback: fetchData,
  interval: isWsConnected ? null : (connected ? 60000 : null),
  alwaysActive: false,
  immediate: true,
  initialDelay: 100,
});
```

### Pattern 3: Ref Pattern for Side-Effect Functions

**What:** Side-effect functions that are called inside WS `handleMessage` must be wrapped in refs to avoid stale closures. The ref's `.current` is updated on each render.
**When to use:** Fritz!Box uses `enrichDevicesWithCategories` and `computeNetworkHealth` as side effects inside handleMessage.

```typescript
// Source: app/components/devices/stove/hooks/useStoveData.ts
const fetchSchedulerModeRef = useRef(fetchSchedulerMode);
fetchSchedulerModeRef.current = fetchSchedulerMode;

// Inside handleMessage:
void enrichDevicesWithCategoriesRef.current(rawDevices).then(...);
```

### Pattern 4: Fritz!Box WS Payload Mapping (D-03 to D-06)

```typescript
// Source: types/websocket.ts + decisions D-03 to D-06
const handleMessage = (raw: unknown) => {
  const data = raw as FritzBoxData;

  // Bandwidth: bps → Mbps (D-04)
  if (data.bandwidth) {
    const downloadMbps = data.bandwidth.downstream_bps / 1_000_000;
    const uploadMbps = data.bandwidth.upstream_bps / 1_000_000;
    const bw: BandwidthData = { download: downloadMbps, upload: uploadMbps, timestamp: Date.now() };
    setBandwidth(bw);
    bandwidthRef.current = bw;
    // Append to sparkline — same arrays as HTTP path (D-07)
    const now = Date.now();
    setDownloadHistory(prev => [...prev, { time: now, mbps: downloadMbps }].slice(-SPARKLINE_MAX_POINTS));
    setUploadHistory(prev => [...prev, { time: now, mbps: uploadMbps }].slice(-SPARKLINE_MAX_POINTS));
  }

  // WAN: field rename (D-05)
  if (data.wan) {
    const wan: WanData = {
      connected: data.wan.is_connected,
      uptime: data.wan.uptime,
      externalIp: data.wan.external_ip ?? undefined,
      linkSpeed: data.wan.max_downstream_bps / 1_000_000,
      timestamp: Date.now(),
    };
    setWan(wan);
    wanRef.current = wan;
  }

  // Devices: status 0|1 → active boolean (D-06)
  if (data.devices) {
    const rawDevices: DeviceData[] = data.devices.map(d => ({
      id: d.mac,
      name: d.name,
      ip: d.ip,
      mac: d.mac,
      active: d.status === 1,
    }));
    setDevices(rawDevices);
    // Fire-and-forget enrichment (D-10)
    enrichDevicesWithCategoriesRef.current(rawDevices).then(setDevices).catch(() => {});
  }

  setLoading(false);
  setStale(false);
  setLastUpdated(Date.now());
};
```

### Pattern 5: Hue WS Payload Mapping (D-12, D-13, D-14)

```typescript
// Source: types/websocket.ts (HueData, HueLight, HueGroup) + hueProxy.ts (hook shapes)
const handleMessage = (raw: unknown) => {
  const data = raw as HueData;

  // Record → array with light_id injected (D-12, D-13)
  if (data.lights) {
    const lights: HueLight[] = Object.entries(data.lights).map(([id, light]) => ({
      light_id: id,
      name: light.name,
      on: light.state.on,
      brightness: light.state.bri,        // bri → brightness (D-13)
      ct_mirek: light.state.ct,
      ct_kelvin: light.state.ct ? Math.round(1_000_000 / light.state.ct) : null,
      hue: null,
      saturation: null,
      colormode: light.state.colormode,
      reachable: light.state.reachable,
      capability_tier: 'color' as const,  // WS doesn't expose tier — default to 'color'
      room_id: null,
      room_name: null,
      model_id: light.modelid,
      light_type: light.type,
    }));
    setLights(lights);
  }

  if (data.groups) {
    const rawGroups = Object.entries(data.groups).map(([id, group]) => ({
      group_id: id,
      name: group.name,
      type: null,
      group_class: null,
      lights: group.lights,
      any_on: group.state.any_on,
      all_on: group.state.all_on,
      brightness: null,
      color_temp: null,
      colormode: null,
    }));
    // Sort: 'Casa' first (preserving existing HTTP sort logic)
    const sortedGroups = rawGroups.sort((a, b) => {
      if (a.name === 'Casa') return -1;
      if (b.name === 'Casa') return 1;
      return a.name.localeCompare(b.name);
    });
    setGroups(sortedGroups);
  }

  // WS connection established = connected + not stale (D-15)
  setConnected(true);
  setStale(false);
  setLoading(false);

  // Scenes not in WS payload — fire-and-forget HTTP fetch (D-14)
  fetchScenesRef.current();
};
```

### Pattern 6: Hue Connection State Dual-Source (D-15, D-16)

```typescript
// Initial checkConnection on mount is preserved (D-16)
useEffect(() => {
  checkConnection();
}, []);  // eslint-disable-line react-hooks/exhaustive-deps

// WS subscription provides connection state when OPEN (D-15)
// When WS disconnects → polling fallback calls checkConnection via fetchData
```

### Anti-Patterns to Avoid

- **Direct closure over state-setting functions in handleMessage without refs:** Will create stale closures. Use `enrichDevicesWithCategoriesRef.current()`, `computeNetworkHealthRef.current()`.
- **Resetting sparkline buffers on WS connect:** Both paths must append to the same arrays. No `setDownloadHistory([])` on subscription.
- **Calling `checkConnection()` on every WS message:** Only call on mount (D-16). WS message itself implies connection state.
- **Checking `data.lights !== null` without also checking `data.groups !== null`:** Each field is independently nullable per the WS spec — handle them independently.
- **Assuming `FritzBoxDevice.id` field exists:** WS `FritzBoxDevice` only has `ip`, `name`, `mac`, `status`. Use `mac` as the `DeviceData.id`.
- **Assuming `HueLight.capability_tier` is available from WS:** The WS `HueLight` in `types/websocket.ts` does not expose this field. Default to `'color'` in the WS adapter, or omit and handle null.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| WS connection + reconnect | Custom reconnect loop | `useWebSocketContext()` (Phase 139 infrastructure) | Shared manager, exponential backoff, already handles MAX_CONNECTIONS=2 |
| Topic subscription | Custom event bus | `subscribe(topic, cb)` / `unsubscribe(topic, cb)` | Already dispatches to per-topic callbacks, re-subscribes on reconnect |
| Adaptive polling | Custom setTimeout loop | `useAdaptivePolling` with `interval: null` to suppress | `null` interval is the designed off switch |
| Sparkline append | Custom ring buffer | `setState(prev => [...prev, point].slice(-MAX))` | Existing pattern already in useNetworkData |

## Common Pitfalls

### Pitfall 1: WS HueLight.capability_tier Missing

**What goes wrong:** `types/websocket.ts HueLight` does not have `capability_tier` — it's a proxy-added enrichment field from `types/hueProxy.ts`. Trying to spread WS `HueLight` directly onto proxy `HueLight` will cause TypeScript errors.
**Why it happens:** Two different `HueLight` interfaces exist: `types/websocket.ts` (WS shape, raw Bridge) and `types/hueProxy.ts` (proxy shape, enriched). The hook uses the proxy shape.
**How to avoid:** Explicitly construct a proxy `HueLight` object in handleMessage. Default `capability_tier` to `'color'` (most capable) when source is WS. When the polling fallback runs, the proxy returns the enriched shape with the real value.
**Warning signs:** TypeScript error: "Property 'capability_tier' is missing in type..."

### Pitfall 2: Sparkline Buffer Reset on WS Connect

**What goes wrong:** Adding `const [downloadHistory, setDownloadHistory] = useState<SparklinePoint[]>([])` initialization or calling `setDownloadHistory([])` inside the WS subscribe effect will wipe historical data.
**Why it happens:** Temptation to "start fresh" when WS connects. But D-08 explicitly requires no buffer reset.
**How to avoid:** Never reset sparkline state inside the WS `useEffect`. Only the history seed `useEffect` (on mount) ever sets initial values.
**Warning signs:** Sparkline shows gap or restarts from zero whenever WS reconnects.

### Pitfall 3: Stale `downloadHistory` in Health Computation

**What goes wrong:** The WS `handleMessage` closure captures `downloadHistory` and `uploadHistory` at the time the effect ran. If these are read directly inside `handleMessage`, the values will be stale (empty arrays at effect-registration time).
**Why it happens:** React closures capture state values at the time the function is created.
**How to avoid:** Use `useRef` to mirror the history arrays if they must be read inside `handleMessage` for health computation — or restructure health computation to run in a separate `useEffect` watching the state. Alternatively, compute health in a `useEffect` that depends on `[bandwidth, wan]` rather than inside `handleMessage`.
**Warning signs:** `recentDownload` always empty → `historicalAvgSaturation` always undefined.

### Pitfall 4: Hue Polling Interval Double-Gate

**What goes wrong:** Current `useLightsData` already gates polling on `connected`: `interval: connected ? 60000 : null`. When adding the WS gate, the combined expression must be correct: `interval: isWsConnected ? null : (connected ? 60000 : null)`. If written as `interval: isWsConnected || !connected ? null : 60000`, the logic is the same but less readable.
**Why it happens:** Two boolean conditions interact on the interval value.
**How to avoid:** Express as explicit ternary chain: WS first gate, then connection second gate.
**Warning signs:** Polling continues during WS active session, or polling never activates during WS-down + connected state.

### Pitfall 5: Fritz!Box `id` Field in DeviceData

**What goes wrong:** `DeviceData.id` is required as string. WS `FritzBoxDevice` does not have an `id` field — it has `mac`. HTTP `/api/fritzbox/devices` returns `DeviceData` with `id` already set.
**Why it happens:** WS is a raw Bridge API mirror; HTTP proxy is enriched.
**How to avoid:** In WS mapping, set `id: d.mac` (MAC as ID). This matches the HTTP proxy's observed behavior where MAC is unique per device.
**Warning signs:** TypeScript error: "Property 'id' is missing..."

### Pitfall 6: Test Mock for WS Context

**What goes wrong:** Not mocking `useWebSocketContext` in tests causes the hook to throw "useWebSocketContext must be used within a WebSocketProvider".
**Why it happens:** `useWebSocketContext()` throws if called outside a provider.
**How to avoid:** Follow the pattern from `useStoveData.test.ts`:
```typescript
jest.mock('@/app/context/WebSocketContext');
jest.mocked(useWebSocketContext).mockReturnValue({
  subscribe: mockSubscribe,
  unsubscribe: mockUnsubscribe,
  readyState: ReadyState.CLOSED,
});
```
**Warning signs:** "useWebSocketContext must be used within a WebSocketProvider" in test output.

## Code Examples

### Fritz!Box: WS Context Import and Fallback Setup

```typescript
// Source: app/components/devices/stove/hooks/useStoveData.ts (Phase 140)
import { useWebSocketContext } from '@/app/context/WebSocketContext';
import { ReadyState } from '@/lib/hooks/useWebSocketManager';
import type { FritzBoxData } from '@/types/websocket';

// Inside useNetworkData():
const { subscribe, unsubscribe, readyState } = useWebSocketContext();
const isWsConnected = readyState === ReadyState.OPEN;

// Polling fallback — visibility-aware interval suppressed when WS live
const isVisible = useVisibility();
const interval = isVisible ? 60000 : 300000;

useAdaptivePolling({
  callback: fetchData,
  interval: isWsConnected ? null : interval,  // D-01
  alwaysActive: false,  // D-02
  immediate: true,
  initialDelay: 500,
});
```

### Fritz!Box: Sparkline Continuity Pattern

```typescript
// Source: app/components/devices/network/hooks/useNetworkData.ts (existing)
// History seed — runs once on mount, source-agnostic (D-08)
useEffect(() => {
  const loadHistory = async () => { /* existing implementation */ };
  void loadHistory();
}, []);

// WS handleMessage — appends to SAME arrays (D-07)
if (data.bandwidth) {
  const downloadMbps = data.bandwidth.downstream_bps / 1_000_000;
  const uploadMbps = data.bandwidth.upstream_bps / 1_000_000;
  const now = Date.now();
  setDownloadHistory(prev => [...prev, { time: now, mbps: downloadMbps }].slice(-SPARKLINE_MAX_POINTS));
  setUploadHistory(prev => [...prev, { time: now, mbps: uploadMbps }].slice(-SPARKLINE_MAX_POINTS));
}

// HTTP fetchData — appends to SAME arrays (existing, unchanged)
setDownloadHistory(prev => [...prev, { time: now, mbps: bw.download }].slice(-SPARKLINE_MAX_POINTS));
```

### Hue: Scenes Fire-and-Forget in WS Path (D-14)

```typescript
// Source: decision D-14
// Scenes ref to avoid stale closure
const fetchScenesRef = useRef(fetchScenes);
fetchScenesRef.current = fetchScenes;

async function fetchScenes() {
  try {
    const res = await fetch('/api/hue/scenes');
    if (!res.ok) return;
    const data = await res.json() as { scenes?: HueScene[] };
    setScenes(data.scenes ?? []);
  } catch {
    // Silent failure — scenes rarely change
  }
}

// Inside WS handleMessage (after lights/groups processing):
void fetchScenesRef.current();
```

### Test Pattern: Capturing WS Callback

```typescript
// Source: __tests__/components/devices/stove/hooks/useStoveData.test.ts
let capturedCallback: ((data: unknown) => void) | null = null;
mockSubscribe.mockImplementation((_topic: string, cb: (data: unknown) => void) => {
  capturedCallback = cb;
});

const { result } = renderHook(() => useNetworkData());

await act(async () => {
  capturedCallback?.({
    devices: [{ ip: '192.168.1.1', name: 'Test', mac: 'AA:BB:CC', status: 1 }],
    bandwidth: { upstream_bps: 1_000_000, downstream_bps: 50_000_000, bytes_sent: 0, bytes_received: 0 },
    wan: { is_connected: true, is_linked: true, uptime: 3600, external_ip: '1.2.3.4', max_upstream_bps: 50_000_000, max_downstream_bps: 250_000_000 },
  });
});
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| HTTP-only polling (60s/5min) | WS primary + HTTP fallback | Phase 140 (stove), Phase 141 (fritz+hue) | Faster updates, reduced server load |
| `useAdaptivePolling` always active | `interval: null` when WS live | Phase 140 | Single control point for suppression |
| Separate fetch per endpoint (3× for Fritz!Box) | Single WS message delivers all three | Phase 141 | Reduced network calls, atomic updates |

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Jest + @testing-library/react |
| Config file | jest.config.ts |
| Quick run command | `npm test -- --testPathPattern="useNetworkData|useLightsData" --no-coverage` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| MIG-04 | subscribes to 'fritzbox' topic | unit | `npm test -- --testPathPattern="useNetworkData" --no-coverage` | Already exists (add WS describe block) |
| MIG-04 | handleMessage maps bps→Mbps, status→active | unit | same | Already exists (add WS describe block) |
| MIG-04 | handleMessage triggers category enrichment | unit | same | Already exists (add WS describe block) |
| MIG-05 | interval=null when WS OPEN | unit | same | Already exists (add WS describe block) |
| MIG-05 | interval=60000 when WS CLOSED + visible | unit | same | Already exists (add WS describe block) |
| MIG-05 | alwaysActive=false preserved | unit | same | Already exists (add WS describe block) |
| MIG-06 | WS appends to existing sparkline arrays (no reset) | unit | same | Already exists (add WS describe block) |
| MIG-06 | history seed useEffect unaffected by WS state | unit | same | Already exists (add WS describe block) |
| MIG-07 | subscribes to 'hue' topic | unit | `npm test -- --testPathPattern="useLightsData" --no-coverage` | Already exists (add WS describe block) |
| MIG-07 | handleMessage maps Record→array, bri→brightness | unit | same | Already exists (add WS describe block) |
| MIG-07 | connected=true + stale=false on WS message | unit | same | Already exists (add WS describe block) |
| MIG-07 | scenes fetched fire-and-forget on WS message | unit | same | Already exists (add WS describe block) |
| MIG-08 | interval=null when WS OPEN | unit | same | Already exists (add WS describe block) |
| MIG-08 | polling activates when WS CLOSED + connected | unit | same | Already exists (add WS describe block) |

### Sampling Rate

- **Per task commit:** `npm test -- --testPathPattern="useNetworkData|useLightsData" --no-coverage`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps

None — existing test infrastructure covers all phase requirements. Both test files already exist and follow the established mock pattern. Only new `describe('WebSocket integration', ...)` blocks need to be added to each file, following the pattern from `useStoveData.test.ts`.

## Open Questions

1. **Hue `capability_tier` default in WS adapter**
   - What we know: WS `HueLight` does not expose `capability_tier`. Proxy HTTP `/api/hue/lights` returns it as an enriched field.
   - What's unclear: Whether defaulting to `'color'` will cause visual issues for white-only or ambiance bulbs that then fall back to polling.
   - Recommendation: Default to `'color'` in WS adapter. The supportsColor() function in colorUtils uses this for UI decisions. A white bulb with tier='color' will display color controls momentarily but this is acceptable given the polling fallback refreshes the correct tier within 60s. Alternatively, derive from `light.state.colormode`: `null` → `'white'`, `ct` → `'ambiance'`, `hs`/`xy` → `'color'`.

2. **Fritz!Box health computation with stale sparkline in handleMessage**
   - What we know: `computeNetworkHealth` takes `historicalAvgSaturation` derived from `downloadHistory`/`uploadHistory` state. Reading state inside a `handleMessage` closure captures stale values.
   - What's unclear: Whether the planner should restructure health computation into a separate `useEffect` watching `[bandwidth, wan]` or use a sparkline ref.
   - Recommendation: Move health computation out of `handleMessage`. Use a `useEffect` that depends on `[bandwidth, wan, downloadHistory, uploadHistory]` — runs whenever any of these update, covers both WS and HTTP paths identically. This is simpler and avoids the stale-closure problem entirely.

## Sources

### Primary (HIGH confidence)

- `app/components/devices/stove/hooks/useStoveData.ts` — Direct reference implementation read in full
- `lib/hooks/useWebSocketManager.ts` — subscribe/unsubscribe/readyState API read in full
- `app/context/WebSocketContext.ts` — useWebSocketContext hook read in full
- `types/websocket.ts` — FritzBoxData, HueData and all sub-interfaces read in full
- `docs/api/websocket.md` — WS protocol, payload examples, nullability rules read in full
- `app/components/devices/network/hooks/useNetworkData.ts` — Current implementation read in full
- `app/components/devices/lights/hooks/useLightsData.ts` — Current implementation read in full
- `app/components/devices/network/types.ts` — BandwidthData, DeviceData, WanData shapes read in full
- `types/hueProxy.ts` — HueLight (proxy shape) read in full
- `__tests__/components/devices/stove/hooks/useStoveData.test.ts` — Full WS test pattern read

### Secondary (MEDIUM confidence)

- `.planning/phases/141-fritz-box-hue-migration/141-CONTEXT.md` — All decisions and specifics
- `.planning/REQUIREMENTS.md` — MIG-04 through MIG-08 requirements

## Project Constraints (from CLAUDE.md)

- **NEVER** break existing functionality — hook public interfaces are frozen
- **WAIT** for user confirmation before version updates — no new dependencies
- **PREFER** editing existing files over creating new — modify hooks in-place
- **NEVER** execute `npm run build` or `npm install`
- **ALWAYS** create/update unit tests — WS describe blocks required in both test files
- **USE** design system — no UI changes, not applicable
- **NEVER** commit/push without explicit request

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all infrastructure verified by reading source files
- Architecture: HIGH — reference implementation exists and was read in full
- Pitfalls: HIGH — derived from type system analysis and direct code reading
- Test patterns: HIGH — useStoveData.test.ts read in full, exact mock patterns documented

**Research date:** 2026-03-27
**Valid until:** 2026-04-27 (stable internal codebase, no external dependencies)
