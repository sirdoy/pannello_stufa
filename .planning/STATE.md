# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-13)

**Core value:** I dispositivi vengono riconosciuti automaticamente dopo il riavvio del browser e le notifiche arrivano sempre (100% delivery rate per dispositivi registrati).

**Current focus:** v8.0 Fritz!Box Network Monitor — Phase 62: Dashboard Card

## Current Position

Phase: 62 (Dashboard Card)
Plan: 02 (Phase 62 Plan 02 complete - 2 of 3 plans done)
Status: In progress
Last activity: 2026-02-15 — Completed 62-02-PLAN.md (NetworkCard UI Component)

Progress: [████░░░░░░░░░░░░░░░░] 24% (Phase 62 Plan 02 complete, 2 of 3 plans done)

## Performance Metrics

**Velocity:**
- Total plans completed: 301 (phases 1-61 complete, phase 62 in progress)
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

**v8.0 Execution:**
| Plan | Duration (min) | Tasks | Files |
|------|----------------|-------|-------|
| Phase 61 P01 | 7 | 3 | 11 |
| Phase 61 P02 | 5 | 2 | 8 |
| Phase 62 P01 | 13 | 2 | 6 |
| Phase 62 P02 | 6 | 2 | 7 |

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

**Phase 62 execution decisions:**
- [Phase 62-01]: Health algorithm uses >= for uptime thresholds (not >) to include boundary cases
- [Phase 62-01]: Sparkline buffer capped at 12 points (6 minutes at 30s interval) via .slice(-12)
- [Phase 62-01]: API errors preserve cached data and set stale flag (never clear state)
- [Phase 62-01]: Hysteresis requires 2 consecutive readings to prevent status flapping
- [Phase 62-02]: Unique SVG gradient IDs using React useId() to prevent conflicts
- [Phase 62-02]: Recharts sparklines with isAnimationActive=false for performance
- [Phase 62-02]: Uptime formatter shows days+hours, hours+minutes, or minutes only
- [Phase 62-02]: Setup banner shown inside card when Fritz!Box TR-064 not enabled

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

Last session: 2026-02-15
Stopped at: Completed Phase 62 Plan 02 (NetworkCard UI Component) - 2 tasks, 7 files, 13 tests (40 total network tests)
Next step: Continue with Phase 62 Plan 03 (if exists) or Phase 63 (Network Detail Page)
Resume file: None
