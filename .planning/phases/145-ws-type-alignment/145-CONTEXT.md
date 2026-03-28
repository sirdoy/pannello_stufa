# Phase 145: WS Type Alignment - Context

**Gathered:** 2026-03-28
**Status:** Ready for planning

<domain>
## Phase Boundary

Update all WS topic TypeScript types in `types/websocket.ts` to match the enriched HA proxy payload shapes documented in `docs/api/websocket.md`. Add `raspi` and `tuya` to the Topic union and TopicDataMap. No runtime behavior changes — types only.

</domain>

<decisions>
## Implementation Decisions

### HueData Shape
- **D-01:** Keep HueData as `HueLight[] | null` and `HueGroup[] | null` (array shape from proxy). Do NOT switch to `Record<string, HueLight>` dict shape from the doc — the proxy already flattens to arrays and all `useLightsData` consumers iterate arrays. Breaking every consumer to match the raw Bridge v1 format is counterproductive.
- **D-02:** Add `data_freshness: HueDataFreshness` to HueData interface.
- **D-03:** HueLight proxy type already has all needed fields (name, on, brightness, etc.). Add `custom_name?: string | null` and `device_type?: string | null` if not already present.

### NetatmoData Typing
- **D-04:** Replace `type NetatmoData = Record<string, unknown>` with a proper interface: `{ body: Record<string, unknown>; status: string; time_server: number; data_freshness: 'LIVE' | 'STALE' | 'UNREACHABLE'; [key: string]: unknown; }`. The adapter (`netatmoWsAdapter.ts`) can then access `data_freshness` directly without casting.

### FritzBox Enrichment
- **D-05:** Add to FritzBoxData: `is_stale: boolean`, `fetched_at: string | null`, `data_freshness: 'LIVE' | 'STALE'`.
- **D-06:** Add to FritzBoxDevice: `custom_name?: string | null`, `device_type?: string | null` (optional — not all devices are in the registry).

### DirigeraData Enrichment
- **D-07:** Add `data_freshness: 'LIVE' | 'STALE'` to DirigeraData interface.
- **D-08:** DirigeraSensor proxy type already has `custom_name: string`. Add `device_type?: string | null` if not already present.

### SonosData Enrichment
- **D-09:** Add `data_freshness: SonosDataFreshness` to SonosData interface (import existing type from sonosProxy.ts).
- **D-10:** Add `custom_name?: string | null` and `device_type?: string | null` to SonosDeviceResponse if not already present (check proxy type first).

### ThermorossiData
- **D-11:** ThermorossiData already aliases ThermorossiStatusResponse which includes `data_freshness`. Verify `custom_name` and `device_type` are present; add if missing.

### RaspiData WS Shape
- **D-12:** Create new `RaspiData` interface matching the documented WS payload: `{ cpu_percent: number; memory: Record<string, unknown>; disk: Record<string, unknown>; system: Record<string, unknown>; data_freshness: 'LIVE'; }`. This is distinct from the per-endpoint types in `types/raspi.ts`.

### TuyaData WS Shape
- **D-13:** Create new `TuyaData` type for the WS payload. The WS `tuya` topic sends the same shape as `GET /api/v1/tuya/plugs` — an array of TuyaPlug objects. Define as: `{ plugs: TuyaPlug[] | null; data_freshness: 'LIVE' | 'STALE' | 'UNREACHABLE'; }`. The TuyaPlug interface will be defined in a new `types/tuyaProxy.ts` file (consistent with other providers).

### Topic Union & TopicDataMap
- **D-14:** Extend Topic: `'fritzbox' | 'dirigera' | 'netatmo' | 'thermorossi' | 'hue' | 'sonos' | 'raspi' | 'tuya'`.
- **D-15:** Add to TopicDataMap: `raspi: RaspiData; tuya: TuyaData;`.

### Claude's Discretion
- Import strategy for new data_freshness types (reuse existing union types from proxy files vs define locally)
- Whether to create a shared `DataFreshness` type or keep per-provider freshness types

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### WebSocket API Documentation
- `docs/api/websocket.md` — Source of truth for all WS topic payload shapes. Every type change must match this doc exactly (except D-01 HueData array shape decision).

### Tuya API Documentation
- `docs/api/tuya.md` — Source of truth for Tuya REST API shapes and TypeScript interfaces. TuyaPlug, TuyaHealth, TuyaHistoryResponse defined here.

### Existing Type Files
- `types/websocket.ts` — The file being modified. All WS types defined here.
- `types/hueProxy.ts` — HueLight, HueGroup, HueDataFreshness definitions
- `types/thermorossiProxy.ts` — ThermorossiStatusResponse with data_freshness
- `types/sonosProxy.ts` — SonosDeviceResponse, SonosZoneResponse, SonosDataFreshness
- `types/dirigeraProxy.ts` — DirigeraSensor, DirigeraDataFreshness
- `types/netatmoProxy.ts` — Netatmo proxy types (not directly used for WS but pattern reference)
- `types/raspi.ts` — Existing per-endpoint Raspi types (different shape from WS payload)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `types/hueProxy.ts:HueDataFreshness` — `'LIVE' | 'STALE' | 'UNREACHABLE'` union, reusable pattern
- `types/sonosProxy.ts:SonosDataFreshness` — Similar freshness union
- `types/dirigeraProxy.ts:DirigeraDataFreshness` — Similar freshness union
- All proxy type files follow consistent patterns: interface per response, freshness type per provider

### Established Patterns
- WS types re-export proxy types for convenience (line 16-20 of websocket.ts)
- FritzBox types are canonical in websocket.ts (no separate proxy type file)
- NetatmoData is raw format (adapter handles conversion separately)
- TopicDataMap provides type-safe topic→payload mapping

### Integration Points
- `lib/hooks/useWebSocketManager.ts` — Uses Topic type for subscribe/unsubscribe
- All 6 device hooks import from `types/websocket.ts` for WS message typing
- `app/components/ClientProviders.tsx` — WebSocket context initialization
- `lib/netatmo/netatmoWsAdapter.ts` — Consumes NetatmoData (will benefit from proper typing)

</code_context>

<specifics>
## Specific Ideas

- The Tuya types foundation (TuyaPlug interface in types/tuyaProxy.ts) should be created in this phase since TopicDataMap needs TuyaData which depends on TuyaPlug. This is types-only work, not infrastructure.
- FritzBoxDevice enrichment fields should be optional (`custom_name?: string | null`) since not all devices are registered.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 145-ws-type-alignment*
*Context gathered: 2026-03-28*
