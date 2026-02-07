# Phase 40: API Routes Migration - Context

**Gathered:** 2026-02-07
**Status:** Ready for planning

<domain>
## Phase Boundary

Convert all 93 JavaScript API route files in `app/api/` to TypeScript with typed request/response. Pure migration — no new functionality, no behavior changes. Test files inside `app/api/` are deferred to Phase 42.

</domain>

<decisions>
## Implementation Decisions

### Response Typing Depth
- Claude's discretion on typing strictness per endpoint — full interfaces for complex endpoints, pragmatic Record<string, unknown> for simple ones
- Claude decides whether to create shared type files per domain or keep types inline, based on type reuse potential
- For external API responses (Thermorossi, Netatmo, Hue), Claude decides per endpoint whether to type external shape or just our wrapper
- Route handler signatures: Claude picks appropriate level (NextRequest with typed params vs basic Request) based on whether route uses params/searchParams

### Test File Handling
- **Test files deferred to Phase 42** — 3 test files in app/api/ (`hue/discover`, `netatmo/setroomthermpoint`, `netatmo/setthermmode`) stay as .js
- Test import path updates: Claude decides based on whether auto-resolution works

### Error Response Consistency
- Claude decides whether to standardize error response shape or type as-is, based on current consistency
- Catch block typing: Claude picks best pattern (instanceof guard vs pragmatic unknown) based on existing code style
- HTTP status codes: Claude decides literal numbers vs named constants based on usage patterns
- Success response shapes: Claude decides per route whether light normalization is worth the effort — this is migration, not refactor

### Wave Grouping Strategy
- Claude decides grouping approach (by domain, complexity, or hybrid) for optimal parallel execution
- Claude sizes plans based on route complexity and domain boundaries
- **Gap closure plan reserved** — plan for at least one gap closure wave after migration, based on Phase 38/39 experience
- Execution: mode=yolo, parallelization=true, balanced profile (sonnet executor/verifier) — same proven approach as Phase 39

### Claude's Discretion
- Typing depth per endpoint (full interfaces vs pragmatic)
- Type file organization (shared vs inline)
- External API response typing level
- Error handling patterns
- Response shape normalization decisions
- Plan sizing and grouping

</decisions>

<specifics>
## Specific Ideas

- 93 JS route files across domains: stove (14), netatmo (16), hue (15), notifications (15), health/monitoring (5), scheduler/schedules (5), config/user/misc (23)
- Same git mv pattern as Phase 38/39 to preserve git history
- Same execution model that worked for Phase 39 (11 plans, parallel agents, yolo mode)
- API routes are generally simpler than UI components — mostly request parsing + service calls + response formatting

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 40-api-routes-migration*
*Context gathered: 2026-02-07*
