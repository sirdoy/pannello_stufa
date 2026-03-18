# Phase 94: Component & Hook Test Fixes - Research

**Researched:** 2026-03-18
**Domain:** React component testing, Jest, React Testing Library
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Diagnose each failing suite individually — fix whichever side is wrong (test or code)
- If a test expectation is stale (code changed, test not updated), update the test to match current behavior
- If a test reveals an actual code bug, fix the code — but scope the fix to the exact issue
- Document root cause per suite in plan so reviewer understands why it failed
- Use explicit `beforeEach` reset for mocks that retain state across tests
- Use `jest.mocked()` for type-safe mock access
- Use `jest.restoreAllMocks()` in `afterEach` for full cleanup
- For React hooks: mock `useAdaptivePolling` and `useVisibility` with explicit `mockImplementation` reset per test
- For React contexts: use provider wrappers in `renderHook` options
- Plan 1: StovePrimaryActions (TFIX-09) + VersionContext (TFIX-12)
- Plan 2: useNetworkData (TFIX-10) + useDeviceHistory (TFIX-11)
- Plans can run in parallel since suites are independent

### Claude's Discretion
- Exact root cause diagnosis per suite (may be stale mocks, timing issues, or code changes)
- Whether to restructure test setup blocks or just fix failing assertions
- Order of fixes within a plan

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| TFIX-09 | StovePrimaryActions.test.tsx — disable state tests pass (3 tests) | Root cause identified: test queries return `<span>` not `<button>` — fix query to use `getByRole` |
| TFIX-10 | useNetworkData.test.ts — stale flag timeout test passes (1 test) | Root cause identified: stale closure in `fetchData` — `bandwidth`/`wan` read as `null` from deps |
| TFIX-11 | useDeviceHistory.test.ts — fetch/refresh tests pass (2 tests) | Root cause identified: response shape mismatch — hook reads `data.events`, API returns `data.data.events` |
| TFIX-12 | VersionContext.test.tsx — version check tests pass (4 tests) | Root cause identified: missing `console.log` calls in source — tests assert logs that never get written |
</phase_requirements>

## Summary

Phase 94 fixes 4 failing component and hook test suites totalling 10 failing tests. All 4 root causes have been diagnosed with high confidence via test runner output and source code inspection. No new features, no new test coverage — fix only.

Two suites require test-side fixes (TFIX-09: query selector wrong, TFIX-10: test needs `act` wrapper for callback triggering). Two suites require source-side fixes (TFIX-11: hook reads wrong response key, TFIX-12: missing `console.log` calls). All fixes are small and scoped.

**Primary recommendation:** Fix TFIX-11 and TFIX-12 in production code (they reveal actual bugs). Fix TFIX-09 and TFIX-10 in test code (they are stale test assumptions).

## Root Cause Analysis (Per Suite)

### TFIX-09: StovePrimaryActions — 3 disable state tests

**Failing tests:** "disables ACCENDI when needsMaintenance is true", "disables buttons when loading is true", "disables buttons when command is executing"

**Actual error output:**
```
expect(element).toBeDisabled()
Received element is not disabled:
  <span />
```

**Root cause:** The Button component wraps its text in `<span>{children}</span>`. `screen.getByText('ACCENDI')` resolves to the inner `<span>` element, not the `<button>`. `toBeDisabled()` checks the element itself and its ancestors — but `<span>` is not a form control, so `disabled` attribute on the parent `<button>` does not propagate to `toBeDisabled()` on a plain `<span>`.

**Fix side:** Test (TFIX-09 is stale test assumption — the Button component renders text inside a `<span>`, tests should query by role).

**Fix:** Replace `screen.getByText('ACCENDI')` and `screen.getByText('SPEGNI')` in disable-state tests with `screen.getByRole('button', { name: /ACCENDI/i })` and `screen.getByRole('button', { name: /SPEGNI/i })`.

**Note:** The 6 passing tests use `screen.getByText()` for click/presence assertions — those pass because clicking or finding a `<span>` is fine. Only the 3 `toBeDisabled()` tests fail because they need the `<button>` element.

**Button component render structure:**
```tsx
<button disabled={disabled || loading} ...>
  <span>  {/* invisible loading overlay */}
    <span>{icon}</span>
    <span>{children}</span>  ← getByText resolves HERE
  </span>
</button>
```

**Confidence:** HIGH — confirmed by test runner output showing `<span />` received, Button.tsx source confirms nested `<span>` wrapping.

---

### TFIX-10: useNetworkData — stale flag timeout test

**Failing test:** "sets stale flag on timeout error without clearing data"

**Actual error output:**
```
expect(received).toBeNull()
Received: {"message": "Fritz!Box non raggiungibile. Verifica che il server API sia attivo.", "type": "generic"}
```

**Root cause:** The `fetchData` callback is memoized with `useCallback([enrichDevicesWithCategories])`. Inside `fetchData`, the FRITZBOX_TIMEOUT handler reads `bandwidth` and `wan` directly from the closure:

```typescript
} else if (errorData.code === 'FRITZBOX_TIMEOUT') {
  setStale(true);
  if (!bandwidth && !wan) {  // ← stale closure — reads initial null values
    setError({ type: 'generic', ... });
  }
}
```

Because `bandwidth` and `wan` are NOT in the `useCallback` dependency array, they are captured at the time `fetchData` is created (when they are `null`). After the first successful fetch sets `bandwidth` state, the `fetchData` callback still holds the old `null` reference. So the guard `if (!bandwidth && !wan)` always evaluates to `true` on a timeout, regardless of cached data.

**Fix side:** Source code (TFIX-10 reveals an actual bug).

**Fix:** Use refs to track current `bandwidth` and `wan` values so the stale closure can read current values:

```typescript
const bandwidthRef = useRef<BandwidthData | null>(null);
const wanRef = useRef<WanData | null>(null);

// After setBandwidth(bw): bandwidthRef.current = bw;
// After setWan(...): wanRef.current = wanData.wan || null;

// In FRITZBOX_TIMEOUT handler:
if (!bandwidthRef.current && !wanRef.current) {
  setError({ type: 'generic', ... });
}
// Same for network error catch block
```

This matches the existing pattern in the hook (`healthRef`, `consecutiveReadingsRef`, `enrichedMacsRef` are all refs already used for stable cross-render reads).

**Confidence:** HIGH — confirmed by reading `useNetworkData.ts` useCallback deps and the stale closure pattern.

---

### TFIX-11: useDeviceHistory — fetch/refresh tests

**Failing tests:** "should fetch events on mount with default 24h range", "should provide refresh function that re-fetches events"

**Actual error output:**
```
Expected: Array [{ deviceMac: ..., eventType: 'connected', ... }]
Received: Array []
```

**Root cause:** Response shape mismatch between test mock and what the hook reads.

Test mock returns:
```typescript
{ success: true, data: { events: mockEvents } }
```

Hook reads:
```typescript
const data = await response.json();
if (data.success && data.events) {  // ← reads data.events (top-level)
  setEvents(data.events);
}
```

The hook expects `data.events` (top-level key), but the test sends `data.data.events` (nested under `data`). The history API route (`/api/fritzbox/history`) returns `{ success: true, data: { events: [...] } }` which is the API's actual response format — so the tests are correct and the hook is wrong.

**Fix side:** Source code (TFIX-11 reveals an actual bug — the hook doesn't match the API response contract).

**Fix:** Update `useDeviceHistory.ts` to read `data.data.events`:
```typescript
if (data.success && data.data?.events) {
  setEvents(data.data.events);
}
```

**Confidence:** HIGH — confirmed by reading hook source and test mock shapes side by side.

---

### TFIX-12: VersionContext — 4 version check tests

**Failing tests:** "skips check in development environment", "skips check on localhost (via isDevelopment)", "skips check on local network (via isDevelopment)", "sets needsUpdate when local version is older"

**Actual error output:**
```
expect(jest.fn()).toHaveBeenCalledWith(
  "🔧 Ambiente locale: versioning enforcement disabilitato"
)
Number of calls: 0
```
and:
```
expect(jest.fn()).toHaveBeenCalledWith(
  "⚠️ Update richiesto: 1.5.0 → 1.6.0"
)
Number of calls: 0
```

**Root cause:** The `checkVersion` function in `VersionContext.tsx` returns silently on development without logging:

```typescript
if (isDevelopment()) {
  return;  // ← no console.log
}
```

And on version mismatch detection:
```typescript
if (comparison < 0) {
  setNeedsUpdate(true);
  setFirebaseVersion(latest.version);
  // ← no console.log
}
```

The tests expect both log calls to exist. Following the Phase 93 pattern (TFIX-02 added console.log calls to `changelogService` to match test spy assertions — these are operational diagnostics), the fix is to add the expected log calls to the source.

**Fix side:** Source code (adds operational diagnostic logging that the tests already document as expected behavior).

**Fix — add to `VersionContext.tsx`:**
1. In `isDevelopment()` branch: `console.log('🔧 Ambiente locale: versioning enforcement disabilitato');`
2. In `comparison < 0` branch: `console.log(\`⚠️ Update richiesto: ${APP_VERSION} → ${latest.version}\`);`

**Confidence:** HIGH — confirmed by reading `VersionContext.tsx` source and test assertions side by side.

---

## Standard Stack

### Core (already in project)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @testing-library/react | Project-installed | render, screen, fireEvent, renderHook, waitFor, act | Standard React testing |
| jest | Project-installed | Test runner, mocking | Project standard since v5.0 |
| @testing-library/jest-dom | Project-installed | toBeDisabled, toBeInTheDocument | DOM assertion matchers |

No new dependencies required.

## Architecture Patterns

### Pattern 1: getByRole for Accessible Query
**What:** Query form elements by role + accessible name instead of text content.
**When to use:** When the element that has the visible text is NOT the element being asserted on (e.g., text is inside a child `<span>`).

```typescript
// WRONG — resolves to <span>
const button = screen.getByText('ACCENDI');
expect(button).toBeDisabled(); // Fails

// CORRECT — resolves to <button>
const button = screen.getByRole('button', { name: /ACCENDI/i });
expect(button).toBeDisabled(); // Passes
```

**Source:** @testing-library/react docs — getByRole is the preferred query (accessible, implementation-detail-free).

### Pattern 2: useRef for Stable Closure Values
**What:** Use refs to expose current state to memoized callbacks that can't have state as deps.
**When to use:** When a `useCallback` with a stable dep array needs to read current state without re-creating.

```typescript
const bandwidthRef = useRef<BandwidthData | null>(null);

// After setBandwidth:
setBandwidth(bw);
bandwidthRef.current = bw;

// In stale callback — reads current value, not captured null:
if (!bandwidthRef.current && !wanRef.current) {
  setError(...);
}
```

**This pattern is already used in useNetworkData.ts:** `healthRef`, `consecutiveReadingsRef`, `enrichedMacsRef`.

### Pattern 3: Match Hook to API Response Shape
**What:** The hook `data.events` → `data.data.events` fix aligns the hook with actual API response structure.
**When to use:** When tests fail with empty arrays despite fetch mock resolving successfully.

API response contract for `/api/fritzbox/history`:
```typescript
{ success: true, data: { events: DeviceEvent[] } }
```

Hook must read:
```typescript
if (data.success && data.data?.events) {
  setEvents(data.data.events);
}
```

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Element disabled assertion | Custom disabled check | `getByRole('button')` + `toBeDisabled()` | Role queries traverse the DOM correctly |
| Stable cross-render values | Re-create callbacks | `useRef` | Already established in this codebase |

## Common Pitfalls

### Pitfall 1: Text Query vs Role Query for Disabled State
**What goes wrong:** `getByText` resolves to the deepest element containing the text, which may be a `<span>` inside the button. `toBeDisabled()` on `<span>` always fails.
**Why it happens:** Testing Library's `getByText` is implementation-detail aware — it finds where the text node lives in the DOM.
**How to avoid:** Use `getByRole('button', { name: /text/i })` for any assertion on `<button>` behavior (disabled, type, form attributes).

### Pitfall 2: Stale Closures in useCallback
**What goes wrong:** State read inside a memoized callback reflects initial value (e.g., `null`) even after successful fetches update state.
**Why it happens:** React's closure captures the state value at function creation time. If `bandwidth` is not in the deps array, the callback always sees `null`.
**How to avoid:** Use refs for values that need current-read access inside stable callbacks.

### Pitfall 3: API Response Shape Drift
**What goes wrong:** Hook reads `data.events` but API wraps it as `data.data.events`. Tests pass correct shape (matching API) so they reveal the bug.
**Why it happens:** During development, the response envelope was standardized to `{ success, data: {...} }` but not all hooks were updated.
**How to avoid:** Tests asserting the full round-trip catch this — fix in source, not test.

### Pitfall 4: Missing console.log in Source
**What goes wrong:** Tests assert `console.log` was called with specific messages as operational diagnostics — source never writes them.
**Why it happens:** Log calls were planned but not implemented.
**How to avoid:** When tests document expected log output, add the logs to source (they are operational value, not test scaffolding).

## Code Examples

### Fix for TFIX-09: Role-based button query

```typescript
// Source: @testing-library/react — getByRole API
it('disables ACCENDI when needsMaintenance is true', () => {
  render(<StovePrimaryActions {...defaultProps} needsMaintenance={true} isSpenta={true} />);
  const button = screen.getByRole('button', { name: /ACCENDI/i });
  expect(button).toBeDisabled();
});

it('disables buttons when loading is true', () => {
  render(<StovePrimaryActions {...defaultProps} loading={true} isSpenta={true} />);
  const button = screen.getByRole('button', { name: /ACCENDI/i });
  expect(button).toBeDisabled();
});

it('disables buttons when command is executing', () => {
  render(<StovePrimaryActions {...defaultProps} igniteCmd={{ isExecuting: true }} isSpenta={true} />);
  const button = screen.getByRole('button', { name: /ACCENDI/i });
  expect(button).toBeDisabled();
});
```

### Fix for TFIX-10: useRef for bandwidth/wan current-value reads

```typescript
// In useNetworkData.ts — add two refs alongside existing refs:
const bandwidthRef = useRef<BandwidthData | null>(null);
const wanRef = useRef<WanData | null>(null);

// After setBandwidth(bw):
bandwidthRef.current = bw;

// After setWan(wanData.wan || null):
wanRef.current = wanData.wan || null;

// FRITZBOX_TIMEOUT handler (replace bandwidth/wan with refs):
} else if (errorData.code === 'FRITZBOX_TIMEOUT') {
  setStale(true);
  if (!bandwidthRef.current && !wanRef.current) {
    setError({ type: 'generic', message: '...' });
  }
}

// Network error catch block (replace bandwidth/wan with refs):
} catch (err) {
  setStale(true);
  if (!bandwidthRef.current && !wanRef.current) {
    setError({ type: 'generic', message: '...' });
  }
}
```

### Fix for TFIX-11: useDeviceHistory response key

```typescript
// In useDeviceHistory.ts (line 45):
// BEFORE:
if (data.success && data.events) {
  setEvents(data.events);
}
// AFTER:
if (data.success && data.data?.events) {
  setEvents(data.data.events);
}
```

### Fix for TFIX-12: VersionContext console.log calls

```typescript
// In VersionContext.tsx checkVersion():

// In isDevelopment() branch:
if (isDevelopment()) {
  console.log('🔧 Ambiente locale: versioning enforcement disabilitato');
  return;
}

// In comparison < 0 branch:
if (comparison < 0) {
  setNeedsUpdate(true);
  setFirebaseVersion(latest.version);
  console.log(`⚠️ Update richiesto: ${APP_VERSION} → ${latest.version}`);
}
```

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest (next/jest transformer) |
| Config file | `jest.config.ts` |
| Quick run command | `npx jest --testPathPattern="StovePrimaryActions\|useNetworkData\|useDeviceHistory\|VersionContext" --no-coverage` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| TFIX-09 | StovePrimaryActions disable state | unit | `npx jest StovePrimaryActions.test.tsx --no-coverage` | ✅ |
| TFIX-10 | useNetworkData stale flag timeout | unit | `npx jest useNetworkData.test.ts --no-coverage` | ✅ |
| TFIX-11 | useDeviceHistory fetch/refresh | unit | `npx jest useDeviceHistory.test.ts --no-coverage` | ✅ |
| TFIX-12 | VersionContext version check logs | unit | `npx jest VersionContext.test.tsx --no-coverage` | ✅ |

### Sampling Rate
- **Per task commit:** Run the specific test file being fixed
- **Per wave merge:** Run all 4 test files together
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
None — all test files and infrastructure already exist.

## Open Questions

None — all 4 root causes are confirmed by test runner output and source code inspection.

## Sources

### Primary (HIGH confidence)
- Direct test runner output (`npx jest` on each suite) — exact error messages and line numbers
- Source files read directly: `StovePrimaryActions.tsx`, `useNetworkData.ts`, `useDeviceHistory.ts`, `VersionContext.tsx`, `Button.tsx`
- `jest.setup.ts` and `jest.config.ts` for test infrastructure context

### Secondary (MEDIUM confidence)
- Phase 93 CONTEXT.md decision: "Added console.log calls in 4 lib files to match test spy assertions" — establishes precedent for TFIX-12 fix approach
- Phase 92 CONTEXT.md finding: clearAllMocks doesn't reset mockReturnValue — relevant context for mock strategy

## Metadata

**Confidence breakdown:**
- TFIX-09 root cause: HIGH — error output explicitly shows `<span />` returned by getByText
- TFIX-10 root cause: HIGH — useCallback dependency array + stale closure is textbook pattern
- TFIX-11 root cause: HIGH — response shapes read side by side are unambiguous
- TFIX-12 root cause: HIGH — source lacks log calls that tests assert
- Fix approach: HIGH — all fixes are minimal, each under 5 lines

**Research date:** 2026-03-18
**Valid until:** Stable — these are code-level bugs, not ecosystem-dependent findings
