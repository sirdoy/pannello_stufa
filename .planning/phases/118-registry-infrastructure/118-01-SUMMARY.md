---
phase: 118-registry-infrastructure
plan: "01"
subsystem: registry
tags: [haClient, types, proxy, registry]
dependency_graph:
  requires: []
  provides: [haDelete transport, PaginatedResponse<T>, Device Registry types, registryProxy]
  affects: [lib/haClient.ts, types/common.ts, types/registry.ts, lib/registry/registryProxy.ts]
tech_stack:
  added: []
  patterns: [function-module-proxy, double-assertion-strict-typescript]
key_files:
  created:
    - types/common.ts
    - types/registry.ts
    - lib/registry/registryProxy.ts
    - lib/registry/index.ts
  modified:
    - lib/haClient.ts
decisions:
  - "haDelete uses double-assertion (as unknown as Record<string, unknown>) for typed body params — consistent with existing codebase strict TypeScript pattern"
  - "PaginatedResponse<T> placed in types/common.ts (not types/registry.ts) — shared by registry, rooms, automations modules"
metrics:
  duration: "~2 minutes"
  completed: "2026-03-22"
  tasks_completed: 2
  files_created: 4
  files_modified: 1
requirements: [INFRA-01, INFRA-02]
---

# Phase 118 Plan 01: Registry Infrastructure — Types & Proxy Summary

**One-liner:** haDelete transport + typed Device Registry proxy client with 8 methods via PaginatedResponse<T> shared generic.

## What Was Built

Added the `haDelete` DELETE transport to the shared HA proxy client, defined all Device Registry TypeScript interfaces, and created the `registryProxy` function module covering all 8 Device Registry API endpoints.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Add haDelete + types/common.ts + types/registry.ts | 6900ee92 | lib/haClient.ts, types/common.ts, types/registry.ts |
| 2 | Create registryProxy.ts function module + barrel | c564db64 | lib/registry/registryProxy.ts, lib/registry/index.ts |

## Decisions Made

1. **Double assertion for typed body params:** `body as unknown as Record<string, unknown>` required for strict TypeScript compliance when passing typed interfaces (`DeviceTypeCreate`, `DeviceCreate`, `DeviceUpdate`) to `haPost`/`haPut`. Consistent with existing pattern in the codebase.

2. **PaginatedResponse<T> in types/common.ts:** Shared generic placed in `types/common.ts` (not `types/registry.ts`) to be reusable by rooms, automations, and other future modules.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed TypeScript strict type mismatch in registryProxy**
- **Found during:** Task 2 — `npx tsc --noEmit` verification
- **Issue:** `body as Record<string, unknown>` fails under strict TypeScript because `DeviceTypeCreate`, `DeviceCreate`, `DeviceUpdate` interfaces don't have index signatures. Error TS2352.
- **Fix:** Changed to double assertion `body as unknown as Record<string, unknown>` on all 3 affected calls (`createType`, `registerDevice`, `updateDevice`)
- **Files modified:** lib/registry/registryProxy.ts
- **Commit:** c564db64 (included in task commit)

## Known Stubs

None. All implementations are complete with real types and endpoint paths.

## Self-Check: PASSED

Files exist:
- [x] lib/haClient.ts — modified with haDelete
- [x] types/common.ts — created
- [x] types/registry.ts — created
- [x] lib/registry/registryProxy.ts — created
- [x] lib/registry/index.ts — created

Commits exist:
- [x] 6900ee92 — feat(118-01): add haDelete transport + types/common.ts + types/registry.ts
- [x] c564db64 — feat(118-01): create registryProxy function module + barrel export

TypeScript: 0 errors (`npx tsc --noEmit`)
