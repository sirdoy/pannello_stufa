---
gsd_state_version: 1.0
milestone: v16.0
milestone_name: Sonos, DIRIGERA & Fritz!Box Avanzato
status: v16.0 milestone complete
stopped_at: Completed 138-02-PLAN.md
last_updated: "2026-03-26T09:28:35.710Z"
last_activity: 2026-03-26
progress:
  total_phases: 13
  completed_phases: 13
  total_plans: 26
  completed_plans: 26
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-26)

**Core value:** I dispositivi vengono riconosciuti automaticamente dopo il riavvio del browser e le notifiche arrivano sempre (100% delivery rate per dispositivi registrati).
**Current focus:** Planning next milestone

## Current Position

Phase: N/A (milestone complete)
Plan: N/A

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
| Phase 130 P01 | 3 | 2 tasks | 3 files |
| Phase 130 P02 | 2 | 2 tasks | 5 files |
| Phase 131 P01 | 260 | 2 tasks | 7 files |
| Phase 131 P02 | 15 | 2 tasks | 5 files |
| Phase 132 P01 | 8 | 2 tasks | 5 files |
| Phase 132 P02 | 5 | 2 tasks | 4 files |
| Phase 133 P01 | 15 | 2 tasks | 7 files |
| Phase 133 P02 | 8 | 2 tasks | 5 files |
| Phase 134 P01 | 452 | 2 tasks | 15 files |
| Phase 134 P02 | 600 | 2 tasks | 4 files |
| Phase 135 P01 | 8 | 2 tasks | 6 files |
| Phase 135 P02 | 12 | 2 tasks | 8 files |
| Phase 136 P01 | 7 | 2 tasks | 15 files |
| Phase 136 P02 | 5m | 2 tasks | 4 files |
| Phase 137 P01 | 4 | 2 tasks | 8 files |
| Phase 137 P02 | 4 | 2 tasks | 10 files |
| Phase 138 P02 | 10 | 2 tasks | 4 files |
| Phase 138 P02 | 10 | 2 tasks | 4 files |

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
- [Phase 130]: DIRIGERA is read-only haGet-only proxy per D-02; types/dirigeraProxy.ts defines all current + future-phase interfaces upfront per D-05; DirigeraDataFreshness is 3-state LIVE/STALE/UNREACHABLE per D-08
- [Phase 130]: Object responses (health, summary) use double assertion; array responses (sensors, contact, motion) spread fields into success()
- [Phase 131]: DirigeraCard uses ocean colorTheme (not info) matching plan research correction D-02
- [Phase 131]: DIRIGERA health: error if offline_count > 0, warning if low_battery_count > 0
- [Phase 131]: SensorFilter reset on change uses useEffect to clear data/loading/dataRef for immediate refetch on filter switch
- [Phase 131]: showFreshness = filter \!== 'all' — data_freshness field only present on ContactSensor/MotionSensor, not base DirigeraSensor
- [Phase 132]: 7 new fritzboxClient methods are raw haGet pass-through (no transformation) per plan D-01 through D-07
- [Phase 132]: DHCP and port-forwarding routes are paginated (forward limit/offset to proxy client)
- [Phase 132]: UPnP and mesh routes are flat-object pass-through (no query params, no pagination)
- [Phase 133]: Auto-mock workaround: guard new fritzboxClient methods with if(!mockFritzboxClient.getBandwidthXxx) before jest.fn() assignment — needed when tests run before main repo merge
- [Phase 133]: devices/daily uses paginated pattern (days/limit/offset forwarding); budget-stats uses flat-object pattern (_request, no query params)
- [Phase 134]: formatUptime extracted from WanStatusCard to shared app/network/utils/ for reuse
- [Phase 134]: useFritzNetworkServices: stale=true on partial failure while still displaying successful data
- [Phase 134]: BandwidthChart tier props are all optional with defaults — fully backward-compatible
- [Phase 134]: Tab navigation uses native button elements with cn + ember-400 border-b-2 active styling
- [Phase 135]: useSonosFullData: playModes and sleepTimers fetched in single Promise.all wrapping two Promise.allSettled batches
- [Phase 135]: useSonosQueue: QUEUE_PAGE_SIZE=20, fetchPage abstraction handles both reset (fetchInitial) and append (loadMore)
- [Phase 135]: useSonosCommands tests: cycling callCount % 3 mock pattern to survive React re-renders calling hooks multiple times
- [Phase 135]: SonosQueueViewer: expand state local to component, fetchInitial on first expand (not in polling)
- [Phase 135]: SonosZoneSection layout: NowPlaying > Transport > PlayMode+SleepTimer row > QueueViewer > Volume
- [Phase 136]: SonosVolumeChart extracted as separate file for next/dynamic import path stability
- [Phase 136]: useSonosHistory fetchHistory uses useCallback with all filter deps for clean useEffect dependency tracking
- [Phase 136]: SonosSourceSwitch and SonosGroupControls rendered below volume row (not inline) to preserve flex layout integrity with range slider
- [Phase 136]: speakers prop for SonosHistoryChart uses Set dedup via flatMap over zone members to handle edge case of members in multiple zones
- [Phase 137]: useFritzBudgetStats uses useEffect([],[]) not polling — budget stats are informational snapshots per D-10
- [Phase 137]: auto tier uses record.timestamp (unified field) not hour_timestamp/day_timestamp — per AggregatedRecord type
- [Phase 137]: WifiNetworksTable empty state returns Card with Text (not null) — consistent with tab content area
- [Phase 137]: BudgetStatsCard returns null when no data — avoids empty card placeholder in layout
- [Phase 137]: DeviceCountChart uses next/dynamic (ssr:false) — Recharts is heavy and chart-only component
- [Phase 138]: SonosSeekControl uses isDragging ref to prevent position sync during drag
- [Phase 138]: Zone volume defaults to coordinator volume with 250ms debounce — matches SonosSpeakerVolume pattern
- [Phase 138]: SonosSeekControl uses isDragging ref to prevent position sync during drag
- [Phase 138]: Zone volume defaults to coordinator volume with 250ms debounce — matches SonosSpeakerVolume pattern

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
Stopped at: Completed 138-02-PLAN.md
Resume file: None
