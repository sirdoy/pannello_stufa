# Phase 108: Frontend Hooks Rewrite - Context

**Gathered:** 2026-03-20
**Status:** Ready for planning

<domain>
## Phase Boundary

Rewrite useLightsData and useLightsCommands hooks to read proxy response shapes (flat format with capability_tier, v1 body format for commands, 202 Accepted + delayed refresh, data_freshness from proxy). LightsCard UI wiring updated to pass correct data shapes to sub-components. Users interact with lights using the new data format with no visible behavior change.

</domain>

<decisions>
## Implementation Decisions

### Data shape adaptation (useLightsData)
- Replace all CLIP v2 nested property access with flat proxy format:
  - `light.on.on` → `light.on` (boolean directly on HueLight)
  - `light.dimming.brightness` (0-100%) → `Math.round((light.brightness ?? 0) / 254 * 100)` (proxy returns 0-254)
  - `room.metadata.name` → `group.name` (HueGroup.name)
  - `room.id` → `group.group_id` (HueGroup.group_id)
  - `room.services` / `room.children` for light matching → `group.lights[]` (string[] of member light IDs)
  - `scene.group.rid` → `scene.group_id` (HueScene.group_id)
  - `light.id` → `light.light_id` (HueLight.light_id)
- Room selection: selectedRoomId now holds `group_id` (proxy string key), auto-select first group
- Room lights: filter lights where `group.lights.includes(light.light_id)` instead of children/services matching
- Room scenes: filter where `scene.group_id === selectedGroupId`
- Use typed HueLight[], HueGroup[], HueScene[] from `types/hueProxy.ts` — replace all `any[]`
- `success()` spreads data into response — frontend must account for `{ success: true, 0: ..., 1: ... }` array shape OR routes may need adjustment to wrap arrays (e.g., `success({ lights: data })`)

### Brightness conversion at client boundary
- UI displays 0-100% (user-facing)
- Proxy accepts/returns 0-254 (Bridge native range)
- Read: `Math.round((light.brightness ?? 0) / 254 * 100)` — display as percent
- Write: `Math.round(percent * 254 / 100)` — send as bri value
- avgBrightness computed as percent from proxy's 0-254 values
- Slider min=1 max=100 (percent) — same as current, conversion happens at fetch/command boundary

### Command body format (useLightsCommands)
- Room toggle: `{ on: true/false }` — NOT `{ on: { on: true } }`
- Brightness change: `{ bri: Math.round(percent * 254 / 100) }` — NOT `{ dimming: { brightness: percent } }`
- Scene activation path change: `POST /api/hue/groups/${groupId}/scenes/${sceneId}` — NOT `PUT /api/hue/scenes/${sceneId}/activate`
  - handleSceneActivate needs groupId parameter (currently only takes sceneId)
  - Get groupId from the scene's group_id field
- All-lights toggle: iterate over groups by group_id, send `{ on }` to each group action endpoint
  - Replace grouped_light service lookup with direct group_id iteration
- After 202 Accepted: wait `suggested_poll_delay_s` seconds, then re-fetch data (delayed refresh pattern)
  - Currently hooks immediately call `fetchData()` — add setTimeout delay based on response

### Connection/staleness model (data_freshness replaces connection strategy)
- Remove connectionMode state (`local` | `remote` | `hybrid` | `disconnected`) — proxy handles this
- Remove remoteConnected state — no remote/cloud API with proxy
- checkConnection reads health endpoint: `connected` from `health.connected`, stale from `data_freshness === 'STALE'`
- 503 from health endpoint → set connected=false (Bridge UNREACHABLE)
- Add `stale: boolean` state to indicate data staleness for UI indicator
- Remove status badge logic (Local/Cloud/Hybrid) from LightsCard — replaced by staleness indicator

### Legacy code removal from hooks
- Remove entire pairing state machine from useLightsData:
  - Remove states: pairing, pairingStep, discoveredBridges, selectedBridge, pairingCountdown, pairingError
  - Remove pairingTimerRef
  - Remove from UseLightsDataReturn interface
- Remove from useLightsCommands:
  - Remove: handleRemoteAuth, handleDisconnectRemote, handleStartPairing, handlePairWithBridge, handleConfirmButtonPressed, handleSelectBridge, handleRetryPairing, handleCancelPairing
  - Remove from UseLightsCommandsReturn interface
  - Remove UseLightsCommandsParams dependency on pairing-related fields
- Remove from LightsCard orchestrator:
  - Remove pairing-related props from commands initialization
  - Remove pairing-related banner logic from buildLightsBanners
  - Remove connect flow from DeviceCard props (no more onConnect/connectButtonLabel)
  - Update LightsBanners to remove pairing banners
- colorUtils.ts adaptation:
  - `supportsColor(light)` currently checks `light.color?.gamut || light.color?.xy` (CLIP v2)
  - Proxy format has `capability_tier` and `hue`/`saturation` fields — rewrite to check `light.capability_tier === 'color'`
  - `getCurrentColorHex(light)` uses `light.color.xy` — proxy provides `hue` and `saturation` values, needs hue/sat→hex conversion
  - Alternative: adapt colorUtils to work with proxy flat fields (hue 0-65535, saturation 0-254)

### Claude's Discretion
- Whether to fix `success()` array spreading in routes or adapt frontend to handle current shape
- Exact error message wording for staleness indicator
- Whether to inline brightness conversion or extract utility function
- Test structure for rewritten hooks

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Hue Proxy API (response shapes)
- `docs/api/hue.md` — Complete Hue proxy API: response shapes for HueLight, HueGroup, HueScene, HueBridgeHealth; capability_tier values; data_freshness semantics; HueLightStateRequest body format; 202 Accepted pattern with suggested_poll_delay_s; 409 Conflict handling
- `docs/api/README.md` — API authentication patterns

### Type definitions
- `types/hueProxy.ts` — All proxy TypeScript types: HueLight, HueGroup, HueScene, HueBridgeHealth, HueLightStateRequest, HueCommandResponse

### Frontend hooks (files to rewrite)
- `app/components/devices/lights/hooks/useLightsData.ts` — Current CLIP v2 data hook (523 lines, heavy pairing state)
- `app/components/devices/lights/hooks/useLightsCommands.ts` — Current CLIP v2 command hook (431 lines, pairing commands)
- `app/components/devices/lights/LightsCard.tsx` — Orchestrator component (186 lines)
- `app/components/devices/lights/components/LightsRoomControl.tsx` — Room control presentational component (reads selectedRoomGroupedLightId, avgBrightness)
- `app/components/devices/lights/components/LightsBanners.ts` — Banner builder (has pairing banners to remove)
- `app/components/devices/lights/components/LightsScenes.tsx` — Scene list (reads roomScenes, calls onSceneActivate)

### Color utilities (needs adaptation)
- `lib/hue/colorUtils.ts` — supportsColor and getCurrentColorHex use CLIP v2 light.color.xy format

### API routes (response shape reference)
- `app/api/hue/lights/route.ts` — Returns `success(data as unknown as Record<string, unknown>)` where data is HueLight[]
- `app/api/hue/rooms/route.ts` — Returns `success(data ...)` where data is HueGroup[]
- `app/api/hue/scenes/route.ts` — Returns `success(data ...)` where data is HueScene[]
- `app/api/hue/status/route.ts` — Returns `success(data ...)` where data is HueBridgeHealth
- `lib/core/apiResponse.ts` — `success()` spreads data with `{ success: true, ...data }` — array spreading produces `{ 0:..., 1:... }` not wrapped arrays

### Proxy client (command wrappers)
- `lib/hue/hueProxy.ts` — setLightState, setGroupAction, activateScene wrappers

### Existing tests (to update)
- `__tests__/components/devices/lights/hooks/useLightsData.test.ts` — Tests for data hook
- `__tests__/components/devices/lights/hooks/useLightsCommands.test.ts` — Tests for command hook
- `__tests__/components/devices/lights/LightsCard.orchestrator.test.tsx` — Orchestrator integration test
- `__tests__/components/devices/lights/components/LightsRoomControl.test.tsx` — Room control test

### Established patterns
- `app/components/devices/stove/hooks/useStoveData.ts` — Reference: how Thermorossi hooks read proxy shapes after v13.0 migration
- `lib/thermorossiProxy.ts` — Reference: 202 Accepted pattern with delayed refresh

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `types/hueProxy.ts`: Complete typed interfaces for all proxy response/request shapes — use these to replace `any[]` throughout hooks
- `lib/hue/hueProxy.ts`: Proxy client with convenience wrappers — hooks should call API routes (not proxy directly), but types align
- `lib/hooks/useAdaptivePolling.ts`: Already used by useLightsData — keep as-is
- `lib/hooks/useRetryableCommand.ts`: Already used by useLightsCommands — keep as-is
- `lib/core/apiResponse.ts`: `success()` function spreads data — IMPORTANT: arrays spread as `{ 0:..., 1:..., success:true }`, not as wrapped arrays

### Established Patterns
- Orchestrator pattern: hooks manage state, sub-components are presentational (Phase 58/59)
- 202 + delayed refresh: Thermorossi v13.0 established this pattern — stove hooks wait suggested_poll_delay_s before refetch
- Data shape: proxy returns flat objects (HueLight has `on: boolean` not `on: { on: boolean }`)
- Room → Group mapping: proxy uses `group_id` and `lights: string[]` instead of CLIP v2 `id`, `services`, `children`

### Integration Points
- LightsCard.tsx receives data from useLightsData and passes to 4 sub-components
- LightsRoomControl.tsx reads `selectedRoomGroupedLightId` — rename to `selectedGroupId` (simpler, matches proxy naming)
- LightsScenes.tsx calls `onSceneActivate(sceneId)` — needs `onSceneActivate(sceneId, groupId)` for new path pattern
- LightsHouseControl.tsx reads `totalLightsOn`, `allHouseLightsOn` — derived from lights array, adapter logic changes
- handleAllLightsToggle iterates room services for grouped_light IDs — change to iterate groups by group_id
- RoomSelector reads `room.metadata.name` — change to `group.name`

### Critical Observation: success() Array Spreading
- Current routes do `success(data as unknown as Record<string, unknown>)` where data is an array
- `success()` does `{ success: true, ...data }` — spreading an array gives `{ 0: item, 1: item, success: true }`
- Frontend currently expects `lightsData.lights || []` — this won't work with numeric-keyed response
- **Resolution options**: (1) fix routes to wrap arrays: `success({ lights: data })`, or (2) have frontend read response differently
- This MUST be addressed — either in routes or in hooks. Claude's discretion on approach.

</code_context>

<specifics>
## Specific Ideas

- Follow the exact same migration pattern as Thermorossi v13.0 Phase 101 (useStoveData/useStoveCommands rewrite)
- The 202 Accepted + delayed refresh pattern (wait suggested_poll_delay_s then refetch) was validated in v13.0 — reuse same approach
- colorUtils.ts `supportsColor` should use `capability_tier === 'color'` (cleaner than checking for nested color objects)
- For color hex display, proxy provides `hue` (0-65535) and `saturation` (0-254) — need hue/sat→hex conversion function (or adapt getCurrentColorHex)

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 108-frontend-hooks-rewrite*
*Context gathered: 2026-03-20*
