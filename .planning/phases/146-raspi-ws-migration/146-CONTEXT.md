# Phase 146: Raspi WS Migration - Context

**Gathered:** 2026-03-30
**Status:** Ready for planning

<domain>
## Phase Boundary

Migrate useRaspiData from HTTP-only polling to WS-primary with polling fallback, add LastUpdated timestamp to RaspiCard, and ensure NavbarConnectionStatus covers the raspi topic. This is the 7th (and final non-Tuya) provider WS migration, following the exact pattern established in Phases 139-143.

</domain>

<decisions>
## Implementation Decisions

### WS Adapter Shape
- **D-01:** Direct field mapping from WS `RaspiData` payload to hook state — extract `cpu_percent` from top level, derive `memoryPercent`/`diskPercent`/`cpuTemperature` from `memory`/`disk`/`system` objects, same as existing `fetchData` logic
- **D-02:** No adapter function needed (unlike Netatmo) — WS payload structure is close enough to map inline in the message handler

### Polling Fallback
- **D-03:** Keep current 60s visible / 300s hidden interval pattern — suppress polling when WS connected (`interval: isWsConnected ? null : interval`)
- **D-04:** `alwaysActive: false` — Raspi monitoring is non-safety-critical (same as DIRIGERA pattern)

### LastUpdated Timestamp
- **D-05:** Add `lastUpdatedAt` state to useRaspiData return, set on both WS message and successful HTTP fetch
- **D-06:** Render `<LastUpdated tsMs={lastUpdatedAt} />` in RaspiCard footer — consistent with all other device cards

### Health Computation
- **D-07:** Compute health entirely from WS payload — no separate health side-fetch needed (unlike DIRIGERA which has a dedicated health endpoint)
- **D-08:** Keep existing `computeRaspiHealth` logic unchanged — thresholds remain the same regardless of data source

### Claude's Discretion
- Hook internal state management (refs, effect cleanup) — follow useDirigeraData pattern exactly
- Test updates to useRaspiData.test.ts and RaspiCard.test.tsx — mock WS context as done in other hook tests

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### WS Infrastructure
- `types/websocket.ts` — RaspiData interface (lines 147-153), TopicDataMap raspi entry
- `docs/api/websocket.md` — WS protocol, raspi topic payload documentation
- `app/context/WebSocketContext.tsx` — subscribe/unsubscribe API used by all hooks

### Migration Pattern (exemplar)
- `app/components/devices/dirigera/hooks/useDirigeraData.ts` — closest analog: simple non-safety-critical hook with WS-primary + polling fallback

### Target Files
- `app/components/devices/raspi/hooks/useRaspiData.ts` — hook to migrate (currently HTTP-only)
- `app/components/devices/raspi/RaspiCard.tsx` — add LastUpdated rendering
- `app/components/ui/LastUpdated.tsx` — existing component to reuse

### Connection UX
- `app/components/layout/NavbarConnectionStatus.tsx` — reads global readyState, no per-topic wiring needed (UX-01 is about the raspi topic being in the subscription set, not this component)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `LastUpdated` component: takes `tsMs: number | null`, renders Italian relative timestamp
- `useWebSocketContext()`: provides `subscribe(topic, handler)`, `unsubscribe(topic, handler)`, `readyState`
- `ReadyState.OPEN` constant for WS connection check
- `useAdaptivePolling`: accepts `interval: number | null` (null = suspended)
- `computeRaspiHealth`: existing pure function, no changes needed

### Established Patterns
- WS-primary pattern: `useEffect` with `isWsConnected` guard → subscribe/unsubscribe cleanup
- Polling suppression: `interval: isWsConnected ? null : interval`
- Ref pattern for stale closure avoidance (`dataRef`, `fetchRef`)
- `setLastUpdatedAt(Date.now())` on every data update (WS or HTTP)

### Integration Points
- `useRaspiData` return type gains `lastUpdatedAt: number | null`
- RaspiCard imports `LastUpdated` and renders in footer
- No NavbarConnectionStatus changes needed (it reads global WS state)
- WS topic `'raspi'` already registered in `TopicDataMap`

</code_context>

<specifics>
## Specific Ideas

No specific requirements — follow the established WS migration pattern from useDirigeraData exactly. This is the simplest of all migrations: single data shape, no adapter, no side-fetch, no safety-critical constraints.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 146-raspi-ws-migration*
*Context gathered: 2026-03-30*
