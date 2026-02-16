# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-13)

**Core value:** I dispositivi vengono riconosciuti automaticamente dopo il riavvio del browser e le notifiche arrivano sempre (100% delivery rate per dispositivi registrati).

**Current focus:** v8.0 Fritz!Box Network Monitor — Phase 65: Device History Timeline

## Current Position

Phase: 65 (Device History Timeline)
Plan: 02 (Phase 65 in progress - 2 of 3 plans done)
Status: In Progress
Last activity: 2026-02-16 — Completed 65-02-PLAN.md (Device Event API Integration)

Progress: [█████████████░░░░░░░] 69% (Phase 65 plan 2/3 complete)

## Performance Metrics

**Velocity:**
- Total plans completed: 310 (phases 1-64 complete, phase 65 in progress - 2 of 3 plans done)
- Average duration: ~8 min (recent trend)
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
| Phase 64 P01 | 4 | 2 | 5 |
| Phase 64 P02 | 5 | 2 | 6 |
| Phase 65 P01 | 7 | 2 | 4 |
| Phase 65 P02 | 10 | 2 | 4 |

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

**Phase 64 execution decisions:**
- [Phase 64-01]: Default to 24h time range per research recommendation (balance detail vs context)
- [Phase 64-01]: Decimate using download Mbps as selection criterion (primary user metric)
- [Phase 64-01]: Hook is passive accumulator — page orchestrator feeds data to avoid duplicate polling
- [Phase 64-01]: Buffer caps at 10080 points (7-day max, 1-minute intervals)
- [Phase 64-01]: Decimation applied only when filtered data exceeds 500 points
- [Phase 64-02]: X-axis formatter switches based on time range (HH:mm for 1h/24h, dd/MM for 7d)
- [Phase 64-02]: Download line emerald-400, upload line teal-400 for visual distinction
- [Phase 64-02]: TimeRangeSelector hidden in empty state (no data to filter yet)
- [Phase 64-02]: Collecting state shows chart with progress overlay when <10 points
- [Phase 64-02]: isAnimationActive=false and dot=false for Recharts Line performance optimization

**Phase 65 execution decisions:**
- [Phase 65-01]: Date-keyed Firebase paths for efficient range queries: {YYYY-MM-DD}/{timestamp}_{mac}_{eventType}
- [Phase 65-01]: MAC address colon-to-dash replacement for Firebase key compatibility (`:` not allowed in keys)
- [Phase 65-01]: Parallel date node queries with Promise.all for multi-day ranges (3x faster than sequential)
- [Phase 65-01]: Map-based API for device state tracking (better iteration and immutability vs plain object)
- [Phase 65-01]: date-fns eachDayOfInterval for date range generation (avoid hand-rolled date math bugs)
- [Phase 65-02]: Event detection as fire-and-forget side-effect (never breaks device list response)
- [Phase 65-02]: Try/catch wrapper around event detection to isolate failures
- [Phase 65-02]: Time range helper function with switch for 1h/24h/7d calculations
- [Phase 65-02]: Client-side device filtering (after Firebase query) for simplicity
- [Phase 65-02]: Invalid range parameter defaults to 24h (safe fallback)
- [Phase 65-03]: TimeRangeSelector reused via type casting (BandwidthTimeRange and DeviceHistoryTimeRange have identical values)
- [Phase 65-03]: Device filter dropdown uses Radix Select with "Tutti i dispositivi" as null filter option
- [Phase 65-03]: Date grouping uses format(timestamp, 'yyyy-MM-dd') as key for stable grouping
- [Phase 65-03]: Italian locale headers formatted as 'EEEE, d MMMM yyyy' (e.g., "giovedì, 15 febbraio 2024")
- [Phase 65-03]: DeviceEventItem shows relative time (formatDistanceToNow) alongside absolute time (HH:mm:ss)
- [Phase 65-03]: Timeline sorted newest date first, events within date sorted newest first

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

Last session: 2026-02-16
Stopped at: Completed Phase 65 Plan 01 (Device Event Logger Foundation) - Date-keyed Firebase event storage with TDD coverage (2 tasks, 4 files, 15 tests)
Next step: Continue Phase 65 execution (2 plans remaining: API endpoint, timeline UI)
Resume file: None

**Phase 65-03 UI decisions:**
- TimeRangeSelector reused via type casting (BandwidthTimeRange and DeviceHistoryTimeRange have identical values)
- Device filter dropdown uses Radix Select with "Tutti i dispositivi" as null filter option
- Date grouping uses format(timestamp, 'yyyy-MM-dd') as key for stable grouping
- Italian locale headers formatted as 'EEEE, d MMMM yyyy' (e.g., "giovedì, 15 febbraio 2024")
- DeviceEventItem shows relative time (formatDistanceToNow) alongside absolute time (HH:mm:ss)
- Timeline sorted newest date first, events within date sorted newest first
