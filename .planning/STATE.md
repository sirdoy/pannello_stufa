---
gsd_state_version: 1.0
milestone: v10.0
milestone_name: Netatmo API Migration
status: executing
stopped_at: Completed 82-fix-thermostat-control-build 82-01-PLAN.md
last_updated: "2026-03-16T10:38:23.455Z"
last_activity: 2026-03-15 — 75-01 Netatmo proxy client + types complete
progress:
  total_phases: 9
  completed_phases: 8
  total_plans: 17
  completed_plans: 17
  percent: 5
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-14)

**Core value:** I dispositivi vengono riconosciuti automaticamente dopo il riavvio del browser e le notifiche arrivano sempre (100% delivery rate per dispositivi registrati).
**Current focus:** Phase 75 — API Client Foundation + Energy Read

## Current Position

Phase: 75 of 79 (API Client Foundation + Energy Read)
Plan: 1 of TBD in current phase
Status: In progress — Plan 01 complete
Last activity: 2026-03-15 — 75-01 Netatmo proxy client + types complete

Progress: [█░░░░░░░░░] 5% (v10.0)

## Performance Metrics

**Velocity:**
- Total plans completed (all milestones): 330
- v9.0 average: ~1.6 plans/phase (8 plans / 5 phases)
- v8.0 average: ~2.6 plans/phase (18 plans / 7 phases)

**By Milestone (recent):**

| Milestone | Phases | Plans | Duration |
|-----------|--------|-------|----------|
| v8.0 Fritz!Box Network Monitor | 61-67 | 18 | 3 days |
| v8.1 Masonry Dashboard | 68-69 | 3 | 1 day |
| v9.0 Performance Optimization | 70-74 | 8 | 2 days |
| Phase 75 P02 | 20 | 2 tasks | 4 files |
| Phase 76 P01 | 3 | 2 tasks | 2 files |
| Phase 76-energy-control-endpoints P04 | 3 | 1 tasks | 3 files |
| Phase 76-energy-control-endpoints P03 | 5 | 2 tasks | 6 files |
| Phase 76 P02 | 347 | 2 tasks | 6 files |
| Phase 77-camera-migration P01 | 213 | 2 tasks | 3 files |
| Phase 77-camera-migration P02 | 10 | 1 tasks | 11 files |
| Phase 77-camera-migration P03 | 367 | 2 tasks | 6 files |
| Phase 78 P01 | 12 | 2 tasks | 6 files |
| Phase 78-valve-health P02 | 12 | 2 tasks | 7 files |
| Phase 79-cleanup P01 | 15 | 3 tasks | 42 files |
| Phase 79-cleanup P02 | 25 | 2 tasks | 17 files |
| Phase 80-fix-env-var-schedule-wiring P01 | 7 | 1 tasks | 6 files |
| Phase 80-fix-env-var-schedule-wiring P02 | 6 | 2 tasks | 7 files |
| Phase 81-fix-stovesync-debug-cleanup P01 | 6 | 2 tasks | 11 files |
| Phase 82 P01 | 175 | 1 tasks | 7 files |

## Accumulated Context

### Decisions

See PROJECT.md Key Decisions table for full history. Relevant to v10.0:
- Pragmatic `as any` for external APIs (no official Netatmo TS types) — continue pattern
- Server-side proxy pattern (same as Fritz!Box) — API key never exposed to client
- Firebase RTDB rate limiter to be deleted in Phase 79 (proxy now owns rate limiting)
- Function module (not class) for netatmoProxy client — no JWT state, simpler and testable (75-01)
- RFC 9457 detail field used as ApiError message; statusText as fallback (75-01)
- 401 -> UNAUTHORIZED, 503 -> SERVICE_UNAVAILABLE, others -> EXTERNAL_API_ERROR (75-01)
- [Phase 75]: homestatus modules sourced from Firebase topology — proxy homestatus lacks module data
- [Phase 75]: homesdata proxy objects pass through with native field names, no re-parsing needed
- [Phase 75]: mode field omitted from homestatus — proxy lacks therm_mode, deferred to Phase 76
- [Phase 76]: Double assertion (as unknown as Record<string, unknown>) used for typed request bodies in netatmoProxyPost wrappers
- [Phase 76]: netatmoProxyPost mirrors netatmoProxyGet: same env var check, AbortController, RFC 9457 parsing, 401/503/other mapping
- [Phase 76-energy-control-endpoints]: Double assertion for RoomMeasureResponse passed to success() — consistent with existing pattern in 76-01
- [Phase 76-energy-control-endpoints]: ProxyControlResponse requires double assertion cast for success() — same pattern as getroommeasure route
- [Phase 76-energy-control-endpoints]: Schedule switch POST moves from /schedules to dedicated /switchhomeschedule route with Firebase userSelectedScheduleId write
- [Phase 76]: home_id sourced from request body not Firebase for setroomthermpoint and setthermmode
- [Phase 76]: VALID_MODES for setroomthermpoint narrowed to manual+home; setthermmode to schedule+away+hg
- [Phase 76]: Failure-only logging: adminDbPush in catch block with error field, no success logging
- [Phase 77-camera-migration]: getProxyCameraEventSnapshot uses raw fetch (binary endpoint): returns Response directly for streaming, not parsed JSON
- [Phase 77-camera-migration]: Camera proxy types use proxy field names (event_id, event_type, timestamp) not old Netatmo API field names
- [Phase 77-camera-migration]: Old [cameraId]/events route deleted — proxy aggregates all events, camera_id filtering is a client concern
- [Phase 77-camera-migration]: [Phase 77-02]: Binary JPEG streamed via NextResponse(response.body) with image/jpeg headers, Cache-Control max-age=3600
- [Phase 77-camera-migration]: [Phase 77-02]: Camera monitoring POST validates camera_id + monitoring ('on'|'off'); failure-only logging via adminDbPush
- [Phase 77-camera-migration]: DataFreshness is a string union ('LIVE'|'STALE'|'UNREACHABLE'), not an object — components use dataFreshness === 'UNREACHABLE' directly
- [Phase 77-camera-migration]: EventPreviewModal now accepts only CameraEvent (camera prop removed) — video playback out of scope per REQUIREMENTS.md
- [Phase 77-camera-migration]: Stream URL fetched on-demand when user clicks Live, not on component mount
- [Phase 78]: Calibration service failure reasons simplified to auth_error|proxy_error — all schedule-switching failure reasons removed
- [Phase 78-valve-health]: Cron health check writes proxy health snapshot to netatmo/proxyHealth on every run; no push notification on degradation per user decision
- [Phase 78-valve-health]: On proxy /health failure: writes unreachable record { provider_status: 'unreachable', data_freshness: 'UNREACHABLE', checked_at }
- [Phase 79-cleanup]: All dead Netatmo OAuth infrastructure deleted — proxy owns token management, rate limiting, caching
- [Phase 79-cleanup]: Coordination orchestrator chain (9 modules) fully removed — proxy handles stove sync coordination
- [Phase 79-cleanup]: Battery utils inlined in homestatus route; stoveSync route constant kept for StoveSyncPanel; coordinationThrottlePersistent dynamic imports removed
- [Phase 80-fix-env-var-schedule-wiring]: NETATMO_PROXY_API_KEY is the canonical env var name — runtime (netatmoProxy.ts) was already correct; validator and docs aligned to match
- [Phase 80-fix-env-var-schedule-wiring]: GET /schedules returns home_id from homes[0].id — avoids second API call in consumers
- [Phase 80-fix-env-var-schedule-wiring]: Schedule switching: POST to /api/netatmo/switchhomeschedule with { home_id, schedule_id } body — ScheduleSelector and ThermostatCard both wired to NETATMO_ROUTES.switchHomeSchedule
- [Phase 81-fix-stovesync-debug-cleanup]: StoveSyncPanel deleted entirely - proxy handles stove sync coordination
- [Phase 81-fix-stovesync-debug-cleanup]: disconnect route deleted - proxy owns auth token management, client-side disconnect meaningless
- [Phase 81-fix-stovesync-debug-cleanup]: debug NetatmoTab connectionStatus now reads from /health provider_status instead of deleted /debug endpoint
- [Phase 82]: homeId passed as optional prop through component trees rather than fetched independently
- [Phase 82]: RoomCard mode:'off' replaced with mode:'home' since API VALID_MODES for setroomthermpoint is only ['manual', 'home']

### Pending Todos

None.

### Blockers/Concerns

- Phase 79 (Cleanup) depends on Phases 76, 77, and 78 all being complete first
- Env var removal (CLEAN-06) must check: `.env`, `.env.example`, `docs/`, GitHub Actions workflows
- Proxy connectivity depends on myfritz.net (same risk as Fritz!Box API)

### Quick Tasks Completed

| # | Description | Date | Commit | Directory |
|---|-------------|------|--------|-----------|
| 31 | Hide debug and design-system pages in production | 2026-02-18 | 991f470 | [31-hide-debug-and-design-system-pages-in-pr](./quick/31-hide-debug-and-design-system-pages-in-pr/) |
| 32 | controlla e pulisci tutta la documentazione inutile | 2026-03-14 | c2940eb | [32-controlla-e-pulisci-tutta-la-documentazi](./quick/32-controlla-e-pulisci-tutta-la-documentazi/) |

## Session Continuity

Last session: 2026-03-16T10:38:23.449Z
Stopped at: Completed 82-fix-thermostat-control-build 82-01-PLAN.md
Resume file: None
