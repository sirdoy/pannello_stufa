---
phase: 160-sonos-gap-closure
plan: "02"
subsystem: api-routes
tags: [sonos, v1, routes, zone-control]
dependency_graph:
  requires:
    - lib/sonos/sonosProxy.ts
    - types/sonosProxy.ts
    - lib/core
  provides:
    - PUT /api/v1/sonos/zones/[groupId]/volume
    - PUT /api/v1/sonos/zones/[groupId]/seek
    - GET /api/v1/sonos/zones/[groupId]/queue
    - GET /api/v1/sonos/zones/[groupId]/play-mode
    - PUT /api/v1/sonos/zones/[groupId]/play-mode
    - GET /api/v1/sonos/zones/[groupId]/sleep-timer
    - PUT /api/v1/sonos/zones/[groupId]/sleep-timer
  affects: []
tech_stack:
  added: []
  patterns:
    - jsdom-safe mock request with headers.get + text() for parseJson in PUT tests
    - dual-export route (GET + PUT in same file) for play-mode and sleep-timer
    - null-to-undefined coercion (?? undefined) for optional query params
key_files:
  created:
    - app/api/v1/sonos/zones/[groupId]/volume/route.ts
    - app/api/v1/sonos/zones/[groupId]/volume/__tests__/route.test.ts
    - app/api/v1/sonos/zones/[groupId]/seek/route.ts
    - app/api/v1/sonos/zones/[groupId]/seek/__tests__/route.test.ts
    - app/api/v1/sonos/zones/[groupId]/queue/route.ts
    - app/api/v1/sonos/zones/[groupId]/queue/__tests__/route.test.ts
    - app/api/v1/sonos/zones/[groupId]/play-mode/route.ts
    - app/api/v1/sonos/zones/[groupId]/play-mode/__tests__/route.test.ts
    - app/api/v1/sonos/zones/[groupId]/sleep-timer/route.ts
    - app/api/v1/sonos/zones/[groupId]/sleep-timer/__tests__/route.test.ts
  modified: []
decisions:
  - jsdom-safe mock request pattern for parseJson: use object with headers.get() + text() instead of new Request() to ensure body is readable in jsdom test environment
metrics:
  duration: ~12 minutes
  completed: "2026-04-09T07:40:00Z"
  tasks_completed: 2
  tasks_total: 2
  files_created: 10
  files_modified: 0
  tests_added: 15
  tests_passing: 15
---

# Phase 160 Plan 02: v1 Sonos Zone Settings Routes Summary

**One-liner:** 5 v1 zone routes (volume PUT, seek PUT, queue GET, play-mode GET+PUT, sleep-timer GET+PUT) as thin wrappers over existing sonosProxy functions, with 15 tests passing.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Volume, seek, queue routes + tests | 8a2c9484 | 6 files (3 routes + 3 test files) |
| 2 | Play-mode, sleep-timer dual-export routes + tests | 77b16327 | 4 files (2 routes + 2 test files) |

## What Was Built

### Route Files (5 new)

- **volume/route.ts** — `PUT` wraps `setZoneVolume(groupId, body.volume)`, returns 202 + `suggested_poll_delay_s: 1`
- **seek/route.ts** — `PUT` wraps `seek(groupId, body.position)`, returns 202 + `suggested_poll_delay_s: 1`
- **queue/route.ts** — `GET` wraps `getQueue(groupId, limit ?? undefined, offset ?? undefined)`, returns 200
- **play-mode/route.ts** — `GET` wraps `getPlayMode(groupId)` (200); `PUT` wraps `setPlayMode(groupId, body)` (202)
- **sleep-timer/route.ts** — `GET` wraps `getSleepTimer(groupId)` (200); `PUT` wraps `setSleepTimer(groupId, body)` (202)

### Test Files (5 new, 15 tests total)

All routes covered for:
- 401 unauthenticated rejection
- Correct proxy function called with expected arguments
- Correct status code and response shape

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] jsdom parseJson body-reading failure in tests**

- **Found during:** Task 1 verification
- **Issue:** `parseJson` uses `request.text()` which silently returns empty string in jsdom's `Request` implementation, causing `body.volume` and `body.position` to be `undefined`. The existing hue PUT tests masked this by using `expect.any(Object)` rather than checking specific field values.
- **Fix:** Created a jsdom-safe mock request object `{ headers: { get() }, text: async () => JSON.stringify(body) }` instead of `new Request(...)` for PUT tests that need specific body field verification. Used for volume, seek, play-mode, and sleep-timer PUT tests.
- **Files modified:** `volume/__tests__/route.test.ts`, `seek/__tests__/route.test.ts`, `play-mode/__tests__/route.test.ts`, `sleep-timer/__tests__/route.test.ts`
- **Commits:** 8a2c9484, 77b16327

## Known Stubs

None — all routes are fully wired to existing proxy functions.

## Self-Check: PASSED

Files created:
- app/api/v1/sonos/zones/[groupId]/volume/route.ts — FOUND
- app/api/v1/sonos/zones/[groupId]/seek/route.ts — FOUND
- app/api/v1/sonos/zones/[groupId]/queue/route.ts — FOUND
- app/api/v1/sonos/zones/[groupId]/play-mode/route.ts — FOUND
- app/api/v1/sonos/zones/[groupId]/sleep-timer/route.ts — FOUND

Commits:
- 8a2c9484 — FOUND (Task 1: volume, seek, queue)
- 77b16327 — FOUND (Task 2: play-mode, sleep-timer)

Tests: 15/15 passing across all 5 route test files.
