# Requirements: Pannello Stufa v5.0 TypeScript Migration

**Defined:** 2026-02-05
**Core Value:** Migrazione completa del codebase da JavaScript a TypeScript con approccio pragmatico — converti tutto, usa `any` dove serve, focus sul completare la migrazione.

## v5.0 Requirements

Requirements for TypeScript migration. Each maps to roadmap phases.

### Setup & Configuration

- [ ] **SETUP-01**: TypeScript installato e configurato (tsconfig.json)
- [ ] **SETUP-02**: allowJs abilitato per migrazione incrementale
- [ ] **SETUP-03**: Path aliases configurati (@/components, @/lib, etc.)
- [ ] **SETUP-04**: ESLint configurato per TypeScript

### Core Types

- [ ] **TYPE-01**: Types condivisi per Firebase data structures
- [ ] **TYPE-02**: Types per API responses/requests patterns
- [ ] **TYPE-03**: Types per React component props comuni
- [ ] **TYPE-04**: Types per configurazioni e constants

### Library Migration

- [x] **LIB-01**: Tutti i file lib/ convertiti a .ts (62 file)
- [x] **LIB-02**: Hooks convertiti a .ts (lib/hooks/, app/hooks/)
- [x] **LIB-03**: Utilities e helpers tipizzati
- [x] **LIB-04**: Services e repositories tipizzati

### UI Components Migration

- [ ] **COMP-01**: Design system components convertiti a .tsx (64 file)
- [ ] **COMP-02**: Application components convertiti a .tsx (~50 file)
- [ ] **COMP-03**: Props definite con interface/type per ogni component

### API Routes Migration

- [ ] **API-01**: Tutti gli API routes convertiti a .ts (~80 file)
- [ ] **API-02**: Request/Response types per ogni endpoint
- [ ] **API-03**: Middleware e utility API tipizzati

### Pages Migration

- [ ] **PAGE-01**: Layout e page files convertiti a .tsx
- [ ] **PAGE-02**: Context providers convertiti a .tsx
- [ ] **PAGE-03**: Loading/Error/Not-found states tipizzati

### Test Migration

- [ ] **TEST-01**: Test files lib/ convertiti a .ts
- [ ] **TEST-02**: Test files components/ convertiti a .tsx
- [ ] **TEST-03**: Jest configurato per TypeScript
- [ ] **TEST-04**: Tutti i test passano dopo migrazione

### Verification

- [ ] **VERIFY-01**: `npm run build` completa senza errori
- [ ] **VERIFY-02**: `tsc --noEmit` passa (type check)
- [ ] **VERIFY-03**: Zero file .js/.jsx rimanenti (escluso config)
- [ ] **VERIFY-04**: Dev server funziona correttamente

## Future Requirements

Deferred to v5.1 or later — post-migration type improvements:

### Strictness Improvements
- **STRICT-01**: Enable strict mode in tsconfig
- **STRICT-02**: Replace `any` with proper types
- **STRICT-03**: Enable noImplicitAny
- **STRICT-04**: Enable strictNullChecks

### Advanced Types
- **ADV-01**: Generic types for reusable patterns
- **ADV-02**: Utility types for common transformations
- **ADV-03**: Type guards for runtime validation

## Out of Scope

| Feature | Reason |
|---------|--------|
| Strict mode v5.0 | Focus on migration completion, strictness in v5.1 |
| 100% type coverage | Pragmatic approach allows `any` for speed |
| Runtime type validation (Zod everywhere) | Already have Zod for forms, don't expand scope |
| Type generation from API | Manual types sufficient for this codebase size |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| SETUP-01 | Phase 37 | Complete |
| SETUP-02 | Phase 37 | Complete |
| SETUP-03 | Phase 37 | Complete |
| SETUP-04 | Phase 37 | Complete |
| TYPE-01 | Phase 37 | Complete |
| TYPE-02 | Phase 37 | Complete |
| TYPE-03 | Phase 37 | Complete |
| TYPE-04 | Phase 37 | Complete |
| LIB-01 | Phase 38 | Complete |
| LIB-02 | Phase 38 | Complete |
| LIB-03 | Phase 38 | Complete |
| LIB-04 | Phase 38 | Complete |
| COMP-01 | Phase 39 | Pending |
| COMP-02 | Phase 39 | Pending |
| COMP-03 | Phase 39 | Pending |
| API-01 | Phase 40 | Pending |
| API-02 | Phase 40 | Pending |
| API-03 | Phase 40 | Pending |
| PAGE-01 | Phase 41 | Pending |
| PAGE-02 | Phase 41 | Pending |
| PAGE-03 | Phase 41 | Pending |
| TEST-01 | Phase 42 | Pending |
| TEST-02 | Phase 42 | Pending |
| TEST-03 | Phase 42 | Pending |
| TEST-04 | Phase 42 | Pending |
| VERIFY-01 | Phase 43 | Pending |
| VERIFY-02 | Phase 43 | Pending |
| VERIFY-03 | Phase 43 | Pending |
| VERIFY-04 | Phase 43 | Pending |

**Coverage:**
- v5.0 requirements: 24 total
- Mapped to phases: 24
- Unmapped: 0 ✓

---
*Requirements defined: 2026-02-05*
*Last updated: 2026-02-06 — Phase 38 requirements complete*
