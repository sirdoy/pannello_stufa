---
gsd_state_version: 1.0
milestone: v17.1
milestone_name: WebSocket Alignment & Tuya Integration
status: active
stopped_at: null
last_updated: "2026-03-28T14:00:00.000Z"
last_activity: 2026-03-28
progress:
  total_phases: 4
  completed_phases: 0
  total_plans: 0
  completed_plans: 0
  percent: 0
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-28)

**Core value:** I dispositivi vengono riconosciuti automaticamente dopo il riavvio del browser e le notifiche arrivano sempre (100% delivery rate per dispositivi registrati).
**Current focus:** Phase 145 — WS Type Alignment

## Current Position

Phase: 145 of 148 (WS Type Alignment)
Plan: —
Status: Ready to plan
Last activity: 2026-03-28 — Roadmap created for v17.1

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
Stopped at: v17.1 roadmap created — ready to plan Phase 145
Resume file: None
