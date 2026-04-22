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
- [x] **Phase 164: Phase 156 Regression Fix** - Delete legacy /api/stove/, fix routes/sw/command palette/debug panels
- [ ] **Phase 165: Milestone Hygiene & Spec Alignment** - SUMMARY commit hashes, /health auth spec, 163 deferred tsc, Nyquist validations
- [x] **Phase 166: Hue Frontend Cutover** - Migrate useLightsData/useLightsCommands + 2 pages to /api/v1/hue/* (completed 2026-04-18)
- [x] **Phase 167: Sonos Frontend Cutover** - Migrate 5 Sonos hooks + components to /api/v1/sonos/* (completed 2026-04-20)
- [x] **Phase 168: Netatmo Frontend Cutover** - Migrate Netatmo UI to /api/v1/netatmo/* (completed 2026-04-21)
- [x] **Phase 169: DIRIGERA Frontend Cutover** - Migrate useDirigeraData to /api/v1/dirigera/*
- [ ] **Phase 170: Auth UI** - Login form + API-keys management page (AUTH-01..04 consumers)
- [ ] **Phase 171: Fritz!Box Consumer UI** - Telephony/raw-history/service-discovery consumers (FRITZ-01..07)

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
**Plans:** 2 plans
Plans:
- [x] 159-01-PLAN.md — v1 Hue health + single light GET + light state PUT routes with tests
- [x] 159-02-PLAN.md — v1 Hue groups list + single group + group action + scene activation routes with tests

### Phase 160: Sonos Gap Closure
**Goal**: All zone-level Sonos endpoints are proxied: playback state, transport commands, volume, seek, play-mode, queue, sleep timer
**Depends on**: Phase 156
**Requirements**: SONOS-01, SONOS-02, SONOS-03, SONOS-04, SONOS-05, SONOS-06, SONOS-07, SONOS-08, SONOS-09, SONOS-10, SONOS-11, SONOS-12, SONOS-13
**Success Criteria** (what must be TRUE):
  1. GET /api/v1/sonos/zones/{group_id}/playback returns current playback state for a zone
  2. All six transport commands (play, pause, stop, next, previous, seek) accept requests and return 202 Accepted
  3. Volume can be set via PUT, and play-mode can be read and set via GET/PUT on their respective endpoints
  4. Queue is retrievable via GET, and sleep timer can be read and set via GET/PUT
**Plans:** 2 plans
Plans:
- [x] 160-01-PLAN.md — v1 Sonos playback GET + transport POST command routes with tests
- [x] 160-02-PLAN.md — v1 Sonos volume, seek, queue, play-mode, sleep-timer routes with tests

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
**Plans:** 2 plans
Plans:
- [x] 162-01-PLAN.md — Telephony client functions + API routes (DECT, calls, TAM)
- [x] 162-02-PLAN.md — Raw history routes + service discovery with XML parsing

### Phase 163: DIRIGERA Gap Closure
**Goal**: All missing DIRIGERA endpoints are proxied: sensor history, aggregation stats, telemetry
**Depends on**: Phase 156
**Requirements**: DIR-01, DIR-02, DIR-03
**Success Criteria** (what must be TRUE):
  1. GET /api/v1/dirigera/history returns paginated sensor event history
  2. GET /api/v1/dirigera/stats returns aggregation and retention statistics
  3. GET /api/v1/dirigera/telemetry returns paginated sensor telemetry data
**Plans:** 1 plan
Plans:
- [x] 163-01-PLAN.md — DIRIGERA history/stats/telemetry proxy client + v1 routes + tests

### Phase 164: Phase 156 Regression Fix
**Goal**: Legacy /api/stove/* surface fully removed; all frontend consumers (routes constants, service worker, command palette, debug panels, tests) target canonical /api/v1/thermorossi/*
**Depends on**: Phase 163
**Requirements**: PATH-01, PATH-02
**Gap Closure**: Closes v19.0 MILESTONE-AUDIT gaps (regressed PATH-01/PATH-02, flows "Command palette stove actions" + "Service worker stove cache")
**Success Criteria** (what must be TRUE):
  1. `app/api/stove/` directory no longer exists and no file references `/api/stove/` outside archived planning docs
  2. `lib/routes.ts` STOVE_ROUTES, `app/sw.ts`, and `lib/commands/deviceCommands.tsx` all point to `/api/v1/thermorossi/*` with camelCase action paths and `{ value }` body shape
  3. Both StoveTab debug panels (45 refs each) rewritten to canonical paths
  4. Legacy stove test files deleted or retargeted; Jest + smoke suite green
**Plans:** 2 plans
- [x] 164-01-PLAN.md — Delete legacy /api/stove/ tree; rewire routes, command palette, service worker, debug panels, JSDoc to canonical /api/v1/thermorossi/*
- [x] 164-02-PLAN.md — Retarget 4 test files to canonical paths; final repo-wide grep sweep proving zero /api/stove/ refs

### Phase 165: Milestone Hygiene & Spec Alignment
**Goal**: v19.0 artifacts (SUMMARY commit hashes, VERIFICATION claims, deferred tsc errors, Nyquist VALIDATION drafts) reflect reality
**Depends on**: Phase 164
**Requirements**: COMMON-01 (spec reconciliation), COMMON-02 (doc alignment)
**Gap Closure**: Closes v19.0 audit tech-debt (phases 156/159/160/163) + partial-Nyquist block
**Success Criteria** (what must be TRUE):
  1. 159-01-SUMMARY and 160-01-SUMMARY commit hashes match `git log`
  2. `/health` auth behaviour (withAuthAndErrorHandler) and VERIFICATION.md agree; spec divergence resolved explicitly
  3. 163 deferred-items.md tsc errors (AutomationCreate cast + 3 thermorossi settings NextResponse) resolved or formally deferred with issue link
  4. Phases 156-162 VALIDATION.md upgraded from draft to nyquist_compliant (or PARTIAL explicitly accepted)
**Plans:** 2 plans
Plans:
- [x] 165-01-PLAN.md — SUMMARY hash sweep + /health spec reconciliation + 4 tsc fixes + deferred-items cleanup
- [x] 165-02-PLAN.md — VALIDATION.md promotion (156-162) + audit closeout




### Phase 166: Hue Frontend Cutover
**Goal**: Production Hue UI consumes /api/v1/hue/* exclusively; Firebase adminDbPush logging triggers on real user commands
**Depends on**: Phase 164
**Requirements**: HUE-01, HUE-02, HUE-03, HUE-04, HUE-05, HUE-06, HUE-07
**Gap Closure**: Closes v19.0 audit HUE integration gap (phase 159 orphan)
**Success Criteria** (what must be TRUE):
  1. `useLightsData` and `useLightsCommands` hit only `/api/v1/hue/*` routes
  2. `app/lights/page.tsx` and `app/lights/scenes/page.tsx` no longer reference `/api/hue/*`
  3. Manual toggle from `/lights` produces a row in Firebase Hue command log
  4. Jest + Playwright smoke green
**Plans:** 3/3 plans complete
Plans:
- [x] 166-01-PLAN.md — Create v1 lights list + scenes list routes with tests
- [x] 166-02-PLAN.md — Rewrite all frontend URLs (hooks, pages, modals, debug panels, registry)
- [x] 166-03-PLAN.md — Delete legacy app/api/hue/ tree + final grep sweep




### Phase 167: Sonos Frontend Cutover
**Goal**: All Sonos hooks and components consume /api/v1/sonos/* zone endpoints
**Depends on**: Phase 164
**Requirements**: SONOS-01, SONOS-02, SONOS-03, SONOS-04, SONOS-05, SONOS-06, SONOS-07, SONOS-08, SONOS-09, SONOS-10, SONOS-11, SONOS-12, SONOS-13
**Gap Closure**: Closes v19.0 audit SONOS integration gap (phase 160 orphan)
**Success Criteria** (what must be TRUE):
  1. `useSonosData`, `useSonosFullData`, `useSonosCommands`, `useSonosQueue`, `useSonosHistory` all target `/api/v1/sonos/*`
  2. Zero `/api/sonos/` references in `app/` and `components/`
  3. Zone playback, transport, queue, play-mode, sleep-timer all functional in browser smoke
  4. Jest + Playwright smoke green
**Plans:** 3/3 plans complete
Plans:
- [x] 167-01-PLAN.md — Create 11 new v1 Sonos route wrappers (health, devices, zones, history, speakers/[uid]/{volume,mute,eq,home-theater,source,join,unjoin}) + co-located Jest tests
- [x] 167-02-PLAN.md — Rewrite 5 hooks + 4 test files: 63 URL swaps /api/sonos/ -> /api/v1/sonos/ including WS side-fetches and regex matchers
- [x] 167-03-PLAN.md — Delete app/api/sonos/ legacy tree + repo-wide grep sweep + Jest/Playwright smoke regression

### Phase 168: Netatmo Frontend Cutover
**Goal**: Netatmo UI consumes /api/v1/netatmo/** exclusively
**Depends on**: Phase 164
**Requirements**: NETA-01, NETA-02, NETA-03, NETA-04, NETA-05, NETA-06, NETA-07, NETA-08, NETA-09
**Gap Closure**: Closes v19.0 audit NETA integration gap (phase 161 orphan)
**Success Criteria** (what must be TRUE):
  1. Thermostat state, valve calibration (bulk + per-module), camera (events snapshot, stream, snapshot, monitoring toggle), renamehome, gethomedata all served from `/api/v1/netatmo/**`
  2. Zero `/api/netatmo/` references in production code (debug panel may remain if explicitly scoped)
  3. Manual thermostat setpoint + valve calibrate exercised against canonical routes
  4. Jest + Playwright smoke green
**Plans:** 3/3 plans complete
- [x] 168-01-PLAN.md — Rewrite both debug NetatmoTab files (42 URL swaps each, drop schedules tile, rewrite calibrate to valves/calibrate)
- [x] 168-02-PLAN.md — Rewrite production consumer surface (routes.ts, useThermostatData shape-unwrap, useScheduleData endpoint-collapse, deviceCommands hyphen-bug fix, camera monitoring path-segment + body change, v1 snapshot route 302 redirect, sw.ts dead-branch delete, 3 test files)
- [x] 168-03-PLAN.md — Delete legacy app/api/netatmo/ tree + 2 legacy __tests__/ dirs; repo-wide grep sweep; Jest + Playwright smoke regression

### Phase 169: DIRIGERA Frontend Cutover
**Goal**: useDirigeraData consumes /api/v1/dirigera/* history, stats, telemetry
**Depends on**: Phase 164
**Requirements**: DIR-01, DIR-02, DIR-03
**Gap Closure**: Closes v19.0 audit DIR integration gap (phase 163 orphan)
**Success Criteria** (what must be TRUE):
  1. `useDirigeraData` hits `/api/v1/dirigera/history`, `/stats`, `/telemetry`
  2. Zero `/api/dirigera/` references outside debug/archived paths
  3. Dirigera page renders history/stats/telemetry end-to-end in smoke run
  4. Jest + Playwright smoke green
**Plans:** 3 plans
- [x] 169-01-PLAN.md — Create 5 v1 wrapper routes (health, sensors, sensors/summary, sensors/contact, sensors/motion) + co-located tests; swap useDirigeraData, useDirigeraFullData, useDirigeraData.test.ts to v1 URLs; add /dirigera case to page-loads.spec.ts
- [x] 169-02-PLAN.md — Create useDirigeraHistory, useDirigeraStats, useDirigeraTelemetry hooks + tests; create DirigeraStatsPanel, DirigeraHistoryPanel, DirigeraTelemetryPanel components; wire all three into /dirigera page; extend Playwright smoke to assert 3 panel headings (DIR-01, DIR-02, DIR-03)
- [x] 169-03-PLAN.md — Delete legacy app/api/dirigera/ tree (5 files); [BLOCKING] pre- and post-deletion v1-intact gates (wc -l == 8); repo-wide grep sweep; Jest + Playwright smoke regression

### Phase 170: Auth UI
**Goal**: Users can log in via form UI and manage API keys end-to-end
**Depends on**: Phase 164
**Requirements**: AUTH-01, AUTH-02, AUTH-03, AUTH-04
**Gap Closure**: Closes v19.0 audit AUTH integration gap (phase 157 orphan — zero UI consumer)
**Success Criteria** (what must be TRUE):
  1. Login page POSTs form credentials to `/auth/login` and stores JWT
  2. API-keys management page lists existing keys (GET), creates new (POST), revokes (DELETE)
  3. Revoked keys disappear from list after refresh
  4. Jest + Playwright smoke covers the happy path
**Plans:** 2 plans
- [ ] 164-01-PLAN.md — Delete legacy /api/stove/ tree; rewire routes, command palette, service worker, debug panels, JSDoc to canonical /api/v1/thermorossi/*
- [ ] 164-02-PLAN.md — Retarget 4 test files to canonical paths; final repo-wide grep sweep proving zero /api/stove/ refs

### Phase 171: Fritz!Box Consumer UI
**Goal**: Telephony, raw history, and service-discovery endpoints have production UI consumers outside debug panels
**Depends on**: Phase 164
**Requirements**: FRITZ-01, FRITZ-02, FRITZ-03, FRITZ-04, FRITZ-05, FRITZ-06, FRITZ-07
**Gap Closure**: Closes v19.0 audit FRITZ integration gap (phase 162 orphan)
**Success Criteria** (what must be TRUE):
  1. DECT handsets + call history + TAM state rendered in a Telephony page/section
  2. Raw bandwidth history, device presence history, device-events log surfaced in network section (chart or table)
  3. Service-discovery TR-064 descriptor visible in an admin/debug-elevated surface
  4. Jest + Playwright smoke covers each new route
**Plans:** 2 plans
- [ ] 164-01-PLAN.md — Delete legacy /api/stove/ tree; rewire routes, command palette, service worker, debug panels, JSDoc to canonical /api/v1/thermorossi/*
- [ ] 164-02-PLAN.md — Retarget 4 test files to canonical paths; final repo-wide grep sweep proving zero /api/stove/ refs

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

**Execution Order:** 156 → 157 → 158 → 159 → 160 → 161 → 162 → 163 → 164 → 165 → 166 → 167 → 168 → 169 → 170 → 171

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 156. Path Migration & Common Endpoints | v19.0 | 2/2 | Complete    | 2026-04-07 |
| 157. Auth Module | v19.0 | 1/1 | Complete    | 2026-04-08 |
| 158. Automations Module | v19.0 | 2/2 | Complete    | 2026-04-08 |
| 159. Hue Gap Closure | v19.0 | 2/2 | Complete    | 2026-04-09 |
| 160. Sonos Gap Closure | v19.0 | 2/2 | Complete    | 2026-04-09 |
| 161. Netatmo Gap Closure | v19.0 | 2/2 | Complete    | 2026-04-09 |
| 162. Fritz!Box Gap Closure | v19.0 | 2/2 | Complete    | 2026-04-09 |
| 163. DIRIGERA Gap Closure | v19.0 | 1/1 | Complete   | 2026-04-14 |
| 164. Phase 156 Regression Fix | v19.0 | 2/2 | Complete   | 2026-04-15 |
| 165. Milestone Hygiene & Spec Alignment | v19.0 | 2/2 | Complete   | 2026-04-16 |
| 166. Hue Frontend Cutover | v19.0 | 3/3 | Complete    | 2026-04-18 |
| 167. Sonos Frontend Cutover | v19.0 | 3/3 | Complete    | 2026-04-20 |
| 168. Netatmo Frontend Cutover | v19.0 | 3/3 | Complete    | 2026-04-21 |
| 169. DIRIGERA Frontend Cutover | v19.0 | 0/? | Pending    | — |
| 170. Auth UI | v19.0 | 0/? | Pending    | — |
| 171. Fritz!Box Consumer UI | v19.0 | 0/? | Pending    | — |
