# Roadmap: Pannello Stufa

## Milestones

- ✅ **v1.0 Push Notifications** — Phases 1-5 (shipped 2026-01-26)
- ✅ **v2.0 Netatmo Complete Control** — Phases 6-10 (shipped 2026-01-28)
- ✅ **v3.0 Design System Evolution** — Phases 11-18 (shipped 2026-01-30)
- ✅ **v3.1 Design System Compliance** — Phases 19-24 (shipped 2026-02-02)
- ✅ **v3.2 Dashboard & Weather** — Phases 25-29 (shipped 2026-02-03)
- ✅ **v4.0 Advanced UI Components** — Phases 30-36 (shipped 2026-02-05)
- ✅ **v5.0 TypeScript Migration** — Phases 37-43 (shipped 2026-02-08)
- ✅ **v5.1 Tech Debt & Code Quality** — Phases 44-48 (shipped 2026-02-10)
- ✅ **v6.0 Operations, PWA & Analytics** — Phases 49-54 (shipped 2026-02-11)
- ✅ **v7.0 Performance & Resilience** — Phases 55-60 (shipped 2026-02-13)
- ✅ **v8.0 Fritz!Box Network Monitor** — Phases 61-67 (shipped 2026-02-16)
- ✅ **v8.1 Masonry Dashboard** — Phases 68-69 (shipped 2026-02-18)
- ✅ **v9.0 Performance Optimization** — Phases 70-74 (shipped 2026-02-19)
- 🚧 **v10.0 Netatmo API Migration** — Phases 75-79 (in progress)

## Phases

<details>
<summary>✅ v9.0 Performance Optimization (Phases 70-74) — SHIPPED 2026-02-19</summary>

- [x] Phase 70: Measurement Baseline + Quick Wins (2/2 plans)
- [x] Phase 71: React Compiler (1/1 plan)
- [x] Phase 72: Code Splitting (1/1 plan)
- [x] Phase 73: Render Optimization (2/2 plans)
- [x] Phase 74: Suspense Streaming (2/2 plans)

</details>

<details>
<summary>✅ v8.1 Masonry Dashboard (Phases 68-69) — SHIPPED 2026-02-18</summary>

- [x] Phase 68: Core Masonry Layout (1/1 plan)
- [x] Phase 69: Edge Cases, Error Boundary & Tests (2/2 plans)

</details>

<details>
<summary>✅ Earlier milestones (v1.0-v8.0)</summary>

See `.planning/milestones/` for full archives.

</details>

### 🚧 v10.0 Netatmo API Migration (In Progress)

**Milestone Goal:** Replace all direct Netatmo Cloud API calls with local HomeAssistant Network API proxy calls, eliminate OAuth token management from the Next.js app, and clean up all dead code. Authentication becomes a single API Key header.

- [x] **Phase 75: API Client Foundation + Energy Read** - New proxy client with X-API-Key auth, homestatus and homesdata read endpoints migrated (completed 2026-03-15)
- [x] **Phase 76: Energy Control Endpoints** - All write/control endpoints migrated (setpoint, mode, schedule switch, sync, measurements) (completed 2026-03-15)
- [x] **Phase 77: Camera Migration** - All six camera endpoints migrated (status, stream URLs, snapshot, events, monitoring toggle, event snapshots) (completed 2026-03-15)
- [x] **Phase 78: Valve + Health** - Dedicated valve endpoints and health monitoring cron migrated to proxy (completed 2026-03-15)
- [x] **Phase 79: Cleanup** - Dead code deleted (OAuth helpers, rate limiter, cache service, callback route, env vars), tests updated (completed 2026-03-15)
- [x] **Phase 80: Fix Env Var & Schedule Wiring** - Align env var names, wire switchhomeschedule to frontend (completed 2026-03-15)
- [x] **Phase 81: Fix StoveSync & Debug Panel Cleanup** - Remove stoveSync 404, clean debug panel deleted routes (completed 2026-03-15)
- [x] **Phase 82: Fix Thermostat Control + Build Error** - Add home_id to thermostat POST bodies, fix camera route type, remap mode:'off' (completed 2026-03-16)
- [ ] **Phase 83: Camera Monitoring Toggle UI** - Wire camera monitoring route to frontend toggle

## Phase Details

### Phase 75: API Client Foundation + Energy Read
**Goal**: The Netatmo integration communicates with the local proxy instead of api.netatmo.com, with a shared client handling API Key auth and proxy-specific response shapes
**Depends on**: Nothing (first phase of milestone)
**Requirements**: API-01, API-02, API-03, API-04, ENERGY-01, ENERGY-02
**Success Criteria** (what must be TRUE):
  1. Thermostat dashboard card loads room temperatures from the proxy `/homestatus` endpoint without hitting api.netatmo.com
  2. Home topology (rooms, modules) loads from proxy `/homesdata` without Netatmo OAuth tokens
  3. When the proxy reports `data_freshness: STALE`, the app surfaces a staleness indicator to the user
  4. When the proxy returns an RFC 9457 error, the frontend receives and handles it correctly (error boundary or toast)
  5. All Netatmo Next.js routes use a single shared client configured with the proxy base URL and X-API-Key header
**Plans:** 2/2 plans complete
Plans:
- [ ] 75-01-PLAN.md — Proxy client module with X-API-Key auth, types, and RFC 9457 error handling
- [ ] 75-02-PLAN.md — Migrate homestatus and homesdata routes to use proxy client

### Phase 76: Energy Control Endpoints
**Goal**: Users can control the thermostat (set temperature, change mode, switch schedule, sync schedule, view historical measurements) through the proxy
**Depends on**: Phase 75
**Requirements**: ENERGY-03, ENERGY-04, ENERGY-05, ENERGY-06, ENERGY-07
**Success Criteria** (what must be TRUE):
  1. User can adjust room setpoint temperature and the command is sent to proxy `/setroomthermpoint`
  2. User can change thermostat mode (schedule/away/frost guard) via proxy `/setthermmode`
  3. User can switch between pre-configured schedules via proxy `/switchhomeschedule`
  4. Schedule sync via proxy `/synchomeschedule` completes without error
  5. Historical room measurement chart loads data from proxy `/getroommeasure` (SQLite aggregation tiers)
**Plans:** 4/4 plans complete
Plans:
- [ ] 76-01-PLAN.md — Extend proxy client with netatmoProxyPost + 5 convenience wrappers + control types
- [ ] 76-02-PLAN.md — Migrate setroomthermpoint + setthermmode routes to proxy (TDD)
- [ ] 76-03-PLAN.md — Migrate schedules GET, create switchhomeschedule + synchomeschedule + createnewhomeschedule routes (TDD)
- [ ] 76-04-PLAN.md — Create getroommeasure GET route — thin proxy with scale validation (TDD)

### Phase 77: Camera Migration
**Goal**: Users can view camera status, watch live streams, take snapshots, browse events, and toggle monitoring — all served through the proxy
**Depends on**: Phase 75
**Requirements**: CAM-01, CAM-02, CAM-03, CAM-04, CAM-05, CAM-06
**Success Criteria** (what must be TRUE):
  1. Camera status (online/offline, monitoring state) loads from proxy `/camera/status`
  2. Live stream URLs (HLS, VPN + local variants) load from proxy `/camera/{id}/stream` and play in the camera card
  3. User can take a camera snapshot served from proxy `/camera/{id}/snapshot`
  4. Camera events list loads from proxy `/camera/events` (SQLite-backed, 7-day retention)
  5. User can toggle camera monitoring on/off via proxy `/camera/{id}/monitoring`
  6. Event snapshot binary loads from proxy `/camera/events/{id}/snapshot`
**Plans:** 3/3 plans complete
Plans:
- [ ] 77-01-PLAN.md — Camera proxy types + convenience wrappers + tests
- [ ] 77-02-PLAN.md — Create/migrate all 6 camera API routes + update CAMERA_ROUTES
- [ ] 77-03-PLAN.md — Update frontend components + clean up netatmoCameraApi.ts

### Phase 78: Valve + Health
**Goal**: Valve status is read from a dedicated proxy endpoint, valve calibration uses the correct proxy route, and health monitoring cron uses the proxy health endpoint instead of custom token checks
**Depends on**: Phase 75
**Requirements**: VALVE-01, VALVE-02, HEALTH-01, HEALTH-02
**Success Criteria** (what must be TRUE):
  1. Valve status (battery, signal, open percentage) loads from proxy `/valves` without parsing from homestatus
  2. Valve calibration triggers via proxy `/valves/calibrate` (no longer uses synchomeschedule workaround)
  3. Health monitoring dashboard shows Netatmo provider health (token status, data freshness, rate limit usage) from proxy `/health`
  4. Cron health check uses proxy `/health` endpoint; custom token validation code is no longer called
**Plans:** 2/2 plans complete
Plans:
- [ ] 78-01-PLAN.md — Valve types + proxy wrappers + GET route + calibrate rewrite + service rewrite
- [ ] 78-02-PLAN.md — Health types + proxy wrapper + GET route + cron migration + debug tab

### Phase 79: Cleanup
**Goal**: All obsolete Netatmo infrastructure is deleted — OAuth token helper, credentials, rate limiter, cache service, OAuth callback route, and related env vars are gone; tests reflect new proxy patterns
**Depends on**: Phase 76, Phase 77, Phase 78
**Requirements**: CLEAN-01, CLEAN-02, CLEAN-03, CLEAN-04, CLEAN-05, CLEAN-06, CLEAN-07
**Success Criteria** (what must be TRUE):
  1. `lib/netatmoTokenHelper.ts`, `lib/netatmoCredentials.ts`, `lib/netatmoRateLimiter.ts`, `lib/netatmoRateLimiterPersistent.ts`, and `lib/netatmoCacheService.ts` no longer exist in the codebase
  2. `app/api/netatmo/callback/` route no longer exists
  3. `NETATMO_CLIENT_SECRET`, `NEXT_PUBLIC_NETATMO_CLIENT_ID`, and `NEXT_PUBLIC_NETATMO_REDIRECT_URI` env vars are removed from all config files and documentation
  4. All Netatmo-related tests pass using proxy mock patterns (no OAuth token setup in test fixtures)
**Plans:** 2/2 plans complete
Plans:
- [ ] 79-01-PLAN.md — Delete dead modules, routes, UI components, and tests (~45 files)
- [ ] 79-02-PLAN.md — Update live code, env config, docs, and fix affected tests

### Phase 80: Fix Env Var & Schedule Wiring
**Goal**: Env var names are consistent across validator/docs/runtime, and schedule switching works end-to-end from frontend through the proxy switchhomeschedule route
**Depends on**: Phase 79
**Requirements**: API-02, CLEAN-06, ENERGY-05
**Gap Closure:** Closes gaps from audit
**Success Criteria** (what must be TRUE):
  1. `envValidator.ts` and `.env.example` reference `NETATMO_PROXY_API_KEY` (matching `netatmoProxy.ts`)
  2. `NETATMO_ROUTES` includes a `switchhomeschedule` key pointing to the correct route
  3. `ThermostatCard.tsx` and `ScheduleSelector.tsx` call `/api/netatmo/switchhomeschedule` with `{ home_id, schedule_id }` body
  4. "Switch Heating Schedule" E2E flow completes without errors
**Plans:** 2/2 plans complete
Plans:
- [ ] 80-01-PLAN.md — Align env var name NETATMO_API_KEY to NETATMO_PROXY_API_KEY across validator, docs, config
- [ ] 80-02-PLAN.md — Wire switchhomeschedule route to frontend (NETATMO_ROUTES, ScheduleSelector, ThermostatCard)

### Phase 81: Fix StoveSync & Debug Panel Cleanup
**Goal**: StoveSyncPanel no longer calls a deleted route, debug panel Netatmo tab no longer references deleted endpoints, and stale JSDoc is cleaned up
**Depends on**: Phase 80
**Requirements**: CLEAN-02
**Gap Closure:** Closes gaps from audit
**Success Criteria** (what must be TRUE):
  1. `NETATMO_ROUTES.stoveSync` is removed or points to a valid endpoint (StoveSyncPanel gracefully handles absence)
  2. Both `NetatmoTab` variants (debug/api and debug) no longer call `/api/netatmo/devices`, `/devices-temperatures`, or `/debug`
  3. `coordinationNotificationThrottle.ts` JSDoc no longer references `USE_PERSISTENT_RATE_LIMITER`
  4. Debug panel Netatmo tab loads without 404 errors
**Plans:** 1/1 plans complete
Plans:
- [ ] 81-01-PLAN.md — Delete StoveSyncPanel + disconnect route, clean debug NetatmoTab endpoints, fix stale JSDoc

### Phase 82: Fix Thermostat Control + Build Error
**Goal**: All thermostat control actions (set temperature, change mode) work end-to-end through the proxy, and production build passes without type errors
**Depends on**: Phase 81
**Requirements**: ENERGY-03, ENERGY-04
**Gap Closure:** Closes gaps from audit
**Success Criteria** (what must be TRUE):
  1. `npm run build` completes without type errors (camera event snapshot route typed correctly)
  2. All `setroomthermpoint` callers (RoomCard, ThermostatCard, ManualOverrideSheet, ActiveOverrideBadge) include `home_id` in POST body
  3. All `setthermmode` callers (ThermostatCard, thermostat/page.tsx) include `home_id` in POST body
  4. RoomCard "off" action sends `mode: 'home'` instead of `mode: 'off'` (matching VALID_MODES)
  5. "Set room temperature" and "Set thermostat mode" E2E flows complete without 400 errors
**Plans:** 1/1 plans complete
Plans:
- [ ] 82-01-PLAN.md — Fix camera snapshot route type, add home_id to all thermostat POST callers, remap mode:'off' to 'home'

### Phase 83: Camera Monitoring Toggle UI
**Goal**: Users can toggle camera monitoring on/off from the camera UI, completing the CAM-05 E2E flow
**Depends on**: Phase 82
**Requirements**: CAM-05
**Gap Closure:** Closes gaps from audit
**Success Criteria** (what must be TRUE):
  1. Camera UI component includes a monitoring toggle button/switch
  2. Toggle calls `/api/netatmo/camera/{id}/monitoring` with correct POST body
  3. "Camera monitoring toggle" E2E flow completes without errors

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1-5 | v1.0 | 29/29 | ✓ Complete | 2026-01-26 |
| 6-10 | v2.0 | 21/21 | ✓ Complete | 2026-01-28 |
| 11-18 | v3.0 | 52/52 | ✓ Complete | 2026-01-30 |
| 19-24 | v3.1 | 13/13 | ✓ Complete | 2026-02-02 |
| 25-29 | v3.2 | 13/13 | ✓ Complete | 2026-02-03 |
| 30-36 | v4.0 | 24/24 | ✓ Complete | 2026-02-05 |
| 37-43 | v5.0 | 56/56 | ✓ Complete | 2026-02-08 |
| 44-48 | v5.1 | 39/39 | ✓ Complete | 2026-02-10 |
| 49-54 | v6.0 | 29/29 | ✓ Complete | 2026-02-11 |
| 55-60 | v7.0 | 22/22 | ✓ Complete | 2026-02-13 |
| 61-67 | v8.0 | 18/18 | ✓ Complete | 2026-02-16 |
| 68-69 | v8.1 | 3/3 | ✓ Complete | 2026-02-18 |
| 70-74 | v9.0 | 8/8 | ✓ Complete | 2026-02-19 |
| 75. API Client Foundation + Energy Read | 2/2 | Complete    | 2026-03-15 | - |
| 76. Energy Control Endpoints | 4/4 | Complete    | 2026-03-15 | - |
| 77. Camera Migration | 3/3 | Complete    | 2026-03-15 | - |
| 78. Valve + Health | 2/2 | Complete    | 2026-03-15 | - |
| 79. Cleanup | 2/2 | Complete    | 2026-03-15 | - |
| 80. Fix Env Var & Schedule Wiring | 2/2 | Complete    | 2026-03-15 | - |
| 81. Fix StoveSync & Debug Panel Cleanup | 1/1 | Complete    | 2026-03-15 | - |
| 82. Fix Thermostat Control + Build Error | 1/1 | Complete   | 2026-03-16 | - |
| 83. Camera Monitoring Toggle UI | 0/0 | Not Started | - | - |

**Total:** 13 milestones shipped, 74 phases complete, 330 plans executed — v10.0 in progress

---

*Roadmap updated: 2026-03-16 — Phase 82 plan created*
