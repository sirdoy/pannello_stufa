---
gsd_state_version: 1.0
milestone: v19.0
milestone_name: API Alignment & Full Coverage
status: milestone_complete
stopped_at: Milestone v19.0 archived
last_updated: "2026-04-27T08:00:00.000Z"
last_activity: 2026-04-27
progress:
  total_phases: 18
  completed_phases: 18
  total_plans: 39
  completed_plans: 42
  percent: 100
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-04-03)

**Core value:** I dispositivi vengono riconosciuti automaticamente dopo il riavvio del browser e le notifiche arrivano sempre (100% delivery rate per dispositivi registrati).
**Current focus:** v19.0 shipped 2026-04-27 — planning next milestone

## Current Position

Phase: —
Plan: —
Status: Milestone v19.0 archived
Last activity: 2026-04-27 (milestone close)

Progress: [██████████] 100%

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
| Phase 169-dirigera-frontend-cutover P01 | 40 | 5 tasks | 14 files |
| Phase 169-dirigera-frontend-cutover P02 | 57 | 7 tasks | 11 files |
| Phase 169-dirigera-frontend-cutover P03 | 15 | 5 tasks | 5 files |
| Phase 173 P02 | 4 | 1 tasks | 1 files |
| Phase 173 P04 | 3 | 1 tasks | 1 files |
| Phase 173 P03 | 6 | 1 tasks | 2 files |

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
- Full passthrough vs explicit spread for v1 dirigera routes: health+sensors/summary use passthrough, sensors/contact/motion use explicit { sensors, count, is_stale } spread (D-02)
- WS subscribe/unsubscribe('dirigera',...) topic strings left byte-for-byte unchanged in URL swap (Pitfall 2)
- Three independent hooks per D-07 (useDirigeraStats/History/Telemetry) — not folded into useDirigeraFullData; replace-on-poll/append-on-loadMore per Pitfall 6
- Panel headings use semantic <h2> with token classes (not Heading design-system component) to avoid unverified import dependency
- git rm -r app/api/dirigera/ atomically deleted all 5 legacy route.ts files; v1 surface (8 routes) intact pre and post
- [Plan 173-04] Documentation update shipped in Phase 173 (D-21 closed); errors[] (D-13) and ?provider_type= filter (D-20) documented with examples
- [Plan 173-03] Route uses parseQuery(request) instead of request.nextUrl.searchParams to keep handlers testable with plain Request objects (matches automations canonical pattern)

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
| 260423-n6i | Fix jest config performance (worktree ignores, maxWorkers cap, scoped scripts, CLAUDE.md rule 8) | 2026-04-23 | 79b758a6 | [260423-n6i-fix-jest-config-performance-and-resource](./quick/260423-n6i-fix-jest-config-performance-and-resource/) |

## Session Continuity

Last activity: 2026-04-23 — Completed quick task 260423-n6i (jest config performance fix)
Stopped at: Completed 173-03-PLAN.md
Resume file: None

**Planned Phase:** 173 (Cross-Provider Device Aggregator) — 4 plans — 2026-04-25T10:25:14.484Z

## Deferred Items

Items acknowledged and deferred at v19.0 milestone close on 2026-04-27.

### Debug Sessions (7 — orphan `.resolved` state files)

| Slug | Status |
|------|--------|
| build-errors-integration-tests.resolved | investigating |
| build-errors-pages.resolved | investigating |
| build-errors-tests-groupB.resolved | investigating |
| build-errors-ui-tests.resolved | fixing |
| device-activation-permission-denied.resolved | verifying |
| netatmo-invalid-token.resolved | verifying |
| permission-denied-panel-commands.resolved | checkpoint |

### UAT Gaps (3 partial — v19.0 audit accepted)

| Phase | Status | Notes |
|-------|--------|-------|
| 166 | partial | 1 pending: Firebase adminDbPush log write (live env) |
| 169 | partial | 1 pending: /dirigera panels render (Playwright BYPASS_AUTH) |
| 170 | partial | 4 pending: cookie httpOnly, plaintext API key auth, revoke 401, clipboard |

### Verification Gaps (8)

| Phase | Status | Notes |
|-------|--------|-------|
| 05 | gaps_found | Pre-v19.0 historical |
| 39 | gaps_found | Pre-v19.0 historical |
| 42 | gaps_found | Pre-v19.0 historical |
| 50 | human_needed | Pre-v19.0 historical |
| 158 | human_needed | v19.0 — code-verified, 3 browser smoke pending |
| 166 | human_needed | v19.0 — code-verified, live env pending |
| 169 | human_needed | v19.0 — code-verified, Playwright BYPASS_AUTH blocked |
| 170 | human_needed | v19.0 — code-verified, browser/live UAT pending |

### Quick Tasks (39 missing — backlog of unexecuted ideas in `.planning/quick/`)

001..014, 15..32, 260319-kd7, 260322-t5k, 260325-ds8, 260328-jyf, 260331-dwi, 260331-eyf, 260423-n6i

These are idea slugs scaffolded but never executed. Promote individually post-close if needed.
