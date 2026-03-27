# Phase 142: Sonos & DIRIGERA Migration - Research

**Researched:** 2026-03-27
**Domain:** React hook WS migration (useSonosData, useDirigeraData)
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Same pattern as stove/fritzbox/hue: `readyState === OPEN` → WS primary, polling suppressed via `interval: isWsConnected ? null : existingInterval`. When WS disconnects, polling activates immediately.
- **D-02:** Both Sonos and DIRIGERA: `alwaysActive: false` preserved (non-safety-critical, matches current behavior).
- **D-03:** WS `SonosData` provides `speakers: SonosSpeaker[]` and `groups: SonosGroup[]`. The `groups` array maps directly to the current `zones` concept — both have `group_id`, `label`, `coordinator_uid`, `coordinator_name`, `member_count`, `members`. Use groups as zones directly.
- **D-04:** Derive `speakerCount` from `speakers.length` and `zoneCount` from `groups.length` in the handleMessage callback.
- **D-05:** `nowPlaying` (playback state) is NOT included in the WS `sonos` topic payload. Playback must continue as HTTP side-fetch: fetch playback for up to 5 zones after each WS data update. Same fire-and-forget pattern as stove's scheduler/maintenance.
- **D-06:** `health` (SonosHealthResponse: connected, data_freshness, device_count) is NOT included in the WS payload. Health must continue as HTTP side-fetch on mount and after each data update.
- **D-07:** WS `DirigeraData` provides `sensors: DirigeraSensor[]`. The summary stats (`total_sensors`, `offline_count`, `low_battery_count`, `open_count`) are computed in-hook from the raw sensors array — no HTTP call to `/api/dirigera/sensors/summary` needed when WS is active.
- **D-08:** Summary derivation logic: `total_sensors = sensors.length`, `offline_count = sensors.filter(s => !s.is_reachable).length`, `low_battery_count = sensors.filter(s => s.battery_percentage !== null && s.battery_percentage <= 20).length`, `open_count = sensors.filter(s => s.type === 'openCloseSensor' && s.is_open).length`.
- **D-09:** `health` (DirigeraHealthResponse: firmware_version, connected_sensors, is_reachable) is NOT included in the WS payload. Health must continue as HTTP side-fetch on mount and after each data update.
- **D-10:** The `computeDirigeraHealth` function continues to work from the summary — either WS-derived or HTTP-fetched — no change needed.
- **D-11:** Side-fetches (Sonos health + playback, DIRIGERA health) fire on mount AND after each data update regardless of source (WS or HTTP). Same pattern as stove's `fetchSchedulerMode` / `fetchMaintenanceStatus`.
- **D-12:** Side-fetches use ref pattern to avoid stale closures in WS useEffect callbacks.
- **D-13:** WS messages: `isStale=false`, use message `ts` field as freshness indicator. HTTP polling: continue using existing error/success logic for staleness.
- **D-14:** When WS is connected and sending data, health side-fetch staleness fields (`data_freshness`) are ignored in favor of WS-derived freshness.
- **D-15:** `subscribe('sonos', handleMessage)` / `subscribe('dirigera', handleMessage)` in useEffect with `unsubscribe()` cleanup.
- **D-16:** Ref pattern for side-effect functions to avoid stale closures.

### Claude's Discretion

- Whether to create helper adapter functions or inline mapping in handleMessage
- Whether Sonos playback side-fetch should be a separate useEffect or triggered inside handleMessage
- Whether DIRIGERA summary derivation should be a standalone utility function or inline
- Test mocking approach for WS subscribe/unsubscribe in both hooks
- Whether to keep the visibility-based interval adjustment (`isVisible ? 60000 : 300000`) in fallback mode or use a fixed interval

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| MIG-09 | `useSonosData` riceve dati Sonos (speakers, groups) via WebSocket come canale primario | WS `SonosData` type already defined in `types/websocket.ts`; groups→zones direct passthrough per D-03; subscribe/unsubscribe pattern established in Phase 140/141 |
| MIG-10 | `useSonosData` fallback automatico a polling HTTP se WebSocket non disponibile | `isWsConnected ? null : interval` pattern from useStoveData/useNetworkData; alwaysActive:false per D-02 |
| MIG-11 | `useDirigeraData` riceve dati sensori via WebSocket come canale primario | WS `DirigeraData.sensors` maps to existing hook via inline summary computation per D-07/D-08 |
| MIG-12 | `useDirigeraData` fallback automatico a polling HTTP se WebSocket non disponibile | Same `isWsConnected ? null : interval` gate; existing fetchData path unchanged as fallback |
</phase_requirements>

---

## Summary

Phase 142 migrates `useSonosData` and `useDirigeraData` from HTTP-only polling to WebSocket-primary with HTTP polling fallback. The pattern is identical to Phase 140 (stove) and Phase 141 (Fritz!Box + Hue), which provide working reference implementations in the codebase. Both hooks keep their public interfaces (`UseSonosDataReturn`, `UseDirigeraDataReturn`) unchanged — only the internal data-fetching mechanism changes.

Sonos is the more complex of the two migrations: the WS payload provides speakers and groups directly (mapping straight to zones without adaptation), but playback state and health are absent from the WS payload and must remain as HTTP side-fetches fired after each WS data update. The side-fetch pattern is already established in useStoveData (fetchSchedulerMode, fetchMaintenanceStatus) and in useLightsData (fetchScenes), making this a direct application.

DIRIGERA is the simpler migration: the WS payload provides the full `sensors` array from which all four summary stats (`total_sensors`, `offline_count`, `low_battery_count`, `open_count`) can be derived in-hook, eliminating the `/api/dirigera/sensors/summary` HTTP call when WS is active. Health remains an HTTP side-fetch. The existing `computeDirigeraHealth` function works unchanged from either a WS-derived or HTTP-fetched summary.

**Primary recommendation:** Apply the Phase 141 `useLightsData` pattern as the primary template (conditional WS subscription on `isWsConnected`, ref pattern for side-fetches, `isWsConnected ? null : interval` for polling gate). Split into two separate plans — one per hook — for parallel execution.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| react-use-websocket | installed | WS connection (via shared manager) | Project standard — useWebSocketManager wraps it |
| React (useState, useEffect, useRef) | 18.x | State management + side effects | Framework requirement |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| useWebSocketContext | internal | Access subscribe/unsubscribe/readyState | All WS-migrated hooks |
| useAdaptivePolling | internal | HTTP polling fallback | When `isWsConnected === false` |
| useVisibility | internal | Tab visibility for polling interval scaling | Preserve existing visibility-aware interval logic |
| ReadyState | re-exported from react-use-websocket | WS state enum | `readyState === ReadyState.OPEN` check |

No new packages needed. All infrastructure is in place from Phase 139/140/141.

---

## Architecture Patterns

### Recommended Structure (both hooks follow this shape)

```
Hook
├── WS context import (useWebSocketContext)
├── State declarations (unchanged from current)
├── Side-fetch functions (health, playback)
├── Refs for side-fetch functions (stale-closure safety)
├── WS useEffect (conditional on isWsConnected)
│   └── handleMessage → setState + fire side-fetches via refs
├── HTTP fetchData (unchanged polling callback)
└── useAdaptivePolling (interval: isWsConnected ? null : existingInterval)
```

### Pattern 1: Conditional WS Subscription (Phase 141 style)

**What:** Guard the WS useEffect with `if (!isWsConnected) return` to prevent spurious subscribe calls when connection is CLOSED.

**When to use:** For non-safety-critical hooks (alwaysActive:false). Phase 141 established this as the standard for all post-stove migrations.

```typescript
// Source: app/components/devices/lights/hooks/useLightsData.ts
useEffect(() => {
  if (!isWsConnected) return;

  const handleMessage = (raw: unknown) => {
    const data = raw as SonosData; // or DirigeraData
    // ... map WS fields to state
    setStale(false);
    void fetchHealthRef.current();
  };

  subscribe('sonos', handleMessage);
  return () => { unsubscribe('sonos', handleMessage); };
}, [isWsConnected, subscribe, unsubscribe]);
```

### Pattern 2: Ref Pattern for Side-Fetch Functions

**What:** Capture side-fetch async functions in refs before the WS useEffect, then call via ref inside the handler. Prevents stale closure over component state.

**When to use:** Every time a WS handleMessage needs to call an async function that reads or updates state.

```typescript
// Source: app/components/devices/stove/hooks/useStoveData.ts
const fetchSchedulerModeRef = useRef(fetchSchedulerMode);
fetchSchedulerModeRef.current = fetchSchedulerMode;

// Inside WS useEffect handleMessage:
void fetchSchedulerModeRef.current();
```

### Pattern 3: Polling Gate

**What:** Pass `interval: isWsConnected ? null : existingInterval` to useAdaptivePolling. A null interval disables polling; restoring the interval re-enables it immediately on WS disconnect.

**When to use:** All WS-migrated hooks.

```typescript
// Source: app/components/devices/lights/hooks/useLightsData.ts
useAdaptivePolling({
  callback: fetchData,
  interval: isWsConnected ? null : (connected ? 60000 : null),
  alwaysActive: false,
  immediate: true,
  initialDelay: 100,
});
```

For Sonos, the condition simplifies to: `interval: isWsConnected ? null : interval` (where `interval = isVisible ? 60000 : 300000`).
For DIRIGERA, same pattern: `interval: isWsConnected ? null : interval`.

### Pattern 4: WS Data → State Mapping (Sonos)

**What:** Map `SonosData.groups` directly to the `zones` state variable (field names are identical). Derive `speakerCount` and `zoneCount` inline.

```typescript
// Source: types/websocket.ts (SonosData) + types/sonosProxy.ts (SonosZoneResponse)
// SonosGroup and SonosZoneResponse share: group_id, label, coordinator_uid,
// coordinator_name, member_count, members
const data = raw as SonosData;
const zones = data.groups ?? [];
const speakerCount = data.speakers?.length ?? 0;
const zoneCount = zones.length;
// setData({ ...currentData, zones, speakerCount, zoneCount })
```

### Pattern 5: WS Data → State Mapping (DIRIGERA)

**What:** Compute the four summary stats from the raw `sensors` array. Use discriminated union on `type` field for `open_count` (only `openCloseSensor` has `is_open`).

```typescript
// Source: 142-CONTEXT.md D-08 + types/websocket.ts (DirigeraContactSensor)
const sensors = data.sensors ?? [];
const summary: SensorSummaryResponse = {
  total_sensors: sensors.length,
  offline_count: sensors.filter(s => !s.is_reachable).length,
  low_battery_count: sensors.filter(
    s => s.battery_percentage !== null && s.battery_percentage <= 20
  ).length,
  open_count: sensors.filter(
    s => s.type === 'openCloseSensor' && (s as DirigeraContactSensor).is_open
  ).length,
  is_stale: false,
};
```

Note: `DirigeraContactSensor` from `types/websocket.ts` has `is_open: boolean`. The local `DirigeraSensor` from `types/dirigeraProxy.ts` has `is_open: boolean | null`. The WS type is the source of truth for the WS path — cast via `as DirigeraContactSensor` after the `type === 'openCloseSensor'` guard.

### Pattern 6: Sonos Playback Side-Fetch After WS Update

**What:** After receiving WS data and updating zones state, fire-and-forget fetch of playback for up to 5 zones. Pick "most interesting" zone (first PLAYING, else first available). Trigger inside handleMessage via ref.

**Key insight:** The playback side-fetch must read the zones derived from the WS message, not from component state (which may be stale). Pass the freshly-mapped zones array directly into the side-fetch call, or capture the computed zones in the ref-based callback.

**Recommended approach (Claude's discretion):** Trigger playback fetch inside handleMessage with the freshly-computed zones passed as argument, avoiding any state dependency:

```typescript
const fetchPlaybackRef = useRef(fetchPlayback);
fetchPlaybackRef.current = fetchPlayback;

// Inside handleMessage, after computing zones:
void fetchPlaybackRef.current(zones);
```

### Anti-Patterns to Avoid

- **Subscribing unconditionally:** `useEffect(() => { subscribe(...) }, [subscribe, unsubscribe])` — fires on CLOSED state, creating dead subscriptions. Use `if (!isWsConnected) return` guard (Phase 141 lesson).
- **Calling async functions directly in WS useEffect:** Instead of `void fetchHealth()`, use `void fetchHealthRef.current()` to avoid stale closure over state-derived values.
- **Deriving speakerCount from `health.device_count` on WS path:** In WS mode health is a side-fetch, not guaranteed to be fresh at WS message time. Use `speakers.length` directly from the WS payload (D-04).
- **Calling `/api/dirigera/sensors/summary` when WS is connected:** WS provides raw sensors; derive summary in-hook per D-07. The HTTP summary endpoint is only used in the fallback polling path.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| WS connection management | Custom WS client | `useWebSocketContext()` | Single shared connection, max 2 connections limit |
| Reconnection + backoff | Custom retry logic | Built into useWebSocketManager | Already handles 1s→30s exponential backoff, re-subscribe on reconnect |
| Polling fallback | Custom interval logic | `useAdaptivePolling` with null interval | Handles visibility, alwaysActive, immediate, initialDelay |
| Type-safe topic dispatch | Manual switch/case | Existing `subscribe(topic, cb)` with `TopicCallback` | Already type-safe via TopicDataMap |

---

## Common Pitfalls

### Pitfall 1: WS Hook Receives Wrong `zones` Type

**What goes wrong:** `SonosGroup` (from `types/websocket.ts`) and `SonosZoneResponse` (from `types/sonosProxy.ts`) are structurally identical but nominally different. TypeScript will reject direct assignment to `zones: SonosZoneResponse[]` from `groups: SonosGroup[]`.

**Why it happens:** The HTTP path uses `SonosZoneResponse[]` in `SonosData.zones`; the WS path produces `SonosGroup[]`. Both shapes are identical at runtime, but TypeScript nominal checking flags the mismatch.

**How to avoid:** Use the WS types (`SonosGroup[]`) as the source of truth on the WS path. Either cast (`data.groups as SonosZoneResponse[]`) or align the internal state type. The CONTEXT.md confirms field parity: "WS `SonosData.groups` structure is identical to HTTP `SonosZoneResponse[]` — both have `group_id`, `label`, `coordinator_uid`, `coordinator_name`, `member_count`, `members`."

**Warning signs:** `Type 'SonosGroup[]' is not assignable to type 'SonosZoneResponse[]'` — handle with `as SonosZoneResponse[]` cast since field alignment is confirmed.

### Pitfall 2: DIRIGERA `is_open` Type Mismatch Between WS and Proxy Types

**What goes wrong:** `types/websocket.ts` `DirigeraContactSensor.is_open` is `boolean` (non-nullable). `types/dirigeraProxy.ts` `DirigeraSensor.is_open` is `boolean | null`. When deriving `open_count` from WS data, accessing `s.is_open` on the base `DirigeraSensor` union type may require explicit narrowing.

**Why it happens:** The WS spec and proxy spec diverge on nullability for this field.

**How to avoid:** After the `type === 'openCloseSensor'` type guard, cast to `DirigeraContactSensor` from `types/websocket.ts` to get the non-nullable `is_open: boolean`. This is safe because the WS type guarantees this field is boolean for contact sensors.

### Pitfall 3: Sonos Playback Side-Fetch Reads Stale Zones from State

**What goes wrong:** The playback fetch needs to know the current zones to call `Promise.allSettled(zones.slice(0, 5).map(...))`. If the fetch function reads `zones` from React state, it captures the stale value at the time the ref was last updated (which may be before the WS message updated state).

**Why it happens:** React state updates are asynchronous; inside a ref-captured function, `zones` from useState will be the value at the time the function was defined, not when called.

**How to avoid:** Either (a) pass fresh zones as a parameter to the playback fetch function (recommended), or (b) maintain a `zonesRef` parallel to the zones state to hold the current value. Pattern (a) is simpler for this phase.

### Pitfall 4: Stale WS Subscription After `isWsConnected` Changes

**What goes wrong:** If `isWsConnected` is added to the useEffect dependency array, the effect re-runs on every WS state change. When WS reconnects (CLOSED → OPEN), the cleanup runs first (unsubscribe), then subscribe fires again — which is correct. But if the dependency array is missing `isWsConnected`, the conditional `if (!isWsConnected) return` never re-evaluates on reconnect and the hook never subscribes.

**Why it happens:** `isWsConnected` must be in the dependency array for the conditional guard to work correctly.

**How to avoid:** Match Phase 141 pattern: `}, [isWsConnected, subscribe, unsubscribe]);` — all three in deps. The `if (!isWsConnected) return` early exit ensures no spurious subscribe when CLOSED.

### Pitfall 5: Health Side-Fetch Clobbers WS Freshness

**What goes wrong:** After receiving a WS message and setting `stale: false`, the health side-fetch completes and sets `stale` based on `health.data_freshness`. This can re-introduce stale state even though WS data is fresh.

**Why it happens:** The HTTP health endpoint returns `data_freshness: 'STALE'` if the HA proxy's cache is stale, regardless of WS connectivity.

**How to avoid:** Per D-14, when WS is connected, ignore `data_freshness` from health responses when setting staleness. Use a `isWsConnected` guard in the health side-fetch update logic, or simply do not update `stale` from health when WS is OPEN.

---

## Code Examples

### useSonosData — WS Subscription Block

```typescript
// Source: 142-CONTEXT.md decisions + useLightsData.ts pattern
// Refs for side-fetches (before useEffect):
const fetchHealthRef = useRef(fetchHealth);
fetchHealthRef.current = fetchHealth;
const fetchPlaybackRef = useRef(fetchPlayback);
fetchPlaybackRef.current = fetchPlayback;

// WS subscription:
useEffect(() => {
  if (!isWsConnected) return;

  const handleMessage = (raw: unknown) => {
    const data = raw as SonosData;

    // D-03: groups → zones (identical shape, cast safe)
    const zones = (data.groups ?? []) as SonosZoneResponse[];
    // D-04: derive counts from WS arrays, not from health
    const speakerCount = data.speakers?.length ?? 0;
    const zoneCount = zones.length;

    // Preserve health and nowPlaying from previous state (side-fetched)
    setData(prev => prev
      ? { ...prev, zones, speakerCount, zoneCount }
      : { health: defaultHealth, zones, speakerCount, zoneCount, nowPlaying: null }
    );
    setStale(false);      // D-13: WS messages are always fresh

    // D-05: playback not in WS — side-fetch fire-and-forget
    void fetchPlaybackRef.current(zones);
    // D-06: health not in WS — side-fetch fire-and-forget
    void fetchHealthRef.current();
  };

  subscribe('sonos', handleMessage);
  return () => { unsubscribe('sonos', handleMessage); };
}, [isWsConnected, subscribe, unsubscribe]);
```

### useDirigeraData — WS Subscription Block

```typescript
// Source: 142-CONTEXT.md D-07/D-08 + useLightsData.ts pattern
// Import WS type alongside proxy type:
import type { DirigeraData, DirigeraContactSensor } from '@/types/websocket';

// Refs for side-fetches (before useEffect):
const fetchHealthRef = useRef(fetchHealth);
fetchHealthRef.current = fetchHealth;

// WS subscription:
useEffect(() => {
  if (!isWsConnected) return;

  const handleMessage = (raw: unknown) => {
    const data = raw as DirigeraData;
    const sensors = data.sensors ?? [];

    // D-07/D-08: derive summary from raw sensors (no HTTP call)
    const summary: SensorSummaryResponse = {
      total_sensors: sensors.length,
      offline_count: sensors.filter(s => !s.is_reachable).length,
      low_battery_count: sensors.filter(
        s => s.battery_percentage !== null && s.battery_percentage <= 20
      ).length,
      open_count: sensors.filter(
        s => s.type === 'openCloseSensor' && (s as DirigeraContactSensor).is_open
      ).length,
      is_stale: false,
    };

    setData(prev => prev
      ? { ...prev, summary }
      : { health: defaultHealth, summary }
    );
    setStale(false);

    // D-09: health not in WS — side-fetch fire-and-forget
    void fetchHealthRef.current();
  };

  subscribe('dirigera', handleMessage);
  return () => { unsubscribe('dirigera', handleMessage); };
}, [isWsConnected, subscribe, unsubscribe]);
```

### Test Pattern — Mock useWebSocketContext

```typescript
// Source: app/components/devices/network/__tests__/useNetworkData.test.ts
jest.mock('@/app/context/WebSocketContext');
import { useWebSocketContext } from '@/app/context/WebSocketContext';

let mockSubscribe: jest.Mock;
let mockUnsubscribe: jest.Mock;

beforeEach(() => {
  mockSubscribe = jest.fn();
  mockUnsubscribe = jest.fn();

  // Default: WS disconnected (existing HTTP tests unaffected)
  jest.mocked(useWebSocketContext).mockReturnValue({
    subscribe: mockSubscribe,
    unsubscribe: mockUnsubscribe,
    readyState: ReadyState.CLOSED,
  });
});

// Test WS path: set OPEN and trigger handleMessage
jest.mocked(useWebSocketContext).mockReturnValue({
  subscribe: mockSubscribe,
  unsubscribe: mockUnsubscribe,
  readyState: ReadyState.OPEN,
});

// Capture handleMessage from subscribe call:
const handleMessage = mockSubscribe.mock.calls[0]?.[1] as (data: unknown) => void;
act(() => { handleMessage(mockWsPayload); });
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| HTTP polling only (60s/300s) | WS primary + polling fallback | Phase 139-142 | Near-real-time updates without polling overhead |
| Direct fetch in polling callback | WS subscribe + side-fetches for partial data | Phase 140 | Reduces HTTP calls when WS connected |
| Single data source per hook | WS primary / HTTP fallback with shared state | Phase 140 | Seamless degradation on WS disconnect |

**Established in Phase 141 (directly applicable):**
- Conditional WS subscription (`if (!isWsConnected) return`) is standard for alwaysActive:false hooks
- Health computation in separate useEffect watching state fields runs on both WS and HTTP data sources
- `capability_tier` defaults pattern not needed for Sonos/DIRIGERA (no equivalent field gap)

---

## Open Questions

1. **Sonos playback side-fetch: separate useEffect or inside handleMessage?**
   - What we know: Both approaches work; Phase 141 used inline fire-and-forget inside handleMessage for scenes.
   - What's unclear: Whether triggering from inside handleMessage vs a separate useEffect on zones state is cleaner.
   - Recommendation: Inline inside handleMessage (matching useLightsData scenes pattern, simpler, avoids extra useEffect dependency tracking). Pass zones as parameter to avoid stale state reads.

2. **DIRIGERA summary derivation: standalone utility or inline?**
   - What we know: The derivation is 4 filter operations (~8 lines). computeDirigeraHealth is already standalone.
   - Recommendation: Inline in handleMessage for consistency with D-08 spec. If the same logic is needed elsewhere in future, extract then.

3. **Visibility-based interval in Sonos/DIRIGERA fallback mode?**
   - What we know: Current hooks use `isVisible ? 60000 : 300000`. D-02 says alwaysActive:false.
   - Recommendation: Preserve visibility-aware interval (matches current behavior, no regression risk).

---

## Environment Availability

Step 2.6: SKIPPED — Phase 142 is a code-only change to existing hooks. No new external dependencies are introduced. All libraries (react-use-websocket, useAdaptivePolling, useWebSocketContext) are already installed and in use from Phase 139/140/141.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Jest + @testing-library/react |
| Config file | `jest.config.ts` (project root) |
| Quick run command | `npm test -- --testPathPattern="useSonosData\|useDirigeraData" --no-coverage` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| MIG-09 | `useSonosData` receives WS data for speakers/groups | unit | `npm test -- --testPathPattern="useSonosData" --no-coverage` | Exists (needs new WS tests added) |
| MIG-10 | `useSonosData` falls back to HTTP polling when WS unavailable | unit | `npm test -- --testPathPattern="useSonosData" --no-coverage` | Exists (needs new WS tests added) |
| MIG-11 | `useDirigeraData` receives WS data for sensors | unit | `npm test -- --testPathPattern="useDirigeraData" --no-coverage` | Does not exist — Wave 0 gap |
| MIG-12 | `useDirigeraData` falls back to HTTP polling when WS unavailable | unit | `npm test -- --testPathPattern="useDirigeraData" --no-coverage` | Does not exist — Wave 0 gap |

### Sampling Rate

- **Per task commit:** `npm test -- --testPathPattern="useSonosData\|useDirigeraData" --no-coverage`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `app/components/devices/dirigera/hooks/__tests__/useDirigeraData.test.ts` — covers MIG-11 and MIG-12 (no existing test file for this hook; must be created)
- [ ] WS test cases in `app/components/devices/sonos/hooks/__tests__/useSonosData.test.ts` — existing file tests HTTP path only; must add WS-path cases (subscribe called when OPEN, handleMessage maps groups→zones, side-fetches fire, polling suppressed when WS connected)

---

## Sources

### Primary (HIGH confidence)

- `docs/api/websocket.md` — Complete WS protocol, SonosData and DirigeraData payload interfaces, snapshot-on-subscribe behavior
- `types/websocket.ts` — Verified SonosData, DirigeraData, SonosGroup, DirigeraSensor type definitions
- `app/components/devices/stove/hooks/useStoveData.ts` — Phase 140 reference: WS subscribe pattern, ref pattern for side-fetches
- `app/components/devices/lights/hooks/useLightsData.ts` — Phase 141 reference: conditional WS subscription (isWsConnected guard), scenes side-fetch
- `app/components/devices/network/hooks/useNetworkData.ts` — Phase 141 reference: WS test mock pattern
- `app/components/devices/network/__tests__/useNetworkData.test.ts` — Established test patterns for WS-migrated hooks
- `app/components/devices/sonos/hooks/useSonosData.ts` — Current implementation (migration target)
- `app/components/devices/dirigera/hooks/useDirigeraData.ts` — Current implementation (migration target)
- `types/sonosProxy.ts` — SonosZoneResponse, SonosHealthResponse, SonosPlaybackResponse shapes
- `types/dirigeraProxy.ts` — DirigeraHealthResponse, SensorSummaryResponse shapes
- `lib/hooks/useWebSocketManager.ts` — subscribe/unsubscribe API, ReadyState export
- `app/context/WebSocketContext.ts` — useWebSocketContext() hook

### Secondary (MEDIUM confidence)

- `142-CONTEXT.md` — Decisions D-01 through D-16, locked by user discussion

### Tertiary (LOW confidence)

None.

---

## Project Constraints (from CLAUDE.md)

| Directive | Impact on Phase |
|-----------|----------------|
| NEVER break existing functionality | Hook public interfaces (`UseSonosDataReturn`, `UseDirigeraDataReturn`) stay identical |
| ALWAYS create/update unit tests | New WS test cases required in useSonosData.test.ts; new useDirigeraData.test.ts required |
| PREFER editing existing files over creating new | Migrate existing hook files in-place; only new file is useDirigeraData.test.ts |
| USE design system | No UI changes in this phase |
| NEVER execute `npm run build` or `npm install` | No build validation step |
| NEVER commit/push without explicit request | Agents must not commit |

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries in use from Phase 139/140/141, no new deps
- Architecture: HIGH — pattern directly verified in Phase 141 useLightsData and useNetworkData reference implementations
- Pitfalls: HIGH — identified from actual Phase 141 decisions recorded in STATE.md and code review of reference implementations
- Test patterns: HIGH — verified from useNetworkData.test.ts which establishes the WS mock pattern for this codebase

**Research date:** 2026-03-27
**Valid until:** 2026-04-27 (stable codebase, no fast-moving dependencies)
