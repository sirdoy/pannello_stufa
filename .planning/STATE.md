# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-02)

**Core value:** I dispositivi vengono riconosciuti automaticamente dopo il riavvio del browser e le notifiche arrivano sempre (100% delivery rate per dispositivi registrati).
**Current focus:** v3.2 Dashboard Customization & Weather - Phase 25 Weather Foundation

## Current Position

Phase: 25 of 29 (Weather Foundation)
Plan: Ready to plan
Status: Ready to plan Phase 25
Last activity: 2026-02-02 — Roadmap created for v3.2

Progress: [░░░░░░░░░░░░░░░░░░░░░░░░░] 0% (v3.2 milestone)

## Performance Metrics

**Velocity:**
- Total plans completed: 115 (v1.0: 29 plans, v2.0: 21 plans, v3.0: 52 plans, v3.1: 13 plans)
- Average duration: ~4.2 min per plan
- Total execution time: ~7.9 hours across 4 milestones

**By Milestone:**

| Milestone | Phases | Plans | Duration |
|-----------|--------|-------|----------|
| v1.0 Push Notifications | 5 | 29 | 4 days (2026-01-23 - 2026-01-26) |
| v2.0 Netatmo Control | 5 | 21 | 1.4 days (2026-01-27 - 2026-01-28) |
| v3.0 Design System | 8 | 52 | 3 days (2026-01-28 - 2026-01-30) |
| v3.1 Compliance | 6 | 13 | 4 days (2026-01-30 - 2026-02-02) |
| v3.2 Weather & Dashboard | 5 | TBD | Starting 2026-02-02 |

**Recent Trend:**
- All 4 previous milestones complete: 115 plans total
- v3.2 estimated at ~17 plans across 5 phases
- Weather foundation starts infrastructure for new feature category

*Updated after v3.2 roadmap creation*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Full decision log available in milestone archives.

Key architectural patterns from previous milestones:
- Dual persistence strategy (IndexedDB + localStorage) for token survival
- Firebase RTDB for real-time state, Firestore for historical queries
- HMAC-secured cron webhooks for security without key rotation
- Fire-and-forget logging pattern (don't block critical operations)
- Global 30-minute notification throttle across system events
- cn() pattern for Tailwind class composition
- CVA for type-safe component variants (including compound variants for colorScheme)
- Radix UI for accessible interactive components
- Namespace component pattern (Card.Header, Button.Icon)

**v3.2 Decisions (from research):**
- Open-Meteo API for weather (free, no API key required)
- Firebase RTDB for dashboard preferences (not localStorage - iOS eviction)
- Menu-based reordering (up/down buttons, not drag-drop)
- Browser Geolocation API with 10s timeout for iOS PWA

### Pending Todos

**Operational Setup (from previous milestones, pending deployment):**
- Scheduler cron configuration (cron-job.org account, 15-30 min)
- Health monitoring cron (1-min frequency): `/api/health-monitoring/check`
- Coordination cron (1-min frequency): `/api/coordination/enforce`
- Firestore indexes: `firebase deploy --only firestore:indexes`

### Blockers/Concerns

None — starting fresh milestone.

**Known Tech Debt:**
- TODO: Track STARTING state entry time for grace period (Phase 7, low priority)
- Warning: DMS polling continues when page backgrounded (Phase 10, should use Page Visibility API)
- Label component not exported from barrel (low impact, Phase 13)

## Session Continuity

Last session: 2026-02-02
Stopped at: v3.2 roadmap created, ready to plan Phase 25
Resume file: None
Next step: `/gsd:plan-phase 25` to plan Weather Foundation
