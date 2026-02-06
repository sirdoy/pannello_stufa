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

**Plans:** 9 plans

Plans:
- [ ] 38-01-PLAN.md — Leaf utilities (utils/, formatUtils, version, routes, fingerprint, env, geo, theme)
- [ ] 38-02-PLAN.md — PWA utilities (lib/pwa/ — 10 browser API wrappers)
- [ ] 38-03-PLAN.md — Core infrastructure (core/ API layer, Firebase, logger, auth, rate limiter)
- [ ] 38-04-PLAN.md — Repositories, schemas, validators, device registry
- [ ] 38-05-PLAN.md — External API clients (Thermorossi stove, Netatmo, OpenMeteo)
- [ ] 38-06-PLAN.md — Philips Hue API client and notification system
- [ ] 38-07-PLAN.md — Coordination system, health monitoring, high-level services
- [ ] 38-08-PLAN.md — Remaining services (maintenance, scheduler, weather, dashboard, commands)
- [ ] 38-09-PLAN.md — React hooks (lib/hooks/ + app/hooks/)

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

**Goal:** All UI components are converted to TypeScript with typed props.

**Plans:** (created by /gsd:plan-phase)

**Requirements covered:**
- COMP-01: Design system components convertiti a .tsx (64 file)
- COMP-02: Application components convertiti a .tsx (~50 file)
- COMP-03: Props definite con interface/type per ogni component

**Success criteria:**
1. All 64 design system components in components/ui/ have .tsx extension
2. All ~50 application components have .tsx extension
3. Every component exports a Props interface or type
4. Component prop errors are caught at compile time (invalid prop shows TypeScript error)
5. `tsc --noEmit` passes on components/ directory with no errors

**Depends on:** Phase 38

---

### Phase 40: API Routes Migration

**Goal:** All API routes are converted to TypeScript with typed request/response.

**Plans:** (created by /gsd:plan-phase)

**Requirements covered:**
- API-01: Tutti gli API routes convertiti a .ts (~80 file)
- API-02: Request/Response types per ogni endpoint
- API-03: Middleware e utility API tipizzati

**Success criteria:**
1. All ~80 API route files in app/api/ have .ts extension (no .js remaining)
2. Each endpoint has typed request body and response body
3. API middleware functions have typed parameters
4. `tsc --noEmit` passes on app/api/ directory with no errors

**Depends on:** Phase 38

---

### Phase 41: Pages Migration

**Goal:** All pages, layouts, and providers are converted to TypeScript.

**Plans:** (created by /gsd:plan-phase)

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

**Plans:** (created by /gsd:plan-phase)

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

**Plans:** (created by /gsd:plan-phase)

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
| 38 - Library Migration | Planned | 0/9 | 0% |
| 39 - UI Components Migration | Pending | 0/? | 0% |
| 40 - API Routes Migration | Pending | 0/? | 0% |
| 41 - Pages Migration | Pending | 0/? | 0% |
| 42 - Test Migration | Pending | 0/? | 0% |
| 43 - Verification | Pending | 0/? | 0% |

---
*Roadmap created: 2026-02-05*
*Last updated: 2026-02-06*
