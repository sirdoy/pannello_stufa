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
- 🚧 **v14.0 Hue Proxy Migration** — Phases 106-109 (in progress)

## Phases

<details>
<summary>✅ v13.0 Thermorossi Proxy Migration (Phases 99-105) — SHIPPED 2026-03-20</summary>

- [x] Phase 99: Proxy Client Foundation (2/2 plans) — completed 2026-03-19
- [x] Phase 100: Control Endpoints (2/2 plans) — completed 2026-03-19
- [x] Phase 101: Frontend Hooks (2/2 plans) — completed 2026-03-19
- [x] Phase 102: Scheduler Update (1/1 plan) — completed 2026-03-19
- [x] Phase 103: Cleanup & Debug Panel (2/2 plans) — completed 2026-03-19
- [x] Phase 104: Fix Command Body Key Mismatch (1/1 plan) — completed 2026-03-20
- [x] Phase 105: Fix Debug Panel URLs & Stale Routes (1/1 plan) — completed 2026-03-20

</details>

<details>
<summary>✅ v12.0 Data Fetching Simplification & E2E Verification (Phases 96-98) — SHIPPED 2026-03-19</summary>

- [x] Phase 96: Polling Simplification (2/2 plans) — completed 2026-03-18
- [x] Phase 97: E2E Page Verification (1/1 plan) — completed 2026-03-18
- [x] Phase 98: Gap Closure (1/1 plan) — completed 2026-03-19

</details>

<details>
<summary>✅ Earlier milestones (v1.0-v11.1)</summary>

See `.planning/milestones/` for full archives.

</details>

### 🚧 v14.0 Hue Proxy Migration (In Progress)

**Milestone Goal:** Migrate Philips Hue from direct Bridge API (CLIP v2 local + v1 remote/cloud) to shared HomeAssistant proxy — eliminating OAuth, bridge discovery/pairing, and dual connection strategy. Same pattern as Netatmo (v10.0) and Thermorossi (v13.0).

#### Phase 106: Proxy Client + Types + Read Endpoints

- [x] **Phase 106: Proxy Client + Types + Read Endpoints** — Hue proxy client with shared transport, TypeScript types, and all read endpoints migrated (completed 2026-03-20)

#### Phase 107: Control Endpoints

- [x] **Phase 107: Control Endpoints** — Light state, group action, and scene activate endpoints with 202 Accepted pattern (completed 2026-03-20)

#### Phase 108: Frontend Hooks Rewrite

- [ ] **Phase 108: Frontend Hooks Rewrite** — useLightsData and useLightsCommands rewritten for proxy response shapes

#### Phase 109: Cleanup

- [ ] **Phase 109: Cleanup** — Old Hue infrastructure deleted (CLIP v2, remote API, connection strategy, OAuth, bridge discovery/pairing, env vars)

## Phase Details

### Phase 106: Proxy Client + Types + Read Endpoints
**Goal**: Hue lights are accessible via the shared HomeAssistant proxy — typed client established, all read data flowing through the new transport
**Depends on**: Nothing (first phase of milestone)
**Requirements**: CLIENT-01, CLIENT-02, CLIENT-03, READ-01, READ-02, READ-03, READ-04, READ-05, READ-06, READ-07
**Success Criteria** (what must be TRUE):
  1. `hueProxy.ts` function module exists and calls haGet/haPost with X-API-Key auth
  2. TypeScript types exist for HueLight, HueGroup, HueScene, HueBridgeHealth, HueHistoryItem
  3. getLights() returns lights with capability_tier, ct_kelvin, and room enrichment
  4. getGroups() returns groups with member lights array; getScenes() supports group_id filter
  5. getHealth() reports data_freshness (LIVE/STALE) and 503 when UNREACHABLE; getHistory() paginates with auto-granularity
**Plans**: 2 plans

Plans:
- [x] 106-01-PLAN.md — Hue proxy types + client module + client tests
- [x] 106-02-PLAN.md — API route rewrites (7 routes) + route tests

### Phase 107: Control Endpoints
**Goal**: Users can control Hue lights and groups through the proxy — all commands accepted with 202 Accepted and delayed-refresh pattern
**Depends on**: Phase 106
**Requirements**: CMD-01, CMD-02, CMD-03, CMD-04
**Success Criteria** (what must be TRUE):
  1. PUT /lights/{id}/state via proxy returns 202 Accepted with suggested_poll_delay_s
  2. PUT /groups/{id}/action via proxy returns 202 Accepted
  3. POST /groups/{gid}/scenes/{sid} activates scene via proxy with 202 Accepted
  4. 409 Conflict response from proxy is surfaced to caller (unreachable light detection)
**Plans**: 2 plans

Plans:
- [ ] 107-01-PLAN.md — haPut transport + 409 handling + command wrapper types + 3 proxy wrappers + unit tests
- [ ] 107-02-PLAN.md — Route rewrites (lights PUT, rooms PUT) + new scene POST route + route tests

### Phase 108: Frontend Hooks Rewrite
**Goal**: LightsCard and scene UI read proxy response shapes — users interact with lights using the new data format with no visible behavior change
**Depends on**: Phase 107
**Requirements**: UI-01, UI-02, UI-03, UI-04, UI-05, UI-06
**Success Criteria** (what must be TRUE):
  1. useLightsData reads flat proxy format (capability_tier instead of nested CLIP v2 objects)
  2. useLightsCommands sends v1 body format (on/bri/ct keys, not nested objects)
  3. Brightness slider shows 0-100% in UI while converting to 0-254 at the proxy boundary
  4. Scene activation calls POST /groups/{gid}/scenes/{sid} (new path pattern)
  5. 202 Accepted triggers delayed refresh using suggested_poll_delay_s
  6. data_freshness from proxy drives staleness indicator (replaces custom connection checks)
**Plans**: 2 plans

Plans:
- [ ] 108-01: useLightsData + useLightsCommands rewrite for proxy shapes
- [ ] 108-02: LightsCard UI wiring + integration verification

### Phase 109: Cleanup
**Goal**: All legacy Hue infrastructure is deleted — no direct Bridge API code, no OAuth, no bridge discovery, no Hue-specific env vars remain in the codebase
**Depends on**: Phase 108
**Requirements**: CLEAN-01, CLEAN-02, CLEAN-03, CLEAN-04, CLEAN-05, CLEAN-06, CLEAN-07
**Success Criteria** (what must be TRUE):
  1. hueApi.ts (CLIP v2 local client) is deleted from the codebase
  2. hueRemoteApi.ts (v1 remote/cloud client) is deleted
  3. hueConnectionStrategy.ts and bridge discovery/pairing routes are deleted
  4. hueRemoteTokenHelper.ts (OAuth) and hueLocalHelper.ts (Firebase bridge credentials) are deleted
  5. HUE_CLIENT_SECRET, NEXT_PUBLIC_HUE_CLIENT_ID, NEXT_PUBLIC_HUE_APP_ID env vars removed from .env.local and all references
**Plans**: 2 plans

Plans:
- [ ] 109-01: Delete legacy Hue files + env vars + verify no broken imports

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
| 84-91 | v11.0 | 13/13 | ✓ Complete | 2026-03-18 |
| 92-95 | v11.1 | 9/9 | ✓ Complete | 2026-03-18 |
| 96-98 | v12.0 | 4/4 | ✓ Complete | 2026-03-19 |
| 99-105 | v13.0 | 11/11 | ✓ Complete | 2026-03-20 |
| 106 | v14.0 | 2/2 | ✓ Complete | 2026-03-20 |
| 107 | 2/2 | Complete   | 2026-03-20 | - |
| 108 | v14.0 | 0/TBD | Not started | - |
| 109 | v14.0 | 0/TBD | Not started | - |

**Total:** 18 milestones shipped, 106 phases complete, 388 plans executed. v14.0 in progress (4 phases planned).

---

*Roadmap updated: 2026-03-20 — Phase 107 plans created (2 plans, 2 waves)*
