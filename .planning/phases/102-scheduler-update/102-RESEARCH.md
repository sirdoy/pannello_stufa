# Phase 102: Scheduler Update - Research

**Researched:** 2026-03-19
**Domain:** Next.js API route migration — scheduler cron, proxy client wiring, state string adaptation
**Confidence:** HIGH

## Summary

Phase 102 migrates the scheduler route (`app/api/scheduler/check/route.ts`) from direct WiNet API calls (`lib/stoveApi.ts`) to the Thermorossi proxy client (`lib/thermorossiProxy.ts`). The migration is a transport swap: the proxy is already built and tested (Phase 99-101), the scheduler logic does not change. Three categories of changes are required: (1) replace 8 stoveApi imports with proxy equivalents and consolidate 3 parallel status calls into 1, (2) replace all `.includes('WORK')`/`.includes('START')` substring checks with exact `=== 'working'`/`=== 'igniting'` equality against the `StoveState` union, (3) add alarm notification using `error_code`/`error_description` from the proxy status response.

A dependent file, `lib/maintenanceServiceAdmin.ts`, also uses `.includes('WORK')` and `.includes('MODULATION')` on the status string passed from the scheduler — a 2-line fix required to maintain correctness after the scheduler passes `stove_state` values instead of `StatusDescription` strings. The test suite mocks `lib/stoveApi` throughout; all mock targets change to `lib/thermorossiProxy`.

**Primary recommendation:** Implement as a single plan (102-01) — all changes are in 2 files (route.ts + maintenanceServiceAdmin.ts) with test updates. The proxy client is already available with no new dependencies required.

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

#### Import migration
- Replace all `lib/stoveApi` imports with `lib/thermorossiProxy` equivalents
- Mapping: `getStoveStatus` → `getStatus`, `getFanLevel`/`getPowerLevel` → removed (status includes both), `igniteStove` → `sendIgnit`, `shutdownStove` → `sendShutdown`, `setPowerLevel` → `setPower`, `setFanLevel` → `setFan`
- No stoveApi imports should remain in the scheduler route after migration

#### State string mapping (exact equality)
- All `.includes('WORK')` checks → `=== 'working'`
- All `.includes('START')` checks → `=== 'igniting'`
- All `.includes('MODULATION')` checks → `=== 'modulating'`
- `isOn` derived as: `stove_state === 'working' || stove_state === 'igniting' || stove_state === 'modulating'`
- No substring matching, no regex, no `.toUpperCase()` — exact equality against `StoveState` union type

#### API call consolidation (fetchStoveData)
- Replace 3 parallel calls (`getStoveStatus`, `getFanLevel`, `getPowerLevel`) with single `getStatus()` from thermorossiProxy
- `getStatus()` returns `{ stove_state, power_level, fan_level, data_freshness, error_code, error_description }`
- `currentStatus` becomes `statusData.stove_state` (lowercase string, not `StatusDescription`)
- `currentPowerLevel` becomes `statusData.power_level` (direct field, not `Result`)
- `currentFanLevel` becomes `statusData.fan_level` (direct field, not `Result`)
- Catch block: if `getStatus()` throws, set `statusFetchFailed = true` (same safety behavior)

#### Command signature changes
- `igniteStove(active.power)` → `sendIgnit()` (no power argument — proxy ignit takes no params)
- After `sendIgnit()`, call `setPower(active.power)` separately to set the desired power level
- `shutdownStove()` → `sendShutdown()`
- `setPowerLevel(level)` → `setPower(level)` (same semantics, different function name)
- `setFanLevel(level)` → `setFan(level)` (same semantics, different function name)

#### handleIgnition confirmation check
- Confirmation re-fetch uses `getStatus()` from thermorossiProxy instead of `getStoveStatus()` from stoveApi
- Check `confirmStatus.stove_state === 'working' || confirmStatus.stove_state === 'igniting'` for already-on detection

#### updateStoveState strings
- `updateStoveState({ status: 'START' })` → `updateStoveState({ status: 'igniting' })`
- `updateStoveState({ status: 'STANDBY' })` → `updateStoveState({ status: 'standby' })`

#### sendStoveStatusWorkNotification
- `currentStatus.includes('WORK')` → `currentStatus === 'working'`
- Notification message update: replace "stato WORK" with "stato working"

#### Alarm/error notification (CRON-02)
- After `getStatus()` in `fetchStoveData`, check `stove_state === 'alarm'`
- When alarm detected, extract `error_code` and `error_description` from status response
- Pass error details to a notification trigger (use existing `triggerStoveUnexpectedOffServer` or create alarm-specific path)
- Error description text goes directly into notification message body

#### trackUsageHours adaptation
- `trackUsageHours(currentStatus)` still receives a string — now receives `stove_state` value
- Update `maintenanceServiceAdmin.ts`: `stoveStatus.includes('WORK') || stoveStatus.includes('MODULATION')` → `stoveStatus === 'working' || stoveStatus === 'modulating'`
- This is a 2-line change in a dependent file, justified because the scheduler passes the status string

#### PID automation
- `currentStatus.includes('WORK')` → `currentStatus === 'working'`
- `setPowerLevel(targetPower as any)` → `setPower(targetPower)`
- No other PID logic changes — PID reads from Firebase/Netatmo, only the stove power command changes

#### Thermorossi proxy health check
- Add thermorossi proxy health alongside existing Netatmo proxy health in the cron
- Use `getHealth()` from thermorossiProxy, save to Firebase at `thermorossi/proxyHealth`
- Same pattern as Netatmo health check (lines 993-1014): try/catch with unreachable fallback

### Claude's Discretion
- Whether to add the thermorossi health check in this phase or defer to Phase 103
- Exact alarm notification trigger (reuse existing trigger or add new one)
- Whether `updateStoveState` type needs updating for new status strings
- Test file updates for the scheduler route

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| CRON-01 | Scheduler reads stove_state instead of StatusDescription for state decisions | State string mapping table (exact equality), fetchStoveData consolidation, all `.includes()` → `===` replacements across 5 call sites |
| CRON-02 | Health monitoring reads error_code/error_description for alarm notifications | `ThermorossiStatusResponse` has `error_code: number | null` and `error_description: string | null` populated only when `stove_state === 'alarm'`; existing notification triggers available |
| CRON-03 | All scheduler stove API calls route through proxy client | `lib/thermorossiProxy.ts` exports getStatus, sendIgnit, sendShutdown, setPower, setFan, getHealth — all needed functions present |
</phase_requirements>

---

## Standard Stack

### Core (no new dependencies — proxy client already built)
| Module | Version | Purpose | Why Standard |
|--------|---------|---------|--------------|
| `lib/thermorossiProxy.ts` | project | Proxy client wrappers | Built in Phase 99, all needed functions present |
| `types/thermorossiProxy.ts` | project | TypeScript types for proxy responses | `StoveState` union, `ThermorossiStatusResponse` shape |
| `lib/stoveApi.ts` | project | WiNet client being replaced | Import source to remove — not add |

### Proxy Functions Available
| Old (stoveApi) | New (thermorossiProxy) | Notes |
|---------------|----------------------|-------|
| `getStoveStatus()` | `getStatus()` | Returns full status incl. `stove_state`, `power_level`, `fan_level`, `error_code`, `error_description` |
| `getFanLevel()` | removed — use `getStatus().fan_level` | Consolidated into single status call |
| `getPowerLevel()` | removed — use `getStatus().power_level` | Consolidated into single status call |
| `igniteStove(power)` | `sendIgnit()` then `setPower(power)` | proxy ignit takes no params; set power separately |
| `shutdownStove()` | `sendShutdown()` | Identical semantics |
| `setPowerLevel(level)` | `setPower(level)` | Identical semantics |
| `setFanLevel(level)` | `setFan(level)` | Identical semantics |
| (none) | `getHealth()` | New — add thermorossi health check to cron |

**No installation required.** All modules are already in the project.

---

## Architecture Patterns

### Recommended Project Structure (unchanged)
```
app/api/scheduler/check/
├── route.ts                    # Main file to modify (~1032 lines)
└── __tests__/
    └── route.test.ts           # Test file to update (mocks change)
lib/
├── thermorossiProxy.ts         # Source for all new stove imports
├── maintenanceServiceAdmin.ts  # 2-line fix: exact equality for status strings
└── stoveApi.ts                 # No longer imported from scheduler
```

### Pattern 1: fetchStoveData Consolidation (3 calls → 1)

**What:** Replace `Promise.all([getStoveStatus, getFanLevel, getPowerLevel])` with single `getStatus()` call.

**Before:**
```typescript
const [statusData, fanData, powerData] = await Promise.all([
  getStoveStatus().catch(...)
  getFanLevel().catch(...)
  getPowerLevel().catch(...)
]);
if (statusData) {
  currentStatus = statusData.StatusDescription || 'unknown';
  isOn = currentStatus.includes('WORK') || currentStatus.includes('START');
}
if (fanData) currentFanLevel = fanData.Result ?? 3;
if (powerData) currentPowerLevel = powerData.Result ?? 2;
```

**After:**
```typescript
// Source: lib/thermorossiProxy.ts (getStatus returns ThermorossiStatusResponse)
try {
  const statusData = await getStatus();
  currentStatus = statusData.stove_state;
  isOn = statusData.stove_state === 'working'
      || statusData.stove_state === 'igniting'
      || statusData.stove_state === 'modulating';
  currentFanLevel = statusData.fan_level ?? 3;
  currentPowerLevel = statusData.power_level ?? 2;
  // CRON-02: alarm notification
  if (statusData.stove_state === 'alarm') {
    // trigger alarm notification with error_code / error_description
  }
} catch (error) {
  statusFetchFailed = true;
}
```

### Pattern 2: Ignition with Separate Power Set

**What:** `sendIgnit()` takes no arguments; power must be set in a separate call after ignition.

**Before:**
```typescript
await igniteStove(active.power);
await updateStoveState({ status: 'START', ... });
```

**After:**
```typescript
// Source: docs/api/thermorossi.md — POST /commands/ignit takes no body
await sendIgnit();
await setPower(active.power);          // Set desired power level after ignition
await updateStoveState({ status: 'igniting', ... });
```

**Note:** The confirmation re-fetch in `handleIgnition` must also switch to `getStatus()`:
```typescript
const confirmData = await getStatus();
if (confirmData.stove_state === 'working' || confirmData.stove_state === 'igniting') {
  return { skipped: true, reason: 'ALREADY_ON' };
}
```

### Pattern 3: Alarm Notification (CRON-02)

**What:** After `getStatus()`, check for alarm state and notify using existing notification infrastructure.

```typescript
// Source: types/thermorossiProxy.ts — error_code and error_description present only when stove_state === 'alarm'
if (statusData.stove_state === 'alarm') {
  const adminUserId = process.env.ADMIN_USER_ID;
  if (adminUserId) {
    const errorMsg = statusData.error_description
      ? `Allarme stufa: ${statusData.error_description} (codice ${statusData.error_code})`
      : 'Allarme stufa rilevato';
    triggerStoveUnexpectedOffServer(adminUserId, { message: errorMsg }).catch(() => {});
  }
}
```

**Claude's discretion note:** Re-using `triggerStoveUnexpectedOffServer` is appropriate because there's no alarm-specific trigger and the semantic (unexpected stove condition requiring attention) is aligned. A rate-limit / cooldown should be applied using an existing Firebase path pattern to avoid spam if alarm persists across multiple cron runs.

### Pattern 4: Netatmo Health Check Pattern (reuse for Thermorossi)

The existing Netatmo health check at route.ts lines 992-1014 provides the exact pattern for the thermorossi health check:

```typescript
// Source: app/api/scheduler/check/route.ts lines 992-1014
try {
  const health = await getHealth();           // from thermorossiProxy
  const healthPath = getEnvironmentPath('thermorossi/proxyHealth');
  await adminDbSet(healthPath, {
    status: health.status,
    data_freshness: health.data_freshness,
    last_poll_at: health.last_poll_at,
    checked_at: Date.now(),
  });
} catch (healthError) {
  const healthPath = getEnvironmentPath('thermorossi/proxyHealth');
  await adminDbSet(healthPath, {
    status: 'unreachable',
    data_freshness: 'UNREACHABLE',
    checked_at: Date.now(),
  });
}
```

**Claude's discretion note:** Include the thermorossi health check in this phase (not deferred to 103) because the `getHealth` function is available in the proxy client and this is the correct point of integration — the scheduler is the only server-side actor that regularly runs on every cron tick.

### Pattern 5: maintenanceServiceAdmin.ts Fix

**What:** 2-line change to replace substring matching with exact equality.

```typescript
// lib/maintenanceServiceAdmin.ts lines 33-36 — BEFORE
const isWorking = (
  stoveStatus.includes('WORK') ||
  stoveStatus.includes('MODULATION')
);

// AFTER
const isWorking = (
  stoveStatus === 'working' ||
  stoveStatus === 'modulating'
);
```

### Anti-Patterns to Avoid

- **Keeping any `.includes()` check on status strings:** All state decisions must use exact equality. There are exactly 5 call sites in the scheduler route and 1 in maintenanceServiceAdmin.ts — all must be migrated.
- **Passing `active.power` to `sendIgnit()`:** `sendIgnit()` signature is `() => Promise<ThermorossiCommandResponse>` — no parameters accepted. Power must be set separately via `setPower(active.power)`.
- **Leaving `fanData.Result` or `powerData.Result` references:** These fields come from the old WiNet response shape. The proxy returns `fan_level` and `power_level` directly on the status response.
- **Logging "stato WORK" in notification messages:** String must be updated to "stato working" to match proxy stove_state values.
- **Ignoring 202 Accepted from proxy commands:** Commands return 202 (not 200). The proxy client wrappers (`sendIgnit`, `sendShutdown`, `setPower`, `setFan`) already handle this correctly — callers need not check the status code.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Stove state checks | Custom substring matchers | Exact `===` against `StoveState` union | Type-safe, exhaustive, already established in Phase 101 (stoveStatusUtils) |
| Stove API transport | Direct WiNet fetch calls | `lib/thermorossiProxy.ts` wrappers | Handles auth, timeouts, RFC 9457 error mapping |
| Alarm notification message format | Custom error formatting | `statusData.error_description` + `statusData.error_code` directly from proxy | Proxy already maps WiNet Error/ErrorDescription fields |

**Key insight:** The proxy client is a drop-in replacement for stoveApi — no new abstraction is needed, just a name change and field name adjustment.

---

## Common Pitfalls

### Pitfall 1: Missing `setPower` Call After `sendIgnit`
**What goes wrong:** Stove ignites but stays at default power level instead of `active.power`.
**Why it happens:** Old `igniteStove(power)` accepted a power argument and set it atomically. `sendIgnit()` takes no parameters.
**How to avoid:** Always follow `sendIgnit()` with `await setPower(active.power)` in `handleIgnition`.
**Warning signs:** Stove ignites successfully but power level remains unchanged.

### Pitfall 2: `power_level` / `fan_level` Null When Stove is Off/Alarm
**What goes wrong:** `currentPowerLevel` or `currentFanLevel` default to `null` instead of expected numeric defaults.
**Why it happens:** Proxy returns `power_level: null` and `fan_level: null` when `stove_state === 'alarm'` (and potentially `'off'`).
**How to avoid:** Always apply null-coalescing defaults: `statusData.power_level ?? 2` and `statusData.fan_level ?? 3` — same pattern as before.
**Warning signs:** TypeScript error on `currentPowerLevel` being `number | null` instead of `number`.

### Pitfall 3: Test Mocks Still Reference `lib/stoveApi`
**What goes wrong:** Tests still mock `@/lib/stoveApi` functions but route now imports from `@/lib/thermorossiProxy`.
**Why it happens:** `jest.mock('@/lib/stoveApi')` is declared at the top of the test file and all mock references are typed against stoveApi shapes.
**How to avoid:** Replace `jest.mock('@/lib/stoveApi')` with `jest.mock('@/lib/thermorossiProxy')`, update all import statements and typed mock references, and update mock return values from `{ StatusDescription: 'Spento', Result: 0 }` to `{ stove_state: 'off', power_level: 2, fan_level: 3, data_freshness: 'LIVE', error_code: null, error_description: null }`.
**Warning signs:** Tests pass but import the wrong mock module, giving false confidence.

### Pitfall 4: `isOn` Definition Missing `modulating`
**What goes wrong:** Stove in `modulating` state is treated as off, triggering unwanted ignition.
**Why it happens:** Old code only checked `WORK` and `START`; `MODULATION` was a separate case. Proxy exposes `modulating` as a distinct state.
**How to avoid:** Define `isOn` as `stove_state === 'working' || stove_state === 'igniting' || stove_state === 'modulating'`. This matches the pattern established in Phase 101 for `isStoveActive`.
**Warning signs:** Scheduler attempts to re-ignite a modulating stove.

### Pitfall 5: Alarm Notification Spam
**What goes wrong:** If the stove stays in `alarm` state, every cron tick (every 5 minutes) fires a notification.
**Why it happens:** Without a cooldown check, the alarm notification path runs on every `getStatus()` call when `stove_state === 'alarm'`.
**How to avoid:** Use an existing Firebase cooldown path (e.g., `scheduler/lastAlarmNotification`) with a 1-hour cooldown — same pattern as `checkAndNotifyUnexpectedOff` at line 338-344.
**Warning signs:** User receives repeated alarm notifications within minutes.

---

## Code Examples

### Complete fetchStoveData Rewrite
```typescript
// Source: lib/thermorossiProxy.ts — getStatus() shape
async function fetchStoveData(): Promise<any> {
  let currentStatus: StoveState = 'off';
  let isOn = false;
  let currentFanLevel = 3;
  let currentPowerLevel = 2;
  let statusFetchFailed = false;

  try {
    const statusData = await getStatus();
    currentStatus = statusData.stove_state;
    isOn = statusData.stove_state === 'working'
        || statusData.stove_state === 'igniting'
        || statusData.stove_state === 'modulating';
    currentFanLevel = statusData.fan_level ?? 3;
    currentPowerLevel = statusData.power_level ?? 2;

    // CRON-02: alarm state detected — fire-and-forget notification
    if (statusData.stove_state === 'alarm') {
      notifyAlarmIfNeeded(statusData.error_code, statusData.error_description).catch(() => {});
    }
  } catch (error) {
    console.error('❌ Status fetch failed:', error instanceof Error ? error.message : String(error));
    console.warn('⚠️ Status unavailable - will skip state-changing actions for safety');
    statusFetchFailed = true;
  }

  return { currentStatus, isOn, currentFanLevel, currentPowerLevel, statusFetchFailed };
}
```

### Test Mock Update Pattern
```typescript
// BEFORE (route.test.ts)
jest.mock('@/lib/stoveApi');
import { getStoveStatus, getFanLevel, getPowerLevel, ... } from '@/lib/stoveApi';
mockGetStoveStatus.mockResolvedValue({ StatusDescription: 'Spento', Result: 0 } as any);

// AFTER
jest.mock('@/lib/thermorossiProxy');
import { getStatus, sendIgnit, sendShutdown, setPower, setFan } from '@/lib/thermorossiProxy';
const mockGetStatus = jest.mocked(getStatus);
mockGetStatus.mockResolvedValue({
  stove_state: 'off',
  power_level: 2,
  fan_level: 3,
  data_freshness: 'LIVE',
  last_poll_at: null,
  error_code: null,
  error_description: null,
});
```

### updateStoveState String Updates
```typescript
// handleIgnition — BEFORE
await updateStoveState({ status: 'START', statusDescription: 'Avvio automatico', ... });

// handleIgnition — AFTER
await updateStoveState({ status: 'igniting', statusDescription: 'Avvio automatico', ... });

// handleShutdown — BEFORE
await updateStoveState({ status: 'STANDBY', statusDescription: 'Spegnimento automatico', ... });

// handleShutdown — AFTER
await updateStoveState({ status: 'standby', statusDescription: 'Spegnimento automatico', ... });
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `getStoveStatus().StatusDescription` substring matching | `getStatus().stove_state` exact equality against `StoveState` union | Phase 99 (types), Phase 101 (frontend), Phase 102 (scheduler) | Type-safe, no false positives on partial string matches |
| 3 parallel API calls (status + fan + power) | Single `getStatus()` call returning all fields | Phase 99 proxy design | Fewer network hops, simpler error handling |
| `igniteStove(power)` — power embedded in ignite | `sendIgnit()` then `setPower(power)` — separate operations | Phase 100 proxy API design | Proxy ignit command matches WiNet Ignit endpoint (no power param) |
| Direct WiNet cloud calls with retries | Proxy-mediated calls via `haGet`/`haPost` | Phase 99 | Auth centralized, retries handled by proxy, caching enabled |

**Deprecated/outdated:**
- `StatusDescription` string: WiNet-specific field, replaced by `stove_state` enum — no longer present in proxy responses
- `Result` field: WiNet numeric response field, replaced by `power_level`/`fan_level` named fields
- `lib/stoveApi.ts` imports in scheduler: all to be removed in this phase (file itself deleted in Phase 103)

---

## Open Questions

1. **Alarm notification trigger: reuse `triggerStoveUnexpectedOffServer` or create new?**
   - What we know: `triggerStoveUnexpectedOffServer` exists, has rate-limiting in its callers, handles push notification delivery
   - What's unclear: Whether its notification template is suitable for alarm semantics vs unexpected-off semantics
   - Recommendation: Reuse it with alarm-specific message content. A cooldown check (1-hour, Firebase-backed) should be added at the call site in `fetchStoveData` to prevent spam. If semantics need to diverge later, a dedicated trigger can be added in a future phase.

2. **Whether `updateStoveState` type accepts `'igniting'` and `'standby'` strings**
   - What we know: The function currently receives `'START'` and `'STANDBY'`; it's a Firebase write helper
   - What's unclear: Whether the type definition for the `status` field is a string literal union that would reject new values
   - Recommendation: Check `lib/stoveStateService.ts` type definition before implementing. If it's `string`, no change needed. If it's a union, add `'igniting'` and `'standby'` to it.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest (project-wide) |
| Config file | `jest.config.ts` |
| Quick run command | `npm test -- app/api/scheduler/check/__tests__/route.test.ts` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| CRON-01 | `currentStatus` uses `stove_state` exact equality; `isOn` includes `modulating` | unit | `npm test -- app/api/scheduler/check/__tests__/route.test.ts` | Yes (needs mock update) |
| CRON-02 | Alarm state triggers notification with `error_code`/`error_description` | unit | `npm test -- app/api/scheduler/check/__tests__/route.test.ts` | Yes (needs new test case) |
| CRON-03 | No `stoveApi` imports remain; all calls go through `thermorossiProxy` | unit | `npm test -- app/api/scheduler/check/__tests__/route.test.ts` | Yes (mock target change) |

### Sampling Rate
- **Per task commit:** `npm test -- app/api/scheduler/check/__tests__/route.test.ts`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `app/api/scheduler/check/__tests__/route.test.ts` — existing file needs mock target update (`jest.mock('@/lib/stoveApi')` → `jest.mock('@/lib/thermorossiProxy')`) and new test cases for alarm notification (CRON-02) and `modulating` in `isOn` (CRON-01)

---

## Sources

### Primary (HIGH confidence)
- `lib/thermorossiProxy.ts` — confirmed function signatures: `getStatus()`, `sendIgnit()`, `sendShutdown()`, `setPower(value)`, `setFan(value)`, `getHealth()`
- `types/thermorossiProxy.ts` — confirmed `ThermorossiStatusResponse` shape, `StoveState` union
- `docs/api/thermorossi.md` — live-verified proxy API spec (2026-03-18): status response fields, command endpoints, state mapping table
- `app/api/scheduler/check/route.ts` — full source of file to migrate (1032 lines); all 8 import call sites identified
- `lib/maintenanceServiceAdmin.ts` — confirmed 2-line fix location (lines 33-36)
- `app/api/scheduler/check/__tests__/route.test.ts` — confirmed test structure, mock setup patterns
- `lib/stoveApi.ts` — confirmed all 7 exported functions being replaced

### Secondary (MEDIUM confidence)
- `docs/api/README.md` — HA proxy auth (X-API-Key) and RFC 9457 error format, consistent with thermorossiProxy.ts implementation
- `.planning/STATE.md` — Phase 101 decisions confirming `modulating` must be included in `isStoveActive`

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — proxy client is built and tested; function signatures verified directly from source
- Architecture: HIGH — migration patterns are explicit in CONTEXT.md, code is fully readable, precedent from Phase 101 (stoveStatusUtils) applies directly
- Pitfalls: HIGH — identified from direct reading of scheduler route and test file; null handling and `modulating` gap verified from types

**Research date:** 2026-03-19
**Valid until:** 2026-04-19 (stable internal codebase — no external dependencies changing)
