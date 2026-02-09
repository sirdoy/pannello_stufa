# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-08)

**Core value:** I dispositivi vengono riconosciuti automaticamente dopo il riavvio del browser e le notifiche arrivano sempre (100% delivery rate per dispositivi registrati).

**Current focus:** Phase 45 - Component Strict Mode Compliance (v5.1 Tech Debt & Code Quality)

## Current Position

Phase: 45 of 48 (Component Strict Mode Compliance)
Plan: 3 of 8 in current phase
Status: In progress
Last activity: 2026-02-09 - Completed 45-03-PLAN.md (fixed 56 strict-mode errors in 20 UI design system components)

Progress: [████████████████████████████████████████████░░░░] 94% (217/228 estimated total plans)

## Performance Metrics

**Velocity:**
- Total plans completed: 217 plans (v1.0-v5.1)
- Milestones shipped: 7 (v1.0, v2.0, v3.0, v3.1, v3.2, v4.0, v5.0)
- Average milestone: ~31 plans
- Current milestone: v5.1 (5 phases planned, phase 44 complete, 1/8 plans in phase 45 complete)

**Recent Milestone Performance:**

| Milestone | Phases | Plans | Duration | Avg/Plan |
|-----------|--------|-------|----------|----------|
| v5.0 | 7 | 56 | 4 days | ~90 min |
| v4.0 | 7 | 24 | 2 days | ~120 min |
| v3.2 | 5 | 13 | 2 days | ~220 min |
| v3.1 | 6 | 13 | 4 days | ~440 min |

**Trend:** Improving — v5.0 parallel wave execution significantly faster than previous milestones

*Updated after milestone roadmap creation*
| Phase 44 P01 | 322s | 2 tasks | 10 files |
| Phase 44 P02 | 676s | 2 tasks | 3 files |
| Phase 44 P03 | 11s | 2 tasks | 5 files |
| Phase 44 P05 | 697s | 2 tasks | 8 files |
| Phase 44 P06 | 11s | 2 tasks | 8 files |
| Phase 44 P07 | 663s | 2 tasks | 14 files |
| Phase 45 P01 | 811s | 2 tasks | 2 files |
| Phase 45 P02 | 506s | 2 tasks | 6 files |
| Phase 45 P04 | 644s | 2 tasks | 6 files |
| Phase 45 P06 | 505s | 2 tasks | 2 files |
| Phase 45 P07 | 639s | 2 tasks | 18 files |

## Accumulated Context

### Decisions

Recent decisions from PROJECT.md affecting v5.1 work:

- v5.0: Parallel wave execution (5 agents) — Proven effective, will continue for v5.1 strict mode fixes
- v5.0: Pragmatic `as any` for external APIs — Acceptable pattern for Hue/Netatmo/OpenMeteo
- v5.0: jest.mocked() pattern — Standard for type-safe mock access
- v5.0: allowJs: false lockdown — Prevents regression, keep enforced
- [Phase 44-01]: Pragmatic any for untyped external APIs (Hue callbacks, sandbox utilities)
- [Phase 44]: NotificationData interface pattern for flexible notification body data across 22 notification types
- [Phase 44]: Type guards (keyof typeof) for safe NOTIFICATION_TYPES dynamic access
- [Phase 44-03]: Use inline object types for complex function parameters (notificationLogger)
- [Phase 44-03]: Type assertion for Firestore QueryDocumentSnapshot when control flow narrowing fails
- [Phase 44-05]: Non-null assertions for Intl.DateTimeFormat.formatToParts() (guaranteed by API)
- [Phase 44-05]: Type-cast Record index access where dynamic keys validated at runtime
- [Phase 44-06]: Export utility types (GeofenceConfig, GeofenceActions) from modules for hook consumption
- [Phase 44-06]: BeforeInstallPromptEvent interface for non-standard PWA API
- [Phase 44-07]: Transaction callback type assertions for adminDbTransaction with typed parameters
- [Phase 44-07]: Test-specific pragmatic any for intentional null/undefined test cases
- [Phase 44-07]: Non-null assertions (!) in tests for data known to exist
- [Phase 45-01]: Pragmatic any for Slider props (Radix/design system type mismatch)
- [Phase 45-01]: Unknown intermediate type for safer schedule type assertions
- [Phase 45-01]: Null to undefined conversion with || undefined pattern
- [Phase 45]: Use error instanceof Error checks for catch blocks in device components
- [Phase 45]: WebGL context null checks: single guard in each function eliminates cascading errors
- [Phase 45-04]: @ts-expect-error for useNotificationPreferences hook (no type definitions available)
- [Phase 45-04]: Record<string, T> pattern for dynamic preference and room type access
- [Phase 45-04]: Match Select component onChange signature with { target: { value: string | number } }

### Pending Todos

None yet.

### Quick Tasks Completed

| # | Description | Date | Commit | Directory |
|---|-------------|------|--------|-----------|
| 16 | fix weather tab coordinates from config | 2026-02-09 | 00f3184 | [16-fix-weather-tab-coordinates-from-config](./quick/16-fix-weather-tab-coordinates-from-config/) |
| 15 | aggiungi la favicon | 2026-02-09 | 266bd24 | [15-aggiungi-la-favicon](./quick/15-aggiungi-la-favicon/) |

### Blockers/Concerns

**Known Issues to Address in v5.1:**
- **Phase 44 COMPLETE:** lib/ directory now has 0 tsc errors (down from initial count)
- Phase 45-47: ~1197 tsc errors remaining with strict mode enabled
  - Primary focus: app/ directory (~400 errors)
  - Secondary: components/ directory (~500 errors)
  - Final: gap closure and verification (~100 errors)
- Phase 47: 1 failing test (FormModal cancel behavior — onClose called twice)
- Phase 47: Worker teardown warning during test runs
- Phase 48: Dead code removal needed (unused exports, files, dependencies)

**Technical Context:**
- Errors span ~531 TypeScript source files + ~131 test files
- v5.0 parallel wave execution pattern proved effective (will reuse)
- Expected some overlap/regression between parallel waves (acceptable for speed)

## Session Continuity

Last session: 2026-02-09 09:35
Stopped at: Completed 45-01-PLAN.md (fixed 89 strict-mode errors in LightsCard and ThermostatCard)
Resume file: None — ready to continue with phase 45 plan 02

---
*State initialized: 2026-02-08 for v5.1 Tech Debt & Code Quality milestone*
