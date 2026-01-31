# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-01-30)

**Core value:** I dispositivi vengono riconosciuti automaticamente dopo il riavvio del browser e le notifiche arrivano sempre (100% delivery rate per dispositivi registrati).
**Current focus:** v3.1 Design System Compliance - Phase 21 (LightsCard)

## Current Position

Phase: 21 of 24 (LightsCard Compliance)
Plan: 2 of 2 in current phase
Status: Phase complete
Last activity: 2026-01-31 - Completed 21-02-PLAN.md (Scene Buttons Compliance - verification only)

Progress: [████████████████████░░░░] 94% (108/115 plans - v1.0+v2.0+v3.0+Phase 19+Phase 20+Phase 21 complete)

## Performance Metrics

**Velocity:**
- Total plans completed: 108 (v1.0: 29 plans, v2.0: 21 plans, v3.0: 52 plans, v3.1: 6 plans)
- Average duration: ~4.3 min per plan
- Total execution time: ~7.7 hours across 4 milestones

**By Milestone:**

| Milestone | Phases | Plans | Duration |
|-----------|--------|-------|----------|
| v1.0 Push Notifications | 5 | 29 | 4 days (2026-01-23 - 2026-01-26) |
| v2.0 Netatmo Control | 5 | 21 | 1.4 days (2026-01-27 - 2026-01-28) |
| v3.0 Design System | 8 | 52 | 3 days (2026-01-28 - 2026-01-30) |
| v3.1 Compliance | 6 | 13 | Starting |

**Recent Trend:**
- Milestone velocity stable (v3.0 was largest milestone yet with 52 plans)
- Plan complexity stable (~5 min average)
- v3.1 scoped as lighter compliance milestone (13 plans vs 52 in v3.0)

*Updated after v3.1 roadmap creation*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Full decision log available in milestone archives.

Key architectural patterns from v1.0 + v2.0 + v3.0:
- Dual persistence strategy (IndexedDB + localStorage) for token survival
- Firebase RTDB for real-time state, Firestore for historical queries
- HMAC-secured cron webhooks for security without key rotation
- Fire-and-forget logging pattern (don't block critical operations)
- Global 30-minute notification throttle across system events
- cn() pattern for Tailwind class composition
- CVA for type-safe component variants
- Radix UI for accessible interactive components
- Namespace component pattern (Card.Header, Button.Icon)

### Pending Todos

**Operational Setup (v1.0 + v2.0 shipped, pending deployment):**
- Scheduler cron configuration (cron-job.org account, 15-30 min)
- Health monitoring cron (1-min frequency): `/api/health-monitoring/check`
- Coordination cron (1-min frequency): `/api/coordination/enforce`
- Firestore indexes: `firebase deploy --only firestore:indexes`

### Blockers/Concerns

None - ready to start v3.1 compliance work.

**Known Tech Debt:**
- TODO: Track STARTING state entry time for grace period (Phase 7, low priority)
- Warning: DMS polling continues when page backgrounded (Phase 10, should use Page Visibility API)
- Label component not exported from barrel (low impact, Phase 13)

## Session Continuity

Last session: 2026-01-31
Stopped at: Phase 21 complete (LightsCard Compliance) - verified 4/4 must-haves for scene buttons
Resume file: None
Next step: `/gsd:plan-phase 22` to create detailed plan for ScheduleCard compliance
