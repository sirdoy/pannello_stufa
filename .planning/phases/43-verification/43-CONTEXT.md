# Phase 43: Verification - Context

**Gathered:** 2026-02-07
**Status:** Ready for planning

<domain>
## Phase Boundary

Final validation that the v5.0 TypeScript migration is complete. Build passes, type-check passes, zero JS source files remain, all tests pass, and dev server works. This phase fixes all remaining issues — it does not add new features or capabilities.

</domain>

<decisions>
## Implementation Decisions

### Issue Resolution Strategy
- Fix ALL tsc errors to zero — no exceptions, no suppressions
- Fix everything properly even if it requires significant refactoring of working code
- Fix all 29 known failing tests (both migration-caused and pre-existing)
- Create full type definitions for external APIs (Hue v2, Netatmo, Camera) — not stubs, proper interfaces
- The 198 documented external API type errors from Phase 41 must be fully resolved

### JS File Exceptions
- Convert ALL config files to TypeScript (next.config, tailwind.config, postcss.config, etc.)
- Generated/vendor JS files (build output, third-party scripts) excluded from count — only source files matter
- Verify all test-related files are TS (mocks, fixtures, helpers) — no test .js remaining
- public/ directory: convert source code (e.g., service workers) to TS; static assets stay as-is

### Validation Scope
- `tsc --noEmit` must pass with exit code 0
- `npm run build` must complete successfully (NOTE: project rule says NEVER run npm run build — this is verification only, run with caution)
- Run full test suite (`npm test`) — zero failures required
- Dev server smoke test: Claude's discretion on scope
- No migration report needed — existing phase summaries are sufficient
- Disable `allowJs` in tsconfig.json as final step (enforces pure TS going forward)

### Mock Type Errors (1492 errors, 90+ files)
- Fix ALL 1492 mock type errors properly — no `as any` pattern
- Use `jest.mocked()` helper (modern Jest built-in) for auto-mocked modules
- Use `jest.MockedFunction<typeof fn>` for manual mock typing
- Create shared mock type utilities (typed mock helpers, factories) to reduce boilerplate
- Automated batch processing allowed where pattern is consistent and safe
- Manual review for edge cases and non-standard patterns

### Final Lockdown
- Disable `allowJs: true` in tsconfig.json after all JS files are converted
- Future JS files will cause compile errors — enforcing pure TypeScript

### Claude's Discretion
- Dev server smoke test depth (which pages to verify)
- Mock utility API design (helper function signatures, factory patterns)
- Which batch patterns are safe for automation vs. need manual review
- Order of operations (fix tsc first vs. tests first vs. config first)

</decisions>

<specifics>
## Specific Ideas

- User wants zero tolerance: every error fixed properly, no pragmatic shortcuts
- External API types should be full interfaces, not declaration stubs
- `jest.mocked()` is the preferred pattern over manual `as jest.MockedFunction<>` casting
- Shared test utilities should be created to DRY up mock typing across 90+ files

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 43-verification*
*Context gathered: 2026-02-07*
