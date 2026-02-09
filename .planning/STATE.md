# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-08)

**Core value:** I dispositivi vengono riconosciuti automaticamente dopo il riavvio del browser e le notifiche arrivano sempre (100% delivery rate per dispositivi registrati).

**Current focus:** Phase 47 - Test Strict Mode and Index Access (v5.1 Tech Debt & Code Quality)

## Current Position

Phase: 47 of 48 (Test Strict Mode and Index Access)
Plan: 3 of 8 in current phase
Status: In Progress
Last activity: 2026-02-09 - Completed 47-03-PLAN.md (Fixed 282 strict mode errors in remaining 20 test files, achieved 0 total tsc errors)

Progress: [████████████████████████████████████████████░░░░] 99% (237/236 estimated total plans)

## Performance Metrics

**Velocity:**
- Total plans completed: 229 plans (v1.0-v5.1)
- Milestones shipped: 7 (v1.0, v2.0, v3.0, v3.1, v3.2, v4.0, v5.0)
- Average milestone: ~32 plans
- Current milestone: v5.1 (5 phases planned, phase 44 complete, phase 45 complete, phase 46 complete, phase 47 in progress - 3/8 plans done)

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
| Phase 45 P03 | 785 | 2 tasks | 20 files |
| Phase 45 P08 | 169s | 2 tasks | 2 files |
| Phase 46 P01 | 419s | 2 tasks | 1 file |
| Phase 46 P02 | 445s | 2 tasks | 2 files |
| Phase 46 P03 | 1250s | 2 tasks | 12 files |
| Phase 46 P04 | 953s | 2 tasks | 13 files |
| Phase 46 P05 | 657s | 2 tasks | 8 files |
| Phase 46 P07 | 428s | 2 tasks | 2 files |
| Phase 46 P08 | 130s | 2 tasks | 0 files |
| Phase 46 P08 | 130 | 2 tasks | 0 files |
| Phase 47 P01 | 262s | 2 tasks | 3 files |
| Phase 47 P02 | 313s | 2 tasks | 3 files |
| Phase 47 P03 | 819s | 2 tasks | 20 files |

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
- [Phase 45-03]: Nullish coalescing (??) for CVA variant map access (iconSizes, statusLabels) to handle null/undefined keys
- [Phase 45-03]: @ts-expect-error for react-dom imports (BottomSheet, LoadingOverlay) - types exist but strict mode check fails
- [Phase 45-08]: Parallel wave execution creates expected cascade effects - gap sweep pattern validates approach (16 errors caught and fixed)
- [Phase 46-01]: Type assertions for component prop callbacks (parent DayOfWeek vs child string) - inline assertion pattern
- [Phase 46-03]: Use @ts-expect-error for useNotificationPreferences and eslint-plugin-tailwindcss (no type definitions)
- [Phase 46-03]: Use 'as const' for config object values to preserve literal types (colorScheme variants)
- [Phase 46-03]: Type React event handlers explicitly (React.TouchEvent, React.MouseEvent) - don't rely on inference
- [Phase 46-03]: Convert undefined to null with ?? null pattern for component props expecting null
- [Phase 46-03]: Non-null assertion safe after redirect guards (redirect exits execution)
- [Phase 46-01]: Null to undefined conversion for React props (saveStatus ?? undefined)
- [Phase 46-02]: Error instanceof Error pattern for all catch blocks in page components
- [Phase 46-02]: Null guards (value !== null) before comparisons with nullable state
- [Phase 46-04]: Updated middleware AuthedHandler types to Promise<NextResponse<unknown>> (matches Next.js reality)
- [Phase 46-04]: Remove local RouteContext interfaces that conflict with middleware generic RouteContext
- [Phase 46-04]: Non-null assertions after validateRequired() calls (values guaranteed non-null)
- [Phase 46-05]: Record<string, unknown> for Firebase multi-path updates (dynamic template literal paths)
- [Phase 46-05]: Map 'low' priority to 'normal' in notification routes (NotificationPayload only supports high/normal)
- [Phase 46-05]: Remove local RouteContext interfaces that conflict with middleware types
- [Phase 46-05]: Convert notification data values to strings with Object.fromEntries/map pattern
- [Phase 46-05]: Explicit throw at end of fetchWithRetry loops for TypeScript satisfaction
- [Phase 46-02]: keyof typeof pattern for safe dynamic object property access
- [Phase 46-07]: Local interface definitions for inline component functions in documentation pages
- [Phase 46-07]: Event.target property access with type guard ('checked' in e.target)
- [Phase 46-07]: Explicit variant union types for component prop maps (Record<string, 'ember' | 'ocean' | ...>)
- [Phase 46-08]: Parallel execution of plans 01-07 produced zero cascade effects
- [Phase 46-08]: Phase 46 complete: 231 tsc errors in app/ resolved to 0 across 8 plans
- [Phase 47-01]: Mock variables with dynamic properties use `any` type (not jest.Mock to avoid TS2339)
- [Phase 47-01]: Callback parameters in mockImplementation receive explicit `any` type
- [Phase 47-01]: Test arrays with intentional empty values receive explicit type annotation
- [Phase 47-02]: Record<string, any> type assertions for dynamic test object property access (appliedSetpoints, previousSetpoints)
- [Phase 47-03]: Variable extraction pattern when TypeScript cannot infer non-null through chained property access
- [Phase 47-03]: Pragmatic 'as any' for intentionally invalid test data (negative test cases)
- [Phase 47-03]: Non-null assertions (!) required even after expect().not.toBeNull() matchers
- [Phase 47-02]: Non-null assertions (!) safe for nextSlot when test setup guarantees data presence
- [Phase 47-02]: Explicit React.ReactNode types required for all mock component props in strict mode
- [Phase 47-02]: jest.Mock type annotations for test fixtures (mockRouter, mockSearchParams)

### Pending Todos

None yet.

### Quick Tasks Completed

| # | Description | Date | Commit | Directory |
|---|-------------|------|--------|-----------|
| 16 | fix weather tab coordinates from config | 2026-02-09 | 00f3184 | [16-fix-weather-tab-coordinates-from-config](./quick/16-fix-weather-tab-coordinates-from-config/) |
| 15 | aggiungi la favicon | 2026-02-09 | 266bd24 | [15-aggiungi-la-favicon](./quick/15-aggiungi-la-favicon/) |

### Blockers/Concerns

**Known Issues to Address in v5.1:**
- **Phase 44 COMPLETE:** lib/ directory now has 0 tsc errors
- **Phase 45 COMPLETE:** components/ and app/components/ directories now have 0 tsc errors
- **Phase 46 COMPLETE:** app/ directory (pages, API routes, hooks) now has 0 tsc errors - all 231 errors resolved
- Phase 47: 1 failing test (FormModal cancel behavior — onClose called twice)
- Phase 47: Worker teardown warning during test runs
- Phase 48: Dead code removal needed (unused exports, files, dependencies)

**Technical Context:**
- Errors span ~531 TypeScript source files + ~131 test files
- v5.0 parallel wave execution pattern proved effective (will reuse)
- Expected some overlap/regression between parallel waves (acceptable for speed)

## Session Continuity

Last session: 2026-02-09 15:35
Stopped at: Completed 47-02-PLAN.md (Fixed 74 strict mode errors in 3 mid-error test files: netatmoStoveSync, coordinationPauseCalculator, thermostat page test)
Resume file: None — continue with 47-03

---
*State initialized: 2026-02-08 for v5.1 Tech Debt & Code Quality milestone*
