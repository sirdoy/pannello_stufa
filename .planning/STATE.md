# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-13)

**Core value:** I dispositivi vengono riconosciuti automaticamente dopo il riavvio del browser e le notifiche arrivano sempre (100% delivery rate per dispositivi registrati).

**Current focus:** v8.0 Fritz!Box Network Monitor — Phase 63: WAN Status & Device List

## Current Position

Phase: 63 (WAN Status & Device List)
Plan: 03 (Phase 63 complete - 3 of 3 plans done)
Status: Complete
Last activity: 2026-02-15 — Completed 63-03-PLAN.md (Network Page Orchestrator)

Progress: [████████████████████] 100% (Phase 63 complete, all 3 plans done)

## Performance Metrics

**Velocity:**
- Total plans completed: 306 (phases 1-63 complete)
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
| Phase 63 P01 | 8 | 2 | 5 |
| Phase 63 P02 | 4 | 2 | 4 |
| Phase 63 P03 | 3 | 2 | 2 |

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

**Phase 63 execution decisions:**
- [Phase 63-01]: Plain button element in CopyableIp instead of design system Button to avoid haptic feedback test complexity
- [Phase 63-01]: Configured jest.useFakeTimers with doNotFake: ['nextTick', 'setImmediate'] to allow async clipboard promises
- [Phase 63-01]: Clipboard API made configurable in tests (configurable:true) to work with userEvent's clipboard stub override
- [Phase 63-01]: Uptime formatted as days+hours, hours+minutes, or minutes only based on duration
- [Phase 63-02]: Status filter tabs (All/Online/Offline) added for quick filtering alongside global search
- [Phase 63-02]: Italian locale for date formatting (date-fns/locale/it) with formatDistanceToNow
- [Phase 63-02]: Pre-sorting online devices first, then alphabetical by name (localeCompare 'it')
- [Phase 63-02]: Badge-only design (not dot+text) for device status, consistent with NetworkCard
- [Phase 63-03]: PageLayout.Header with custom children for back button + title (follows project pattern)
- [Phase 63-03]: Loading guard checks loading=true AND empty data (shows skeleton only on initial load, not refresh)
- [Phase 63-03]: Mock component strategy in tests to isolate page orchestration logic

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
Stopped at: Completed Phase 63 Plan 03 (Network Page Orchestrator) - Phase 63 COMPLETE (3 plans, 11 files, 41 tests)
Next step: Phase 64 (Bandwidth Monitoring with real-time charts)
Resume file: None
