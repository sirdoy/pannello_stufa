# Phase 108: Frontend Hooks Rewrite - Research

**Researched:** 2026-03-20
**Domain:** React hooks rewrite — Hue proxy data shapes, 202 Accepted pattern, staleness model
**Confidence:** HIGH

## Summary

Phase 108 rewrites `useLightsData` and `useLightsCommands` to consume the Hue proxy API instead of the old CLIP v2 API. All proxy response shapes, TypeScript types, and the 202 Accepted + delayed refresh pattern are already established by Phase 106/107 — this phase is purely a frontend adaptation with no new API work.

The current hooks use deeply nested CLIP v2 property access (`light.on.on`, `room.metadata.name`, `light.dimming.brightness`) that must be replaced with flat proxy fields (`light.on`, `group.name`, `light.brightness`). The pairing state machine (~150 lines in `useLightsData`, ~200 lines in `useLightsCommands`) is entirely removed — the proxy handles Bridge connectivity. The 202 Accepted + delayed refresh pattern from Thermorossi v13.0 (`data.suggested_poll_delay_s ?? fallback`) is the exact template to follow.

A critical blocker requires a decision before planning: the three collection GET routes (`/api/hue/lights`, `/api/hue/rooms`, `/api/hue/scenes`) all call `success(data as unknown as Record<string, unknown>)` where `data` is an array. JavaScript array spreading produces `{ 0: item, 1: item, success: true }` — not `{ lights: [...] }`. The frontend currently reads `lightsData.lights || []` which will not work with numeric-keyed keys. This must be resolved either by fixing the routes (wrapping arrays: `success({ lights: data })`) or by extracting the array from the spread object in the hooks. The recommended approach is to fix the routes — it is cleaner and consistent with how all other collection endpoints in the codebase work.

**Primary recommendation:** Fix routes first to wrap arrays, then rewrite hooks to use typed HueLight/HueGroup/HueScene properties with direct field access. Follow the Thermorossi v13.0 pattern exactly for 202 handling.

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Data shape adaptation (useLightsData):**
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

**Brightness conversion at client boundary:**
- UI displays 0-100% (user-facing)
- Proxy accepts/returns 0-254 (Bridge native range)
- Read: `Math.round((light.brightness ?? 0) / 254 * 100)` — display as percent
- Write: `Math.round(percent * 254 / 100)` — send as bri value
- avgBrightness computed as percent from proxy's 0-254 values
- Slider min=1 max=100 (percent) — same as current, conversion happens at fetch/command boundary

**Command body format (useLightsCommands):**
- Room toggle: `{ on: true/false }` — NOT `{ on: { on: true } }`
- Brightness change: `{ bri: Math.round(percent * 254 / 100) }` — NOT `{ dimming: { brightness: percent } }`
- Scene activation path change: `POST /api/hue/groups/${groupId}/scenes/${sceneId}` — NOT `PUT /api/hue/scenes/${sceneId}/activate`
  - handleSceneActivate needs groupId parameter (currently only takes sceneId)
  - Get groupId from the scene's group_id field
- All-lights toggle: iterate over groups by group_id, send `{ on }` to each group action endpoint
  - Replace grouped_light service lookup with direct group_id iteration
- After 202 Accepted: wait `suggested_poll_delay_s` seconds, then re-fetch data (delayed refresh pattern)
  - Currently hooks immediately call `fetchData()` — add setTimeout delay based on response

**Connection/staleness model (data_freshness replaces connection strategy):**
- Remove connectionMode state (`local` | `remote` | `hybrid` | `disconnected`) — proxy handles this
- Remove remoteConnected state — no remote/cloud API with proxy
- checkConnection reads health endpoint: `connected` from `health.connected`, stale from `data_freshness === 'STALE'`
- 503 from health endpoint → set connected=false (Bridge UNREACHABLE)
- Add `stale: boolean` state to indicate data staleness for UI indicator
- Remove status badge logic (Local/Cloud/Hybrid) from LightsCard — replaced by staleness indicator

**Legacy code removal from hooks:**
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

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| UI-01 | useLightsData reads proxy response shapes (flat format, capability_tier) | HueLight/HueGroup/HueScene types fully defined in types/hueProxy.ts — all field mappings documented in CONTEXT.md decisions section |
| UI-02 | useLightsCommands sends v1 body format (on/bri/ct instead of nested objects) | HueLightStateRequest interface: `on: boolean`, `bri: number (0-254)`, `ct: number (153-500 mirek)` — flat, not nested |
| UI-03 | Brightness conversion 0-100% ↔ 0-254 at client boundary | Conversion formula locked: read=`Math.round((bri??0)/254*100)`, write=`Math.round(pct*254/100)` |
| UI-04 | Scene activate uses new path pattern (POST /groups/{gid}/scenes/{sid}) | Route exists at app/api/hue/groups/[groupId]/scenes/[sceneId]/route.ts from Phase 107; method is POST with empty body |
| UI-05 | 202 Accepted + suggested_poll_delay_s drives delayed refresh | Pattern verified in useStoveCommands.ts: `const delayMs = (data.suggested_poll_delay_s ?? 2) * 1000; await new Promise(r=>setTimeout(r, delayMs)); await fetchData()` |
| UI-06 | data_freshness replaces custom staleness/connection checks | GET /api/hue/status returns HueBridgeHealth with `connected: boolean` and `data_freshness: "LIVE"|"STALE"` — 503 means UNREACHABLE |
</phase_requirements>

---

## Standard Stack

### Core (already in project — no new installs)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React hooks | 19.x (via Next.js 15.5) | State management in hooks | Project standard |
| `useAdaptivePolling` | internal | Polling with visibility/network awareness | Already used by useLightsData — keep as-is |
| `useRetryableCommand` | internal | Retry with exponential backoff + deduplication | Already used by useLightsCommands — keep as-is |
| TypeScript | 5.x | Type safety | Project-wide, strict mode enabled |

### Type Definitions (from types/hueProxy.ts — HIGH confidence, verified against live proxy)

| Type | Fields to Use | Notes |
|------|---------------|-------|
| `HueLight` | `light_id`, `name`, `on` (boolean), `brightness` (0-254 or null), `capability_tier`, `hue`, `saturation`, `reachable` | Replaces old CLIP v2 light shape |
| `HueGroup` | `group_id`, `name`, `lights` (string[]), `any_on`, `all_on`, `brightness` (0-254 or null) | Replaces room with `services/children` |
| `HueScene` | `scene_id`, `name`, `group_id`, `group_name` | Key change: `group_id` not `group.rid` |
| `HueBridgeHealth` | `connected` (boolean), `data_freshness` ("LIVE"\|"STALE") | 503 = UNREACHABLE, never in body |
| `HueLightStateRequest` | `on?`, `bri?` (0-254), `ct?` (153-500), `hue?`, `sat?` | Flat v1 format |
| `HueCommandResponse` | `suggested_poll_delay_s` (number), `poll_endpoint` (string) | 202 Accepted body |

**Installation:** None required. All types and infrastructure already in project.

---

## Architecture Patterns

### Recommended File Structure (unchanged from current)

```
app/components/devices/lights/
├── LightsCard.tsx                        # Orchestrator (rewrite: remove pairing props)
├── hooks/
│   ├── useLightsData.ts                  # Rewrite: proxy shapes, staleness
│   └── useLightsCommands.ts              # Rewrite: v1 bodies, 202 pattern, remove pairing
├── components/
│   ├── LightsBanners.tsx                 # Update: remove pairing banners, add staleness banner
│   ├── LightsRoomControl.tsx             # Update: selectedGroupId rename
│   ├── LightsScenes.tsx                  # Update: onSceneActivate signature (sceneId, groupId)
│   └── LightsHouseControl.tsx            # No changes needed
lib/hue/
└── colorUtils.ts                         # Update: proxy-native supportsColor and getCurrentColorHex
```

### Pattern 1: 202 Accepted + Delayed Refresh (from useStoveCommands.ts — VERIFIED)

**What:** After a command endpoint returns 202, wait `suggested_poll_delay_s` then re-fetch.
**When to use:** All room toggle, brightness change, scene activate commands.

```typescript
// Source: app/components/devices/stove/hooks/useStoveCommands.ts (lines 108-112)
if (response) {
  if (!response.ok) {
    if (response.status === 409) throw new Error('Command not allowed in current state');
    throw new Error(`Command failed: ${response.status}`);
  }
  const data = await response.json() as HueCommandResponse;
  const delayMs = (data.suggested_poll_delay_s ?? 2) * 1000;
  await new Promise<void>(resolve => setTimeout(resolve, delayMs));
  await lightsData.fetchData();
}
```

**For Hue, the fallback value should be 2** (not 15 as in stove), because light transitions are fast (<1s) and the proxy hint is typically 2s.

### Pattern 2: Proxy Array Response Extraction

**What:** Routes return `success(data as unknown as Record<string, unknown>)` where data is `HueLight[]`. The `success()` function does `{ success: true, ...data }`. Spreading an array gives `{ 0: item, 1: item, success: true }`.
**Resolution (Claude's discretion, recommended):** Fix the three routes to wrap arrays before calling success:

```typescript
// app/api/hue/lights/route.ts — FIXED version
export const GET = withAuthAndErrorHandler(async () => {
  const data = await getLights();
  return success({ lights: data });
}, 'Hue/Lights');

// app/api/hue/rooms/route.ts — FIXED version
export const GET = withAuthAndErrorHandler(async () => {
  const data = await getGroups();
  return success({ groups: data });
}, 'Hue/Rooms');

// app/api/hue/scenes/route.ts — FIXED version
export const GET = withAuthAndErrorHandler(async () => {
  const groupId = request.nextUrl.searchParams.get('group_id') ?? undefined;
  const data = await getScenes(groupId);
  return success({ scenes: data });
}, 'Hue/Scenes');
```

Then in `useLightsData.fetchData()`:
```typescript
const roomsData = await roomsRes.json() as { groups?: HueGroup[]; success?: boolean };
const lightsData = await lightsRes.json() as { lights?: HueLight[]; success?: boolean };
const scenesData = await scenesRes.json() as { scenes?: HueScene[]; success?: boolean };
setGroups(roomsData.groups ?? []);
setLights(lightsData.lights ?? []);
setScenes(scenesData.scenes ?? []);
```

**Alternative (if avoiding route changes):** The hook can read numeric-keyed spread by using `Object.values()` and filtering out the `success` boolean field — but this is fragile and not recommended.

### Pattern 3: Health-Based Staleness Model

**What:** Remove connectionMode/remoteConnected state; replace with `connected: boolean` and `stale: boolean`.

```typescript
// NEW checkConnection in useLightsData
async function checkConnection() {
  try {
    setLoading(true);
    setError(null);
    const response = await fetch('/api/hue/status');
    if (!response.ok) {
      // 503 = Bridge UNREACHABLE
      setConnected(false);
      setStale(false);
      return;
    }
    const health = await response.json() as HueBridgeHealth;
    setConnected(health.connected);
    setStale(health.data_freshness === 'STALE');
  } catch (err) {
    setConnected(false);
    setStale(false);
    setError(err instanceof Error ? err.message : String(err));
  } finally {
    setLoading(false);
  }
}
```

### Pattern 4: colorUtils.ts Proxy Adaptation

**What:** `supportsColor` and `getCurrentColorHex` use CLIP v2 `light.color.xy`. Proxy provides `capability_tier`, `hue` (0-65535), `saturation` (0-254).

```typescript
// UPDATED supportsColor — Source: CONTEXT.md decision
import type { HueLight } from '@/types/hueProxy';

export function supportsColor(light: HueLight): boolean {
  return light.capability_tier === 'color';
}

// UPDATED getCurrentColorHex — hue/sat to hex conversion
export function getCurrentColorHex(light: HueLight): string | null {
  if (light.capability_tier !== 'color') return null;
  if (light.hue === null || light.saturation === null) return null;

  // Convert proxy hue (0-65535) to degrees (0-360)
  const hueDeg = (light.hue / 65535) * 360;
  // Convert proxy saturation (0-254) to percentage (0-100)
  const satPct = (light.saturation / 254) * 100;
  // Use HSL with assumed 50% lightness for visualization purposes
  return hslToHex(hueDeg, satPct, 50);
}

function hslToHex(h: number, s: number, l: number): string {
  s /= 100;
  l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}
```

### Pattern 5: LightsScenes Signature Change

`LightsScenes` currently calls `onSceneActivate(scene.id)`. Scenes now use `scene_id` (not `id`) and the command needs `group_id`. Two approaches:
1. Pass `groupId` from parent through `LightsScenes` as a prop, call `onSceneActivate(scene.scene_id, groupId)`
2. Have the command handler look up `group_id` from the scene object — cleaner if scenes have group_id embedded

**Recommended:** Each scene object already has `group_id`. Pass `selectedGroupId` to `LightsScenes` and let it read `scene.group_id` directly when calling the callback. This avoids prop drilling:

```typescript
// LightsScenes props update
interface LightsScenesProps {
  roomScenes: HueScene[];
  refreshing: boolean;
  onSceneActivate: (sceneId: string, groupId: string) => void;
}
// In component:
onClick={() => onSceneActivate(scene.scene_id, scene.group_id)}
```

### Anti-Patterns to Avoid

- **Keeping `any[]` types:** Replace with `HueLight[]`, `HueGroup[]`, `HueScene[]` from `types/hueProxy.ts`.
- **Immediate fetchData after command:** Must add `suggested_poll_delay_s` wait before re-fetching.
- **Keeping `selectedRoomGroupedLightId`:** Rename to `selectedGroupId` — the proxy `group_id` is the direct action target, no indirection through grouped_light service.
- **Partial removal of pairing state:** All pairing states must be removed together — leaving partial stubs causes TypeScript errors in the interface.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Hue hue/sat→hex color conversion | Custom math | `hslToHex` utility in colorUtils.ts | Standard HSL math; proxy provides hue in degrees (via 0-65535 scaling) |
| Polling with visibility | Custom setInterval + visibilitychange | `useAdaptivePolling` (already used) | Handles tab visibility, network quality, jitter |
| Command deduplication | Custom state flag | `useRetryableCommand` (already used) | Handles retry, deduplication, error state with `lastError` |
| Brightness UI-to-wire conversion | Ad-hoc inline math | Utility function (optional) | Extraction avoids repetition across handleBrightnessChange and getRoomLightColors |

**Key insight:** All infrastructure is already in place. This phase is pure data-mapping adaptation.

---

## Common Pitfalls

### Pitfall 1: success() Array Spreading
**What goes wrong:** `success(lightsArray as unknown as Record<string, unknown>)` produces `{ 0: ..., 1: ..., success: true }` — not `{ lights: [...] }`. Frontend reading `data.lights || []` gets `undefined`.
**Why it happens:** JavaScript spread on arrays assigns numeric indices as keys.
**How to avoid:** Fix routes to wrap arrays in named keys before calling `success()`.
**Warning signs:** `lights.length === 0` after fetch even when Bridge has lights.

### Pitfall 2: selectedRoomId holds group_id, not room UUID
**What goes wrong:** After rewrite, `selectedRoomId` state variable holds a proxy `group_id` string (e.g., `"1"`, `"3"`). Code that compares it to CLIP v2 `room.id` (UUID) will never match.
**Why it happens:** Proxy uses short numeric string IDs; CLIP v2 used UUID-format IDs.
**How to avoid:** Auto-select: `setSelectedRoomId(groups[0]?.group_id ?? null)`. Room lookup: `groups.find(g => g.group_id === selectedRoomId)`.
**Warning signs:** Room selector always shows empty, roomLights always empty.

### Pitfall 3: Scene activation path requires both sceneId AND groupId
**What goes wrong:** Current `handleSceneActivate` only takes `sceneId`. New path is `POST /api/hue/groups/${groupId}/scenes/${sceneId}`. Missing groupId → 404.
**Why it happens:** The scene proxy path embeds scene under group (non-obvious).
**How to avoid:** `LightsScenes` passes `scene.group_id` alongside `scene.scene_id` to the callback.
**Warning signs:** Scene activate calls fail with 404 "group not found".

### Pitfall 4: HueGroup.brightness is group action state, not reliable for avgBrightness
**What goes wrong:** Using `group.brightness` for avgBrightness display — this is the last group action state, which can be null or stale.
**Why it happens:** Proxy group brightness is derived from the group's last SET action, not from individual light states.
**How to avoid:** Compute avgBrightness from individual `lights` in the group: filter by `group.lights.includes(light.light_id)`, then average `Math.round((light.brightness ?? 0) / 254 * 100)`.
**Warning signs:** avgBrightness shows 0 when lights are on.

### Pitfall 5: colormode "hs" does not mean hue/saturation are non-null
**What goes wrong:** Checking `light.colormode === 'hs'` and assuming `hue` and `saturation` are present.
**Why it happens:** Proxy typing declares both as `number | null`.
**How to avoid:** Null-guard both: `if (light.hue === null || light.saturation === null) return null`.

### Pitfall 6: Removing pairing state breaks UseLightsCommandsParams
**What goes wrong:** `UseLightsCommandsParams` currently includes `setPairing`, `pairingTimerRef`, etc. LightsCard passes these from useLightsData. Removing from useLightsData without updating the params interface causes type errors.
**Why it happens:** The two hooks are tightly coupled through the params interface.
**How to avoid:** Remove from both interface definition AND all call sites simultaneously. The params should shrink to only: `setRefreshing`, `setLoadingMessage`, `setError`, `fetchData`, `rooms` (as HueGroup[]), `checkConnection`, `connected`.

---

## Code Examples

### Verified: Proxy Response Field Access

```typescript
// Source: types/hueProxy.ts (verified against live proxy 2026-03-19)

// OLD (CLIP v2)
const isOn = light.on?.on;
const brightness = light.dimming?.brightness; // 0-100%
const roomName = room.metadata?.name;
const roomId = room.id;
const sceneGroupId = scene.group?.rid;

// NEW (proxy)
const isOn = light.on; // boolean directly
const brightness = Math.round((light.brightness ?? 0) / 254 * 100); // 0-100% from 0-254
const roomName = group.name;
const roomId = group.group_id;
const sceneGroupId = scene.group_id;
```

### Verified: Room-to-Lights Matching

```typescript
// OLD: CLIP v2 children/services matching (fragile, dual-path)
const roomLights = lights.filter(light =>
  selectedRoom?.children?.some(c => c.rid === light.id || c.rid === light.owner?.rid)
);

// NEW: Proxy direct membership (clean, single path)
const roomLights = lights.filter(light =>
  selectedGroup?.lights.includes(light.light_id) ?? false
);
```

### Verified: Room Toggle Command Body

```typescript
// OLD (CLIP v2 nested)
body: JSON.stringify({ on: { on: true } })

// NEW (v1 flat)
body: JSON.stringify({ on: true })
// Route: PUT /api/hue/rooms/${groupId} (group action endpoint)
```

### Verified: Brightness Change Command Body

```typescript
// OLD (CLIP v2 nested)
body: JSON.stringify({ dimming: { brightness: parseFloat(brightness) } })

// NEW (v1 flat, with conversion)
const bri254 = Math.round(parseFloat(brightness) * 254 / 100);
body: JSON.stringify({ bri: bri254 })
```

### Verified: Scene Activation

```typescript
// OLD (wrong path and method)
await hueSceneCmd.execute(`/api/hue/scenes/${sceneId}/activate`, { method: 'PUT' });

// NEW (correct path and method, from Phase 107)
await hueSceneCmd.execute(`/api/hue/groups/${groupId}/scenes/${sceneId}`, { method: 'POST' });
```

### Verified: LightsCard RoomSelector Wiring (changes needed)

```typescript
// OLD (CLIP v2 room shape)
rooms={lightsData.rooms.map((room: any) => ({
  id: room.id,
  name: room.metadata?.name || 'Stanza'
}))}

// NEW (proxy group shape)
rooms={lightsData.groups.map((group: HueGroup) => ({
  id: group.group_id,
  name: group.name
}))}
```

### Verified: Polling Configuration (keep identical)

```typescript
// Source: useLightsData.ts lines 233-239 — keep this configuration
useAdaptivePolling({
  callback: fetchData,
  interval: connected ? 60000 : null,
  alwaysActive: false, // Non-critical: lights, pause when hidden
  immediate: true,
  initialDelay: 100,   // Stagger on dashboard mount
});
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| CLIP v2 nested property access (`light.on.on`) | Flat proxy fields (`light.on`) | Phase 108 | Simpler data access, no CLIP v2 knowledge needed |
| connection_mode (local/remote/hybrid/disconnected) | `connected + stale` boolean pair | Phase 108 | Proxy handles connection routing; frontend only needs connected/stale |
| Pairing state machine (~16 state variables + timer) | None (removed) | Phase 108 | Proxy handles Bridge connection — no pairing needed |
| Immediate fetchData after command | wait(suggested_poll_delay_s) then fetchData | Phase 108 (Hue) | Stove v13.0 established this pattern |
| `light.color.xy` for color detection | `capability_tier === 'color'` | Phase 108 | Cleaner capability check, no xy math needed for detection |
| Grouped light service ID lookup | Direct group_id | Phase 108 | group_id is the direct action target |

**Deprecated/outdated:**
- `selectedRoomGroupedLightId`: Rename to `selectedGroupId` — the proxy removes the grouped_light indirection
- `connectionMode` state: Remove — proxy is the only connection mode
- `remoteConnected` state: Remove — no remote/cloud with proxy
- LightsCard `onConnect`/`connectButtonLabel` DeviceCard props: Remove — no pairing flow

---

## Open Questions

1. **selectedGroupId vs selectedRoomId variable name**
   - What we know: The current name is `selectedRoomId` but will hold `group_id`
   - What's unclear: Whether to rename the state variable or keep the name for minimal diff
   - Recommendation: Rename to `selectedGroupId` for semantic clarity — the planner can make this call

2. **Staleness banner vs warning indicator**
   - What we know: `stale: boolean` must drive some UI indicator
   - What's unclear: Whether to add a banner in LightsBanners or an inline indicator in LightsCard header
   - Recommendation: Follow the pattern from other device cards — add a warning banner in `buildLightsBanners` when `stale === true`

3. **hslToHex for colorUtils vs warm white fallback**
   - What we know: Proxy provides hue (0-65535) and saturation (0-254) for color-tier lights; xy is not provided
   - What's unclear: Whether all colors display correctly with HSL approximation vs CIE xy (used by current code)
   - Recommendation: Implement hslToHex and use warm white `#FFE4B5` as fallback when saturation is very low (< 20) — this matches current fallback behavior

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Jest + React Testing Library |
| Config file | `jest.config.ts` |
| Quick run command | `npm test -- --testPathPattern="useLightsData\|useLightsCommands\|LightsCard" --watchAll=false` |
| Full suite command | `npm test -- --watchAll=false` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| UI-01 | useLightsData reads proxy flat fields | unit | `npm test -- --testPathPattern="useLightsData" --watchAll=false` | Exists (needs rewrite) |
| UI-02 | useLightsCommands sends v1 body format | unit | `npm test -- --testPathPattern="useLightsCommands" --watchAll=false` | Exists (needs rewrite) |
| UI-03 | Brightness 0-100% ↔ 0-254 conversion | unit | included in UI-01 test | Exists (needs update) |
| UI-04 | Scene activate POST /groups/{gid}/scenes/{sid} | unit | included in UI-02 test | Exists (needs update) |
| UI-05 | 202 Accepted triggers delayed fetchData | unit | included in UI-02 test | Exists (needs update) |
| UI-06 | data_freshness → stale state | unit | included in UI-01 test | Exists (needs update) |

### Sampling Rate
- **Per task commit:** `npm test -- --testPathPattern="useLightsData\|useLightsCommands" --watchAll=false`
- **Per wave merge:** `npm test -- --watchAll=false`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
None — existing test infrastructure covers all phase requirements. The test files exist and will be rewritten in sync with the hooks they test.

---

## Critical Implementation Order

The following dependency order matters for the plan structure:

1. **Fix routes first** (lights, rooms, scenes GET — wrap arrays in named keys) — unblocks all hook data reading
2. **Rewrite useLightsData** — proxy types, flat field access, staleness, remove pairing states
3. **Rewrite colorUtils.ts** — proxy-native supportsColor and getCurrentColorHex (needed by useLightsData)
4. **Rewrite useLightsCommands** — v1 bodies, 202 pattern, remove pairing handlers
5. **Update LightsBanners** — remove pairing banners, add staleness banner
6. **Update LightsCard orchestrator** — remove pairing props, update wiring
7. **Update LightsScenes** — new onSceneActivate(sceneId, groupId) signature
8. **Update tests** — rewrite all four test files to use proxy shapes

Steps 2-4 can be parallelized; steps 5-7 depend on 2-4 completing first.

---

## Sources

### Primary (HIGH confidence)
- `types/hueProxy.ts` — All proxy TypeScript types: HueLight, HueGroup, HueScene, HueBridgeHealth, HueLightStateRequest, HueCommandResponse — directly read
- `docs/api/hue.md` — Complete proxy API spec: response shapes, capability_tier values, data_freshness semantics, 202 Accepted bodies, 409 handling — field verification complete as of 2026-03-19
- `app/components/devices/stove/hooks/useStoveCommands.ts` — Reference implementation of 202 + delayed refresh pattern — verified at lines 108-112, 133-137, 159-163, 185-189

### Secondary (MEDIUM confidence)
- `app/components/devices/lights/hooks/useLightsData.ts` — Current 523-line hook — fully read, all migration points identified
- `app/components/devices/lights/hooks/useLightsCommands.ts` — Current 431-line hook — fully read, all pairing handlers identified for removal
- `app/components/devices/lights/LightsCard.tsx` — Orchestrator — fully read, all pairing wiring identified
- `app/components/devices/lights/components/LightsScenes.tsx` — Scene list — signature change identified
- `app/components/devices/lights/components/LightsRoomControl.tsx` — Room control — selectedRoomGroupedLightId prop rename needed
- `app/components/devices/lights/components/LightsBanners.tsx` — Banner builder — all pairing banners identified for removal
- `lib/hue/colorUtils.ts` — Color utilities — supportsColor and getCurrentColorHex identified for proxy adaptation
- `lib/core/apiResponse.ts` — success() implementation — array spreading behavior confirmed
- `app/api/hue/lights/route.ts`, `rooms/route.ts`, `scenes/route.ts`, `status/route.ts` — Current route shapes — array spreading issue confirmed

### Tertiary (LOW confidence)
None — all findings are from direct code inspection or verified API docs.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all types, hooks, and patterns already in project, verified
- Architecture: HIGH — proxy API spec verified against live Bridge 2026-03-19; all field mappings confirmed
- Pitfalls: HIGH — array spreading behavior confirmed by direct `apiResponse.ts` inspection; other pitfalls from code analysis

**Research date:** 2026-03-20
**Valid until:** Stable — proxy API spec (docs/api/hue.md) is the authoritative source; types are code-level facts
