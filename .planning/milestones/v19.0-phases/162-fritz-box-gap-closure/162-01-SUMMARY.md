---
phase: 162-fritz-box-gap-closure
plan: "01"
subsystem: fritzbox-telephony
tags: [fritzbox, telephony, dect, api-routes, gap-closure]
dependency_graph:
  requires: []
  provides: [telephony-dect-route, telephony-calls-route, telephony-tam-route]
  affects: [lib/fritzbox/fritzboxClient.ts]
tech_stack:
  added: []
  patterns: [withAuthAndErrorHandler, getCachedData, checkRateLimitFritzBox, raw-pass-through]
key_files:
  created:
    - app/api/fritzbox/telephony/dect/route.ts
    - app/api/fritzbox/telephony/dect/__tests__/route.test.ts
    - app/api/fritzbox/telephony/calls/route.ts
    - app/api/fritzbox/telephony/calls/__tests__/route.test.ts
    - app/api/fritzbox/telephony/tam/route.ts
    - app/api/fritzbox/telephony/tam/__tests__/route.test.ts
  modified:
    - lib/fritzbox/fritzboxClient.ts
key_decisions:
  - Raw pass-through for all three telephony functions (no field transformation per D-01)
  - getCallHistory accepts URLSearchParams for limit/offset pagination forwarding per D-03
  - Unique rate limit + cache keys per route (telephony-dect, telephony-calls, telephony-tam)
metrics:
  duration: "~8 minutes"
  completed: "2026-04-09"
  tasks_completed: 2
  tasks_total: 2
  files_created: 6
  files_modified: 1
requirements_closed: [FRITZ-01, FRITZ-02, FRITZ-03]
---

# Phase 162 Plan 01: Fritz!Box Telephony Routes Summary

**One-liner:** Three Fritz!Box telephony API routes (DECT handsets, call history, TAM status) with client functions and full test coverage closing FRITZ-01 through FRITZ-03.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Add telephony types and client functions | b73a43b3 | lib/fritzbox/fritzboxClient.ts |
| 2 | Create telephony API routes and tests | 00b21934 | 6 new files across telephony/dect, telephony/calls, telephony/tam |

## What Was Built

### Task 1: fritzboxClient.ts additions

Three new interfaces added after the History Tiers section:
- `DectHandset` — DECT handset registered with Fritz!Box
- `CallRecord` — call log entry
- `TamStatusResponse` — answering machine status

Three new async functions (raw pass-through per D-01):
- `getDectHandsets()` — calls `/api/v1/fritzbox/telephony/dect`
- `getCallHistory(params?)` — calls `/api/v1/fritzbox/telephony/calls` with optional URLSearchParams
- `getTamStatus()` — calls `/api/v1/fritzbox/telephony/tam`

All three exported in the `fritzboxClient` object under "Phase 162 telephony additions" comment.

### Task 2: API routes and tests

Three routes following canonical `withAuthAndErrorHandler + checkRateLimitFritzBox + getCachedData + success()` pattern:

| Route | Cache key | Response field | Client function |
|-------|-----------|----------------|-----------------|
| GET /api/fritzbox/telephony/dect | telephony-dect | dect | getDectHandsets() |
| GET /api/fritzbox/telephony/calls | telephony-calls | calls | getCallHistory(params) |
| GET /api/fritzbox/telephony/tam | telephony-tam | tam | getTamStatus() |

The calls route additionally forwards `limit` and `offset` query params via URLSearchParams.

Three test suites — 5 test cases each (401, 200, 429, cache key verification, error propagation) — **15/15 passing**.

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None — all routes are fully wired to fritzboxClient functions.

## Threat Flags

No new threat surface beyond what was already planned in the threat model. All three routes apply:
- `withAuthAndErrorHandler` (T-162-01 spoofing mitigation)
- Only `limit`/`offset` forwarded in calls route (T-162-02 tampering mitigation)
- Auth check + rate limiting on all routes (T-162-03, T-162-04 mitigations)

## Self-Check

Files created exist:
- app/api/fritzbox/telephony/dect/route.ts: FOUND
- app/api/fritzbox/telephony/calls/route.ts: FOUND
- app/api/fritzbox/telephony/tam/route.ts: FOUND
- All 3 test files: FOUND

Commits verified:
- b73a43b3: feat(162-01): add telephony client functions to fritzboxClient.ts
- 00b21934: feat(162-01): add telephony API routes and tests (DECT, calls, TAM)

## Self-Check: PASSED
