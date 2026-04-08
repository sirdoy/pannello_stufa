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
- ✅ **v10.0 Netatmo API Migration** — Phases 75-83 (shipped 2026-03-16)
- ✅ **v11.0 API Unification & Raspberry Pi Monitor** — Phases 84-91 (shipped 2026-03-18)
- ✅ **v11.1 Test Suite & Tech Debt Cleanup** — Phases 92-95 (shipped 2026-03-18)
- ✅ **v12.0 Data Fetching Simplification & E2E Verification** — Phases 96-98 (shipped 2026-03-19)
- ✅ **v13.0 Thermorossi Proxy Migration** — Phases 99-105 (shipped 2026-03-20)
- ✅ **v14.0 Hue Proxy Migration** — Phases 106-112 (shipped 2026-03-22)
- ✅ **v14.1 Tech Debt & Type Safety** — Phases 113-117 (shipped 2026-03-22)
- ✅ **v15.0 Rooms & Device Registry** — Phases 118-125 (shipped 2026-03-23)
- ✅ **v16.0 Sonos, DIRIGERA & Fritz!Box Avanzato** — Phases 126-138 (shipped 2026-03-26)
- ✅ **v17.0 WebSocket Real-Time Transport** — Phases 139-144 (shipped 2026-03-28)
- ✅ **v17.1 WebSocket Alignment & Tuya Integration** — Phases 145-148 (shipped 2026-03-30)
- ✅ **v18.0 Dark-Only & Mobile-First** — Phases 149-155 (shipped 2026-04-02)
- **v19.0 API Alignment & Full Coverage** — Phases 156-163 (in progress)

## Phases

### v19.0 API Alignment & Full Coverage (In Progress)

- [ ] **Phase 156: Path Migration & Common Endpoints** - Thermorossi path rename + cross-provider health and device list
- [ ] **Phase 157: Auth Module** - JWT login and API key CRUD via HA proxy auth endpoints
- [ ] **Phase 158: Automations Module** - Automation rules CRUD and execution history
- [ ] **Phase 159: Hue Gap Closure** - Missing Hue endpoints (health, single light, groups, scenes)
- [ ] **Phase 160: Sonos Gap Closure** - Zone-level playback, transport, queue, play-mode, sleep timer
- [ ] **Phase 161: Netatmo Gap Closure** - Thermostat state, valve calibration, camera advanced, home management
- [ ] **Phase 162: Fritz!Box Gap Closure** - Telephony, raw history, service discovery endpoints
- [ ] **Phase 163: DIRIGERA Gap Closure** - History, stats, telemetry endpoints

## Phase Details

### Phase 156: Path Migration & Common Endpoints
**Goal**: All thermorossi routes use the canonical /api/v1/thermorossi/* path and cross-provider aggregate endpoints exist
**Depends on**: Nothing (foundation for this milestone)
**Requirements**: PATH-01, PATH-02, COMMON-01, COMMON-02
**Success Criteria** (what must be TRUE):
  1. Every API call to /api/stove/* returns 404 or redirect; /api/v1/thermorossi/* serves the same data
  2. Frontend hooks, components, and debug panels call /api/v1/thermorossi/* with no references to old /api/stove/ paths
  3. GET /health returns an aggregated status object covering all registered providers
  4. GET /api/v1/devices returns a unified device list combining all providers
**Plans:** 2 plans
Plans:
- [x] 156-01-PLAN.md — Create thermorossi routes + aggregate endpoints
- [x] 156-02-PLAN.md — Update frontend references + tests

### Phase 157: Auth Module
**Goal**: Users can authenticate via JWT and manage API keys through the HA proxy auth endpoints
**Depends on**: Phase 156
**Requirements**: AUTH-01, AUTH-02, AUTH-03, AUTH-04
**Success Criteria** (what must be TRUE):
  1. POST /auth/login accepts form credentials and returns a JWT token
  2. POST /auth/api-keys creates a new API key and returns it
  3. GET /auth/api-keys returns the list of API keys for the authenticated user
  4. DELETE /auth/api-keys/{key_id} revokes the specified key and it no longer appears in the list
**Plans:** 1 plan
Plans:
- [x] 157-01-PLAN.md — Auth proxy client + types + API routes + tests

### Phase 158: Automations Module
**Goal**: Users can manage automation rules and inspect their execution history
**Depends on**: Phase 156
**Requirements**: AUTO-01, AUTO-02, AUTO-03, AUTO-04, AUTO-05, AUTO-06
**Success Criteria** (what must be TRUE):
  1. GET /api/v1/automations returns a paginated list of automation rules
  2. User can create a rule via POST and retrieve it via GET /api/v1/automations/{rule_id}
  3. User can update a rule via PATCH and delete it via DELETE, with the list reflecting changes
  4. GET /api/v1/automations/{rule_id}/executions returns execution history for a rule
**Plans:** 2 plans
Plans:
- [x] 158-01-PLAN.md — Types + haPatch + proxy client + API routes + tests
- [x] 158-02-PLAN.md — Nav entry + rules list page + rule detail page

### Phase 159: Hue Gap Closure
**Goal**: All missing Hue endpoints are proxied: bridge health, single light control, group listing, group control, scene activation
**Depends on**: Phase 156
**Requirements**: HUE-01, HUE-02, HUE-03, HUE-04, HUE-05, HUE-06, HUE-07
**Success Criteria** (what must be TRUE):
  1. GET /api/v1/hue/health returns bridge connectivity status
  2. User can get and control a single light via GET and PUT on /api/v1/hue/lights/{light_id}
  3. User can list groups and get a single group via /api/v1/hue/groups endpoints
  4. User can activate a scene for a group and control all lights in a group via the group action endpoint
**Plans**: TBD

### Phase 160: Sonos Gap Closure
**Goal**: All zone-level Sonos endpoints are proxied: playback state, transport commands, volume, seek, play-mode, queue, sleep timer
**Depends on**: Phase 156
**Requirements**: SONOS-01, SONOS-02, SONOS-03, SONOS-04, SONOS-05, SONOS-06, SONOS-07, SONOS-08, SONOS-09, SONOS-10, SONOS-11, SONOS-12, SONOS-13
**Success Criteria** (what must be TRUE):
  1. GET /api/v1/sonos/zones/{group_id}/playback returns current playback state for a zone
  2. All six transport commands (play, pause, stop, next, previous, seek) accept requests and return 202 Accepted
  3. Volume can be set via PUT, and play-mode can be read and set via GET/PUT on their respective endpoints
  4. Queue is retrievable via GET, and sleep timer can be read and set via GET/PUT
**Plans**: TBD

### Phase 161: Netatmo Gap Closure
**Goal**: All missing Netatmo endpoints are proxied: thermostat state, valve calibration, camera advanced features, home management
**Depends on**: Phase 156
**Requirements**: NETA-01, NETA-02, NETA-03, NETA-04, NETA-05, NETA-06, NETA-07, NETA-08, NETA-09
**Success Criteria** (what must be TRUE):
  1. GET /api/v1/netatmo/getthermstate returns current thermostat state
  2. Valve calibration works for all valves (POST /valves/calibrate) and single valve (POST /valves/{module_id}/calibrate)
  3. Camera endpoints return event snapshot, live stream URL, camera snapshot, and accept monitoring toggle
  4. Home management endpoints (renamehome, gethomedata) return expected data
**Plans**: TBD

### Phase 162: Fritz!Box Gap Closure
**Goal**: All missing Fritz!Box endpoints are proxied: telephony (DECT, calls, TAM), raw history, service discovery
**Depends on**: Phase 156
**Requirements**: FRITZ-01, FRITZ-02, FRITZ-03, FRITZ-04, FRITZ-05, FRITZ-06, FRITZ-07
**Success Criteria** (what must be TRUE):
  1. GET /api/v1/fritzbox/telephony/dect returns registered DECT handsets
  2. GET /api/v1/fritzbox/telephony/calls returns paginated call history and GET /telephony/tam returns answering machine state
  3. Raw history endpoints (bandwidth, devices, device-events) return historical data
  4. GET /api/v1/fritzbox/service-discovery returns TR-064 service descriptor XML
**Plans**: TBD

### Phase 163: DIRIGERA Gap Closure
**Goal**: All missing DIRIGERA endpoints are proxied: sensor history, aggregation stats, telemetry
**Depends on**: Phase 156
**Requirements**: DIR-01, DIR-02, DIR-03
**Success Criteria** (what must be TRUE):
  1. GET /api/v1/dirigera/history returns paginated sensor event history
  2. GET /api/v1/dirigera/stats returns aggregation and retention statistics
  3. GET /api/v1/dirigera/telemetry returns paginated sensor telemetry data
**Plans**: TBD

<details>
<summary>✅ v18.0 Dark-Only & Mobile-First (Phases 149-155) — SHIPPED 2026-04-02</summary>

- [x] Phase 149: Theme Removal Core (2/2 plans) — completed 2026-04-01
- [x] Phase 150: Theme Prefix Cleanup (3/3 plans) — completed 2026-04-01
- [x] Phase 151: Design System Mobile-First (2/2 plans) — completed 2026-04-01
- [x] Phase 152: Pages Audit — Core & Device Pages (2/2 plans) — completed 2026-04-01
- [x] Phase 153: Pages Audit — Extended Device Pages (2/2 plans) — completed 2026-04-01
- [x] Phase 154: Pages Audit — Admin & Support Pages (3/3 plans) — completed 2026-04-02
- [x] Phase 155: Phase 153 Verification Gap Closure (1/1 plan) — completed 2026-04-02

</details>

<details>
<summary>✅ v17.1 WebSocket Alignment & Tuya Integration (Phases 145-148) — SHIPPED 2026-03-30</summary>

- [x] Phase 145: WS Type Alignment (3/3 plans) — completed 2026-03-28
- [x] Phase 146: Raspi WS Migration (2/2 plans) — completed 2026-03-30
- [x] Phase 147: Tuya Infrastructure (2/2 plans) — completed 2026-03-30
- [x] Phase 148: Tuya Frontend (3/3 plans) — completed 2026-03-30

</details>

<details>
<summary>✅ v17.0 WebSocket Real-Time Transport (Phases 139-144) — SHIPPED 2026-03-28</summary>

- [x] Phase 139: WebSocket Infrastructure (2/2 plans) — completed 2026-03-26
- [x] Phase 140: Stove Migration (1/1 plan) — completed 2026-03-27
- [x] Phase 141: Fritz!Box & Hue Migration (2/2 plans) — completed 2026-03-27
- [x] Phase 142: Sonos & DIRIGERA Migration (2/2 plans) — completed 2026-03-27
- [x] Phase 143: Netatmo Migration (2/2 plans) — completed 2026-03-28
- [x] Phase 144: Connection UX (2/2 plans) — completed 2026-03-28

</details>

<details>
<summary>✅ Earlier milestones — v1.0 through v16.0 (Phases 1-138) — all shipped</summary>

See git history and `.planning/milestones/` for details.

</details>

## Progress

**Execution Order:** 156 → 157 → 158 → 159 → 160 → 161 → 162 → 163

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 156. Path Migration & Common Endpoints | v19.0 | 2/2 | Complete    | 2026-04-07 |
| 157. Auth Module | v19.0 | 1/1 | Complete    | 2026-04-08 |
| 158. Automations Module | v19.0 | 2/2 | Complete    | 2026-04-08 |
| 159. Hue Gap Closure | v19.0 | 0/TBD | Not started | - |
| 160. Sonos Gap Closure | v19.0 | 0/TBD | Not started | - |
| 161. Netatmo Gap Closure | v19.0 | 0/TBD | Not started | - |
| 162. Fritz!Box Gap Closure | v19.0 | 0/TBD | Not started | - |
| 163. DIRIGERA Gap Closure | v19.0 | 0/TBD | Not started | - |
