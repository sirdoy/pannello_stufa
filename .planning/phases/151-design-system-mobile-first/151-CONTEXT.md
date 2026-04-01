# Phase 151: Design System Mobile-First - Context

**Gathered:** 2026-04-01
**Status:** Ready for planning

<domain>
## Phase Boundary

Every design system component renders correctly on a 375px viewport — no horizontal overflow, no clipped content, and ButtonGroup wraps gracefully when buttons exceed a single row. The design system showcase page documents mobile-first patterns. This phase does NOT touch app pages (those are Phase 152+).

</domain>

<decisions>
## Implementation Decisions

### ButtonGroup Wrapping (MOBILE-01)
- **D-01:** Add `flex-wrap` to ButtonGroup's flex container (`Button.tsx:353`), keeping the existing `gap-2` spacing — buttons wrap to the next line naturally when they exceed container width at 375px
- **D-02:** No equal-sizing or vertical stacking needed — flex-wrap with gap is sufficient for the ButtonGroup use cases in this codebase

### DS Component Audit (MOBILE-02)
- **D-03:** Prioritize layout-affecting components for explicit 375px verification: ButtonGroup, Grid, DataTable, DashboardLayout, Card, Container, FormModal, BottomSheet, Navbar (bottom bar)
- **D-04:** Inline components (Badge, Button, Checkbox, Divider, Heading, Text, etc.) are inherently responsive — verify they don't have hardcoded widths but no major changes expected
- **D-05:** Total ~66 UI components; focus effort on the ~10-12 that have layout responsibility

### Typography Scaling (MOBILE-03)
- **D-06:** Use smaller fixed sizes at base breakpoint, existing `sm:` sizes for desktop — consistent with the codebase's existing `sm:` convention (e.g., Button already uses `sm: 'px-4 py-2.5 min-h-[44px] text-sm'`)
- **D-07:** No fluid typography (clamp/vw units) — the app targets 375px+ mobile and desktop, not a continuous range; fixed sizes are simpler and predictable

### DS Documentation (MOBILE-04, MOBILE-05)
- **D-08:** Add a dedicated "Mobile-First Patterns" section to `/debug/design-system/page.tsx` documenting the convention: base = mobile (375px+), `sm:` = desktop breakpoint
- **D-09:** Include before/after code examples showing the pattern (e.g., `text-sm sm:text-base`, `p-3 sm:p-4`)
- **D-10:** Document spacing tokens as mobile-first: base padding/margin values target mobile, `sm:` variants for desktop

### Bottom Nav Bar (MOBILE-06)
- **D-11:** The bottom nav at `Navbar.tsx:678` dynamically uses `grid-cols-3` or `grid-cols-4` based on quick actions count — verify both configurations fit at 375px without clipping or overlap
- **D-12:** If 4-column grid clips at 375px, switch to icon-only labels or reduce padding — keep all 4 actions visible

### Claude's Discretion
- Exact ordering of component audit (which components first)
- Whether to add responsive variants to CVA definitions or handle via className overrides
- Whether DataTable needs a horizontal scroll wrapper or column hiding at 375px
- Test file updates for any changed component APIs

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Design System
- `app/components/ui/Button.tsx` — ButtonGroup component (line 350), needs flex-wrap addition
- `app/components/Navbar.tsx` — Bottom nav bar with dynamic grid-cols (line 678)
- `app/debug/design-system/page.tsx` — Design system showcase page, needs mobile-first patterns section
- `docs/design-system.md` — Design system documentation

### Codebase Maps
- `.planning/codebase/CONVENTIONS.md` — Coding conventions and patterns
- `.planning/codebase/STRUCTURE.md` — File organization

### Requirements
- `.planning/REQUIREMENTS.md` — MOBILE-01 through MOBILE-06

### Prior Phase Context
- `.planning/phases/150-theme-prefix-cleanup/150-CONTEXT.md` — Phase 150 decisions, confirms dark-only cleanup complete

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `ButtonGroup` (`Button.tsx:350`): Currently `flex items-center gap-2` — just needs `flex-wrap` added
- `Grid` component: Already has responsive variants, likely mobile-safe
- `Card` component: Uses standard padding, likely responsive by default
- `Container` component: Provides max-width constraints, needs 375px check
- `BottomSheet` component: Mobile-native pattern, should be fine

### Established Patterns
- `sm:` breakpoint convention already partially in use (Button sizes, typography)
- CVA (class-variance-authority) for type-safe component variants — responsive variants can be added here
- Tailwind responsive prefixes: base = smallest, `sm:` = 640px+, `md:` = 768px+

### Integration Points
- Design system page (`/debug/design-system`) is the showcase — all changes should be visible there
- Bottom nav in Navbar.tsx serves as the primary mobile navigation — critical path for 375px
- All UI components are consumed by device pages (Phase 152+ will audit those)

</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches. The phase is mechanical: add flex-wrap, verify components at 375px, document the mobile-first convention.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 151-design-system-mobile-first*
*Context gathered: 2026-04-01*
