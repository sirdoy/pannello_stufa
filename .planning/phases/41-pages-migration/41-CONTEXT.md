# Phase 41: Pages Migration - Context

**Gathered:** 2026-02-07
**Status:** Ready for planning

<domain>
## Phase Boundary

Convert all pages, layouts, providers, and co-located components in app/ from JS/JSX to TypeScript. ~67 files total: 37 pages, 3 root files (layout, template, not-found), 3 context providers, and 27 co-located components. Pure migration — zero behavior changes.

</domain>

<decisions>
## Implementation Decisions

### Context provider typing
- Claude's discretion on createContext default value strategy (null + type guard vs defined defaults) — pick best approach per context's usage pattern
- Context value interfaces: Claude decides inline vs shared location based on complexity/reuse
- Consumer hook return types: Claude decides explicit vs inferred based on Phase 38-39 patterns
- Pure migration — no behavior changes to provider logic

### Co-located component scope
- All 27 co-located components migrated in Phase 41 (not deferred to gap closure)
- Includes: debug tabs (7), design-system doc components (4+1 data file), thermostat schedule components (7), camera components (2), notification components (1), settings components (1)
- Test mocks (app/components/ui/__mocks__/Text.js) and test files (thermostat/page.test.js) deferred to Phase 42
- Thermostat schedule components (WeeklyTimeline, TemperaturePicker, etc.) natural to include here since they're co-located with pages

### Page props & metadata typing
- Claude decides shared PageProps type vs inline props per page based on actual param/searchParam usage
- Metadata typing: Claude assesses which pages have metadata exports and types them appropriately
- Layout props: Claude picks based on what root layout actually receives
- SearchParams typing: Claude decides specific keys vs generic Record per page based on actual usage

### Pragmatic typing threshold
- Claude calibrates strictness per file — pages are simpler than API routes so aim for less any usage where possible
- Debug pages get SAME typing rigor as production pages — all pages equal
- Gap closure approach: Claude determines whether to use separate gap closure plan (Phase 40-07 pattern) or inline fixes based on error volume
- Event handler callback types: Claude picks domain-specific callbacks vs React event types based on what each component actually passes

### Claude's Discretion
- Context provider default value strategy per context
- Context value interface location (inline vs shared)
- Hook return type annotation style
- PageProps shared type vs inline
- Metadata import and typing approach
- SearchParams specificity per page
- Gap closure strategy (separate plan vs inline)
- Event handler typing approach per component
- Design-system component-docs.js typing depth

</decisions>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches. User trusts established patterns from Phases 38-40.

One explicit decision: debug pages must receive the same typing rigor as production pages.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

**Phase 42 items (already documented):**
- Test mock migration (app/components/ui/__mocks__/Text.js)
- Test file migration (app/thermostat/page.test.js)
- API route test import path updates (route.js → route.ts)

</deferred>

---

*Phase: 41-pages-migration*
*Context gathered: 2026-02-07*
