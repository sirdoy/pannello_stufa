# Phase 35: Micro-interactions - Context

**Gathered:** 2026-02-05
**Status:** Ready for planning

<domain>
## Phase Boundary

Implement polished CSS animation system with reduced motion support. This includes consistent timing tokens, stagger effects for lists/grids, subtle spring physics for interactive elements, and full prefers-reduced-motion compliance. The system applies to existing components built in Phases 30-34.

</domain>

<decisions>
## Implementation Decisions

### Animation Timing
- Smooth feel overall: 250-350ms duration range
- Three distinct ease curves: enter (ease-out), exit (ease-in), movement (ease-in-out)
- Consistent tokens accessible throughout the codebase

### Stagger Effects
- Stagger all items in lists/grids (no cap)
- Each item entrance should be a cohesive cascade

### Spring Physics
- Subtle bounce/overshoot: 5-10% overshoot
- Spring adds natural feel without being distracting

### Reduced Motion
- Disable all animations when prefers-reduced-motion is enabled (instant state changes)
- Exception: Loading spinners/skeletons remain animated (functional, not decorative)
- Respect OS preference only — no in-app toggle needed

### Claude's Discretion
- Where to store timing tokens (CSS custom properties vs Tailwind config)
- Hover/focus transition speed (match smooth duration or faster for responsiveness)
- Stagger direction per component context (top-to-bottom vs center-out)
- Stagger delay timing (balance perception with total animation time)
- Which components get stagger effects (apply where it enhances UX)
- Which interactions get spring physics (apply where it adds polish)
- Spring implementation approach (CSS cubic-bezier vs JS library)
- Whether press/active states should have scale-down effect
- Reduced motion CSS implementation approach (media query vs CSS variable toggle)

</decisions>

<specifics>
## Specific Ideas

- Animation system should feel "considered" — smooth, polished, not rushed
- Loading indicators are functional feedback, keep them animated even with reduced motion
- Spring physics should be barely perceptible, not bouncy/playful

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 35-micro-interactions*
*Context gathered: 2026-02-05*
