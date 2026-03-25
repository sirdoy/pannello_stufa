# Phase 135: Sonos Zone Extended UI - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-25
**Phase:** 135-sonos-zone-extended-ui
**Areas discussed:** Play mode toggles, Sleep timer interaction, Queue viewer layout, Zone section placement
**Mode:** Auto (all recommended defaults applied)

---

## Play Mode Toggles

| Option | Description | Selected |
|--------|-------------|----------|
| Icon toggle buttons | Three separate toggle buttons (shuffle, repeat, crossfade) matching transport controls style | ✓ |
| Dropdown/select | Single dropdown with all play mode combinations | |
| Segmented control | Grouped toggle control with labels | |

**User's choice:** [auto] Icon toggle buttons (recommended default)
**Notes:** Matches existing SonosTransportControls icon button aesthetic. Compact, familiar music app pattern. Each button toggles independently, frontend composes the SonosPlayMode enum value.

---

## Sleep Timer Interaction

| Option | Description | Selected |
|--------|-------------|----------|
| Preset duration buttons | Row of common durations (15/30/45/60/90 min) + countdown display | ✓ |
| Custom input field | Number input for arbitrary minutes | |
| Slider | Range slider for duration selection | |

**User's choice:** [auto] Preset duration buttons (recommended default)
**Notes:** Simpler UX, matches Sonos app common durations. Active timer shows countdown, cancel button appears. No need for custom input — presets cover common use cases.

---

## Queue Viewer Layout

| Option | Description | Selected |
|--------|-------------|----------|
| Expandable inline list | Collapsible track list within zone section, load-more pagination | ✓ |
| Modal/drawer | Full-screen or slide-in panel showing queue | |
| Always visible | Queue always shown below zone controls | |

**User's choice:** [auto] Expandable inline list (recommended default)
**Notes:** Stays within existing zone section layout. On-demand fetch saves API calls. Load-more with limit=20 matches existing pagination patterns. Keeps zone section clean when queue is collapsed.

---

## Zone Section Placement

| Option | Description | Selected |
|--------|-------------|----------|
| Below transport, above volume | Now Playing → Transport → Play Mode + Sleep Timer → Queue → Volume | ✓ |
| Below volume | All new controls after speaker volume sliders | |
| Separate tabs | Tab-based navigation within each zone section | |

**User's choice:** [auto] Below transport, above volume (recommended default)
**Notes:** Logical flow from playback controls to playback modifiers to queue to hardware controls. Play mode and sleep timer share a row (responsive stacking on mobile).

---

## Claude's Discretion

- Icon choices for shuffle/repeat/crossfade from lucide-react
- Sleep timer countdown format
- Queue item row layout details
- Play mode toggle state derivation from composite enum
- Spacing and responsive breakpoints

## Deferred Ideas

None — all discussion stayed within phase scope
