# Phase 144: Connection UX - Context

**Gathered:** 2026-03-28
**Status:** Ready for planning

<domain>
## Phase Boundary

Deliver three user-facing enhancements: (1) a global visual indicator of the WebSocket connection state (connected / reconnecting / fallback polling), (2) flicker-free transitions between WebSocket and polling so users never see blank or stale cards during a source switch, and (3) per-card "last updated" timestamps showing when data was last received.

This phase adds UI only — no changes to WS infrastructure, device hooks' data-fetching logic, or polling fallback behavior (all handled in Phases 139-143).

</domain>

<decisions>
## Implementation Decisions

### Status Indicator Placement (UX-01)
- **D-01:** A single global connection status indicator lives in the dashboard header/nav area. It uses the existing `ConnectionStatus` component (CVA-based, `app/components/ui/ConnectionStatus.tsx`) with its `online/connecting/offline` variants.
- **D-02:** The indicator maps `ReadyState` from `useWebSocketContext()` to three visual states:
  - `ReadyState.OPEN` → `online` (green dot, "Connesso via WS")
  - `ReadyState.CONNECTING` → `connecting` (amber pulsing dot, "Riconnessione...")
  - `ReadyState.CLOSED` / `ReadyState.CLOSING` / `ReadyState.UNINSTANTIATED` → `offline` (grey dot, "Polling attivo")
- **D-03:** The indicator is display-only — no click action needed. The WS manager handles reconnection automatically with exponential backoff.

### Transition Smoothness (UX-02)
- **D-04:** Card data persists in React state during WS/polling transitions. When the source switches, hooks keep the last known data visible and only update state when new data arrives from the new source. No clearing, no loading skeleton, no flash.
- **D-05:** No visible change occurs in cards during source transitions — the data stream appears continuous to the user. The only visible signal is the global connection indicator changing state.
- **D-06:** This behavior is already inherent in the hook architecture from Phases 140-143 (state persists across source switches). Phase 144 must verify this works correctly and add tests if missing.

### Last-Updated Timestamps (UX-03)
- **D-07:** Each dashboard card displays a small "last updated" timestamp in the card footer area, showing when data was last received.
- **D-08:** Timestamp format is relative time (e.g., "5s fa", "2m fa", "1h fa") in Italian. Relative time is more intuitive for real-time monitoring than absolute timestamps.
- **D-09:** Timestamp source: WS `ts` field (unix seconds, from `WebSocketMessage.ts`) when on WebSocket, or `Date.now()` at HTTP response time when on polling fallback.
- **D-10:** Timestamps update reactively — a `useRelativeTime` utility or interval re-renders the relative string (e.g., every 10-15 seconds) so "5s fa" progresses to "20s fa" without new data arriving.

### Claude's Discretion
- Whether to create a `useConnectionStatus` hook that wraps `useWebSocketContext().readyState` into a simpler status string, or inline the mapping in the component
- Whether to build `useRelativeTime` as a standalone hook or a utility function with `useEffect` interval
- How to inject the last-updated timestamp into existing card orchestrators (prop threading vs hook return value extension)
- Whether the timestamp component is a shared presentational component or inline per-card
- Test strategy for verifying flicker-free transitions (possibly Playwright visual regression or unit test with state assertions)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### WebSocket Spec
- `docs/api/websocket.md` — WS message format with `ts` field (unix seconds), connection lifecycle, reconnection strategy

### WS Infrastructure (Phase 139)
- `lib/hooks/useWebSocketManager.ts` — Shared WS manager exposing `readyState` (ReadyState enum from react-use-websocket)
- `app/context/WebSocketContext.ts` — WebSocketContext + `useWebSocketContext()` hook distributing the manager app-wide
- `types/websocket.ts` — `WebSocketMessage` type with `ts` field

### UI Components
- `app/components/ui/ConnectionStatus.tsx` — Existing CVA component with `online/offline/connecting/unknown` variants + dot indicator + Italian labels
- `app/components/ui/StatusBadge.tsx` — Badge component with dot/badge/floating variants (alternative if needed)
- `app/components/ui/DeviceCard.tsx` — Base device card with `connected` prop, footer area

### Device Hooks (all already WS-migrated)
- `app/components/devices/stove/hooks/useStoveData.ts` — Stove hook (Phase 140 pattern reference)
- `app/components/devices/network/hooks/useNetworkData.ts` — Fritz!Box hook
- `app/components/devices/lights/hooks/useLightsData.ts` — Hue hook
- `app/components/devices/sonos/hooks/useSonosData.ts` — Sonos hook
- `app/components/devices/dirigera/hooks/useDirigeraData.ts` — DIRIGERA hook
- `app/components/devices/thermostat/hooks/useThermostatData.ts` — Netatmo hook

### Staleness Infrastructure
- `lib/hooks/useDeviceStaleness.ts` — Existing staleness hook (polls every 60s, returns `StalenessInfo | null`)
- `lib/pwa/stalenessDetector.ts` — Staleness detection logic

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `ConnectionStatus` component — Already has the exact variant set needed (online/connecting/offline). CVA-based with `aria-live="polite"` for accessibility. Just needs to be wired to `readyState`.
- `useWebSocketContext()` — Provides `readyState` from the shared WS manager. This is the data source for the global indicator.
- `DeviceCard` — Has a footer area and `connected` prop. Can be extended with a timestamp slot.
- `useDeviceStaleness` — Existing staleness monitoring. May overlap with the new timestamp feature — evaluate whether to extend or keep separate.
- `ReadyState` enum — Re-exported from `react-use-websocket` via `useWebSocketManager.ts`. Values: CONNECTING (0), OPEN (1), CLOSING (2), CLOSED (3), UNINSTANTIATED (-1).

### Established Patterns
- **CVA variants** for component styling (ConnectionStatus, StatusBadge)
- **Hook-based device architecture** — All device data via custom hooks with consistent return types
- **Orchestrator pattern** — Cards are thin orchestrators calling hooks. Timestamps should flow through hooks or be computed in the orchestrator.
- **Italian locale** — Status labels are in Italian (e.g., "Connesso", "Riconnessione...", "Offline")
- **`aria-live="polite"`** — Connection status already uses this for screen reader accessibility

### Integration Points
- **Dashboard header/nav** — Global WS indicator placed here
- **Card footer** — Per-card timestamp placed here
- **Device hook return types** — May need to expose `lastUpdatedAt: number` (unix ms) for timestamp source
- **ClientProviders / Layout** — Where the WebSocketProvider lives, where the global indicator renders

</code_context>

<specifics>
## Specific Ideas

- The `ConnectionStatus` component already has `connecting` variant with `animate-pulse` on the dot — perfect for the "reconnecting" state.
- The WS `ts` field is in unix seconds (not milliseconds) — multiply by 1000 for JavaScript Date compatibility.
- The relative time formatter should handle Italian suffixes: "s fa" (seconds ago), "m fa" (minutes ago), "h fa" (hours ago).
- Consider whether "Polling attivo" (polling active) is more informative than "Offline" for the fallback state — the app IS still receiving data, just via polling.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 144-connection-ux*
*Context gathered: 2026-03-28*
