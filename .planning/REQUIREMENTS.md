# Requirements: Pannello Stufa

**Defined:** 2026-03-18
**Core Value:** I dispositivi vengono riconosciuti automaticamente dopo il riavvio del browser e le notifiche arrivano sempre (100% delivery rate per dispositivi registrati).

## v11.1 Requirements

Requirements for test suite cleanup and tech debt resolution.

### Jest Configuration

- [x] **JEST-01**: Playwright .spec.ts files excluded from Jest runner
- [x] **JEST-02**: Flaky tests pass reliably in full suite run (no ordering dependency)

### Test Fixes — API & Infrastructure

- [x] **TFIX-01**: middleware.test.ts — withIdempotency tests pass (3 tests)
- [x] **TFIX-02**: changelogService.test.ts — saveVersion/syncVersion tests pass (4 tests)
- [x] **TFIX-03**: stoveApi.test.ts — fetchWithRetry retry logging test passes (1 test)
- [x] **TFIX-04**: maintenanceService.test.ts — needsCleaning threshold test passes (1 test)
- [x] **TFIX-05**: schedulerService.test.ts — save/set/clear schedule tests pass (5 tests)
- [x] **TFIX-06**: healthDeadManSwitch.test.ts — ADMIN_USER_ID skip test passes (1 test)
- [x] **TFIX-07**: fritzbox/history.test.ts — range/filter/empty tests pass (6 tests)
- [x] **TFIX-08**: fritzbox/devices-events.test.ts — event detection tests pass (6 tests)

### Test Fixes — Components & Hooks

- [x] **TFIX-09**: StovePrimaryActions.test.tsx — disable state tests pass (3 tests)
- [x] **TFIX-10**: useNetworkData.test.ts — stale flag timeout test passes (1 test)
- [x] **TFIX-11**: useDeviceHistory.test.ts — fetch/refresh tests pass (2 tests)
- [x] **TFIX-12**: VersionContext.test.tsx — version check tests pass (4 tests)

### Tech Debt Cleanup

- [x] **DEBT-01**: Remove manual useMemo/useCallback replaced by React Compiler
- [x] **DEBT-02**: Remove stale env vars from .env.local (8 HOMEASSISTANT_*/NETATMO_* vars)

## Future Requirements

None — this is a cleanup milestone.

## Out of Scope

| Feature | Reason |
|---------|--------|
| New test coverage for untested code | This milestone fixes existing tests only |
| Nyquist validation for v10.0/v11.0 | Metadata-only, no runtime impact |
| 3 Netatmo routes without frontend consumer | Working API routes, consumers deferred |
| Remove 179 unused exports | 131 are intentional design system barrel exports |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| JEST-01 | Phase 92 | Complete |
| JEST-02 | Phase 92 | Complete |
| TFIX-01 | Phase 93 | Complete |
| TFIX-02 | Phase 93 | Complete |
| TFIX-03 | Phase 93 | Complete |
| TFIX-04 | Phase 93 | Complete |
| TFIX-05 | Phase 93 | Complete |
| TFIX-06 | Phase 93 | Complete |
| TFIX-07 | Phase 93 | Complete |
| TFIX-08 | Phase 93 | Complete |
| TFIX-09 | Phase 94 | Complete |
| TFIX-10 | Phase 94 | Complete |
| TFIX-11 | Phase 94 | Complete |
| TFIX-12 | Phase 94 | Complete |
| DEBT-01 | Phase 95 | Complete |
| DEBT-02 | Phase 95 | Complete |

**Coverage:**
- v11.1 requirements: 16 total
- Mapped to phases: 16
- Unmapped: 0 ✓

---
*Requirements defined: 2026-03-18*
*Last updated: 2026-03-18 — traceability mapped after roadmap creation*
