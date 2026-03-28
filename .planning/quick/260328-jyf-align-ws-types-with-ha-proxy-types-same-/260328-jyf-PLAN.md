---
phase: quick
plan: 260328-jyf
type: execute
wave: 1
depends_on: []
files_modified:
  - types/websocket.ts
  - app/components/devices/lights/hooks/useLightsData.ts
  - app/components/devices/stove/hooks/useStoveData.ts
  - app/components/devices/sonos/hooks/useSonosData.ts
  - app/components/devices/dirigera/hooks/useDirigeraData.ts
  - __tests__/components/devices/lights/hooks/useLightsData.test.ts
  - __tests__/components/devices/stove/hooks/useStoveData.test.ts
  - app/components/devices/sonos/hooks/__tests__/useSonosData.test.ts
  - app/components/devices/dirigera/hooks/__tests__/useDirigeraData.test.ts
autonomous: true
must_haves:
  truths:
    - "types/websocket.ts imports and re-exports proxy types instead of defining its own for Hue, Thermorossi, Sonos, and Dirigera"
    - "useLightsData WS handler assigns proxy-shaped data directly without field-by-field transformation"
    - "useStoveData WS handler uses ThermorossiStatusResponse directly, gaining data_freshness and last_poll_at fields"
    - "useSonosData WS handler uses SonosDeviceResponse/SonosZoneResponse directly without unsafe cast"
    - "useDirigeraData WS handler uses proxy DirigeraSensor (is_open) not WS-only DirigeraContactSensor (is_detected)"
    - "Netatmo stays as Record<string, unknown> — WS sends raw format, adapter is still needed"
    - "FritzBox types unchanged — they ARE the canonical types"
    - "All existing tests pass after type alignment"
  artifacts:
    - path: "types/websocket.ts"
      provides: "WS envelope types + re-exports from proxy type files"
    - path: "app/components/devices/lights/hooks/useLightsData.ts"
      provides: "Simplified WS handler using proxy HueLight[]/HueGroup[] directly"
  key_links:
    - from: "types/websocket.ts"
      to: "types/hueProxy.ts"
      via: "import { HueLight, HueGroup } and re-export as WS payload types"
    - from: "types/websocket.ts"
      to: "types/thermorossiProxy.ts"
      via: "import { ThermorossiStatusResponse } and alias as ThermorossiData"
    - from: "types/websocket.ts"
      to: "types/sonosProxy.ts"
      via: "import { SonosDeviceResponse, SonosZoneResponse } for SonosData"
    - from: "types/websocket.ts"
      to: "types/dirigeraProxy.ts"
      via: "import { DirigeraSensor } for DirigeraData"
---

<objective>
Align WebSocket payload types in types/websocket.ts with the HA proxy types since the WS server sends data in the same format as the proxy REST endpoints. This eliminates redundant type definitions and removes manual field-by-field transformation code in device hooks.

Purpose: The current WS types were written before the proxy migration (v13-v14) and define legacy/raw shapes (e.g., nested Hue Bridge format, string stove_state). Since the WS server now sends proxy-shaped data, the WS types should import from proxy type files, and hooks should use the data directly.

Output: Simplified types/websocket.ts with proxy re-exports, and 4 hooks with reduced transformation code.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@types/websocket.ts
@types/hueProxy.ts
@types/thermorossiProxy.ts
@types/sonosProxy.ts
@types/dirigeraProxy.ts
@types/netatmoProxy.ts
@app/components/devices/lights/hooks/useLightsData.ts
@app/components/devices/stove/hooks/useStoveData.ts
@app/components/devices/sonos/hooks/useSonosData.ts
@app/components/devices/dirigera/hooks/useDirigeraData.ts
@lib/netatmo/netatmoWsAdapter.ts

<interfaces>
<!-- Proxy types that WS types should import (the target shapes) -->

From types/hueProxy.ts:
```typescript
export type HueCapabilityTier = 'white' | 'ambiance' | 'color';
export type HueColorMode = 'ct' | 'hs' | 'xy';
export interface HueLight {
  light_id: string; name: string; on: boolean;
  brightness: number | null; ct_mirek: number | null; ct_kelvin: number | null;
  hue: number | null; saturation: number | null; colormode: HueColorMode | null;
  reachable: boolean; capability_tier: HueCapabilityTier;
  room_id: string | null; room_name: string | null;
  model_id: string | null; light_type: string | null;
}
export interface HueGroup {
  group_id: string; name: string; type: string | null; group_class: string | null;
  lights: string[]; any_on: boolean; all_on: boolean;
  brightness: number | null; color_temp: number | null; colormode: string | null;
}
```

From types/thermorossiProxy.ts:
```typescript
export type StoveState = 'off' | 'igniting' | 'working' | 'standby' | 'cleaning' | 'alarm' | 'modulating';
export type DataFreshness = 'LIVE' | 'STALE';
export interface ThermorossiStatusResponse {
  stove_state: StoveState; power_level: number | null; fan_level: number | null;
  data_freshness: DataFreshness; last_poll_at: string | null;
  error_code: number | null; error_description: string | null;
}
```

From types/sonosProxy.ts:
```typescript
export interface SonosDeviceResponse {
  uid: string; name: string; ip: string; model: string | null;
  firmware: string | null; serial: string | null;
  role: 'soundbar' | 'sub' | 'surround' | 'speaker';
  is_visible: boolean; is_coordinator: boolean;
}
export interface SonosZoneMemberResponse {
  uid: string; name: string; ip: string;
  role: 'soundbar' | 'sub' | 'surround' | 'speaker';
}
export interface SonosZoneResponse {
  group_id: string; label: string; coordinator_uid: string;
  coordinator_name: string; member_count: number;
  members: SonosZoneMemberResponse[];
}
```

From types/dirigeraProxy.ts:
```typescript
export interface DirigeraSensor {
  id: string; type: 'openCloseSensor' | 'occupancySensor' | string;
  custom_name: string; room: string | null;
  firmware_version: string | null; battery_percentage: number | null;
  is_reachable: boolean; is_open: boolean | null; last_seen: string | null;
}
```
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Replace WS-specific types with proxy type imports in types/websocket.ts</name>
  <files>types/websocket.ts</files>
  <action>
Rewrite types/websocket.ts to import proxy types instead of defining its own:

1. **Keep unchanged**: `Topic`, `WebSocketMessage<T>` (core envelope types), `FritzBoxDevice`, `FritzBoxBandwidth`, `FritzBoxWan`, `FritzBoxData` (Fritz!Box has no proxy types - these ARE canonical).

2. **Hue section**: Delete all Hue interfaces (`HueLightState`, `HueLight`, `HueGroupState`, `HueGroup`). Import `HueLight` and `HueGroup` from `@/types/hueProxy`. Redefine `HueData` as:
```typescript
import { HueLight, HueGroup } from '@/types/hueProxy';
// Re-export for convenience
export type { HueLight as HueWsLight, HueGroup as HueWsGroup } from '@/types/hueProxy';
export interface HueData {
  lights: HueLight[] | null;  // was Record<string, HueLight>
  groups: HueGroup[] | null;  // was Record<string, HueGroup>
}
```
Note: Changed from `Record<string, X>` to `X[]` because WS now sends arrays in proxy format.

3. **Thermorossi section**: Delete `ThermorossiData` interface. Import and alias:
```typescript
import { ThermorossiStatusResponse } from '@/types/thermorossiProxy';
export type ThermorossiData = ThermorossiStatusResponse;
```
This gives WS consumers `stove_state: StoveState` (union, not string), plus `data_freshness` and `last_poll_at`.

4. **Sonos section**: Delete `SonosSpeaker`, `SonosGroupMember`, `SonosGroup`. Import from proxy:
```typescript
import { SonosDeviceResponse, SonosZoneResponse } from '@/types/sonosProxy';
export interface SonosData {
  speakers: SonosDeviceResponse[] | null;  // was SonosSpeaker[]
  groups: SonosZoneResponse[] | null;      // was SonosGroup[]
}
```

5. **Dirigera section**: Delete `DirigeraBaseSensor`, `DirigeraContactSensor`, `DirigeraMotionSensor`, and the local `DirigeraSensor` union. Import from proxy:
```typescript
import { DirigeraSensor } from '@/types/dirigeraProxy';
export interface DirigeraData {
  sensors: DirigeraSensor[] | null;
}
```

6. **Netatmo section**: Keep `NetatmoData = Record<string, unknown>` unchanged. Add comment: "WS sends raw Netatmo homestatus envelope (body.home.rooms[]), NOT proxy format. Adapter in lib/netatmo/netatmoWsAdapter.ts handles conversion."

7. **TopicDataMap**: Keep as-is (types flow through from the new definitions).

8. Ensure all re-exported types that other files import by name still resolve. The WS-specific type names (`DirigeraContactSensor` from websocket.ts) used in `useDirigeraData.ts` line 110 will need updating in Task 2.
  </action>
  <verify>
    <automated>cd /Users/federicomanfredi/Sites/localhost/pannello-stufa && npx tsc --noEmit --pretty 2>&1 | head -40</automated>
  </verify>
  <done>types/websocket.ts has zero local type definitions for Hue/Thermorossi/Sonos/Dirigera — all imported from proxy type files. FritzBox and Netatmo unchanged. File compiles with no tsc errors (expect downstream errors in hooks — fixed in Task 2).</done>
</task>

<task type="auto">
  <name>Task 2: Simplify WS handlers in all 4 device hooks to use proxy-shaped data directly</name>
  <files>
    app/components/devices/lights/hooks/useLightsData.ts
    app/components/devices/stove/hooks/useStoveData.ts
    app/components/devices/sonos/hooks/useSonosData.ts
    app/components/devices/dirigera/hooks/useDirigeraData.ts
    __tests__/components/devices/lights/hooks/useLightsData.test.ts
    __tests__/components/devices/stove/hooks/useStoveData.test.ts
    app/components/devices/sonos/hooks/__tests__/useSonosData.test.ts
    app/components/devices/dirigera/hooks/__tests__/useDirigeraData.test.ts
  </files>
  <action>
**useLightsData.ts** (BIGGEST change):
- Remove import of `HueLight as WsHueLight, HueGroup as WsHueGroup` from `@/types/websocket`
- Keep import of `HueData` from `@/types/websocket` (now uses proxy shapes)
- Remove import of `HueLight, HueGroup` from `@/types/hueProxy` (already comes via HueData)
  Actually: still import `HueLight, HueGroup, HueScene` from `@/types/hueProxy` for state typing
- **Replace the entire WS handleMessage transformation block** (lines 180-216, the Object.entries + map blocks) with direct assignment:
```typescript
const handleMessage = (raw: unknown) => {
  const data = raw as HueData;
  if (data.lights) {
    setLights(data.lights);
  }
  if (data.groups) {
    const sortedGroups = [...data.groups].sort((a, b) => {
      if (a.name === 'Casa') return -1;
      if (b.name === 'Casa') return 1;
      return a.name.localeCompare(b.name);
    });
    setGroups(sortedGroups);
  }
  setConnected(true);
  setStale(false);
  setLoading(false);
  setError(null);
  setLastUpdatedAt(Date.now());
  void fetchScenesRef.current();
};
```
This removes ~35 lines of Record-to-Array conversion and field mapping (bri->brightness, ct->ct_mirek, state flattening, capability_tier defaulting).

**useStoveData.ts**:
- Remove import of `ThermorossiData` from `@/types/websocket` (now ThermorossiData = ThermorossiStatusResponse)
- Import `ThermorossiData` from `@/types/websocket` still works, OR import `ThermorossiStatusResponse` from `@/types/thermorossiProxy` directly
- In WS handleMessage: remove `as StoveState` cast since `ThermorossiData.stove_state` is already `StoveState` type
- Add `data_freshness` and `last_poll_at` handling from WS payload:
```typescript
const handleMessage = (raw: unknown) => {
  const data = raw as ThermorossiData;
  setStatus(data.stove_state);  // no cast needed — already StoveState
  setFanLevel(data.fan_level);
  setPowerLevel(data.power_level);
  // Use data_freshness from WS payload (was hardcoded to false)
  setIsStale(data.data_freshness === 'STALE');
  setLastPollAt(data.last_poll_at ? new Date(data.last_poll_at) : new Date());
  // ... rest unchanged (error handling, side-fetches)
};
```
- Remove the `[key: string]: unknown` index signature workaround — proxy type is strict

**useSonosData.ts**:
- Remove `SonosData as WsSonosData` import from `@/types/websocket`
- Import `SonosData` from `@/types/websocket` (now uses SonosDeviceResponse/SonosZoneResponse)
- In WS handleMessage: remove `as unknown as SonosZoneResponse[]` unsafe double cast. Replace with direct assignment:
```typescript
const zones = wsData.groups ?? [];  // already SonosZoneResponse[]
```
- Speaker count: `wsData.speakers?.length ?? 0` still works (SonosDeviceResponse has uid/name/ip/etc.)

**useDirigeraData.ts**:
- Remove import of `DirigeraContactSensor` from `@/types/websocket` (this type no longer exists there)
- Import `DirigeraSensor` from `@/types/dirigeraProxy` if needed for the summary derivation
- Fix the `is_open` check in summary derivation (line 110): proxy `DirigeraSensor` uses `is_open: boolean | null` (not `is_detected` from the deleted WS type). The cast `as DirigeraContactSensor` should be removed:
```typescript
open_count: sensors.filter(
  s => s.type === 'openCloseSensor' && s.is_open === true
).length,
```
This is simpler since proxy DirigeraSensor already has `is_open` at the top level (no discriminated union needed).

**Test files**: Update mock WS payloads in test files to match the new proxy-shaped format:
- `useLightsData.test.ts`: Change mock HueData from `Record<string, { state: { on, bri, ct, ... }, name, type }>` to `HueLight[]` with flat fields (`light_id`, `brightness`, `ct_mirek`, etc.)
- `useStoveData.test.ts`: Add `data_freshness: 'LIVE'` and `last_poll_at` to mock ThermorossiData payloads
- `useSonosData.test.ts`: Update mock SonosData to use `SonosDeviceResponse` shape (should be minor — shapes are nearly identical). Remove the `as unknown as` in test expectations if present
- `useDirigeraData.test.ts`: Update mock sensor data to use proxy `DirigeraSensor` shape (remove `relation_id`, `is_detected`, add `is_open`, `custom_name` instead of `custom_name | null`)

**Do NOT touch**: `useThermostatData.ts`, `netatmoWsAdapter.ts` (Netatmo WS sends raw format — adapter is still needed), `useNetworkData.ts` (FritzBox types unchanged).
  </action>
  <verify>
    <automated>cd /Users/federicomanfredi/Sites/localhost/pannello-stufa && npx tsc --noEmit --pretty 2>&1 | head -20 && npm test -- --testPathPattern="useLightsData|useStoveData|useSonosData|useDirigeraData" --no-coverage 2>&1 | tail -30</automated>
  </verify>
  <done>Zero tsc errors. All 4 hook test suites pass. useLightsData WS handler is ~10 lines instead of ~35. No unsafe casts (as unknown as) remain in Sonos/Dirigera hooks. Stove WS handler uses StoveState directly without string cast.</done>
</task>

</tasks>

<verification>
1. `npx tsc --noEmit` — zero errors across entire codebase
2. `npm test -- --no-coverage` — all existing tests pass (no regressions)
3. `grep -rn "as StoveState" app/components/devices/stove/` — no manual casts remaining
4. `grep -rn "as unknown as SonosZoneResponse" app/components/devices/sonos/` — no double casts
5. `grep -rn "DirigeraContactSensor\|DirigeraMotionSensor\|DirigeraBaseSensor" types/websocket.ts` — no legacy discriminated union types
6. `grep -rn "HueLightState\|HueGroupState" types/websocket.ts` — no legacy nested state types
</verification>

<success_criteria>
- types/websocket.ts imports from 4 proxy type files (hueProxy, thermorossiProxy, sonosProxy, dirigeraProxy)
- Zero WS-specific type definitions for Hue, Thermorossi, Sonos, Dirigera in types/websocket.ts
- FritzBox and Netatmo sections unchanged
- useLightsData WS handler reduced from ~35 lines of transformation to ~10 lines of direct assignment
- No `as StoveState`, `as unknown as SonosZoneResponse[]`, or `as DirigeraContactSensor` casts in hooks
- All tests pass, zero tsc errors
</success_criteria>

<output>
After completion, create `.planning/quick/260328-jyf-align-ws-types-with-ha-proxy-types-same-/260328-jyf-SUMMARY.md`
</output>
