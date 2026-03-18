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
- 🚧 **v11.0 API Unification & Raspberry Pi Monitor** — Phases 84-91 (in progress)

## Phases

<details>
<summary>✅ v10.0 Netatmo API Migration (Phases 75-83) — SHIPPED 2026-03-16</summary>

- [x] Phase 75: API Client Foundation + Energy Read (2/2 plans) — completed 2026-03-15
- [x] Phase 76: Energy Control Endpoints (4/4 plans) — completed 2026-03-15
- [x] Phase 77: Camera Migration (3/3 plans) — completed 2026-03-15
- [x] Phase 78: Valve + Health (2/2 plans) — completed 2026-03-15
- [x] Phase 79: Cleanup (2/2 plans) — completed 2026-03-15
- [x] Phase 80: Fix Env Var & Schedule Wiring (2/2 plans) — completed 2026-03-15
- [x] Phase 81: Fix StoveSync & Debug Panel Cleanup (1/1 plan) — completed 2026-03-15
- [x] Phase 82: Fix Thermostat Control + Build Error (1/1 plan) — completed 2026-03-16
- [x] Phase 83: Camera Monitoring Toggle UI (1/1 plan) — completed 2026-03-16

</details>

<details>
<summary>✅ v9.0 Performance Optimization (Phases 70-74) — SHIPPED 2026-02-19</summary>

- [x] Phase 70: Measurement Baseline + Quick Wins (2/2 plans)
- [x] Phase 71: React Compiler (1/1 plan)
- [x] Phase 72: Code Splitting (1/1 plan)
- [x] Phase 73: Render Optimization (2/2 plans)
- [x] Phase 74: Suspense Streaming (2/2 plans)

</details>

<details>
<summary>✅ Earlier milestones (v1.0-v8.1)</summary>

See `.planning/milestones/` for full archives.

</details>

### 🚧 v11.0 API Unification & Raspberry Pi Monitor (In Progress)

**Milestone Goal:** Unify Fritz!Box and Netatmo behind a single shared HomeAssistant API transport, and add Raspberry Pi as a new monitored device on the dashboard.

#### Phases

- [x] **Phase 84: Shared HA API Client** - Build the single base URL + X-API-Key transport used by all providers (completed 2026-03-17)
- [x] **Phase 85: Fritz!Box Migration** - Migrate Fritz!Box client and routes to shared transport, remove JWT login (completed 2026-03-17)
- [x] **Phase 86: Netatmo Migration** - Migrate Netatmo client and routes to shared transport, remove separate env vars (completed 2026-03-17)
- [x] **Phase 87: Client Cleanup** - Dead export verification and documentation cleanup after migration (completed 2026-03-17)
- [x] **Phase 88: Raspberry Pi API Layer** - Proxy client functions, TypeScript types, and Next.js API routes for all Raspberry Pi endpoints (completed 2026-03-17)
- [x] **Phase 89: Raspberry Pi Dashboard Card** - RaspiCard component in device registry with adaptive polling, error boundary, and skeleton (completed 2026-03-17)
- [x] **Phase 90: Raspberry Pi Page + Cron** - Dedicated /raspi page with full stats and cron health integration (completed 2026-03-18)
- [x] **Phase 91: Bug Fix Verification** - Formalize and verify camera snapshot/live + schedule 503 retry fixes from debug sessions (planned) (completed 2026-03-18)

## Phase Details

### Phase 84: Shared HA API Client
**Goal**: A single, reusable HomeAssistant proxy client module exists that all provider clients will build on
**Depends on**: Nothing (first phase of milestone)
**Requirements**: API-01, API-02, API-03
**Success Criteria** (what must be TRUE):
  1. A single `HA_API_URL` + `HA_API_KEY` env var pair replaces all provider-specific connection vars
  2. Generic GET and POST helpers handle AbortController timeouts and map RFC 9457 errors to ApiError instances
  3. The shared client module is importable and TypeScript-typed with zero tsc errors
**Plans:** 1/1 plans complete
Plans:
- [ ] 84-01-PLAN.md — TDD: shared haGet/haPost client with types and tests

### Phase 85: Fritz!Box Migration
**Goal**: Fritz!Box uses the shared HA client — JWT login flow gone, all routes behave identically to before
**Depends on**: Phase 84
**Requirements**: API-04, API-05, API-06
**Success Criteria** (what must be TRUE):
  1. Fritz!Box API routes return the same data as before the migration (no behavior change)
  2. Fritz!Box JWT login code is absent from the codebase
  3. Rate limiting (10 req/min) and Firebase RTDB caching (60s TTL) continue to function on top of shared transport
**Plans:** 1/1 plans complete
Plans:
- [ ] 85-01-PLAN.md — Migrate Fritz!Box client to haGet, rewrite tests, delete credential config

### Phase 86: Netatmo Migration
**Goal**: Netatmo uses the shared HA client — provider-specific env vars gone, all routes behave identically to before
**Depends on**: Phase 84
**Requirements**: API-07, API-08, API-09
**Success Criteria** (what must be TRUE):
  1. Netatmo API routes return the same data as before the migration (no behavior change)
  2. Netatmo-specific env vars (`NETATMO_PROXY_URL`, `NETATMO_API_KEY`, etc.) are absent from `.env.local` and code references
  3. All Netatmo convenience wrappers (setpoint, mode, schedule, measurements, camera, valve, health) remain callable and functional
**Plans:** 3/3 plans complete
Plans:
- [ ] 86-01-PLAN.md — Migrate netatmoProxy.ts transport to haGet/haPost, add HA env vars
- [ ] 86-02-PLAN.md — Update tests, envValidator, and getroommeasure route
- [ ] 86-03-PLAN.md — Gap closure: fix getroommeasure route test (netatmoProxyGet -> getProxyRoomMeasure)

### Phase 87: Client Cleanup
**Goal**: Zero dead exports in wrapper modules, documentation references only HA_API_URL/HA_API_KEY
**Depends on**: Phase 85, Phase 86
**Requirements**: API-10
**Success Criteria** (what must be TRUE):
  1. No unused exports in Fritz!Box or Netatmo wrapper modules (confirmed by knip)
  2. Documentation files reference only HA_API_URL/HA_API_KEY — no stale NETATMO_PROXY_* references
  3. Zero tsc errors and all tests pass
**Plans:** 2/2 plans complete
Plans:
- [ ] 87-01-PLAN.md — Dead export verification with knip + removal of any unused exports
- [ ] 87-02-PLAN.md — Documentation cleanup: update 4 docs files to HA_API_URL/HA_API_KEY

### Phase 88: Raspberry Pi API Layer
**Goal**: The server side can reach and type all Raspberry Pi endpoints — proxy functions, types, and routes ready for frontend consumption
**Depends on**: Phase 84
**Requirements**: RASPI-01, RASPI-02, RASPI-03
**Success Criteria** (what must be TRUE):
  1. API routes for Raspberry Pi health, CPU, memory, disk, and system endpoints are reachable from the browser
  2. TypeScript types match all API response schemas with zero tsc errors
  3. RFC 9457 errors from the Raspberry Pi proxy surface as ApiError instances in the frontend
**Plans:** 1/1 plans complete
Plans:
- [ ] 88-01-PLAN.md — Types, client module, barrel, 5 API routes, and tests

### Phase 89: Raspberry Pi Dashboard Card
**Goal**: Raspberry Pi appears in the home dashboard with a live health summary and integrates into the device registry
**Depends on**: Phase 88
**Requirements**: RASPI-04, RASPI-05, RASPI-07
**Success Criteria** (what must be TRUE):
  1. RaspiCard is visible on the dashboard showing CPU%, RAM%, disk%, temperature, and a health badge
  2. The card uses adaptive polling and respects Page Visibility API (pauses when tab hidden)
  3. If the Raspberry Pi proxy is unreachable, an error boundary shows a fallback UI without crashing the dashboard
  4. A skeleton placeholder appears during initial data load
**Plans:** 2/2 plans complete
Plans:
- [ ] 89-01-PLAN.md — Device registry + useRaspiData hook + Skeleton.RaspiCard
- [ ] 89-02-PLAN.md — RaspiCard component + DashboardCards wiring + integration tests

### Phase 90: Raspberry Pi Page + Cron
**Goal**: Users can navigate to /raspi for detailed system stats, and the 5-min cron includes Raspberry Pi health
**Depends on**: Phase 89
**Requirements**: RASPI-06, RASPI-08
**Success Criteria** (what must be TRUE):
  1. Navigating to /raspi shows full system stats: uptime, load averages, network I/O, and process count
  2. The 5-minute GitHub Actions cron check reports Raspberry Pi health alongside stove and thermostat status
  3. If the Raspberry Pi is unreachable during a cron run, the check logs the failure without aborting other health checks
**Plans:** 2/2 plans complete
Plans:
- [ ] 90-01-PLAN.md — /raspi page with useRaspiFullData hook, orchestrator, presentational components, RaspiCard navigation
- [ ] 90-02-PLAN.md — Cron health check integration with raspiClient.getHealth()

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
| 75-83 | v10.0 | 18/18 | ✓ Complete | 2026-03-16 |
| 84. Shared HA API Client | 1/1 | Complete    | 2026-03-17 | - |
| 85. Fritz!Box Migration | 1/1 | Complete    | 2026-03-17 | - |
| 86. Netatmo Migration | 3/3 | Complete    | 2026-03-17 | - |
| 87. Client Cleanup | 2/2 | Complete    | 2026-03-17 | - |
| 88. Raspberry Pi API Layer | 1/1 | Complete    | 2026-03-17 | - |
| 89. Raspberry Pi Dashboard Card | 2/2 | Complete    | 2026-03-17 | - |
| 90. Raspberry Pi Page + Cron | 2/2 | Complete    | 2026-03-18 | - |

**Total:** 14 milestones shipped, 83 phases complete, 348 plans executed. v11.0 in progress (8 phases planned, phases 84-91).

### Phase 91: Correzione problemi dati Rete e Netatmo camera

**Goal:** Formalize and verify bug fixes from debug sessions (camera snapshot 302 redirect, stream error states, schedule/room 503 retry logic) — all code already committed at d33d210
**Requirements**: CAM-01, CAM-02, CAM-03, SCHED-01, ROOM-01
**Depends on:** Phase 90
**Plans:** 1/1 plans complete

Plans:
- [ ] 91-01-PLAN.md — Verify tests, document fixes, close debug files, browser verification checkpoint

---

*Roadmap updated: 2026-03-18 — Phase 91 plans created (1 plan, wave 1)*
