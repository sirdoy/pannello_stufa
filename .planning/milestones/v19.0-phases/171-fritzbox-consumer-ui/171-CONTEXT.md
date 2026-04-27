# Phase 171: Fritz!Box Consumer UI - Context

**Gathered:** 2026-04-23
**Status:** Ready for planning

<domain>
## Phase Boundary

Surface the Fritz!Box telephony endpoints (DECT handsets, call history, answering machine), raw history endpoints (bandwidth, device presence, device-events log), and TR-064 service-discovery descriptor in production UI consumers — outside debug panels for telephony/raw history, inside the existing admin-elevated debug surface for service-discovery. Closes v19.0 audit FRITZ integration gap (phase 162 landed API + client, never wired to UI).

**In scope:** Hooks, presentational components, page wiring, CommandPalette nav, Jest unit + Playwright smoke coverage.
**Out of scope:** API routes (shipped in phase 162), new endpoint coverage beyond FRITZ-01…FRITZ-07, theming work.

</domain>

<decisions>
## Implementation Decisions

### Telephony UI Location (FRITZ-01, FRITZ-02, FRITZ-03)

- **D-01:** New top-level page `/telefonia` hosting DECT, call history, and TAM. [auto] Matches existing device-page pattern (`/lights`, `/sonos`, `/dirigera`, `/raspi`); keeps telephony reachable from nav without polluting the network page tabs. Nav entry added to CommandPalette (`id: nav-telephony`).
- **D-02:** Page uses `PageLayout` + `Heading` + orchestrator pattern from `/network/page.tsx`. Three stacked sections: TAM status card (top, small), DECT handsets table (middle), Call history table (bottom).
- **D-03:** Italian labels throughout (consistent with existing device pages): "Telefonia", "Cornette DECT", "Cronologia chiamate", "Segreteria".

### Telephony Component Design

- **D-04:** **DECT handsets** → `DataTable` with columns: nome, modello, firmware, batteria (percentage badge with color thresholds: ≥50 ember, 20–49 amber, <20 danger), stato registrazione (Badge: registrato / non registrato). Empty state when `items.length === 0`.
- **D-05:** **Call history** → `DataTable` with columns: tipo chiamata (Badge: in entrata / in uscita / persa — color by type), numero, nome (fallback `—`), durata (humanized `mm:ss` or `hh:mm:ss`), data/ora (Italian locale). Paginated 50 items/page with Prev/Next controls forwarding `limit`/`offset` to `/api/fritzbox/telephony/calls`. [auto] Prev/Next beats infinite scroll for server-paginated endpoints — consistent with existing `PaginatedResponse<T>` consumers (`/registry/devices`).
- **D-06:** **TAM status** → single `Card` with: enabled indicator (HealthIndicator green/grey), new-messages count (large number + ember accent when >0), total messages (small secondary), stale banner (Banner variant="warning") when `is_stale === true`, fetched_at timestamp. No actions (read-only surface).

### Raw History Surface (FRITZ-04, FRITZ-05, FRITZ-06)

- **D-07:** New tab **"Storico grezzo"** appended to existing `/network/page.tsx` tab set (after `dispositivi | wifi | servizi | reti-wifi` → add `storico`). [auto] Raw data is conceptually adjacent to aggregated charts already on `/network`; separate page would fragment the network monitoring surface.
- **D-08:** Tab contains three sub-sections stacked vertically:
  - Raw bandwidth records → `DataTable` (timestamp, bytes sent, bytes received, upstream rate, downstream rate, latency, external IP). Paginated.
  - Device presence history → `DataTable` (timestamp, MAC, name, IP, online). Paginated. Gracefully handles proxy 404 (per phase 162 D-05) by rendering `EmptyState` with "Endpoint non disponibile sul proxy" message — never crashes the tab.
  - Device events log → reuses `DeviceEventItem` presentation style if practical, otherwise `DataTable` (timestamp, MAC, name, IP, event type badge: connected / disconnected). Paginated.
- **D-09:** Reuse existing `TimeRangeSelector` component (1h / 24h / 7d) as the shared time scope control at the top of the tab. Each sub-section forwards the selected hours param; pagination resets on range change.
- **D-10:** Lazy-load the tab content (load hooks only when `activeTab === 'storico'` via `paused` option on each hook — identical pattern to existing wifi/servizi tabs).

### Service Discovery Surface (FRITZ-07)

- **D-11:** New **"Service Discovery"** tab inside existing `/debug` tabbed page (not a standalone `/debug/service-discovery` route). [auto] Matches existing debug tab pattern (Stufa / Netatmo / Hue / Weather / Firebase / Scheduler / Network); admin/debug-elevated surface is already auth-gated via /debug.
- **D-12:** Tab component `FritzboxServiceDiscoveryTab` in `app/debug/components/tabs/`. Renders a `DataTable` with columns: nome servizio, tipo (TR-064 service URN), URL (copyable via `CopyableIp`-style inline copy button). Manual refresh button only — no polling (descriptor is effectively static).
- **D-13:** Empty state renders "Nessun servizio rilevato" when `services.length === 0`. Error state renders `ErrorAlert` with retry.

### Hooks & Data Fetching

- **D-14:** Seven new hooks colocated under `app/network/hooks/` (for raw history) and a new `app/telefonia/hooks/` directory (for telephony). Service discovery hook colocated under `app/debug/hooks/` (new dir acceptable) or inline in the tab component — Claude's discretion.
- **D-15:** All polling hooks follow the established Fritz!Box hook pattern (`useAdaptivePolling` + `useVisibility` + `paused` option). 60-second default cadence for telephony and raw history. Service-discovery: no polling, fetch on mount + manual refresh.
- **D-16:** Loading → `Skeleton`, stale → existing `stale` flag surfaced via a subtle stale indicator (consistent with `/network`), empty → `EmptyState`, error → `ErrorAlert` + retry.

### Routing, Nav & Integration

- **D-17:** CommandPalette: add `id: 'nav-telephony'`, label `Telefonia`, route `/telefonia`. No new CommandPalette entries for raw history (reached via existing `/network`) or service discovery (reached via existing `/debug`).
- **D-18:** Page file layout for telephony follows `/lights/page.tsx` conventions (client component, `'use client'`, orchestrator + presentational split).
- **D-19:** New Fritz!Box pages/tabs respect existing Auth0 gate (the API routes already require auth; UI gate is inherited from the app shell — no additional per-page gate).

### Testing

- **D-20:** **Jest unit** coverage:
  - Each new hook: success path, error path, paused behavior, stale flag.
  - Each new component: DataTable render with sample data, empty state, error state, pagination controls.
  - CommandPalette `nav-telephony` entry navigates to `/telefonia`.
- **D-21:** **Playwright smoke** (add to `tests/smoke/page-loads.spec.ts`):
  - `/telefonia` loads, renders heading and at least one of the three sections without console errors.
  - `/network` → click "Storico grezzo" tab → tab content becomes visible, no console errors.
  - `/debug` → click "Service Discovery" tab → table container becomes visible, no console errors.
- **D-22:** Run scoped test subsets during verification — `test:changed`, `test:pages`, `test:components`, `test:api`. Full suite reserved for release gates per CLAUDE.md rule 8.

### Claude's Discretion

- Exact component file names, prop interfaces, and internal split between presentational/container components.
- Icon choices from `lucide-react` (suggested: `Phone`, `PhoneIncoming`, `PhoneMissed`, `Voicemail`, `History`, `Network`).
- Whether to use a shared `<FritzboxPaginatedTable>` abstraction for the four new paginated tables or keep them independent (err on the side of independence — matches codebase preference for three similar lines over premature abstraction).
- Polling cadence fine-tune within 30–120s if hook-specific behavior warrants.
- Whether to compose `/telefonia` as a single `page.tsx` or split into orchestrator + `components/` directory.

### Folded Todos

None — no matching pending todos surfaced for this phase.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements & Roadmap
- `.planning/REQUIREMENTS.md` §FRITZ-01 through §FRITZ-07 — acceptance criteria for each endpoint.
- `.planning/ROADMAP.md` — Phase 171 goal and success criteria.

### Phase 162 Artifacts (upstream — API layer landed here)
- `.planning/phases/162-fritz-box-gap-closure/162-CONTEXT.md` — decisions on raw pass-through, pagination, XML parsing.
- `.planning/phases/162-fritz-box-gap-closure/162-01-SUMMARY.md` and `162-02-SUMMARY.md` — what shipped.

### Client & API Layer (implementation reference)
- `lib/fritzbox/fritzboxClient.ts` — all new client functions already exist (`getDectHandsets`, `getCallHistory`, `getTamStatus`, `getBandwidthHistoryRaw`, `getDevicePresenceHistory`, `getDeviceEventsRaw`, `getServiceDiscovery`).
- `lib/haClient.ts` — shared HA proxy transport (only used through `fritzboxClient` here).
- `app/api/fritzbox/telephony/dect/route.ts`, `app/api/fritzbox/telephony/calls/route.ts`, `app/api/fritzbox/telephony/tam/route.ts` — reference route contracts (envelope shapes, error codes).
- `app/api/fritzbox/history/bandwidth/route.ts`, `app/api/fritzbox/history/devices/route.ts`, `app/api/fritzbox/history/device-events/route.ts` — raw history route contracts.
- `app/api/fritzbox/service-discovery/route.ts` — service discovery route contract.

### Hook & UI Patterns (implementation mirror)
- `app/network/hooks/useFritzWifiClients.ts` — canonical pattern for paused-aware Fritz!Box polling hooks (mirror for all new telephony/raw history hooks).
- `app/network/page.tsx` — reference orchestrator (tabs, paused hooks, lazy-loaded dynamic chart imports).
- `app/network/components/DeviceListTable.tsx`, `app/network/components/WifiClientsTable.tsx` — reference DataTable consumers with column definitions.
- `app/network/components/DeviceEventItem.tsx`, `app/network/components/DeviceHistoryTimeline.tsx` — reference for event-log rendering.
- `app/network/components/TimeRangeSelector.tsx` — reuse as-is for raw history scope selector.
- `app/network/components/CopyableIp.tsx` — reuse pattern for service-discovery URL copy.
- `app/lights/page.tsx`, `app/sonos/page.tsx` — reference device-page layouts for `/telefonia`.
- `app/debug/page.tsx` — reference tabbed debug page (where to wire the Service Discovery tab).
- `app/debug/components/tabs/NetworkTab.tsx` — canonical debug-tab component shape (imports, layout, manual refresh button).

### App-Wide Primitives
- `app/components/ui/DataTable.tsx`, `DataTableToolbar.tsx`, `DataTableRow.tsx` — primary table primitive.
- `app/components/ui/PageLayout.tsx`, `Heading.tsx`, `Card.tsx`, `Badge.tsx`, `Banner.tsx`, `EmptyState.tsx`, `ErrorAlert.tsx`, `HealthIndicator.tsx`, `Skeleton.tsx`, `Tabs.tsx` — required primitives.
- `app/components/layout/CommandPaletteProvider.tsx` — where to add `nav-telephony` entry.

### Tests
- `tests/smoke/page-loads.spec.ts` — Playwright smoke harness + `collectConsoleErrors` helper pattern.
- `app/network/hooks/__tests__/` — Jest hook test patterns.
- `app/network/components/__tests__/` — Jest component test patterns.

### Project Rules
- `CLAUDE.md` — Rule 1 (never break existing functionality), Rule 3 (prefer editing existing files), Rule 5 (always create/update unit tests), Rule 6 (use design system), Rule 8 (scoped test subsets — never `npm test` alone).

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `fritzboxClient` — all 7 endpoints already implemented (`getDectHandsets`, `getCallHistory`, `getTamStatus`, `getBandwidthHistoryRaw`, `getDevicePresenceHistory`, `getDeviceEventsRaw`, `getServiceDiscovery`). No client changes needed.
- `useAdaptivePolling`, `useVisibility` from `lib/hooks/` — foundation for every new polling hook.
- `DataTable` + `DataTableToolbar` primitives — zero custom table styling required.
- `TimeRangeSelector`, `CopyableIp`, `EmptyState`, `ErrorAlert`, `HealthIndicator`, `Banner`, `Skeleton`, `Badge`, `Card` — all needed primitives exist.
- `tests/smoke/page-loads.spec.ts` + `collectConsoleErrors` helper — smoke-test harness ready.

### Established Patterns
- Paused-aware hooks with `paused?: boolean` option pausing the polling interval (`interval: paused ? null : 60000`).
- Tab-scoped data loading: each hook in a tab receives `paused: activeTab !== 'my-tab'` so inactive tabs don't fetch.
- `PaginatedResponse<T>` envelope: `{ items, total_count, limit, offset }` — server-paginated consumers use Prev/Next buttons + `limit`/`offset` URLSearchParams.
- Orchestrator page → presentational components split (reference: `/network`, `/lights`, `/sonos`).
- Italian locale strings + Ember Noir theme tokens throughout device pages.
- `60s` default polling cadence for Fritz!Box hooks (visibility-aware, pauses when tab hidden).

### Integration Points
- Tab set at `app/network/page.tsx:84` — `type NetworkTab = 'dispositivi' | 'wifi' | 'servizi' | 'reti-wifi'` → extend with `| 'storico'`.
- Tab config at `app/debug/page.tsx` — add `{ key: 'service-discovery', label: 'Service Discovery', icon: Network }` and route the tab content to the new `FritzboxServiceDiscoveryTab` component.
- CommandPalette nav list at `app/components/layout/CommandPaletteProvider.tsx:86–128` — add a new entry after `nav-camera` or alongside device entries.
- New page directory: `app/telefonia/` (page.tsx + hooks/ + components/).
- New tab components added to `app/network/components/` for raw history sub-sections.

### Constraints & Pitfalls
- Phase 162 D-05 warned that `/api/v1/fritzbox/history/devices` (device presence) may not exist on the HA proxy. The UI must render a friendly empty/error state for this endpoint without crashing the tab. Do not assume data.
- `getServiceDiscovery` uses direct `fetch` (not `haGet`) because it can return XML. The route already handles this; UI just consumes the `{ services: [{name, type, url}] }` envelope.
- API routes enforce rate-limit (10 req/min/user) and 60s route-level caching via `getCachedData`. Hook polling at 60s cadence stays within budget; no client-side extra caching needed.
- Never create new files when an existing one fits (CLAUDE.md Rule 3). Prefer extending `/network/page.tsx` tab set over a new raw-history page.

</code_context>

<specifics>
## Specific Ideas

- Call-type visual language mirrors Netatmo/Sonos history patterns: small colored Badge (ember for missed, slate for outgoing, success for incoming).
- TAM new-message count uses the same large-number + pulsing-dot treatment as the maintenance-alert card on `/stove` when `new_messages > 0`.
- Service discovery is admin/ops-flavored — keep the tab visually minimal (single table, single refresh button, no charts).

</specifics>

<deferred>
## Deferred Ideas

- Call-back actions from call history (tap-to-call, add-to-contacts) — out of scope; UI is read-only per phase boundary.
- Delete/archive for TAM messages — not in FRITZ-01…FRITZ-07 scope.
- Service-discovery endpoint deep-dive (invoking TR-064 actions) — future debug-tools phase.
- Bandwidth-raw live chart — the existing aggregated `BandwidthChart` covers visual needs; raw tab is intentionally tabular.

### Reviewed Todos (not folded)
None.

</deferred>

---

*Phase: 171-fritzbox-consumer-ui*
*Context gathered: 2026-04-23*
