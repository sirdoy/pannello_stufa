---
phase: 166-hue-frontend-cutover
plan: "02"
subsystem: hue-frontend
tags: [hue, url-migration, hooks, pages, debug-panels, tests]
dependency_graph:
  requires: [166-01]
  provides: [hue-frontend-v1-cutover]
  affects: [useLightsData, useLightsCommands, lights-pages, debug-panels]
tech_stack:
  added: []
  patterns: [v1-url-migration, path-split-put]
key_files:
  created: []
  modified:
    - app/components/devices/lights/hooks/useLightsData.ts
    - app/components/devices/lights/hooks/useLightsCommands.ts
    - app/lights/page.tsx
    - app/lights/scenes/page.tsx
    - app/components/lights/CreateSceneModal.tsx
    - app/components/lights/EditSceneModal.tsx
    - app/registry/devices/page.tsx
    - app/debug/components/tabs/HueTab.tsx
    - app/debug/api/components/tabs/HueTab.tsx
    - app/debug/components/tabs/__tests__/HueTab.test.tsx
    - app/debug/api/components/tabs/__tests__/HueTab.test.tsx
decisions:
  - "Kept /api/hue/ legacy route tree intact (plan 166-03 deletes it)"
  - "debug/api HueTab test pre-existing failure documented as out-of-scope"
metrics:
  duration: "~15 minutes"
  completed: "2026-04-18T07:56:09Z"
  tasks_completed: 2
  tasks_total: 2
  files_modified: 11
---

# Phase 166 Plan 02: Hue Frontend URL Cutover Summary

All frontend Hue consumers migrated from legacy `/api/hue/*` to canonical `/api/v1/hue/*` paths across hooks, pages, modals, debug panels, and test assertions.

## What Was Built

Mechanical URL rewrite across 11 files eliminating all `/api/hue/` references from non-legacy code. One structural change: `lights/page.tsx` PUT calls now target `/api/v1/hue/lights/${id}/state` (path split — v1 separates GET and PUT into separate routes).

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Rewrite hooks + pages + modals + registry | d51587ca | 7 files |
| 2 | Rewrite debug panels + test assertions | 3fbcfc57 | 4 files |

## URL Mapping Applied

| Legacy | V1 |
|--------|----|
| `/api/hue/status` | `/api/v1/hue/health` |
| `/api/hue/lights` | `/api/v1/hue/lights` |
| `/api/hue/lights/${id}` PUT | `/api/v1/hue/lights/${id}/state` (path split) |
| `/api/hue/rooms` | `/api/v1/hue/groups` |
| `/api/hue/rooms/${id}` PUT | `/api/v1/hue/groups/${id}/action` |
| `/api/hue/scenes` | `/api/v1/hue/scenes` |
| `/api/hue/groups/${gid}/scenes/${sid}` | `/api/v1/hue/groups/${gid}/scenes/${sid}` |

## Verification

- Zero `/api/hue/` references in any file outside `app/api/hue/` directory
- `useLightsData.ts` uses `/api/v1/hue/health`, `/api/v1/hue/groups`, `/api/v1/hue/lights`, `/api/v1/hue/scenes`
- `useLightsCommands.ts` uses `/api/v1/hue/groups/${id}/action` and `/api/v1/hue/groups/${gid}/scenes/${sid}`
- `lights/page.tsx` PUT calls target `/api/v1/hue/lights/${lightId}/state` (3 occurrences)
- Both debug HueTab panels use v1 URLs for all GET and PUT/POST calls
- Test assertions updated: `stringContaining('/api/v1/hue/lights/')`, `stringContaining('/api/v1/hue/groups/')`

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed missed scene activate URL in lights/scenes/page.tsx**
- **Found during:** Task 1 verification
- **Issue:** `handleActivateScene` at line 114 still used `/api/hue/groups/${groupId}/scenes/${sceneId}` — plan listed only 3 fetch replacements but this 4th call was also present
- **Fix:** Changed to `/api/v1/hue/groups/${groupId}/scenes/${sceneId}`
- **Files modified:** `app/lights/scenes/page.tsx`
- **Commit:** d51587ca

**2. [Rule 1 - Bug] Fixed stale JSDoc comment in useLightsCommands.ts**
- **Found during:** Task 1 verification grep
- **Issue:** JSDoc line still referenced `/api/hue/groups/{groupId}/scenes/{sceneId}` in comment
- **Fix:** Updated to `/api/v1/hue/groups/{groupId}/scenes/{sceneId}`
- **Files modified:** `app/components/devices/lights/hooks/useLightsCommands.ts`
- **Commit:** d51587ca

## Known Stubs

None — all URL changes are complete. No placeholder data flows to UI.

## Pre-existing Issues (Out of Scope)

**debug/api HueTab test (app/debug/api/components/tabs/__tests__/HueTab.test.tsx):** Pre-existing failure — `jest.mock('../ApiTab', ...)` cannot resolve `'../ApiTab'` module. This failure exists on the main branch before any phase 166 changes. Deferred to tech debt backlog. Our URL assertion updates in this file are correct and will work once the mock path is fixed.

## Threat Flags

None — URL changes are first-party API path updates only, no new trust boundaries introduced.

## Self-Check: PASSED

- [x] `app/components/devices/lights/hooks/useLightsData.ts` — modified, committed d51587ca
- [x] `app/components/devices/lights/hooks/useLightsCommands.ts` — modified, committed d51587ca
- [x] `app/lights/page.tsx` — modified, committed d51587ca
- [x] `app/lights/scenes/page.tsx` — modified, committed d51587ca
- [x] `app/components/lights/CreateSceneModal.tsx` — modified, committed d51587ca
- [x] `app/components/lights/EditSceneModal.tsx` — modified, committed d51587ca
- [x] `app/registry/devices/page.tsx` — modified, committed d51587ca
- [x] `app/debug/components/tabs/HueTab.tsx` — modified, committed 3fbcfc57
- [x] `app/debug/api/components/tabs/HueTab.tsx` — modified, committed 3fbcfc57
- [x] `app/debug/components/tabs/__tests__/HueTab.test.tsx` — modified, committed 3fbcfc57
- [x] `app/debug/api/components/tabs/__tests__/HueTab.test.tsx` — modified, committed 3fbcfc57
- [x] Zero `/api/hue/` references in non-legacy files (verified by grep)
- [x] Commits d51587ca and 3fbcfc57 exist in git log
