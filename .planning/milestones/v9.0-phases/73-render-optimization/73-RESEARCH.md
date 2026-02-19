# Phase 73: Render Optimization - Research

**Researched:** 2026-02-18
**Domain:** React render optimization — Recharts memoization, polling stagger, debounced API writes
**Confidence:** HIGH (primary sources: direct codebase inspection of all affected files)

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| REND-01 | User sees smooth chart updates without full SVG re-render on polling ticks | Recharts chart components need `React.memo` + stable `data` via `useMemo` + `isAnimationActive={false}` on all series |
| REND-02 | User experiences staggered dashboard card loading (no thundering herd) | `useAdaptivePolling` needs new `initialDelay` parameter; stove uses Firebase RTDB listener so already does not start a poll at delay=0 |
| REND-03 | User benefits from stable data references preventing unnecessary re-renders | Same as REND-01: stabilize data array references with `useMemo` keyed on `length + lastTimestamp` |
| REND-04 | User experiences debounced thermostat writes reducing API calls | `useDebounce` hook already exists; ThermostatCard +/- 0.5 buttons currently write immediately on click; needs local pending-setpoint state + debounced write |
</phase_requirements>

---

## Summary

This phase addresses four runtime rendering problems in a Next.js 15.5 + React 19 PWA that are orthogonal to bundle size: Recharts chart re-renders on polling ticks, simultaneous dashboard mount API calls, and immediate thermostat setpoint writes on rapid button clicks.

The codebase has been directly inspected. All four issues are confirmed real and all fixes are localized to a small number of existing files. No new components, directories, or npm packages are needed. The `useDebounce` hook already exists at `app/hooks/useDebounce.ts`. The `useAdaptivePolling` hook (`lib/hooks/useAdaptivePolling.ts`) needs one new optional parameter (`initialDelay`). Chart memoization is additive — wrap components in `React.memo` and stabilize their `data` prop with `useMemo`. The React Compiler (Phase 71) will handle memoization of hooks automatically; this phase provides the deterministic memoization that the compiler cannot guarantee because it bails out on Rules of React violations.

The stove is confirmed to use Firebase RTDB `onValue()` listeners as the primary data path (not `useAdaptivePolling`), with polling only as a fallback when Firebase disconnects. This means the stagger `initialDelay` on non-stove cards does not introduce any safety risk — the stove will continue to receive real-time updates from Firebase regardless.

**Primary recommendation:** Three-plan structure: (1) `useAdaptivePolling` initialDelay + polling stagger across 5 non-stove hooks, (2) Recharts memoization (`React.memo` + `useMemo` data stabilization + `isAnimationActive={false}` on missing charts), (3) thermostat debounced setpoint write.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `React.memo` | Built-in (React 19) | Prevent chart re-renders when props are reference-equal | Standard React optimization for presentational components that receive stable props |
| `useMemo` | Built-in (React 19) | Stabilize `data` array references passed to Recharts | Prevents new array reference on every render from bypassing `React.memo` |
| `useDebounce` hook | Exists: `app/hooks/useDebounce.ts` | Debounce thermostat setpoint writes | Already implemented, value-based, 300ms default; needs 500ms for thermostat writes |
| `isAnimationActive={false}` | Recharts prop on `Bar`, `Line`, `Area` | Prevent SVG animation restart on every data update | Standard Recharts performance pattern; animation restarts on every re-render causing visible 30s chart flicker |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `initialDelay` parameter | New parameter on `useAdaptivePolling` | Delay first `fetch` call after mount | Used by 5 non-stove hooks to stagger dashboard load; stove hook is immune (Firebase RTDB listener, not polling) |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `React.memo` + `useMemo` on chart data | `useDeferredValue` on chart data | `useDeferredValue` defers render in concurrent mode but does not prevent re-renders; `React.memo` + stable data reference is simpler and more deterministic |
| `useDebounce` (value-based) | `useCallback`-debounced handler | Value-based debounce is simpler; the existing hook already works correctly for this pattern |
| `initialDelay` parameter in `useAdaptivePolling` | Per-card `setTimeout` in each hook before first fetch | `initialDelay` is the clean API; scattered timeouts in 5 different hooks creates maintenance debt |

**Installation:**
No new packages required.

---

## Architecture Patterns

### Recommended Project Structure

No new files or directories. All changes are inside existing files:

```
lib/hooks/useAdaptivePolling.ts              ← Add initialDelay parameter
app/components/analytics/UsageChart.tsx      ← React.memo + useMemo + isAnimationActive
app/components/analytics/ConsumptionChart.tsx← React.memo + useMemo + isAnimationActive
app/components/analytics/WeatherCorrelation.tsx← React.memo + useMemo + isAnimationActive
app/components/devices/thermostat/ThermostatCard.tsx ← Local pending setpoint + useDebounce
app/components/devices/lights/hooks/useLightsData.ts ← initialDelay: 100
app/components/devices/thermostat/ThermostatCard.tsx ← initialDelay: 50 (also handles debounce)
app/components/devices/weather/WeatherCardWrapper.tsx← initialDelay: 250 (or useEffect delay)
app/components/devices/camera/CameraCard.tsx ← initialDelay: 400 (via mount effect delay)
app/components/devices/network/hooks/useNetworkData.ts← initialDelay: 500
```

### Pattern 1: Adding `initialDelay` to `useAdaptivePolling`

**What:** Optional parameter that delays the first immediate callback call and the first interval setup.
**When to use:** Non-critical device cards that can tolerate a small initial data delay.

Current signature:
```typescript
// lib/hooks/useAdaptivePolling.ts
export interface UseAdaptivePollingOptions {
  callback: () => void | Promise<void>;
  interval: number | null;
  alwaysActive?: boolean;
  immediate?: boolean;
  // ADD:
  initialDelay?: number; // ms to delay before first fetch and interval setup
}
```

Implementation sketch:
```typescript
// Inside useAdaptivePolling:
const { callback, interval, alwaysActive = false, immediate = true, initialDelay = 0 } = options;
const isReady = useRef(initialDelay === 0);

useEffect(() => {
  if (initialDelay === 0) return; // Skip delay, already ready
  const t = setTimeout(() => {
    isReady.current = true;
    if (immediate && interval !== null) {
      savedCallback.current();
    }
  }, initialDelay);
  return () => clearTimeout(t);
}, []); // eslint-disable-line react-hooks/exhaustive-deps

// Guard immediate effect:
useEffect(() => {
  if (!isReady.current) return; // Wait for initialDelay
  if (immediate && interval !== null && !hasRunImmediate.current) {
    savedCallback.current();
    hasRunImmediate.current = true;
  }
}, [immediate, interval]);

// Guard interval effect:
useEffect(() => {
  if (!isReady.current) return; // Wait for initialDelay
  if (interval === null) return;
  if (!alwaysActive && !isVisible) return;
  const tick = () => { savedCallback.current(); };
  const id = setInterval(tick, interval);
  return () => clearInterval(id);
}, [interval, isVisible, alwaysActive, isReady.current]); // isReady.current is a ref, not state
```

**IMPORTANT**: `isReady.current` is a ref, not state. The initialDelay effect sets `isReady.current = true` then calls `savedCallback.current()` directly (no state change needed for the immediate call). The interval setup needs to be triggered after `isReady` becomes true — the cleanest approach is to use a `isDelayDone` state piece specifically for re-triggering the interval effect.

**Revised approach using a state flag (cleaner, avoids stale closure):**
```typescript
const [delayDone, setDelayDone] = useState(initialDelay === 0);

useEffect(() => {
  if (initialDelay === 0) return;
  const t = setTimeout(() => setDelayDone(true), initialDelay);
  return () => clearTimeout(t);
}, []); // eslint-disable-line react-hooks/exhaustive-deps

// Guard immediate:
useEffect(() => {
  if (!delayDone) return;
  if (immediate && interval !== null && !hasRunImmediate.current) {
    savedCallback.current();
    hasRunImmediate.current = true;
  }
}, [delayDone, immediate, interval]);

// Guard interval:
useEffect(() => {
  if (!delayDone) return;
  if (interval === null) return;
  if (!alwaysActive && !isVisible) return;
  const id = setInterval(() => savedCallback.current(), interval);
  return () => clearInterval(id);
}, [delayDone, interval, isVisible, alwaysActive]);
```

**Stagger assignments:**

| Card | Hook file | initialDelay | Rationale |
|------|-----------|--------------|-----------|
| Stove | `useStoveData.ts` | N/A — custom polling loop, NOT useAdaptivePolling | Firebase RTDB listener fires immediately; polling is fallback only |
| Thermostat | `ThermostatCard.tsx` (inline `useAdaptivePolling`) | `50` | Safety-adjacent but not safety-critical; light delay acceptable |
| Lights | `useLightsData.ts` | `100` | Non-critical; below stove in priority |
| Weather | `WeatherCardWrapper.tsx` | `250` | Non-critical; weather data is not IoT device |
| Camera | `CameraCard.tsx` | `400` | Non-critical; uses `useEffect` with `connectionCheckedRef`, not `useAdaptivePolling` |
| Network | `useNetworkData.ts` | `500` | Non-critical; lowest priority |

**Camera card note:** `CameraCard.tsx` uses a `useEffect` with `connectionCheckedRef` guard instead of `useAdaptivePolling`. It does NOT poll — only fetches once on mount. Adding `initialDelay` requires wrapping the initial `fetchCameras()` call in a `setTimeout(fetchCameras, 400)`. This is simpler than hooking into `useAdaptivePolling`.

**Weather card note:** `WeatherCardWrapper.tsx` uses `useEffect` with `fetchWeather` callback and no polling interval. It fetches on mount when `location.latitude` is available. The delay can be achieved by wrapping the initial fetch in a `setTimeout(..., 250)` inside the `useEffect`, or by adding `initialDelay` to a new `useDelayedMount` pattern.

### Pattern 2: Recharts Chart Memoization

**What:** Wrap chart components in `React.memo`, stabilize `data` prop with `useMemo` keyed on stable values.

**Charts that already have `isAnimationActive={false}` (no action needed):**
- `app/components/devices/network/components/NetworkBandwidth.tsx` — `Area` components (confirmed)
- `app/network/components/BandwidthChart.tsx` — `Line` components (confirmed)
- `app/network/components/BandwidthCorrelationChart.tsx` — `Line` components (confirmed)

**Charts that are MISSING `isAnimationActive={false}` (action required):**
- `app/components/analytics/UsageChart.tsx` — 5 `Bar` components — NO `isAnimationActive`
- `app/components/analytics/ConsumptionChart.tsx` — 1 `Bar` component — NO `isAnimationActive`
- `app/components/analytics/WeatherCorrelation.tsx` — 1 `Bar` + 1 `Line` component — NO `isAnimationActive`

**Analytics charts note:** The analytics charts on `/analytics` page are NOT on the polling hot-path (they only fetch when the period selector changes), so they will not visibly re-render every 30 seconds. However, adding `isAnimationActive={false}` + `React.memo` is still correct practice (REND-01 requirement) and prevents animation restart when the parent re-renders due to consent state changes.

**Chart memoization pattern:**

```typescript
// Source: React docs — React.memo
// Pattern: wrap entire export in React.memo, stabilize data before passing in

// In PARENT (e.g., analytics/page.tsx):
// Replace:
//   <UsageChart data={days} loading={loading} />
// With:
const stableUsageChartData = useMemo(
  () => days,
  [days.length, days[days.length - 1]?.date] // stable key: length + last date
);
// Then: <UsageChart data={stableUsageChartData} loading={loading} />

// In CHART COMPONENT (e.g., UsageChart.tsx):
// Replace:
//   export default function UsageChart(...)
// With:
//   const UsageChart = React.memo(function UsageChart(...) { ... });
//   export default UsageChart;
```

**IMPORTANT — analytics page data is not polling-driven:** The analytics page (`app/analytics/page.tsx`) fetches data once per period selection, not on a 30-second polling tick. The NetworkCard (`app/components/devices/network/NetworkCard.tsx`) IS on the polling hot-path because it calls `useNetworkData` which uses `useAdaptivePolling(30s)`. This distinction affects where `useMemo` stabilization is most critical.

**Most impactful stabilization targets (polling hot-path):**
- `NetworkBandwidth` inside `NetworkCard` — receives `downloadHistory` and `uploadHistory` arrays that grow on every 30s poll tick. The sparklines (`AreaChart`) already have `isAnimationActive={false}` but the parent `NetworkCard` re-renders the whole card. Check if `NetworkBandwidth` is already wrapped in `React.memo`. If not, add it.

**Pattern for sparkline history stabilization:**
```typescript
// In useNetworkData.ts or NetworkCard.tsx parent:
const stableDownloadHistory = useMemo(
  () => downloadHistory,
  // eslint-disable-next-line react-hooks/exhaustive-deps
  [downloadHistory.length, downloadHistory[downloadHistory.length - 1]?.time]
);
```

### Pattern 3: Thermostat Setpoint Debounce

**What:** Add local pending setpoint state + debounce the API write.

**Current behavior (ThermostatCard.tsx lines 710–729):**
- User clicks `+ 0.5°` button
- `handleTemperatureChange(selectedRoom.id, selectedRoom.setpoint + 0.5)` fires immediately
- API call to `/api/netatmo/set-room-thermpoint` fires immediately
- `fetchStatus()` called after write to refresh data

**Problem:** Rapid-clicking `+ 0.5°` 4 times in 1 second fires 4 API calls (each with retry infrastructure). Netatmo rate-limits these, causing visible errors.

**Target behavior (REND-04):** At most 1 API write per 500ms burst.

**Pattern:**
```typescript
// In ThermostatCard.tsx:
import { useDebounce } from '@/app/hooks/useDebounce';

// Add local pending setpoint state (shows optimistic value immediately):
const [pendingSetpoint, setPendingSetpoint] = useState<number | null>(null);
const debouncedSetpoint = useDebounce(pendingSetpoint, 500);

// Display: show pendingSetpoint if set, else room.setpoint
const displaySetpoint = pendingSetpoint ?? selectedRoom?.setpoint;

// Button handlers: update local state only (no API call yet)
const handleIncrease = () => {
  const current = pendingSetpoint ?? selectedRoom?.setpoint ?? 0;
  setPendingSetpoint(parseFloat((current + 0.5).toFixed(1)));
};
const handleDecrease = () => {
  const current = pendingSetpoint ?? selectedRoom?.setpoint ?? 0;
  setPendingSetpoint(parseFloat((current - 0.5).toFixed(1)));
};

// Fire API write only when debouncedSetpoint changes (and differs from server value):
useEffect(() => {
  if (debouncedSetpoint === null) return;
  if (debouncedSetpoint === selectedRoom?.setpoint) return; // No change needed
  handleTemperatureChange(selectedRoom.id, debouncedSetpoint);
  setPendingSetpoint(null); // Reset pending after write
}, [debouncedSetpoint]); // eslint-disable-line react-hooks/exhaustive-deps

// Reset pending setpoint when room changes or status updates externally:
useEffect(() => {
  setPendingSetpoint(null);
}, [selectedRoom?.id]);
```

**Note on `useDebounce` signature:** The existing hook at `app/hooks/useDebounce.ts` takes `(value: T, delay: number = 300): T`. This works exactly as needed — pass `pendingSetpoint` and `500` (ms).

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Value debouncing | Custom debounce logic in component | Existing `useDebounce` hook | Already implemented, tested, handles cleanup |
| Polling stagger | Per-hook `setTimeout` scattered across 5 files | `initialDelay` parameter in `useAdaptivePolling` | Single abstraction point, easier to maintain and test |
| Chart animation disable | Custom React animation override | `isAnimationActive={false}` on each series element | Official Recharts API; animation is per-series-element not per-chart |

**Key insight:** All the building blocks exist. This phase is assembly, not construction.

---

## Common Pitfalls

### Pitfall 1: `React.memo` Without Data Reference Stabilization

**What goes wrong:** Chart wrapped in `React.memo` but `data` is `chartData` computed by `data.map(...)` inline in the JSX — new array reference every render, `React.memo` comparison always fails (reference equality), chart still re-renders every poll tick.

**Why it happens:** `React.memo` uses `Object.is` for prop comparison. A new array reference (even with identical contents) fails this check. The `map()` call in the render function is the culprit.

**How to avoid:** Move `chartData` transformation to `useMemo` with a stable key. Either (a) move `useMemo` into the chart component itself keyed on `data.length + data[data.length - 1]?.date`, or (b) memoize in the parent before passing. Option (a) is cleaner since the transformation logic lives in the chart component.

**Warning signs:** React DevTools Profiler shows chart components still highlighted on poll ticks after adding `React.memo`.

### Pitfall 2: `initialDelay` Effect Missing from Dependency Array Lint

**What goes wrong:** `useEffect(() => { const t = setTimeout(setDelayDone, initialDelay); return () => clearTimeout(t); }, [])` — lint rule flags missing `initialDelay` dependency and suggests adding it, which causes the timeout to re-fire on every render.

**How to avoid:** Disable lint for that specific line with `// eslint-disable-next-line react-hooks/exhaustive-deps`. The empty array is intentional — `initialDelay` is a mount-time constant (it will not change after mount in any usage pattern in this codebase).

**Warning signs:** ESLint error during CI; adding `initialDelay` to the dep array causes the timeout to reset on every render loop.

### Pitfall 3: Thermostat Pending Setpoint Leaking Between Room Changes

**What goes wrong:** User adjusts setpoint in Room A (pendingSetpoint = 21.5), switches to Room B before the debounce fires, debounce fires and writes 21.5°C to Room B's setpoint.

**How to avoid:** Reset `pendingSetpoint` to `null` when `selectedRoom?.id` changes (separate `useEffect` keyed on room ID, already shown in Pattern 3 above). Also validate that `debouncedSetpoint !== selectedRoom?.setpoint` in the write effect to avoid writing a value equal to the current server state.

**Warning signs:** Room B setpoint unexpectedly changes after switching from Room A during rapid button clicking.

### Pitfall 4: `useAdaptivePolling` Test Breakage from `initialDelay`

**What goes wrong:** Existing tests in `lib/hooks/__tests__/useAdaptivePolling.test.ts` use fake timers. Adding `initialDelay` introduces a new `setTimeout` that existing tests do not `advanceTimersByTime()` for, causing tests to assert behavior that now requires an extra timer advance.

**How to avoid:** Run `lib/hooks/__tests__/useAdaptivePolling.test.ts` after implementing `initialDelay`. Update affected tests to advance fake timers past `initialDelay` before asserting polling behavior. Add new test cases for `initialDelay=0` (no change) and `initialDelay=500` (delayed start).

**Warning signs:** Existing `useAdaptivePolling.test.ts` tests fail after hook modification.

### Pitfall 5: Stove Hook Safety - Do Not Touch

**What goes wrong:** The stove hook (`useStoveData.ts`) uses a CUSTOM polling loop (not `useAdaptivePolling`). Its primary data path is Firebase RTDB `onValue()`. Adding `initialDelay` to `useAdaptivePolling` has ZERO effect on the stove — confirm explicitly that no modification to `useStoveData.ts` is needed.

**How to avoid:** Do not add `initialDelay` to the stove hook. The stove already fires immediately via Firebase RTDB `onValue()` on mount (`ref(db, 'stove/state')`). This is safety-critical and must not be delayed.

**Warning signs (if someone accidentally edits useStoveData.ts):** Stove status shows stale or incorrect state on dashboard load; Firebase listener fires immediately regardless, so polling is the only thing that delays — and polling is a fallback for Firebase disconnect.

---

## Code Examples

Verified patterns from codebase inspection:

### Existing `useAdaptivePolling` Usage (Reference for initialDelay Addition)

```typescript
// app/components/devices/thermostat/ThermostatCard.tsx — current usage
useAdaptivePolling({
  callback: fetchStatus,
  interval: topology ? 30000 : null,
  alwaysActive: false,
  immediate: true,
  // ADD: initialDelay: 50,
});

// app/components/devices/lights/hooks/useLightsData.ts — current usage
useAdaptivePolling({
  callback: fetchData,
  interval: connected ? 30000 : null,
  alwaysActive: false,
  immediate: true,
  // ADD: initialDelay: 100,
});

// app/components/devices/network/hooks/useNetworkData.ts — current usage (line 291)
useAdaptivePolling({
  callback: fetchAll,
  interval: 30000,          // visible: 30s
  alwaysActive: false,
  immediate: true,          // Fetch on mount
  // ADD: initialDelay: 500,
});
```

### Camera Card Stagger (Not useAdaptivePolling)

```typescript
// app/components/devices/camera/CameraCard.tsx — current (lines 46-50)
useEffect(() => {
  if (connectionCheckedRef.current) return;
  connectionCheckedRef.current = true;
  fetchCameras(); // ← Add setTimeout here
}, []);

// AFTER (stagger 400ms):
useEffect(() => {
  if (connectionCheckedRef.current) return;
  connectionCheckedRef.current = true;
  setTimeout(() => fetchCameras(), 400);
}, []);
```

### Recharts isAnimationActive — Missing from Analytics Charts

```typescript
// app/components/analytics/UsageChart.tsx — 5 Bar components missing isAnimationActive
// ADD to each Bar:
<Bar
  dataKey="level1"
  stackId="power"
  fill="#94a3b8"
  name="Level 1"
  radius={[0, 0, 0, 0]}
  isAnimationActive={false}  // ← ADD
/>

// app/components/analytics/WeatherCorrelation.tsx — Bar and Line both missing
<Bar
  yAxisId="left"
  dataKey="consumptionKg"
  fill="#ed6f10"
  name="Pellet (kg)"
  radius={[4, 4, 0, 0]}
  isAnimationActive={false}  // ← ADD
/>
<Line
  yAxisId="right"
  type="monotone"
  dataKey="avgTemperature"
  stroke="#437dae"
  strokeWidth={2}
  dot={{ fill: '#437dae', r: 4 }}
  activeDot={{ r: 6 }}
  name="Temperature (°C)"
  isAnimationActive={false}  // ← ADD
/>
```

### Thermostat Debounce — Existing Hook Signature

```typescript
// app/hooks/useDebounce.ts — confirmed exists and works correctly
export function useDebounce<T>(value: T, delay: number = 300): T;

// Usage in ThermostatCard.tsx:
import { useDebounce } from '@/app/hooks/useDebounce';
const debouncedSetpoint = useDebounce(pendingSetpoint, 500);
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `useMemo`/`useCallback` everywhere | React Compiler (Phase 71) auto-memoizes | Phase 71 | Chart components already optimized by compiler IF they are Rules-of-React compliant; `React.memo` + `useMemo` on data is still needed for Recharts because SVG reconciliation is not prevented by compiler memoization alone |
| Manual polling stagger via setTimeout scattered in hooks | `initialDelay` parameter in `useAdaptivePolling` | This phase | Single parameter, testable, no scattered timeouts |
| Direct API write on button click | Debounced write via `useDebounce` | This phase | Thermostat writes reduced from n-per-burst to 1-per-500ms |

**Deprecated/outdated:**
- Manual `useMemo`/`useCallback` on hook return values: React Compiler in Phase 71 handles these automatically. This phase adds `React.memo` on chart COMPONENTS (not hooks) and `useMemo` on the DATA passed to charts — which the compiler cannot optimize because SVG DOM reconciliation is not a React render problem.

---

## Open Questions

1. **NetworkCard `NetworkBandwidth` memoization status**
   - What we know: `NetworkBandwidth.tsx` is a pure presentational component (declared as such in its docstring). It uses `useId()` for SVG gradient IDs but no other hooks. `isAnimationActive={false}` is already set on its sparklines.
   - What's unclear: Is `NetworkCard.tsx` wrapping `NetworkBandwidth` in `React.memo`, or does it pass a new object reference for `downloadHistory`/`uploadHistory` arrays on every poll tick?
   - Recommendation: Inspect `NetworkCard.tsx` to confirm. If `NetworkBandwidth` is not wrapped in `React.memo`, add it. Also check whether `downloadHistory` state is mutated (using `setDownloadHistory(prev => [...prev, newPoint])`) — if so, the array reference changes on every poll, bypassing memo.
   - **Critical**: Check `useNetworkData.ts` around line 291 to see how `downloadHistory` state is managed (it's likely a `setState` with `prev => [...prev, point]` which creates a new reference every poll).

2. **`useAdaptivePolling` re-render caused by `delayDone` state**
   - What we know: Using a `useState(false)` → `setDelayDone(true)` approach for `initialDelay` causes one additional re-render of the hook consumer when the delay completes.
   - What's unclear: Does this extra re-render at mount (50ms / 100ms / 250ms / 400ms / 500ms after mount) cause any visible effect?
   - Recommendation: The extra re-render is before the card is fully loaded (during initial loading state), so it is not user-visible. Accept the approach. Alternative: use `useRef(false)` + force a single re-render via `useReducer` — but the benefit is marginal.

3. **Weather card stagger mechanism**
   - What we know: `WeatherCardWrapper.tsx` fetches weather in a `useEffect` triggered by `location.latitude` availability (from a location context). There is no polling.
   - What's unclear: The location context itself may delay the first fetch if it loads asynchronously. In that case, the effective delay may already be 100-200ms above the stove.
   - Recommendation: Inspect `WeatherCardWrapper.tsx` location context loading pattern. If the location already loads asynchronously with a visible delay, a `setTimeout(250)` may be redundant. If the location context provides coordinates synchronously (from localStorage cache), add `setTimeout(250)`.

---

## Sources

### Primary (HIGH confidence)

- Codebase inspection (2026-02-18, directly read):
  - `lib/hooks/useAdaptivePolling.ts` — hook signature confirmed, no `initialDelay` parameter exists
  - `app/components/devices/stove/hooks/useStoveData.ts` — Firebase RTDB `onValue()` confirmed as primary data path; custom polling loop (NOT `useAdaptivePolling`)
  - `app/components/devices/thermostat/ThermostatCard.tsx` — setpoint write fires immediately on button click, no debounce
  - `app/hooks/useDebounce.ts` — hook exists, value-based, generic `<T>`, default 300ms
  - `app/components/analytics/UsageChart.tsx` — 5 `Bar` components, NONE have `isAnimationActive={false}`
  - `app/components/analytics/ConsumptionChart.tsx` — 1 `Bar` component, NO `isAnimationActive={false}`
  - `app/components/analytics/WeatherCorrelation.tsx` — 1 `Bar` + 1 `Line`, NEITHER have `isAnimationActive={false}`
  - `app/network/components/BandwidthChart.tsx` — 2 `Line` components, BOTH have `isAnimationActive={false}` (already done)
  - `app/network/components/BandwidthCorrelationChart.tsx` — 2 `Line` components, BOTH have `isAnimationActive={false}` (already done)
  - `app/components/devices/network/components/NetworkBandwidth.tsx` — 2 `Area` components, BOTH have `isAnimationActive={false}` (already done)
  - `app/components/devices/camera/CameraCard.tsx` — fetches once on mount via `connectionCheckedRef` guard, no `useAdaptivePolling`
  - `app/components/devices/weather/WeatherCardWrapper.tsx` — fetches on location availability, no polling interval
  - `app/components/devices/lights/hooks/useLightsData.ts` — uses `useAdaptivePolling` with `immediate: true`
  - `app/components/devices/network/hooks/useNetworkData.ts` — uses `useAdaptivePolling` with `immediate: true`, 30s interval

- Prior research in `.planning/research/SUMMARY.md` — confirms thundering herd pitfall, `isAnimationActive` requirement, `initialDelay` approach
- Prior research in `.planning/research/PITFALLS.md` — Pitfall 3 (Recharts re-renders), Pitfall 6 (thundering herd) confirmed with approach

### Secondary (MEDIUM confidence)

- Recharts official performance guide (https://recharts.github.io/en-US/guide/performance/) — `isAnimationActive={false}` is the documented solution for animation-caused re-render performance issues
- React docs `React.memo` (https://react.dev/reference/react/memo) — prop comparison uses `Object.is`; stable references required for memoization to work

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all tools are built-in (React.memo, useMemo) or already exist in codebase (useDebounce hook)
- Architecture: HIGH — all changes are additive to existing files; confirmed via direct file inspection
- Pitfalls: HIGH — pitfall 3 and 6 from prior research confirmed by direct file inspection showing missing `isAnimationActive` and missing `initialDelay`

**Research date:** 2026-02-18
**Valid until:** 2026-03-20 (30 days; stable APIs)
