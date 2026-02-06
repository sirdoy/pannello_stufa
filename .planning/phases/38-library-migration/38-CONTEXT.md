# Phase 38: Library Migration - Context

**Gathered:** 2026-02-06
**Status:** Ready for planning

<domain>
## Phase Boundary

Convert all lib/ files (services, hooks, utilities, repositories, core modules) from JavaScript to TypeScript with proper typing. This phase covers ~147 JS files in lib/ plus ~12 hooks in app/hooks/. Test files in lib/ are included or deferred per Claude's judgment based on Phase 42 scope. No new functionality is added — behavior must remain identical.

</domain>

<decisions>
## Implementation Decisions

### Type Strictness Level
- Claude's discretion on `any` usage — pragmatic approach based on file complexity (likely: prefer `unknown` + type guards for new code, allow `any` with TODO comments for complex third-party interactions)
- Claude's discretion on return type annotations — based on function visibility and complexity (likely: explicit on exports, inferred for internal helpers)
- Claude's discretion on strict mode — based on current tsconfig state (likely: work within existing strictness, don't loosen)
- Claude's discretion on central vs local types — shared types to @/types, file-specific stay local

### Migration Order & Batching
- Claude's discretion on order — analyze dependency graph and pick most efficient approach (likely: leaf utilities first, then services)
- Claude's discretion on batch size — based on file complexity and interdependencies
- Claude's discretion on test migration timing — based on roadmap Phase 42 boundary
- Claude's discretion on verification cadence — based on practical batch size

### External Dependency Typing
- Claude's discretion on Firebase typing — use Phase 37 types where they fit, extend as needed
- Claude's discretion on Netatmo API typing — based on how data is currently consumed
- Claude's discretion on Hue/OpenMeteo/other APIs — consistent strategy adjusted per service complexity
- Claude's discretion on where new types live — shared types extend @/types, service-specific stay in lib/

### Hook Return Types & Generics
- Claude's discretion on loading/error/success patterns — match current hook structure (likely: simple nullable if that's the existing pattern)
- Claude's discretion on generic vs specific hooks — based on actual commonality between hooks
- Claude's discretion on command typing — based on existing command patterns (likely: string literal unions per Phase 37 conventions)
- Claude's discretion on export types — based on hook complexity and breadth of consumption

### Claude's Discretion
All four areas were delegated to Claude's judgment. The guiding principles are:
1. **Pragmatic over dogmatic** — pick what fits the existing codebase patterns
2. **Consistency with Phase 37** — follow conventions established in TypeScript Foundation (barrel exports, union types, mixin interfaces)
3. **No behavior changes** — this is a type migration, not a refactor
4. **Extend @/types when reuse potential exists** — don't duplicate type definitions

</decisions>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches. User trusts Claude to make pragmatic decisions that fit the existing codebase patterns established in Phase 37.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 38-library-migration*
*Context gathered: 2026-02-06*
