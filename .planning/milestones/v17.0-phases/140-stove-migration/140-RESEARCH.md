# Phase 140: Stove Migration - Research

**Researched:** 2026-03-26
**Domain:** React hook migration — HTTP polling → WebSocket primary with polling fallback
**Confidence:** HIGH

## Summary

This phase migrates `useStoveData` from a pure HTTP polling architecture to a dual-mode hook that uses the shared WebSocket connection as primary data channel and falls back to `useAdaptivePolling` automatically when the WS is unavailable. The public interface (`UseStoveDataReturn`) does not change — callers (StoveCard, stove/page.tsx) remain untouched.

The WebSocket infrastructure from Phase 139 is already live: `useWebSocketManager`, `WebSocketContext`, `WebSocketContext.Provider` in `ClientProviders.tsx`, the `react-use-websocket` Jest mock in `__mocks__/react-use-websocket.ts`, and all TypeScript types in `types/websocket.ts` (including `ThermorossiData`). The migration is a contained rewrite of a single file: `app/components/devices/stove/hooks/useStoveData.ts`, with corresponding test updates in `__tests__/components/devices/stove/hooks/useStoveData.test.ts`.

The key pattern is: read `readyState` from `useWebSocketContext()`, pass `readyState === ReadyState.OPEN ? null : 60000` as the `interval` to `useAdaptivePolling` (null pauses polling), and subscribe to the `'thermorossi'` topic. When a WS message arrives, apply it directly to state and trigger the three side-fetches (scheduler, maintenance, checkVersion). When polling fires, the existing `fetchStatusAndUpdate` path continues unchanged.

**Primary recommendation:** Inline WS subscription directly in `useStoveData` (no separate helper hook needed); use `interval: readyState === ReadyState.OPEN ? null : 60000` to drive the polling-vs-WS switch.

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**D-01:** When `readyState === OPEN`, WS is primary — polling is suppressed (not started or paused). When `readyState !== OPEN`, polling activates automatically with existing `useAdaptivePolling` config (60s, alwaysActive:true). The readyState from the WebSocketContext drives the switch.

**D-02:** WS `ThermorossiData` payload maps directly to core state: `stove_state` → `status`, `power_level` → `powerLevel`, `fan_level` → `fanLevel`, `error_code` → `errorCode`, `error_description` → `errorDescription`.

**D-03:** Staleness handling differs by source: WS messages are inherently fresh — set `isStale=false` and use the message `ts` field (unix seconds) as `cachedAt`. HTTP polling responses continue using `data_freshness` and `last_poll_at` fields from the proxy response as they do today.

**D-04:** Immediate switch, no grace period. When WS reconnects (`readyState` transitions to `OPEN`), polling stops on next interval check. The WS `snapshot` message (sent immediately on subscribe) provides fresh data — no gap possible.

**D-05:** When WS disconnects (`readyState` leaves `OPEN`), polling activates immediately. No delay — stove monitoring is safety-critical.

**D-06:** Scheduler mode (`fetchSchedulerMode`) and maintenance status (`fetchMaintenanceStatus`) remain as HTTP calls — they are not included in the WS `thermorossi` topic payload. They are triggered after each data update regardless of source (WS message or HTTP poll).

**D-07:** `checkVersion()` also remains as HTTP call, triggered after data update.

**D-08:** The `alwaysActive: true` flag applies only to the polling fallback path. When WS is connected, the WS connection itself is persistent (react-use-websocket keeps it open regardless of tab visibility). The alwaysActive behavior is inherently satisfied by WS and explicitly preserved in polling fallback.

### Claude's Discretion

- Whether to create a dedicated `useStoveWebSocket` helper hook or inline the WS subscription logic directly in `useStoveData`
- How to structure the conditional polling (useAdaptivePolling with a dynamic `enabled` parameter vs conditional hook call)
- Test strategy: mocking approach for WS subscribe/unsubscribe in useStoveData tests
- Whether to use the `TopicDataMap['thermorossi']` type alias or import `ThermorossiData` directly

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| MIG-01 | `useStoveData` riceve dati stufa via WebSocket come canale primario | Subscribe to `'thermorossi'` topic via `useWebSocketContext()`; WS `snapshot` + `event` messages carry `ThermorossiData` directly; `readyState === OPEN` is the gate |
| MIG-02 | `useStoveData` fallback automatico a polling HTTP se WebSocket non disponibile | `useAdaptivePolling` called with `interval: readyState === ReadyState.OPEN ? null : 60000`; interval=null pauses the hook without conditional hook call |
| MIG-03 | Comportamento `alwaysActive` preservato — polling fallback continua anche con tab nascosta | Pass `alwaysActive: true` unconditionally to `useAdaptivePolling`; when WS is connected polling is suppressed (interval=null); when WS is down polling activates with alwaysActive=true regardless of tab visibility |
</phase_requirements>

---

## Standard Stack

### Core (already installed)
| Library | Version | Purpose | Note |
|---------|---------|---------|------|
| react-use-websocket | installed (Phase 139) | WS transport layer | Already in use via `useWebSocketManager` |
| `useWebSocketContext()` | project hook | Access shared WS manager | Returns `{ subscribe, unsubscribe, readyState }` |
| `useAdaptivePolling` | project hook | Polling fallback with alwaysActive | `interval: null` pauses it |
| `ReadyState` (from react-use-websocket) | — | WS state enum | Re-exported from `useWebSocketManager.ts` |

### Types (already defined)
| Type | Location | Purpose |
|------|----------|---------|
| `ThermorossiData` | `types/websocket.ts` | WS payload: `stove_state`, `power_level`, `fan_level`, `error_code`, `error_description` + index signature |
| `TopicDataMap['thermorossi']` | `types/websocket.ts` | Alias to same type — either works |
| `StoveState` | `types/thermorossiProxy.ts` | Existing state union: `'off' \| 'igniting' \| 'working' \| 'standby' \| 'cleaning' \| 'alarm' \| 'modulating'` |
| `ThermorossiStatusResponse` | `types/thermorossiProxy.ts` | HTTP polling response shape (unchanged) |

No new npm packages required.

## Architecture Patterns

### Recommended Project Structure

No new files or directories needed. This phase modifies one source file and its test:

```
app/components/devices/stove/hooks/
├── useStoveData.ts          ← MODIFIED (primary migration target)
└── useStoveCommands.ts      ← UNTOUCHED (commands stay REST)

__tests__/components/devices/stove/hooks/
└── useStoveData.test.ts     ← UPDATED (new WS test cases)
```

### Pattern 1: Dynamic interval to switch polling on/off

This is the cleanest way to honor D-01 and D-05. `useAdaptivePolling` already accepts `interval: number | null` — null pauses it. No conditional hook call is needed (React Rules of Hooks satisfied).

```typescript
// Source: useAdaptivePolling.ts (line 92: "if (interval === null) { return; }")
const { readyState } = useWebSocketContext();
const isWsConnected = readyState === ReadyState.OPEN;

useAdaptivePolling({
  callback: fetchStatusAndUpdate,
  interval: isWsConnected ? null : 60000,   // null suppresses polling when WS is live
  alwaysActive: true,                        // D-08: preserved in fallback
  immediate: !isWsConnected,                 // only run immediately on mount if WS is down
});
```

**Why this works for D-04/D-05:** When `readyState` changes from OPEN to non-OPEN, React re-renders, `isWsConnected` flips to false, interval becomes 60000, and the polling effect fires immediately (the `immediate: true` behavior at mount already ran, but the `isVisible`/`alwaysActive` logic keeps it running). When reconnecting, interval returns to null and `clearInterval` is called on the next render.

### Pattern 2: WS subscription with subscribe/unsubscribe cleanup

```typescript
// Source: useWebSocketManager.ts — subscribe/unsubscribe API
const { subscribe, unsubscribe, readyState } = useWebSocketContext();

useEffect(() => {
  const handleMessage = (raw: unknown) => {
    const data = raw as ThermorossiData;
    const { stove_state, power_level, fan_level, error_code, error_description } = data;

    // Map WS fields to hook state (D-02)
    setStatus(stove_state as StoveState);
    setFanLevel(fan_level);
    setPowerLevel(power_level);

    // WS messages are inherently fresh (D-03)
    setIsStale(false);
    setLastPollAt(new Date(wsTs * 1000));  // ts from message envelope

    // Error handling — same logic as HTTP path (D-02)
    if (stove_state === 'alarm') { /* ... error handling ... */ }

    // Trigger side-fetches (D-06, D-07)
    void fetchSchedulerMode();
    void fetchMaintenanceStatus();
    void checkVersion();

    setInitialLoading(false);
  };

  subscribe('thermorossi', handleMessage);
  return () => { unsubscribe('thermorossi', handleMessage); };
}, [subscribe, unsubscribe]);
```

**Problem:** The `ts` field is on the `WebSocketMessage<T>` envelope, not on the `ThermorossiData` payload. The callback receives `msg.data` (the inner payload only). The ts field is stripped by `useWebSocketManager` before dispatch.

**Solution options:**
- Accept that `cachedAt` for WS path is `new Date()` at message receipt (accurate enough — latency is <100ms)
- Or use `Date.now()` converted to `Date` for `lastPollAt` on WS path

This is a consequence of the callback receiving `data: unknown` (not the full envelope). The manager dispatches `msg.data` only (line 64 of `useWebSocketManager.ts`). `ts` is not forwarded. Use `new Date()` at message receipt as the `cachedAt` value — this is accurate within the latency of the WS message, which is acceptable.

### Pattern 3: Staleness for WS path (D-03 adjusted)

Since `ts` is not available in the callback, the WS path sets:
- `isStale = false` (WS messages are always fresh)
- `lastPollAt = new Date()` at the time the callback fires

The staleness object evaluates to `{ isStale: false, cachedAt: new Date(), ageSeconds: 0 }` for WS messages, which is correct.

### Anti-Patterns to Avoid

- **Conditional hook call:** Do NOT call `useAdaptivePolling` inside an `if (readyState !== OPEN)` block. Rules of Hooks. Use `interval: null` instead.
- **Two-source data gap during transition:** The WS spec guarantees a `snapshot` message on subscribe. No initialization gap exists. Do not add a "loading" state for WS connection.
- **Calling `fetchStatusAndUpdate` from WS handler:** The WS handler should set state directly (not call fetch). The side-fetches (scheduler, maintenance, checkVersion) should be called independently from the WS handler, not via `fetchStatusAndUpdate` (which does a full HTTP stove status fetch — that would defeat the purpose of WS).
- **Forgetting unsubscribe cleanup:** The useEffect must return `() => unsubscribe('thermorossi', handleMessage)`. Stale callback ref in the subscribe registry would receive messages after unmount.
- **Stale closure on handleMessage:** Define `handleMessage` inside the useEffect, or ensure it captures fresh state via ref pattern. The side-fetch functions (`fetchSchedulerMode`, `fetchMaintenanceStatus`, `checkVersion`) must not be stale.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| WS connection management | Custom WebSocket class | `useWebSocketContext()` | Already handles reconnect, dispatch, subscribe registry |
| Polling with tab visibility | Manual setInterval + visibilitychange | `useAdaptivePolling` | Already handles alwaysActive, visibility resume, stale closure |
| WS/polling mode switch | Boolean flag + two intervals | `interval: null` in useAdaptivePolling | Existing API supports pause/resume |

## Runtime State Inventory

Step 2.5 SKIPPED — this is a code-only migration (hook rewrite). No rename, rebrand, or string replacement. No runtime state, stored data, or OS-registered state affected.

## Environment Availability

Step 2.6 SKIPPED — no new external dependencies. All infrastructure (react-use-websocket, WebSocketContext, useAdaptivePolling) is already installed and wired. The WS server at `/ws/live` is pre-existing.

## Common Pitfalls

### Pitfall 1: ts field not available in topic callback

**What goes wrong:** Developer tries to use `msg.ts` in the ThermorossiData handler, but `ts` is on the envelope (`WebSocketMessage<T>`), not on the `data` payload. `useWebSocketManager.ts` line 64 dispatches `msg.data` only.

**Why it happens:** The dispatch path is `cb(msg.data)` — the envelope is discarded after routing.

**How to avoid:** Use `new Date()` at callback invocation time as `lastPollAt`. This is accurate within WS latency (typically <100ms on LAN). Set `isStale = false` unconditionally on WS path.

**Warning signs:** TypeScript error `Property 'ts' does not exist on type 'ThermorossiData'`.

### Pitfall 2: Stale closure on side-fetch functions

**What goes wrong:** `fetchSchedulerMode` and `fetchMaintenanceStatus` captured in the subscribe useEffect closure are stale — they reference old state setters.

**Why it happens:** useEffect dependency array omits the function references; they change on every render due to inline async function definitions.

**How to avoid:** Either (a) use `useCallback` to stabilize them, or (b) use a `useRef` to store the latest version and call `ref.current()` inside the effect. The existing polling path already uses `savedCallback.current` in `useAdaptivePolling` for the same reason.

**Warning signs:** Scheduler state does not update after WS messages; stale data visible in scheduler panel.

### Pitfall 3: Double execution during React StrictMode (dev only)

**What goes wrong:** In dev, StrictMode double-invokes effects. The subscribe useEffect registers the callback twice. The WS manager uses a `Set<TopicCallback>` so the same function reference added twice is deduplicated — no double-fire issue if the same function reference is used.

**Why it happens:** React StrictMode + dev-mode double-invoke.

**How to avoid:** Define `handleMessage` inside the useEffect (new function each render) and ensure cleanup `unsubscribe` is called correctly. Since each `useEffect` invocation creates a new function reference, subscribe adds it and cleanup removes it. The Set deduplication is per-reference.

**Warning signs:** Side-fetches called 2x per WS message in dev console.

### Pitfall 4: initialLoading stuck at true when WS connects first

**What goes wrong:** `initialLoading` is set to `false` in `fetchStatusAndUpdate` (HTTP path). If WS provides the first snapshot before any HTTP poll fires, `initialLoading` remains `true` until HTTP runs.

**Why it happens:** The `initialLoading = false` assignment is only in the HTTP path's `finally` block.

**How to avoid:** Also set `setInitialLoading(false)` in the WS message handler after first successful message.

**Warning signs:** StoveCard shows loading spinner even though stove state is displaying correctly.

### Pitfall 5: fetchStatusAndUpdate called from WS handler causes double data fetch

**What goes wrong:** Developer calls `fetchStatusAndUpdate()` from the WS handler, triggering an HTTP fetch for stove status even though WS already delivered fresh data.

**Why it happens:** `fetchStatusAndUpdate` is the all-in-one function that fetches status + runs side-fetches. It's tempting to call it "for the side-fetches", but it also fetches HTTP stove status.

**How to avoid:** The WS handler must set state directly and call side-fetches independently: `void fetchSchedulerMode()`, `void fetchMaintenanceStatus()`, `void checkVersion()`. Do NOT call `fetchStatusAndUpdate` from the WS handler.

## Code Examples

### WS subscription integration in useStoveData

```typescript
// Source: useWebSocketContext() + useAdaptivePolling pattern (project patterns)
import { useWebSocketContext } from '@/app/context/WebSocketContext';
import { useAdaptivePolling } from '@/lib/hooks/useAdaptivePolling';
import { ReadyState } from '@/lib/hooks/useWebSocketManager';
import type { ThermorossiData } from '@/types/websocket';

// Inside useStoveData:
const { subscribe, unsubscribe, readyState } = useWebSocketContext();
const isWsConnected = readyState === ReadyState.OPEN;

// WS subscription effect
useEffect(() => {
  const handleMessage = (raw: unknown) => {
    const data = raw as ThermorossiData;
    setStatus(data.stove_state as StoveState);
    setFanLevel(data.fan_level);
    setPowerLevel(data.power_level);
    setIsStale(false);
    setLastPollAt(new Date());            // ts not forwarded; use receipt time

    const code = data.error_code ?? 0;
    const desc = data.error_description ?? '';
    if (data.stove_state === 'alarm') {
      setErrorCode(code);
      setErrorDescription(desc);
      if (code !== 0) {
        void logError(code, desc, { status: data.stove_state, source: 'status_monitor' });
      }
      previousErrorCode.current = code;
    } else {
      setErrorCode(0);
      setErrorDescription('');
      previousErrorCode.current = 0;
    }

    setInitialLoading(false);
    void fetchSchedulerMode();
    void fetchMaintenanceStatus();
    void checkVersion();
  };

  subscribe('thermorossi', handleMessage);
  return () => { unsubscribe('thermorossi', handleMessage); };
}, [subscribe, unsubscribe]);  // stable refs from useWebSocketContext

// Polling fallback — interval=null suppresses when WS is live
useAdaptivePolling({
  callback: fetchStatusAndUpdate,
  interval: isWsConnected ? null : 60000,
  alwaysActive: true,   // D-08: must be preserved
  immediate: true,      // fires once at mount if WS not connected
});
```

### Test pattern for useStoveData with WS mock

The existing `__mocks__/react-use-websocket.ts` provides `__mockHelpers`. For `useStoveData` tests, the WS layer is accessed via `useWebSocketContext`. Tests should mock the entire context:

```typescript
// Mock strategy for useStoveData tests
import { useWebSocketContext } from '@/app/context/WebSocketContext';
import { ReadyState } from 'react-use-websocket';

jest.mock('@/app/context/WebSocketContext');

const mockSubscribe = jest.fn();
const mockUnsubscribe = jest.fn();

jest.mocked(useWebSocketContext).mockReturnValue({
  subscribe: mockSubscribe,
  unsubscribe: mockUnsubscribe,
  readyState: ReadyState.OPEN,  // or ReadyState.CLOSED for polling fallback tests
});
```

To simulate a WS message delivery:
```typescript
// Capture the callback registered by subscribe
let capturedCallback: ((data: unknown) => void) | null = null;
mockSubscribe.mockImplementation((_topic, cb) => { capturedCallback = cb; });

// After renderHook — trigger a WS message
act(() => {
  capturedCallback?.({
    stove_state: 'working',
    power_level: 3,
    fan_level: 4,
    error_code: null,
    error_description: null,
  });
});
```

**Phase 139 lesson:** Use `toHaveBeenCalled()` not `toHaveBeenCalledTimes(1)` for subscribe call assertions in renderHook — StrictMode double-invocation means the count is unpredictable in tests.

## State of the Art

| Old Approach | Current Approach | Impact |
|--------------|------------------|--------|
| Pure HTTP polling at 60s | WS primary (instant updates) + polling fallback | Stove state update latency drops from 60s avg to ~1s |
| `useAdaptivePolling` always active | `useAdaptivePolling` only when WS not connected | Reduces HTTP traffic significantly when WS is up |

## Open Questions

1. **stale closure on fetchSchedulerMode/fetchMaintenanceStatus inside WS effect**
   - What we know: Both functions are defined inside `useStoveData` and reference state setters. They should be stable if defined with `useCallback` or accessed via ref.
   - What's unclear: The current implementation does not use `useCallback` for these. Re-declaring them inside the WS useEffect each render (and including in deps) would re-register the callback on each render.
   - Recommendation: Move to `useRef` pattern for `fetchSchedulerMode` and `fetchMaintenanceStatus` (same as `savedCallback` in `useAdaptivePolling`), or use `useCallback` with stable deps. The planner should choose one approach and document it in the plan.

2. **immediate flag when WS is connected on mount**
   - What we know: `immediate: true` in `useAdaptivePolling` fires the callback at mount. If WS is connected on mount (interval=null), the immediate call never fires.
   - What's unclear: Whether the WS `snapshot` message always arrives fast enough to set `initialLoading=false` before the user sees the loading state.
   - Recommendation: Set `initialLoading=false` in the WS handler (already documented as Pitfall 4). The WS snapshot arrives within milliseconds of component mount. This is acceptable — no initial HTTP fetch needed when WS is live.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest (jsdom) |
| Config file | jest.config.ts |
| Quick run command | `npm test -- __tests__/components/devices/stove/hooks/useStoveData.test.ts` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| MIG-01 | subscribe('thermorossi', cb) called on mount | unit | `npm test -- useStoveData.test.ts` | Existing — needs new cases |
| MIG-01 | WS message sets status, powerLevel, fanLevel | unit | `npm test -- useStoveData.test.ts` | Existing — needs new cases |
| MIG-01 | WS message sets initialLoading=false | unit | `npm test -- useStoveData.test.ts` | Existing — needs new cases |
| MIG-01 | WS message triggers fetchSchedulerMode, fetchMaintenanceStatus, checkVersion | unit | `npm test -- useStoveData.test.ts` | Existing — needs new cases |
| MIG-02 | When readyState !== OPEN, useAdaptivePolling receives interval=60000 | unit | `npm test -- useStoveData.test.ts` | Existing — needs new cases |
| MIG-02 | When readyState === OPEN, useAdaptivePolling receives interval=null | unit | `npm test -- useStoveData.test.ts` | Existing — needs new cases |
| MIG-02 | HTTP polling path (fetchStatusAndUpdate) sets status correctly | unit | `npm test -- useStoveData.test.ts` | Covered by existing tests |
| MIG-03 | useAdaptivePolling called with alwaysActive=true in fallback mode | unit | `npm test -- useStoveData.test.ts` | Existing — needs new cases |
| MIG-03 | unsubscribe('thermorossi', cb) called on unmount | unit | `npm test -- useStoveData.test.ts` | Existing — needs new cases |

### Sampling Rate
- **Per task commit:** `npm test -- __tests__/components/devices/stove/hooks/useStoveData.test.ts`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] No new test files needed — extend existing `__tests__/components/devices/stove/hooks/useStoveData.test.ts` with WS cases
- [ ] Add mock for `@/app/context/WebSocketContext` in the test file (not currently mocked)
- [ ] New `beforeEach` setup: `jest.mocked(useWebSocketContext).mockReturnValue({ ... })`

## Project Constraints (from CLAUDE.md)

| Directive | Impact on This Phase |
|-----------|---------------------|
| NEVER break existing functionality | `UseStoveDataReturn` interface must remain identical; StoveCard, stove/page.tsx unchanged |
| WAIT for user confirmation before version updates | No npm version changes in this phase |
| PREFER editing existing files over creating new | Modify `useStoveData.ts` and its test; do not create new hook files |
| NEVER execute `npm run build` or `npm install` | Agent must not run build/install |
| ALWAYS create/update unit tests | All new WS paths must have test coverage in `useStoveData.test.ts` |
| NEVER commit/push without explicit request | No git operations unless user requests |

## Sources

### Primary (HIGH confidence)
- `lib/hooks/useWebSocketManager.ts` — subscribe/unsubscribe API, ReadyState export, callback dispatch pattern
- `app/context/WebSocketContext.ts` — useWebSocketContext() hook, throws if outside provider
- `types/websocket.ts` — ThermorossiData interface (fields verified against websocket.md spec)
- `lib/hooks/useAdaptivePolling.ts` — interval=null pause behavior (line 92), alwaysActive flag behavior
- `app/components/devices/stove/hooks/useStoveData.ts` — current implementation; all state, side-fetches, staleness logic
- `docs/api/websocket.md` — WS spec; snapshot-on-subscribe (§Connection Lifecycle step 6), thermorossi payload, ts field
- `__mocks__/react-use-websocket.ts` — Jest mock helpers for WS tests

### Secondary (MEDIUM confidence)
- `__tests__/hooks/useWebSocketManager.test.ts` — test patterns for WS mock usage (subscribe, message simulation)
- `__tests__/components/devices/stove/hooks/useStoveData.test.ts` — existing test structure to extend
- `.planning/STATE.md` — Phase 139 lesson: `toHaveBeenCalled()` not `toHaveBeenCalledTimes(1)` in renderHook

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries already installed and verified from source files
- Architecture: HIGH — patterns derived directly from existing codebase (useAdaptivePolling, useWebSocketManager)
- Pitfalls: HIGH — derived from code reading (ts field not forwarded, interval=null pause, initialLoading gap)

**Research date:** 2026-03-26
**Valid until:** 2026-04-26 (stable project codebase; no external API changes expected)
