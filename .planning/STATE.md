---
gsd_state_version: 1.0
milestone: v11.0
milestone_name: API Unification & Raspberry Pi Monitor
status: planning
stopped_at: Completed 90-01-PLAN.md
last_updated: "2026-03-18T07:45:53.851Z"
last_activity: 2026-03-17 — Phase 86 complete (3/3 plans, 7/7 verification)
progress:
  total_phases: 7
  completed_phases: 7
  total_plans: 12
  completed_plans: 12
  percent: 43
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-17)

**Core value:** I dispositivi vengono riconosciuti automaticamente dopo il riavvio del browser e le notifiche arrivano sempre (100% delivery rate per dispositivi registrati).
**Current focus:** v11.0 API Unification & Raspberry Pi Monitor — Phase 87 ready to plan

## Current Position

Phase: 87 of 90 (Client Cleanup)
Plan: — (not started)
Status: Ready to plan
Last activity: 2026-03-17 — Phase 86 complete (3/3 plans, 7/7 verification)

Progress: [████░░░░░░] 43% (3/7 phases)

## Performance Metrics

**Velocity:**
- Total plans completed (all milestones): 353
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
| Phase 86 P01 | 8 | 2 tasks | 2 files |
| Phase 86 P02 | 320 | 3 tasks | 5 files |
| Phase 87 P02 | 4 | 2 tasks | 4 files |
| Phase 87-client-cleanup P01 | 4 | 1 tasks | 2 files |
| Phase 88 P01 | 400 | 2 tasks | 14 files |
| Phase 89 P01 | 7 | 2 tasks | 5 files |
| Phase 89 P02 | 17 minutes | 2 tasks | 4 files |
| Phase 90 P02 | 4 minutes | 1 tasks | 2 files |
| Phase 90 P01 | 4 | 2 tasks | 10 files |

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
- [Phase 86]: netatmoProxyGet/netatmoProxyPost deleted — haGet/haPost from haClient.ts are the shared transport
- [Phase 86]: netatmoProxyGet describe block renamed to test transport via getProxyHomestatus wrapper
- [Phase 86]: validateNetatmoEnv simplified — removed unreachable warnings array, returns directly
- [Phase 86]: getroommeasure RoomMeasureResponse type import removed — handled by getProxyRoomMeasure wrapper
- [Phase 86]: getroommeasure RoomMeasureResponse type import kept — mockProxyResponse fixture still typed explicitly
- [Phase 87]: Docs-only env var replacements: NETATMO_PROXY_URL/NETATMO_PROXY_API_KEY → HA_API_URL/HA_API_KEY in four files
- [Phase 87-01]: Removed invalidateCache, CACHE_TTL_MS, FRITZBOX_RATE_LIMIT, FRITZBOX_ERROR_CODES from fritzbox barrel — only live route-consumed exports remain
- [Phase 87-01]: FRITZBOX_ERROR_CODES unexported in fritzboxErrors.ts — no route files consume it; fritzboxErrors.ts file kept per plan constraint
- [Phase 88]: Type assertion (as unknown as Record<string,unknown>) for success() calls in raspi routes — follows established codebase pattern
- [Phase 89]: initialDelay: 600ms for raspi hook (stagger offset from NetworkCard's 500ms), alwaysActive: false (non-safety-critical)
- [Phase 89]: Health thresholds: disk>90/mem>95=error, cpu>80/mem>80/disk>75/temp>70=warning, else ok
- [Phase 89]: colorTheme=sage for RaspiCard — consistent with NetworkCard infrastructure theme
- [Phase 89]: RaspiStats is purely presentational — no useState/useEffect, receives data prop only
- [Phase 90]: raspiStatus is informational — Pi failure uses console.warn (not error/notification), isolated try/catch preserves stove/thermostat checks
- [Phase 90]: useRaspiFullData fetches all 4 endpoints in parallel — same pattern as useRaspiData but exposes all 16 fields for detail page
- [Phase 90]: RaspiCard navigation wraps only data-present state — loading/error states not clickable, matches NetworkCard pattern

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

Last session: 2026-03-18T07:42:27.717Z
Stopped at: Completed 90-01-PLAN.md
Resume file: None
