# Phase 31: Expandable Components - Context

**Gathered:** 2026-02-04
**Status:** Ready for planning

<domain>
## Phase Boundary

Add Accordion and Sheet components for expandable content and mobile-friendly panels. Accordion collapses/expands content sections. Sheet slides in from screen edge as an overlay panel. Both integrate with Ember Noir design system and follow established Radix UI patterns.

</domain>

<decisions>
## Implementation Decisions

### Accordion behavior
- Configurable open mode via prop: `type="single"` (one open) or `type="multiple"` (many open)
- No nested accordions — keep it simple, one level only
- Keyboard: Enter/Space to toggle, arrow keys to navigate between items

### Sheet positioning
- Configurable slide direction via prop: `side="bottom" | "right" | "left" | "top"`
- Sizing supports both fixed presets (sm, md, lg) AND auto/content-based
- All four directions available for flexibility across use cases

### Content patterns
- Accordion used primarily for: FAQ and help text sections
- Sheet used for: Forms (settings, schedule editing) AND detail views (device info, notifications)
- Both can contain any content — compound component pattern

### Claude's Discretion
- Animation style for accordion expand/collapse (slide+fade vs slide only)
- Accordion indicator style (rotating chevron vs plus/minus)
- Sheet backdrop behavior (dark overlay, click-to-close)
- Sheet close button visibility (accessibility best practices)
- Mobile swipe-to-close gesture on bottom Sheet
- iOS safe area handling (padding for home indicator)
- Snap points / detents for bottom Sheet (50%, 75%, 100%)
- Touch target sizing for accordion headers (48px min)
- Sheet header pattern (title + close consistency)
- Loading states for async content (skeleton vs load-before-open)

</decisions>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches following Radix UI + CVA patterns established in Phase 30.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 31-expandable-components*
*Context gathered: 2026-02-04*
