---
gsd_state_version: 1.0
milestone: v17.0
milestone_name: WebSocket Real-Time Transport
status: verifying
stopped_at: Completed 144-02-PLAN.md
last_updated: "2026-03-28T10:18:57.710Z"
last_activity: 2026-03-28
progress:
  total_phases: 6
  completed_phases: 6
  total_plans: 11
  completed_plans: 11
  percent: 50
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-26)

**Core value:** I dispositivi vengono riconosciuti automaticamente dopo il riavvio del browser e le notifiche arrivano sempre (100% delivery rate per dispositivi registrati).
**Current focus:** Phase 143 — netatmo-migration

## Current Position

Phase: 144 (connection-ux) — EXECUTING
Plan: 2 of 2
Status: Phase complete — ready for verification
Last activity: 2026-03-28

Progress: [█████░░░░░] 50%

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
| Phase 142-sonos-dirigera-migration P02 | 18 | 2 tasks | 4 files |
| Phase 143 P01 | 5 | 2 tasks | 3 files |
| Phase 143 P02 | 8m | 2 tasks | 4 files |
| Phase 144 P01 | 33m | 2 tasks | 7 files |
| Phase 144-connection-ux P02 | 22 | 2 tasks | 14 files |

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
- [Phase 142]: In-hook summary derivation for DIRIGERA: when WS active, SensorSummaryResponse computed from raw sensors array eliminating HTTP summary call
- [Phase 142]: computeDirigeraHealth exported (was private) to enable direct unit testing
- [Phase 143]: useThermostatData exposes StalenessInfo | null (not stale/update/lastUpdate) to match actual useDeviceStaleness API
- [Phase 143]: ThermostatCard uses commandError local state for mutation errors; dataError from hook is read-only (pattern: error = dataError ?? commandError)
- [Phase 143]: page.tsx derives mode from status?.mode (hook provides status; setMode eliminated)
- [Phase 143]: adaptNetatmoWsPayload is standalone pure function for independent testability
- [Phase 143]: WS handleMessage does not call staleness.update() — StalenessInfo has no update method
- [Phase 144-01]: mapReadyState exported as named function for direct unit testing; WS_STATUS_LABELS indexed by WsStatus union (not ReadyState) for cleaner rendering
- [Phase 144-01]: LastUpdated test mocks useRelativeTime to isolate component from hook timer behavior
- [Phase 144-connection-ux]: useStoveData derives lastUpdatedAt from existing lastPollAt (Date->ms) rather than adding new state
- [Phase 144-connection-ux]: useNetworkData aliases lastUpdated as lastUpdatedAt for backward compat (both fields preserved)
- [Phase 144-connection-ux]: NetworkCard test mock updated to include lastUpdatedAt:null default to match updated UseNetworkDataReturn type

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
Stopped at: Completed 144-02-PLAN.md
Resume file: None
