# Phase 140: Stove Migration - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-26
**Phase:** 140-stove-migration
**Areas discussed:** Fallback trigger, Data mapping, Transition behavior, Scheduler/maintenance side-fetches
**Mode:** --auto (all decisions auto-selected as recommended defaults)

---

## Fallback Trigger

| Option | Description | Selected |
|--------|-------------|----------|
| ReadyState-based switch | readyState === OPEN → WS primary, otherwise → polling fallback | [auto] |
| Timeout-based switch | No WS message within N seconds → switch to polling | |
| Dual-source with dedup | Run both WS and polling, deduplicate updates | |

**User's choice:** [auto] ReadyState-based switch (recommended default — simplest, aligns with react-use-websocket's readyState)
**Notes:** ReadyState is already exposed by useWebSocketManager and available via useWebSocketContext().

---

## Data Mapping

| Option | Description | Selected |
|--------|-------------|----------|
| WS inherently fresh | WS messages → isStale=false, use msg.ts as cachedAt. HTTP → use data_freshness/last_poll_at as today. | [auto] |
| Unified staleness | Compute staleness identically for both sources based on age from last update | |
| Drop staleness for WS | No staleness tracking when WS is primary | |

**User's choice:** [auto] WS inherently fresh (recommended default — WS push is by definition fresh data)
**Notes:** The msg.ts field (unix seconds) provides the exact server-side timestamp for cachedAt.

---

## Transition Behavior

| Option | Description | Selected |
|--------|-------------|----------|
| Immediate switch | readyState OPEN → stop polling immediately. Snapshot-on-subscribe fills any gap. | [auto] |
| Grace period | Keep polling for N seconds after WS reconnects to ensure data arrives | |
| Overlap window | Run both for one poll cycle, then suppress polling | |

**User's choice:** [auto] Immediate switch (recommended default — WS snapshot on subscribe provides immediate fresh data)
**Notes:** Stove monitoring is safety-critical; immediate activation of polling on disconnect is important.

---

## Scheduler/Maintenance Side-Fetches

| Option | Description | Selected |
|--------|-------------|----------|
| Keep as HTTP, trigger after data update | Scheduler and maintenance remain HTTP calls, fired after each WS message or HTTP poll | [auto] |
| Separate polling loop for side-fetches | Independent lower-frequency poll for scheduler/maintenance | |
| Include in WS topic expansion | Request server-side inclusion of scheduler/maintenance in thermorossi topic | |

**User's choice:** [auto] Keep as HTTP, trigger after data update (recommended default — these are not in WS payload, simplest approach)
**Notes:** checkVersion() also stays HTTP, triggered after data update regardless of source.

---

## Claude's Discretion

- Hook structure (dedicated helper vs inline WS logic)
- Conditional polling implementation approach
- Test mocking strategy for WS
- Type import preferences (TopicDataMap vs direct ThermorossiData)

## Deferred Ideas

None — discussion stayed within phase scope
