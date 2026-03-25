# Phase 136: Sonos Speaker Extended UI & History - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-25
**Phase:** 136-sonos-speaker-extended-ui-history
**Areas discussed:** EQ slider presentation, Home theater settings layout, Source switch interaction, Group management UX, History chart design
**Mode:** Auto (all areas auto-selected, recommended defaults applied)

---

## EQ Slider Presentation

| Option | Description | Selected |
|--------|-------------|----------|
| Expandable section per speaker | Bass/treble sliders + loudness toggle, expand from speaker row | ✓ |
| Always visible inline | EQ controls always shown per speaker (takes more space) | |
| Modal/drawer per speaker | Tap speaker to open detailed EQ settings | |

**User's choice:** [auto] Expandable section per speaker (recommended default — keeps zone section clean, matches SonosQueueViewer expand pattern)
**Notes:** Null EQ values hide the expand toggle entirely.

---

## Home Theater Settings Layout

| Option | Description | Selected |
|--------|-------------|----------|
| Toggle switches in sub-section for soundbar only | Role-gated, collapsible, with gain sliders | ✓ |
| Dedicated home theater tab/page | Separate UI area for HT settings | |
| Inline toggles next to speaker name | Compact but cluttered | |

**User's choice:** [auto] Toggle switches in sub-section for soundbar only (recommended default — role gating matches API behavior where non-soundbar returns 404)
**Notes:** Sub gain and surround volume sliders conditional on their enabled state.

---

## Source Switch Interaction

| Option | Description | Selected |
|--------|-------------|----------|
| Segmented button (TV / Line-in) | Compact, immediately visible, ember accent on active | ✓ |
| Dropdown select | Takes less space but requires extra click | |
| Icon toggle button | Single button that cycles sources | |

**User's choice:** [auto] Segmented button (recommended default — only 2 options, segmented is most direct)
**Notes:** Hidden for speakers without source capability. Graceful degradation on API error.

---

## Group Management UX

| Option | Description | Selected |
|--------|-------------|----------|
| Join dropdown + Unjoin button inline | Compact, per-speaker, dropdown for target selection | ✓ |
| Drag-and-drop between zones | Visual but complex to implement | |
| Dedicated grouping panel | Separate section for all group operations | |

**User's choice:** [auto] Join dropdown + Unjoin button inline (recommended default — matches per-speaker control pattern, minimal UI surface)
**Notes:** Coordinator cannot unjoin. Join shows available zones as dropdown options.

---

## History Chart Design

| Option | Description | Selected |
|--------|-------------|----------|
| Recharts line chart + event list | Volume as LineChart, playback as table/list, type selector + time range | ✓ |
| Combined chart with annotations | Single chart with volume line + playback event markers | |
| Separate page for history | /sonos/history dedicated page | |

**User's choice:** [auto] Recharts line chart + event list (recommended default — matches BandwidthChart pattern, keeps different data types in their natural format)
**Notes:** Auto-granularity server-side. Dynamic import for Recharts. Optional speaker/zone filter.

---

## Claude's Discretion

- Exact slider styling for EQ and home theater gain controls
- Icon choices (lucide-react) for all new controls
- SonosSpeakerVolume extension vs new wrapper component
- Chart colors, tooltips, responsive breakpoints
- Source capability detection strategy
- Playback history display format (table vs card list)

## Deferred Ideas

None — discussion stayed within phase scope
