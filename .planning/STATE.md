---
gsd_state_version: 1.0
milestone: v11.0
milestone_name: API Unification & Raspberry Pi Monitor
status: planning
stopped_at: Completed 85-01-PLAN.md
last_updated: "2026-03-17T10:52:50.649Z"
last_activity: 2026-03-17 — Roadmap created (7 phases, 18 requirements mapped)
progress:
  total_phases: 7
  completed_phases: 2
  total_plans: 2
  completed_plans: 2
  percent: 0
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-17)

**Core value:** I dispositivi vengono riconosciuti automaticamente dopo il riavvio del browser e le notifiche arrivano sempre (100% delivery rate per dispositivi registrati).
**Current focus:** v11.0 API Unification & Raspberry Pi Monitor — Phase 84 ready to plan

## Current Position

Phase: 84 of 90 (Shared HA API Client)
Plan: — (not started)
Status: Ready to plan
Last activity: 2026-03-17 — Roadmap created (7 phases, 18 requirements mapped)

Progress: [░░░░░░░░░░] 0% (0/7 phases)

## Performance Metrics

**Velocity:**
- Total plans completed (all milestones): 348
- v10.0 average: 2.0 plans/phase (18 plans / 9 phases)
- v9.0 average: 1.6 plans/phase (8 plans / 5 phases)
- v8.0 average: 2.6 plans/phase (18 plans / 7 phases)

**By Milestone (recent):**

| Milestone | Phases | Plans | Duration |
|-----------|--------|-------|----------|
| v8.0 Fritz!Box Network Monitor | 61-67 | 18 | 3 days |
| v9.0 Performance Optimization | 70-74 | 8 | 2 days |
| v10.0 Netatmo API Migration | 75-83 | 18 | 2 days |
| Phase 84 P01 | 198 | 2 tasks | 3 files |
| Phase 85 P01 | 15 | 3 tasks | 6 files |

## Accumulated Context

### Decisions

See PROJECT.md Key Decisions table for full history.

Recent decisions relevant to v11.0:
- [v10.0]: Function module for proxy client — no JWT state, simpler than class-based Fritz!Box client
- [v10.0]: RFC 9457 error mapping — structured errors from proxy mapped to ApiError instances
- [v8.0]: Server-side proxy for Fritz!Box — API key never exposed to client, rate limiting on server
- [Phase 84]: Function module for haClient (no class): simpler transport, matches v10.0 Netatmo pattern
- [Phase 84]: RFC9457ProblemDetail moved to types/haClient.ts as single source of truth for all providers
- [Phase 84]: RATE_LIMITED (429) explicit mapping added — improvement over netatmoProxy.ts which missed this
- [Phase 85]: Function module pattern for fritzboxClient — matches netatmoProxy.ts, consistent across all HA providers
- [Phase 85]: Fritz!Box credential config route deleted — X-API-Key env var replaces Firebase RTDB credential storage

### Pending Todos

None.

### Blockers/Concerns

None.

### Quick Tasks Completed

| # | Description | Date | Commit | Directory |
|---|-------------|------|--------|-----------|
| 31 | Hide debug and design-system pages in production | 2026-02-18 | 991f470 | [31-hide-debug-and-design-system-pages-in-pr](./quick/31-hide-debug-and-design-system-pages-in-pr/) |
| 32 | controlla e pulisci tutta la documentazione inutile | 2026-03-14 | c2940eb | [32-controlla-e-pulisci-tutta-la-documentazi](./quick/32-controlla-e-pulisci-tutta-la-documentazi/) |

## Session Continuity

Last session: 2026-03-17T10:52:50.645Z
Stopped at: Completed 85-01-PLAN.md
Resume file: None
