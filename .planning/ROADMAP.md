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
- 🚧 **v7.0 Performance & Resilience** — Phases 55-60 (in progress)

## Phases

<details>
<summary>✅ v6.0 Operations, PWA & Analytics (Phases 49-54) — SHIPPED 2026-02-11</summary>

- [x] Phase 49: Persistent Rate Limiting (4/4 plans)
- [x] Phase 50: Cron Automation Configuration (4/4 plans)
- [x] Phase 51: E2E Test Improvements (4/4 plans)
- [x] Phase 52: Interactive Push Notifications (3/3 plans)
- [x] Phase 53: PWA Offline Improvements (5/5 plans)
- [x] Phase 54: Analytics Dashboard & Consent (9/9 plans)

</details>

<details>
<summary>✅ v5.1 Tech Debt & Code Quality (Phases 44-48) — SHIPPED 2026-02-10</summary>

- [x] Phase 44: Library Strict Mode Foundation (7/7 plans)
- [x] Phase 45: Component Strict Mode Compliance (8/8 plans)
- [x] Phase 46: API and Page Strict Mode Compliance (8/8 plans)
- [x] Phase 47: Test Strict Mode and Index Access (10/10 plans)
- [x] Phase 48: Dead Code Removal and Final Verification (6/6 plans)

</details>

<details>
<summary>✅ Earlier milestones (v1.0-v5.0)</summary>

See `.planning/milestones/` for full archives.

</details>

---

### 🚧 v7.0 Performance & Resilience (In Progress)

**Milestone Goal:** Harden the application with smart retry strategies for transient failures, adaptive polling for resource efficiency, graceful error boundaries, component refactoring for large files (1000+ LOC), critical path test coverage, and automated FCM token cleanup.

#### Phase 55: Retry Infrastructure

**Goal**: Device commands and API calls recover automatically from transient failures with exponential backoff and idempotency protection.

**Depends on**: Nothing (first phase)

**Requirements**: RETRY-01, RETRY-02, RETRY-03, RETRY-04, RETRY-05, RETRY-06

**Success Criteria** (what must be TRUE):
1. User sees toast notification when device command fails with network error
2. Transient network errors auto-retry up to 3 times without user intervention
3. Device-offline errors show toast with manual "Retry" button (no auto-retry)
4. Stove ignite/shutdown commands use idempotency keys to prevent duplicate physical actions
5. Request deduplication prevents double-tap from sending duplicate commands within 2-second window

**Plans**: 5 plans

Plans:
- [x] 55-01-PLAN.md — Retry client with exponential backoff + deduplication manager (TDD)
- [x] 55-02-PLAN.md — Idempotency key manager with Firebase RTDB storage (TDD)
- [x] 55-03-PLAN.md — Persistent error toasts + useRetryableCommand hook
- [x] 55-04-PLAN.md — Server-side idempotency middleware (withIdempotency)
- [x] 55-05-PLAN.md — Device card integration + API route wiring + visual verification

---

#### Phase 56: Error Boundaries

**Goal**: Application continues functioning when individual device cards crash, showing fallback UI instead of blank screen.

**Depends on**: Phase 55

**Requirements**: ERR-01, ERR-02, ERR-03, ERR-04, ERR-05, ERR-06

**Success Criteria** (what must be TRUE):
1. Unhandled error in StoveCard displays fallback UI without crashing entire dashboard
2. Unhandled error in LightsCard displays fallback UI without affecting other device cards
3. Error boundaries show user-friendly message with "Try Again" button that resets component
4. Clicking "Try Again" clears error state and re-mounts component with fresh data
5. Validation errors (needsCleaning, maintenance alerts) bypass error boundary and show proper UI
6. Component errors automatically log to Firebase Analytics for monitoring

**Plans**: 2 plans

Plans:
- [x] 56-01-PLAN.md — Foundation: ValidationError class, error analytics API, global error.tsx
- [x] 56-02-PLAN.md — Feature error boundaries, homepage integration, tests

---

#### Phase 57: Adaptive Polling

**Goal**: Polling automatically adjusts based on tab visibility and network conditions to reduce resource usage without compromising safety.

**Depends on**: Phase 56

**Requirements**: POLL-01, POLL-02, POLL-03, POLL-04, POLL-05

**Success Criteria** (what must be TRUE):
1. Polling stops when browser tab becomes hidden (Page Visibility API)
2. Polling resumes immediately when tab becomes visible again
3. Stove status maintains fixed 5-second interval when tab is active (never adaptive)
4. Non-critical data (weather, FCM tokens) reduces polling frequency on slow network
5. Staleness indicator appears on device cards when data is older than expected refresh interval

**Plans**: 3 plans

Plans:
- [x] 57-01-PLAN.md — Core hooks: useVisibility, useNetworkQuality, useAdaptivePolling (TDD)
- [x] 57-02-PLAN.md — ThermostatCard, LightsCard, CronHealthBanner integration
- [x] 57-03-PLAN.md — StoveCard visibility-aware staleness + useDeviceStaleness pause

---

#### Phase 58: StoveCard Refactoring

**Goal**: StoveCard split into maintainable sub-components using orchestrator pattern with single polling loop and error boundary per section.

**Depends on**: Phase 57

**Requirements**: REFAC-01, REFAC-04, REFAC-05

**Success Criteria** (what must be TRUE):
1. StoveCard main file reduced from 1510 LOC to ~200 LOC orchestrator
2. StoveCard functionality split into 5-6 sub-components of 150-250 LOC each
3. Single polling loop in orchestrator prevents request multiplication
4. Complex state logic extracted into custom hooks for reusability
5. Parent orchestrator manages state, children are presentational components receiving props

**Plans**: 3 plans

Plans:
- [x] 58-01-PLAN.md — Extract custom hooks (useStoveData, useStoveCommands) and status utilities
- [x] 58-02-PLAN.md — Extract StoveStatus, StovePrimaryActions, StoveBanners sub-components
- [x] 58-03-PLAN.md — Extract StoveModeControl, StoveAdjustments, StoveMaintenance and finalize orchestrator

---

#### Phase 59: LightsCard & Page Refactoring

**Goal**: LightsCard and stove/page.tsx split using orchestrator pattern established in Phase 58.

**Depends on**: Phase 58

**Requirements**: REFAC-02, REFAC-03, REFAC-04, REFAC-05

**Success Criteria** (what must be TRUE):
1. LightsCard reduced from 1203 LOC to ~200 LOC orchestrator with 4-5 sub-components
2. stove/page.tsx reduced from 1066 LOC to ~200 LOC orchestrator with 4 sub-components
3. Both components follow Phase 58 orchestrator pattern (single polling, props-based data flow)
4. Complex state logic extracted into reusable custom hooks
5. Visual output and functionality unchanged after refactoring

**Plans**: 4 plans

Plans:
- [x] 59-01-PLAN.md — Extract useLightsData and useLightsCommands hooks
- [x] 59-02-PLAN.md — Create LightsBanners, LightsHouseControl, LightsRoomControl, LightsScenes components
- [x] 59-03-PLAN.md — Refactor LightsCard.tsx as orchestrator (wire hooks + components)
- [x] 59-04-PLAN.md — Refactor stove/page.tsx as orchestrator (reuse StoveCard hooks + page-specific components)

---

#### Phase 60: Critical Path Testing & Token Cleanup

**Goal**: Scheduler check route has comprehensive unit test coverage and automated FCM token cleanup prevents unbounded growth.

**Depends on**: Phase 59

**Requirements**: TEST-01, TEST-02, TEST-03, TEST-04, TOKEN-01, TOKEN-02, TOKEN-03, TOKEN-04

**Success Criteria** (what must be TRUE):
1. /api/scheduler/check has unit tests covering all execution paths (OFF → START → WORK transitions)
2. Scheduler tests cover error scenarios (API timeout, invalid state, stove offline)
3. Scheduler route achieves 80%+ branch coverage per Jest coverage report
4. Automated cron job deletes stale FCM tokens based on last delivery timestamp (not app open)
5. Active tokens (recent notification delivery) never deleted by cleanup process
6. Token cleanup logs all deletions to Firebase for audit trail

**Plans**: 5 plans

Plans:
- [x] 60-01-PLAN.md — Extract token cleanup to shared service, update lastUsed on FCM delivery, add audit trail
- [x] 60-02-PLAN.md — Scheduler check route tests: modes, early returns, stove data fetch, side effects
- [x] 60-03-PLAN.md — Token cleanup service unit tests (TDD)
- [x] 60-04-PLAN.md — Scheduler state transitions, error scenarios, PID, 80%+ branch coverage
- [ ] 60-05-PLAN.md — Gap closure: fire-and-forget helper branch coverage to reach 80%+ target

---

## Progress

**Execution Order:** Phases 55 → 56 → 57 → 58 → 59 → 60

| Phase | Milestone | Plans | Status | Completed |
|-------|-----------|-------|--------|-----------|
| 1-5 | v1.0 | 29/29 | ✓ Complete | 2026-01-26 |
| 6-10 | v2.0 | 21/21 | ✓ Complete | 2026-01-28 |
| 11-18 | v3.0 | 52/52 | ✓ Complete | 2026-01-30 |
| 19-24 | v3.1 | 13/13 | ✓ Complete | 2026-02-02 |
| 25-29 | v3.2 | 13/13 | ✓ Complete | 2026-02-03 |
| 30-36 | v4.0 | 24/24 | ✓ Complete | 2026-02-05 |
| 37-43 | v5.0 | 56/56 | ✓ Complete | 2026-02-08 |
| 44-48 | v5.1 | 39/39 | ✓ Complete | 2026-02-10 |
| 49-54 | v6.0 | 29/29 | ✓ Complete | 2026-02-11 |
| 55 | v7.0 | 5/5 | ✓ Complete | 2026-02-12 |
| 56 | v7.0 | 2/2 | ✓ Complete | 2026-02-12 |
| 57 | v7.0 | 3/3 | ✓ Complete | 2026-02-12 |
| 58 | v7.0 | 3/3 | ✓ Complete | 2026-02-12 |
| 59 | v7.0 | 4/4 | ✓ Complete | 2026-02-13 |
| 60 | v7.0 | 4/5 | In progress | - |

**Total:** 9 milestones shipped, 58 phases complete, 290 plans executed

---

*Roadmap updated: 2026-02-11 — v7.0 phases defined*
