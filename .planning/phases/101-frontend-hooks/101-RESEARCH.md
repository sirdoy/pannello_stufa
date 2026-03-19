# Phase 101: Frontend Hooks - Research

**Researched:** 2026-03-19
**Domain:** React hook adaptation — proxy response shape migration for stove frontend
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **Status string mapping:** Rewrite `stoveStatusUtils.ts` with new proxy strings directly: `working`, `off`, `igniting`, `standby`, `cleaning`, `alarm`, `modulating`. No translation layer. Exact equality checks (`===`) against `stove_state` string union. Status-to-display mapping preserves existing Ember Noir theme colors and icons.
- **Staleness strategy:** Replace `useDeviceStaleness('stove', thresholdMs)` call in `useStoveData` with `data_freshness` from the proxy status response. `data_freshness: 'LIVE'` → not stale; `data_freshness: 'STALE'` → show staleness indicator. Remove the dynamic threshold logic (90s on / 180s off). `useDeviceStaleness` hook itself is NOT deleted.
- **Command response handling:** `useStoveCommands` continues using `response.ok` for success detection — covers both 200 and 202. Extract `suggested_poll_delay_s` from 202 response body. Delay `fetchStatusAndUpdate()` by `suggested_poll_delay_s * 1000` ms instead of calling immediately. Handle 409 Conflict as user-facing error: "Command not allowed in current state".
- **Error display:** When `stove_state === 'alarm'`, read `error_code` and `error_description` from proxy status response. Display in StoveBanners component. Format: `error_description` as banner message, `error_code` as secondary info. Clear when `stove_state` transitions away from `alarm`.
- **useStoveData response parsing:** `fetchStatusAndUpdate()` reads `stove_state`, `power_level`, `fan_level`, `data_freshness`, `error_code`, `error_description` from `/stove/status`. Remove separate `/stove/fan` and `/stove/power` fetches — combined status response already includes both.

### Claude's Discretion

- Exact staleness indicator UI when data_freshness is STALE (badge, banner, or opacity change)
- Whether to add suggested_poll_delay_s as a timeout or use a simpler fixed delay
- Test file organization for the rewritten stoveStatusUtils

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| UI-01 | `useStoveData` reads `stove_state` (exact equality), `power_level`, `fan_level` from proxy response | `fetchStatusAndUpdate()` currently reads `StatusDescription`/`Error`/`ErrorDescription`; must switch to reading `stove_state`/`power_level`/`fan_level`/`data_freshness`/`error_code`/`error_description` from the single `/stove/status` call. The proxy API types (`ThermorossiStatusResponse`) are already defined. |
| UI-02 | `stoveStatusUtils.ts` rewritten for exact `stove_state` matching | All 7 switch arms currently use `toUpperCase().includes()` substring checks. Must replace with direct `===` comparison against the `StoveState` union type from `types/thermorossiProxy.ts`. All visual properties (colors, icons) preserved. |
| UI-03 | `useStoveCommands` handles 202 Accepted response pattern from proxy | Current commands call `fetchStatusAndUpdate()` immediately after `response` truthy check. Must extract `suggested_poll_delay_s` from response body and delay the status refresh. 409 Conflict needs explicit handling. |
| UI-04 | Error display uses `error_code` and `error_description` from proxy status | `StoveBanners` already receives `errorCode`/`errorDescription` props and renders `ErrorAlert`. `useStoveData` currently reads `Error`/`ErrorDescription` from old API. Must read from `stove_state === 'alarm'` gate in the new proxy response. |
| UI-05 | `data_freshness` from proxy replaces custom staleness logic for stove provider | `useDeviceStaleness('stove', threshold)` call in `useStoveData` is replaced by inspecting `data_freshness` field from `/stove/status` response. `staleness` shape passed to `StoveStatus` must remain compatible or adapted. |
</phase_requirements>

---

## Summary

Phase 101 is a transport adaptation — no new UI features, no new components. The stove card already renders correctly; the goal is to make three files (`useStoveData.ts`, `useStoveCommands.ts`, `stoveStatusUtils.ts`) consume the proxy response shape instead of the old WiNet shape.

The proxy API types are fully defined in `types/thermorossiProxy.ts` (`StoveState`, `DataFreshness`, `ThermorossiStatusResponse`, `ThermorossiCommandResponse`). The Next.js API routes that sit between the hooks and the proxy already return the proxy shape (Phase 99 migrated `/stove/status`, Phase 100 migrated all command routes). The hooks are the last layer still reading the old WiNet field names.

The primary complexity lies in three areas: (1) replacing substring matching in `stoveStatusUtils.ts` with exact equality while keeping 7 display branches and all visual properties intact; (2) adapting the command handlers to extract `suggested_poll_delay_s` before calling `fetchStatusAndUpdate()`; (3) replacing the `useDeviceStaleness` polling loop with a boolean derived from `data_freshness` in the status response — without breaking the `StalenessInfo | null` shape that `StoveStatus` consumes.

**Primary recommendation:** Work file-by-file in dependency order — `stoveStatusUtils.ts` first (pure functions, easiest to test), then `useStoveData.ts` (staleness + 3→1 fetch consolidation), then `useStoveCommands.ts` (delayed refresh + 409 handling). Update tests in the same pass as each file.

---

## Standard Stack

This phase uses no new packages. All required infrastructure exists.

### Core (already installed)
| Library | Version | Purpose | Role in this phase |
|---------|---------|---------|---------------------|
| `types/thermorossiProxy.ts` | project-local | `StoveState`, `DataFreshness`, `ThermorossiStatusResponse`, `ThermorossiCommandResponse` types | Single source of truth for proxy shapes |
| `lib/thermorossiProxy.ts` | project-local | `getStatus()`, command wrappers | Reference only — Next.js API routes call these server-side; hooks call the API routes |
| `lib/hooks/useAdaptivePolling` | project-local | 60s polling with `alwaysActive: true` | Unchanged — stays in `useStoveData` |
| `lib/hooks/useRetryableCommand` | project-local | Retry infrastructure for commands | Unchanged — stays in `useStoveCommands` |
| `lib/hooks/useDeviceStaleness` | project-local | IndexedDB-based staleness | REMOVED from `useStoveData` only; hook file not deleted |

### Alternatives Considered

None — all tooling is locked. This is adaptation, not selection.

---

## Architecture Patterns

### Current vs. Target State

**`stoveStatusUtils.ts` — status string contract change:**

Current (WiNet `StatusDescription` substring matching):
```typescript
// Source: stoveStatusUtils.ts current implementation
const statusUpper = status.toUpperCase();
if (statusUpper.includes('WORK')) { ... }
if (statusUpper.includes('OFF')) { ... }
if (statusUpper.includes('START')) { ... }
if (statusUpper.includes('STANDBY') || statusUpper.includes('WAIT')) { ... }
if (statusUpper.includes('ERROR') || statusUpper.includes('ALARM')) { ... }
if (statusUpper.includes('CLEAN')) { ... }
if (statusUpper.includes('MODULATION')) { ... }
```

Target (proxy `stove_state` exact equality):
```typescript
// Source: types/thermorossiProxy.ts StoveState union
import type { StoveState } from '@/types/thermorossiProxy';

export function getStatusInfo(status: StoveState | null): StoveStatusInfo {
  if (!status) { return loadingState; }
  switch (status) {
    case 'working':    return { label: 'IN FUNZIONE', icon: '🔥', ... };
    case 'off':        return { label: 'SPENTA', icon: '❄️', ... };
    case 'igniting':   return { label: 'AVVIO IN CORSO', icon: '🚀', ... };
    case 'standby':    return { label: 'IN ATTESA', icon: '💤', ... };
    case 'alarm':      return { label: 'ERRORE', icon: '⚠️', ... };
    case 'cleaning':   return { label: 'PULIZIA', icon: '🔄', ... };
    case 'modulating': return { label: 'MODULAZIONE', icon: '🌡️', ... };
  }
}
```

The switch replaces the if-chain. All colors/icons/animation flags are identical — only the key strings change. The function signature narrows from `string | null` to `StoveState | null`.

**`useStoveData.ts` — three changes:**

1. `fetchStatusAndUpdate()` field reading:
```typescript
// Before (reading WiNet fields from old route):
const newStatus = json?.StatusDescription || 'sconosciuto';
const newErrorCode = json?.Error ?? 0;
const newErrorDescription = json?.ErrorDescription || '';
// + separate calls to fetchFanLevel() and fetchPowerLevel()

// After (reading proxy fields from proxy-backed route):
const { stove_state, power_level, fan_level, data_freshness, error_code, error_description } = json as ThermorossiStatusResponse;
setStatus(stove_state);
setFanLevel(fan_level);
setPowerLevel(power_level);
setIsStale(data_freshness === 'STALE');
setErrorCode(stove_state === 'alarm' ? (error_code ?? 0) : 0);
setErrorDescription(stove_state === 'alarm' ? (error_description ?? '') : '');
```

2. Remove `fetchFanLevel()`, `fetchPowerLevel()` functions and their calls.

3. Replace `useDeviceStaleness` call with a `useState<boolean>` for staleness:
```typescript
// Before:
const stoveStalenessThreshold = isAccesa ? 90000 : 180000;
const staleness = useDeviceStaleness('stove', stoveStalenessThreshold);

// After:
const [isStale, setIsStale] = useState(false);
// staleness prop for StoveStatus: construct a minimal object
const staleness = isStale ? { isStale: true, cachedAt: null, ageSeconds: null } : null;
```

The `UseStoveDataReturn` interface `staleness` field is `StalenessInfo | null`. The `StoveStatus` component only uses `staleness?.isStale` and `staleness?.cachedAt`. Passing `null` when not stale is backward-compatible.

4. Update `isAccesa` and `isSpenta` derived state:
```typescript
// Before (substring matching):
const isAccesa = status?.includes('WORK') || status?.includes('START');
const isSpenta = status?.includes('OFF') || status?.includes('ERROR') || status?.includes('WAIT');

// After (exact equality using StoveState):
const isAccesa = status === 'working' || status === 'igniting' || status === 'modulating';
const isSpenta = status === 'off' || status === 'alarm' || status === 'standby';
```

Note: `StoveCard.tsx` also has inline substring check at line 171:
```typescript
stoveData.status?.toUpperCase().includes('WORK')
```
This controls visibility of `StoveAdjustments`. Must be updated to `stoveData.status === 'working'` as part of this phase.

**`useStoveCommands.ts` — delayed refresh + 409 handling:**

```typescript
// Before (ignite handler — immediate refresh):
const response = await igniteCmd.execute(STOVE_ROUTES.ignite, { method: 'POST', body: JSON.stringify({ source: 'manual' }) });
if (response) {
  await logStoveAction.ignite();
  await stoveData.fetchStatusAndUpdate();
}

// After (read suggested_poll_delay_s, delay refresh):
const response = await igniteCmd.execute(STOVE_ROUTES.ignite, { method: 'POST', body: JSON.stringify({ source: 'manual' }) });
if (response) {
  const data = await response.json() as ThermorossiCommandResponse;
  await logStoveAction.ignite();
  const delayMs = (data.suggested_poll_delay_s ?? 5) * 1000;
  await new Promise(resolve => setTimeout(resolve, delayMs));
  await stoveData.fetchStatusAndUpdate();
}
```

409 handling (state gating): `useRetryableCommand` wraps fetch. The 409 response will be surfaced as a failed response. The handler must check for 409 specifically:

```typescript
// In execute() result — response.status === 409:
if (response && !response.ok && response.status === 409) {
  throw new Error('Command not allowed in current state');
}
```

However, `igniteCmd.execute()` returns `Response | null` (null = deduplicated). Non-ok responses from `useRetryableCommand` depend on how that hook surfaces errors. Need to verify whether the hook throws on non-ok or returns the response.

**`handleFanChange` / `handlePowerChange` cleanup:**

These handlers currently read `data.modeChanged` and `data.returnToAutoAt` from the response body to update semi-manual mode. After Phase 100, the command routes return `ThermorossiCommandResponse` which has no `modeChanged` field. This data-reading block must be removed. The commands now just log and trigger the delayed refresh.

### Anti-Patterns to Avoid

- **Keeping `fetchFanLevel()` / `fetchPowerLevel()` functions**: They fire redundant requests now that `/stove/status` returns all three values. Delete them.
- **Retaining `toUpperCase().includes()` in stoveStatusUtils**: The proxy state strings are lowercase exact values. After migration, a substring check on 'alarm' would match even a hypothetical 'alarming' state. Use `===` exclusively.
- **Passing `useDeviceStaleness` threshold dynamically based on proxy state**: The proxy's own 180s threshold governs `data_freshness`. The PWA should not second-guess this.
- **Calling `fetchStatusAndUpdate()` before the delay timeout**: The stove state machine is slow. Polling immediately after command acceptance will almost always return the same state. The `suggested_poll_delay_s` hint exists for this reason.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Command response typing | Inline interface | `ThermorossiCommandResponse` from `types/thermorossiProxy.ts` | Already exists; provides `suggested_poll_delay_s`, `previous_state`, `command` |
| Status typing | Redefine state strings | `StoveState` union from `types/thermorossiProxy.ts` | Single source of truth; switch statements become exhaustive-checked |
| Staleness boolean | Custom timestamp calculation | `data_freshness === 'STALE'` comparison | Proxy owns the 180s freshness decision; PWA trusts it |
| Delay implementation | Custom debounce/queue | `setTimeout` wrapped in `Promise` | One-shot delay after command acceptance is the correct pattern |

---

## Common Pitfalls

### Pitfall 1: Staleness shape mismatch breaking StoveStatus
**What goes wrong:** `StoveStatus` receives `staleness: StalenessInfo | null`. After replacing `useDeviceStaleness`, the component will receive a hand-crafted object or `null` instead of a real `StalenessInfo`. If the shape differs, TypeScript errors or silent UI breakage occurs.
**Why it happens:** `StalenessInfo` has `{ isStale: boolean; cachedAt: Date | null; ageSeconds: number | null }`. The `StoveStatus` component uses `staleness?.cachedAt` to render the "Ultimo aggiornamento" timestamp (via `formatDistanceToNow`). Without `cachedAt`, that line shows nothing, which is acceptable.
**How to avoid:** When `data_freshness === 'STALE'`, construct: `{ isStale: true, cachedAt: null, ageSeconds: null }`. When `LIVE`, pass `null`. This matches the `StalenessInfo | null` type.
**Warning signs:** TypeScript error on `staleness` prop in StoveStatus; `formatDistanceToNow` throwing on non-Date value.

### Pitfall 2: modeChanged data reading removed breaks scheduler semi-manual UI
**What goes wrong:** `handleFanChange` and `handlePowerChange` currently read `data.modeChanged` and `data.returnToAutoAt` from the command response to update semi-manual scheduler state immediately. After migration, `ThermorossiCommandResponse` has no `modeChanged` field. If the code is kept as-is, it silently fails (undefined check).
**Why it happens:** The old route wrapped WiNet and injected scheduler-mode change info into the response. The proxy route returns a clean `ThermorossiCommandResponse`.
**How to avoid:** Remove the `data.modeChanged` block entirely from both handlers. The scheduler state will update on the next `fetchStatusAndUpdate()` call (after the delay).
**Warning signs:** Semi-manual mode banner not appearing after fan/power change (regression); TypeScript `Property 'modeChanged' does not exist` error.

### Pitfall 3: isAccesa substring check in StoveCard.tsx controls StoveAdjustments visibility
**What goes wrong:** `StoveCard.tsx` line 171 has `stoveData.status?.toUpperCase().includes('WORK')` as a visibility condition for `StoveAdjustments`. This is an inline check that is NOT inside `stoveStatusUtils.ts` or `useStoveData.ts`. After `status` changes from `'WORK PHASE 2'` to `'working'`, the `.includes('WORK')` check still passes (since `'working'.toUpperCase()` is `'WORKING'` which includes `'WORK'`). However, the `isAccesa` / `isSpenta` derived state inside `useStoveData` uses substring matching that must be updated. If one is fixed and the other is not, behavior diverges.
**Why it happens:** The inline check in StoveCard was not factored through the utils. `'working'.toUpperCase().includes('WORK')` = `'WORKING'.includes('WORK')` = `true` — this particular check accidentally still works with the new string. BUT `isAccesa` uses `includes('WORK') || includes('START')` while `'igniting'` and `'modulating'` are now also active states that should count as "accesa". The old logic missed `modulating`.
**How to avoid:** Update `isAccesa` in `useStoveData`: `status === 'working' || status === 'igniting' || status === 'modulating'`. Update `isSpenta`: `status === 'off' || status === 'alarm' || status === 'standby'`. Update `StoveCard.tsx` inline check to `stoveData.status === 'working'` (adjustments only make sense when actively working, not igniting/modulating).
**Warning signs:** StoveAdjustments hidden during `working` state, or shown during non-working states.

### Pitfall 4: 409 Conflict not handled — silent failure
**What goes wrong:** If user taps ignite while stove is `igniting` (state gating), the proxy returns 409. `useRetryableCommand` will surface this as a non-ok response. Without explicit 409 handling, the error is either swallowed or shown as a generic retry error.
**Why it happens:** The retry infrastructure (`useRetryableCommand`) was designed around transient failures (503/504/network). 409 is a permanent state-gating refusal — retry would fail again.
**How to avoid:** Before passing response to `response.json()`, check `response.ok`. If not ok and `response.status === 409`, throw `new Error('Command not allowed in current state')`. This surfaces in the `lastError` field of the command object, which StoveBanners already renders.
**Warning signs:** No visible feedback when stove command is state-gated; retry button appearing for a 409 error.

### Pitfall 5: Test expectations still test old string values
**What goes wrong:** `stoveStatusUtils.test.ts` currently passes inputs like `'WORK PHASE 1'`, `'STARTING UP'`, `'ALARM 7'` which are WiNet-style strings. After rewriting to exact equality, `getStatusInfo('WORK PHASE 1')` hits the default unknown branch, not the `working` branch.
**Why it happens:** Tests were written to match the old substring matching behavior.
**How to avoid:** Rewrite test cases to pass proxy state strings: `'working'`, `'igniting'`, `'alarm'`, etc. The test structure and assertions are otherwise correct.
**Warning signs:** All status-specific tests failing after rewrite; only null and default cases pass.

---

## Code Examples

### Pattern 1: Proxy status field extraction in fetchStatusAndUpdate

```typescript
// Source: types/thermorossiProxy.ts ThermorossiStatusResponse
const fetchStatusAndUpdate = async () => {
  try {
    const res = await fetch(STOVE_ROUTES.status);
    if (!res.ok) throw new Error(`Status fetch failed: ${res.status}`);
    const json = await res.json() as ThermorossiStatusResponse;

    const { stove_state, power_level, fan_level, data_freshness, error_code, error_description } = json;

    setStatus(stove_state);
    setFanLevel(fan_level);
    setPowerLevel(power_level);
    setIsStale(data_freshness === 'STALE');

    if (stove_state === 'alarm') {
      const code = error_code ?? 0;
      const desc = error_description ?? '';
      setErrorCode(code);
      setErrorDescription(desc);
      if (code !== 0) {
        await logError(code, desc, { status: stove_state, source: 'status_monitor' });
        if (shouldNotify(code, previousErrorCode.current)) { /* push notification */ }
      }
      previousErrorCode.current = code;
    } else {
      setErrorCode(0);
      setErrorDescription('');
      previousErrorCode.current = 0;
    }

    await fetchSchedulerMode();
    await fetchMaintenanceStatus();
    await checkVersion();
  } catch (err) {
    console.error('Errore stato:', err);
    setStatus('off'); // fallback to known safe state
  } finally {
    setInitialLoading(false);
  }
};
```

### Pattern 2: Delayed post-command refresh

```typescript
// Source: useStoveCommands.ts pattern (all command handlers follow this)
const handleIgnite = async () => {
  stoveData.setLoadingMessage('Accensione stufa...');
  stoveData.setLoading(true);
  try {
    const response = await igniteCmd.execute(STOVE_ROUTES.ignite, { method: 'POST', body: JSON.stringify({}) });
    if (response) {
      if (!response.ok) {
        if (response.status === 409) throw new Error('Command not allowed in current state');
        throw new Error(`Command failed: ${response.status}`);
      }
      const data = await response.json() as ThermorossiCommandResponse;
      await logStoveAction.ignite();
      const delayMs = (data.suggested_poll_delay_s ?? 15) * 1000;
      await new Promise<void>(resolve => setTimeout(resolve, delayMs));
      await stoveData.fetchStatusAndUpdate();
    }
  } finally {
    stoveData.setLoading(false);
  }
};
```

### Pattern 3: Exact equality in stoveStatusUtils

```typescript
// Source: types/thermorossiProxy.ts StoveState
import type { StoveState } from '@/types/thermorossiProxy';

export function getStatusInfo(status: StoveState | null): StoveStatusInfo {
  if (!status) {
    return { label: 'CARICAMENTO...', icon: '⏳', animated: true, /* ...same loading state */ };
  }
  switch (status) {
    case 'working':
      return { label: 'IN FUNZIONE', icon: '🔥', textColor: 'text-ember-400 ...', animated: true, pulse: true, /* all ember colors unchanged */ };
    case 'off':
      return { label: 'SPENTA', icon: '❄️', textColor: 'text-slate-400 ...', animated: false, /* all slate colors unchanged */ };
    case 'igniting':
      return { label: 'AVVIO IN CORSO', icon: '🚀', textColor: 'text-ocean-400 ...', animated: true, pulse: true, /* all ocean colors unchanged */ };
    case 'standby':
      return { label: 'IN ATTESA', icon: '💤', textColor: 'text-warning-400 ...', animated: true };
    case 'alarm':
      return { label: 'ERRORE', icon: '⚠️', textColor: 'text-danger-400 ...', animated: true, pulse: true };
    case 'cleaning':
      return { label: 'PULIZIA', icon: '🔄', textColor: 'text-sage-400 ...', animated: true, pulse: true };
    case 'modulating':
      return { label: 'MODULAZIONE', icon: '🌡️', textColor: 'text-ocean-400 ...', animated: true };
  }
}
```

### Pattern 4: Staleness from data_freshness

```typescript
// In useStoveData — replace useDeviceStaleness call with derived boolean
const [isStale, setIsStale] = useState(false);

// staleness passed to StoveStatus — compatible with StalenessInfo | null
const staleness: import('@/lib/pwa/stalenessDetector').StalenessInfo | null = isStale
  ? { isStale: true, cachedAt: null, ageSeconds: null }
  : null;

// StoveStatus renders:
// - staleness?.isStale → badge "Dati non aggiornati"
// - staleness?.cachedAt → "Ultimo aggiornamento: X ago" (null = not shown)
```

### Pattern 5: isAccesa / isSpenta with exact equality

```typescript
// Source: useStoveData — derived state after status update
const isAccesa = status === 'working' || status === 'igniting' || status === 'modulating';
const isSpenta = status === 'off' || status === 'alarm' || status === 'standby';
// Note: 'cleaning' is neither — cleaning stove is neither safely off nor actively heating
```

---

## State of the Art

| Old Approach | New Approach | Impact |
|--------------|-------------|--------|
| `json?.StatusDescription` field reading | `json.stove_state` from `ThermorossiStatusResponse` | Type-safe, no optional chaining needed |
| `json?.Error` / `json?.ErrorDescription` | `json.error_code` / `json.error_description` (only when `stove_state === 'alarm'`) | Conditional population — null when not in alarm |
| 3 API calls per poll (status + getFan + getPower) | 1 API call per poll (status includes all three) | 66% reduction in polling overhead |
| `useDeviceStaleness('stove', dynamicThreshold)` | `data_freshness === 'STALE'` boolean from status response | Proxy owns freshness decision; no timer management in hook |
| `toUpperCase().includes('WORK')` substring matching | `=== 'working'` exact equality | TypeScript exhaustiveness checking; no partial-match surprises |
| Immediate `fetchStatusAndUpdate()` after command | Delayed by `suggested_poll_delay_s * 1000 ms` | Avoids polling during slow state transition (ignition = 5-15 min) |

**Deprecated/outdated in this phase:**
- `fetchFanLevel()` function in `useStoveData`: redundant, `/stove/status` now returns `fan_level`
- `fetchPowerLevel()` function in `useStoveData`: redundant, `/stove/status` now returns `power_level`
- `STOVE_ROUTES.getFan` and `STOVE_ROUTES.getPower` usages in `useStoveData` (routes themselves may stay for Phase 103 cleanup)
- Dynamic staleness threshold (`isAccesa ? 90000 : 180000`) — proxy owns this decision now

---

## Open Questions

1. **Does `useRetryableCommand.execute()` return the raw `Response` or a parsed body?**
   - What we know: `handleFanChange` calls `response.json()` after checking `if (response)`, and reads `data.modeChanged`. This suggests `execute()` returns `Response | null`.
   - What's unclear: Whether `execute()` throws on non-ok status or returns the non-ok `Response`. If it throws, 409 handling is in a catch block. If it returns, check `response.ok` before `response.json()`.
   - Recommendation: Read `lib/hooks/useRetryableCommand.ts` during planning to confirm the return behavior. Design 409 handling accordingly.

2. **StalenessInfo shape for StoveStatus timestamp display**
   - What we know: `StoveStatus` renders `staleness?.cachedAt` via `formatDistanceToNow`. Proxy status response has `last_poll_at` (ISO 8601 string).
   - What's unclear: Whether to populate `cachedAt` from `last_poll_at` to preserve the "last updated" timestamp display.
   - Recommendation: When `data_freshness === 'STALE'`, construct `{ isStale: true, cachedAt: last_poll_at ? new Date(last_poll_at) : null, ageSeconds: null }`. This restores the timestamp display when data is stale. When `LIVE`, pass `null`.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Jest + @testing-library/react |
| Config file | `jest.config.ts` |
| Quick run command | `npm test -- --testPathPattern="stoveStatusUtils\|useStoveData\|useStoveCommands" --passWithNoTests` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| UI-01 | `fetchStatusAndUpdate()` reads `stove_state`, `power_level`, `fan_level`, `data_freshness` from single fetch | unit (renderHook) | `npm test -- --testPathPattern="useStoveData"` | ✅ `__tests__/components/devices/stove/hooks/useStoveData.test.ts` |
| UI-02 | `getStatusInfo('working')` returns ember colors; all 7 states return correct display | unit (pure) | `npm test -- --testPathPattern="stoveStatusUtils"` | ✅ `__tests__/components/devices/stove/stoveStatusUtils.test.ts` |
| UI-03 | Command handlers delay `fetchStatusAndUpdate()` by `suggested_poll_delay_s`; 409 surfaces as error | unit (renderHook + act) | `npm test -- --testPathPattern="useStoveCommands"` | ✅ `__tests__/components/devices/stove/hooks/useStoveCommands.test.ts` |
| UI-04 | `errorCode`/`errorDescription` populated only when `stove_state === 'alarm'`; cleared on other states | unit (renderHook) | `npm test -- --testPathPattern="useStoveData"` | ✅ (same file as UI-01) |
| UI-05 | `staleness.isStale` is `true` when `data_freshness === 'STALE'`; `null` when `LIVE` | unit (renderHook) | `npm test -- --testPathPattern="useStoveData"` | ✅ (same file as UI-01) |

### Sampling Rate

- **Per task commit:** `npm test -- --testPathPattern="stoveStatusUtils\|useStoveData\|useStoveCommands"`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps

None — existing test infrastructure covers all phase requirements. The three test files already exist and will need their test cases updated to use proxy state strings, not WiNet state strings.

---

## Sources

### Primary (HIGH confidence)
- `types/thermorossiProxy.ts` (project) — `StoveState`, `DataFreshness`, `ThermorossiStatusResponse`, `ThermorossiCommandResponse` types read directly
- `docs/api/thermorossi.md` (project) — authoritative proxy API spec: status response shape, 202 pattern, state gating table, `data_freshness` semantics
- `app/components/devices/stove/hooks/useStoveData.ts` (project) — current implementation read directly
- `app/components/devices/stove/hooks/useStoveCommands.ts` (project) — current implementation read directly
- `app/components/devices/stove/stoveStatusUtils.ts` (project) — current implementation read directly
- `app/components/devices/stove/StoveCard.tsx` (project) — orchestrator prop threading read directly
- `app/components/devices/stove/components/StoveBanners.tsx` (project) — error display wiring read directly
- `app/components/devices/stove/components/StoveStatus.tsx` (project) — staleness prop consumption read directly
- `lib/hooks/useDeviceStaleness.ts` (project) — current staleness hook shape verified

### Secondary (MEDIUM confidence)
- `lib/thermorossiProxy.ts` (project) — command wrapper return types confirm `ThermorossiCommandResponse` shape
- `__tests__/components/devices/stove/stoveStatusUtils.test.ts` (project) — test structure and mock patterns confirmed
- `__tests__/components/devices/stove/hooks/useStoveData.test.ts` (project) — renderHook pattern and mock setup confirmed
- `__tests__/components/devices/stove/hooks/useStoveCommands.test.ts` (project) — useRetryableCommand mock pattern confirmed

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all types and infrastructure already exist in the codebase
- Architecture: HIGH — exact field names verified from types, current implementation read in full
- Pitfalls: HIGH — identified from direct code inspection of current implementation and proxy type contracts

**Research date:** 2026-03-19
**Valid until:** 2026-04-19 (stable domain — no external dependencies changing)
