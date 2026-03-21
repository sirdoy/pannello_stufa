---
phase: 108-frontend-hooks-rewrite
plan: "02"
subsystem: lights-ui
tags: [hue, proxy, orchestrator, ui-migration, pairing-removal]
dependency_graph:
  requires: [108-01]
  provides: [lights-card-proxy-wired]
  affects: [LightsCard, LightsBanners, LightsScenes, LightsRoomControl]
tech_stack:
  added: []
  patterns: [orchestrator-pattern, proxy-native-types]
key_files:
  created: []
  modified:
    - app/components/devices/lights/LightsCard.tsx
    - app/components/devices/lights/components/LightsBanners.tsx
    - app/components/devices/lights/components/LightsScenes.tsx
    - app/components/devices/lights/components/LightsRoomControl.tsx
    - __tests__/components/devices/lights/LightsCard.orchestrator.test.tsx
    - __tests__/components/devices/lights/components/LightsRoomControl.test.tsx
    - __tests__/components/devices/lights/components/LightsBanners.test.tsx
    - __tests__/components/devices/lights/components/LightsScenes.test.tsx
decisions:
  - LightsBanners reduced to 3 banners (retry error, staleness warning, connection error) — all pairing banners deleted
  - LightsCard no longer passes onConnect/connectButtonLabel — no pairing flow in proxy model
  - statusBadge simplified: stale check replaces connectionMode badge map
  - LightsRoomControl uses selectedGroupId (group_id string) instead of selectedRoomGroupedLightId
  - LightsScenes.test Fallback Names tests removed — proxy shapes always have name field (no optional metadata)
metrics:
  duration: "~25 minutes"
  completed_date: "2026-03-21"
  tasks_completed: 2
  files_changed: 8
---

# Phase 108 Plan 02: Frontend UI Components Proxy Migration Summary

Wire LightsCard orchestrator and all sub-components to proxy-shaped data from rewritten hooks (Plan 01), removing all pairing UI and CLIP v2 field references.

## What Was Built

### Task 1: Sub-component updates (commit e548965)

**LightsBanners.tsx** — Complete rewrite:
- Removed 8 pairing-related banners (discovering, noLocalBridge, waitingForButtonPress, selectBridge, pairing countdown, success, pairingError, remoteAuth)
- Removed pairing props: `pairing`, `pairingStep`, `pairingCountdown`, `pairingError`, `discoveredBridges`, `selectedBridge`, all pairing callbacks
- Added `stale: boolean` prop
- Added staleness warning banner: "Dati non aggiornati" with warning variant
- Kept retry error banner and connection error banner unchanged

**LightsScenes.tsx** — Updated for proxy shapes:
- Typed `roomScenes` as `HueScene[]` from `@/types/hueProxy` (was `any[]`)
- `onSceneActivate` signature: `(sceneId: string, groupId: string) => void` (was single arg)
- `scene.scene_id` instead of `scene.id` for key and onClick arg
- `scene.name` instead of `scene.metadata?.name` for display and aria-label
- Passes `scene.group_id` as second arg to callback

**LightsRoomControl.tsx** — Renamed props and typed:
- `selectedGroup: HueGroup | undefined` (was `selectedRoom: any`)
- `selectedGroupId: string | null` (was `selectedRoomGroupedLightId`)
- `roomLights: HueLight[]` (was `any[]`)
- `selectedGroup?.name ?? 'Stanza'` (was `selectedRoom.metadata?.name || 'Stanza'`)
- All 7 occurrences of `selectedRoomGroupedLightId` replaced with `selectedGroupId`

**LightsRoomControl.test.tsx** — Updated mock data:
- `mockGroup` uses `group_id`, `name`, `lights`, `any_on`, `all_on`, `brightness`
- `mockLight` uses `light_id`, `name`, `on`, `brightness`, `capability_tier`, `reachable`
- Props renamed: `selectedGroup`, `selectedGroupId`, `selectedGroupId={null}` in disabled test

### Task 2: Orchestrator updates (commit 9667766)

**LightsCard.tsx** — Full wiring update:
- `useLightsCommands` params stripped of all pairing state (7 props removed)
- `buildLightsBanners` call reduced to 5 props (was 16)
- `infoBoxes` uses `lightsData.groups.length` and `lightsData.selectedGroup`
- `footerActions` condition uses `lightsData.selectedGroup`
- `statusBadge` is simple stale check, no `getStatusBadge()` function
- `DeviceCard` props: removed `onConnect`, `connectButtonLabel`, `pairing` from loading condition
- `RoomSelector` maps `group.group_id` → `id`, `group.name` → `name`
- `LightsRoomControl` receives `selectedGroup` and `selectedGroupId_action`
- `LightsScenes` callback is `commands.handleSceneActivate` (already takes 2 args from Plan 01)
- EmptyState condition uses `lightsData.selectedGroup`

**LightsCard.orchestrator.test.tsx** — Updated mock data and assertions:
- Mock `useLightsData` uses proxy fields: `groups`, `selectedGroupId`, `selectedGroup`, `selectedGroupId_action`, `stale: false`
- Removed pairing state: 10 props removed
- Mock `useLightsCommands` has no pairing handlers (7 removed)
- Added tests: staleness badge forwarded, no "Connetti Bridge Hue" button, proxy field assertions
- RoomSelector test uses 2 groups (required for RoomSelector to render)

### Rule 2 Auto-fix: Test files for removed functionality (commit 4cf17bb)

**LightsBanners.test.tsx** — Rewritten:
- Removed all pairing banner tests (6 describe blocks deleted)
- Added staleness banner tests
- Updated mock props to new interface
- Updated priority test to verify retry/stale/connection error order

**LightsScenes.test.tsx** — Rewritten:
- Mock scenes use HueScene proxy shapes
- `onSceneActivate` assertion updated: `('scene1', '1')` instead of `('scene1')`
- Removed "Fallback Names" describe block (proxy always has `name` field, no `metadata`)
- Kept scroll indicator and edge case tests

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Tests] LightsBanners.test.tsx used old pairing interface**
- **Found during:** Task 2 verification (`npx jest lights`)
- **Issue:** Existing test file called `buildLightsBanners` with `pairing`, `pairingStep`, etc. — TypeScript compile errors and runtime failures
- **Fix:** Rewrote test to use new `LightsBannersProps` interface with staleness assertions
- **Files modified:** `__tests__/components/devices/lights/components/LightsBanners.test.tsx`
- **Commit:** 4cf17bb

**2. [Rule 2 - Missing Tests] LightsScenes.test.tsx used CLIP v2 shapes**
- **Found during:** Task 2 verification
- **Issue:** Mock scenes used `{ id, metadata: { name } }` — now TypeScript errors and assertion failures (`onSceneActivate` called with 1 arg not 2)
- **Fix:** Updated mock data to `HueScene` shapes, updated callback assertion to `(sceneId, groupId)`, removed Fallback Names tests (no longer applicable)
- **Files modified:** `__tests__/components/devices/lights/components/LightsScenes.test.tsx`
- **Commit:** 4cf17bb

**3. [Rule 1 - Bug] RoomSelector combobox test failure**
- **Found during:** Task 2 test run
- **Issue:** Test expected `getByRole('combobox')` and `getByRole('option', { name: 'Soggiorno' })` — RoomSelector only renders when >1 group, and Radix renders "Soggiorno" multiple times in the DOM
- **Fix:** Added `mockGroup2` to default mock data (2 groups), changed assertions to `getAllByText` and source-code check
- **Files modified:** `__tests__/components/devices/lights/LightsCard.orchestrator.test.tsx`
- **Commit:** 9667766 (inline fix before commit)

## Pre-existing Failures (Out of Scope)

- `lib/hue/__tests__/colorUtils.test.ts` — 4 failures (pre-existing, unrelated to this plan)
- `lib/hooks/__tests__/useDeviceStaleness.test.ts` — 5 failures (pre-existing, unrelated)

Verified via `git stash` — both fail before any changes from this plan.

## Self-Check: PASSED

Files exist:
- app/components/devices/lights/LightsCard.tsx — FOUND
- app/components/devices/lights/components/LightsBanners.tsx — FOUND
- app/components/devices/lights/components/LightsScenes.tsx — FOUND
- app/components/devices/lights/components/LightsRoomControl.tsx — FOUND

Commits exist:
- e548965 — FOUND (feat: update sub-components for proxy shapes)
- 9667766 — FOUND (feat: update LightsCard orchestrator)
- 4cf17bb — FOUND (fix: update test files)

Tests: 125/125 lights tests passing, 3864/3873 full suite (9 pre-existing failures)
