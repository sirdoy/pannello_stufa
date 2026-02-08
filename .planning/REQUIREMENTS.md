# Requirements: Pannello Stufa v5.1

**Defined:** 2026-02-08
**Core Value:** I dispositivi vengono riconosciuti automaticamente dopo il riavvio del browser e le notifiche arrivano sempre (100% delivery rate per dispositivi registrati).

## v5.1 Requirements

Requirements for Tech Debt & Code Quality milestone. Each maps to roadmap phases.

### TypeScript Strict Mode

- [ ] **STRICT-01**: `strict: true` enabled in tsconfig.json (enables strictNullChecks, noImplicitAny, strictFunctionTypes, strictBindCallApply, strictPropertyInitialization, noImplicitThis, alwaysStrict)
- [ ] **STRICT-02**: All `noImplicitAny` errors fixed — parameters, variables, binding elements, arrays (~768 errors: TS7006, TS7005, TS7031, TS7034)
- [ ] **STRICT-03**: All `strictNullChecks` errors fixed — null/undefined type guards added where needed (~188 errors: TS18047, TS18048, TS2532, TS2531)
- [ ] **STRICT-04**: All type mismatch errors fixed — argument types, assignments, property access on unknown (~419 errors: TS2345, TS2322, TS2339, TS18046)
- [ ] **STRICT-05**: All implicit index access errors fixed — proper type narrowing for dynamic property access (~91 errors: TS7053)
- [ ] **STRICT-06**: All remaining strict errors fixed — module declarations, spread types, missing returns (~30 errors: TS7016, TS7019, TS2790, TS2769, TS2464, TS2366, TS2783, TS2739, TS2722, TS2320)
- [ ] **STRICT-07**: `noUncheckedIndexedAccess` enabled in tsconfig.json — all array/object index access errors fixed with proper undefined checks (~436 additional errors)
- [ ] **STRICT-08**: `tsc --noEmit` passes with `strict: true` and `noUncheckedIndexedAccess` enabled (zero errors total)

### Test Fixes

- [ ] **TEST-01**: FormModal cancel behavior test fixed — onClose called exactly once when cancel button clicked (currently called twice)
- [ ] **TEST-02**: Worker process teardown warning resolved — no force-exit messages during test runs
- [ ] **TEST-03**: All 3032+ tests passing green with no failures

### Dead Code Removal

- [ ] **DEAD-01**: Unused exports identified and removed across all source files
- [ ] **DEAD-02**: Unused files identified and removed from codebase
- [ ] **DEAD-03**: Unused dependencies identified and removed from package.json

## Future Requirements

### Additional Strict Options

- **STRICT-F01**: `exactOptionalPropertyTypes` enabled — distinguishes between missing and undefined properties
- **STRICT-F02**: `noPropertyAccessFromIndexSignature` enabled — forces bracket notation for index signatures
- **STRICT-F03**: `skipLibCheck: false` — validates all .d.ts files (depends on library quality)

### Test Coverage

- **TEST-F01**: Test coverage report generated and gaps identified
- **TEST-F02**: Critical untested paths covered with new tests
- **TEST-F03**: Coverage threshold enforced in CI

## Out of Scope

| Feature | Reason |
|---------|--------|
| `exactOptionalPropertyTypes` | Low ROI for current codebase, defer to future |
| `skipLibCheck: false` | External library .d.ts quality not under our control |
| Test coverage gap filling | Focus on strictness and cleanliness first |
| ESLint strict rules | Separate concern, defer to future milestone |
| Performance optimizations | Not tech debt, different milestone |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| STRICT-01 | — | Pending |
| STRICT-02 | — | Pending |
| STRICT-03 | — | Pending |
| STRICT-04 | — | Pending |
| STRICT-05 | — | Pending |
| STRICT-06 | — | Pending |
| STRICT-07 | — | Pending |
| STRICT-08 | — | Pending |
| TEST-01 | — | Pending |
| TEST-02 | — | Pending |
| TEST-03 | — | Pending |
| DEAD-01 | — | Pending |
| DEAD-02 | — | Pending |
| DEAD-03 | — | Pending |

**Coverage:**
- v5.1 requirements: 14 total
- Mapped to phases: 0
- Unmapped: 14 ⚠️

---
*Requirements defined: 2026-02-08*
*Last updated: 2026-02-08 after initial definition*
