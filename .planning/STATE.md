# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-01-28)

**Core value:** I dispositivi vengono riconosciuti automaticamente dopo il riavvio del browser e le notifiche arrivano sempre (100% delivery rate per dispositivi registrati).
**Current focus:** Phase 11 - Foundation & Tooling (v3.0 Design System Evolution)

## Current Position

Phase: 11 of 18 (Foundation & Tooling)
Plan: 2 of 3 in current phase
Status: In progress
Last activity: 2026-01-28 - Completed 11-02-PLAN.md (Radix UI + jest-axe)

Progress: [████████████░░░░░░] 57.8% (10 phases + 2 plans complete)

## Performance Metrics

**Velocity:**
- Total plans completed: 52 (v1.0: 29 plans, v2.0: 21 plans, v3.0: 2 plans)
- Average duration: ~4.8 min per plan
- Total execution time: ~4.3 hours across 3 milestones

**By Milestone:**

| Milestone | Phases | Plans | Duration |
|-----------|--------|-------|----------|
| v1.0 Push Notifications | 5 | 29 | 4 days (2026-01-23 -> 2026-01-26) |
| v2.0 Netatmo Control | 5 | 21 | 1.4 days (2026-01-27 -> 2026-01-28) |
| v3.0 Design System | 8 | 2 | In progress |

**Recent Trend:**
- Milestone velocity improving (v2.0 shipped in 1/3 the time of v1.0)
- Plan complexity stable (4.8 min average)

*Updated after 11-02 completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- v3.0: Design system approach chosen (Radix UI primitives + CVA + custom components over full UI frameworks)
- v3.0: Comprehensive depth (8 phases) to maintain natural requirement boundaries without artificial compression
- v3.0: Bottom-up build order (Foundation -> Core -> Smart Home -> Pages) respects dependency hierarchy
- **11-01: Named export cn (not default) for better tree-shaking**
- **11-01: tailwind-merge v3.4.0 (latest) compatible with Tailwind v4**
- **11-02: Individual @radix-ui packages (not monolithic) for better tree-shaking**
- **11-02: Color contrast disabled in axe (JSDOM limitation)**
- **11-02: runAxeWithRealTimers helper for fake timer compatibility**

Key architectural patterns from v1.0 + v2.0:
- Dual persistence strategy (IndexedDB + localStorage) for token survival
- Firebase RTDB for real-time state, Firestore for historical queries
- HMAC-secured cron webhooks for security without key rotation
- Fire-and-forget logging pattern (don't block critical operations)
- Global 30-minute notification throttle across system events

**v3.0 Patterns Established:**
- cn() pattern: `cn(baseClasses, conditionalClasses, className)` - last argument wins conflicts
- Test location: `lib/utils/__tests__/*.test.js` for utility tests
- A11y test pattern: `render(component) -> await axe(container) -> expect(results).toHaveNoViolations()`
- Global axe matcher: toHaveNoViolations available in all tests via jest.setup.js

### Pending Todos

**Operational Setup (v1.0 + v2.0 shipped, pending deployment):**
- Scheduler cron configuration (cron-job.org account, 15-30 min)
- Health monitoring cron (1-min frequency): `/api/health-monitoring/check`
- Coordination cron (1-min frequency): `/api/coordination/enforce`
- Firestore indexes: `firebase deploy --only firestore:indexes`

### Blockers/Concerns

None. Plan 11-02 executed successfully with 1 auto-fix (package structure correction).

**Known Tech Debt:**
- TODO: Track STARTING state entry time for grace period (Phase 7, low priority)
- Warning: DMS polling continues when page backgrounded (Phase 10, should use Page Visibility API)

## Session Continuity

Last session: 2026-01-28
Stopped at: Completed 11-02-PLAN.md (Radix UI + jest-axe)
Resume file: None
Next step: Execute 11-03-PLAN.md (TypeScript foundation or next tooling task)
