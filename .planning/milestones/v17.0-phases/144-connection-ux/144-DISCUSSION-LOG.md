# Phase 144: Connection UX - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-28
**Phase:** 144-connection-ux
**Areas discussed:** Status indicator placement, Transition smoothness, Last-updated display
**Mode:** --auto (all decisions auto-selected)

---

## Status Indicator Placement

| Option | Description | Selected |
|--------|-------------|----------|
| Dashboard header/nav bar | Global indicator, single location, uses existing ConnectionStatus component | ✓ |
| Per-card indicator | Each card shows its own WS/polling state independently | |
| Floating badge | Floating overlay badge in corner of screen | |

**User's choice:** [auto] Dashboard header/nav bar — global indicator (recommended default)
**Notes:** ConnectionStatus component already exists with online/connecting/offline variants. A single shared WS connection means a single global indicator is the correct representation.

---

| Option | Description | Selected |
|--------|-------------|----------|
| Three states (connected/reconnecting/fallback) | Maps to ReadyState: OPEN, CONNECTING, CLOSED/CLOSING | ✓ |
| Two states (connected/disconnected) | Simpler but loses the reconnecting nuance | |

**User's choice:** [auto] Three states (recommended default)
**Notes:** Matches UX-01 requirement exactly. ReadyState enum provides the granularity.

---

| Option | Description | Selected |
|--------|-------------|----------|
| Display only | No click handler, automatic reconnection | ✓ |
| Interactive with manual reconnect | Click to force reconnect attempt | |

**User's choice:** [auto] Display only (recommended default)
**Notes:** WS manager handles reconnection via exponential backoff — no user intervention needed.

---

## Transition Smoothness

| Option | Description | Selected |
|--------|-------------|----------|
| Keep last known data, update on new arrival | State persists during transition, no visual gap | ✓ |
| Show loading skeleton during transition | Brief skeleton while waiting for new source | |

**User's choice:** [auto] Keep last known data (recommended default)
**Notes:** This is already the inherent behavior of hooks from Phases 140-143. Phase 144 verifies and tests it.

---

| Option | Description | Selected |
|--------|-------------|----------|
| No visible change in cards | Data stream appears continuous | ✓ |
| Subtle transition indicator | Brief border flash or subtle animation on source switch | |

**User's choice:** [auto] No visible change (recommended default)
**Notes:** Per UX-02, transitions must be invisible to the user.

---

## Last-Updated Display

| Option | Description | Selected |
|--------|-------------|----------|
| Card footer | Small text below card content, consistent placement | ✓ |
| Card header | Next to card title, more prominent | |
| Tooltip on hover | Hidden until hover, no space used | |

**User's choice:** [auto] Card footer (recommended default)
**Notes:** Non-intrusive, visible without interaction, consistent across all cards.

---

| Option | Description | Selected |
|--------|-------------|----------|
| Relative time ("5s fa", "2m fa") | Intuitive for real-time monitoring | ✓ |
| Absolute time ("14:32:05") | Precise but requires mental math | |
| Both (relative + absolute on hover) | Most informative but more complex | |

**User's choice:** [auto] Relative time (recommended default)
**Notes:** More natural for a real-time monitoring dashboard. Italian locale suffixes.

---

| Option | Description | Selected |
|--------|-------------|----------|
| WS `ts` field / Date.now() at fetch | WS uses server timestamp, polling uses client time | ✓ |
| Always client-side Date.now() | Simpler but loses server timestamp accuracy | |

**User's choice:** [auto] WS `ts` field / Date.now() at fetch (recommended default)
**Notes:** Per UX-03 requirement — uses the most accurate source available per transport.

---

## Claude's Discretion

- useConnectionStatus wrapper hook vs inline mapping
- useRelativeTime implementation approach
- Timestamp injection into card orchestrators
- Shared timestamp component vs inline per-card
- Test strategy for flicker-free verification

## Deferred Ideas

None — discussion stayed within phase scope
