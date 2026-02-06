# Phase 39: UI Components Migration - Context

**Gathered:** 2026-02-06
**Status:** Ready for planning

<domain>
## Phase Boundary

Convert all UI components (~114 files: 64 design system + ~50 application) from JSX to TSX with typed props. Components already exist and work — this phase adds TypeScript type safety without changing behavior.

</domain>

<decisions>
## Implementation Decisions

### Props strictness
- Pragmatic approach to `any` usage: minimize but allow where full typing would require overly complex generics. Focus on catching real bugs, not type gymnastics
- Children prop type: Claude's discretion per component based on actual usage (ReactNode vs ReactElement)
- Spread props / HTML attribute extension: Claude's discretion per component based on current implementation
- Event handler types: Claude's discretion — use specific React event types when handler uses event properties, simple callbacks when it just triggers an action

### Component patterns
- Namespace patterns (Tabs.List, Accordion.Item, Sheet.Content): Claude's discretion on typing approach while preserving current usage patterns
- forwardRef typing: Claude's discretion per component's needs
- Polymorphic components / `as` prop: Claude's discretion based on actual usage
- Generic type parameters on reusable components: Claude's discretion — add only where component already handles multiple data types

### Migration batching
- **Design system first**: Migrate all 64 ui/ components first (they're dependencies), then migrate ~50 app components
- Wave sizing: Claude's discretion based on component complexity and dependencies
- **Zero tsc errors per wave**: Each plan must leave tsc clean. No gap closure phase — different from Phase 38
- Progress tracking: Claude's discretion

### Interface conventions
- Props naming convention: Claude's discretion based on whether props need to be importable
- interface vs type: Claude's discretion (interface for extension, type for unions)
- Variant props: Claude's discretion based on existing codebase patterns
- Mixin types (WithChildren, WithDisabled, WithLoading from Phase 37): Claude's discretion — use where they fit naturally

### Claude's Discretion
Most typing decisions are delegated to Claude with the guiding principles:
- Be pragmatic, not dogmatic — minimize `any` but don't over-engineer
- Preserve existing component API and usage patterns
- Match patterns established in Phase 37/38 types
- Each plan must achieve zero tsc errors (no deferred gap closure)
- Design system components before application components

</decisions>

<specifics>
## Specific Ideas

- Phase 38 used git mv to preserve history — continue this pattern for .jsx → .tsx renames
- Phase 37 created mixin interfaces (WithChildren, WithDisabled, WithLoading) — available for composition
- Zero errors per wave is a hard requirement — different from Phase 38's gap closure approach
- Design system components are the foundation — migrate them first so app components can import typed versions

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 39-ui-components-migration*
*Context gathered: 2026-02-06*
