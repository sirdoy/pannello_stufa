---
phase: 106-proxy-client-types-read-endpoints
plan: "01"
subsystem: hue-proxy
tags: [hue, proxy-client, typescript-types, unit-tests]
dependency_graph:
  requires: [lib/haClient.ts]
  provides: [types/hueProxy.ts, lib/hue/hueProxy.ts]
  affects: [Phase 107 API routes, Phase 108 frontend hooks]
tech_stack:
  added: []
  patterns: [function-module-proxy-client, haGet-wrapper, URLSearchParams-endpoint-builder]
key_files:
  created:
    - types/hueProxy.ts
    - lib/hue/hueProxy.ts
    - lib/hue/__tests__/hueProxy.test.ts
  modified: []
decisions:
  - "on_state and reachable in HueHistoryItem typed as number | null (not boolean) — SQLite stores integers, Pydantic Optional[int]"
  - "getScenes accepts optional groupId string (not URLSearchParams) — single query param, simpler API"
metrics:
  duration_minutes: 3
  tasks_completed: 2
  files_created: 3
  files_modified: 0
  completed_date: "2026-03-20"
requirements_satisfied: [CLIENT-01, CLIENT-02, CLIENT-03]
---

# Phase 106 Plan 01: Hue Proxy Types and Client Module Summary

Typed proxy client foundation for the Hue Bridge API: 10 TypeScript type exports matching proxy response shapes, 7 haGet convenience wrappers, and 9 unit tests.

## What Was Built

### types/hueProxy.ts

Four union types and six interfaces matching `docs/api/hue.md` response shapes exactly:

- `HueCapabilityTier` — `'white' | 'ambiance' | 'color'`
- `HueDataFreshness` — `'LIVE' | 'STALE'` (UNREACHABLE is HTTP 503, never in body)
- `HueColorMode` — `'ct' | 'hs' | 'xy'`
- `HueHistoryGranularity` — `'raw' | 'hourly' | 'daily'`
- `HueLight` — 15 fields including room enrichment and capability tier
- `HueGroup` — 10 fields including lights member array
- `HueScene` — 6 fields
- `HueBridgeHealth` — 7 fields
- `HueHistoryItem` — 16 fields (on_state/reachable as `number | null`, not boolean)
- `HueHistoryResponse` — pagination envelope with granularity

### lib/hue/hueProxy.ts

Function module with 7 typed wrappers following the `thermorossiProxy.ts` canonical pattern:

| Function | Path |
|----------|------|
| `getLights()` | `GET /api/v1/hue/lights` |
| `getLight(lightId)` | `GET /api/v1/hue/lights/{id}` |
| `getGroups()` | `GET /api/v1/hue/groups` |
| `getGroup(groupId)` | `GET /api/v1/hue/groups/{id}` |
| `getScenes(groupId?)` | `GET /api/v1/hue/scenes[?group_id=]` |
| `getHealth()` | `GET /api/v1/hue/health` |
| `getHistory(params?)` | `GET /api/v1/hue/history[?params]` |

### lib/hue/__tests__/hueProxy.test.ts

9 tests — one per wrapper call pattern. Mocks `@/lib/haClient`, verifies each wrapper calls `haGet` with the exact endpoint path and returns the typed response.

## Verification

- `npx tsc --noEmit` — no errors in new files (pre-existing `.next` cache errors are unrelated, present before this plan)
- `npm test -- --testPathPatterns="hueProxy"` — 9/9 tests pass

## Deviations from Plan

None — plan executed exactly as written.

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| 1 — Types + client | 595204d | feat(106-01): create Hue proxy types and client module |
| 2 — Unit tests | 1bf8f8e | test(106-01): add unit tests for hueProxy client wrappers |

## Self-Check: PASSED

- FOUND: types/hueProxy.ts
- FOUND: lib/hue/hueProxy.ts
- FOUND: lib/hue/__tests__/hueProxy.test.ts
- FOUND commit: 595204d (feat: types + client)
- FOUND commit: 1bf8f8e (test: unit tests)
