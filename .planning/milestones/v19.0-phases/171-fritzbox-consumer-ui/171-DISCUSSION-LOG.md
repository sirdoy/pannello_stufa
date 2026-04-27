# Phase 171: Fritz!Box Consumer UI - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-23
**Phase:** 171-fritzbox-consumer-ui
**Mode:** `--auto --chain` (all gray areas auto-selected, recommended options auto-chosen)
**Areas discussed:** Telephony UI Location, Telephony Components, Raw History Surface, Service Discovery Surface, Hooks & Data Fetching, Testing, Nav Integration

---

## Telephony UI Location

| Option | Description | Selected |
|--------|-------------|----------|
| Dedicated page `/telefonia` | New top-level route, matches `/lights` / `/sonos` / `/dirigera` pattern | ✓ |
| New tab in `/network` | Keep Fritz!Box features consolidated on one page | |
| Section inside existing page | Fold into `/network` page-footer | |

**Selected:** Dedicated page `/telefonia`.
**Rationale:** Device-page convention across the app; telephony is a distinct domain from WiFi/network monitoring; reachable via CommandPalette nav.

---

## Telephony Components

| Option | Description | Selected |
|--------|-------------|----------|
| DataTable for DECT + Calls, Card for TAM | Reuse design system primitives, columns explicit | ✓ |
| Custom list components | Tailored visuals per section | |

**Selected:** DataTable (DECT, Calls) + single Card (TAM).
**Rationale:** Existing DataTable primitive already styled and tested; TAM is a summary status, not a list.

### Call history pagination

| Option | Description | Selected |
|--------|-------------|----------|
| Prev/Next with server-side `limit`/`offset` | Matches `PaginatedResponse<T>` envelope | ✓ |
| Infinite scroll | Lazy-load on scroll | |
| Load-all | No pagination | |

**Selected:** Prev/Next, 50 items/page.
**Rationale:** HA proxy returns paginated envelope; consistent with `/registry/devices` consumer; cheapest UX to implement.

---

## Raw History Surface

| Option | Description | Selected |
|--------|-------------|----------|
| New tab "Storico grezzo" in `/network` | Raw tables adjacent to aggregated charts | ✓ |
| New dedicated page | Separate `/network/raw` route | |
| Append to existing tabs | Mix raw rows into existing `dispositivi` tab | |

**Selected:** New tab in `/network`.
**Rationale:** Conceptual adjacency with aggregated charts; reuse of `TimeRangeSelector`; avoids new route + nav entry.

### Device-presence endpoint uncertainty

Phase 162 D-05 flagged that `/api/v1/fritzbox/history/devices` may not exist on the HA proxy. UI must render a friendly empty/error state without crashing the tab. Confirmed as D-08 in CONTEXT.md.

---

## Service Discovery Surface

| Option | Description | Selected |
|--------|-------------|----------|
| New tab inside existing `/debug` page | Matches existing debug tab pattern | ✓ |
| Standalone `/debug/service-discovery` route | Sub-route under debug | |
| Admin-only page outside debug | New top-level admin route | |

**Selected:** New tab in `/debug`.
**Rationale:** Existing /debug page already uses tabbed pattern (Stufa / Netatmo / Hue / Weather / Firebase / Scheduler / Network); admin gate inherited; no new route scaffolding.

---

## Hooks & Data Fetching

| Option | Description | Selected |
|--------|-------------|----------|
| `useAdaptivePolling` + `useVisibility` + `paused` option | Matches every existing Fritz!Box hook | ✓ |
| SWR / React Query | New dependency, inconsistent with codebase | |
| Manual fetch on mount only | No background refresh | |

**Selected:** Adaptive polling pattern, 60s default.
**Rationale:** Uniform with existing Fritz hooks; visibility-aware; tab-scoped `paused` already established.

### Service discovery polling

| Option | Description | Selected |
|--------|-------------|----------|
| No polling — fetch once + manual refresh | Descriptor is effectively static | ✓ |
| 5-minute polling | Background refresh | |

**Selected:** No polling + manual refresh button.
**Rationale:** TR-064 descriptor rarely changes; avoid unnecessary rate-limit consumption.

---

## Testing

| Option | Description | Selected |
|--------|-------------|----------|
| Jest unit + Playwright smoke | Phase success criteria #4 | ✓ |

**Selected:** Both, per success criteria.
**Scope:** Each hook (success/error/paused/stale), each component (render/empty/error), CommandPalette entry, Playwright smoke on `/telefonia`, `/network` storico tab, `/debug` service-discovery tab.

### Test runner selection

Per CLAUDE.md rule 8: scoped subsets only during verification (`test:changed`, `test:pages`, `test:components`). Full suite reserved for release gates.

---

## Nav Integration

| Option | Description | Selected |
|--------|-------------|----------|
| CommandPalette entry for `/telefonia` only | Raw history and service discovery reached via existing surfaces | ✓ |
| CommandPalette entries for all three | Explicit nav for each new surface | |

**Selected:** Only `nav-telephony`.
**Rationale:** Raw history lives inside existing `/network`; service discovery lives inside existing `/debug`. Adding CommandPalette entries for tabs-within-pages would clutter nav.

---

## Claude's Discretion

- Exact icon choices from `lucide-react` (candidates listed in CONTEXT.md D-19).
- Whether to extract a shared paginated-table helper or keep each table independent (default: independent, per codebase preference against premature abstraction).
- Component file structure for `/telefonia` (single page vs orchestrator + `components/` dir).
- Hook colocation for service discovery (inline in tab vs dedicated `useFritzServiceDiscovery` hook file).

---

## Deferred Ideas

- Call-back actions from call history (tap-to-call).
- TAM message delete/archive.
- TR-064 action invocation from service-discovery view.
- Bandwidth-raw live chart.

No pending todos matched this phase.
