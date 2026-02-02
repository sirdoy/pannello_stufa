# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-02)

**Core value:** I dispositivi vengono riconosciuti automaticamente dopo il riavvio del browser e le notifiche arrivano sempre (100% delivery rate per dispositivi registrati).
**Current focus:** v3.2 Dashboard Customization & Weather - Phase 25 Weather Foundation

## Current Position

Phase: 25 of 29 (Weather Foundation)
Plan: 1 of ~4 plans complete
Status: In progress
Last activity: 2026-02-02 — Completed 25-01-PLAN.md (Weather API Infrastructure)

Progress: [█░░░░░░░░░░░░░░░░░░░░░░░░] ~6% (v3.2 milestone - 1/17 estimated plans)

## Performance Metrics

**Velocity:**
- Total plans completed: 116 (v1.0: 29 plans, v2.0: 21 plans, v3.0: 52 plans, v3.1: 13 plans, v3.2: 1 plan)
- Average duration: ~4.1 min per plan
- Total execution time: ~7.92 hours across 5 milestones

**By Milestone:**

| Milestone | Phases | Plans | Duration |
|-----------|--------|-------|----------|
| v1.0 Push Notifications | 5 | 29 | 4 days (2026-01-23 - 2026-01-26) |
| v2.0 Netatmo Control | 5 | 21 | 1.4 days (2026-01-27 - 2026-01-28) |
| v3.0 Design System | 8 | 52 | 3 days (2026-01-28 - 2026-01-30) |
| v3.1 Compliance | 6 | 13 | 4 days (2026-01-30 - 2026-02-02) |
| v3.2 Weather & Dashboard | 5 | 1 | In progress (2026-02-02 - present) |

**Recent Trend:**
- All 4 previous milestones complete: 115 plans total
- v3.2 estimated at ~17 plans across 5 phases, 1 complete
- Weather foundation: Open-Meteo API integration with stale-while-revalidate cache (2min)

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

**v3.2 Decisions (from research + execution):**
- Open-Meteo API for weather (free, no API key required)
- In-memory cache with 15-minute TTL (no Redis needed for single-instance)
- Stale-while-revalidate pattern: return stale data immediately, refresh in background
- 4-decimal coordinate precision for cache keys (~11m accuracy)
- Italian weather descriptions via WMO_CODES mapping (0-99)
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
Stopped at: Completed 25-01-PLAN.md (Weather API Infrastructure)
Resume file: None
Next step: Continue Phase 25 Weather Foundation (weather UI, geolocation handling)
