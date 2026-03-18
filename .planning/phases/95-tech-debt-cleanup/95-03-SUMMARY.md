---
phase: 95-tech-debt-cleanup
plan: 03
subsystem: infra
tags: [env, configuration, cleanup, dead-code]

# Dependency graph
requires: []
provides:
  - ".env.local cleaned of 8 stale pre-v10.0/v11.0 env vars (HOMEASSISTANT_*, NETATMO_CLIENT*, NETATMO_REDIRECT*, NEXT_PUBLIC_NETATMO_*)"
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns: []

key-files:
  created: []
  modified:
    - ".env.local"

key-decisions:
  - "8 stale env vars removed from .env.local: HOMEASSISTANT_API_URL, HOMEASSISTANT_USER, HOMEASSISTANT_PASSWORD, NETATMO_CLIENT_ID, NETATMO_CLIENT_SECRET, NETATMO_REDIRECT_URI, NEXT_PUBLIC_NETATMO_CLIENT_ID, NEXT_PUBLIC_NETATMO_REDIRECT_URI"
  - ".env.local is gitignored — no task commit required; change is applied locally only"

patterns-established: []

requirements-completed:
  - DEBT-02

# Metrics
duration: 3min
completed: 2026-03-18
---

# Phase 95 Plan 03: Tech Debt Cleanup - Stale Env Vars Summary

**Removed 8 dead env vars from .env.local (pre-v10.0 Netatmo OAuth + pre-v11.0 HomeAssistant direct connection) while preserving all active HA_API_URL/HA_API_KEY and Firebase vars**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-18T13:41:00Z
- **Completed:** 2026-03-18T13:43:50Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments
- Deleted 3 HOMEASSISTANT_* vars (API_URL, USER, PASSWORD) left over from pre-v11.0 direct HA connection
- Deleted 3 NETATMO_* vars (CLIENT_ID, CLIENT_SECRET, REDIRECT_URI) left over from pre-v10.0 OAuth flow
- Deleted 2 NEXT_PUBLIC_NETATMO_* vars (CLIENT_ID, REDIRECT_URI) left over from pre-v10.0 OAuth client-side
- All active vars (HA_API_URL, HA_API_KEY, Firebase, Auth0) verified intact
- DEBT-02 requirement fully satisfied

## Task Commits

Each task was committed atomically:

1. **Task 1: Delete 8 stale env vars from .env.local** - no commit (.env.local is gitignored, change is local-only)

**Plan metadata:** see final docs commit below

## Files Created/Modified
- `.env.local` - Removed 8 stale pre-v10.0/v11.0 env vars; active configuration intact (gitignored, no commit)

## Decisions Made
- No task commit was needed since .env.local is in .gitignore (.env* pattern excludes all env files except .env.example). The deletion is applied to the local file as intended.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required. This was a local env file cleanup.

## Next Phase Readiness
- Phase 95 is now complete: DEBT-01 (useMemo/useCallback removal) and DEBT-02 (stale env vars) both done
- v11.1 milestone (Test Suite & Tech Debt Cleanup) fully complete

---
*Phase: 95-tech-debt-cleanup*
*Completed: 2026-03-18*
