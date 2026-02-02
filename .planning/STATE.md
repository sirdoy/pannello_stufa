# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-02)

**Core value:** I dispositivi vengono riconosciuti automaticamente dopo il riavvio del browser e le notifiche arrivano sempre (100% delivery rate per dispositivi registrati).
**Current focus:** v3.2 Dashboard Customization & Weather - Phase 26 Weather Component

## Current Position

Phase: 26 of 29 (Weather Component)
Plan: 3/4 plans complete
Status: In progress
Last activity: 2026-02-02 — Completed 26-03-PLAN.md (Forecast Components)

Progress: [███████░░░░░░░░░░░░░░░░░░] 35% (v3.2 milestone - 6/17 estimated plans)

## Performance Metrics

**Velocity:**
- Total plans completed: 118 (v1.0: 29 plans, v2.0: 21 plans, v3.0: 52 plans, v3.1: 13 plans, v3.2: 3 plans)
- Average duration: ~3.9 min per plan
- Total execution time: ~7.98 hours across 5 milestones

**By Milestone:**

| Milestone | Phases | Plans | Duration |
|-----------|--------|-------|----------|
| v1.0 Push Notifications | 5 | 29 | 4 days (2026-01-23 - 2026-01-26) |
| v2.0 Netatmo Control | 5 | 21 | 1.4 days (2026-01-27 - 2026-01-28) |
| v3.0 Design System | 8 | 52 | 3 days (2026-01-28 - 2026-01-30) |
| v3.1 Compliance | 6 | 13 | 4 days (2026-01-30 - 2026-02-02) |
| v3.2 Weather & Dashboard | 5 | 6 | In progress (2026-02-02 - present) |

**Recent Trend:**
- All 4 previous milestones complete: 115 plans total
- v3.2 estimated at ~17 plans across 5 phases, 6 complete
- Weather foundation: API infrastructure + geolocation/location + dashboard preferences (6min total)
- Weather component plan 01: WeatherIcon + utilities (2min)
- Weather component plan 02: WeatherCard + CurrentConditions + Skeleton (2min)
- Weather component plan 03: ForecastRow + ForecastDayCard + ForecastDaySheet (3min)

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
- Single shared location for entire app (stored at /config/location, not per-user)
- Geolocation error codes distinguish permission denied vs timeout vs unavailable
- Location API returns 404 LOCATION_NOT_SET when not configured
- Dashboard preferences service pattern: get/set/subscribe for real-time updates
- DEFAULT_CARD_ORDER includes 5 cards (stove, thermostat, weather, lights, camera)
- Lucide icons with filled style (fill=currentColor, strokeWidth=0) for weather
- Day/night icon variants: Sun/Moon for clear, CloudSun/CloudMoon for partly cloudy
- Temperature formatting returns string with one decimal for consistent display
- Horizontal snap scroll pattern: snap-x snap-mandatory + flex-shrink-0 + snap-start
- First forecast day always marked as "Oggi" (index === 0)
- Precipitation badge threshold: > 10% to avoid visual noise
- Missing extended stats show "N/D" (non disponibile)

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

Last session: 2026-02-02T17:15:00Z
Stopped at: Completed 26-03-PLAN.md (Forecast Components)
Resume file: None
Next step: Execute 26-04-PLAN.md (Integration)
