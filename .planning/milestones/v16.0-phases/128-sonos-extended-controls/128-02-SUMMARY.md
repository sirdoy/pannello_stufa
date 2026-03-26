---
phase: 128-sonos-extended-controls
plan: "02"
subsystem: sonos
tags: [api-routes, typescript, extended-controls]
dependency_graph:
  requires: [lib/sonos/sonosProxy.ts, lib/core, types/sonosProxy.ts]
  provides:
    - GET+PUT /api/sonos/speakers/[uid]/eq
    - GET+PUT /api/sonos/speakers/[uid]/home-theater
    - POST /api/sonos/speakers/[uid]/source
    - POST /api/sonos/speakers/[uid]/join
    - POST /api/sonos/speakers/[uid]/unjoin
    - GET+PUT /api/sonos/zones/[groupId]/play-mode
    - GET /api/sonos/zones/[groupId]/queue
    - GET+PUT /api/sonos/zones/[groupId]/sleep-timer
    - GET /api/sonos/history
  affects: []
tech_stack:
  added: []
  patterns: [withAuthAndErrorHandler, 202-Accepted-with-suggested_poll_delay_s, searchParams-forwarding]
key_files:
  created:
    - app/api/sonos/speakers/[uid]/eq/route.ts
    - app/api/sonos/speakers/[uid]/home-theater/route.ts
    - app/api/sonos/speakers/[uid]/source/route.ts
    - app/api/sonos/speakers/[uid]/join/route.ts
    - app/api/sonos/speakers/[uid]/unjoin/route.ts
    - app/api/sonos/zones/[groupId]/play-mode/route.ts
    - app/api/sonos/zones/[groupId]/queue/route.ts
    - app/api/sonos/zones/[groupId]/sleep-timer/route.ts
    - app/api/sonos/history/route.ts
  modified: []
decisions:
  - "Unjoin route uses _request (no body needed) matching D-13 per plan"
  - "Queue and history routes read searchParams directly from request.nextUrl (no getPathParam for history)"
metrics:
  duration_minutes: 2
  completed_date: "2026-03-24"
  tasks_completed: 2
  files_modified: 9
---

# Phase 128 Plan 02: Sonos Extended Controls API Routes Summary

**One-liner:** 9 Next.js API route files exposing Sonos EQ, play-mode, queue, home-theater, source, join/unjoin, sleep-timer, and history via authenticated endpoints following Phase 127 patterns.

## What Was Built

Created 9 new route files under `app/api/sonos/` by exposing the sonosProxy wrappers from Plan 01 as authenticated Next.js API endpoints. All routes use `withAuthAndErrorHandler`, `force-dynamic`, and the `as unknown as Record<string, unknown>` cast pattern established in Phase 127.

### Task 1: Create 5 speaker route files

- `app/api/sonos/speakers/[uid]/eq/route.ts` — GET+PUT EQ settings (bass/treble/loudness). PUT returns 202 Accepted with `suggested_poll_delay_s: 1`.
- `app/api/sonos/speakers/[uid]/home-theater/route.ts` — GET+PUT soundbar settings (night_mode, speech_enhance, sub/surround). PUT returns 202 Accepted.
- `app/api/sonos/speakers/[uid]/source/route.ts` — POST switches audio input ('tv' | 'line_in'). Returns 202 Accepted.
- `app/api/sonos/speakers/[uid]/join/route.ts` — POST joins speaker to another group via `target_uid`. Returns 202 Accepted.
- `app/api/sonos/speakers/[uid]/unjoin/route.ts` — POST removes speaker from group. No request body (`_request`). Returns 202 Accepted.
- **Commit:** bcc0877f

### Task 2: Create 4 zone and history route files

- `app/api/sonos/zones/[groupId]/play-mode/route.ts` — GET+PUT shuffle/repeat/crossfade play mode. PUT returns 202 Accepted.
- `app/api/sonos/zones/[groupId]/queue/route.ts` — GET paginated queue with `limit`/`offset` forwarded from searchParams.
- `app/api/sonos/zones/[groupId]/sleep-timer/route.ts` — GET+PUT sleep timer. PUT returns 202 Accepted.
- `app/api/sonos/history/route.ts` — GET with 7 query params forwarded (type, speaker_uid, group_id, start, end, limit, offset). No `getPathParam` (no dynamic segment).
- **Commit:** 0c85b3fe

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None — all routes delegate directly to sonosProxy wrappers with no hardcoded or placeholder responses.

## Verification Results

- All 9 route files exist in correct directory structure
- Every file exports `const dynamic = 'force-dynamic'`
- All mutation handlers (PUT and POST) return `HTTP_STATUS.ACCEPTED` with `suggested_poll_delay_s: 1`
- Queue route reads `limit`/`offset` from `searchParams`
- History route reads all 7 query params; no `getPathParam` (no dynamic path segment)
- `npx jest --testPathPatterns=sonosProxy` → 30 passed, 0 failed (no regressions)

## Self-Check: PASSED

- app/api/sonos/speakers/[uid]/eq/route.ts exists
- app/api/sonos/speakers/[uid]/home-theater/route.ts exists
- app/api/sonos/speakers/[uid]/source/route.ts exists
- app/api/sonos/speakers/[uid]/join/route.ts exists
- app/api/sonos/speakers/[uid]/unjoin/route.ts exists
- app/api/sonos/zones/[groupId]/play-mode/route.ts exists
- app/api/sonos/zones/[groupId]/queue/route.ts exists
- app/api/sonos/zones/[groupId]/sleep-timer/route.ts exists
- app/api/sonos/history/route.ts exists
- Commits bcc0877f and 0c85b3fe present in git log
