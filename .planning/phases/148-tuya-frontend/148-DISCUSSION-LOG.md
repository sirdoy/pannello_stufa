# Phase 148: Tuya Frontend - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-30
**Phase:** 148-tuya-frontend
**Areas discussed:** Dashboard card content, Plug grid layout, Energy chart design, Timer controls UX
**Mode:** --auto (all decisions auto-selected using recommended defaults)

---

## Dashboard Card Content

| Option | Description | Selected |
|--------|-------------|----------|
| Summary card | Aggregate: plug count, active/inactive, total power, gauge, click-through | ✓ |
| Per-plug mini-cards | Individual plug status on dashboard | |
| Status-only | Simple on/off count, no power data | |

**User's choice:** [auto] Summary card with aggregate view
**Notes:** Matches RaspiCard/SonosCard pattern of compact summary with click-through to detail page

---

## Plug Grid Layout

| Option | Description | Selected |
|--------|-------------|----------|
| Card-per-plug grid | Responsive grid (1/2/3 cols), each card with toggle + metrics | ✓ |
| DataTable list | Tabular layout with inline toggles | |
| Accordion list | Expandable rows per plug | |

**User's choice:** [auto] Card-per-plug responsive grid
**Notes:** Consistent with existing device page patterns; cards provide enough space for toggle, power, timer

---

## Energy Chart Design

| Option | Description | Selected |
|--------|-------------|----------|
| Area chart + auto-granularity | Recharts AreaChart, 24h/7d/30d selector, avg_power_w primary | ✓ |
| Bar chart | Daily energy bars | |
| Line chart | Simple line without fill | |

**User's choice:** [auto] Area chart with auto-granularity period selector
**Notes:** Matches Fritz!Box bandwidth chart pattern; code-split via next/dynamic

---

## Timer Controls UX

| Option | Description | Selected |
|--------|-------------|----------|
| Inline on card | Minutes input + set button, active countdown as mm:ss + cancel | ✓ |
| Modal dialog | Dedicated timer modal with time picker | |
| Separate timer page | Timer management on its own sub-route | |

**User's choice:** [auto] Inline timer controls on plug card
**Notes:** Simple approach avoids modal overhead; countdown display provides immediate feedback

---

## Claude's Discretion

- Color theme for SmartHomeCard
- Skeleton component design
- Error/empty state Italian copy
- Power gauge implementation approach
- WS stale threshold values

## Deferred Ideas

None — discussion stayed within phase scope.
