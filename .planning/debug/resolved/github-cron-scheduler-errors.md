---
status: resolved
trigger: "The GitHub Actions cron scheduler that runs every 5 minutes intermittently fails. Need to connect via `gh` CLI, analyze recent failed runs, find root cause, and fix."
created: 2026-02-16T10:00:00Z
updated: 2026-02-16T10:00:00Z
---

## Current Focus

hypothesis: CONFIRMED - vercel.json references route.js but actual file is route.ts, causing timeout config to be ignored
test: Fix vercel.json path to match TypeScript file
expecting: Vercel will apply 60-second timeout instead of 10-second default
next_action: Update vercel.json configuration

## Symptoms

expected: The cron scheduler runs every 5 minutes, checks schedules, and turns on/off the stove accordingly
actual: Sometimes the cron run fails — intermittent failures
errors: User hasn't checked specific error messages — we need to retrieve them from GitHub Actions logs
reproduction: Intermittent — happens unpredictably
timeline: Unknown start — has been happening periodically

## Eliminated

## Evidence

- timestamp: 2026-02-16T10:05:00Z
  checked: GitHub Actions workflow runs via gh CLI
  found: 3 failures out of ~100 recent runs - all with same pattern: Health check passes (200), Scheduler check fails with 504 Gateway Timeout and error "FUNCTION_INVOCATION_TIMEOUT"
  implication: The /api/scheduler/check endpoint is timing out intermittently, taking longer than Vercel's function timeout limit

- timestamp: 2026-02-16T10:06:00Z
  checked: Workflow file .github/workflows/cron-scheduler.yml
  found: Two steps - Health Monitoring Check and Scheduler Check. Both use curl with secret. Workflow has timeout-minutes: 2 but no timeout on curl commands
  implication: GitHub Actions timeout is not the issue - Vercel function timeout is the issue

- timestamp: 2026-02-16T10:07:00Z
  checked: Failed run timing analysis
  found: All 3 failures show ~10 second delay before 504 (e.g., 25.8473464Z to 36.0381381Z = ~10 seconds)
  implication: Vercel's default serverless function timeout is 10 seconds - the scheduler check is exceeding this

- timestamp: 2026-02-16T10:10:00Z
  checked: /app/api/scheduler/check/route.ts file (1032 lines)
  found: Extremely complex route with many async operations - stove API calls, Firebase reads/writes, notifications, Netatmo sync, weather refresh, token cleanup, PID automation, etc. Many operations run sequentially with await.
  implication: The cumulative time of all these operations intermittently exceeds 10 seconds

- timestamp: 2026-02-16T10:12:00Z
  checked: vercel.json configuration
  found: File exists with maxDuration: 60 configured for "app/api/scheduler/check/route.js"
  implication: Configuration uses .js extension but the file is .ts - CONFIGURATION MISMATCH! Vercel is not applying the 60-second timeout, defaulting to 10 seconds instead

## Resolution

root_cause: vercel.json configures maxDuration: 60 for "app/api/scheduler/check/route.js" but the actual file is route.ts (TypeScript migration in v5.0). Vercel doesn't match the path, so the timeout config is ignored and defaults to 10 seconds. The scheduler route is complex with many sequential operations that intermittently exceed 10 seconds, causing FUNCTION_INVOCATION_TIMEOUT errors.
fix: Update vercel.json to reference the correct TypeScript path: "app/api/scheduler/check/route.ts"
verification: Fix applied - vercel.json now correctly references route.ts instead of route.js. This is a configuration-only change that will take effect on next deployment. The 60-second timeout will prevent the intermittent FUNCTION_INVOCATION_TIMEOUT errors that occurred when the route took >10 seconds to complete.
files_changed: ["/Users/federicomanfredi/Sites/localhost/pannello-stufa/vercel.json"]
