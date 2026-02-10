# Phase 50: Cron Automation Configuration - Research

**Researched:** 2026-02-10
**Domain:** GitHub Actions cron scheduling, Vercel serverless timeouts, dead man's switch monitoring
**Confidence:** HIGH

## Summary

GitHub Actions provides free cron scheduling using standard POSIX cron syntax with a 5-minute minimum interval, eliminating the need for external services or stateful servers. The existing `/api/scheduler/check` endpoint already implements fire-and-forget patterns with 60-second Vercel timeout, tracking cron health via Firebase `cronHealth/lastCall` with dead man's switch monitoring at 10-minute threshold.

Phase 50 simply configures GitHub Actions workflow to trigger this existing infrastructure automatically, with monitoring dashboard already built (`/monitoring` page, `DeadManSwitchPanel` component). No architectural changes needed - the app was designed for external HTTP cron from day one.

**Primary recommendation:** Create `.github/workflows/cron-scheduler.yml` with 5-minute schedule, calling existing endpoint with `CRON_SECRET`, and verify dashboard displays execution logs.

## User Constraints

**IMPORTANT:** No CONTEXT.md exists for this phase — no user decisions locked. Research explores all viable approaches and recommends best practices.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| GitHub Actions | N/A (native) | Cron scheduling, free tier, native Git integration | Industry standard for CI/CD, zero cost for public/private repos, no external dependencies |
| Vercel | 60s timeout (Pro plan) | Serverless function host, automatic scaling | Already deployed, fire-and-forget pattern proven in existing `/api/scheduler/check` |
| Firebase RTDB | 12.8.0 | Cron health tracking, execution logs | Already integrated, real-time updates, `cronHealth/lastCall` pattern established |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| date-fns | 4.1.0 | Timestamp formatting in monitoring UI | Already installed, used in `DeadManSwitchPanel` for relative time display |
| curl | N/A (GitHub runner) | HTTP request from GitHub Actions | Standard tool in ubuntu-latest runners, no installation needed |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| GitHub Actions | cron-job.org, EasyCron | External services cost $4-10/month for 5-min intervals, GitHub Actions free and integrated with repo |
| GitHub Actions | Vercel Cron (Beta) | Vercel Cron limited to Hobby plan 1 daily/Pro 1 hourly (not 5-min), not GA yet |
| GitHub Actions | AWS EventBridge + Lambda | Overkill for HTTP cron, adds AWS billing and complexity, GitHub simpler |
| 60s timeout | Background processing (waitUntil) | Current fire-and-forget pattern already handles long tasks asynchronously, no timeout issues |

**Installation:**
```bash
# No packages to install - GitHub Actions native, Vercel + Firebase already configured
```

## Architecture Patterns

### Recommended Project Structure
```
.github/
└── workflows/
    └── cron-scheduler.yml        # NEW: GitHub Actions cron config (5-min schedule)

app/api/
├── scheduler/check/route.ts      # EXISTING: Main cron orchestrator (60s timeout)
└── health-monitoring/
    ├── dead-man-switch/route.ts  # EXISTING: DMS status API
    └── logs/route.ts             # EXISTING: Cron execution logs

app/monitoring/
└── page.tsx                      # EXISTING: Monitoring dashboard

components/monitoring/
├── DeadManSwitchPanel.tsx        # EXISTING: DMS UI (10-min threshold)
└── MonitoringTimeline.tsx        # EXISTING: Execution logs timeline
```

### Pattern 1: GitHub Actions Cron Workflow
**What:** YAML workflow file with `on.schedule` trigger calling HTTP endpoint
**When to use:** Automated background tasks requiring 5-minute to daily intervals
**Example:**
```yaml
# Source: GitHub Actions docs + .github/workflows/sync-changelog.yml pattern
name: Cron Scheduler

on:
  schedule:
    # Every 5 minutes (GitHub Actions minimum interval)
    - cron: '*/5 * * * *'
  workflow_dispatch:  # Allow manual trigger for testing

jobs:
  run-scheduler:
    runs-on: ubuntu-latest
    timeout-minutes: 2  # Fail fast if endpoint hangs
    steps:
      - name: Trigger scheduler endpoint
        run: |
          echo "🔄 Triggering scheduler check..."
          RESPONSE=$(curl -s -w "\n%{http_code}" -X GET \
            "${{ secrets.VERCEL_APP_URL }}/api/scheduler/check?secret=${{ secrets.CRON_SECRET }}")

          HTTP_BODY=$(echo "$RESPONSE" | head -n -1)
          HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)

          echo "Response: $HTTP_BODY"
          echo "Status: $HTTP_CODE"

          if [ "$HTTP_CODE" -eq 200 ]; then
            echo "✅ Scheduler executed successfully"
          else
            echo "❌ Scheduler failed with status $HTTP_CODE"
            exit 1
          fi
```

### Pattern 2: Fire-and-Forget with 60s Timeout
**What:** Cron orchestrator completes fast operations synchronously, spawns slow operations asynchronously
**When to use:** Tasks exceeding 10s but under 60s, with async sub-tasks that can run independently
**Example:**
```typescript
// Source: app/api/scheduler/check/route.ts:766-997
export const GET = withCronSecret(async (_request) => {
  // FAST: Save health timestamp (blocking)
  await adminDbSet('cronHealth/lastCall', new Date().toISOString());

  // FAST: Check scheduler mode, get active schedule (blocking)
  const modeData = await adminDbGet('schedules-v2/mode');
  const active = /* ... find active schedule ... */;

  // FAST: Fetch stove status (blocking, ~500ms)
  const { currentStatus, isOn } = await fetchStoveData();

  // SLOW: Auto-calibration (fire-and-forget, 5-10s)
  calibrateValvesIfNeeded().then(result => {
    if (result.calibrated) console.log('✅ Calibration complete');
  }).catch(err => console.error('❌ Calibration error:', err));

  // SLOW: Weather refresh (fire-and-forget, 2-5s)
  refreshWeatherIfNeeded().then(/* ... */).catch(/* ... */);

  // SLOW: Token cleanup (fire-and-forget, weekly)
  cleanupTokensIfNeeded().then(/* ... */).catch(/* ... */);

  // FAST: Apply scheduler actions (blocking, critical path)
  if (active && !isOn) {
    await handleIgnition(active, ora);
  }

  // Return success before async tasks complete
  return success({ status: 'ACCESA', ora });
});
```

### Pattern 3: Dead Man's Switch Monitoring
**What:** Inversion of monitoring - expect regular check-ins, alert when absent
**When to use:** Cron health verification, passive monitoring systems
**Example:**
```typescript
// Source: lib/healthDeadManSwitch.ts (inferred from API usage)
export async function checkDeadManSwitch() {
  const lastCall = await adminDbGet('cronHealth/lastCall') as string | null;

  if (!lastCall) {
    return { stale: true, reason: 'never_run' };
  }

  const now = Date.now();
  const lastCallTime = new Date(lastCall).getTime();
  const elapsed = now - lastCallTime;
  const TEN_MINUTES_MS = 10 * 60 * 1000;

  if (elapsed > TEN_MINUTES_MS) {
    return {
      stale: true,
      reason: 'timeout',
      elapsed,
      lastCheck: lastCall,
    };
  }

  return {
    stale: false,
    elapsed,
    lastCheck: lastCall,
  };
}
```

### Pattern 4: Vercel Function Timeout Configuration
**What:** `vercel.json` `functions` config sets per-route max duration
**When to use:** Routes exceeding 10s default timeout (Pro plan allows up to 60s)
**Example:**
```json
// Source: vercel.json
{
  "functions": {
    "app/api/scheduler/check/route.js": {
      "maxDuration": 60
    }
  }
}
```

### Pattern 5: Monitoring Dashboard with Real-Time Status
**What:** React component polling DMS API every 30s, displaying cron health with visual indicators
**When to use:** User-facing monitoring, observability dashboards
**Example:**
```tsx
// Source: app/monitoring/page.tsx:56-85 + components/monitoring/DeadManSwitchPanel.tsx
export default function MonitoringPage() {
  const [dmsStatus, setDmsStatus] = useState(null);

  useEffect(() => {
    async function fetchDMS() {
      const res = await fetch('/api/health-monitoring/dead-man-switch');
      const data = await res.json();
      setDmsStatus(data);
    }

    fetchDMS();
    const interval = setInterval(fetchDMS, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, []);

  return (
    <DeadManSwitchPanel status={dmsStatus} />
  );
}

// DeadManSwitchPanel renders:
// - Green "Sistema attivo" if elapsed < 10 min
// - Red "Cron non risponde" if elapsed > 10 min
// - "Cron mai eseguito" if never run
```

### Anti-Patterns to Avoid
- **Anti-pattern:** Using `on.push` instead of `on.schedule` for periodic tasks
  - **Why:** Deploys don't guarantee regular intervals, misses scheduled windows
  - **Fix:** Use `on.schedule` with cron syntax for time-based execution
- **Anti-pattern:** Blocking cron endpoint until all async tasks complete
  - **Why:** Exceeds Vercel timeout, causes workflow failures
  - **Fix:** Fire-and-forget pattern with `.then()` for long-running tasks
- **Anti-pattern:** Hardcoding app URL in workflow instead of using secrets
  - **Why:** URL changes break workflow, exposes staging/prod URLs
  - **Fix:** Use `${{ secrets.VERCEL_APP_URL }}` for environment flexibility
- **Anti-pattern:** Setting DMS threshold < 2x cron interval
  - **Why:** False positives on single missed execution
  - **Fix:** 10-min threshold for 5-min cron = 2 missed executions required
- **Anti-pattern:** No `workflow_dispatch` trigger for testing
  - **Why:** Can't manually test workflow without waiting for cron
  - **Fix:** Add `workflow_dispatch` for on-demand execution

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Cron scheduling infrastructure | Custom server with setInterval, PM2 cron, Docker cron | GitHub Actions `on.schedule` | GitHub runners handle timing, retries, logs automatically. No server maintenance. |
| HTTP monitoring service | Custom health check system, ping monitoring | Firebase RTDB + dead man's switch pattern | Already have RTDB, DMS pattern proven, no external service needed |
| Cron execution logging | Custom log storage, file-based logs | Firebase RTDB events + MonitoringTimeline | Real-time updates, queryable via RTDB, existing UI |
| Timeout handling | Custom timeout wrappers, Promise.race | Vercel `maxDuration` config + fire-and-forget | Platform-native, automatic termination, no edge cases |

**Key insight:** The app's architecture anticipated external HTTP cron from day one. Don't rebuild what exists - configure GitHub Actions to trigger it.

## Common Pitfalls

### Pitfall 1: GitHub Actions Cron Drift
**What goes wrong:** Scheduled workflows execute 3-10 minutes late during high load
**Why it happens:** GitHub Actions queues jobs, not guaranteed to execute at exact time
**How to avoid:** Design for "approximately every 5 minutes" not "exactly at :00, :05, :10"
**Warning signs:** DMS alerts despite workflow running, inconsistent execution intervals

### Pitfall 2: Cron Secret Mismatch
**What goes wrong:** 401 Unauthorized from endpoint, cron executes but fails authentication
**Why it happens:** GitHub Actions secret doesn't match `CRON_SECRET` env var on Vercel
**How to avoid:** Verify secret matches: `gh secret set CRON_SECRET` = Vercel env var
**Warning signs:** GitHub Actions shows 401 responses, endpoint never saves `cronHealth/lastCall`

### Pitfall 3: Workflow Timeout Too Aggressive
**What goes wrong:** GitHub Actions job fails after 2 minutes even though endpoint succeeds
**Why it happens:** Endpoint returns 200 quickly, but GitHub expects response body to complete
**How to avoid:** Set `timeout-minutes: 2` (allows 60s endpoint + 60s buffer)
**Warning signs:** Workflow shows red X, but monitoring dashboard shows successful execution

### Pitfall 4: DMS Threshold Too Tight
**What goes wrong:** False positive alerts when single cron execution delayed
**Why it happens:** Threshold < 2x interval (e.g., 7 min threshold for 5 min cron)
**How to avoid:** Use 10-15 min threshold (2-3x interval) to tolerate single miss
**Warning signs:** Frequent "Cron non risponde" alerts that resolve within 5 minutes

### Pitfall 5: Fire-and-Forget Errors Lost
**What goes wrong:** Async tasks fail silently, no visibility into failures
**Why it happens:** `.catch()` only logs to console, not monitored
**How to avoid:** Log async failures to Firebase `healthMonitoring/events` for dashboard visibility
**Warning signs:** Weather data stops updating, but no errors in monitoring timeline

### Pitfall 6: Rate Limit Failure Cascade
**What goes wrong:** Persistent rate limiter down causes cron to skip all actions
**Why it happens:** Phase 49 rate limiter called before every notification, single point of failure
**How to avoid:** Already handled by RATE-05 feature flag fallback to in-memory
**Warning signs:** No scheduler notifications despite active schedule, rate limit transaction errors

## Code Examples

Verified patterns from official sources:

### GitHub Actions Cron Schedule Syntax
```yaml
# Source: https://docs.github.com/actions/using-workflows/events-that-trigger-workflows
on:
  schedule:
    # Every 5 minutes (minimum interval allowed by GitHub)
    - cron: '*/5 * * * *'

    # Every 15 minutes
    - cron: '*/15 * * * *'

    # Every hour at :30
    - cron: '30 * * * *'

    # Daily at 3 AM UTC
    - cron: '0 3 * * *'

    # Weekdays at 11 AM UTC
    - cron: '0 11 * * 1-5'

# IMPORTANT: Times are UTC, not local timezone
# Use https://crontab.guru for visualization
```

### Existing Cron Endpoint (Already Built)
```typescript
// Source: app/api/scheduler/check/route.ts:766-773
export const GET = withCronSecret(async (_request) => {
  // Save cron health timestamp (FIRST action - critical for DMS)
  const cronHealthTimestamp = new Date().toISOString();
  console.log(`🔄 Tentativo salvataggio Firebase cronHealth/lastCall: ${cronHealthTimestamp}`);

  await adminDbSet('cronHealth/lastCall', cronHealthTimestamp);
  console.log(`✅ Cron health updated: ${cronHealthTimestamp}`);

  // ... rest of scheduler logic (200+ lines)
  // Handles: mode check, stove control, coordination, maintenance, etc.
});
```

### Existing DMS Panel Component (Already Built)
```tsx
// Source: components/monitoring/DeadManSwitchPanel.tsx:164-211
// Stale - timeout (> 10 minutes)
if (status.reason === 'timeout') {
  const minutesElapsed = Math.floor((status.elapsed || 0) / 60000);

  return (
    <Card>
      <CardHeader>
        <Heading level={2} variant="subtle">Cron Health</Heading>
        <StatusBadge status="stale" color="danger" pulse />
      </CardHeader>

      <div className="bg-danger-500/10 border border-danger-500/20">
        <AlertTriangle className="text-danger-400" />
        <Text variant="danger">Cron non risponde</Text>
        <Text variant="secondary" size="sm">
          Tempo trascorso: <span className="text-danger-400">{minutesElapsed} minuti</span>
        </Text>
        <Text variant="secondary" size="sm">
          Ultimo controllo: {formatDistanceToNow(new Date(status.lastCheck), { locale: it })}
        </Text>
      </div>
    </Card>
  );
}
```

### Firebase Schema for Cron Health (Already Exists)
```javascript
// Source: docs/systems/monitoring.md + inferred from API
{
  "cronHealth": {
    "lastCall": "2026-02-10T15:45:30.123Z"  // ISO UTC timestamp
  },

  "healthMonitoring": {
    "events": {
      "<eventId>": {
        "timestamp": "2026-02-10T15:45:30Z",
        "type": "scheduler_check",
        "duration": 1234,  // ms
        "success": true,
        "details": {
          "status": "ACCESA",
          "mode": "auto",
          "active": { /* ... */ }
        }
      }
    }
  }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| External cron services (cron-job.org) | GitHub Actions native cron | Phase 50 (2026-02-10) | Zero cost, Git-integrated, no external dependencies |
| Heroku Scheduler (15-min minimum) | GitHub Actions (5-min minimum) | Phase 50 | Better responsiveness for health monitoring |
| Custom ping monitoring | Dead man's switch pattern | Already in use (v1.0) | Inverted logic: expect success signals, alert on absence |
| Separate health check + scheduler | Unified `/api/scheduler/check` | Already in use | Single endpoint, atomic health tracking |

**Deprecated/outdated:**
- **Vercel Cron (Beta):** Limited to daily (Hobby) or hourly (Pro), not 5-minute intervals
- **AWS EventBridge + Lambda:** Overkill for simple HTTP cron, adds billing complexity
- **Traditional ping monitoring:** Fire-and-forget cron better suited for dead man's switch
- **Manual cron execution:** Already eliminated by design, Phase 50 automates what's manual

## Open Questions

1. **Should cron run health monitoring AND coordination check in single call?**
   - What we know: `/api/scheduler/check` already runs both in one execution
   - What's unclear: N/A - already unified
   - Recommendation: Keep unified - health tracking already atomic

2. **What's optimal threshold for DMS alerts? 10 min or 15 min?**
   - What we know: Current implementation uses 10 min (2x 5-min interval)
   - What's unclear: Whether GitHub Actions drift causes false positives
   - Recommendation: Start with 10 min, increase to 15 min if false positives occur

3. **Should GitHub Actions workflow retry on endpoint failure?**
   - What we know: Current workflow exits with code 1 on non-200 response
   - What's unclear: Whether retry helps (could be app down, not transient error)
   - Recommendation: No retry - let DMS alert after 10 min, investigate root cause

4. **How to display cron execution logs in monitoring dashboard?**
   - What we know: MonitoringTimeline component exists, displays health events
   - What's unclear: Whether `/api/scheduler/check` logs execution to Firebase
   - Recommendation: Add `healthMonitoring/events/{id}` write after each execution (CRON-05)

5. **Should workflow run on push for testing, or only schedule?**
   - What we know: Existing `sync-changelog.yml` uses both `on.push` and `on.schedule`
   - What's unclear: Whether testing on every push creates noise
   - Recommendation: Use `workflow_dispatch` only (manual trigger) for testing

## Sources

### Primary (HIGH confidence)
- [GitHub Actions Workflow Syntax](https://docs.github.com/actions/using-workflows/workflow-syntax-for-github-actions) - `on.schedule` cron syntax
- [Events that Trigger Workflows](https://docs.github.com/actions/learn-github-actions/events-that-trigger-workflows) - Schedule event documentation
- [Vercel Functions Limits](https://vercel.com/docs/functions/limitations) - 10s default, 60s Pro timeout limits
- [Healthchecks.io Documentation](https://healthchecks.io/docs/) - Dead man's switch pattern explanation
- Project codebase: `app/api/scheduler/check/route.ts`, `components/monitoring/DeadManSwitchPanel.tsx`, `vercel.json`

### Secondary (MEDIUM confidence)
- [Scheduled Actions with Cron](https://jasonet.co/posts/scheduled-actions/) - GitHub Actions cron patterns
- [Vercel Serverless Functions Timing Out](https://vercel.com/kb/guide/what-can-i-do-about-vercel-serverless-functions-timing-out) - Fire-and-forget solutions
- [Securing Monitoring Stack with Dead Man Switch](https://seifrajhi.github.io/blog/securing-monitoring-stack-dead-man-switch/) - DMS monitoring architecture
- [How to Set Up Dead Man's Switch in Prometheus](https://blog.ediri.io/how-to-set-up-a-dead-mans-switch-in-prometheus) - Threshold configuration patterns

### Tertiary (LOW confidence)
- [Dead Man's Snitch](https://deadmanssnitch.com/) - Commercial DMS service (marked for reference, not using)
- [Vercel Cron Beta](https://vercel.com/changelog/serverless-functions-can-now-run-up-to-5-minutes) - Limited to daily/hourly, not 5-min (ruled out)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - GitHub Actions native, existing Vercel + Firebase patterns proven
- Architecture: HIGH - Cron endpoint, DMS monitoring, and dashboard already built
- Pitfalls: MEDIUM - GitHub Actions drift documented, but project-specific edge cases need validation
- Monitoring UI: HIGH - DeadManSwitchPanel and MonitoringTimeline components exist and tested

**Research date:** 2026-02-10
**Valid until:** 2026-03-12 (30 days - GitHub Actions cron stable, serverless patterns mature)
