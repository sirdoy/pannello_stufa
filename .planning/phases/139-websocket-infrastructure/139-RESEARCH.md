# Phase 139: WebSocket Infrastructure - Research

**Researched:** 2026-03-26
**Domain:** React WebSocket management with react-use-websocket, singleton pattern, topic-based pub/sub
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Use a custom React hook (`useWebSocketManager`) wrapping `react-use-websocket` with a ref-based singleton pattern. Aligns with existing hook ecosystem (useAdaptivePolling, useVisibility).
- **D-02:** The manager hook is called once at app level (e.g., in a layout or provider) and exposes a subscribe/unsubscribe API. Individual device hooks call subscribe with their topic and a callback.
- **D-03:** Use `NEXT_PUBLIC_WS_API_KEY` env var for browser-side WebSocket auth via `?api_key=` query parameter. Follows existing `NEXT_PUBLIC_*` pattern.
- **D-04:** WS URL constructed from `NEXT_PUBLIC_HA_API_URL` (or a new `NEXT_PUBLIC_WS_URL` if needed). Claude's discretion on exact env var name based on what exists.
- **D-05:** All WS payload types go in a single `types/websocket.ts` file — derived from `docs/api/websocket.md`. Includes: `WebSocketMessage<T>`, `Topic` union, and all 6 provider interfaces.
- **D-06:** Callback registry pattern — manager maintains `Map<Topic, Set<(data: unknown) => void>>`. Each consumer hook registers a typed callback for its topic. Manager parses incoming JSON and dispatches by `msg.topic`.
- **D-07:** On subscribe, manager sends `{"action": "subscribe", "topic": "..."}`. On unsubscribe (no more callbacks for that topic), sends unsubscribe message.
- **D-08:** Use `react-use-websocket` built-in reconnection with exponential backoff (1s → 30s cap, 10 attempts). On every reconnect (`onOpen`), re-subscribe all topics with active callbacks.

### Claude's Discretion
- File placement within `lib/` vs `lib/hooks/`
- Whether to export a React context provider or just a hook
- Test structure and mocking approach for WebSocket tests
- Whether `NEXT_PUBLIC_WS_URL` reuses `NEXT_PUBLIC_HA_API_URL` with protocol swap or needs a separate env var

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| WS-01 | App maintains single shared WebSocket connection to `/ws/live` with auth via query parameter | D-01/D-02 singleton pattern; `react-use-websocket` 4.13.0; `NEXT_PUBLIC_WS_API_KEY` query param |
| WS-02 | Connection supports subscribe/unsubscribe per individual topic | D-06/D-07 callback registry with `Map<Topic, Set<callback>>`; spec's JSON protocol |
| WS-03 | Incoming messages dispatched to registered consumers by `topic` field | D-06 dispatch pattern; `WebSocketMessage<T>.topic` field from spec |
| WS-04 | Connection auto-reconnects with exponential backoff (1s → 30s cap) | D-08; `react-use-websocket` `reconnectInterval` option with `(attempt) => Math.min(1000 * 2 ** attempt, 30000)` |
| WS-05 | All topics re-subscribed automatically after every reconnect | D-08 `onOpen` callback; active callbacks from registry map |
| WS-06 | TypeScript types for all 6 provider WS payloads derived from `docs/api/websocket.md` | D-05 `types/websocket.ts`; spec has all 6 interfaces ready to copy |
</phase_requirements>

---

## Summary

Phase 139 delivers a single shared WebSocket connection manager for the entire app. The architecture is clear: one `useWebSocketManager` hook wraps `react-use-websocket` and maintains a `Map<Topic, Set<callback>>` registry. This hook is initialized once in `ClientProviders` (the existing client-side provider wrapper) and exposes a subscribe/unsubscribe API consumed by individual device hooks in later phases.

The WebSocket spec in `docs/api/websocket.md` is extremely detailed and serves as the authoritative source for both the TypeScript types (all 6 provider interfaces are fully specified) and the protocol behavior (subscribe/unsubscribe messages, snapshot-on-subscribe, reconnection requirements). The spec even includes a complete `useProviderData` example using `react-use-websocket` v4.x — though that example opens per-hook connections (which violates the MAX 2 server limit), the config options shown are directly applicable to the shared manager pattern.

The env var situation requires resolution: the existing `.env.local` has `HA_API_URL` (server-side, no `NEXT_PUBLIC_` prefix) but no `NEXT_PUBLIC_HA_API_URL`. A new `NEXT_PUBLIC_WS_URL` env var is the cleanest approach — it holds the WebSocket base URL directly (e.g., `wss://pdupun8zpr7exw43.myfritz.net`) and avoids protocol-swap logic. Additionally, `NEXT_PUBLIC_WS_API_KEY` must be added as a separate client-side key distinct from the server-side `HA_API_KEY`.

**Primary recommendation:** Implement `useWebSocketManager` in `lib/hooks/useWebSocketManager.ts`, initialize it inside `ClientProviders.tsx` via a new `WebSocketProvider` wrapper, and place all types in `types/websocket.ts`.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| react-use-websocket | 4.13.0 | WebSocket hook with reconnection, readyState, sendJsonMessage | Mandated by spec; handles pong/ping, reconnection, cleanup automatically |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| React (useRef, useCallback, useContext, createContext) | 19.2.0 (already installed) | Singleton ref, stable callbacks, context distribution | For sharing the subscribe/unsubscribe API app-wide |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| react-use-websocket | Native WebSocket + useEffect | Custom reconnection logic, more boilerplate, no built-in readyState enum |
| React Context | Prop drilling | Context is correct here — subscribe API needs to reach nested device hooks |
| React Context | Zustand/Jotai | Overkill for a single connection manager; adds dependency |

**Installation:**
```bash
npm install react-use-websocket
```

**Version verification:** `npm view react-use-websocket version` → `4.13.0` (published 2025-02-04). This is the current stable version. The spec's examples reference v4.x and are fully compatible.

---

## Architecture Patterns

### Recommended Project Structure
```
types/
└── websocket.ts         # WebSocketMessage<T>, Topic, all 6 provider interfaces

lib/hooks/
└── useWebSocketManager.ts   # Singleton WS manager hook (new)

app/components/
└── ClientProviders.tsx      # Add WebSocketProvider here (existing file, edit)

app/context/
└── WebSocketContext.ts      # createContext for subscribe/unsubscribe API (new)
```

### Pattern 1: Singleton via React Context + useRef

The manager hook (`useWebSocketManager`) is called **once** in `ClientProviders`. It returns a `{ subscribe, unsubscribe, readyState }` object exposed via React Context. Device hooks call `useWebSocketContext()` to get the subscribe function.

**Why not just a hook called everywhere:** `react-use-websocket` with the same URL creates a new connection per hook call by default (unless `share: true` is used). The callback registry pattern with a single top-level hook is the explicit approach that guarantees one connection.

**Example — Manager hook skeleton:**
```typescript
// lib/hooks/useWebSocketManager.ts
// Source: docs/api/websocket.md + D-01 through D-08 decisions

'use client';

import { useCallback, useEffect, useRef } from 'react';
import useWebSocket, { ReadyState } from 'react-use-websocket';
import type { Topic, WebSocketMessage } from '@/types/websocket';

type TopicCallback = (data: unknown) => void;

export interface WebSocketManager {
  subscribe: (topic: Topic, callback: TopicCallback) => void;
  unsubscribe: (topic: Topic, callback: TopicCallback) => void;
  readyState: ReadyState;
}

export function useWebSocketManager(wsUrl: string | null): WebSocketManager {
  // Map<Topic, Set<callback>> — survives re-renders via ref
  const callbacksRef = useRef<Map<Topic, Set<TopicCallback>>>(new Map());

  const { sendJsonMessage, lastMessage, readyState } = useWebSocket(
    wsUrl,
    {
      onOpen: () => {
        // Re-subscribe all active topics on every (re)connect
        callbacksRef.current.forEach((callbacks, topic) => {
          if (callbacks.size > 0) {
            sendJsonMessage({ action: 'subscribe', topic });
          }
        });
      },
      shouldReconnect: () => true,
      reconnectAttempts: 10,
      reconnectInterval: (attempt) => Math.min(1000 * 2 ** attempt, 30000),
    },
    wsUrl !== null  // only connect when URL is available
  );

  // Dispatch incoming messages to registered callbacks
  useEffect(() => {
    if (!lastMessage) return;
    try {
      const msg = JSON.parse(lastMessage.data as string) as WebSocketMessage;
      const callbacks = callbacksRef.current.get(msg.topic as Topic);
      callbacks?.forEach((cb) => cb(msg.data));
    } catch {
      // Ignore malformed messages
    }
  }, [lastMessage]);

  const subscribe = useCallback((topic: Topic, callback: TopicCallback) => {
    if (!callbacksRef.current.has(topic)) {
      callbacksRef.current.set(topic, new Set());
    }
    callbacksRef.current.get(topic)!.add(callback);
    // Send subscribe if connected
    if (readyState === ReadyState.OPEN) {
      sendJsonMessage({ action: 'subscribe', topic });
    }
  }, [readyState, sendJsonMessage]);

  const unsubscribe = useCallback((topic: Topic, callback: TopicCallback) => {
    const callbacks = callbacksRef.current.get(topic);
    if (!callbacks) return;
    callbacks.delete(callback);
    // Send unsubscribe only when last callback removed
    if (callbacks.size === 0 && readyState === ReadyState.OPEN) {
      sendJsonMessage({ action: 'unsubscribe', topic });
    }
  }, [readyState, sendJsonMessage]);

  return { subscribe, unsubscribe, readyState };
}
```

### Pattern 2: WS URL Construction

The existing `.env.local` has `HA_API_URL=https://pdupun8zpr7exw43.myfritz.net` (server-side only). For the client-side WebSocket, the cleanest approach is to add two new `NEXT_PUBLIC_*` vars:

```bash
# .env.local additions
NEXT_PUBLIC_WS_URL=wss://pdupun8zpr7exw43.myfritz.net
NEXT_PUBLIC_WS_API_KEY=<same or separate API key>
```

This avoids protocol-swap logic on the client. The WS URL is constructed as:
```
${NEXT_PUBLIC_WS_URL}/ws/live?api_key=${NEXT_PUBLIC_WS_API_KEY}
```

Alternatively, `NEXT_PUBLIC_WS_URL` can be derived from `NEXT_PUBLIC_HA_API_URL` (if that var is added), but since `HA_API_URL` is server-side only, a dedicated client-side var is cleaner and more explicit.

### Pattern 3: Context Distribution

```typescript
// app/context/WebSocketContext.ts
import { createContext, useContext } from 'react';
import type { WebSocketManager } from '@/lib/hooks/useWebSocketManager';

export const WebSocketContext = createContext<WebSocketManager | null>(null);

export function useWebSocketContext(): WebSocketManager {
  const ctx = useContext(WebSocketContext);
  if (!ctx) throw new Error('useWebSocketContext must be used within WebSocketProvider');
  return ctx;
}
```

```typescript
// ClientProviders.tsx addition
import { WebSocketContext } from '@/app/context/WebSocketContext';
import { useWebSocketManager } from '@/lib/hooks/useWebSocketManager';

// Inside the component:
const wsManager = useWebSocketManager(WS_URL);  // WS_URL built from env vars

// Wrap children:
<WebSocketContext.Provider value={wsManager}>
  {children}
</WebSocketContext.Provider>
```

### Pattern 4: Types File Structure

```typescript
// types/websocket.ts
// Source: docs/api/websocket.md — copy verbatim, do not invent fields

export type Topic = 'fritzbox' | 'dirigera' | 'netatmo' | 'thermorossi' | 'hue' | 'sonos';

export interface WebSocketMessage<T = unknown> {
  type: 'event' | 'snapshot';
  topic: string;
  data: T;
  ts: number;  // Unix timestamp (integer seconds)
}

// --- 6 Provider interfaces (verbatim from spec) ---
export interface FritzBoxDevice { ... }
export interface FritzBoxBandwidth { ... }
export interface FritzBoxWan { ... }
export interface FritzBoxData { ... }

export interface DirigeraBaseSensor { ... }
export interface DirigeraContactSensor extends DirigeraBaseSensor { ... }
export interface DirigeraMotionSensor extends DirigeraBaseSensor { ... }
export type DirigeraSensor = DirigeraContactSensor | DirigeraMotionSensor;
export interface DirigeraData { ... }

export type NetatmoData = Record<string, unknown>;  // Raw Netatmo API response

export interface ThermorossiData { ... }

export interface HueLightState { ... }
export interface HueLight { ... }
export interface HueGroupState { ... }
export interface HueGroup { ... }
export interface HueData { ... }

export interface SonosSpeaker { ... }
export interface SonosGroupMember { ... }
export interface SonosGroup { ... }
export interface SonosData { ... }

// Discriminated union for all topic data types
export type TopicDataMap = {
  fritzbox: FritzBoxData;
  dirigera: DirigeraData;
  netatmo: NetatmoData;
  thermorossi: ThermorossiData;
  hue: HueData;
  sonos: SonosData;
};
```

Adding a `TopicDataMap` mapped type (not in the spec but a natural addition) allows future device hooks to write `TopicDataMap['fritzbox']` for fully-typed data access.

### Anti-Patterns to Avoid
- **Per-hook WS connections:** Calling `useWebSocket` in each device hook directly violates MAX 2 connections. The spec's `useProviderData` example explicitly warns about this. Use the shared manager exclusively.
- **`share: true` in react-use-websocket:** The library has a `share` option that deduplicates connections by URL, but it has limitations with multiple topics and callback dispatch. The explicit `Map<Topic, Set<callback>>` pattern is more predictable and testable.
- **Subscribing on mount only:** All `subscribe` calls must go through the manager's `onOpen` callback for reconnect scenarios. The manager handles re-subscription; device hooks must NOT re-send subscribe messages themselves.
- **React StrictMode double-connect in dev:** In Next.js dev mode, StrictMode double-invokes effects, potentially hitting the server's MAX 2 connections (close code 1013). This is expected dev-mode behavior. Use one tab at a time during development.
- **Exposing `HA_API_KEY` to the browser:** The server-side `HA_API_KEY` must never become a `NEXT_PUBLIC_*` var. `NEXT_PUBLIC_WS_API_KEY` should be a separate key (or the same value intentionally accepted as browser-visible per spec's security note).
- **`sendJsonMessage` in `useCallback` without `readyState` dep:** The `sendJsonMessage` reference from `react-use-websocket` is stable, but `readyState` is needed to guard subscribe calls. Include `readyState` in deps or check `readyState === ReadyState.OPEN` before calling.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| WebSocket reconnection | Custom exponential backoff with setTimeout | `react-use-websocket` reconnectInterval | Edge cases: cleanup on unmount, race conditions between new connection and old close |
| readyState tracking | Custom open/close/error event listeners | `react-use-websocket` ReadyState enum | Library normalizes states across browsers, handles cleanup |
| Ping/pong heartbeat | Custom interval sending ping frames | Browser WebSocket built-in (standard) | Server sends ping every 30s; browser WebSocket API responds to pong automatically |
| Connection cleanup | Manual WebSocket.close() in useEffect | react-use-websocket unmount cleanup | Library ensures connection closes when the hook's component unmounts |

**Key insight:** WebSocket reconnection has many edge cases (what if reconnect fires while old socket is still CLOSING? what if component unmounts during reconnect backoff?). react-use-websocket handles all of these. The custom code should only implement the dispatch/registry layer on top.

---

## Common Pitfalls

### Pitfall 1: Stale `sendJsonMessage` ref in subscribe callback
**What goes wrong:** The `subscribe` function captures `sendJsonMessage` from a specific render; after reconnect, the ref may be stale and the subscribe message is never sent.
**Why it happens:** `sendJsonMessage` from `react-use-websocket` is a stable ref — it does NOT change across renders. This is safe. However, the `readyState` check in `subscribe` may read stale state if not in the `onOpen` handler.
**How to avoid:** Trust `sendJsonMessage` stability. For the "send subscribe on late subscriber" case (component subscribes after connection is already open), check `readyState === ReadyState.OPEN` before calling `sendJsonMessage`.
**Warning signs:** Consumer hook subscribes but never receives data; check DevTools Network for missing subscribe messages.

### Pitfall 2: MAX 2 connections violated in development
**What goes wrong:** React StrictMode (active in Next.js dev) double-invokes effects. If the manager hook is initialized in two places, two connections open, hitting the server limit. Code 1013 in DevTools.
**Why it happens:** StrictMode mounts → unmounts → mounts to detect side effects. The old connection may not have closed before the new one opens.
**How to avoid:** Initialize `useWebSocketManager` in exactly one place (ClientProviders). In dev, open only one browser tab. The spec explicitly warns about this.
**Warning signs:** Immediate disconnection in dev; close code 1013 in DevTools WebSocket frames tab.

### Pitfall 3: `onOpen` callback with stale callbacksRef
**What goes wrong:** The `onOpen` callback is captured at hook initialization and may have a stale closure over `callbacksRef`. On reconnect, `callbacksRef.current` is empty and no topics are re-subscribed.
**Why it happens:** `callbacksRef` is a ref (not state), so its `.current` value is always the latest. However, if `onOpen` is defined inline without proper ref access, it may capture nothing.
**How to avoid:** Access `callbacksRef.current` inside the `onOpen` callback (not a closure over a snapshot). Since refs are mutable objects, `callbacksRef.current` always reflects current state at call time — no stale closure issue.
**Warning signs:** After WiFi drop and reconnect, devices show no data until page refresh.

### Pitfall 4: `noUncheckedIndexedAccess` with `callbacksRef.current.get(topic)`
**What goes wrong:** `Map.get()` returns `T | undefined`. With `noUncheckedIndexedAccess`, iterating over `callbacks?.forEach` is fine, but `callbacks.size` before `callbacks` is narrowed will error.
**Why it happens:** TypeScript strict mode in this project (`strict: true` + `noUncheckedIndexedAccess`).
**How to avoid:** Always optional-chain: `callbacksRef.current.get(topic)?.size`. Or use `has()` guard before `get()`. Non-null assertion (`!`) is acceptable ONLY after an explicit `has()` guard.
**Warning signs:** `tsc` errors on `.size` access on potentially-undefined Map value.

### Pitfall 5: `NEXT_PUBLIC_WS_API_KEY` not set in Vercel/CI environments
**What goes wrong:** WebSocket URL is constructed as `wss://host/ws/live?api_key=undefined` — server rejects with code 1008.
**Why it happens:** `process.env.NEXT_PUBLIC_WS_API_KEY` evaluates to `undefined` at runtime if not set; string interpolation produces the literal string `"undefined"`.
**How to avoid:** Guard at module level: `const WS_API_KEY = process.env.NEXT_PUBLIC_WS_API_KEY ?? ''`. Treat empty string as "WS disabled" and pass `null` as wsUrl to `useWebSocket` (the library skips connection when url is null).
**Warning signs:** 1008 close code; URL contains literal "undefined".

---

## Code Examples

Verified patterns from official sources:

### react-use-websocket Options (from docs/api/websocket.md)
```typescript
// Source: docs/api/websocket.md § Reconnection
const { lastMessage, sendJsonMessage, readyState } = useWebSocket(wsUrl, {
  onOpen: () => {
    // Re-subscribe on every connection — including reconnects
    sendJsonMessage({ action: 'subscribe', topic: 'fritzbox' });
  },
  shouldReconnect: (closeEvent) => true,         // reconnect on all close events
  reconnectAttempts: 10,                          // number of retries
  reconnectInterval: (attemptNumber) =>           // exponential backoff
    Math.min(1000 * 2 ** attemptNumber, 30000),
});
```

### Disabling Connection When URL is Null
```typescript
// Source: react-use-websocket docs — pass null to disable connection
const { ... } = useWebSocket(
  wsUrl,   // null = no connection; string = connect
  options,
  wsUrl !== null  // connect condition (3rd arg)
);
```

### Topic Dispatch with noUncheckedIndexedAccess Safety
```typescript
// Source: D-06 pattern + TypeScript strict compliance
useEffect(() => {
  if (!lastMessage) return;
  try {
    const msg = JSON.parse(lastMessage.data as string) as WebSocketMessage;
    const topic = msg.topic as Topic;
    const callbacks = callbacksRef.current.get(topic);
    callbacks?.forEach((cb) => cb(msg.data));
  } catch {
    // Ignore malformed messages — server ping frames, malformed JSON
  }
}, [lastMessage]);
```

### subscribe with Late-Subscriber Guard
```typescript
// Source: D-06/D-07 decisions
const subscribe = useCallback((topic: Topic, callback: TopicCallback) => {
  if (!callbacksRef.current.has(topic)) {
    callbacksRef.current.set(topic, new Set());
  }
  // Non-null assertion safe — we just ensured the key exists above
  callbacksRef.current.get(topic)!.add(callback);
  // Late subscriber: if already connected, send subscribe immediately
  if (readyState === ReadyState.OPEN) {
    sendJsonMessage({ action: 'subscribe', topic });
  }
  // If not connected, onOpen will handle subscription on next connect
}, [readyState, sendJsonMessage]);
```

### Message Envelope (from spec)
```typescript
// Source: docs/api/websocket.md § Event Format
interface WebSocketMessage<T = unknown> {
  type: 'event' | 'snapshot';
  topic: string;
  data: T;
  ts: number;  // Unix timestamp (integer seconds)
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Per-hook polling (useAdaptivePolling) | Shared WS push (useWebSocketManager) | Phase 139 (this phase — infrastructure only) | Polling remains as fallback; WS is new primary for device data in 140-143 |
| Individual API key per consumer | Shared `NEXT_PUBLIC_WS_API_KEY` | Phase 139 | Single credential for all WS subscriptions |

**Deprecated/outdated:**
- Per-hook `useProviderData` pattern from spec example: Fine for single-topic demos; violates MAX 2 connections when all 6 device hooks use it simultaneously. Replaced by shared manager.

---

## Open Questions

1. **`NEXT_PUBLIC_WS_API_KEY` value**
   - What we know: The spec says to use `?api_key=` for browser-side auth. The server-side `HA_API_KEY` exists in `.env.local` but is NOT `NEXT_PUBLIC_*`.
   - What's unclear: Should `NEXT_PUBLIC_WS_API_KEY` be the same value as `HA_API_KEY` (now intentionally browser-visible), or a separate dedicated WS key?
   - Recommendation: The spec notes that `?api_key=` appears in browser history/logs and recommends JWT tokens for production browser clients. For this app (personal/home use), reusing `HA_API_KEY` value as `NEXT_PUBLIC_WS_API_KEY` is pragmatic. The planner should add a comment in `.env.local` documenting this decision.

2. **`wsUrl` when `NEXT_PUBLIC_WS_URL` is not set**
   - What we know: No `NEXT_PUBLIC_*` URL vars currently exist in `.env.local`.
   - What's unclear: Should the plan derive WS URL from `NEXT_PUBLIC_HA_API_URL` (new var) or use a dedicated `NEXT_PUBLIC_WS_URL`?
   - Recommendation: Add `NEXT_PUBLIC_WS_URL=wss://pdupun8zpr7exw43.myfritz.net` directly. Avoids string manipulation for protocol swap. Also add `NEXT_PUBLIC_WS_API_KEY` with the same value as `HA_API_KEY`. The plan should include updating `.env.local.example` or equivalent documentation.

3. **Whether to use React Context or prop-drilling for subscribe API**
   - What we know: `ClientProviders.tsx` wraps all client providers. The app has multiple device cards at varying depths. Context is already used extensively.
   - Recommendation: React Context (`WebSocketContext`) is the right call. Device hooks are consumed deep in the component tree (e.g., `StoveCard → useStoveData`). Context avoids prop drilling through layout/page/card layers.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| react-use-websocket | WS-01, WS-04 | ✗ (not in package.json) | 4.13.0 (latest) | None — must install |
| Node.js | Build/test | ✓ | (project already building) | — |
| NEXT_PUBLIC_WS_URL | WS-01 | ✗ (not in .env.local) | — | Must add to .env.local |
| NEXT_PUBLIC_WS_API_KEY | WS-01 | ✗ (not in .env.local) | — | Must add to .env.local |

**Missing dependencies with no fallback:**
- `react-use-websocket` — must be installed before implementation (decision D-01 mandates it)
- `NEXT_PUBLIC_WS_URL` — required for WS URL construction; no fallback
- `NEXT_PUBLIC_WS_API_KEY` — required for auth; no fallback

**Note on `npm install`:** CLAUDE.md prohibits running `npm install`. The plan must include the install command for the user to run manually, or the implementer agent must be granted explicit permission.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest 30.2.0 + @testing-library/react 16.3.1 |
| Config file | `jest.config.ts` |
| Quick run command | `npm test -- --testPathPattern="websocket"` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| WS-01 | Single shared connection — two subscribers get same manager instance | unit | `npm test -- --testPathPattern="useWebSocketManager"` | ❌ Wave 0 |
| WS-02 | subscribe sends `{"action":"subscribe","topic":"..."}` message | unit | `npm test -- --testPathPattern="useWebSocketManager"` | ❌ Wave 0 |
| WS-03 | Incoming message with `topic: "fritzbox"` dispatches to fritzbox callback only | unit | `npm test -- --testPathPattern="useWebSocketManager"` | ❌ Wave 0 |
| WS-04 | Reconnect attempts use exponential backoff timing | unit (config check) | `npm test -- --testPathPattern="useWebSocketManager"` | ❌ Wave 0 |
| WS-05 | After simulated reconnect (onOpen), subscribe messages re-sent for active topics | unit | `npm test -- --testPathPattern="useWebSocketManager"` | ❌ Wave 0 |
| WS-06 | TypeScript types compile without errors; all 6 interfaces exist in types/websocket.ts | type-check | `npx tsc --noEmit` | ❌ Wave 0 |

### Mocking Strategy for react-use-websocket

react-use-websocket must be mocked in Jest tests (jsdom environment has no real WebSocket server). The standard approach:

```typescript
// __mocks__/react-use-websocket.ts
import { ReadyState } from 'react-use-websocket';

const mockSendJsonMessage = jest.fn();
const mockLastMessage = { data: '{}' };

export const useWebSocket = jest.fn(() => ({
  lastMessage: mockLastMessage,
  sendJsonMessage: mockSendJsonMessage,
  readyState: ReadyState.OPEN,
}));

export { ReadyState };
export default useWebSocket;
```

Tests then use `jest.mocked(useWebSocket)` to control return values and verify `sendJsonMessage` calls.

### Sampling Rate
- **Per task commit:** `npm test -- --testPathPattern="useWebSocketManager" --passWithNoTests`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `__tests__/hooks/useWebSocketManager.test.ts` — covers WS-01 through WS-05
- [ ] `__mocks__/react-use-websocket.ts` — shared mock for all WS tests
- [ ] `types/websocket.ts` — covers WS-06 (type-check via `tsc --noEmit`)

---

## Project Constraints (from CLAUDE.md)

| Directive | Impact on Phase 139 |
|-----------|---------------------|
| NEVER break existing functionality | Polling hooks (useAdaptivePolling) remain untouched; WS manager is purely additive |
| WAIT for user confirmation before version updates | `react-use-websocket` is a new dependency — user must confirm installation |
| PREFER editing existing files | Add WebSocketProvider to existing `ClientProviders.tsx` rather than new file; add to existing `types/` directory |
| NEVER execute `npm run build` or `npm install` | Plan must note install step for user; implementer cannot run it |
| ALWAYS create/update unit tests | `__tests__/hooks/useWebSocketManager.test.ts` is mandatory |
| USE design system | Not applicable (no UI changes in this phase) |
| NEVER commit/push without explicit request | All commits require explicit user instruction |

---

## Sources

### Primary (HIGH confidence)
- `docs/api/websocket.md` — Complete WS protocol spec: endpoint, auth, message format, all 6 payload interfaces, reconnection strategy, error codes, react-use-websocket example
- `lib/haClient.ts` — Env var and error handling patterns in the existing codebase
- `lib/hooks/useAdaptivePolling.ts` — Hook architecture patterns (ref-based callbacks, visibility awareness)
- `app/components/ClientProviders.tsx` — Injection point for new WebSocketProvider
- `.env.local` — Confirmed existing env vars; confirmed absence of `NEXT_PUBLIC_*` API URL

### Secondary (MEDIUM confidence)
- `npm view react-use-websocket` — Confirmed 4.13.0 is current stable (published 2025-02-04)
- `.planning/phases/139-websocket-infrastructure/139-CONTEXT.md` — All implementation decisions D-01 through D-08

### Tertiary (LOW confidence)
- None

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — react-use-websocket 4.13.0 verified via npm registry; mandated by spec
- Architecture: HIGH — all patterns derived from project spec and locked decisions; existing codebase patterns verified by reading source files
- Pitfalls: HIGH — most derived from spec warnings (code 1013, StrictMode, re-subscribe) and TypeScript strict mode requirements verified in tsconfig
- Types: HIGH — all 6 payload interfaces copied verbatim from docs/api/websocket.md

**Research date:** 2026-03-26
**Valid until:** 2026-04-26 (stable domain; react-use-websocket releases infrequently)
