---
status: resolved
trigger: "Continue debugging weather-cron-system. L'utente vuole usare UNA SOLA route cron esistente, non creare una route separata per il weather."
created: 2026-02-03T19:00:00Z
updated: 2026-02-03T19:30:00Z
---

## Current Focus

hypothesis: CONFIRMED - User wants single unified cron route, not separate routes per job
test: Create unified /api/cron?job=<name> route
expecting: All cron jobs handled by single route with job dispatcher
next_action: Archive and report completion

## Symptoms

expected: Single cron route that handles multiple jobs
actual: Two separate routes existed: /api/cron/weather and /api/cron/cleanup-tokens
errors: None - architectural preference
reproduction: Check route structure
started: User correction during previous debug session

## Eliminated

## Evidence

- timestamp: 2026-02-03T19:05:00Z
  checked: Existing cron routes
  found: /api/cron/weather/route.js and /api/cron/cleanup-tokens/route.ts existed separately
  implication: Need to merge into single unified route

- timestamp: 2026-02-03T19:10:00Z
  checked: User requirement clarification
  found: User explicitly wants ONE route for all cron jobs
  implication: Create /api/cron/route.ts with job parameter dispatch

## Resolution

root_cause: |
  Previous implementation created separate routes for each cron job (/api/cron/weather and /api/cron/cleanup-tokens).
  User prefers a single unified cron endpoint that dispatches to different jobs based on a query parameter.

fix: |
  1. Created unified /api/cron/route.ts with:
     - GET: Health check showing all available jobs
     - POST ?job=weather: Weather data refresh
     - POST ?job=cleanup-tokens: FCM token cleanup
     - HMAC-SHA256 authentication (same as before)
  2. Removed separate routes:
     - /api/cron/weather/route.js
     - /api/cron/cleanup-tokens/route.ts
  3. Merged documentation:
     - Created docs/cron-setup.md (unified guide)
     - Removed docs/cron-weather-setup.md
     - Removed docs/cron-cleanup-setup.md
  4. Updated docs/api-routes.md with unified cron section

verification: |
  - TypeScript compilation passes (path alias warnings expected)
  - Test suite: 111/112 passed (pre-existing failure unrelated)
  - Single route handles both job types via query parameter
  - Same HMAC signature works for all jobs (body is always {})

files_changed:
  - app/api/cron/route.ts (new - unified route)
  - app/api/cron/weather/route.js (deleted)
  - app/api/cron/cleanup-tokens/route.ts (deleted)
  - docs/cron-setup.md (new - merged documentation)
  - docs/cron-weather-setup.md (deleted)
  - docs/cron-cleanup-setup.md (deleted)
  - docs/api-routes.md (updated - added cron section)
