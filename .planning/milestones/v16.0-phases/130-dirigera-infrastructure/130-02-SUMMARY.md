---
phase: 130-dirigera-infrastructure
plan: "02"
subsystem: dirigera
tags: [api-routes, dirigera, sensors, health, next-js]
dependency_graph:
  requires:
    - 130-01  # DIRIGERA types + proxy client
  provides:
    - GET /api/dirigera/health
    - GET /api/dirigera/sensors
    - GET /api/dirigera/sensors/contact
    - GET /api/dirigera/sensors/motion
    - GET /api/dirigera/sensors/summary
  affects:
    - Future phases: frontend hooks that call these routes
tech_stack:
  added: []
  patterns:
    - withAuthAndErrorHandler wrapping all routes
    - double assertion for object responses (health, summary)
    - named key wrapping for array responses (sensors, contact, motion)
    - force-dynamic for all routes
key_files:
  created:
    - app/api/dirigera/health/route.ts
    - app/api/dirigera/sensors/route.ts
    - app/api/dirigera/sensors/contact/route.ts
    - app/api/dirigera/sensors/motion/route.ts
    - app/api/dirigera/sensors/summary/route.ts
  modified: []
decisions:
  - Object responses (health, summary) use double assertion pattern `data as unknown as Record<string, unknown>`
  - Array responses (sensors, contact, motion) spread fields `{ sensors: data.sensors, count: data.count, is_stale: data.is_stale }`
  - Label convention is flat camelCase matching Sonos pattern (Dirigera/SensorsContact not Dirigera/Sensors/Contact)
metrics:
  duration: "~2 minutes"
  completed_date: "2026-03-24"
  tasks_completed: 2
  files_created: 5
  files_modified: 0
requirements:
  - DIRIG-03
  - DIRIG-04
  - DIRIG-05
  - DIRIG-06
  - DIRIG-07
---

# Phase 130 Plan 02: DIRIGERA API Routes Summary

5 authenticated Next.js API routes wiring the DIRIGERA proxy client to REST endpoints for hub health and sensor data.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Health + sensors list routes | d517498e | app/api/dirigera/health/route.ts, app/api/dirigera/sensors/route.ts |
| 2 | Contact, motion, and summary routes | 1fef59d2 | app/api/dirigera/sensors/contact/route.ts, app/api/dirigera/sensors/motion/route.ts, app/api/dirigera/sensors/summary/route.ts |

## What Was Built

5 Next.js API route files under `app/api/dirigera/` exposing DIRIGERA proxy functions as authenticated REST endpoints:

- **GET /api/dirigera/health** — hub firmware, reachability, sensor count (object → double assertion)
- **GET /api/dirigera/sensors** — all sensors with `{ sensors, count, is_stale }` (array → named key wrapping)
- **GET /api/dirigera/sensors/contact** — contact sensors with `data_freshness` per sensor
- **GET /api/dirigera/sensors/motion** — motion sensors with `light_level` + `data_freshness`
- **GET /api/dirigera/sensors/summary** — fleet totals: total, open, offline, low battery (object → double assertion)

All routes use `withAuthAndErrorHandler` + `success()` from `@/lib/core`, export `dynamic = 'force-dynamic'`, and follow the established Sonos route pattern exactly.

## Decisions Made

1. **Double assertion vs named key wrapping:** Object responses (health, summary) use `data as unknown as Record<string, unknown>`; array-container responses (sensors, contact, motion) spread the three fields explicitly. This matches D-14 and the Sonos pattern.

2. **Label convention:** Flat camelCase labels (`Dirigera/SensorsContact`, not `Dirigera/Sensors/Contact`) to match the Sonos pattern (`Sonos/Health`, `Sonos/Zones`).

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None — routes delegate directly to proxy functions; no placeholder data.

## Self-Check: PASSED

- FOUND: app/api/dirigera/health/route.ts
- FOUND: app/api/dirigera/sensors/route.ts
- FOUND: app/api/dirigera/sensors/contact/route.ts
- FOUND: app/api/dirigera/sensors/motion/route.ts
- FOUND: app/api/dirigera/sensors/summary/route.ts
- FOUND commit d517498e (Task 1)
- FOUND commit 1fef59d2 (Task 2)
- TypeScript: 0 errors in DIRIGERA files
