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

### Phase 44: Library Strict Mode Foundation

**Goal**: Strict TypeScript enabled with foundational library utilities fully compliant

**Depends on**: Phase 43 (v5.0 TypeScript Migration complete)

**Requirements**: STRICT-01, STRICT-02 (partial - lib/ files only)

**Success Criteria** (what must be TRUE):
1. `strict: true` enabled in tsconfig.json without breaking build
2. All lib/ utilities have explicit parameter types and return types
3. All lib/ functions handle null/undefined edge cases properly
4. tsc --noEmit shows zero errors in lib/ directory

**Plans**: TBD

Plans:
- [ ] 44-01: TBD after phase planning

---

### Phase 45: Component Strict Mode Compliance

**Goal**: All UI components comply with strict TypeScript rules

**Depends on**: Phase 44

**Requirements**: STRICT-02 (partial - components), STRICT-03 (partial - components), STRICT-04 (partial - components)

**Success Criteria** (what must be TRUE):
1. All React component props have explicit interface definitions
2. All event handlers have typed parameters with proper null checks
3. All useState/useRef/useContext hooks have explicit type arguments
4. tsc --noEmit shows zero errors in components/ and app/components/

**Plans**: TBD

Plans:
- [ ] 45-01: TBD after phase planning

---

### Phase 46: API and Page Strict Mode Compliance

**Goal**: All API routes and pages comply with strict TypeScript rules

**Depends on**: Phase 45

**Requirements**: STRICT-02 (partial - API/pages), STRICT-03 (partial - API/pages), STRICT-04 (partial - API/pages), STRICT-05, STRICT-06

**Success Criteria** (what must be TRUE):
1. All API route handlers have fully typed request/response with proper validation
2. All page components handle null/undefined from async data fetching
3. All dynamic property access uses proper type guards or optional chaining
4. tsc --noEmit shows zero errors in app/ directory (excluding test files)

**Plans**: TBD

Plans:
- [ ] 46-01: TBD after phase planning

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
| **44** | **v5.1** | **0/TBD** | **Not started** | **-** |
| **45** | **v5.1** | **0/TBD** | **Not started** | **-** |
| **46** | **v5.1** | **0/TBD** | **Not started** | **-** |
| **47** | **v5.1** | **0/TBD** | **Not started** | **-** |
| **48** | **v5.1** | **0/TBD** | **Not started** | **-** |

---
*Last updated: 2026-02-08 — v5.1 Tech Debt & Code Quality roadmap created*
