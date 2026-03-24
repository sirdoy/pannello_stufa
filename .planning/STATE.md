---
gsd_state_version: 1.0
milestone: v16.0
milestone_name: Sonos, DIRIGERA & Fritz!Box Avanzato
status: unknown
stopped_at: Completed 129-02-PLAN.md (Sonos /sonos page)
last_updated: "2026-03-24T11:08:14.121Z"
last_activity: 2026-03-24
progress:
  total_phases: 9
  completed_phases: 4
  total_plans: 8
  completed_plans: 8
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-23)

**Core value:** I dispositivi vengono riconosciuti automaticamente dopo il riavvio del browser e le notifiche arrivano sempre (100% delivery rate per dispositivi registrati).
**Current focus:** Phase 129 — sonos-frontend

## Current Position

Phase: 129 (sonos-frontend) — EXECUTING
Plan: 2 of 2

## Performance Metrics

**Velocity:**

- Total plans completed (all milestones): 420
- v15.0 average: 1.6 plans/phase (13 plans / 8 phases)

**By Milestone (recent):**

| Milestone | Phases | Plans | Duration |
|-----------|--------|-------|----------|
| v13.0 Thermorossi Proxy | 99-105 | 11 | 2 days |
| v14.0 Hue Proxy Migration | 106-112 | 12 | 2 days |
| v14.1 Tech Debt & Type Safety | 113-117 | 9 | 1 day |
| v15.0 Rooms & Device Registry | 118-125 | 13 | 2 days |
| Phase 126 P01 | 3 | 2 tasks | 3 files |
| Phase 126 P02 | 851 | 2 tasks | 4 files |
| Phase 127 P01 | 95 | 1 tasks | 2 files |
| Phase 127 P02 | 120 | 2 tasks | 10 files |
| Phase 128 P01 | 6 | 2 tasks | 2 files |
| Phase 128 P02 | 2 | 2 tasks | 9 files |
| Phase 129 P01 | 15 | 2 tasks | 6 files |
| Phase 129 P02 | 266 | 2 tasks | 9 files |

## Accumulated Context

### Decisions

See PROJECT.md Key Decisions table for full history.

Recent decisions affecting v16.0:

- All 5 existing providers use shared haGet/haPost/haPut/haDelete transport — Sonos and DIRIGERA follow same pattern
- DIRIGERA: read-only provider (haGet only) — no control endpoints in scope
- Fritz!Box adds to existing infrastructure (phases 61-67) — new routes extend fritzboxProxy.ts
- Sonos history uses auto-granularity pattern (same as Hue history)
- Fritz!Box telephony (DECT/calls/TAM) excluded by user — not in scope
- [Phase 126]: SonosDataFreshness union excludes UNREACHABLE (triggers 503, never in response body) per D-08
- [Phase 126]: mute in SonosVolumeHistoryItem is number | null (not boolean) per API spec
- [Phase 126]: Array responses (devices, zones) wrapped in named object keys; object responses (health, device detail) use double assertion for success() compatibility
- [Phase 127]: Transport commands (play/pause/stop/next/previous) use haPost with empty body; volume/mute/seek use haPut with typed body
- [Phase 127]: No idempotency wrappers on Sonos command routes (per D-04)
- [Phase 128]: Use actual types/sonosProxy.ts field names (play_mode, dialog_mode) over plan context which had slightly different shapes
- [Phase 128]: Unjoin route uses _request (no body) matching D-13; history route uses no getPathParam (no dynamic segment)
- [Phase 129]: SonosCard: Promise.allSettled for up to 5 zones playback, pick first PLAYING, else first zone
- [Phase 129]: SonosCard follows RaspiCard/useRaspiData pattern exactly for structural consistency
- [Phase 129]: [Phase 129-02]: useSonosFullData exposes fetchData for command hook — enables post-command refresh without prop drilling
- [Phase 129]: [Phase 129-02]: SonosSpeakerVolume uses 250ms debounce with localVolume optimistic state — avoids flooding PUT requests on slider drag
- [Phase 129]: [Phase 129-02]: Promise.allSettled for both playback and volume fetches — individual zone/speaker failures don't break the whole page

### Pending Todos

None.

### Blockers/Concerns

None.

### Quick Tasks Completed

| # | Description | Date | Commit | Directory |
|---|-------------|------|--------|-----------|
| 260322-t5k | Remove analytics/monitoring subsystem + fix build errors | 2026-03-22 | de582d37 | [260322-t5k-rimuovi-la-parte-di-monitoring-analytics](./quick/260322-t5k-rimuovi-la-parte-di-monitoring-analytics/) |

## Session Continuity

Last activity: 2026-03-24
Stopped at: Completed 129-02-PLAN.md (Sonos /sonos page)
Resume file: None
