# Phase 148: Tuya Frontend - Context

**Gathered:** 2026-03-30
**Status:** Ready for planning

<domain>
## Phase Boundary

Users can monitor and control Tuya smart plugs from the dashboard and a dedicated /tuya page, with live WS data, on/off toggles, timer controls, energy history charts, and correct registry entries.

</domain>

<decisions>
## Implementation Decisions

### Dashboard Card Content
- **D-01:** TuyaCard shows a compact summary: total plug count, active/inactive breakdown, total power draw (W), and a power gauge — click navigates to /tuya page
- **D-02:** Multi-plug status uses aggregate view (N on / N off, total W, highlight highest consumer) — no per-plug detail on dashboard card

### Plug Grid Layout (/tuya page)
- **D-03:** Card-per-plug responsive grid: 1-col mobile, 2-col tablet, 3-col desktop
- **D-04:** Each plug card shows: on/off toggle, custom_name (or device_id fallback), power_w, countdown timer status, data_freshness badge, click/expand for energy chart

### Energy Chart Design
- **D-05:** Recharts AreaChart with auto-granularity period selector (24h → raw, 7d → hourly, 30d → daily)
- **D-06:** Primary metric: avg_power_w (or power_w for raw); secondary metric: energy_kwh_delta — use next/dynamic code splitting for chart component

### Timer Controls UX
- **D-07:** Inline on plug card: number input (minutes) + "Imposta" button; active countdown shows as mm:ss with "Annulla" button
- **D-08:** Timer set sends POST /api/tuya/plugs/{device_id}/timer with seconds = minutes * 60; cancel sends seconds = 0

### Claude's Discretion
- Color theme for TuyaCard (suggest "amber" or "cyan" to differentiate from existing devices)
- Skeleton component design for loading state
- Error/empty state copy (Italian locale)
- Power gauge component: reuse existing gauge patterns or simple bar — Claude decides based on what exists
- Stale state threshold values for WS data

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Tuya API
- `docs/api/tuya.md` — Authoritative Tuya API spec: 6 endpoints, request/response shapes, auto-granularity rules, re-poll pattern

### Types
- `types/tuyaProxy.ts` — TuyaPlug, TuyaPlugMutation, TuyaSetStateRequest, TuyaSetTimerRequest, TuyaHistoryItem, TuyaHistoryResponse
- `types/websocket.ts` — TuyaData WS payload type (plugs: TuyaPlug[] | null, data_freshness)

### Existing Patterns (reference implementations)
- `app/components/devices/raspi/hooks/useRaspiData.ts` — WS-primary + polling-fallback hook pattern (Phase 146)
- `app/components/devices/raspi/RaspiCard.tsx` — Dashboard card orchestrator pattern with LastUpdated
- `app/components/devices/stove/hooks/useStoveCommands.ts` — Command hook pattern for POST operations
- `app/components/DashboardCards.tsx` — CARD_COMPONENTS + CARD_SKELETONS + DEVICE_META registries
- `app/network/components/BudgetStatsCard.tsx` — Recharts chart component pattern on sub-page

### Infrastructure (already built in Phase 147)
- `lib/tuya/tuyaProxy.ts` — Proxy client: getHealth, getPlugs, getPlug, setPlugState, setPlugTimer, getPlugHistory
- `app/api/tuya/` — All 6 API route proxies (health, plugs, plugs/[device_id], state, timer, history)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `SmartHomeCard` — Base card with icon, title, colorTheme, Controls/Status slots
- `DeviceCardErrorBoundary` — Error boundary wrapper for dashboard cards
- `LastUpdated` — Italian-locale relative timestamp component
- `HealthIndicator` — Health status badge (ok/warning/error)
- `Banner` — Warning/error banner for unreachable states
- `Skeleton.*` — Skeleton factory for loading states (needs TuyaCard entry)
- `useAdaptivePolling` — Polling hook with visibility awareness
- `useWebSocketContext` — WS subscription API (subscribe/unsubscribe/readyState)
- `useVisibility` — Page Visibility API hook
- `next/dynamic` — Code splitting for Recharts charts (established pattern)

### Established Patterns
- Device folder: `app/components/devices/{device}/` → hooks/, components/, __tests__/, {Device}Card.tsx
- WS hook: subscribe to topic, update state, fallback to polling when disconnected (interval = isWsConnected ? null : pollInterval)
- Command hook: separate hook for POST operations returning mutation result
- Dashboard registry: add to CARD_COMPONENTS, CARD_SKELETONS, DEVICE_META in DashboardCards.tsx
- Sub-page charts: use next/dynamic for Recharts components to enable code splitting

### Integration Points
- `DashboardCards.tsx` — Add 'tuya' to CARD_COMPONENTS, CARD_SKELETONS, DEVICE_META
- `app/(app)/tuya/page.tsx` — New page route (follow existing pattern: app/(app)/raspi/, app/(app)/sonos/)
- Navigation menu — Add "Tuya" entry (follow pattern from Phase 125 gap closure)
- `unifiedDeviceConfigService` — Register tuya device type for dashboard visibility control

</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches following established device patterns.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 148-tuya-frontend*
*Context gathered: 2026-03-30*
