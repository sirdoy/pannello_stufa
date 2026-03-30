---
gsd_state_version: 1.0
milestone: v17.1
milestone_name: WebSocket Alignment & Tuya Integration
status: executing
stopped_at: Completed 147-01-PLAN.md
last_updated: "2026-03-30T08:33:09.922Z"
last_activity: 2026-03-30
progress:
  total_phases: 4
  completed_phases: 2
  total_plans: 7
  completed_plans: 6
  percent: 0
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-28)

**Core value:** I dispositivi vengono riconosciuti automaticamente dopo il riavvio del browser e le notifiche arrivano sempre (100% delivery rate per dispositivi registrati).
**Current focus:** Phase 147 — tuya-infrastructure

## Current Position

Phase: 147 (tuya-infrastructure) — EXECUTING
Plan: 2 of 2
Status: Ready to execute
Last activity: 2026-03-30

Progress: [░░░░░░░░░░] 0%

## Performance Metrics

**Velocity:**

- Total plans completed (all milestones): 457
- v17.0 average: 1.8 plans/phase (11 plans / 6 phases)

**By Milestone (recent):**

| Milestone | Phases | Plans | Duration |
|-----------|--------|-------|----------|
| v15.0 Rooms & Device Registry | 118-125 | 13 | 2 days |
| v16.0 Sonos, DIRIGERA & Fritz!Box Avanzato | 126-138 | 26 | 4 days |
| v17.0 WebSocket Real-Time Transport | 139-144 | 11 | 3 days |
| Phase 145 P02 | 5 | 2 tasks | 2 files |
| Phase 145 P01 | 76 | 2 tasks | 3 files |
| Phase 145-ws-type-alignment P03 | 8 | 1 tasks | 2 files |
| Phase 146 P01 | 7 | 2 tasks | 2 files |
| Phase 146 P02 | 5 minutes | 2 tasks | 2 files |
| Phase 147-tuya-infrastructure P01 | 2min | 1 tasks | 2 files |

## Accumulated Context

### Decisions

See PROJECT.md Key Decisions table for full history.

Key context for v17.1:

- [Phase 144]: useStoveData derives lastUpdatedAt from existing lastPollAt (Date->ms); useNetworkData aliases lastUpdated as lastUpdatedAt for backward compat
- [Phase 143]: adaptNetatmoWsPayload is standalone pure function; WS handleMessage does not call staleness.update()
- [Phase 141]: Conditional WS subscription guard (if !isWsConnected return) — prevents spurious subscribe when CLOSED
- [Phase 141]: capability_tier defaults to color for WS-sourced lights (no tier field in WS payload)
- v17.1 context: WSTYPE-* changes are the foundation — phases 146-148 depend on TopicDataMap having raspi+tuya entries
- v17.1 context: UX-03 == RASPI-03 (same requirement, counted once in Phase 146)
- v17.1 context: Tuya infrastructure (Phase 147) can be planned in parallel with Raspi migration (Phase 146) — no dependency between them
- [Phase 145]: Add fields to base interfaces only — SonosDeviceDetailResponse, ContactSensor, MotionSensor inherit automatically
- [Phase 145]: custom_name on DirigeraSensor kept as string (non-nullable) to avoid breaking existing consumers
- [Phase 145]: TuyaPlugMutation extends TuyaPlug (inheritance) to avoid field duplication
- [Phase 145]: custom_name and device_type added as optional fields to HueLight and ThermorossiStatusResponse to avoid breaking existing consumers
- [Phase 145]: HueData.lights stays HueLight[] | null array (D-01 locked) — useLightsData iterates as array
- [Phase 145]: NetatmoData promoted from type alias to interface with index signature for backward compat
- [Phase 145]: Inline freshness unions where proxy type width differs from WS envelope width
- [Phase 146]: Inline WS payload mapping in handleMessage for Raspi (no standalone adapter) — health computed inline via computeRaspiHealth
- [Phase 146]: LastUpdated placed outside data conditional in RaspiCard — renders when tsMs is set regardless of data state, handles null gracefully
- [Phase 147-01]: setState/setTimer return TuyaPlugMutation (200 pass-through) not 202 Accepted — Tuya proxy confirms command synchronously
- [Phase 147-01]: getHistory: Object.entries filter approach to omit undefined params before URLSearchParams construction

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

## Session Continuity

Last activity: 2026-03-28
Stopped at: Completed 147-01-PLAN.md
Resume file: None
