# Roadmap: Pannello Stufa v5.0 TypeScript Migration

**Created:** 2026-02-05
**Milestone:** v5.0
**Phases:** 37-43 (7 phases)
**Requirements:** 24

## Phase Summary

| Phase | Name | Goal | Requirements |
|-------|------|------|--------------|
| 37 | TypeScript Foundation | TypeScript configured with core types ready | SETUP-01, SETUP-02, SETUP-03, SETUP-04, TYPE-01, TYPE-02, TYPE-03, TYPE-04 |
| 38 | Library Migration | All lib/ files converted to TypeScript | LIB-01, LIB-02, LIB-03, LIB-04 |
| 39 | UI Components Migration | All components converted to TypeScript | COMP-01, COMP-02, COMP-03 |
| 40 | API Routes Migration | All API routes converted to TypeScript | API-01, API-02, API-03 |
| 41 | Pages Migration | All pages and layouts converted to TypeScript | PAGE-01, PAGE-02, PAGE-03 |
| 42 | Test Migration | All tests converted and passing | TEST-01, TEST-02, TEST-03, TEST-04 |
| 43 | Verification | Build passes with zero JS files remaining | VERIFY-01, VERIFY-02, VERIFY-03, VERIFY-04 |

## Phase Details

### Phase 37: TypeScript Foundation

**Goal:** TypeScript is configured and core type definitions are ready for migration.

**Plans:** 3 plans

Plans:
- [x] 37-01-PLAN.md — Configuration verification, jsconfig removal, ESLint TypeScript setup
- [x] 37-02-PLAN.md — Firebase and API type definitions
- [x] 37-03-PLAN.md — Component props and configuration types

**Requirements covered:**
- SETUP-01: TypeScript installato e configurato (tsconfig.json)
- SETUP-02: allowJs abilitato per migrazione incrementale
- SETUP-03: Path aliases configurati (@/components, @/lib, etc.)
- SETUP-04: ESLint configurato per TypeScript
- TYPE-01: Types condivisi per Firebase data structures
- TYPE-02: Types per API responses/requests patterns
- TYPE-03: Types per React component props comuni
- TYPE-04: Types per configurazioni e constants

**Success criteria:**
1. Developer can create .ts files and import them from .js files without errors
2. Developer can use @/lib, @/components path aliases in TypeScript files
3. ESLint reports TypeScript-specific errors (no-explicit-any warnings, etc.)
4. types/ directory contains shared types for Firebase, API, components, and config
5. `tsc --noEmit` passes on newly created TypeScript files

**Depends on:** None

---

### Phase 38: Library Migration

**Goal:** All 132 library files (116 in lib/ + 16 hooks) converted to TypeScript with proper typing.

**Plans:** 13 plans (9 migration + 4 gap closure)

Plans:
- [x] 38-01-PLAN.md — Leaf utilities (utils/, formatUtils, version, routes, fingerprint, env, geo, theme)
- [x] 38-02-PLAN.md — PWA utilities (lib/pwa/ — 10 browser API wrappers)
- [x] 38-03-PLAN.md — Core infrastructure (core/ API layer, Firebase, logger, auth, rate limiter)
- [x] 38-04-PLAN.md — Repositories, schemas, validators, device registry
- [x] 38-05-PLAN.md — External API clients (Thermorossi stove, Netatmo, OpenMeteo)
- [x] 38-06-PLAN.md — Philips Hue API client and notification system
- [x] 38-07-PLAN.md — Coordination system, health monitoring, high-level services
- [x] 38-08-PLAN.md — Remaining services (maintenance, scheduler, weather, dashboard, commands)
- [x] 38-09-PLAN.md — React hooks (lib/hooks/ + app/hooks/)
- [ ] 38-10-PLAN.md — Gap closure: type definitions and interface completeness (45 errors)
- [ ] 38-11-PLAN.md — Gap closure: Firestore query types and parameter interfaces (38 errors)
- [ ] 38-12-PLAN.md — Gap closure: Firebase data unknown narrowing (62 errors)
- [ ] 38-13-PLAN.md — Gap closure: Record conversion, Promise types, misc fixes (43 errors)

**Requirements covered:**
- LIB-01: Tutti i file lib/ convertiti a .ts (116 file)
- LIB-02: Hooks convertiti a .ts (lib/hooks/, app/hooks/)
- LIB-03: Utilities e helpers tipizzati
- LIB-04: Services e repositories tipizzati

**Success criteria:**
1. All 116 files in lib/ have .ts extension (no .js remaining, excluding __tests__/)
2. All hooks return properly typed values (useDebounce<T>, useOnlineStatus returns boolean, etc.)
3. Services have typed parameters and return types (Firebase operations accept typed data)
4. `tsc --noEmit` passes on lib/ directory with no errors

**Depends on:** Phase 37

---

### Phase 39: UI Components Migration

**Goal:** All ~119 UI components (64 design system + 55 application) are converted to TypeScript with typed props.

**Plans:** 11 plans (9 migration + 2 gap closure)

Plans:
- [x] 39-01-PLAN.md — Foundation UI components (23 simple typography, layout, feedback components)
- [x] 39-02-PLAN.md — Form and interaction UI components (14 buttons, inputs, selects)
- [x] 39-03-PLAN.md — Namespace and Radix UI wrapper components (12 complex namespace components)
- [x] 39-04-PLAN.md — Domain-specific and complex UI components (14 SmartHomeCard, DataTable, Skeleton, etc.)
- [x] 39-05-PLAN.md — Design system barrel export update (index.js to index.ts)
- [x] 39-06-PLAN.md — Root-level application components (18 Navbar, StovePanel, providers, etc.)
- [x] 39-07-PLAN.md — Scheduler components (14 schedule management components)
- [x] 39-08-PLAN.md — Netatmo and Lights components (7 thermostat and Hue components)
- [x] 39-09-PLAN.md — Weather, log, navigation, sandbox, layout components (16 remaining app components)
- [x] 39-10-PLAN.md — Gap closure: device card components (9 files)
- [x] 39-11-PLAN.md — Gap closure: monitoring and notification components (9 files)

**Requirements covered:**
- COMP-01: Design system components convertiti a .tsx (64 file)
- COMP-02: Application components convertiti a .tsx (~50 file)
- COMP-03: Props definite con interface/type per ogni component

**Success criteria:**
1. All 64 design system components in components/ui/ have .tsx extension
2. All ~55 application components have .tsx extension
3. Every component exports a Props interface or type
4. Component prop errors are caught at compile time (invalid prop shows TypeScript error)
5. `tsc --noEmit` passes on components/ directory with no errors

**Depends on:** Phase 38

---

### Phase 40: API Routes Migration

**Goal:** All 90 API route files are converted to TypeScript with typed request/response.

**Plans:** 7 plans (6 migration + 1 gap closure)

Plans:
- [x] 40-01-PLAN.md — Stove routes (14 Thermorossi stove API endpoints)
- [x] 40-02-PLAN.md — Netatmo routes (16 thermostat, camera, OAuth endpoints)
- [x] 40-03-PLAN.md — Hue routes (18 Philips Hue lights, scenes, remote OAuth endpoints)
- [x] 40-04-PLAN.md — Notification routes (15 push notification management endpoints)
- [x] 40-05-PLAN.md — Health/Monitoring + Scheduler/Schedules routes (10 cron and CRUD endpoints)
- [x] 40-06-PLAN.md — Config/User/Misc routes (16 admin, devices, errors, geocoding, etc.)
- [x] 40-07-PLAN.md — Gap closure: tsc error resolution and migration verification

**Requirements covered:**
- API-01: Tutti gli API routes convertiti a .ts (90 file)
- API-02: Request/Response types per ogni endpoint
- API-03: Middleware e utility API tipizzati

**Success criteria:**
1. All 90 API route files in app/api/ have .ts extension (no .js remaining)
2. Each endpoint has typed request body and response body
3. API middleware functions have typed parameters
4. `tsc --noEmit` passes on app/api/ directory with no errors

**Depends on:** Phase 38

---

### Phase 41: Pages Migration

**Goal:** All pages, layouts, providers, and co-located components are converted to TypeScript.

**Plans:** 7 plans (6 migration + 1 gap closure)

Plans:
- [x] 41-01-PLAN.md — Root files (layout, template, not-found), context providers, and 5 simple standalone pages
- [x] 41-02-PLAN.md — Thermostat pages and co-located schedule components (11 files)
- [x] 41-03-PLAN.md — Stove, lights, netatmo, and camera pages with co-located components (14 files)
- [x] 41-04-PLAN.md — Settings pages and NotificationSettingsForm (10 files)
- [x] 41-05-PLAN.md — Debug pages, DeliveryChart, and design-system page (10 files)
- [x] 41-06-PLAN.md — Debug tab components and design-system doc components (19 files)
- [x] 41-07-PLAN.md — Gap closure: tsc error resolution and migration verification

**Requirements covered:**
- PAGE-01: Layout e page files convertiti a .tsx
- PAGE-02: Context providers convertiti a .tsx
- PAGE-03: Loading/Error/Not-found states tipizzati

**Success criteria:**
1. All layout.tsx and page.tsx files converted (no .jsx remaining in app/)
2. All context providers have typed context values and provider props
3. Loading, error, and not-found pages are typed
4. `tsc --noEmit` passes on app/ pages directory with no errors

**Depends on:** Phase 39, Phase 40

---

### Phase 42: Test Migration

**Goal:** All test files are converted to TypeScript and passing.

**Plans:** 7 plans (6 migration + 1 verification/gap closure)

Plans:
- [x] 42-01-PLAN.md — Jest config, setup, and __mocks__/ migration to TypeScript (5 files)
- [x] 42-02-PLAN.md — lib/ test files migration: lib/__tests__/, core, hooks, hue, pwa, services, utils (31 files)
- [x] 42-03-PLAN.md — Root __tests__/ lib, api, utils, hooks, and root-level service tests (31 files)
- [x] 42-04-PLAN.md — UI component tests batch 1: accessibility through Kbd (26 files)
- [x] 42-05-PLAN.md — UI component tests batch 2: Label through Tooltip (25 files)
- [x] 42-06-PLAN.md — Remaining app/ tests: hooks, context, API routes, components, thermostat (18 files)
- [x] 42-07-PLAN.md — Full test suite verification, tsc check, and gap closure

**Requirements covered:**
- TEST-01: Test files lib/ convertiti a .ts
- TEST-02: Test files components/ convertiti a .tsx
- TEST-03: Jest configurato per TypeScript
- TEST-04: Tutti i test passano dopo migrazione

**Success criteria:**
1. All test files in __tests__/ have .ts or .tsx extension (no .js/.jsx)
2. Jest is configured with ts-jest or equivalent TypeScript support
3. Test mocks and fixtures are typed
4. `npm test` passes with all existing tests green
5. No test failures introduced by TypeScript migration

**Depends on:** Phase 38, Phase 39

---

### Phase 43: Verification

**Goal:** TypeScript migration is complete with passing build and zero JS files.

**Plans:** 8 plans

Plans:
- [ ] 43-01-PLAN.md — Shared mock type utilities and full external API type definitions
- [ ] 43-02-PLAN.md — Fix all 170 non-test source file tsc errors (29 pages/components)
- [ ] 43-03-PLAN.md — Fix mock type errors in 8 high-error UI component tests (688 errors)
- [ ] 43-04-PLAN.md — Fix mock type errors in 19 lib/ test files (350 errors)
- [ ] 43-05-PLAN.md — Fix mock type errors in 21 __tests__/ and API route tests (520 errors)
- [ ] 43-06-PLAN.md — Fix mock type errors in remaining 32 test files (445 errors)
- [ ] 43-07-PLAN.md — Fix all 25 failing test runtime errors (11 test suites)
- [ ] 43-08-PLAN.md — Config file conversion, final lockdown, and full validation

**Requirements covered:**
- VERIFY-01: `npm run build` completa senza errori
- VERIFY-02: `tsc --noEmit` passa (type check)
- VERIFY-03: Zero file .js/.jsx rimanenti (escluso config)
- VERIFY-04: Dev server funziona correttamente

**Success criteria:**
1. `npm run build` completes successfully with no TypeScript errors
2. `tsc --noEmit` passes with exit code 0
3. `find app lib components -name "*.js" -o -name "*.jsx"` returns empty (config files excluded)
4. `npm run dev` starts successfully and all pages load without errors
5. Application functionality works identically to pre-migration state

**Depends on:** Phase 41, Phase 42

---

## Progress

| Phase | Status | Plans | Completion |
|-------|--------|-------|------------|
| 37 - TypeScript Foundation | ✓ Complete | 3/3 | 100% |
| 38 - Library Migration | ✓ Complete | 13/13 | 100% |
| 39 - UI Components Migration | ✓ Complete | 11/11 | 100% |
| 40 - API Routes Migration | ✓ Complete | 7/7 | 100% |
| 41 - Pages Migration | ✓ Complete | 7/7 | 100% |
| 42 - Test Migration | ✓ Complete | 7/7 | 100% |
| 43 - Verification | In Progress | 0/8 | 0% |

---
*Roadmap created: 2026-02-05*
*Last updated: 2026-02-07 — Phase 43 planned (8 plans in 4 waves: fix 1654 tsc errors, 25 test failures, config conversion, final lockdown)*
