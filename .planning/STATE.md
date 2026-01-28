# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-01-28)

**Core value:** I dispositivi vengono riconosciuti automaticamente dopo il riavvio del browser e le notifiche arrivano sempre (100% delivery rate per dispositivi registrati).
**Current focus:** Phase 11 - Foundation & Tooling (v3.0 Design System Evolution)

## Current Position

Phase: 11 of 18 (Foundation & Tooling)
Plan: 1 of 3 in current phase
Status: In progress
Last activity: 2026-01-28 - Completed 11-01-PLAN.md (CVA + cn() utility)

Progress: [████████████░░░░░░] 56.7% (10 phases + 1 plan complete)

## Performance Metrics

**Velocity:**
- Total plans completed: 51 (v1.0: 29 plans, v2.0: 21 plans, v3.0: 1 plan)
- Average duration: ~4.9 min per plan
- Total execution time: ~4.2 hours across 3 milestones

**By Milestone:**

| Milestone | Phases | Plans | Duration |
|-----------|--------|-------|----------|
| v1.0 Push Notifications | 5 | 29 | 4 days (2026-01-23 → 2026-01-26) |
| v2.0 Netatmo Control | 5 | 21 | 1.4 days (2026-01-27 → 2026-01-28) |
| v3.0 Design System | 8 | 1 | In progress |

**Recent Trend:**
- Milestone velocity improving (v2.0 shipped in 1/3 the time of v1.0)
- Plan complexity stable (4.9 min average)

*Updated after 11-01 completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- v3.0: Design system approach chosen (Radix UI primitives + CVA + custom components over full UI frameworks)
- v3.0: Comprehensive depth (8 phases) to maintain natural requirement boundaries without artificial compression
- v3.0: Bottom-up build order (Foundation -> Core -> Smart Home -> Pages) respects dependency hierarchy
- **11-01: Named export cn (not default) for better tree-shaking**
- **11-01: tailwind-merge v3.4.0 (latest) compatible with Tailwind v4**

Key architectural patterns from v1.0 + v2.0:
- Dual persistence strategy (IndexedDB + localStorage) for token survival
- Firebase RTDB for real-time state, Firestore for historical queries
- HMAC-secured cron webhooks for security without key rotation
- Fire-and-forget logging pattern (don't block critical operations)
- Global 30-minute notification throttle across system events

**v3.0 Patterns Established:**
- cn() pattern: `cn(baseClasses, conditionalClasses, className)` - last argument wins conflicts
- Test location: `lib/utils/__tests__/*.test.js` for utility tests

### Pending Todos

**Operational Setup (v1.0 + v2.0 shipped, pending deployment):**
- Scheduler cron configuration (cron-job.org account, 15-30 min)
- Health monitoring cron (1-min frequency): `/api/health-monitoring/check`
- Coordination cron (1-min frequency): `/api/coordination/enforce`
- Firestore indexes: `firebase deploy --only firestore:indexes`

### Blockers/Concerns

None. Plan 11-01 executed successfully with 1 auto-fix (jest-axe dependency).

**Known Tech Debt:**
- TODO: Track STARTING state entry time for grace period (Phase 7, low priority)
- Warning: DMS polling continues when page backgrounded (Phase 10, should use Page Visibility API)

## Session Continuity

Last session: 2026-01-28
Stopped at: Completed 11-01-PLAN.md (CVA + cn() utility)
Resume file: None
Next step: Execute 11-02-PLAN.md (Radix UI primitives)
