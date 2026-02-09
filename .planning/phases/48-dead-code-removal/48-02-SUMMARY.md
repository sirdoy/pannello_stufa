---
phase: 48-dead-code-removal
plan: 02
subsystem: dependencies
tags: [dead-code-removal, dependency-cleanup, package-management]
dependency_graph:
  requires: []
  provides: [clean-package-json]
  affects: [package.json]
tech_stack:
  removed:
    - "@radix-ui/react-dropdown-menu"
    - "@radix-ui/react-slot"
    - "baseline-browser-mapping"
    - "serwist"
  patterns:
    - "knip for dependency analysis"
    - "manual package.json editing (no npm uninstall per project rules)"
key_files:
  created: []
  modified:
    - path: "package.json"
      purpose: "Removed 4 unused dependencies"
decisions:
  - decision: "Remove @radix-ui/react-dropdown-menu"
    rationale: "Not imported anywhere; project uses @radix-ui/react-context-menu instead"
    alternatives: []
    outcome: "Removed"
  - decision: "Remove @radix-ui/react-slot"
    rationale: "Not imported anywhere; no Slot/asChild pattern usage found"
    alternatives: []
    outcome: "Removed"
  - decision: "Remove baseline-browser-mapping"
    rationale: "Only referenced as changelog entry string in lib/version.ts, not actual import/usage"
    alternatives: []
    outcome: "Removed"
  - decision: "Remove serwist from devDependencies"
    rationale: "Already bundled as dependency of @serwist/next (version 9.5.0), redundant in devDependencies"
    alternatives: ["Keep as peer dependency"]
    outcome: "Removed (bundled into @serwist/next)"
metrics:
  duration: 425s
  tasks_completed: 2
  files_modified: 1
  dependencies_removed: 4
  completed_at: "2026-02-09"
---

# Phase 48 Plan 02: Unused Dependencies Removal

**One-liner:** Removed 4 unused dependencies from package.json (2 Radix UI packages, baseline-browser-mapping, serwist) after knip analysis.

## What Was Done

### Task 1: Remove Unused Dependencies from package.json
**Status:** ✅ Complete
**Commit:** e14ccfd

Removed 4 unused dependencies identified by knip analysis:

**Production dependencies removed:**
1. `@radix-ui/react-dropdown-menu` — Not imported anywhere. Project uses `@radix-ui/react-context-menu` for right-click menus instead.
2. `@radix-ui/react-slot` — Not imported anywhere. No asChild/Slot pattern usage found in codebase.

**Dev dependencies removed:**
3. `baseline-browser-mapping` — Only referenced as a changelog entry string in `lib/version.ts`, not an actual import or usage.
4. `serwist` — Already bundled as a regular dependency of `@serwist/next` (version 9.5.0). The devDependency was redundant.

**Verification:**
- ✅ package.json valid JSON
- ✅ All 4 dependencies removed
- ✅ `npx tsc --noEmit` passes (0 errors)
- ✅ All 131 test suites pass (3034 tests)

**Files modified:** `package.json`

### Task 2: Verify and Document Dependency Audit Results
**Status:** ✅ Complete
**Commit:** None (verification only)

Ran knip dependency analysis after removals:

```bash
npx knip --no-progress --include dependencies,unlisted
```

**Results:**
- ✅ **Zero unused dependencies** — All unused deps successfully removed
- ✅ **6 unlisted dependencies** — All are acceptable false positives:
  - `jsdom` (4 files): Provided by `jest-environment-jsdom` — used in test files
  - `@jest/globals` (2 files): Provided by `jest` — used in test files

These unlisted dependencies are not real issues; they're transitively provided by jest packages.

## Deviations from Plan

### Auto-fixed Issues

**None** — Plan executed exactly as written.

### Architectural Decisions

**None** — No architectural changes required.

## Impact Analysis

**Benefits:**
- Cleaner package.json with only actively used packages
- Reduced potential confusion from unused dependencies
- Easier dependency auditing and maintenance
- 4 fewer dependencies to track for security vulnerabilities

**Risks:**
- None identified. All removed packages were genuinely unused and verified safe to remove.

**Breaking changes:**
- None. Removed packages had no imports or usage in the codebase.

## Verification Results

### Pre-verification
- ✅ knip identified 4 unused dependencies (2 production, 2 dev)
- ✅ Verified `serwist` bundled into `@serwist/next` before removal

### Post-verification
- ✅ package.json valid JSON
- ✅ TypeScript compilation: 0 errors
- ✅ Test suite: 131/131 suites passed, 3034/3034 tests passed
- ✅ knip audit: 0 unused dependencies remaining
- ✅ knip unlisted: 6 expected false positives (jest-related)

## Follow-up Actions

**None required.** Dependency cleanup complete.

## Self-Check: PASSED

**Files verified:**
- ✅ FOUND: /Users/federicomanfredi/Sites/localhost/pannello-stufa/package.json (modified)

**Commits verified:**
- ✅ FOUND: e14ccfd (chore(48-02): remove unused dependencies from package.json)

**Test results:**
- ✅ TypeScript: 0 errors
- ✅ Tests: 131/131 suites passed, 3034/3034 tests passed

**Dependency audit:**
- ✅ knip: 0 unused dependencies
- ✅ knip: 6 unlisted (all expected false positives)
