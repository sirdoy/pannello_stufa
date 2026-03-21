---
phase: 110-fix-full-pages-for-proxy
plan: "02"
subsystem: lights/scenes
tags: [hue, proxy, scenes, crud-removal, clip-v1]
dependency_graph:
  requires: [types/hueProxy.ts, app/api/hue/groups/[groupId]/scenes/[sceneId]/route.ts]
  provides: [app/lights/scenes/page.tsx]
  affects: [/lights/scenes UI]
tech_stack:
  added: []
  patterns: [proxy-native types, SceneCard sub-component, POST /api/hue/groups/{gid}/scenes/{sid}]
key_files:
  created: []
  modified:
    - app/lights/scenes/page.tsx
key_decisions:
  - "SceneCard extracted as local sub-component to deduplicate 'all rooms' and 'filtered' render paths — reduces file to 240 lines (under 250 target)"
  - "handleRefresh inlined into Button onClick to save a named function declaration"
  - "Proxy disconnected message updated to reference Home Assistant proxy rather than bridge pairing"
metrics:
  duration_minutes: 8
  completed_date: "2026-03-21"
  tasks_completed: 1
  tasks_total: 1
  files_modified: 1
requirements: [CMD-03, UI-04, READ-03]
---

# Phase 110 Plan 02: Scenes Page Proxy Migration Summary

Scenes page rewritten for proxy compatibility — HueScene/HueGroup proxy types, POST /api/hue/groups/{gid}/scenes/{sid} activation route, correct roomsData.groups response key, CLIP v2 field access replaced, Scene CRUD UI removed.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Fix scenes/page.tsx for proxy types + remove CRUD | 9b83f15 | app/lights/scenes/page.tsx |

## What Was Built

The `/lights/scenes` page was migrated from CLIP v2 inline types to `HueScene`/`HueGroup` proxy types and from deleted Hue routes to the correct proxy route. Scene CRUD UI (create modal, edit modal, context menu per scene, delete dialog, toast) was removed per SCENE-01/02/03 deferral.

**Before (520 lines, broken):**
- Imported `CreateSceneModal`, `EditSceneModal`, `ContextMenu`, `ConfirmDialog`, `Toast`
- Inline `HueScene { id, metadata?: { name? }, group?: { rid? } }` — CLIP v2
- `roomsData.rooms` — always undefined (API returns `{ groups: [...] }`)
- Scene activation: `PUT /api/hue/scenes/${sceneId}/activate` — deleted route (404)
- `scene.group?.rid`, `room.metadata?.name`, `scene.metadata?.name`, `room.id` — CLIP v2

**After (240 lines, working):**
- `import type { HueScene, HueGroup } from '@/types/hueProxy'` — proxy-native
- `roomsData.groups` — correct response key
- Scene activation: `POST /api/hue/groups/${groupId}/scenes/${sceneId}` — correct proxy route
- `scene.group_id`, `room.group_id`, `scene.scene_id`, `scene.name`, `room.name` — proxy-native
- No CRUD state, no CRUD handlers, no CRUD modals
- `SceneCard` sub-component deduplicates scene button markup

## Deviations from Plan

### Auto-fixed Issues

None — plan executed exactly as written, plus an optimization:

**[Optimization] Extracted SceneCard sub-component**
- The plan's target was < 250 lines but the first rewrite was 330 lines due to duplicated scene card JSX in both render paths.
- Extracted a `SceneCard` function component to deduplicate, bringing file to 240 lines.
- This also consolidates `handleRefresh` inline into the Button onClick.

## Verification Results

1. `grep -c "roomsData.rooms"` → 0 PASS
2. `grep -c "scene.group?.rid|room.metadata?.name|scene.metadata?.name"` → 0 PASS
3. `grep -c "scenes/create|scenes/.*activate|CreateSceneModal|EditSceneModal|ConfirmDialog"` → 0 PASS
4. `grep "api/hue/groups/"` → matches POST route PASS
5. `grep "roomsData.groups"` → match PASS
6. `wc -l` → 240 < 250 PASS

## Known Stubs

None — page is fully functional for proxy architecture. CRUD features are intentionally deferred (SCENE-01/02/03 in REQUIREMENTS.md).

## Self-Check: PASSED

- File exists: app/lights/scenes/page.tsx — FOUND
- Commit 9b83f15 — FOUND
