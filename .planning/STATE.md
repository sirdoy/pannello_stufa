---
gsd_state_version: 1.0
milestone: v13.0
milestone_name: Thermorossi Proxy Migration
status: unknown
stopped_at: Completed 101-01-PLAN.md
last_updated: "2026-03-19T14:53:36.487Z"
progress:
  total_phases: 5
  completed_phases: 2
  total_plans: 6
  completed_plans: 5
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-19)

**Core value:** I dispositivi vengono riconosciuti automaticamente dopo il riavvio del browser e le notifiche arrivano sempre (100% delivery rate per dispositivi registrati).
**Current focus:** Phase 101 — frontend-hooks

## Current Position

Phase: 101 (frontend-hooks) — EXECUTING
Plan: 1 of 2

## Performance Metrics

**Velocity:**

- Total plans completed (all milestones): 375
- v12.0 average: 1.3 plans/phase (4 plans / 3 phases)
- v10.0 average: 2.0 plans/phase (18 plans / 9 phases) — best migration reference

**By Milestone (recent):**

| Milestone | Phases | Plans | Duration |
|-----------|--------|-------|----------|
| v10.0 Netatmo API Migration | 75-83 | 18 | 2 days |
| v11.0 API Unification & Raspberry Pi | 84-91 | 13 | 2 days |
| v11.1 Test Suite & Tech Debt Cleanup | 92-95 | 9 | 1 day |
| v12.0 Data Fetching & E2E | 96-98 | 4 | 2 days |
| Phase 99 P02 | 87 | 2 tasks | 4 files |
| Phase 100-control-endpoints P01 | 5 | 2 tasks | 2 files |
| Phase 100 P02 | 5 | 2 tasks | 6 files |
| Phase 101 P01 | 400 | 2 tasks | 4 files |

## Accumulated Context

### Decisions

See PROJECT.md Key Decisions table for full history.

Key decisions relevant to v13.0:

- Shared haClient (v11.0): use `haGet`/`haPost` from `lib/haClient.ts` — same pattern as Netatmo/Fritz!Box/Raspi
- Function module pattern (v10.0/v11.0): thermorossiProxy.ts as function module, no class state
- RFC 9457 error mapping (v10.0): proxy errors map to ApiError instances for error boundary compatibility

Phase 99 Plan 01 decisions:

- DataFreshness is 'LIVE' | 'STALE' only — UNREACHABLE triggers HTTP 503, never appears in body
- No haPost in thermorossiProxy.ts — command wrappers deferred to Phase 100
- getHistory accepts optional URLSearchParams, appends as query string (same pattern as getProxyRoomMeasure)
- [Phase 99]: Migrated three stove read routes from stoveApi to thermorossiProxy; created new /api/stove/health route
- [Phase 100-01]: Command wrappers use haPost<ThermorossiCommandResponse> matching existing haGet pattern — empty body commands pass empty object literal
- [Phase 100]: Commands return HTTP 202 (proxy convention), history returns 200 (read endpoint)
- [Phase 100]: setWaterTemperature gains withIdempotency for consistency; proxy handles range validation (validateRange removed)
- [Phase 101]: switch/case on StoveState union replaces toUpperCase().includes() in stoveStatusUtils
- [Phase 101]: data_freshness === STALE drives staleness — useDeviceStaleness removed from stove
- [Phase 101]: modulating added to isStoveActive (missed by old WORK substring logic)

### Pending Todos

None.

### Blockers/Concerns

- Proxy returns `stove_state` (exact string) instead of `StatusDescription` — stoveStatusUtils.ts needs full rewrite
- Proxy uses 202 Accepted for all commands — useStoveCommands success detection must change from 200 to 202
- Scheduler has ~1032 lines; stove_state migration requires careful state-machine logic review

### Quick Tasks Completed

| # | Description | Date | Commit | Directory |
|---|-------------|------|--------|-----------|
| 260319-kd7 | Fix Vercel env vars for HA proxy connection | 2026-03-19 | — | [260319-kd7-su-vercel-non-sono-stati-caricati-i-dati](./quick/260319-kd7-su-vercel-non-sono-stati-caricati-i-dati/) |

## Session Continuity

Last session: 2026-03-19T14:53:24.261Z
Stopped at: Completed 101-01-PLAN.md
Resume file: None
