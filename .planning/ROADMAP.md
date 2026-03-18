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
- 🚧 **v11.1 Test Suite & Tech Debt Cleanup** — Phases 92-95 (in progress)

## Phases

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

### v11.1 Test Suite & Tech Debt Cleanup (In Progress)

**Milestone Goal:** Fix all failing tests and remove accumulated tech debt — the codebase runs a clean test suite with zero ordering dependencies, and no dead code or stale configuration remains.

- [x] **Phase 92: Jest Configuration** - Exclude Playwright files and eliminate flaky ordering dependencies (completed 2026-03-18)
- [x] **Phase 93: API & Infrastructure Test Fixes** - Fix 8 failing test suites in server-side code (completed 2026-03-18)
- [x] **Phase 94: Component & Hook Test Fixes** - Fix 4 failing test suites in UI and hooks (completed 2026-03-18)
- [x] **Phase 95: Tech Debt Cleanup** - Remove manual memoization and stale env vars (completed 2026-03-18)

## Phase Details

### Phase 92: Jest Configuration
**Goal**: The Jest test runner is correctly scoped and all tests pass in any execution order
**Depends on**: Nothing (foundational — must run first so fixes in 93-94 are validated correctly)
**Requirements**: JEST-01, JEST-02
**Success Criteria** (what must be TRUE):
  1. Running `npm test` does not pick up any Playwright `.spec.ts` files
  2. Running the full test suite produces the same pass/fail results regardless of which order suites execute
  3. No test fails due to shared global state leaked from a previously-run suite
**Plans:** 1/1 plans complete

Plans:
- [ ] 92-01-PLAN.md — Exclude Playwright files from Jest and validate ordering independence

### Phase 93: API & Infrastructure Test Fixes
**Goal**: All server-side and infrastructure test suites pass with no skipped or failing assertions
**Depends on**: Phase 92
**Requirements**: TFIX-01, TFIX-02, TFIX-03, TFIX-04, TFIX-05, TFIX-06, TFIX-07, TFIX-08
**Success Criteria** (what must be TRUE):
  1. `middleware.test.ts` — all 3 withIdempotency tests pass
  2. `changelogService.test.ts` — all 4 saveVersion/syncVersion tests pass
  3. `stoveApi.test.ts` — fetchWithRetry retry logging test passes
  4. `maintenanceService.test.ts` — needsCleaning threshold test passes
  5. `schedulerService.test.ts` — all 5 save/set/clear schedule tests pass
  6. `healthDeadManSwitch.test.ts` — ADMIN_USER_ID skip test passes
  7. `fritzbox/history.test.ts` — all 6 range/filter/empty tests pass
  8. `fritzbox/devices-events.test.ts` — all 6 event detection tests pass
**Plans:** 3/3 plans complete

Plans:
- [ ] 93-01-PLAN.md — Fix middleware dynamic imports + changelog missing logs (TFIX-01, TFIX-02)
- [ ] 93-02-PLAN.md — Add missing logs to stoveApi, maintenance, scheduler, health (TFIX-03, TFIX-04, TFIX-05, TFIX-06)
- [ ] 93-03-PLAN.md — Fix Fritz!Box history route + rewrite stale devices-events test (TFIX-07, TFIX-08)

### Phase 94: Component & Hook Test Fixes
**Goal**: All component and hook test suites pass with no skipped or failing assertions
**Depends on**: Phase 92
**Requirements**: TFIX-09, TFIX-10, TFIX-11, TFIX-12
**Success Criteria** (what must be TRUE):
  1. `StovePrimaryActions.test.tsx` — all 3 disable state tests pass
  2. `useNetworkData.test.ts` — stale flag timeout test passes
  3. `useDeviceHistory.test.ts` — both fetch/refresh tests pass
  4. `VersionContext.test.tsx` — all 4 version check tests pass
**Plans:** 2/2 plans complete

Plans:
- [ ] 94-01-PLAN.md — Fix StovePrimaryActions role queries + VersionContext console.log calls (TFIX-09, TFIX-12)
- [ ] 94-02-PLAN.md — Fix useNetworkData stale closure + useDeviceHistory response key (TFIX-10, TFIX-11)

### Phase 95: Tech Debt Cleanup
**Goal**: Manual memoization removed and stale environment variables deleted — the codebase reflects current architecture with no dead configuration
**Depends on**: Phase 93, Phase 94
**Requirements**: DEBT-01, DEBT-02
**Success Criteria** (what must be TRUE):
  1. No `useMemo` or `useCallback` calls remain in component/hook files that React Compiler already handles
  2. `.env.local` contains no `HOMEASSISTANT_*` or `NETATMO_*` variables (the 8 stale vars from pre-v11.0)
  3. All tests continue to pass after memoization removal (React Compiler handles it transparently)
**Plans:** 3/3 plans complete

Plans:
- [ ] 95-01-PLAN.md — Remove useMemo/useCallback from 15 high-density hook and component files (DEBT-01)
- [ ] 95-02-PLAN.md — Remove useMemo/useCallback from 48 remaining files (DEBT-01)
- [ ] 95-03-PLAN.md — Delete 8 stale env vars from .env.local (DEBT-02)

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
| 92. Jest Configuration | 1/1 | Complete    | 2026-03-18 | - |
| 93. API & Infrastructure Test Fixes | 3/3 | Complete    | 2026-03-18 | - |
| 94. Component & Hook Test Fixes | 2/2 | Complete    | 2026-03-18 | - |
| 95. Tech Debt Cleanup | 3/3 | Complete   | 2026-03-18 | - |

**Total:** 15 milestones shipped, 91 phases complete, 361 plans executed. 4 phases planned for v11.1.

---

*Roadmap updated: 2026-03-18 — Phase 95 planned (3 plans)*
