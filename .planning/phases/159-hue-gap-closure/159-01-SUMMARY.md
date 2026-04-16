---
phase: 159-hue-gap-closure
plan: "01"
subsystem: hue
tags: [api-routes, hue, v1, gap-closure]
dependency_graph:
  requires: [lib/hue/hueProxy.ts, lib/core, lib/firebaseAdmin]
  provides: [GET /api/v1/hue/health, GET /api/v1/hue/lights/{lightId}, PUT /api/v1/hue/lights/{lightId}/state]
  affects: []
tech_stack:
  added: []
  patterns: [withAuthAndErrorHandler, force-dynamic, 202-Accepted, adminDbPush-logging]
key_files:
  created:
    - app/api/v1/hue/health/route.ts
    - app/api/v1/hue/health/__tests__/route.test.ts
    - app/api/v1/hue/lights/[lightId]/route.ts
    - app/api/v1/hue/lights/[lightId]/__tests__/route.test.ts
    - app/api/v1/hue/lights/[lightId]/state/route.ts
    - app/api/v1/hue/lights/[lightId]/state/__tests__/route.test.ts
  modified: []
decisions:
  - "param name is 'lightId' (matches folder [lightId]) not 'id' like the old /api/hue/ route"
  - "PUT returns NextResponse.json(proxyResponse, { status: 202 }) not success() per 202 Accepted pattern"
  - "Firebase log uses 'log' path consistent with existing light state commands in /api/hue/lights/[id]"
metrics:
  duration: "<5 min"
  completed: "2026-04-09"
  tasks_completed: 1
  files_created: 6
  files_modified: 0
---

# Phase 159 Plan 01: v1 Hue Route Gap Closure Summary

v1 Hue API routes for bridge health read, single light read, and light state command — delegating to existing hueProxy functions with Auth0 protection and 202 Accepted pattern.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Create v1 Hue health, single light, and light state routes with tests | bbaa5a4f | 6 created |

## What Was Built

Three v1 API routes for Hue light control, filling the gap between the HA proxy paths and the Next.js route layer:

**GET /api/v1/hue/health** (HUE-01)
- Delegates to `getHealth()` from `lib/hue/hueProxy.ts`
- Returns 200 with bridge status/freshness data
- Protected with `withAuthAndErrorHandler` (401 when unauthenticated)

**GET /api/v1/hue/lights/{lightId}** (HUE-02)
- Extracts `lightId` from URL via `getPathParam(context, 'lightId')`
- Delegates to `getLight(lightId)` from `lib/hue/hueProxy.ts`
- Returns 200 with single light state and room enrichment
- Protected with `withAuthAndErrorHandler` (401 when unauthenticated)

**PUT /api/v1/hue/lights/{lightId}/state** (HUE-03)
- Extracts `lightId` from URL, parses body via `parseJson`
- Delegates to `setLightState(lightId, body)` from `lib/hue/hueProxy.ts`
- Logs action to Firebase (on/off/brightness with Italian descriptions)
- Returns `NextResponse.json(proxyResponse, { status: 202 })` per 202 Accepted pattern
- Protected with `withAuthAndErrorHandler` (401 when unauthenticated)

## Test Coverage

6 tests across 3 suites — all passing:
- Health: 401 unauthenticated, 200 happy path
- Single light: 401 unauthenticated, 200 happy path (asserts `mockGetLight` called with `'5'`)
- Light state PUT: 401 unauthenticated, 202 happy path (asserts `mockSetLightState` called, status 202)

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None.

## Threat Flags

None — all 3 routes implement `withAuthAndErrorHandler` (T-159-01 mitigated). Body parsing via `parseJson` handles malformed input (T-159-02 mitigated).

## Self-Check: PASSED

- app/api/v1/hue/health/route.ts: FOUND
- app/api/v1/hue/lights/[lightId]/route.ts: FOUND
- app/api/v1/hue/lights/[lightId]/state/route.ts: FOUND
- app/api/v1/hue/health/__tests__/route.test.ts: FOUND
- app/api/v1/hue/lights/[lightId]/__tests__/route.test.ts: FOUND
- app/api/v1/hue/lights/[lightId]/state/__tests__/route.test.ts: FOUND
- Commit bbaa5a4f: FOUND
- All 6 tests: PASSED
