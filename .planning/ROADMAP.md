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
- 🚧 **v12.0 Data Fetching Simplification & E2E Verification** — Phases 96-97 (in progress)

## Phases

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

### 🚧 v12.0 Data Fetching Simplification & E2E Verification (In Progress)

**Milestone Goal:** Ridurre il carico sul server unificando tutto il polling a 60s via useAdaptivePolling, rimuovendo il Firebase RTDB listener real-time della stufa e sync-external-state, ed aggiungere Playwright tests che verificano ogni pagina carica correttamente.

#### Phase 96: Polling Simplification

- [ ] **Phase 96: Polling Simplification** - Unify all device hooks to 60s useAdaptivePolling, remove Firebase RTDB stove listener and sync-external-state

#### Phase 97: E2E Page Verification

- [ ] **Phase 97: E2E Page Verification** - Playwright tests verifying every app page loads without errors

## Phase Details

### Phase 96: Polling Simplification
**Goal**: All device polling runs through useAdaptivePolling at 60s intervals, with the Firebase RTDB real-time listener and sync-external-state removed from the stove hook
**Depends on**: Nothing (first phase of milestone)
**Requirements**: POLL-01, POLL-02, POLL-03, POLL-04, POLL-05, POLL-06, POLL-07, POLL-08
**Success Criteria** (what must be TRUE):
  1. StoveCard fetches data on a 60s interval via useAdaptivePolling with no Firebase RTDB listener attached
  2. No call to sync-external-state exists anywhere in the stove data fetching path
  3. ThermostatCard, LightsCard, NetworkCard, and RaspiCard each poll at 60s (visible) and 5min (hidden)
  4. useDeviceStaleness no longer runs a 5s polling loop — threshold check happens at 60s or on demand
**Plans**: TBD

Plans:
- [ ] 96-01: Rewrite stove hook to use useAdaptivePolling (remove RTDB listener and sync-external-state)
- [ ] 96-02: Extend remaining card hooks polling intervals to 60s

### Phase 97: E2E Page Verification
**Goal**: Every application page has a Playwright test that verifies it loads, shows content, and produces no console errors
**Depends on**: Phase 96
**Requirements**: E2E-01, E2E-02, E2E-03, E2E-04, E2E-05, E2E-06, E2E-07, E2E-08, E2E-09, E2E-10
**Success Criteria** (what must be TRUE):
  1. Homepage Playwright test confirms all visible dashboard cards render without JS errors
  2. Each device page (/stove, /thermostat, /lights, /network, /raspi) has a test confirming data section is visible
  3. Support pages (/analytics, /settings, /admin) each have a test confirming the page loads without error state
  4. No page produces a console error or enters an infinite loading state during any test run
**Plans**: TBD

Plans:
- [ ] 97-01: Write Playwright page-load tests for all app pages

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
| 96 | v12.0 | 0/TBD | Not started | - |
| 97 | v12.0 | 0/TBD | Not started | - |

**Total:** 16 milestones shipped, 95 phases complete, 370 plans executed. v12.0 in progress.

---

*Roadmap updated: 2026-03-18 — v12.0 milestone started*
