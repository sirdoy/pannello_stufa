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
- 🚧 **v13.0 Thermorossi Proxy Migration** — Phases 99-103 (in progress)

## Phases

<details>
<summary>✅ v12.0 Data Fetching Simplification & E2E Verification (Phases 96-98) — SHIPPED 2026-03-19</summary>

- [x] Phase 96: Polling Simplification (2/2 plans) — completed 2026-03-18
- [x] Phase 97: E2E Page Verification (1/1 plan) — completed 2026-03-18
- [x] Phase 98: Gap Closure (1/1 plan) — completed 2026-03-19

</details>

<details>
<summary>✅ v11.1 Test Suite & Tech Debt Cleanup (Phases 92-95) — SHIPPED 2026-03-18</summary>

- [x] Phase 92: Jest Configuration (1/1 plan) — completed 2026-03-18
- [x] Phase 93: API & Infrastructure Test Fixes (3/3 plans) — completed 2026-03-18
- [x] Phase 94: Component & Hook Test Fixes (2/2 plans) — completed 2026-03-18
- [x] Phase 95: Tech Debt Cleanup (3/3 plans) — completed 2026-03-18

</details>

<details>
<summary>✅ v11.0 API Unification & Raspberry Pi Monitor (Phases 84-91) — SHIPPED 2026-03-18</summary>

- [x] Phase 84: Shared HA API Client (1/1 plan) — completed 2026-03-17
- [x] Phase 85: Fritz!Box Migration (1/1 plan) — completed 2026-03-17
- [x] Phase 86: Netatmo Migration (3/3 plans) — completed 2026-03-17
- [x] Phase 87: Client Cleanup (2/2 plans) — completed 2026-03-17
- [x] Phase 88: Raspberry Pi API Layer (1/1 plan) — completed 2026-03-17
- [x] Phase 89: Raspberry Pi Dashboard Card (2/2 plans) — completed 2026-03-17
- [x] Phase 90: Raspberry Pi Page + Cron (2/2 plans) — completed 2026-03-18
- [x] Phase 91: Bug Fix Verification (1/1 plan) — completed 2026-03-18

</details>

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
<summary>✅ Earlier milestones (v1.0-v9.0)</summary>

See `.planning/milestones/` for full archives.

</details>

### 🚧 v13.0 Thermorossi Proxy Migration (In Progress)

**Milestone Goal:** Migrate the Thermorossi stove from direct WiNet cloud API to the shared HomeAssistant proxy, completing the unified API architecture for all device providers. Delete all WiNet infrastructure.

- [x] **Phase 99: Proxy Client Foundation** - TypeScript types, thermorossi proxy client, and all read endpoints migrated (completed 2026-03-19)
- [x] **Phase 100: Control Endpoints** - All command and settings endpoints migrated with 202 Accepted pattern, plus history endpoint (completed 2026-03-19)
- [x] **Phase 101: Frontend Hooks** - useStoveData and useStoveCommands updated for proxy response format (completed 2026-03-19)
- [x] **Phase 102: Scheduler Update** - Cron/scheduler updated for stove_state strings and proxy client (completed 2026-03-19)
- [x] **Phase 103: Cleanup & Debug Panel** - WiNet infrastructure deleted, debug panel updated for proxy endpoints (completed 2026-03-19)
- [x] **Phase 104: Fix Command Body Key Mismatch** - Align useStoveCommands body key with setPower/setFan route expectations (gap closure) (completed 2026-03-20)
- [ ] **Phase 105: Fix Debug Panel URLs & Stale Routes** - Fix StoveTab POST URLs and remove stale route entries (gap closure)

## Phase Details

### Phase 99: Proxy Client Foundation
**Goal**: The thermorossi proxy client exists and all read endpoints are served through it with correct TypeScript types
**Depends on**: Nothing (first phase of milestone)
**Requirements**: CLIENT-01, CLIENT-02, CLIENT-03, READ-01, READ-02, READ-03, READ-04
**Success Criteria** (what must be TRUE):
  1. A `lib/thermorossiProxy.ts` module exists using `haGet`/`haPost` from `lib/haClient.ts` with X-API-Key auth
  2. TypeScript interfaces exist for all proxy responses: status (stove_state, power_level, fan_level, data_freshness, error_code, error_description), power, fan, health, history, and command (202 Accepted + suggested_poll_delay_s)
  3. Convenience wrappers `getStatus`, `getPower`, `getFan`, `getHealth` call the correct proxy paths and return typed responses
  4. Next.js API routes for GET /stove/status, /stove/power, /stove/fan-level, and /stove/health all proxy through the new client and return 200 with correct shape
  5. `data_freshness` field (LIVE/STALE/UNREACHABLE) is present in status, power, and fan responses
**Plans:** 2/2 plans complete

Plans:
- [ ] 99-01-PLAN.md — TypeScript types + thermorossi proxy client + unit tests
- [ ] 99-02-PLAN.md — Migrate 3 read routes + create health route

### Phase 100: Control Endpoints
**Goal**: All stove commands and settings can be sent through the proxy, and telemetry history is available
**Depends on**: Phase 99
**Requirements**: CMD-01, CMD-02, CMD-03, CMD-04, CMD-05, READ-05
**Success Criteria** (what must be TRUE):
  1. POST /stove/commands/ignit and POST /stove/commands/shutdown routes return 202 Accepted with `suggested_poll_delay_s` from the proxy
  2. POST /stove/settings/power, /stove/settings/fan-level, and /stove/settings/temperature/water routes accept a `{ value: N }` body and return 202 Accepted
  3. GET /stove/history route returns paginated telemetry with auto-granularity (raw/hourly/daily) proxied from the HA endpoint
  4. The convenience wrapper `getHistory` exists in `lib/thermorossiProxy.ts` and accepts pagination params
**Plans:** 2/2 plans complete

Plans:
- [ ] 100-01-PLAN.md — Command wrappers in thermorossiProxy.ts + unit tests
- [ ] 100-02-PLAN.md — Migrate 5 control routes + create history route

### Phase 101: Frontend Hooks
**Goal**: The stove card and stove page work correctly against proxy response shapes without WiNet-specific logic
**Depends on**: Phase 100
**Requirements**: UI-01, UI-02, UI-03, UI-04, UI-05
**Success Criteria** (what must be TRUE):
  1. `useStoveData` reads `stove_state` (exact string equality: working/off/igniting/standby/cleaning/alarm/modulating), `power_level`, and `fan_level` from the proxy status response
  2. `stoveStatusUtils.ts` derives display state from exact `stove_state` matches — no regex or substring matching against the old StatusDescription format
  3. `useStoveCommands` handles the 202 Accepted response (not 200) as a success signal for all command invocations
  4. When proxy returns `error_code` and `error_description`, the stove card displays the error text to the user
  5. Staleness display for the stove uses `data_freshness` from the proxy instead of custom timestamp-based logic
**Plans:** 2/2 plans complete

Plans:
- [ ] 101-01-PLAN.md — stoveStatusUtils rewrite + useStoveData proxy adaptation
- [ ] 101-02-PLAN.md — useStoveCommands 202 delayed refresh + 409 handling + StoveCard inline fix

### Phase 102: Scheduler Update
**Goal**: The scheduler/cron makes all stove decisions using proxy client and proxy response fields
**Depends on**: Phase 99
**Requirements**: CRON-01, CRON-02, CRON-03
**Success Criteria** (what must be TRUE):
  1. The scheduler route reads `stove_state` (exact string) for all state-based decisions — no reference to `StatusDescription` or WiNet status strings remains
  2. Alarm notifications in the health monitoring path use `error_code` and `error_description` from the proxy status response
  3. All stove API calls in the scheduler route go through `lib/thermorossiProxy.ts` — no direct WiNet URLs or old `lib/stoveApi.ts` imports remain
**Plans:** 1/1 plans complete

Plans:
- [ ] 102-01-PLAN.md — Scheduler proxy migration + alarm notifications + test suite update

### Phase 103: Cleanup & Debug Panel
**Goal**: All WiNet infrastructure is deleted and the debug panel reflects the proxy architecture
**Depends on**: Phase 101, Phase 102
**Requirements**: CLEAN-01, CLEAN-02, CLEAN-03, CLEAN-04, DEBUG-01
**Success Criteria** (what must be TRUE):
  1. `lib/stoveApi.ts` (WiNet direct cloud client) is deleted — no file at that path exists
  2. WiNet API key environment variable is removed from all configuration and `.env.local`
  3. Sandbox mode code (localhost WiNet simulation) is deleted with no remaining references
  4. Dead API routes (getRoomTemperature, getActualWaterTemperature, getWaterSetTemperature, settings, setSettings) are deleted with no remaining Next.js route handlers at those paths
  5. StoveTab in the debug panel shows proxy endpoint URLs (HA_API_URL-based paths) and documents the new response format (stove_state, 202 Accepted)
**Plans:** 2/2 plans complete

Plans:
- [ ] 103-01-PLAN.md — WiNet client + sandbox + dead routes + dead service deletion + import cleanup
- [ ] 103-02-PLAN.md — Debug panel StoveTab rewrite for proxy endpoints

### Phase 104: Fix Command Body Key Mismatch
**Goal**: Fan and power level commands from the UI reach the proxy with the correct body key
**Depends on**: Phase 100, Phase 101
**Requirements**: CMD-03, CMD-04, UI-03
**Gap Closure:** Closes BROKEN-02 from v13.0 audit
**Success Criteria** (what must be TRUE):
  1. `useStoveCommands` sends the body key that `setPower` and `setFan` routes expect — no `undefined` value reaches the proxy
  2. Unit tests verify the correct body shape for fan and power commands
  3. The fan/power adjustment E2E flow is unbroken from UI → route → proxy
**Plans:** 1/1 plans complete

Plans:
- [ ] 104-01-PLAN.md — Fix body key from level to value in useStoveCommands + update test assertions

### Phase 105: Fix Debug Panel URLs & Stale Routes
**Goal**: Debug panel POST operations work and no stale route references remain
**Depends on**: Phase 103
**Requirements**: DEBUG-01, CLEAN-04
**Gap Closure:** Closes BROKEN-01 and BROKEN-03 from v13.0 audit
**Success Criteria** (what must be TRUE):
  1. StoveTab POST URLs point to Next.js routes (`/api/stove/ignite`, `/api/stove/shutdown`, `/api/stove/setPower`, `/api/stove/setFan`, `/api/stove/setWaterTemperature`) — not HA proxy internal paths
  2. `lib/routes.ts` has no entries for deleted API routes (getRoomTemperature, getSettings, setSettings)
  3. All 5 POST operations in StoveTab return non-404 responses
**Plans:** 1 plan

Plans:
- [ ] 105-01-PLAN.md — Fix StoveTab POST URLs + remove stale route entries

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
| 99. Proxy Client Foundation | 2/2 | Complete    | 2026-03-19 | - |
| 100. Control Endpoints | 2/2 | Complete    | 2026-03-19 | - |
| 101. Frontend Hooks | 2/2 | Complete    | 2026-03-19 | - |
| 102. Scheduler Update | 1/1 | Complete    | 2026-03-19 | - |
| 103. Cleanup & Debug Panel | 2/2 | Complete    | 2026-03-19 | - |
| 104. Fix Command Body Key Mismatch | 1/1 | Complete    | 2026-03-20 | - |
| 105. Fix Debug Panel URLs & Stale Routes | 0/1 | Planned | - | - |

**Total:** 17 milestones shipped, 98 phases complete, 375 plans executed. v13.0 in progress (5 phases complete, 2 gap closure phases planned).

---

*Roadmap updated: 2026-03-20 — Phase 105 planned: 1 plan in 1 wave*
