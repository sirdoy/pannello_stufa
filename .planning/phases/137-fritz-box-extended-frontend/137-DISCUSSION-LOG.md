# Phase 137: Fritz!Box Extended Frontend - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-26
**Phase:** 137-fritz-box-extended-frontend
**Areas discussed:** WiFi networks placement, Device count chart, Budget stats card, Auto-granularity integration
**Mode:** --auto (all decisions auto-selected)

---

## WiFi Networks Placement

| Option | Description | Selected |
|--------|-------------|----------|
| New tab "Reti WiFi" | Add 4th tab to existing tab bar | ✓ |
| Sub-tab under WiFi Clients | Nest under existing WiFi tab | |
| Separate section (no tab) | Always-visible section below tabs | |

**User's choice:** [auto] New tab "Reti WiFi" — consistent with existing tab navigation pattern
**Notes:** WiFiNetworkModel fields (SSID, band, channel, is_enabled) map directly to table columns. Paused polling when tab not active.

---

## Device Count Chart

| Option | Description | Selected |
|--------|-------------|----------|
| AreaChart (stacked) | Differentiates from bandwidth LineChart, shows volume | ✓ |
| LineChart | Same pattern as bandwidth chart | |
| BarChart | Daily bars for device counts | |

**User's choice:** [auto] AreaChart — visually distinct from existing bandwidth LineChart
**Notes:** Placed below tab content, above bandwidth chart. Default 30 days. Code-split via next/dynamic.

---

## Budget Stats Card

| Option | Description | Selected |
|--------|-------------|----------|
| System-level card above tabs | Progress bar + status badge, alongside SystemInfo/WAN | ✓ |
| Inside a tab | Budget as its own tab or within Servizi | |
| Inline in bandwidth section | Budget info within bandwidth chart area | |

**User's choice:** [auto] System-level card above tabs — budget is system-level info like WAN
**Notes:** Single fetch on mount (not polling). Progress bar for utilization_percent, color-coded status badge.

---

## Auto-Granularity Integration

| Option | Description | Selected |
|--------|-------------|----------|
| 4th option in HistoryTierToggle | "Auto" alongside Tempo reale / Orario / Giornaliero | ✓ |
| Replace tier toggle entirely | Auto-only, remove manual selection | |
| Separate toggle/switch | Auto mode as separate control | |

**User's choice:** [auto] 4th option in HistoryTierToggle — minimal change, extends existing pattern
**Notes:** Server-side granularity detection via /api/fritzbox/history/bandwidth/auto. Subtle indicator shows chosen granularity.

---

## Claude's Discretion

- Loading/empty states for new components
- Exact color choices for AreaChart and budget status badges
- Device count hour_bucket aggregation strategy

## Deferred Ideas

None — discussion stayed within phase scope.
