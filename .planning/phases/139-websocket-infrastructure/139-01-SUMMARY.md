---
phase: 139-websocket-infrastructure
plan: "01"
subsystem: websocket
tags: [websocket, types, hooks, context, react-use-websocket]
requirements_completed: [WS-01, WS-02, WS-03]
dependency_graph:
  requires: []
  provides:
    - types/websocket.ts — 6 provider payload interfaces + Topic + WebSocketMessage + TopicDataMap
    - lib/hooks/useWebSocketManager.ts — singleton WS connection manager
    - app/context/WebSocketContext.ts — React context for app-wide WS manager access
  affects: []
tech_stack:
  added:
    - react-use-websocket@^4.13.0 (declared in package.json; requires npm install)
  patterns:
    - callback registry (Map<Topic, Set<TopicCallback>>) for multi-subscriber dispatch
    - exponential backoff reconnect via reconnectInterval callback
    - re-subscribe on reconnect via onOpen callback
key_files:
  created:
    - types/websocket.ts
    - lib/hooks/useWebSocketManager.ts
    - app/context/WebSocketContext.ts
    - package.json (react-use-websocket added to dependencies)
  modified: []
decisions:
  - react-use-websocket wraps useWebSocket with exponential backoff config per docs/api/websocket.md spec
  - TopicCallback typed as (data: unknown) => void — consumers cast to their specific payload type
  - NetatmoData = Record<string, unknown> — adapter layer deferred to Phase 143 per spec
  - wsUrl: null disables connection (third arg to useWebSocket) — allows conditional connection
metrics:
  duration_seconds: 137
  completed_date: "2026-03-26"
  tasks_completed: 2
  tasks_total: 2
  files_created: 4
  files_modified: 0
---

# Phase 139 Plan 01: WebSocket Infrastructure Summary

**One-liner:** WebSocket foundation with TypeScript types for 6 provider payloads, singleton connection manager using react-use-websocket with exponential backoff, and React context for app-wide access.

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | Create WebSocket TypeScript types from spec | 2ea555c4 | types/websocket.ts |
| 2 | Create WebSocket manager hook and React context | 32c72c15 | lib/hooks/useWebSocketManager.ts, app/context/WebSocketContext.ts, package.json |

## What Was Built

### types/websocket.ts
All TypeScript types derived verbatim from `docs/api/websocket.md`:
- `Topic` union literal: `'fritzbox' | 'dirigera' | 'netatmo' | 'thermorossi' | 'hue' | 'sonos'`
- `WebSocketMessage<T>` envelope interface
- FritzBox: `FritzBoxDevice`, `FritzBoxBandwidth`, `FritzBoxWan`, `FritzBoxData`
- DIRIGERA: `DirigeraBaseSensor`, `DirigeraContactSensor`, `DirigeraMotionSensor`, `DirigeraSensor`, `DirigeraData`
- Netatmo: `NetatmoData = Record<string, unknown>` (raw API response; adapter in Phase 143)
- Thermorossi: `ThermorossiData` with index signature for raw WiNet fields
- Hue: `HueLightState`, `HueLight`, `HueGroupState`, `HueGroup`, `HueData`
- Sonos: `SonosSpeaker`, `SonosGroupMember`, `SonosGroup`, `SonosData`
- `TopicDataMap` mapped type binding Topic to payload type

### lib/hooks/useWebSocketManager.ts
Singleton connection manager:
- `useWebSocketManager(wsUrl)` → `WebSocketManager { subscribe, unsubscribe, readyState }`
- Callback registry: `Map<Topic, Set<TopicCallback>>` for per-topic multi-subscriber dispatch
- `onOpen` re-subscribes all active topics (WS-05)
- `reconnectInterval: (attempt) => Math.min(1000 * 2 ** attempt, 30000)` — exponential backoff 1s-30s (WS-04)
- Message dispatch routes by `msg.topic` field (WS-03)
- `subscribe` sends `{ action: 'subscribe', topic }` when connection is open (WS-02)
- `unsubscribe` sends `{ action: 'unsubscribe', topic }` when last callback removed

### app/context/WebSocketContext.ts
React context for distributing the manager:
- `WebSocketContext = createContext<WebSocketManager | null>(null)`
- `useWebSocketContext()` — typed hook throwing if called outside provider

## Deviations from Plan

### Auto-added dependency declaration

**[Rule 3 - Blocking] Added react-use-websocket to package.json**
- **Found during:** Task 2
- **Issue:** `react-use-websocket` was not declared in package.json (only required at user_setup). The plan specifies the user must `npm install` it before execution, but it wasn't in package.json at all.
- **Fix:** Added `"react-use-websocket": "^4.13.0"` to dependencies in package.json. User must run `npm install` to install it.
- **Files modified:** package.json
- **Commit:** 32c72c15

## Known Issues

### react-use-websocket not installed
`npx tsc --noEmit` reports `Cannot find module 'react-use-websocket'` for `lib/hooks/useWebSocketManager.ts`. This is expected — the package must be installed before tsc can verify the hook. The plan's `user_setup` specifies:
```
npm install react-use-websocket
```
The dependency has been declared in package.json. After running `npm install`, tsc should pass for the new files (pre-existing test file errors are unrelated and out of scope).

## Pre-existing tsc Errors (Out of Scope)

The following pre-existing errors existed before this plan and are unrelated:
- `__tests__/components/devices/sonos/components/SonosZoneSection.test.tsx` — SonosPlaybackResponse type mismatch
- `app/components/devices/sonos/components/__tests__/SonosQueueViewer.test.tsx` — queue item type errors
- `app/registry/devices/__tests__/page.test.tsx` — undefined HTMLElement access

These are logged to deferred items and not fixed here.

## Self-Check: PASSED

- [x] `types/websocket.ts` exists at correct path
- [x] `lib/hooks/useWebSocketManager.ts` exists at correct path
- [x] `app/context/WebSocketContext.ts` exists at correct path
- [x] Commit 2ea555c4 exists (Task 1)
- [x] Commit 32c72c15 exists (Task 2)
- [x] types/websocket.ts contains all 9 required exports (Topic, WebSocketMessage, FritzBoxData, DirigeraData, NetatmoData, ThermorossiData, HueData, SonosData, TopicDataMap)
- [x] useWebSocketManager.ts contains exponential backoff config
- [x] useWebSocketManager.ts contains subscribe/unsubscribe action messages
- [x] WebSocketContext.ts exports context and typed hook
