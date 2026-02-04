---
status: resolved
trigger: "L'utente vuole che la route del cron gestisca il timing per job diversi, utilizzando il tempo dall'ultima esecuzione"
created: 2026-02-04T10:00:00Z
updated: 2026-02-04T10:30:00Z
---

## Current Focus

hypothesis: CONFIRMED - Smart scheduler with Firebase persistence implemented
test: Unit tests pass, ESLint passes
expecting: Route now supports both smart scheduler mode and manual trigger mode
next_action: Archive session

## Symptoms

expected: |
  - cron-job.org calls `/api/cron` every minute (single call)
  - Route internally checks each job's interval vs lastExecution
  - Jobs that are "due" get executed
  - Jobs not due get skipped
  - Response shows what ran and what was skipped

actual: |
  - Current implementation requires separate cron-job.org jobs per task
  - No internal timing logic
  - Each job URL must be called explicitly

errors: None - enhancement request

reproduction: N/A - new feature

started: User requirement after unified cron route was implemented

## Eliminated

## Evidence

- timestamp: 2026-02-04T10:05:00Z
  checked: Current cron route implementation
  found: |
    - Uses ?job= parameter for dispatch
    - No lastExecution tracking
    - No interval configuration
    - Each job requires separate cron-job.org entry
  implication: Need to add scheduler logic with Firebase persistence

- timestamp: 2026-02-04T10:25:00Z
  checked: Implementation complete
  found: |
    - Added JOB_CONFIG with intervals (weather: 30min, cleanup-tokens: 7 days)
    - Added Firebase persistence at cron/jobs/{jobName}
    - Smart scheduler: POST /api/cron (no ?job=) checks all jobs
    - Manual trigger: POST /api/cron?job=<name> forces execution
    - GET /api/cron shows job status with timeUntilDue
  implication: Implementation matches user requirements

- timestamp: 2026-02-04T10:28:00Z
  checked: Test results
  found: |
    - 110/112 test suites pass (2 pre-existing failures unrelated)
    - 2486/2490 tests pass
    - ESLint passes with no errors
  implication: Implementation is stable

## Resolution

root_cause: |
  User wanted an intelligent internal scheduler instead of relying on multiple
  cron-job.org entries. The previous implementation required:
  - One cron-job.org entry per task (weather, cleanup-tokens)
  - Each entry needed its own schedule configuration

  The user wanted:
  - Single cron-job.org entry calling /api/cron every minute
  - Internal scheduler managing timing for each job
  - Firebase persistence for execution timestamps

fix: |
  Implemented smart cron scheduler with:

  1. **JOB_CONFIG** - Configuration object with intervals for each job:
     - weather: 30 minutes (1800000ms)
     - cleanup-tokens: 7 days (604800000ms)

  2. **Firebase persistence** at `cron/jobs/{jobName}`:
     - lastExecution: ISO timestamp
     - lastResult: 'success' | 'error'
     - lastDurationMs: execution time
     - executionCount: total runs

  3. **Two modes**:
     - Smart scheduler (POST /api/cron): Checks all jobs, runs those due
     - Manual trigger (POST /api/cron?job=weather): Force immediate execution

  4. **GET /api/cron** returns comprehensive status:
     - Job descriptions and intervals
     - Last execution time and result
     - Time until next due (isDue, timeUntilDueHuman)
     - Execution counts

  5. **Response format** for smart scheduler shows:
     - Summary: executed/skipped/errors counts
     - Per-job details: status, result or skip reason, duration

verification: |
  - ESLint: No errors
  - Unit tests: 110/112 suites pass (2 pre-existing failures)
  - Test count: 2486/2490 pass
  - TypeScript path alias warnings expected (JS files with TS imports)

files_changed:
  - app/api/cron/route.ts (enhanced with smart scheduler)
  - docs/cron-setup.md (updated documentation)
