---
phase: 50-cron-automation-configuration
plan: 01
subsystem: automation
tags: [github-actions, cron, automation, infrastructure]
dependency_graph:
  requires: []
  provides: [cron-workflow, automated-triggers]
  affects: [health-monitoring, scheduler]
tech_stack:
  added: [github-actions-cron]
  patterns: [5-minute-schedule, workflow-dispatch, query-param-auth]
key_files:
  created:
    - .github/workflows/cron-scheduler.yml
  modified: []
decisions:
  - "5-minute cron schedule chosen to balance responsiveness with API cost"
  - "Query param authentication (not Bearer header) for simpler curl invocation"
  - "Separate steps for visibility in GitHub Actions UI"
  - "2-minute timeout prevents infinite hangs"
metrics:
  duration_seconds: 156
  tasks_completed: 1
  files_created: 1
  commits: 1
  completed_date: 2026-02-10
---

# Phase 50 Plan 01: GitHub Actions Cron Workflow Summary

**One-liner:** GitHub Actions workflow triggering health monitoring and scheduler checks every 5 minutes via CRON_SECRET authenticated HTTP calls

## Overview

Created `.github/workflows/cron-scheduler.yml` to automate the two core endpoints that drive the stove control system. This eliminates manual intervention and enables fully automated operation.

## What Was Built

### GitHub Actions Workflow

**File:** `.github/workflows/cron-scheduler.yml`

**Triggers:**
- **Schedule:** `cron: '*/5 * * * *'` (every 5 minutes)
- **Manual:** `workflow_dispatch` for testing

**Job Configuration:**
- Runner: `ubuntu-latest`
- Timeout: 2 minutes (safety limit)

**Steps:**

1. **Health Monitoring Check**
   - Calls `/api/health-monitoring/check?secret=${{ secrets.CRON_SECRET }}`
   - Validates HTTP 200 response
   - Exits 1 on failure

2. **Scheduler Check**
   - Calls `/api/scheduler/check?secret=${{ secrets.CRON_SECRET }}`
   - Validates HTTP 200 response
   - Exits 1 on failure

3. **Summary**
   - Prints UTC completion timestamp
   - Confirms both checks passed

**Authentication:** Uses `CRON_SECRET` as query parameter (matching `withCronSecret` middleware pattern)

**Error Handling:** Each step captures response body and status code, exits with code 1 on non-200 responses

## Implementation Details

### Pattern Match with sync-changelog.yml

Followed the proven pattern from existing workflow:
- Same response capture technique (`curl -s -w "\n%{http_code}"`)
- Same status code extraction (`head -n -1` / `tail -n 1`)
- Same conditional exit logic
- Same secret reference pattern (`${{ secrets.* }}`)

### Differences from sync-changelog.yml

| Aspect | sync-changelog.yml | cron-scheduler.yml |
|--------|-------------------|-------------------|
| Trigger | `on.push` | `on.schedule` + `on.workflow_dispatch` |
| HTTP Method | POST | GET |
| Auth Method | Bearer header | Query param |
| Steps | 1 endpoint | 2 endpoints |
| Wait Time | 4 minutes | None (immediate) |

### Why Query Param Authentication?

The `withCronSecret` middleware supports both:
- `Authorization: Bearer xxx` header
- `?secret=xxx` query parameter

Chose query param for simplicity in curl commands and GitHub Actions logs.

## Deviations from Plan

None - plan executed exactly as written.

## Verification

### YAML Validation
```bash
python3 -c "import yaml; yaml.safe_load(open('.github/workflows/cron-scheduler.yml'))"
# Result: ✅ YAML valid
```

### Required Elements Check
```bash
grep -c "*/5 * * * *" .github/workflows/cron-scheduler.yml  # 1
grep -c "workflow_dispatch" .github/workflows/cron-scheduler.yml  # 1
grep -c "health-monitoring/check" .github/workflows/cron-scheduler.yml  # 1
grep -c "scheduler/check" .github/workflows/cron-scheduler.yml  # 1
grep -c "CRON_SECRET" .github/workflows/cron-scheduler.yml  # 2
grep -c "VERCEL_APP_URL" .github/workflows/cron-scheduler.yml  # 2
```

All required elements present.

## User Setup Required

Before the workflow can run, configure GitHub Actions secrets:

1. **VERCEL_APP_URL**
   - Location: GitHub repo → Settings → Secrets and variables → Actions → New repository secret
   - Value: Production Vercel URL (e.g., `https://pannello-stufa.vercel.app`)

2. **CRON_SECRET**
   - Location: Same as above
   - Value: Must match the `CRON_SECRET` environment variable configured in Vercel
   - Purpose: Authenticates GitHub Actions to call protected cron endpoints

**Testing:** After configuring secrets, trigger workflow manually via GitHub UI → Actions → Cron Scheduler → Run workflow

## Integration Points

### Endpoints Called

1. **`/api/health-monitoring/check`**
   - Updates dead man's switch
   - Checks user stove health
   - Logs results to Firestore
   - Triggers health monitoring alerts (connection lost, state mismatch, stove error)

2. **`/api/scheduler/check`**
   - Applies scheduled ignition/shutdown
   - Tracks maintenance hours
   - Syncs Netatmo valves
   - Refreshes weather data
   - Cleans up stale FCM tokens
   - Runs PID automation
   - Proactively refreshes Hue tokens

### Authentication Flow

GitHub Actions → `?secret=xxx` → `withCronSecret` middleware → endpoint execution

## Technical Decisions

### 1. 5-Minute Schedule
**Decision:** `cron: '*/5 * * * *'`

**Rationale:**
- Balances responsiveness with API call costs
- Matches scheduler precision (5-minute intervals)
- Provides timely health monitoring without overwhelming endpoints

**Alternative considered:** 1-minute schedule (excessive for scheduler, acceptable for health monitoring but increases Vercel function invocations)

### 2. Separate Steps
**Decision:** Two separate curl steps instead of single script

**Rationale:**
- Individual endpoint failures visible in GitHub Actions UI
- Easier debugging (see which endpoint failed)
- Matches GitHub Actions best practices

**Alternative considered:** Single shell script with both calls (less visibility)

### 3. 2-Minute Timeout
**Decision:** `timeout-minutes: 2`

**Rationale:**
- Vercel endpoints have 60s timeout (Hobby plan)
- 2 minutes allows endpoint execution + network overhead + buffer
- Prevents infinite hangs if endpoint becomes unresponsive

**Alternative considered:** 1 minute (might timeout on slow networks), 5 minutes (unnecessarily long)

## Impact

### Before
- Manual cron trigger required (external service or manual testing)
- No automated health monitoring
- No scheduled ignition/shutdown

### After
- Fully automated cron execution every 5 minutes
- Dead man's switch updated automatically
- Health monitoring alerts triggered automatically
- Scheduler applies ignition/shutdown automatically
- Weather, tokens, and maintenance tracked automatically

## Self-Check: PASSED

**Created files exist:**
```bash
[ -f ".github/workflows/cron-scheduler.yml" ] && echo "FOUND: .github/workflows/cron-scheduler.yml"
# Result: FOUND: .github/workflows/cron-scheduler.yml
```

**Commits exist:**
```bash
git log --oneline --all | grep -q "7424352" && echo "FOUND: 7424352"
# Result: FOUND: 7424352
```

All claims verified.

## Next Steps

1. **Configure GitHub Secrets** (required before first run)
   - Add `VERCEL_APP_URL` secret
   - Add `CRON_SECRET` secret

2. **Manual Test** (recommended)
   - GitHub UI → Actions → Cron Scheduler → Run workflow
   - Verify both steps show green checkmarks
   - Check Vercel logs for endpoint execution

3. **Monitor First Cron Run** (automatic after 5 minutes)
   - GitHub UI → Actions → Verify cron trigger appears
   - Check dead man's switch updated in Firebase: `cronHealth/lastCall`
   - Verify scheduler applied (if within schedule interval)

4. **Plan 50-02** (next plan)
   - Document cron setup in main documentation
   - Add troubleshooting guide for failed cron runs
   - Create monitoring dashboard for cron health

## Files Changed

**Created:**
- `.github/workflows/cron-scheduler.yml` (55 lines)

**Modified:**
- None

## Commits

- `7424352`: feat(50-01): create GitHub Actions cron workflow for automated checks
