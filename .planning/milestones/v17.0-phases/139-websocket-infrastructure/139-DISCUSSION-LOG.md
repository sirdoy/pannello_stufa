# Phase 139: WebSocket Infrastructure - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-26
**Phase:** 139-websocket-infrastructure
**Areas discussed:** Connection manager architecture, Auth credential source, Type file organization, Topic dispatch pattern
**Mode:** --auto (all decisions auto-selected using recommended defaults)

---

## Connection Manager Architecture

| Option | Description | Selected |
|--------|-------------|----------|
| Singleton class | ES module singleton managing WS lifecycle | |
| React context provider | Context wrapping app tree with WS state | |
| Custom hook with ref-based singleton | Hook wrapping react-use-websocket, familiar API | ✓ |

**User's choice:** [auto] Custom hook with ref-based singleton (recommended default)
**Notes:** Aligns with existing hook ecosystem (useAdaptivePolling, useVisibility). Keeps API familiar to the codebase.

---

## Auth Credential Source

| Option | Description | Selected |
|--------|-------------|----------|
| NEXT_PUBLIC env var for API key | Simple, follows existing NEXT_PUBLIC_* pattern | ✓ |
| JWT token from Auth0 session | More secure, but requires login flow integration | |
| Server-side token exchange | API route mints short-lived WS token | |

**User's choice:** [auto] NEXT_PUBLIC env var for API key (recommended default)
**Notes:** Follows established pattern. JWT can be added later if security requirements change.

---

## Type File Organization

| Option | Description | Selected |
|--------|-------------|----------|
| Single types/websocket.ts | All WS types in one file, mirrors spec doc | ✓ |
| Per-provider type files | Types co-located with each provider's code | |
| Extend existing provider types | Add WS types to existing types/*.ts files | |

**User's choice:** [auto] Single types/websocket.ts (recommended default)
**Notes:** All 6 payload interfaces defined in one spec doc — single type file mirrors this cleanly.

---

## Topic Dispatch Pattern

| Option | Description | Selected |
|--------|-------------|----------|
| Callback registry (Map<Topic, Set<fn>>) | Simple, zero-dependency, manager dispatches by topic | ✓ |
| React context with useContext per topic | Each topic gets its own context value | |
| EventEmitter pattern | Pub/sub with event names matching topics | |

**User's choice:** [auto] Callback registry (recommended default)
**Notes:** Simple, zero-dependency. Each consumer hook registers a typed callback. Manager dispatches by msg.topic field.

---

## Claude's Discretion

- File placement (lib/ vs lib/hooks/)
- Context provider vs pure hook export
- Test mocking approach
- WS URL env var naming

## Deferred Ideas

None — auto mode stayed within phase scope
