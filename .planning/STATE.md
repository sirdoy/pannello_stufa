---
gsd_state_version: 1.0
milestone: v19.0
milestone_name: API Alignment & Full Coverage
status: verifying
stopped_at: Completed 168-03-PLAN.md — Phase 168 Netatmo frontend cutover complete (all 3 waves shipped)
last_updated: "2026-04-21T09:29:56.052Z"
last_activity: 2026-04-21
progress:
  total_phases: 16
  completed_phases: 13
  total_plans: 27
  completed_plans: 27
  percent: 100
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-04-03)

**Core value:** I dispositivi vengono riconosciuti automaticamente dopo il riavvio del browser e le notifiche arrivano sempre (100% delivery rate per dispositivi registrati).
**Current focus:** Phase 168 — netatmo-frontend-cutover

## Current Position

Phase: 168 (netatmo-frontend-cutover) — EXECUTING
Plan: 3 of 3 (Wave 3 — legacy tree deletion pending)
Status: Phase complete — ready for verification
Last activity: 2026-04-21

Progress: [██████████████░░░░░] 2/3 plans (67%)

## Performance Metrics

**Velocity:**

- Total plans completed (all milestones): 467
- v18.0 average: 2.1 plans/phase (15 plans / 7 phases)

**By Milestone (recent):**

| Milestone | Phases | Plans | Duration |
|-----------|--------|-------|----------|
| v17.0 WebSocket Real-Time Transport | 139-144 | 11 | 3 days |
| v17.1 WebSocket Alignment & Tuya Integration | 145-148 | 10 | 3 days |
| v18.0 Dark-Only & Mobile-First | 149-155 | 15 | 2 days |
| Phase 168-netatmo-frontend-cutover P03 | 67min | 1 tasks | 33 files |

## Accumulated Context

### Decisions

See PROJECT.md Key Decisions table for full history.

Recent decisions affecting v19.0:

- Scheduler endpoints explicitly excluded from v19.0 (future milestone)
- v19.0 covers proxy client + API routes only; no dedicated UI pages
- All endpoints follow established pattern: proxy client function -> API route -> (optional hook)
- [Plan 168-02] Netatmo v1 camera snapshot emits 302 redirect (NextResponse.redirect) to preserve <img src> compat without client rewrite (Q3)
- [Plan 168-02] Legacy /schedules endpoint DROPPED (D-04); schedules now extracted from /homesdata body.homes[0].schedules in useScheduleData
- [Plan 168-02] jest.setup.ts NextResponseMock gained static .redirect() (Rule 1 fix — auto-applied when Task 4 Jest matrix caught Task 1 regression)
- [Phase 168-netatmo-frontend-cutover]: [Plan 168-03] Legacy app/api/netatmo/ tree deleted (33 files: 18 route.ts + 2 co-located tests + 13 legacy __tests__/ files). Zero /api/netatmo/ refs remain in production; 26 netatmo Jest suites (98 tests) green. Phase 168 complete: all 9 NETA-XX wired via /api/v1/netatmo/** only.

### Pending Todos

None.

### Blockers/Concerns

None.

### Quick Tasks Completed

| # | Description | Date | Commit | Directory |
|---|-------------|------|--------|-----------|
| 260322-t5k | Remove analytics/monitoring subsystem + fix build errors | 2026-03-22 | de582d37 | [260322-t5k-rimuovi-la-parte-di-monitoring-analytics](./quick/260322-t5k-rimuovi-la-parte-di-monitoring-analytics/) |
| 260325-ds8 | Scheduler technical doc for HA proxy team | 2026-03-25 | c746df6b | [260325-ds8-scheduler-technical-doc-for-ha-proxy-tea](./quick/260325-ds8-scheduler-technical-doc-for-ha-proxy-tea/) |
| 260328-jyf | Align WS types with HA proxy types | 2026-03-28 | 635f6337 | [260328-jyf-align-ws-types-with-ha-proxy-types-same-](./quick/260328-jyf-align-ws-types-with-ha-proxy-types-same-/) |
| 260331-dwi | Fix CameraCard not rendering with WS active | 2026-03-31 | 221f4efb | [260331-dwi-con-ws-attivo-non-si-vede-la-card-di-net](./quick/260331-dwi-con-ws-attivo-non-si-vede-la-card-di-net/) |
| 260331-eyf | Fix broken /monitoring navbar link and notification URLs | 2026-03-31 | ad2b9507 | [260331-eyf-fix-menu-links-and-add-missing-pages-to-](./quick/260331-eyf-fix-menu-links-and-add-missing-pages-to-/) |

## Session Continuity

Last activity: 2026-04-21 — Phase 168 Plan 02 complete (Netatmo production consumer cutover to v1)
Stopped at: Completed 168-03-PLAN.md — Phase 168 Netatmo frontend cutover complete (all 3 waves shipped)
Resume file: None
