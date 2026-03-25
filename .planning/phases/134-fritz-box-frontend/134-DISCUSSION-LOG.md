# Phase 134: Fritz!Box Frontend - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-25
**Phase:** 134-fritz-box-frontend
**Mode:** Auto (all recommended defaults applied)
**Areas discussed:** Page layout, Data fetching, Network services presentation, History tier toggle

---

## Page Layout

| Option | Description | Selected |
|--------|-------------|----------|
| Tab-based sections | Group device list, WiFi clients, and services into tabs below WAN card | ✓ |
| Accordion sections | Stack all sections vertically with expand/collapse | |
| Separate sub-pages | Split into /network/wifi, /network/services sub-routes | |

**User's choice:** Tab-based sections (auto-selected recommended default)
**Notes:** System info as always-visible card at top. Tabs for device-related content. Charts remain outside tabs at bottom.

---

## Data Fetching

| Option | Description | Selected |
|--------|-------------|----------|
| New dedicated hooks per section | useFritzSystemInfo, useFritzWifiClients, useFritzNetworkServices, useFritzBandwidthTiers | ✓ |
| Extend useNetworkData | Add system/wifi/services to existing hook | |
| Single combined hook | One useNetworkFullData that fetches everything | |

**User's choice:** New dedicated hooks per section (auto-selected recommended default)
**Notes:** Matches existing pattern of hook-per-section. Each hook uses useAdaptivePolling(60s). Keeps existing hooks untouched.

---

## Network Services Presentation

| Option | Description | Selected |
|--------|-------------|----------|
| Collapsible sections | One Disclosure per service type with summary count in header | ✓ |
| DataTable tabs | Sub-tabs within the services section, one per service type | |
| Flat list | All services in one long scrollable table | |

**User's choice:** Collapsible sections (auto-selected recommended default)
**Notes:** DHCP and port forwarding use DataTable for sortable columns. UPnP and mesh use simpler table/list. Summary count in each header for quick scan.

---

## History Tier Toggle

| Option | Description | Selected |
|--------|-------------|----------|
| Button group in chart header | Toggle: Tempo reale / Orario / Giornaliero beside TimeRangeSelector | ✓ |
| Dropdown selector | Select tier from a dropdown menu | |
| Separate chart per tier | Three charts stacked vertically | |

**User's choice:** Button group in chart header (auto-selected recommended default)
**Notes:** Matches TimeRangeSelector pattern. Default remains real-time. Hourly/daily show min/max/avg series from Phase 133 endpoints.

---

## Claude's Discretion

- Exact Tailwind classes for signal strength bars
- DataTable column widths and mobile responsiveness
- Whether to lazy-load WiFi clients and network services tabs
- Skeleton shapes for new sections
- Italian translations for column headers

## Deferred Ideas

- Telephony endpoints (DECT, calls, TAM) — excluded from v16.0
- WiFi network management write operations
- Advanced mesh graph visualization
- Per-device bandwidth history charts
