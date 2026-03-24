---
phase: 127-sonos-transport-controls
plan: "02"
subsystem: sonos
tags: [api-routes, transport-controls, volume, mute, seek, 202-accepted]
dependency_graph:
  requires: [lib/sonos/sonosProxy.ts, lib/core, types/sonosProxy.ts]
  provides:
    - GET /api/sonos/zones/[groupId]/playback
    - POST /api/sonos/zones/[groupId]/play
    - POST /api/sonos/zones/[groupId]/pause
    - POST /api/sonos/zones/[groupId]/stop
    - POST /api/sonos/zones/[groupId]/next
    - POST /api/sonos/zones/[groupId]/previous
    - PUT /api/sonos/zones/[groupId]/volume
    - PUT /api/sonos/zones/[groupId]/seek
    - GET /api/sonos/speakers/[uid]/volume
    - PUT /api/sonos/speakers/[uid]/volume
    - PUT /api/sonos/speakers/[uid]/mute
  affects: [Phase 129 Sonos frontend]
tech_stack:
  added: []
  patterns:
    - POST command routes return 202 Accepted with suggested_poll_delay_s (no request body)
    - PUT routes parse body with parseJson and cast to typed request interface
    - GET routes use double assertion pattern for success() compatibility
    - Co-located GET+PUT in speaker volume/route.ts
decisions:
  - No idempotency wrappers on any Sonos command routes (per plan D-04)
  - POST transport routes have no body parsing (empty body per D-08)
  - No position format validation at Next.js layer for seek (per D-15)
  - suggested_poll_delay_s hardcoded to 1 for all command responses
metrics:
  duration_seconds: 120
  completed_date: "2026-03-24"
  tasks_completed: 2
  tasks_total: 2
  files_created: 10
  files_modified: 0
requirements:
  - SONOS-07
  - SONOS-08
  - SONOS-09
  - SONOS-10
  - SONOS-11
  - SONOS-12
  - SONOS-13
  - SONOS-14
  - SONOS-15
  - SONOS-16
  - SONOS-17
---

# Phase 127 Plan 02: Sonos Transport Control API Routes Summary

**One-liner:** 10 Next.js API route files for Sonos zone transport (GET/POST) and speaker/zone volume+mute+seek (GET/PUT) with 202 Accepted pattern.

## What Was Built

Created 10 new route files across two directory trees:

**Zone routes (8 files under `app/api/sonos/zones/[groupId]/`):**

| File | Method | Handler | Requirement |
|------|--------|---------|-------------|
| playback/route.ts | GET | getPlayback(groupId) | SONOS-07 |
| play/route.ts | POST | play(groupId) | SONOS-09 |
| pause/route.ts | POST | pause(groupId) | SONOS-10 |
| stop/route.ts | POST | stop(groupId) | SONOS-11 |
| next/route.ts | POST | next(groupId) | SONOS-12 |
| previous/route.ts | POST | previous(groupId) | SONOS-13 |
| volume/route.ts | PUT | setZoneVolume(groupId, body.volume) | SONOS-16 |
| seek/route.ts | PUT | seek(groupId, body.position) | SONOS-17 |

**Speaker routes (2 files under `app/api/sonos/speakers/[uid]/`):**

| File | Methods | Handlers | Requirements |
|------|---------|---------|-------------|
| volume/route.ts | GET + PUT | getSpeakerVolume / setSpeakerVolume | SONOS-08 + SONOS-14 |
| mute/route.ts | PUT | setSpeakerMute | SONOS-15 |

All files follow established project patterns:
- `export const dynamic = 'force-dynamic'`
- `withAuthAndErrorHandler` wrapper for Auth0 + error handling
- GET routes: double assertion `data as unknown as Record<string, unknown>`
- POST routes: no body parsing, return 202 with `suggested_poll_delay_s: 1`
- PUT routes: `parseJson(request) as TypedRequest`, return 202 with `suggested_poll_delay_s: 1`

## Task Commits

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Zone transport control and playback routes | 5dc71aee | 8 zone route files |
| 2 | Speaker volume and mute routes | ab13b662 | 2 speaker route files |

## Verification

```
find app/api/sonos/zones/[groupId] -name "route.ts" | wc -l
# → 8 ✓

find app/api/sonos/speakers/[uid] -name "route.ts" | wc -l
# → 2 ✓

grep -r "HTTP_STATUS.ACCEPTED" app/api/sonos/zones/[groupId] app/api/sonos/speakers/[uid] | wc -l
# → 9 (5 POST + 4 PUT) ✓

grep -rL "force-dynamic" app/api/sonos/zones/[groupId] app/api/sonos/speakers/[uid]
# → (empty — all have it) ✓

grep -l "parseJson" app/api/sonos/zones/[groupId]/play/route.ts ...
# → (none — POST routes have no body parsing) ✓
```

## Deviations from Plan

None - plan executed exactly as written.

## Known Stubs

None - all route files are fully implemented and wired to sonosProxy functions.

## Self-Check: PASSED

- `app/api/sonos/zones/[groupId]/playback/route.ts` exists: FOUND
- `app/api/sonos/zones/[groupId]/play/route.ts` exists: FOUND
- `app/api/sonos/zones/[groupId]/pause/route.ts` exists: FOUND
- `app/api/sonos/zones/[groupId]/stop/route.ts` exists: FOUND
- `app/api/sonos/zones/[groupId]/next/route.ts` exists: FOUND
- `app/api/sonos/zones/[groupId]/previous/route.ts` exists: FOUND
- `app/api/sonos/zones/[groupId]/volume/route.ts` exists: FOUND
- `app/api/sonos/zones/[groupId]/seek/route.ts` exists: FOUND
- `app/api/sonos/speakers/[uid]/volume/route.ts` exists: FOUND
- `app/api/sonos/speakers/[uid]/mute/route.ts` exists: FOUND
- Commit 5dc71aee exists: FOUND
- Commit ab13b662 exists: FOUND
