# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-13)

**Core value:** I dispositivi vengono riconosciuti automaticamente dopo il riavvio del browser e le notifiche arrivano sempre (100% delivery rate per dispositivi registrati).

**Current focus:** v8.0 Fritz!Box Network Monitor — Phase 61: Foundation & Infrastructure

## Current Position

Phase: 61 (Foundation & Infrastructure)
Plan: 03 (Phase 61 complete - 2 of 2 plans done)
Status: Ready for next phase
Last activity: 2026-02-13 — Completed 61-02-PLAN.md (Fritz!Box API Routes)

Progress: [██░░░░░░░░░░░░░░░░░░] 10% (Phase 61 complete, 2 of 2 plans done)

## Performance Metrics

**Velocity:**
- Total plans completed: 300 (phases 1-61 complete)
- Average duration: ~15 min (estimated)
- Total execution time: ~75 hours across 10 milestones

**By Milestone:**

| Milestone | Phases | Plans | Duration |
|-----------|--------|-------|----------|
| v1.0 Push Notifications | 1-5 | 29 | 4 days |
| v2.0 Netatmo & Monitoring | 6-10 | 21 | 1.4 days |
| v3.0 Design System | 11-18 | 52 | 3 days |
| v3.1 Design Compliance | 19-24 | 13 | 4 days |
| v3.2 Dashboard & Weather | 25-29 | 13 | 2 days |
| v4.0 Advanced Components | 30-36 | 24 | 2 days |
| v5.0 TypeScript Migration | 37-43 | 56 | 4 days |
| v5.1 Tech Debt & Quality | 44-48 | 39 | 2 days |
| v6.0 Operations & PWA | 49-54 | 29 | 2 days |
| v7.0 Performance & Resilience | 55-60 | 22 | 2 days |

**v8.0 Target:**
- Phases: 7 (61-67)
- Estimated plans: 14-21 (2-3 plans per phase, comprehensive depth)
- Requirements: 32 (INFRA:6, DASH:5, WAN:3, DEV:5, BW:4, HIST:3, CAT:3, CORR:3)
- Estimated duration: 3-4 days
| Phase 61 P01 | 7 | 3 tasks | 11 files |
| Phase 61 P02 | 5 | 2 tasks | 8 files |

## Accumulated Context

### Decisions

**v8.0 Architecture decisions:**
- Server-side API proxy pattern (keeps Fritz!Box API key secure)
- Rate limiting with 6-second delay between requests (10 req/min limit)
- Firebase RTDB cache with 60s TTL (balances freshness vs rate limit)
- Orchestrator pattern for NetworkCard (consistent with StoveCard/LightsCard)
- Adaptive polling with 30s visible/5min hidden intervals
- RFC 9457 error handling with specific error types
- No new dependencies (Recharts, DataTable, date-fns already installed)

**Phase 61 execution decisions:**
- [Phase 61-01]: Use placeholder API endpoints in FritzBoxClient (actual TR-064 paths TBD in Plan 02)
- [Phase 61-01]: 60s cache TTL balances freshness vs 10 req/min rate limit
- [Phase 61-02]: No rate limiting on health endpoint (lightweight ping, needed before other routes)
- [Phase 61-02]: Spread ApiError details at top level in responses (follows project pattern)

Decisions are also logged in PROJECT.md Key Decisions table.

### Pending Todos

None.

### Blockers/Concerns

**Pitfalls to address during execution:**
1. Rate limit budget exhaustion (10 req/min vs 400 req/hr Netatmo)
2. Self-hosted API connectivity (myfritz.net may timeout when off-network)
3. Large dataset rendering (1440+ bandwidth records for 7-day view)
4. Sequential API waterfall (parallelize with Promise.all)
5. Stale router cache (parse cache_age_seconds from responses)
6. TR-064 configuration verification (setup guide required)

See `.planning/research/PITFALLS-fritzbox.md` for full details.

## Session Continuity

Last session: 2026-02-13
Stopped at: Completed Phase 61 (Foundation & Infrastructure) - 2 plans, 19 files, 5 tasks
Next step: Continue with Phase 62 or later phases per v8.0 roadmap
Resume file: None
