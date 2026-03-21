---
phase: 110-fix-full-pages-for-proxy
plan: 01
subsystem: hue-lights
tags: [proxy, hue, page-rewrite, tests]
dependency_graph:
  requires:
    - app/components/devices/lights/hooks/useLightsData.ts
    - app/components/devices/lights/hooks/useLightsCommands.ts
    - types/hueProxy.ts
  provides:
    - app/lights/page.tsx (proxy-native lights full page)
  affects:
    - lib/hue/colorUtils.ts (null guard added to supportsColor)
tech_stack:
  added: []
  patterns:
    - hook delegation (useLightsData + useLightsCommands)
    - v1 flat body format (on, bri, xy)
    - proxy-native type access (group.group_id, light.light_id, light.on boolean)
key_files:
  created: []
  modified:
    - app/lights/page.tsx
    - lib/hue/__tests__/colorUtils.test.ts
    - lib/hue/colorUtils.ts
decisions:
  - lights/page.tsx uses useLightsData + useLightsCommands for all room/scene/all-house commands; individual light commands remain inline with v1 flat body format
  - Disconnected state simplified to single message (no pairing wizard) — proxy handles bridge connectivity
  - supportsColor null guard added to colorUtils.ts to match test expectations for null/undefined inputs
metrics:
  duration: ~15 minutes
  completed: "2026-03-21"
  tasks: 2
  files: 3
---

# Phase 110 Plan 01: Lights Page Proxy Rewrite Summary

Rewrote app/lights/page.tsx to use useLightsData + useLightsCommands hooks, eliminating all legacy CLIP v2 code and the pairing state machine. Fixed colorUtils supportsColor tests to use proxy-native HueLight shapes.

## Tasks Completed

| Task | Description | Commit | Result |
|------|-------------|--------|--------|
| 1 | Rewrite lights/page.tsx to use proxy hooks | b4ea5f6 | 277 lines (down from 1222) |
| 2 | Fix colorUtils supportsColor tests | 99debe8 | 24/24 tests pass |

## What Was Done

**Task 1: lights/page.tsx rewrite**

The existing page was 1222 lines and contained:
- A full pairing state machine (`PairingStep` type, countdown timer, bridge discovery/pairing flows)
- Calls to deleted routes: `/api/hue/discover`, `/api/hue/pair`, `/api/hue/disconnect`, `/api/hue/remote/pair`
- CLIP v2 nested body format: `{ on: { on: true } }`, `{ dimming: { brightness: 78 } }`, `{ color: { xy: ... } }`
- Legacy type shapes: `light.on?.on`, `light.dimming?.brightness`, `room.services?.find(...)`, `scene.group?.rid`
- Inline `HueRoom`, `HueLight`, `HueScene`, `HueBridge` interfaces

Replaced with a 277-line page that:
- Imports `useLightsData` and `useLightsCommands` hooks
- Uses `HueLight`, `HueGroup`, `HueScene` from `@/types/hueProxy`
- Uses `group.group_id`, `group.name`, `group.lights` for room rendering
- Uses `light.light_id`, `light.on` (boolean direct access), `light.name`
- Sends v1 flat body: `{ on }`, `{ bri: bri254 }`, `{ xy: [x, y] }`
- Shows simple disconnected message (no pairing wizard)
- Delegates room toggle, brightness, scene activation, all-house to hooks
- Keeps individual light controls inline (not in hook) with correct v1 format

**Task 2: colorUtils tests**

The 6 supportsColor tests used CLIP v2 shapes (`{ color: { xy: ... } }`, `{ color: { gamut: ... } }`) that don't match the proxy-native `HueLight` type. Replaced all 6 with proxy-native tests using `capability_tier` field. Added null guard to `supportsColor` to handle null/undefined inputs.

## Verification Results

| Check | Result |
|-------|--------|
| `grep -c "api/hue/discover\|api/hue/pair\|api/hue/disconnect\|api/hue/remote" app/lights/page.tsx` | 0 |
| `grep -c "on: { on\|dimming: { brightness\|color: { xy" app/lights/page.tsx` | 0 |
| `grep -c "pairingStep\|pairingTimerRef\|remoteApiAvailable\|needsRemotePairing" app/lights/page.tsx` | 0 |
| `grep -c "useLightsData\|useLightsCommands" app/lights/page.tsx` | 4 |
| `wc -l app/lights/page.tsx` | 277 (< 350) |
| colorUtils tests | 24/24 pass |

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None.

## Self-Check: PASSED

- app/lights/page.tsx: FOUND
- lib/hue/__tests__/colorUtils.test.ts: FOUND
- lib/hue/colorUtils.ts: FOUND
- Commit b4ea5f6: FOUND
- Commit 99debe8: FOUND
