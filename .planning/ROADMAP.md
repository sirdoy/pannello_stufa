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
- 🚧 **v14.1 Tech Debt & Type Safety** — Phases 113-117 (in progress)

## Phases

<details>
<summary>✅ v14.0 Hue Proxy Migration (Phases 106-112) — SHIPPED 2026-03-22</summary>

- [x] Phase 106: Proxy Client + Types + Read Endpoints (2/2 plans) — completed 2026-03-20
- [x] Phase 107: Control Endpoints (2/2 plans) — completed 2026-03-20
- [x] Phase 108: Frontend Hooks Rewrite (2/2 plans) — completed 2026-03-21
- [x] Phase 109: Cleanup (2/2 plans) — completed 2026-03-21
- [x] Phase 110: Fix Full Pages for Proxy (2/2 plans) — completed 2026-03-21
- [x] Phase 111: Type Completeness & Checkbox Sync (1/1 plan) — completed 2026-03-21
- [x] Phase 112: Debug Panel Hue Fixes (1/1 plan) — completed 2026-03-21

</details>

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
<summary>✅ Earlier milestones (v1.0-v12.0)</summary>

See `.planning/milestones/` for full archives.

</details>

### v14.1 Tech Debt & Type Safety (In Progress)

**Milestone Goal:** Resolve accumulated known issues from v14.0 audit, eliminate `as any` casts across lib/ and app/, and remove dead code — leaving the codebase with zero known issues, tighter types, and a smaller surface area.

- [x] **Phase 113: Known Issues Fix** - Correct debug panel field names, remove stale code paths, fix FormModal flake (completed 2026-03-22)
- [x] **Phase 114: Type Safety lib/** - Eliminate `as any` across lib/ layer (admin, network, notifications, rooms, device config, firebase) (completed 2026-03-22)
- [x] **Phase 115: Type Safety app/ Components** - Eliminate `as any` in component icon/spread/variant patterns and fix specific component types (completed 2026-03-22)
- [x] **Phase 116: Type Safety app/ Routes & Pages** - Eliminate `as any` in API routes and page files (scheduler, Netatmo, weather, thermostat/stove, service worker) (completed 2026-03-22)
- [ ] **Phase 117: Dead Code & Cleanup** - Remove 121 in-scope unused exports, resolve 2 outstanding TODOs

## Phase Details

### Phase 113: Known Issues Fix
**Goal**: All known issues from the v14.0 audit are resolved — debug panel fields are accurate, stale stove code is removed, stove status is correctly typed, UI uses design system components, and FormModal is isolation-stable
**Depends on**: Phase 112 (v14.0 complete)
**Requirements**: ISSUE-01, ISSUE-02, ISSUE-03, ISSUE-04, ISSUE-05, ISSUE-06
**Success Criteria** (what must be TRUE):
  1. Debug panel HueTab displays correct field names (`connected`, `bri`) matching actual proxy response shape
  2. `UseStoveDataReturn.status` is typed as `StoveState` union — TypeScript rejects plain `string` assignments at call sites
  3. `staleness.cachedAt` code path is gone from stove hook — no dead null-check branch exists in the file
  4. CopyableIp renders a design system `Button` component — no raw `<button>` element remains in that file
  5. FormModal test suite passes in isolation without ordering dependencies
**Plans:** 1/1 plans complete

Plans:
- [x] 113-01-PLAN.md — Fix all 6 known issues (HueTab fields, stove staleness, CopyableIp button, FormModal flake)

### Phase 114: Type Safety lib/
**Goal**: All `as any` casts in the lib/ layer are replaced with proper typed interfaces — adminDbGet returns typed values, browser APIs have typed wrappers, and service utilities access data without unsafe casts
**Depends on**: Phase 113
**Requirements**: TYPE-01, TYPE-02, TYPE-03, TYPE-04, TYPE-05, TYPE-06
**Success Criteria** (what must be TRUE):
  1. `adminDbGet()` calls return typed values — TypeScript infers the correct type at call sites without manual casts
  2. `navigator.connection` accesses are guarded by a typed Network Information API interface — no `as any` remains
  3. `Notification.maxActions` has a type guard — accessing it does not require a cast
  4. `useRoomStatus` room data is typed — no `as any[]` cast remains in the hook
  5. `unifiedDeviceConfigService` meta access is typed — no `as any` for meta property access
**Plans:** 2/2 plans complete

Plans:
- [x] 114-01-PLAN.md — Generic adminDbGet + error type guards + preferences mapping (firebaseAdmin.ts)
- [x] 114-02-PLAN.md — Browser API augmentations + room typing + device config meta + adminDbGet call sites

### Phase 115: Type Safety app/ Components
**Goal**: Component files in app/ have no `as any` casts — icon props, spread patterns, variant props, and specific component internals are all expressible through proper TypeScript types
**Depends on**: Phase 114
**Requirements**: TYPE-07, TYPE-08, TYPE-09, TYPE-10, TYPE-11, TYPE-12
**Success Criteria** (what must be TRUE):
  1. Icon props (`<X /> as any`) are eliminated — icon components accept a typed prop (e.g., `React.ComponentType`) without casting
  2. Component spread patterns (`{...({} as any)}`) are eliminated — spreads use typed objects
  3. Variant prop casts are eliminated — variant props use typed union literals matching CVA definitions
  4. `DeviceCard` banner, action, and toast props align — no structural mismatch requires a cast at usage sites
  5. `TransitionLink` and `ControlButton` internal types are explicit — no `_warned` or return type casts remain
**Plans:** 2/2 plans complete

Plans:
- [x] 115-01-PLAN.md — Foundation types: Button/LoadingOverlay icon widening, DeviceCard interface restructuring, empty spread fixes, ControlButton WeakSet, TransitionLink cast removal
- [x] 115-02-PLAN.md — Consumer fixes: icon cast removals, StoveCard variant typing, LightsCard/RoomControl types, ThermostatCard schedule/routes, WeatherCardWrapper, RoomCard JSX, DataTable label

### Phase 116: Type Safety app/ Routes & Pages
**Goal**: API route files and page components in app/ have no `as any` casts — scheduler, Netatmo, weather, thermostat/stove, and service worker files are fully typed
**Depends on**: Phase 115
**Requirements**: TYPE-13, TYPE-14, TYPE-15, TYPE-16, TYPE-17
**Success Criteria** (what must be TRUE):
  1. Scheduler route `adminDbGet` calls have specific return interfaces — no `as any` casts remain in that file
  2. Netatmo homestatus `modulesFromTopology` is typed — battery functions receive typed module objects
  3. Weather forecast route response is typed with an interface — no `as any` in the response handling path
  4. Thermostat and stove page prop casts are eliminated — props flow with proper types from server to client components
  5. `sw.ts` browser API casts use proper interfaces — no `as any` for Push API, Notification API, or Cache API access
**Plans:** 2/2 plans complete

Plans:
- [x] 116-01-PLAN.md — API routes + sw.ts: scheduler adminDbGet<T> generics, source union widening, Netatmo battery typing, weather response types, sw.ts declare global for Badging/PeriodicSync APIs
- [x] 116-02-PLAN.md — Page components: thermostat/stove/monitoring/log/settings prop type alignment, export types from child components, canonical ScheduleInterval imports

### Phase 117: Dead Code & Cleanup
**Goal**: The 121 in-scope unused exports identified by knip are removed, and two outstanding service TODOs are resolved with proper implementations
**Depends on**: Phase 116
**Requirements**: CLEAN-01, CLEAN-02, CLEAN-03
**Success Criteria** (what must be TRUE):
  1. `knip` reports zero unused exports in utility files (the 121 in-scope exports are gone)
  2. `notificationService.ts` TODO is resolved — cleanup logic runs in an API route, not inline in the service
  3. `healthMonitoring.ts` TODO is resolved — stove STARTING state has grace period tracking before triggering alerts
**Plans:** 1/2 plans executed

Plans:
- [ ] 117-01-PLAN.md — Remove unused exports from lib/ utilities and app/ files (knip cleanup)
- [x] 117-02-PLAN.md — Delete notificationService disabled block + implement STARTING grace period tracking

## Progress

**Execution Order:**
Phases execute in numeric order: 113 -> 114 -> 115 -> 116 -> 117

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
| 106-112 | v14.0 | 12/12 | ✓ Complete | 2026-03-22 |
| 113. Known Issues Fix | v14.1 | 1/1 | Complete    | 2026-03-22 |
| 114. Type Safety lib/ | v14.1 | 2/2 | Complete    | 2026-03-22 |
| 115. Type Safety app/ Components | v14.1 | 2/2 | Complete    | 2026-03-22 |
| 116. Type Safety app/ Routes & Pages | v14.1 | 2/2 | Complete    | 2026-03-22 |
| 117. Dead Code & Cleanup | v14.1 | 1/2 | In Progress|  |

**Total:** 19 milestones shipped, 112 phases complete, 398 plans executed. v14.1 in progress (5 phases planned).

---

*Roadmap updated: 2026-03-22 — Phase 117 planned (2 plans)*
