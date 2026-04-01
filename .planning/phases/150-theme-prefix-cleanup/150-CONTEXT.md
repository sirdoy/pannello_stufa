# Phase 150: Theme Prefix Cleanup - Context

**Gathered:** 2026-04-01
**Status:** Ready for planning

<domain>
## Phase Boundary

Remove all `dark:` Tailwind prefixes and all `html:not(.dark)` selectors from the entire codebase. After this phase, every color/opacity value that previously required a `dark:` variant is the sole hardcoded value — zero conditional theme styles remain. Update the design system showcase page to reflect dark-only.

</domain>

<decisions>
## Implementation Decisions

### dark: Prefix Removal
- **D-01:** Strip the `dark:` prefix from every Tailwind class, keeping the utility value (e.g., `dark:bg-slate-800` becomes `bg-slate-800`). The dark value IS the only value now.
- **D-02:** 19 files affected with ~110 total `dark:` occurrences — mechanical find-and-replace per file.

### html:not(.dark) Selector Removal
- **D-03:** Delete entire `html:not(.dark)` rule blocks — these are light-mode overrides with no purpose in a dark-only app (carried forward from Phase 149 decision).
- **D-04:** 159 files affected — the majority are component files using `[html:not(.dark)_&]:` Tailwind arbitrary selector syntax in className strings.

### Batching Strategy
- **D-05:** Split work across plans by file category for coherent review:
  - Plan 1: UI components (`app/components/ui/`) — highest concentration of `html:not(.dark)` selectors
  - Plan 2: Device components (`app/components/devices/`) — all device card families
  - Plan 3: Pages and routes (`app/`, page-level files) — includes stove, network, lights, debug pages
  - Plan 4: Remaining files — scheduler components, lib/, debug panels, settings, misc
  - Plan 5: Design system page cleanup (THEME-10) + final verification grep
- **D-06:** Each plan should end with a verification grep confirming zero remaining occurrences in its file scope.

### Design System Page (THEME-10)
- **D-07:** Remove any theme toggle UI or light-mode example sections from `/debug/design-system/page.tsx`.
- **D-08:** Keep all dark-only component demos — just remove light-mode variants and toggle functionality.

### Claude's Discretion
- Exact plan count and file grouping within categories (5 plans is a suggestion, may be 3-6 based on file counts)
- Order of plans within the phase
- Whether to combine small categories into fewer plans for efficiency
- How to handle edge cases where `dark:` appears in comments or string literals (likely just remove if theme-related)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements
- `.planning/REQUIREMENTS.md` — THEME-06 (remove dark: prefixes), THEME-07 (remove html:not(.dark) selectors), THEME-10 (design system page update)

### Prior Phase Context
- `.planning/phases/149-theme-removal-core/149-CONTEXT.md` — Phase 149 decisions on theme deletion strategy, confirms html:not(.dark) blocks should be deleted entirely

### Codebase Maps
- `.planning/codebase/CONVENTIONS.md` — Coding conventions and patterns
- `.planning/codebase/STRUCTURE.md` — File organization

</canonical_refs>

<code_context>
## Existing Code Insights

### Scope Summary
- **dark: prefixes:** 19 files, ~110 occurrences. Heaviest files: StatusBadge.tsx (18), WeeklySummaryCard.tsx (16), OfflineBanner.tsx (14), design-system/page.tsx (13), offline/page.tsx (12), version.ts (11)
- **html:not(.dark) selectors:** 159 files, widespread. Heaviest files: stoveStatusUtils.ts (62), Skeleton.tsx (36), PidAutomationPanel.tsx (36), stovePageTheme.ts (29), Banner.tsx (29), Navbar.tsx (25), ThermostatCard.tsx (25), Button.tsx (21)

### Pattern to Remove: dark: prefix
```tsx
// Before
className="bg-white dark:bg-slate-800 text-black dark:text-white"
// After
className="bg-slate-800 text-white"
```
The light-mode value (bg-white, text-black) is also removed — only the dark value remains.

### Pattern to Remove: html:not(.dark) selector
```tsx
// Before
className="[html:not(.dark)_&]:bg-white [html:not(.dark)_&]:text-black bg-slate-800 text-white"
// After
className="bg-slate-800 text-white"
```
The entire `[html:not(.dark)_&]:` prefixed class is removed.

### Integration Points
- `app/debug/design-system/page.tsx` — has both dark: prefixes (13) AND needs theme toggle removal (THEME-10)
- `app/layout.tsx` — has 1 dark: prefix remaining from Phase 149
- `lib/version.ts` — has 11 dark: prefixes in version display UI

</code_context>

<specifics>
## Specific Ideas

No specific requirements — this is a mechanical cleanup phase. The transformation rules are:
1. `dark:X` → `X` (keep dark value)
2. `[html:not(.dark)_&]:X` → remove entirely (delete light-mode override)
3. When both exist on same element, the result is just the dark values
4. Design system page additionally needs theme toggle UI removed

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 150-theme-prefix-cleanup*
*Context gathered: 2026-04-01*
