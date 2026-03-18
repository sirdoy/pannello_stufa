# Phase 96: Polling Simplification - Research

**Researched:** 2026-03-18
**Domain:** React polling hooks, Firebase RTDB removal, interval unification
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

#### Stove hook rewrite
- Replace custom setTimeout loop + Firebase RTDB onValue listener with useAdaptivePolling
- Use `alwaysActive: true` at 60s interval (stove is safety-critical, polling never pauses)
- No `initialDelay` — stove card loads first (consistent with v9.0 SUSP-03 safety priority)
- Remove all Firebase RTDB real-time listener code from useStoveData
- Stove data fetched via API route only (same as all other devices)

#### Staleness thresholds
- Adjust stove staleness: 90s when on, 180s when off (1.5x the 60s polling interval)
- Other devices keep existing staleness logic (already compatible with 60s)

#### sync-external-state removal
- Remove `/api/stove/sync-external-state` API route entirely
- Remove all calls to sync-external-state from useStoveData
- No other consumers exist — clean deletion

#### Other device hooks
- ThermostatCard: change interval from 30s to 60s (keep existing useAdaptivePolling usage)
- LightsCard: change interval from 30s to 60s (keep existing useAdaptivePolling usage)
- NetworkCard: change visible interval from 30s to 60s, keep 5min hidden (already useAdaptivePolling)
- RaspiCard/RaspiFullData: change visible interval from 30s to 60s, keep 5min hidden (already useAdaptivePolling)
- Preserve existing initialDelay stagger values for all non-stove cards

#### useDeviceStaleness
- Change from 5s setInterval to 60s interval (aligned with polling cadence)
- Keep visibility awareness (pause when hidden)
- No functional change — just less frequent threshold checks

### Claude's Discretion
- Exact cleanup of unused imports/types after RTDB listener removal
- Whether to simplify useStoveData internal state (fewer refs needed without RTDB)
- Test updates for changed intervals and removed functionality

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| POLL-01 | StoveCard usa useAdaptivePolling (60s) invece del polling loop custom | useAdaptivePolling signature fully understood; custom setTimeout + recursive scheduleNextPoll pattern identified for removal |
| POLL-02 | Firebase RTDB real-time listener della stufa rimosso | Three RTDB useEffect blocks identified in useStoveData: connection monitor, stove state listener, sandbox listeners |
| POLL-03 | sync-external-state call rimossa dal ciclo fetch stufa | Single call site in fetchStatusAndUpdate (lines 264-280); API route deletes cleanly |
| POLL-04 | ThermostatCard polling esteso a 60s (da 30s) | Inline useAdaptivePolling at line 107-113; single number change |
| POLL-05 | LightsCard polling esteso a 60s (da 30s) | useLightsData line 235; single number change in connected ? 30000 : null expression |
| POLL-06 | NetworkCard polling esteso a 60s visible / 5min hidden (da 30s/5min) | useNetworkData line 94; single constant change |
| POLL-07 | RaspiCard polling esteso a 60s visible / 5min hidden (da 30s/5min) | Two hooks: useRaspiData line 46 and useRaspiFullData line 42; identical pattern |
| POLL-08 | useDeviceStaleness polling rimosso o esteso a 60s (da 5s) | setInterval at line 63; replace with useAdaptivePolling or change constant |
</phase_requirements>

---

## Summary

Phase 96 is a pure infrastructure simplification with no new features. The goal is to unify all device polling to 60-second intervals through the existing `useAdaptivePolling` hook, removing the Firebase RTDB real-time stove listener and the associated `sync-external-state` machinery.

The work divides into three tiers: (1) a substantial rewrite of `useStoveData` to adopt `useAdaptivePolling` and strip all Firebase RTDB client code; (2) five one-liner interval changes in hooks that already use `useAdaptivePolling`; and (3) a `useDeviceStaleness` simplification from 5s setInterval to 60s.

The most significant risk is the `useStoveData` rewrite. The current hook has three Firebase-dependent `useEffect` blocks (connection monitor, stove state listener, sandbox listeners), two Firebase-tracking refs (`lastFirebaseUpdateRef`, `isFirstConnectionRef`), and two Firebase-related state vars (`isFirebaseConnected`, `usePollingFallback`). These are woven into the polling logic and the StoveBanners UI component. The rewrite must preserve the hook's public return type exactly — consumers like `StoveCard.tsx` and `StoveBanners.tsx` reference `isFirebaseConnected` from `stoveData`.

**Primary recommendation:** Use two plans — Plan 01 for the stove hook rewrite (high complexity, Firebase RTDB removal, new useAdaptivePolling adoption) and Plan 02 for all other devices plus useDeviceStaleness (low complexity, interval-only changes).

---

## Standard Stack

### Core (already in project)
| Hook | Location | Purpose | Current State |
|------|----------|---------|---------------|
| `useAdaptivePolling` | `lib/hooks/useAdaptivePolling.ts` | Visibility-aware polling with alwaysActive, initialDelay | Fully featured, used by all non-stove hooks |
| `useVisibility` | `lib/hooks/useVisibility.ts` | Page Visibility API wrapper | Used internally by useAdaptivePolling |
| `useDeviceStaleness` | `lib/hooks/useDeviceStaleness.ts` | Staleness monitoring, currently 5s | Direct setInterval, needs update to 60s |

### No new dependencies required
This phase adds no new libraries. All tooling already exists in the project.

---

## Architecture Patterns

### Recommended Project Structure
No structural changes. All files are edits to existing hooks.

### Pattern 1: useAdaptivePolling Usage (alwaysActive)
**What:** Safety-critical device polling that never pauses for tab visibility
**When to use:** Stove only — because alwaysActive prevents any visibility optimization
**Example:**
```typescript
// Source: lib/hooks/useAdaptivePolling.ts (existing hook signature)
useAdaptivePolling({
  callback: fetchStatusAndUpdate,
  interval: 60000,
  alwaysActive: true,   // Safety-critical: stove must always poll
  immediate: true,
  // NO initialDelay — stove card loads first (SUSP-03 priority)
});
```

### Pattern 2: useAdaptivePolling Usage (visibility-aware with stagger)
**What:** Non-critical device polling that pauses when tab hidden
**When to use:** All other devices (thermostat, lights, network, raspi)
**Example:**
```typescript
// Source: useLightsData.ts lines 233-239 (current pattern, just change interval)
useAdaptivePolling({
  callback: fetchData,
  interval: connected ? 60000 : null, // 60s (was 30s)
  alwaysActive: false,
  immediate: true,
  initialDelay: 100, // PRESERVE existing stagger value
});
```

### Pattern 3: Visibility-derived interval (for network/raspi)
**What:** Two-speed polling — fast when visible, slow when hidden
**When to use:** NetworkCard and RaspiCard/RaspiFullData
**Example:**
```typescript
// Source: useNetworkData.ts line 94 (current pattern, change 30000 to 60000)
const isVisible = useVisibility();
const interval = isVisible ? 60000 : 300000; // 60s visible, 5min hidden (was 30000)
```

### Pattern 4: useDeviceStaleness simplified interval
**What:** Staleness check runs at same cadence as polling (no point checking more often)
**When to use:** useDeviceStaleness hook
**Example:**
```typescript
// Source: lib/hooks/useDeviceStaleness.ts (current direct setInterval pattern)
// Change: 5000 -> 60000
const intervalId = setInterval(fetchStaleness, 60000); // Was 5000
```
Note: useDeviceStaleness uses direct setInterval + useVisibility guard. The locked decision says "extend to 60s" — no obligation to rewrite it to useAdaptivePolling, just change the constant.

### Pattern 5: Rewritten useStoveData structure
**What:** Strip Firebase RTDB, adopt useAdaptivePolling
**Critical:** The return type interface `UseStoveDataReturn` must be preserved exactly. `StoveCard.tsx` and `StoveBanners.tsx` consume `isFirebaseConnected` and `usePollingFallback`.

Two options for `isFirebaseConnected`/`usePollingFallback` after RTDB removal:
- **Option A (simpler):** Keep the fields in the interface but hardcode to `isFirebaseConnected: true` and `usePollingFallback: false` — preserves interface compatibility, StoveBanners "Firebase disconnected" banner never shows
- **Option B (cleaner):** Remove from interface, update StoveBanners prop to not accept them

**Recommendation:** Option A for Plan 01 (minimal diff), with a note that Option B could be done in a future cleanup. The CONTEXT.md "Claude's Discretion" allows this judgment call.

### Anti-Patterns to Avoid
- **Removing sandbox Firebase listeners:** The sandbox `useEffect` block (lines 419-474 in useStoveData) uses `ref(db, 'sandbox/...')` — these are for local dev sandbox simulation and are separate from the stove state listener. They SHOULD be removed along with the stove state listener since the phase removes all RTDB client code from useStoveData.
- **Breaking the polling loop pattern by introducing deps:** The custom setTimeout loop currently has `[fetchStatusAndUpdate, isFirebaseConnected, usePollingFallback, status]` as deps. The rewritten useAdaptivePolling version avoids this stale closure issue automatically via the savedCallback ref pattern.
- **Not preserving initialDelay=0 for stove:** All other hooks have initialDelay; stove must NOT have it.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Stale closure in polling callback | Manual ref tracking | useAdaptivePolling's savedCallback.current pattern | Already solved inside the hook |
| Visibility detection | addEventListener('visibilitychange') | useVisibility (already in useAdaptivePolling) | Already abstracted |
| Resume-on-visibility fetch | Manual visibility tracking | useAdaptivePolling's "became visible" effect | Built in |

**Key insight:** useAdaptivePolling already handles all the edge cases the custom stove polling loop handles manually — stale closures, visibility pausing, immediate-on-mount. The only unique feature of the stove's custom loop was Firebase-gated polling (only fetch when RTDB stale), which disappears with RTDB removal.

---

## Common Pitfalls

### Pitfall 1: Interface compatibility for isFirebaseConnected
**What goes wrong:** Removing `isFirebaseConnected` from `UseStoveDataReturn` breaks `StoveBanners.tsx` prop types and `StoveCard.tsx` pass-through
**Why it happens:** Two downstream consumers reference this field
**How to avoid:** Either keep field hardcoded to `true` (Option A) or update both StoveBanners.tsx prop interface and StoveCard.tsx pass-through in the same plan
**Warning signs:** TypeScript errors on `isFirebaseConnected` in StoveBanners.tsx

### Pitfall 2: Sandbox Firebase listeners in useStoveData
**What goes wrong:** Leaving the sandbox `useEffect` block (lines 419-474) intact while removing the main stove state listener leaves orphaned Firebase imports
**Why it happens:** The sandbox block is visually separate and easy to overlook
**How to avoid:** Remove all three RTDB useEffect blocks together: connection monitor (lines 359-380), stove state listener (lines 382-417), sandbox listeners (lines 419-474)
**Warning signs:** `ref`, `onValue` imports remain after rewrite

### Pitfall 3: previousStatusRef / previousFanLevelRef / previousPowerLevelRef orphaned refs
**What goes wrong:** These three refs exist solely to detect changes for sync-external-state. Removing sync-external-state but keeping these refs leaves dead code.
**Why it happens:** They're initialized at the top of the hook (lines 151-153) and only used in fetchStatusAndUpdate (lines 256-285)
**How to avoid:** Remove all three refs and the `hasChanges` / sync block together
**Warning signs:** refs declared but their `.current` never read after rewrite

### Pitfall 4: pollingStartedRef now useless
**What goes wrong:** `pollingStartedRef` (line 156) exists to prevent double-execution of the custom setTimeout loop. useAdaptivePolling does not need this guard.
**Why it happens:** Guards the old `useEffect` that starts the custom loop
**How to avoid:** Remove `pollingStartedRef` together with the custom polling useEffect
**Warning signs:** ref declared but never used

### Pitfall 5: isFirstConnectionRef now useless
**What goes wrong:** `isFirstConnectionRef` (line 148) is used in the Firebase connection monitor useEffect to suppress initial disconnection warnings
**Why it happens:** Firebase starts as "disconnected" before connecting; this guard prevents false warnings
**How to avoid:** Remove with the Firebase connection monitor useEffect
**Warning signs:** ref declared but never used

### Pitfall 6: Sparkline buffer size comment in useNetworkData
**What goes wrong:** The comment "1h of data at 30s polling interval" and `SPARKLINE_MAX_POINTS = 120` are based on 30s intervals. At 60s, 120 points = 2h.
**Why it happens:** SPARKLINE_MAX_POINTS is a constant defined at module level
**How to avoid:** Update the comment; the planner should decide whether to change SPARKLINE_MAX_POINTS to 60 (1h at 60s) or keep 120 (2h buffer). Either is fine — more history is not harmful.
**Warning signs:** Stale comment causes confusion

### Pitfall 7: Test for useStoveData mocks Firebase
**What goes wrong:** `useStoveData.test.ts` has `jest.mock('firebase/database', ...)` and `jest.mock('@/lib/firebase', ...)`. After removing firebase imports from useStoveData, these mocks become unnecessary but harmless. However, if any test asserts Firebase-specific behavior (e.g., checking Firebase listener calls), those assertions must be removed.
**Why it happens:** Test file was written for the old Firebase-based implementation
**How to avoid:** Review `useStoveData.test.ts` — none of the 7 current tests assert Firebase listener behavior directly. The firebase mocks are present as guards to prevent errors, not as assertions. After rewrite, remove the firebase mocks from the test.

---

## Code Examples

Verified patterns from existing source:

### useAdaptivePolling call signature (alwaysActive)
```typescript
// Source: lib/hooks/useAdaptivePolling.ts — UseAdaptivePollingOptions interface
useAdaptivePolling({
  callback: fetchStatusAndUpdate,  // () => void | Promise<void>
  interval: 60000,                 // number | null (null = paused)
  alwaysActive: true,              // boolean, default false
  immediate: true,                 // boolean, default true
  // initialDelay omitted = 0 (stove priority, no stagger)
});
```

### Interval constant pattern (for network/raspi)
```typescript
// Source: useNetworkData.ts lines 93-94 (current pattern)
const isVisible = useVisibility();
const interval = isVisible ? 60000 : 300000; // change from 30000
```

### Conditional interval pattern (for lights)
```typescript
// Source: useLightsData.ts lines 233-239 (current pattern)
useAdaptivePolling({
  callback: fetchData,
  interval: connected ? 60000 : null, // change from 30000
  alwaysActive: false,
  immediate: true,
  initialDelay: 100,
});
```

### ThermostatCard inline pattern
```typescript
// Source: ThermostatCard.tsx lines 107-113 (current pattern)
useAdaptivePolling({
  callback: fetchStatus,
  interval: topology ? 60000 : null, // change from 30000
  alwaysActive: false,
  immediate: true,
  initialDelay: 50,
});
```

### useDeviceStaleness interval constant
```typescript
// Source: lib/hooks/useDeviceStaleness.ts line 63
const intervalId = setInterval(fetchStaleness, 60000); // change from 5000
```

---

## State of the Art

| Old Approach | Current Approach | Impact |
|--------------|-----------------|--------|
| Firebase RTDB onValue for real-time stove state | useAdaptivePolling 60s | Simpler, same data latency (proxy cache ensures fresh data) |
| Custom recursive setTimeout with Firebase-gated polling | useAdaptivePolling | Eliminates stale closure risk, removes 50+ lines |
| sync-external-state POST on every detected change | No sync needed (RTDB removed) | Eliminates extra API call per poll cycle when stove is running |
| 5s staleness checks | 60s staleness checks | Reduces to 1/12th the polling frequency for a display-only feature |

---

## File Inventory

Complete list of files to change in this phase:

### Plan 01: Stove hook rewrite (high complexity)
| File | Change Type | What Changes |
|------|------------|-------------|
| `app/components/devices/stove/hooks/useStoveData.ts` | Rewrite | Remove Firebase RTDB blocks, custom polling loop, sync-external-state call, orphaned refs; add useAdaptivePolling |
| `app/api/stove/sync-external-state/route.ts` | Delete | Entire file |
| `__tests__/components/devices/stove/hooks/useStoveData.test.ts` | Update | Remove Firebase mocks; add test for useAdaptivePolling interval if needed |

**Optionally in Plan 01 (Claude's Discretion):**
| File | Change Type | What Changes |
|------|------------|-------------|
| `app/components/devices/stove/components/StoveBanners.tsx` | Update | Remove `isFirebaseConnected` prop if Option B chosen |
| `app/components/devices/stove/StoveCard.tsx` | Update | Remove `isFirebaseConnected` pass-through if Option B chosen |

### Plan 02: Other devices + useDeviceStaleness (low complexity)
| File | Change Type | What Changes |
|------|------------|-------------|
| `app/components/devices/thermostat/ThermostatCard.tsx` | Edit | 30000 → 60000 |
| `app/components/devices/lights/hooks/useLightsData.ts` | Edit | 30000 → 60000 |
| `app/components/devices/network/hooks/useNetworkData.ts` | Edit | 30000 → 60000 (SPARKLINE_MAX_POINTS comment update) |
| `app/components/devices/raspi/hooks/useRaspiData.ts` | Edit | 30000 → 60000 |
| `app/components/devices/raspi/hooks/useRaspiFullData.ts` | Edit | 30000 → 60000 |
| `lib/hooks/useDeviceStaleness.ts` | Edit | 5000 → 60000 |

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest + @testing-library/react |
| Config file | `jest.config.ts` |
| Quick run command | `npm test -- --testPathPattern="useStoveData\|useDeviceStaleness" --no-coverage` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| POLL-01 | useAdaptivePolling called with 60s interval | unit | `npm test -- --testPathPattern="useStoveData" --no-coverage` | ✅ |
| POLL-02 | No firebase/database imports in useStoveData | unit (import check) | `npm test -- --testPathPattern="useStoveData" --no-coverage` | ✅ |
| POLL-03 | No fetch('/api/stove/sync-external-state') call | unit (fetch assertion) | `npm test -- --testPathPattern="useStoveData" --no-coverage` | ✅ |
| POLL-04 | ThermostatCard polls at 60s | unit | `npm test -- --testPathPattern="ThermostatCard" --no-coverage` | manual-only (no test file) |
| POLL-05 | LightsCard polls at 60s | unit | `npm test -- --testPathPattern="useLightsData" --no-coverage` | manual-only (no test file) |
| POLL-06 | NetworkCard polls at 60s/5min | unit | `npm test -- --testPathPattern="useNetworkData" --no-coverage` | ✅ |
| POLL-07 | RaspiCard polls at 60s/5min | unit | manual review | ❌ Wave 0 |
| POLL-08 | useDeviceStaleness uses 60s | unit | `npm test -- --testPathPattern="useDeviceStaleness" --no-coverage` | manual-only (no test file) |

### Sampling Rate
- **Per task commit:** `npm test -- --testPathPattern="useStoveData" --no-coverage`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
None critical — existing test infrastructure covers POLL-01/02/03. The gaps for POLL-04/05/07/08 are pre-existing (no test files for those hooks), not created by this phase.

---

## Open Questions

1. **isFirebaseConnected in StoveBanners**
   - What we know: StoveBanners shows a "Firebase Disconnected" warning banner when `isFirebaseConnected` is false. After RTDB removal, this state can never be false.
   - What's unclear: Should we (A) keep the prop hardcoded to `true` (minimal diff) or (B) remove the prop and the banner entirely
   - Recommendation: Option A for this phase (planner's call to scope); Option B is a separate cleanup concern. CONTEXT.md gives this to Claude's Discretion.

2. **Sandbox Firebase listeners**
   - What we know: The sandbox block (lines 419-474) uses `firebase/database` onValue for dev-mode simulation of stove errors/maintenance
   - What's unclear: Whether sandbox mode will still work after removing these listeners
   - Recommendation: Remove along with all other RTDB code. Sandbox mode is a local dev concern and the stove's polling via API routes will still work for sandbox testing. The sandbox listeners were only needed to get real-time RTDB state changes into the React UI — which is the exact pattern we're removing.

---

## Sources

### Primary (HIGH confidence)
- Direct source code read of all 7 target files — exact line numbers, signatures, patterns verified

### Secondary (HIGH confidence)
- `useStoveData.test.ts` — confirmed test mocking patterns, no Firebase assertion tests
- `StoveCard.tsx` and `StoveBanners.tsx` — confirmed `isFirebaseConnected` consumer chain
- `stoveStateService.ts` — confirmed `updateStoveState` not called from any client code (only from `sync-external-state` route and server-side `scheduler/check`)

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all code read directly from source
- Architecture: HIGH — rewrite strategy derived from exact current code structure
- Pitfalls: HIGH — identified from direct inspection of all removed code paths and their consumers

**Research date:** 2026-03-18
**Valid until:** Stable (no external dependencies; all findings are internal code facts)
