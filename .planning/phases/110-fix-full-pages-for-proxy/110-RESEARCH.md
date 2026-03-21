# Phase 110: Fix Full Pages for Proxy - Research

**Researched:** 2026-03-21
**Domain:** Philips Hue full-page components — proxy API shape alignment, dead code removal, test fix
**Confidence:** HIGH

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| CMD-01 | PUT /lights/{light_id}/state via proxy (202 Accepted, v1 body format) | Route exists and works; page.tsx sends CLIP v2 nested format — must be fixed to v1 flat |
| CMD-02 | PUT /groups/{group_id}/action via proxy (202 Accepted) | Route exists and works; page.tsx sends `{ on: { on } }` and `{ dimming: { brightness } }` — must be `{ on }` and `{ bri: 0-254 }` |
| CMD-03 | POST /groups/{group_id}/scenes/{scene_id} via proxy (202 Accepted) | Route exists at `/api/hue/groups/[groupId]/scenes/[sceneId]`; scenes/page.tsx calls deleted PUT `/api/hue/scenes/{id}/activate` |
| UI-01 | useLightsData reads proxy response shapes (flat format, capability_tier) | Hook is correct; page.tsx reads `roomsData.rooms` but API returns `{ groups: [...] }` |
| UI-02 | useLightsCommands sends v1 body format | Hook is correct; page.tsx bypasses hook with direct fetch calls using CLIP v2 format |
| UI-04 | Scene activate uses new path pattern (POST /groups/{gid}/scenes/{sid}) | Hook is correct; page.tsx and scenes/page.tsx still call deleted `/api/hue/scenes/{id}/activate` |
| READ-03 | GET /groups migrated with member lights array | Route `/api/hue/rooms` returns `{ groups: [...] }` — page.tsx reads `.rooms` key (undefined always) |
| CLEAN-04 | Bridge discovery and pairing routes deleted | Routes already deleted; page.tsx still calls `/api/hue/discover`, `/api/hue/pair`, `/api/hue/disconnect`, `/api/hue/remote/*` — dead code must be removed from page |
| CLEAN-05 | OAuth token management deleted | Already deleted; page.tsx still has remote pairing state machine referencing dead OAuth routes |
| CLEAN-06 | Firebase bridge credentials persistence deleted | Already deleted; page.tsx still has full pairing UI flow for connecting to Bridge |
| CLIENT-02 | TypeScript types for all proxy response interfaces | Types defined in types/hueProxy.ts; page.tsx declares inline HueRoom/HueLight/HueScene interfaces using CLIP v2 shapes — must use proxy types |
</phase_requirements>

---

## Summary

Phase 110 is a focused gap-closure phase addressing three critical integration breaks found during the v14.0 milestone audit. All proxy infrastructure (client, routes, hooks) was built correctly in Phases 106-109. The problem is that `app/lights/page.tsx` and `app/lights/scenes/page.tsx` are full standalone pages that bypass the rewritten hooks (`useLightsData`, `useLightsCommands`) and still contain the pre-migration implementation: CLIP v2 nested body format, wrong response key names, calls to deleted routes, and a complete pairing state machine that no longer applies.

The `colorUtils.test.ts` has 4 failing tests that assert CLIP v2 shapes (`color.xy`, `color.gamut`) against the proxy-native `supportsColor` function which uses `capability_tier`. These tests were deferred and must be fixed to match the current function signature.

The work is surgical: `app/lights/page.tsx` needs a near-complete rewrite (it is essentially the old pre-proxy implementation still alive as a full page), and `app/lights/scenes/page.tsx` needs route and type fixes. No new routes or hooks are needed — all the correct infrastructure already exists.

**Primary recommendation:** Rewrite `app/lights/page.tsx` to use `useLightsData` + `useLightsCommands` hooks (same pattern as `LightsCard`), rewrite `app/lights/scenes/page.tsx` to use proxy types and the correct scene activation endpoint, and update `colorUtils.test.ts` to test proxy-native `supportsColor` behavior.

---

## Standard Stack

### What Already Exists (no new libraries needed)

| File | Status | Role |
|------|--------|------|
| `lib/hue/hueProxy.ts` | Complete | Proxy client wrappers (getLights, getGroups, getScenes, activateScene, setLightState, setGroupAction) |
| `types/hueProxy.ts` | Complete | HueLight, HueGroup, HueScene, HueBridgeHealth, HueLightStateRequest, HueCommandResponse |
| `app/components/devices/lights/hooks/useLightsData.ts` | Complete | All data fetching, polling, derived state, connection checking |
| `app/components/devices/lights/hooks/useLightsCommands.ts` | Complete | All command handlers with 202 Accepted + retry infrastructure |
| `app/api/hue/rooms/route.ts` | Complete | Returns `{ groups: HueGroup[] }` |
| `app/api/hue/lights/[id]/route.ts` | Complete | PUT accepts v1 flat body `{ on, bri, ct, hue, sat }` |
| `app/api/hue/rooms/[id]/route.ts` | Complete | PUT accepts v1 flat body |
| `app/api/hue/groups/[groupId]/scenes/[sceneId]/route.ts` | Complete | POST activates scene, returns 202 |

### Key Proxy Type Mappings

| CLIP v2 field (old) | Proxy field (new) | Type |
|---------------------|-------------------|------|
| `light.on?.on` | `light.on` | `boolean` |
| `light.dimming?.brightness` (0-100%) | `light.brightness` (0-254) | `number \| null` |
| `light.color?.xy` | `light.hue` + `light.saturation` | `number \| null` |
| `light.id` | `light.light_id` | `string` |
| `room.id` | `group.group_id` | `string` |
| `room.metadata?.name` | `group.name` | `string` |
| `room.services?.find(s => s.rtype === 'grouped_light')?.rid` | `group.group_id` (direct) | `string` |
| `room.children` (light membership) | `group.lights` (array of light_id strings) | `string[]` |
| `scene.group?.rid` | `scene.group_id` | `string` |
| `roomsData.rooms` | `groupsData.groups` | `HueGroup[]` |
| `scene.metadata?.name` | `scene.name` | `string` |

---

## Architecture Patterns

### Pattern 1: Full-Page Rewrite using Existing Hooks

`app/lights/page.tsx` should follow the same orchestrator pattern as `LightsCard.tsx` but for a full-page layout. The hooks already handle all data fetching, polling, command execution, and derived state. The page becomes a presentation layer that uses `useLightsData` + `useLightsCommands`.

```typescript
// Correct pattern — mirrors LightsCard.tsx approach
'use client';
import { useLightsData } from '@/app/components/devices/lights/hooks/useLightsData';
import { useLightsCommands } from '@/app/components/devices/lights/hooks/useLightsCommands';
import type { HueLight, HueGroup, HueScene } from '@/types/hueProxy';

export default function LightsPage() {
  const router = useRouter();
  const lightsData = useLightsData();
  const lightsCommands = useLightsCommands({ lightsData, router });
  // Render using lightsData.groups, lightsData.lights, lightsData.scenes
  // Commands via lightsCommands.handleRoomToggle(groupId, on)
  // groupId is group.group_id — no more grouped_light service lookup
}
```

### Pattern 2: Proxy v1 Body Format

All command calls use v1 flat format. The routes at `app/api/hue/rooms/[id]/route.ts` and `app/api/hue/lights/[id]/route.ts` already enforce this.

```typescript
// CORRECT — v1 flat (what routes expect)
body: JSON.stringify({ on: true })
body: JSON.stringify({ bri: 200 })   // 0-254, NOT 0-100%

// WRONG — CLIP v2 nested (current page.tsx)
body: JSON.stringify({ on: { on: true } })
body: JSON.stringify({ dimming: { brightness: 80 } })
body: JSON.stringify({ color: { xy: { x: 0.5, y: 0.4 } } })
```

### Pattern 3: Brightness Conversion

Brightness conversion happens at the command boundary (0-100% in UI → 0-254 for proxy). This is already handled in `useLightsCommands.handleBrightnessChange`. Page.tsx must use the same conversion when making direct calls.

```typescript
// UI receives percent (0-100), API expects bri (0-254)
const bri254 = Math.round(brightnessPercent * 254 / 100);
body: JSON.stringify({ bri: bri254 })
```

### Pattern 4: Scene Activation

```typescript
// CORRECT — new proxy path
POST /api/hue/groups/{groupId}/scenes/{sceneId}

// WRONG — deleted route (current page.tsx and scenes/page.tsx)
PUT /api/hue/scenes/{sceneId}/activate
```

The `sceneId` and `groupId` are both available from `HueScene.scene_id` and `HueScene.group_id`.

### Pattern 5: Disconnected State (simplified)

In the proxy model, "not connected" means the Bridge is unreachable via the HA proxy (503 from `/api/hue/status`). There is no pairing flow. The disconnected state UI should show a simple message with a back button — no pairing wizard, no remote OAuth, no "Connect" buttons.

```typescript
// Proxy model: no pairing, no discover, no pair, no disconnect routes
if (!connected) {
  return <SimpleNotConnectedCard />;
  // No: handleStartPairing, handlePairWithBridge, handleStartRemotePairing, etc.
}
```

### Pattern 6: colorUtils supportsColor (proxy-native)

```typescript
// CURRENT implementation (proxy-native)
export function supportsColor(light: HueLight): boolean {
  return light.capability_tier === 'color';
}

// WRONG tests (CLIP v2 — must be replaced)
supportsColor({ color: { xy: { x: 0.5, y: 0.5 } } })   // ❌ old shape
supportsColor({ color: { gamut: { ... } } })              // ❌ old shape

// CORRECT tests (proxy-native)
supportsColor({ capability_tier: 'color', ... })          // ✅ returns true
supportsColor({ capability_tier: 'ambiance', ... })       // ✅ returns false
supportsColor({ capability_tier: 'white', ... })          // ✅ returns false
```

### Recommended Structure for lights/page.tsx (after rewrite)

The page should be slimmed down significantly. The complex pairing state machine (lines 63-516, ~450 lines) should be completely removed. The page connects to `useLightsData` + `useLightsCommands` and focuses on layout/presentation for desktop. Total should be under 300 lines.

```
app/lights/page.tsx           -- slimmed page using hooks
app/lights/scenes/page.tsx    -- type fix + route fix + Scene CRUD removal
lib/hue/__tests__/colorUtils.test.ts  -- fix 4 failing supportsColor tests
```

### Anti-Patterns to Avoid

- **Duplicate hook logic in page.tsx**: The page should NOT re-implement polling, connection checks, or derived state. `useLightsData` already provides all of this.
- **Keeping the pairing state machine**: All pairing/discovery/disconnect routes are deleted. The code that calls them is dead weight.
- **Using `room.services` to find grouped_light IDs**: In the proxy model, `group.group_id` IS the ID to use for room commands. No service lookup needed.
- **Reading `roomsData.rooms`**: The API returns `{ groups: [...] }`. Always use `groupsData.groups`.
- **Keeping Scene CRUD UI**: `handleCreateScene`, `handleUpdateScene`, `handleDeleteScene` call deleted routes. Scene CRUD is deferred per REQUIREMENTS.md. The create/edit/delete UI should be removed from `scenes/page.tsx`.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Data fetching + polling | Custom setInterval in page | `useLightsData` | Already implemented with useAdaptivePolling, connection check, 60s interval |
| Room toggle command | Direct fetch in page | `useLightsCommands.handleRoomToggle` | Already handles v1 body, 202 delay, retry infrastructure |
| Scene activation | Direct fetch in page | `useLightsCommands.handleSceneActivate` | Already uses correct POST path |
| Brightness change | Direct fetch in page | `useLightsCommands.handleBrightnessChange` | Already handles percent→254 conversion |
| All lights toggle | Direct fetch in page | `useLightsCommands.handleAllLightsToggle` | Already iterates groups correctly |
| Proxy TypeScript types | Inline interfaces in page | `import type { HueLight, HueGroup, HueScene } from '@/types/hueProxy'` | Complete types already exist |

**Key insight:** Phase 108 rewrote all the hooks correctly. Phase 110's job is to make the full pages use those hooks instead of their own stale implementations.

---

## Common Pitfalls

### Pitfall 1: Keeping the pairing state machine partially
**What goes wrong:** Leaving any of the pairing state (`pairing`, `pairingStep`, `pairingError`, `discoveredBridges`, `selectedBridge`, `pairingCountdown`, `pairingTimerRef`) creates dead code that TypeScript still compiles. The routes they call are deleted.
**Why it happens:** Developer tries to do minimal changes and leaves "just in case" code.
**How to avoid:** Remove all pairing-related state, refs, functions, and JSX. The `remoteApiAvailable = false` constant and all `{remoteApiAvailable && ...}` JSX should be deleted.
**Warning signs:** `pairingTimerRef`, `setPairingStep`, `/api/hue/discover`, `/api/hue/pair`, `/api/hue/disconnect` still present.

### Pitfall 2: lights/page.tsx re-implementing useLightsData logic
**What goes wrong:** Page re-adds its own polling loop or connection check that conflicts with the hook's internal state.
**Why it happens:** Developer doesn't trust the hook or wants to keep familiar patterns.
**How to avoid:** Use `useLightsData()` + `useLightsCommands()` as the only data source. Remove all direct `fetch('/api/hue/*')` calls from the page itself.
**Warning signs:** `setInterval(fetchData, 30000)` in page, `const [rooms, setRooms] = useState` in page.

### Pitfall 3: scenes/page.tsx leaving Scene CRUD UI active
**What goes wrong:** `handleCreateScene` calls `/api/hue/scenes/create` (deleted), `handleUpdateScene` calls `PUT /api/hue/scenes/{id}` (deleted), `handleDeleteScene` calls `DELETE /api/hue/scenes/{id}` (deleted). Keeping the UI gives users a 404 experience.
**Why it happens:** Developer fixes activation only and leaves CRUD intact.
**How to avoid:** Remove `CreateSceneModal`, `EditSceneModal`, `ContextMenu` (per-scene edit/delete), `ConfirmDialog` for delete. The entire CRUD flow is deferred (SCENE-01/02/03 out of scope).
**Warning signs:** `createModalOpen`, `editingScene`, `deleteConfirm` state variables still present.

### Pitfall 4: Wrong room filter key in scenes/page.tsx
**What goes wrong:** `scenes.filter(s => s.group?.rid === room.id)` uses CLIP v2 shape. Proxy scenes use `scene.group_id` and `group.group_id`.
**Why it happens:** Interface defined inline in scenes/page.tsx uses CLIP v2 `HueScene.group?.rid`.
**How to avoid:** Import `HueScene` and `HueGroup` from `@/types/hueProxy`. Use `scene.group_id === group.group_id`.
**Warning signs:** `scene.group?.rid`, `room.metadata?.name` still referenced.

### Pitfall 5: supportsColor test using wrong argument shape
**What goes wrong:** Test passes `{ color: { xy: ... } }` to `supportsColor()` which expects `HueLight`. TypeScript strict mode will reject this.
**Why it happens:** Tests were written against the CLIP v2 implementation before the proxy migration.
**How to avoid:** Tests must use full `HueLight` objects with `capability_tier` field. Import `HueLight` type from `@/types/hueProxy` for typed mock construction.

---

## Code Examples

### Correct group response key access
```typescript
// Source: app/api/hue/rooms/route.ts — returns { groups: data }
const groupsRes = await fetch('/api/hue/rooms');
const groupsData = await groupsRes.json() as { groups?: HueGroup[] };
const groups = groupsData.groups ?? [];  // NOT groupsData.rooms
```

### Correct scene activation (page.tsx direct fetch, not via hook)
```typescript
// Source: app/api/hue/groups/[groupId]/scenes/[sceneId]/route.ts
// scene.group_id is always present (HueScene.group_id: string — not nullable)
const response = await fetch(
  `/api/hue/groups/${scene.group_id}/scenes/${scene.scene_id}`,
  { method: 'POST' }
);
// Response: 202 with HueCommandResponse
```

### Correct supportsColor tests (proxy-native)
```typescript
// Source: lib/hue/colorUtils.ts — uses capability_tier field
import type { HueLight } from '@/types/hueProxy';

const colorLight: HueLight = {
  light_id: '1', name: 'Test', on: true,
  brightness: 200, ct_mirek: null, ct_kelvin: null,
  hue: 32000, saturation: 200, colormode: 'hs',
  reachable: true, capability_tier: 'color',
  room_id: null, room_name: null, model_id: null, light_type: null,
};
expect(supportsColor(colorLight)).toBe(true);

const ambianceLight: HueLight = { ...colorLight, capability_tier: 'ambiance' };
expect(supportsColor(ambianceLight)).toBe(false);
```

### Correct light membership check (proxy group.lights array)
```typescript
// Source: types/hueProxy.ts — HueGroup.lights: string[]
// No more owner.rid or children array traversal
const roomLights = lights.filter(light =>
  group.lights.includes(light.light_id)
);
```

### Correct lights.on check (proxy HueLight.on is boolean)
```typescript
// CORRECT (proxy)
const totalLightsOn = lights.filter(l => l.on).length;
const isOn = roomLights.some(l => l.on);

// WRONG (CLIP v2)
const totalLightsOn = lights.filter(l => l.on?.on).length;
```

---

## State of the Art

| Old Approach (CLIP v2) | Current Approach (Proxy v1) | When Changed | Impact |
|------------------------|----------------------------|--------------|--------|
| `HueLight.on = { on: boolean }` | `HueLight.on = boolean` | Phase 106 | All `l.on?.on` refs break |
| `HueLight.dimming?.brightness` (0-100%) | `HueLight.brightness` (0-254) | Phase 106 | All brightness reads break |
| `room.services.find(rtype='grouped_light').rid` | `group.group_id` directly | Phase 106 | Service lookup is dead code |
| `roomsData.rooms` | `groupsData.groups` | Phase 106 | Key mismatch = always undefined |
| `PUT /api/hue/scenes/{id}/activate` | `POST /api/hue/groups/{gid}/scenes/{sid}` | Phase 107 | Old route returns 404 |
| `supportsColor` checked `color.xy/gamut` | `supportsColor` checks `capability_tier` | Phase 108 | 4 tests fail with wrong shape |
| Full pairing state machine in page.tsx | No pairing — proxy handles Bridge | Phase 109 | All /discover /pair /disconnect routes → 404 |

**Deprecated/outdated:**
- `/api/hue/discover`: Deleted (Phase 109). No replacement needed.
- `/api/hue/pair`: Deleted (Phase 109). No replacement needed.
- `/api/hue/disconnect`: Deleted (Phase 109). No replacement needed.
- `/api/hue/remote/*`: Deleted (Phase 109). No replacement needed.
- `/api/hue/scenes/create`: Deleted (Phase 109). Deferred to SCENE-01 (future).
- `PUT /api/hue/scenes/{id}`: Deleted (Phase 109). Deferred to SCENE-02 (future).
- `DELETE /api/hue/scenes/{id}`: Deleted (Phase 109). Deferred to SCENE-03 (future).

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Jest + @testing-library/react |
| Config file | jest.config.ts |
| Quick run command | `npm test -- --testPathPattern="colorUtils\|lights/page\|scenes/page" --no-coverage` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| CMD-01 | PUT /lights/[id] route accepts v1 flat body | unit | `npm test -- --testPathPattern="lights/\[id\]/__tests__" --no-coverage` | ✅ exists |
| CMD-02 | PUT /rooms/[id] route accepts v1 flat body | unit | `npm test -- --testPathPattern="rooms/\[id\]/__tests__" --no-coverage` | ✅ exists |
| CMD-03 | POST /groups/[gid]/scenes/[sid] route works | unit | `npm test -- --testPathPattern="scenes/\[sceneId\]/__tests__" --no-coverage` | ✅ exists |
| UI-01 | useLightsData reads groups key from rooms response | unit | `npm test -- --testPathPattern="useLightsData" --no-coverage` | ✅ exists |
| UI-02 | useLightsCommands sends v1 body format | unit | `npm test -- --testPathPattern="useLightsCommands" --no-coverage` | ✅ exists |
| UI-04 | Scene activation uses POST /groups/{gid}/scenes/{sid} | unit | `npm test -- --testPathPattern="useLightsCommands" --no-coverage` | ✅ exists |
| CLIENT-02 | supportsColor uses capability_tier (not color.xy) | unit | `npm test -- --testPathPattern="colorUtils" --no-coverage` | ✅ exists (4 tests currently FAILING) |
| CLEAN-04 | No calls to deleted pairing routes in pages | manual grep | `grep -r "api/hue/discover\|api/hue/pair\|api/hue/disconnect\|api/hue/remote" app/lights/` | — |
| CLEAN-05 | No OAuth remote pairing code in pages | manual grep | `grep -r "remote/pair\|remote/authorize" app/lights/` | — |
| CLEAN-06 | No Firebase bridge credential persistence in pages | manual grep | `grep -r "remoteApiAvailable\|pairingStep\|needsRemotePairing" app/lights/` | — |
| READ-03 | rooms/route.ts GET returns groups array | unit | `npm test -- --testPathPattern="hue/rooms/__tests__" --no-coverage` | ✅ exists |

### Sampling Rate

- **Per task commit:** `npm test -- --testPathPattern="colorUtils\|useLightsData\|useLightsCommands\|hue/rooms" --no-coverage`
- **Per wave merge:** `npm test -- --testPathPattern="hue\|lights" --no-coverage`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps

None — existing test infrastructure covers all phase requirements. The colorUtils.test.ts already has the 4 failing tests that need to be fixed (they exist, they just assert the wrong shapes).

---

## Scope Clarity: What This Phase Does vs. Does Not Do

### IN SCOPE
1. `app/lights/page.tsx` — rewrite to use `useLightsData` + `useLightsCommands` hooks, remove pairing state machine, fix response keys, fix body format
2. `app/lights/scenes/page.tsx` — fix response keys (`roomsData.rooms` → `groupsData.groups`), fix scene activation route, fix CLIP v2 type references, remove Scene CRUD UI
3. `lib/hue/__tests__/colorUtils.test.ts` — fix 4 failing `supportsColor` tests to use `capability_tier` shape

### OUT OF SCOPE (per REQUIREMENTS.md)
- Scene CRUD (create, edit, delete) — SCENE-01/02/03 deferred
- Sonos integration
- History UI consumer for `/api/hue/history`
- Any new API routes

---

## Open Questions

1. **Should lights/page.tsx keep any direct light-level controls (individual light toggle, per-light brightness, color picker)?**
   - What we know: The hooks provide room-level and all-house-level controls. Individual light controls exist in `useLightsData` derived state (`roomLights`, `effectiveLights`) but `useLightsCommands` only has room-level handlers.
   - What's unclear: Whether the full `/lights` page should have per-light controls that aren't in `LightsCard`.
   - Recommendation: Remove the per-light color picker (it called the now-wrong `{ color: { xy } }` endpoint). Keep room-level controls using hooks. Individual light toggle can call `PUT /api/hue/lights/{id}` directly with v1 format `{ on: bool }`.

2. **Should scenes/page.tsx keep room-filter dropdown using proxy types?**
   - What we know: Current room filter uses `room.id` and `scene.group?.rid` (CLIP v2). Proxy uses `group.group_id` and `scene.group_id`.
   - What's unclear: The room filter feature itself is valuable but needs re-keying.
   - Recommendation: Keep the room filter, just fix the key names to `group.group_id` and `scene.group_id`.

---

## Sources

### Primary (HIGH confidence)

- `app/lights/page.tsx` — direct audit of CLIP v2 body formats, deleted route calls, wrong response keys (verified by reading file)
- `app/lights/scenes/page.tsx` — direct audit of deleted route calls and CLIP v2 type references (verified by reading file)
- `lib/hue/__tests__/colorUtils.test.ts` — direct audit of 4 failing test cases (verified by reading file)
- `lib/hue/colorUtils.ts` — current `supportsColor` implementation uses `capability_tier` (verified by reading file)
- `types/hueProxy.ts` — complete proxy type definitions (verified by reading file)
- `lib/hue/hueProxy.ts` — complete proxy client wrappers (verified by reading file)
- `app/components/devices/lights/hooks/useLightsData.ts` — verified correct proxy-native implementation (verified by reading file)
- `app/components/devices/lights/hooks/useLightsCommands.ts` — verified correct v1 body format and scene POST path (verified by reading file)
- `app/api/hue/rooms/route.ts` — returns `{ groups: data }` not `{ rooms: data }` (verified by reading file)
- `.planning/v14.0-MILESTONE-AUDIT.md` — INT-01, INT-02, INT-03 gap definitions with exact line numbers (verified by reading file)

### Secondary (MEDIUM confidence)

- `.planning/REQUIREMENTS.md` — requirements traceability and scope boundaries (verified by reading file)
- `.planning/STATE.md` — decision log for v14.0 phases (verified by reading file)

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries verified by direct file inspection; no new libraries needed
- Architecture: HIGH — hooks are complete and working; page integration pattern is clear from LightsCard existing implementation
- Pitfalls: HIGH — all pitfalls derived from direct audit evidence in AUDIT.md with exact file + line references
- Test fixes: HIGH — colorUtils.test.ts test cases directly inspected; fix pattern is clear

**Research date:** 2026-03-21
**Valid until:** 2026-04-20 (30 days — stable proxy infrastructure, no external deps changing)
