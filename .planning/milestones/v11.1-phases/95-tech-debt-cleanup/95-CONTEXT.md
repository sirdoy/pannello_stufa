# Phase 95: Tech Debt Cleanup - Context

**Gathered:** 2026-03-18
**Status:** Ready for planning

<domain>
## Phase Boundary

Remove manual memoization (useMemo/useCallback) that React Compiler already handles, and delete stale environment variables left over from the pre-v11.0 Netatmo/HomeAssistant migration. The codebase should reflect current architecture with no dead configuration.

</domain>

<decisions>
## Implementation Decisions

### Memoization removal scope
- Remove ALL `useMemo` and `useCallback` calls from component and hook files — React Compiler 1.0 handles all 271 components transparently
- 137 occurrences across 38 files (30 in `app/`, 8 in `lib/hooks/`)
- Replace each with direct inline computation or function definition (no wrapper needed)
- Files with highest density: `useLightsData.ts` (22), `useLightsCommands.ts` (13), `useBackgroundSync.ts` (7)
- Debug/design-system pages included — React Compiler handles them too

### Env var cleanup scope
- Remove the 8 stale `HOMEASSISTANT_*` and `NETATMO_*` variables from `.env.local`
- Also clean `.env.example` or `.env.local.example` if they reference these vars
- Also clean any documentation that references these specific env vars
- Do NOT touch `NETATMO_ROUTES`, `NETATMO_CAMERA_API`, or `ERROR_CODES.NETATMO_*` — these are active code constants, not env vars

### Validation approach
- Remove all memoization at once (not incrementally) — React Compiler is a transparent replacement
- Run full test suite after removal to verify zero regressions
- No new tests needed — existing tests validate behavior unchanged

### Claude's Discretion
- Order of file processing (by directory, by density, alphabetical — any is fine)
- Whether to split into one plan or two (one per DEBT requirement)
- Inline computation style (keep variable name with direct assignment vs inline into JSX)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### React Compiler
- `next.config.ts` — React Compiler configuration (experimental.reactCompiler)
- Phase 71 established React Compiler 1.0 on 271/271 components with zero regressions

### Env var migration history
- `.planning/milestones/v11.0-phases/86-netatmo-migration/86-CONTEXT.md` — Netatmo migration decisions (env vars marked stale)
- `.planning/milestones/v11.0-phases/85-fritz-box-migration/85-CONTEXT.md` — Fritz!Box JWT removal context
- `.planning/PROJECT.md` — Documents 8 stale env vars flagged for cleanup

### Requirements
- `.planning/REQUIREMENTS.md` §Tech Debt Cleanup — DEBT-01 (memoization), DEBT-02 (env vars)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- React Compiler 1.0 active on all components — automatic memoization replacement
- No migration tooling needed — simple find-and-remove pattern

### Established Patterns
- `useMemo(() => computation, [deps])` → `const value = computation`
- `useCallback((args) => body, [deps])` → `const fn = (args) => body` or inline
- Hooks in `lib/hooks/` follow same pattern as component hooks

### Integration Points
- `useLightsData.ts` (22 occurrences) — highest density, primarily memoized selectors
- `useLightsCommands.ts` (13 occurrences) — memoized command functions
- `useBackgroundSync.ts` (7 occurrences) — memoized sync handlers
- `.env.local` — env var file (not in git, manual edit required)

</code_context>

<specifics>
## Specific Ideas

No specific requirements — straightforward removal of redundant code and dead configuration.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 95-tech-debt-cleanup*
*Context gathered: 2026-03-18*
