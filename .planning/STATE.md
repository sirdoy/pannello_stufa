---
gsd_state_version: 1.0
milestone: v17.0
milestone_name: WebSocket Real-Time Transport
status: executing
stopped_at: Completed 142-01-PLAN.md
last_updated: "2026-03-27T15:10:52.520Z"
last_activity: 2026-03-27
progress:
  total_phases: 6
  completed_phases: 3
  total_plans: 7
  completed_plans: 6
  percent: 0
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-26)

**Core value:** I dispositivi vengono riconosciuti automaticamente dopo il riavvio del browser e le notifiche arrivano sempre (100% delivery rate per dispositivi registrati).
**Current focus:** Phase 142 — sonos-dirigera-migration

## Current Position

Phase: 142 (sonos-dirigera-migration) — EXECUTING
Plan: 2 of 2
Status: Ready to execute
Last activity: 2026-03-27

Progress: [░░░░░░░░░░] 0%

## Performance Metrics

**Velocity:**

- Total plans completed (all milestones): 446
- v16.0 average: 2.0 plans/phase (26 plans / 13 phases)

**By Milestone (recent):**

| Milestone | Phases | Plans | Duration |
|-----------|--------|-------|----------|
| v14.0 Hue Proxy Migration | 106-112 | 12 | 2 days |
| v14.1 Tech Debt & Type Safety | 113-117 | 9 | 1 day |
| v15.0 Rooms & Device Registry | 118-125 | 13 | 2 days |
| v16.0 Sonos, DIRIGERA & Fritz!Box Avanzato | 126-138 | 26 | 4 days |
| Phase 139 P02 | 310 | 2 tasks | 3 files |
| Phase 140 P01 | 3 | 2 tasks | 2 files |
| Phase 141 P02 | 20 | 2 tasks | 2 files |
| Phase 141 P01 | 559 | 2 tasks | 2 files |
| Phase 142 P01 | 15 | 2 tasks | 2 files |

## Accumulated Context

### Decisions

See PROJECT.md Key Decisions table for full history.

Key context for v17.0:

- react-use-websocket is the suggested library (per docs/api/websocket.md spec)
- MAX 2 concurrent WS connections — single shared manager is mandatory
- Raspberry Pi is NOT in the 6 WS topics — stays on polling only
- Netatmo WS payload is raw Record<string, unknown> — Phase 143 needs adapter layer
- alwaysActive on stove polling must survive WS migration (Phase 140 concern)
- Fritz!Box sparkline buffer must survive WS/polling transitions (Phase 141 concern)
- [Phase 139]: renderHook causes strict mode double-invocation — use toHaveBeenCalled() not toHaveBeenCalledTimes(1) for useWebSocket call count assertions
- [Phase 139]: WebSocketContext.Provider placed inside Auth0Provider but outside ThemeProvider — gives all device hooks access to WS manager
- [Phase 140]: alwaysActive:true preserved on polling fallback for safety-critical stove monitoring
- [Phase 140]: Ref pattern used for side-fetch functions to avoid stale closures in WS useEffect
- [Phase 140]: WS handleMessage mirrors HTTP error handling exactly (behavioral parity)
- [Phase 141]: WS useEffect conditionally subscribes only when isWsConnected=true to avoid dead subscriptions
- [Phase 141]: fetchScenesRef ref pattern prevents stale closure in WS handleMessage for scenes fire-and-forget
- [Phase 141]: capability_tier defaults to color for WS-sourced lights — WS payload has no tier field
- [Phase 141]: Conditional WS subscription (if !isWsConnected return) — prevents spurious subscribe calls when CLOSED
- [Phase 141]: Health computation in separate useEffect([bandwidth, wan, downloadHistory, uploadHistory]) — runs on both WS and HTTP data sources
- [Phase 142]: WS groups map to SonosZoneResponse[] via cast (identical shape)
- [Phase 142]: fetchHealthRef/fetchPlaybackRef prevent stale closures in WS useEffect (Phase 141 pattern)

### Pending Todos

None.

### Blockers/Concerns

None.

### Quick Tasks Completed

| # | Description | Date | Commit | Directory |
|---|-------------|------|--------|-----------|
| 260322-t5k | Remove analytics/monitoring subsystem + fix build errors | 2026-03-22 | de582d37 | [260322-t5k-rimuovi-la-parte-di-monitoring-analytics](./quick/260322-t5k-rimuovi-la-parte-di-monitoring-analytics/) |
| 260325-ds8 | Scheduler technical doc for HA proxy team | 2026-03-25 | c746df6b | [260325-ds8-scheduler-technical-doc-for-ha-proxy-tea](./quick/260325-ds8-scheduler-technical-doc-for-ha-proxy-tea/) |

## Session Continuity

Last activity: 2026-03-26
Stopped at: Completed 142-01-PLAN.md
Resume file: None
