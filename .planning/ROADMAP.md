# Roadmap: Pannello Stufa

## Milestones

- ✅ **v1.0 Push Notifications** — Phases 1-5 (shipped 2026-01-26)
- ✅ **v2.0 Netatmo Complete Control** — Phases 6-10 (shipped 2026-01-28)
- ✅ **v3.0 Design System Evolution** — Phases 11-18 (shipped 2026-01-30)
- ✅ **v3.1 Design System Compliance** — Phases 19-24 (shipped 2026-02-02)
- ✅ **v3.2 Dashboard & Weather** — Phases 25-29 (shipped 2026-02-03)
- ✅ **v4.0 Advanced UI Components** — Phases 30-36 (shipped 2026-02-05)
- ✅ **v5.0 TypeScript Migration** — Phases 37-43 (shipped 2026-02-08)
- 🚧 **v5.1 Tech Debt & Code Quality** — Phases 44-48 (in progress)

## Phases

<details>
<summary>✅ v5.0 TypeScript Migration (Phases 37-43) — SHIPPED 2026-02-08</summary>

- [x] Phase 37: TypeScript Foundation (3/3 plans)
- [x] Phase 38: Library Migration (13/13 plans)
- [x] Phase 39: UI Components Migration (11/11 plans)
- [x] Phase 40: API Routes Migration (7/7 plans)
- [x] Phase 41: Pages Migration (7/7 plans)
- [x] Phase 42: Test Migration (7/7 plans)
- [x] Phase 43: Verification (8/8 plans)

</details>

<details>
<summary>✅ v4.0 Advanced UI Components (Phases 30-36) — SHIPPED 2026-02-05</summary>

- [x] Phase 30: Popover & Tabs (3/3 plans)
- [x] Phase 31: Accordion & Sheet (3/3 plans)
- [x] Phase 32: RightClickMenu & CommandPalette (3/3 plans)
- [x] Phase 33: ConfirmationDialog & FormModal (3/3 plans)
- [x] Phase 34: DataTable (4/4 plans)
- [x] Phase 35: CSS Animation System (4/4 plans)
- [x] Phase 36: Application Integration (4/4 plans)

</details>

<details>
<summary>✅ Earlier milestones (v1.0-v3.2)</summary>

See `.planning/milestones/` for full archives.

</details>

---

## 🚧 v5.1 Tech Debt & Code Quality

**Milestone Goal:** Achieve a pristine codebase — zero tsc errors everywhere (including tests), all tests green, stricter TypeScript compiler options (strict: true, noUncheckedIndexedAccess), and dead code removed.

**Context:** After completing v5.0 TypeScript migration, the codebase has ~1841 tsc errors when strict mode is enabled (768 noImplicitAny, 188 strictNullChecks, 419 type mismatch, 91 implicit index access, 436 noUncheckedIndexedAccess, 30 misc). These errors span ~531 source files + ~131 test files. Additionally, 1 test is failing (FormModal cancel behavior) and dead code needs removal.

### Phase 44: Library Strict Mode Foundation ✓

**Goal**: Strict TypeScript enabled with foundational library utilities fully compliant

**Depends on**: Phase 43 (v5.0 TypeScript Migration complete)

**Requirements**: STRICT-01, STRICT-02 (partial - lib/ files only)

**Completed**: 2026-02-09 | **Verified**: passed (4/4 must-haves)

**Plans**: 7/7 complete

Plans:
- [x] 44-01-PLAN.md — Enable strict mode + fix miscellaneous lib/ files
- [x] 44-02-PLAN.md — Fix notification triggers + filter
- [x] 44-03-PLAN.md — Fix notification services
- [x] 44-04-PLAN.md — Fix Firebase + services
- [x] 44-05-PLAN.md — Fix Netatmo + coordination + scheduler
- [x] 44-06-PLAN.md — Fix hooks + PWA
- [x] 44-07-PLAN.md — Fix test files + final verification (zero lib/ errors confirmed)

---

### Phase 45: Component Strict Mode Compliance ✓

**Goal**: All UI components comply with strict TypeScript rules

**Depends on**: Phase 44

**Requirements**: STRICT-02 (partial - components), STRICT-03 (partial - components), STRICT-04 (partial - components)

**Completed**: 2026-02-09 | **Verified**: passed (4/4 must-haves)

**Plans**: 8/8 complete

Plans:
- [x] 45-01-PLAN.md — Fix LightsCard (52) + ThermostatCard (37) strict-mode errors
- [x] 45-02-PLAN.md — Fix StoveCard, GlassEffect, camera components strict-mode errors
- [x] 45-03-PLAN.md — Fix 20 UI source components strict-mode errors
- [x] 45-04-PLAN.md — Fix panels: PidAutomation, Sandbox, Notifications, Navbar, StovePanel
- [x] 45-05-PLAN.md — Fix scheduler, lights, navigation, standalone components
- [x] 45-06-PLAN.md — Fix Toast.test.tsx (48) + FormModal.test.tsx (26) strict-mode errors
- [x] 45-07-PLAN.md — Fix 18 remaining test files strict-mode errors
- [x] 45-08-PLAN.md — Gap sweep + final verification

---

### Phase 46: API and Page Strict Mode Compliance ✓

**Goal**: All API routes and pages comply with strict TypeScript rules

**Depends on**: Phase 45

**Requirements**: STRICT-02 (partial - API/pages), STRICT-03 (partial - API/pages), STRICT-04 (partial - API/pages), STRICT-05, STRICT-06

**Completed**: 2026-02-09 | **Verified**: passed (4/4 must-haves)

**Plans**: 8/8 complete

Plans:
- [x] 46-01-PLAN.md — Fix 45 strict-mode errors in stove scheduler page
- [x] 46-02-PLAN.md — Fix lights page (24) and stove page (17) strict-mode errors
- [x] 46-03-PLAN.md — Fix scenes, camera, notification history, log, hooks, and single-error pages (33 errors)
- [x] 46-04-PLAN.md — Fix Hue, Netatmo, and Stove API route errors (22 errors)
- [x] 46-05-PLAN.md — Fix scheduler check, notification, geocoding, and health API route errors (23 errors)
- [x] 46-06-PLAN.md — Fix 18 debug tab components and debug pages (40 errors)
- [x] 46-07-PLAN.md — Fix design-system page (20) and CodeBlock (2) strict-mode errors
- [x] 46-08-PLAN.md — Gap sweep and final verification

---

### Phase 47: Test Strict Mode and Index Access

**Goal**: All test files comply with strict mode and noUncheckedIndexedAccess enabled codebase-wide

**Depends on**: Phase 46

**Requirements**: STRICT-02 (test files), STRICT-07, STRICT-08, TEST-01, TEST-02, TEST-03

**Success Criteria** (what must be TRUE):
1. All test files pass strict TypeScript checks with proper mock typing
2. `noUncheckedIndexedAccess: true` enabled with proper undefined checks throughout codebase
3. FormModal cancel test passes green (onClose called exactly once)
4. Worker teardown warning resolved (no force-exit messages)
5. All 3032+ tests passing green with zero failures

**Plans**: TBD

Plans:
- [ ] 47-01: TBD after phase planning

---

### Phase 48: Dead Code Removal and Final Verification

**Goal**: Codebase cleaned of unused code and all quality checks passing

**Depends on**: Phase 47

**Requirements**: DEAD-01, DEAD-02, DEAD-03

**Success Criteria** (what must be TRUE):
1. Zero unused exports detected (verified by ESLint or ts-prune)
2. Zero unused files in codebase (verified by dependency analysis)
3. package.json contains only actively used dependencies (no orphaned packages)
4. Production build completes successfully in under 35 seconds
5. Development server runs without errors or warnings with strict config

**Plans**: TBD

Plans:
- [ ] 48-01: TBD after phase planning

---

## Progress

| Phase | Milestone | Plans | Status | Completed |
|-------|-----------|-------|--------|-----------|
| 37-43 | v5.0 | 56/56 | ✓ Complete | 2026-02-08 |
| 30-36 | v4.0 | 24/24 | ✓ Complete | 2026-02-05 |
| 25-29 | v3.2 | 13/13 | ✓ Complete | 2026-02-03 |
| 19-24 | v3.1 | 13/13 | ✓ Complete | 2026-02-02 |
| 11-18 | v3.0 | 52/52 | ✓ Complete | 2026-01-30 |
| 6-10 | v2.0 | 21/21 | ✓ Complete | 2026-01-28 |
| 1-5 | v1.0 | 29/29 | ✓ Complete | 2026-01-26 |
| **44** | **v5.1** | **7/7** | **✓ Complete** | **2026-02-09** |
| **45** | **v5.1** | **8/8** | **✓ Complete** | **2026-02-09** |
| **46** | **v5.1** | **8/8** | **✓ Complete** | **2026-02-09** |
| **47** | **v5.1** | **0/TBD** | **Not started** | **-** |
| **48** | **v5.1** | **0/TBD** | **Not started** | **-** |

---
*Last updated: 2026-02-09 — Phase 46 complete (8/8 plans, verified passed)*
