# Phase 145: WS Type Alignment - Research

**Researched:** 2026-03-28
**Domain:** TypeScript type definitions — `types/websocket.ts` alignment with HA proxy WS payload shapes
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Keep HueData as `HueLight[] | null` and `HueGroup[] | null` (array shape). Do NOT switch to `Record<string, HueLight>` dict shape — all `useLightsData` consumers iterate arrays.
- **D-02:** Add `data_freshness: HueDataFreshness` to HueData.
- **D-03:** HueLight proxy type already has all needed fields. Add `custom_name?: string | null` and `device_type?: string | null` if not already present.
- **D-04:** Replace `type NetatmoData = Record<string, unknown>` with a proper interface: `{ body: Record<string, unknown>; status: string; time_server: number; data_freshness: 'LIVE' | 'STALE' | 'UNREACHABLE'; [key: string]: unknown; }`.
- **D-05:** Add to FritzBoxData: `is_stale: boolean`, `fetched_at: string | null`, `data_freshness: 'LIVE' | 'STALE'`.
- **D-06:** Add to FritzBoxDevice: `custom_name?: string | null`, `device_type?: string | null`.
- **D-07:** Add `data_freshness: 'LIVE' | 'STALE'` to DirigeraData.
- **D-08:** DirigeraSensor proxy type already has `custom_name: string`. Add `device_type?: string | null` if not already present.
- **D-09:** Add `data_freshness: SonosDataFreshness` to SonosData (import existing type from sonosProxy.ts).
- **D-10:** Add `custom_name?: string | null` and `device_type?: string | null` to SonosDeviceResponse if not already present.
- **D-11:** ThermorossiData aliases ThermorossiStatusResponse which includes `data_freshness`. Verify `custom_name` and `device_type` are present; add if missing.
- **D-12:** Create new `RaspiData` interface for the WS payload: `{ cpu_percent: number; memory: Record<string, unknown>; disk: Record<string, unknown>; system: Record<string, unknown>; data_freshness: 'LIVE'; }`.
- **D-13:** Create new `TuyaData` type: `{ plugs: TuyaPlug[] | null; data_freshness: 'LIVE' | 'STALE' | 'UNREACHABLE'; }`. TuyaPlug defined in new `types/tuyaProxy.ts`.
- **D-14:** Extend Topic: `'fritzbox' | 'dirigera' | 'netatmo' | 'thermorossi' | 'hue' | 'sonos' | 'raspi' | 'tuya'`.
- **D-15:** Add to TopicDataMap: `raspi: RaspiData; tuya: TuyaData;`.

### Claude's Discretion
- Import strategy for new `data_freshness` types (reuse existing union types from proxy files vs define locally)
- Whether to create a shared `DataFreshness` type or keep per-provider freshness types

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope.

</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| WSTYPE-01 | All WS topic payload types include `data_freshness` field matching REST endpoint shape | All 6 existing topics plus 2 new ones need `data_freshness`; shapes verified from docs/api/websocket.md |
| WSTYPE-02 | FritzBoxData WS type includes `is_stale`, `fetched_at`, `data_freshness` | FritzBoxData currently has none of these 3 fields — all 3 must be added |
| WSTYPE-03 | FritzBoxDevice includes `custom_name` and `device_type` registry metadata | FritzBoxDevice currently has only `ip`, `name`, `mac`, `status` — add both optional fields |
| WSTYPE-04 | DirigeraData includes `data_freshness` field | DirigeraData currently only has `sensors` — add `data_freshness: 'LIVE' \| 'STALE'` |
| WSTYPE-05 | DirigeraBaseSensor includes `device_type` registry metadata | DirigeraSensor in dirigeraProxy.ts does NOT have `device_type` — add it |
| WSTYPE-06 | NetatmoData is typed interface with `body`, `status`, `time_server`, `data_freshness` | NetatmoData is currently `Record<string, unknown>` — replace with proper interface |
| WSTYPE-07 | ThermorossiData includes `data_freshness`, `custom_name`, `device_type` | ThermorossiStatusResponse already has `data_freshness`; `custom_name`/`device_type` are absent — add to proxy type |
| WSTYPE-08 | HueData uses dict shape (per REQUIREMENTS.md) | OVERRIDDEN BY D-01 — keep array shape; follow D-01, not WSTYPE-08 |
| WSTYPE-09 | HueLight includes `custom_name` and `device_type` registry metadata | HueLight in hueProxy.ts does NOT have these fields — add both optional |
| WSTYPE-10 | HueData includes `data_freshness` field | HueData currently has no `data_freshness` — add 3-state union (wider than HueDataFreshness) |
| WSTYPE-11 | SonosSpeaker includes `custom_name` and `device_type` registry metadata | SonosDeviceResponse does NOT have these fields — add both optional |
| WSTYPE-12 | SonosData includes `data_freshness` field | SonosData currently only has `speakers` and `groups` — add `SonosDataFreshness` |
| WSTYPE-13 | Topic union type includes all 8 topics (adding `raspi` and `tuya`) | Currently 6 topics; add `raspi` and `tuya` |
| WSTYPE-14 | TopicDataMap maps `raspi` and `tuya` to their respective payload types | Currently 6 entries; add `raspi: RaspiData` and `tuya: TuyaData` |

</phase_requirements>

---

## Summary

Phase 145 is a pure TypeScript type update — no runtime behavior changes, no new API routes, no new React components. All changes are confined to `types/websocket.ts`, four existing proxy type files, and one new file (`types/tuyaProxy.ts`).

The core task is closing the gap between what `docs/api/websocket.md` documents as the HA proxy WS payload shapes and what the TypeScript types currently model. Every existing topic type needs at least one additive change; two entirely new topic types (`RaspiData`, `TuyaData`) need to be created from scratch.

**Critical override:** WSTYPE-08 in REQUIREMENTS.md specifies dict shape for HueData. Decision D-01 in CONTEXT.md explicitly overrides this. The planner MUST follow D-01 and keep the array shape. `useLightsData` iterates `data.lights` and `data.groups` as arrays at lines 181-187; changing to `Record<string, HueLight>` would break that consumer with no upside.

**Primary recommendation:** Work in dependency order — create `types/tuyaProxy.ts` first (since `TuyaData` depends on `TuyaPlug`), then update the four proxy type files, then update `types/websocket.ts` last. This prevents import errors during the edit sequence.

---

## Standard Stack

No new packages required. This phase touches only `.ts` type definition files within the existing TypeScript project.

**Version verification:** N/A — no new dependencies.

---

## Architecture Patterns

### Recommended Edit Order

```
1. types/tuyaProxy.ts          (NEW — create first, TuyaData depends on TuyaPlug)
2. types/hueProxy.ts           (ADD custom_name?, device_type? to HueLight)
3. types/thermorossiProxy.ts   (ADD custom_name?, device_type? to ThermorossiStatusResponse)
4. types/sonosProxy.ts         (ADD custom_name?, device_type? to SonosDeviceResponse)
5. types/dirigeraProxy.ts      (ADD device_type? to DirigeraSensor)
6. types/websocket.ts          (UPDATE last — imports from all above)
```

### Pattern 1: Additive Optional Fields

**What:** Add `custom_name?: string | null` and `device_type?: string | null` to existing interfaces.
**When to use:** Registry metadata is always optional — not all devices are registered.

```typescript
// Source: docs/api/websocket.md — all device interfaces
export interface SonosDeviceResponse {
  uid: string;
  name: string;
  // ... existing fields unchanged ...
  custom_name?: string | null;  // registry override for display name
  device_type?: string | null;  // registry device type slug
}
```

### Pattern 2: Interface Replacement (NetatmoData)

**What:** Replace `type NetatmoData = Record<string, unknown>` with a proper interface.
**Impact on netatmoWsAdapter.ts:** Currently accesses `raw['body']` via dynamic key. After the change, `raw.body` becomes a direct typed property access — no casting needed. The index signature `[key: string]: unknown` preserves backward compat for other Netatmo API top-level fields.

```typescript
// Source: docs/api/websocket.md — netatmo topic
// Before
export type NetatmoData = Record<string, unknown>;

// After (D-04)
export interface NetatmoData {
  body: Record<string, unknown>;
  status: string;
  time_server: number;
  data_freshness: 'LIVE' | 'STALE' | 'UNREACHABLE';
  [key: string]: unknown;  // additional Netatmo API top-level fields
}
```

When a TypeScript interface has `[key: string]: unknown`, all explicitly typed properties must be assignable to `unknown`. Since every type is a subtype of `unknown`, this is always satisfied — no special handling needed.

### Pattern 3: New Type File (types/tuyaProxy.ts)

**What:** Create a new proxy type file following the exact same pattern as the other proxy files.
**When to use:** New provider with no existing type file.

The full interface set from `docs/api/tuya.md` should be defined here (not just TuyaPlug), because Phase 147 (Tuya infrastructure) and Phase 148 (Tuya frontend) will also import from this file. Defining all types now avoids a partial file that gets updated again one phase later.

### Pattern 4: HueDataFreshness Scope — WS is Wider Than REST

**What:** `HueDataFreshness` in `hueProxy.ts` is `'LIVE' | 'STALE'` (2-state). The WS doc specifies `'LIVE' | 'STALE' | 'UNREACHABLE'` for `HueData.data_freshness` (3-state).

**Resolution:** The REST proxy returns HTTP 503 for UNREACHABLE (so REST consumers never see UNREACHABLE in a response body). The WS endpoint can push UNREACHABLE in the payload. Inline the wider union directly in `HueData` rather than widening `HueDataFreshness`, which would affect REST consumers:

```typescript
export interface HueData {
  lights: HueLight[] | null;
  groups: HueGroup[] | null;
  data_freshness: 'LIVE' | 'STALE' | 'UNREACHABLE';  // wider than HueDataFreshness
}
```

### Pattern 5: Import Strategy for data_freshness Types (Claude's Discretion)

**Recommendation:** Reuse existing named union types from proxy files where they exactly match the WS doc. Inline unions where they differ from the proxy types. Do NOT create a shared `DataFreshness` type — each provider has different valid states and the project pattern uses per-provider types.

| Provider | data_freshness in WS doc | Action |
|----------|--------------------------|--------|
| FritzBox | `'LIVE' \| 'STALE'` | Inline (no FritzBox proxy type file) |
| Dirigera | `'LIVE' \| 'STALE'` | Inline (DirigeraDataFreshness is 3-state, don't use it) |
| Netatmo | `'LIVE' \| 'STALE' \| 'UNREACHABLE'` | Inline in interface |
| Thermorossi | `'LIVE' \| 'STALE'` | Already present as `DataFreshness` in proxy |
| Hue | `'LIVE' \| 'STALE' \| 'UNREACHABLE'` | Inline (HueDataFreshness is 2-state) |
| Sonos | `'LIVE' \| 'STALE' \| 'UNREACHABLE'` | Import `SonosDataFreshness` (matches exactly) |
| Raspi | `'LIVE'` | Inline literal |
| Tuya | `'LIVE' \| 'STALE' \| 'UNREACHABLE'` | Inline in TuyaData |

### Anti-Patterns to Avoid

- **Do NOT change HueData.lights from array to dict** — breaks `useLightsData` lines 181-187 which spread/sort arrays.
- **Do NOT make `data_freshness` non-optional on ThermorossiStatusResponse** — it's already there, just confirm and add `custom_name`/`device_type`.
- **Do NOT add `data_freshness` to individual `DirigeraSensor` items** — it belongs on the container `DirigeraData`, not per-sensor.
- **Do NOT create a shared `DataFreshness` union type** — providers have different valid states; shared type would be misleading.
- **Do NOT use `DirigeraDataFreshness` (3-state) for DirigeraData** — WS doc says 2-state for the envelope.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Tuya type definitions | Custom ad-hoc types | Import directly from `docs/api/tuya.md` TypeScript Interfaces section | Doc provides exact field-for-field interfaces matching server Pydantic models |
| Freshness union types | New shared enum or class | Inline string unions or reuse existing proxy types | Project established pattern; per-provider unions are clearer |

---

## Current State Audit — Exact Field Gaps

### FritzBoxData (in `types/websocket.ts`)

| Field | Current State | Action |
|-------|---------------|--------|
| `devices: FritzBoxDevice[] \| null` | Present | No change |
| `bandwidth: FritzBoxBandwidth \| null` | Present | No change |
| `wan: FritzBoxWan \| null` | Present | No change |
| `is_stale: boolean` | MISSING | Add |
| `fetched_at: string \| null` | MISSING | Add |
| `data_freshness: 'LIVE' \| 'STALE'` | MISSING | Add |

### FritzBoxDevice (in `types/websocket.ts`)

| Field | Current State | Action |
|-------|---------------|--------|
| `ip`, `name`, `mac`, `status` | Present | No change |
| `custom_name?: string \| null` | MISSING | Add |
| `device_type?: string \| null` | MISSING | Add |

### DirigeraData (in `types/websocket.ts`)

| Field | Current State | Action |
|-------|---------------|--------|
| `sensors: DirigeraSensor[] \| null` | Present | No change |
| `data_freshness: 'LIVE' \| 'STALE'` | MISSING | Add |

### DirigeraSensor (in `types/dirigeraProxy.ts`)

| Field | Current State | Action |
|-------|---------------|--------|
| `id`, `type`, `custom_name`, `room`, etc. | Present | No change |
| `device_type?: string \| null` | MISSING | Add |

Note: `custom_name` is `string` (non-nullable) in the current proxy type. WS doc shows `string | null`. This slight mismatch is pre-existing and out of scope — do not change `custom_name` nullability.

### NetatmoData (in `types/websocket.ts`)

| Current State | Action |
|---------------|--------|
| `type NetatmoData = Record<string, unknown>` | Replace with typed interface (D-04) |

### ThermorossiStatusResponse (in `types/thermorossiProxy.ts`)

| Field | Current State | Action |
|-------|---------------|--------|
| `stove_state`, `power_level`, `fan_level`, `data_freshness`, `last_poll_at`, `error_code`, `error_description` | Present | No change |
| `custom_name?: string \| null` | MISSING | Add |
| `device_type?: string \| null` | MISSING | Add |

### HueData (in `types/websocket.ts`)

| Field | Current State | Action |
|-------|---------------|--------|
| `lights: HueLight[] \| null` | Present (array — D-01 locked) | No change |
| `groups: HueGroup[] \| null` | Present (array — D-01 locked) | No change |
| `data_freshness: 'LIVE' \| 'STALE' \| 'UNREACHABLE'` | MISSING | Add inline union |

### HueLight (in `types/hueProxy.ts`)

| Field | Current State | Action |
|-------|---------------|--------|
| `light_id`, `name`, `on`, `brightness`, `ct_mirek`, `ct_kelvin`, `hue`, `saturation`, `colormode`, `reachable`, `capability_tier`, `room_id`, `room_name`, `model_id`, `light_type` | Present | No change |
| `custom_name?: string \| null` | MISSING | Add |
| `device_type?: string \| null` | MISSING | Add |

### SonosData (in `types/websocket.ts`)

| Field | Current State | Action |
|-------|---------------|--------|
| `speakers: SonosDeviceResponse[] \| null` | Present | No change |
| `groups: SonosZoneResponse[] \| null` | Present | No change |
| `data_freshness: SonosDataFreshness` | MISSING | Add (import from sonosProxy) |

### SonosDeviceResponse (in `types/sonosProxy.ts`)

| Field | Current State | Action |
|-------|---------------|--------|
| `uid`, `name`, `ip`, `model`, `firmware`, `serial`, `role`, `is_visible`, `is_coordinator` | Present | No change |
| `custom_name?: string \| null` | MISSING | Add |
| `device_type?: string \| null` | MISSING | Add |

### RaspiData — NEW (to create in `types/websocket.ts`)

Shape from `docs/api/websocket.md`:

```typescript
export interface RaspiData {
  cpu_percent: number;
  memory: Record<string, unknown>;
  disk: Record<string, unknown>;
  system: Record<string, unknown>;
  data_freshness: 'LIVE';  // always LIVE — raspi is on-demand
}
```

Note: `types/raspi.ts` contains per-endpoint types (`CpuResponse`, `MemoryResponse`, `DiskResponse`, `SystemResponse`). These have different field shapes than the WS aggregate. `RaspiData` is the WS topic container — distinct from these types. No conflict; keep them separate.

### TuyaData — NEW (to create in `types/websocket.ts`)

```typescript
// Requires TuyaPlug imported from types/tuyaProxy.ts
export interface TuyaData {
  plugs: TuyaPlug[] | null;
  data_freshness: 'LIVE' | 'STALE' | 'UNREACHABLE';
}
```

### Topic union + TopicDataMap (in `types/websocket.ts`)

```typescript
// Before
export type Topic = 'fritzbox' | 'dirigera' | 'netatmo' | 'thermorossi' | 'hue' | 'sonos';

// After (D-14)
export type Topic =
  | 'fritzbox' | 'dirigera' | 'netatmo' | 'thermorossi'
  | 'hue' | 'sonos' | 'raspi' | 'tuya';

// Before
export type TopicDataMap = { fritzbox: ...; dirigera: ...; netatmo: ...; thermorossi: ...; hue: ...; sonos: ...; };

// After (D-15)
export type TopicDataMap = { fritzbox: ...; dirigera: ...; netatmo: ...; thermorossi: ...; hue: ...; sonos: ...; raspi: RaspiData; tuya: TuyaData; };
```

---

## Common Pitfalls

### Pitfall 1: NetatmoData Index Signature
**What goes wrong:** Developer adds `[key: string]: unknown` and gets confused about whether all properties must be `unknown`.
**Why it happens:** TypeScript requires all named properties to be subtypes of the index signature type. `string`, `number`, `Record<string, unknown>` are all assignable to `unknown` — no issue.
**How to avoid:** Keep `[key: string]: unknown`; do not use `any` or a narrower type for the index signature.

### Pitfall 2: DirigeraData data_freshness Scope
**What goes wrong:** Using `DirigeraDataFreshness` (3-state: `'LIVE' | 'STALE' | 'UNREACHABLE'`) for `DirigeraData.data_freshness` when the WS doc specifies only 2 states.
**Why it happens:** The per-sensor REST endpoints use 3-state freshness, but the WS envelope uses 2-state.
**How to avoid:** Inline `'LIVE' | 'STALE'` directly in `DirigeraData` rather than importing `DirigeraDataFreshness`.

### Pitfall 3: HueDataFreshness 2-state vs WS 3-state
**What goes wrong:** Using `HueDataFreshness` (`'LIVE' | 'STALE'`) for `HueData.data_freshness` when the WS doc requires 3 states including `'UNREACHABLE'`.
**Why it happens:** The proxy REST type excludes `UNREACHABLE` because REST returns 503 instead. WS can push `UNREACHABLE` as a payload value.
**How to avoid:** Inline `'LIVE' | 'STALE' | 'UNREACHABLE'` directly in `HueData`.

### Pitfall 4: WSTYPE-08 vs D-01 Conflict
**What goes wrong:** Following WSTYPE-08 (dict shape) instead of D-01 (array shape) for HueData.
**Why it happens:** REQUIREMENTS.md says dict; CONTEXT.md decision D-01 overrides it.
**How to avoid:** Always follow CONTEXT.md decisions over REQUIREMENTS.md when they conflict. `useLightsData` at lines 181-187 iterates `data.lights` and `data.groups` as arrays — changing to dict breaks existing runtime behavior.
**Warning signs:** If `setLights(data.lights)` and `[...data.groups].sort(...)` in useLightsData.ts would produce a TypeScript error with the new type, D-01 was violated.

### Pitfall 5: SonosDeviceResponse vs SonosSpeaker Name Mismatch
**What goes wrong:** Creating a new `SonosSpeaker` type (as named in the WS doc) instead of adding fields to `SonosDeviceResponse` (as named in the proxy file).
**Why it happens:** The WS doc uses `SonosSpeaker` as the interface name, but the project's proxy type is `SonosDeviceResponse`. `SonosData.speakers` is `SonosDeviceResponse[] | null`.
**How to avoid:** Add `custom_name` and `device_type` to `SonosDeviceResponse` in `sonosProxy.ts`. Do not create a new type.

### Pitfall 6: ThermorossiStatusResponse Already Has data_freshness
**What goes wrong:** Trying to add `data_freshness` to `ThermorossiStatusResponse` when it already exists as `DataFreshness` type.
**Why it happens:** WSTYPE-07 says "add data_freshness" but it's already present.
**How to avoid:** Only add `custom_name?: string | null` and `device_type?: string | null` to `ThermorossiStatusResponse`. Verify the existing `data_freshness: DataFreshness` is there and do not duplicate it.

---

## Code Examples

### types/tuyaProxy.ts (new file, complete)

```typescript
// Source: docs/api/tuya.md — TypeScript Interfaces section

export interface TuyaDeviceHealth {
  device_id: string;
  last_polled_at: number | null;  // Unix epoch float, null if never polled
  data_freshness: 'LIVE' | 'STALE' | 'UNREACHABLE';
}

export interface TuyaHealth {
  status: string;
  devices: TuyaDeviceHealth[];
}

export interface TuyaPlug {
  device_id: string;
  switch_on: boolean | null;       // null when UNREACHABLE
  power_w: number | null;          // active power in watts
  voltage_v: number | null;        // mains voltage in volts
  current_ma: number | null;       // current draw in milliamps
  energy_kwh: number | null;       // cumulative energy consumed (kWh)
  countdown_s: number | null;      // remaining countdown in seconds (0 = no timer)
  data_freshness: 'LIVE' | 'STALE' | 'UNREACHABLE';
  last_polled_at: number | null;   // Unix epoch float, null if never polled
  custom_name: string | null;      // from device registry, null if not registered
  device_type: string | null;      // device type slug from registry, null if not registered
}

export interface TuyaPlugMutation extends TuyaPlug {
  data_confirmed: boolean;  // true if re-poll after command succeeded
}

export interface TuyaSetStateRequest {
  on: boolean;
}

export interface TuyaSetTimerRequest {
  seconds: number;  // 0-86400 (0 = cancel timer)
}

export interface TuyaHistoryItem {
  timestamp: number;
  device_id: string;
  granularity: 'raw' | 'hourly' | 'daily';
  // Raw fields (non-null for granularity="raw")
  switch_on?: boolean | null;
  power_w?: number | null;
  voltage_v?: number | null;
  current_ma?: number | null;
  energy_kwh?: number | null;
  // Aggregated fields (non-null for hourly/daily)
  avg_power_w?: number | null;
  min_voltage_v?: number | null;
  max_voltage_v?: number | null;
  max_current_ma?: number | null;
  energy_kwh_delta?: number | null;  // energy consumed during period
  sample_count?: number | null;
}

export interface TuyaHistoryResponse {
  device_id: string;
  granularity: 'raw' | 'hourly' | 'daily';
  period: { from: number; to: number };
  page: number;
  page_size: number;
  total: number;
  items: TuyaHistoryItem[];
}
```

### types/websocket.ts (updated imports + new types)

```typescript
// New import for Tuya
import type { TuyaPlug } from '@/types/tuyaProxy';

// Updated Topic union (D-14)
export type Topic =
  | 'fritzbox' | 'dirigera' | 'netatmo' | 'thermorossi'
  | 'hue' | 'sonos' | 'raspi' | 'tuya';

// New re-export
export type { TuyaPlug } from '@/types/tuyaProxy';

// FritzBoxDevice enriched (D-06)
export interface FritzBoxDevice {
  ip: string; name: string; mac: string; status: 0 | 1;
  custom_name?: string | null;
  device_type?: string | null;
}

// FritzBoxData enriched (D-05)
export interface FritzBoxData {
  devices: FritzBoxDevice[] | null;
  bandwidth: FritzBoxBandwidth | null;
  wan: FritzBoxWan | null;
  is_stale: boolean;
  fetched_at: string | null;
  data_freshness: 'LIVE' | 'STALE';
}

// DirigeraData enriched (D-07)
export interface DirigeraData {
  sensors: DirigeraSensor[] | null;
  data_freshness: 'LIVE' | 'STALE';  // inline: DirigeraDataFreshness is 3-state, avoid it
}

// NetatmoData replaced (D-04)
export interface NetatmoData {
  body: Record<string, unknown>;
  status: string;
  time_server: number;
  data_freshness: 'LIVE' | 'STALE' | 'UNREACHABLE';
  [key: string]: unknown;
}

// HueData enriched (D-02, D-01 array shape preserved)
export interface HueData {
  lights: HueLight[] | null;
  groups: HueGroup[] | null;
  data_freshness: 'LIVE' | 'STALE' | 'UNREACHABLE';  // wider than HueDataFreshness
}

// SonosData enriched (D-09)
export interface SonosData {
  speakers: SonosDeviceResponse[] | null;
  groups: SonosZoneResponse[] | null;
  data_freshness: SonosDataFreshness;
}

// RaspiData (new — D-12)
export interface RaspiData {
  cpu_percent: number;
  memory: Record<string, unknown>;
  disk: Record<string, unknown>;
  system: Record<string, unknown>;
  data_freshness: 'LIVE';
}

// TuyaData (new — D-13)
export interface TuyaData {
  plugs: TuyaPlug[] | null;
  data_freshness: 'LIVE' | 'STALE' | 'UNREACHABLE';
}

// TopicDataMap extended (D-15)
export type TopicDataMap = {
  fritzbox: FritzBoxData;
  dirigera: DirigeraData;
  netatmo: NetatmoData;
  thermorossi: ThermorossiData;
  hue: HueData;
  sonos: SonosData;
  raspi: RaspiData;
  tuya: TuyaData;
};
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| WS types modeled on pre-enrichment proxy shapes | Types must match enriched proxy shapes (data_freshness + registry metadata) | HA proxy enrichment added during v17.x | All 6 topic types need additive changes |
| HueData mirrored raw Hue Bridge v1 dict format | Array shape (proxy flattens to arrays) | Phase 141 migration | Consumers iterate arrays; dict shape would break them |

**No deprecated patterns** — this is all additive work.

---

## Open Questions

1. **DirigeraSensor `custom_name` nullability**
   - What we know: Proxy type has `custom_name: string` (non-nullable). WS doc shows `custom_name: string | null`.
   - What's unclear: Whether existing consumers of `DirigeraSensor` depend on it being non-nullable.
   - Recommendation: Leave `custom_name` as `string` (non-nullable) on `DirigeraSensor` to avoid breaking changes. Only add `device_type?: string | null`. The WS doc mismatch is tolerable since `custom_name` always comes back as a string from the proxy.

2. **TuyaData WS topic — does it send `{ plugs: TuyaPlug[] }` or bare `TuyaPlug[]`?**
   - What we know: `docs/api/tuya.md` describes `GET /plugs` returning `TuyaPlug[]` (bare array). CONTEXT.md D-13 says WS topic shape is `{ plugs: TuyaPlug[] | null; data_freshness: ... }` (wrapped). The WS doc mentions the topic but websocket.md does not yet have a `tuya` topic section.
   - What's unclear: The exact WS envelope shape for tuya. D-13 defines it as `{ plugs: TuyaPlug[] | null; data_freshness }`.
   - Recommendation: Follow D-13 exactly. The wrapped shape is consistent with all other providers (fritzbox has `{ devices, bandwidth, wan }`, dirigera has `{ sensors }`, etc.).

---

## Environment Availability

Step 2.6: SKIPPED — this phase is purely TypeScript type file edits with no external dependencies, CLI tools, databases, or services required.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest (jest-environment-jsdom) + TypeScript compiler |
| Config file | `jest.config.ts` |
| Quick run command | `npx tsc --noEmit` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map

This phase is types-only. Type correctness is validated by `tsc --noEmit`, not Jest runtime tests. The compiler enforces `strict + noUncheckedIndexedAccess`. No new unit tests are required because type definitions have no runtime behavior. Existing consumer hook tests catch regressions at compile time.

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|--------------|
| WSTYPE-01 through WSTYPE-14 | All type definitions compile with zero tsc errors | tsc compile | `npx tsc --noEmit` | N/A — compiler |
| WSTYPE-06 (NetatmoData interface) | `netatmoWsAdapter.ts` accesses `data.data_freshness` directly without casting | tsc compile | `npx tsc --noEmit` | N/A |
| WSTYPE-08 override (D-01) | `useLightsData.ts` still compiles — array access on `data.lights` | tsc compile | `npx tsc --noEmit` | Existing consumer |
| WSTYPE-02/03 (FritzBox enrichment) | `useNetworkData.ts` still compiles with enriched FritzBoxData | tsc compile | `npx tsc --noEmit` | Existing consumer |

### Sampling Rate
- **Per task commit:** `npx tsc --noEmit` — fast, catches type errors immediately
- **Per wave merge:** `npm test` — full suite to catch any unexpected regressions
- **Phase gate:** `npx tsc --noEmit` green + `npm test` green before `/gsd:verify-work`

### Wave 0 Gaps

None — existing test infrastructure covers all phase requirements. The primary validation mechanism is TypeScript compilation, which requires no additional setup. No new test files are needed because type definitions have no runtime behavior. Existing consumer hook tests (useLightsData, useNetworkData, useDirigeraData, useSonosData) will surface any breakage via tsc.

---

## Project Constraints (from CLAUDE.md)

- NEVER break existing functionality
- PREFER editing existing files over creating new (exception: `types/tuyaProxy.ts` is new and required)
- NEVER execute `npm run build` or `npm install`
- ALWAYS create/update unit tests (N/A for this types-only phase — compiler is the test)
- USE design system (N/A for this phase)
- NEVER commit/push without explicit request

---

## Sources

### Primary (HIGH confidence)
- `docs/api/websocket.md` — authoritative WS payload shapes for all 8 topics (verified 2026-03-28)
- `docs/api/tuya.md` — authoritative Tuya TypeScript interfaces (verified 2026-03-28)
- `types/websocket.ts` — current WS type file being modified (read directly)
- `types/hueProxy.ts` — current HueLight, HueGroup, HueDataFreshness definitions (read directly)
- `types/thermorossiProxy.ts` — current ThermorossiStatusResponse with data_freshness (read directly)
- `types/sonosProxy.ts` — current SonosDeviceResponse, SonosDataFreshness (read directly)
- `types/dirigeraProxy.ts` — current DirigeraSensor, DirigeraDataFreshness (read directly)
- `types/raspi.ts` — confirmed no WS aggregate type exists (read directly)
- `lib/netatmo/netatmoWsAdapter.ts` — confirmed NetatmoData access patterns (read directly)
- `app/components/devices/lights/hooks/useLightsData.ts` — confirmed array iteration pattern (read directly)

### Secondary (MEDIUM confidence)
- None required — all findings from direct source code reads

---

## Metadata

**Confidence breakdown:**
- Current state audit: HIGH — read every file directly
- Required changes: HIGH — derived from direct comparison of current types vs websocket.md
- Import strategy recommendation: HIGH — follows established project patterns
- DirigeraSensor `custom_name` nullability question: MEDIUM — conservative recommendation, but implementer should verify

**Research date:** 2026-03-28
**Valid until:** 2026-04-28 (stable domain — type definitions, no external API changes expected)
