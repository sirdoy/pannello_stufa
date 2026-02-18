---
phase: 70-measurement-baseline-quick-wins
plan: 01
subsystem: infra
tags: [bundle-analyzer, performance, measurement, baseline, next-config, scripts]

# Dependency graph
requires: []
provides:
  - "@next/bundle-analyzer plugin in next.config.ts, toggleable via ANALYZE=true"
  - "scripts/baseline.mjs: per-route First Load JS capture from .next/build-manifest.json"
  - "scripts/baseline.mjs: --compare mode for phase-over-phase delta tables"
  - "scripts/baseline.mjs: optional --lighthouse URL for Lighthouse score capture"
  - ".baseline/ directory convention for storing phase snapshots"
affects:
  - 70-02
  - 71-react-compiler
  - 72-code-splitting
  - 73-render-optimization
  - 74-suspense-streaming

# Tech tracking
tech-stack:
  added:
    - "@next/bundle-analyzer ^16.1.0 (devDependency, added to package.json — requires npm install)"
  patterns:
    - "ANALYZE=true gating: bundle analyzer inactive by default, only generates treemaps when env var set"
    - "Plugin composition: withAnalyzer(withSerwist(nextConfig)) — outer wrapper preserves existing config"
    - "Phase snapshot convention: .baseline/phase-{N}.json with bundle + lighthouse keys"
    - "Comparison baseline: phase 70 is the permanent reference for all v9.0 phases"

key-files:
  created:
    - scripts/baseline.mjs
  modified:
    - next.config.ts
    - package.json

key-decisions:
  - "Used @ts-expect-error for @next/bundle-analyzer import because package ships CommonJS types incompatible with ESM import — avoids a type stub file"
  - "Phase 70 snapshot is the fixed reference point for --compare in all subsequent phases (not rolling)"
  - "npm install not executed per project rules — @next/bundle-analyzer added to package.json only; user must run npm install before first ANALYZE=true build"
  - "Shared chunk detection: chunks appearing in more than one route are classified as shared (not duplicated per route)"

patterns-established:
  - "Plugin composition: wrap Next.js config with ANALYZE-gated analyzer before other plugins"
  - "Baseline snapshot: PHASE=N node scripts/baseline.mjs captures to .baseline/phase-N.json"
  - "Delta reporting: PHASE=N node scripts/baseline.mjs --compare reads phase-70.json as ref"

requirements-completed:
  - MEAS-01
  - MEAS-02
  - MEAS-04

# Metrics
duration: 12min
completed: 2026-02-18
---

# Phase 70 Plan 01: Measurement Baseline + Quick Wins Summary

**Bundle analyzer plugin + reusable baseline script enabling per-route JS size tracking and Lighthouse comparison across v9.0 optimization phases**

## Performance

- **Duration:** ~12 min
- **Started:** 2026-02-18T10:25:00Z
- **Completed:** 2026-02-18T10:37:23Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- Added `@next/bundle-analyzer` to `next.config.ts` with `ANALYZE=true` toggle — inactive by default, generates treemaps for per-route chunk inspection when enabled
- Created `scripts/baseline.mjs` (369 lines) capturing per-route First Load JS from `.next/build-manifest.json`, reads actual file sizes via `fs.statSync`
- Comparison mode (`--compare`) prints a formatted delta table with route-by-route kB deltas and percentage change vs Phase 70 reference
- Lighthouse capture (`--lighthouse URL`) records performance/LCP/FCP/CLS/INP/TTFB into the snapshot JSON

## Task Commits

Each task was committed atomically:

1. **Task 1: Add @next/bundle-analyzer plugin to next.config.ts** - `5a8a1ac` (chore)
2. **Task 2: Create reusable baseline capture and comparison script** - `09dbdd4` (feat)

## Files Created/Modified

- `next.config.ts` - Added `withBundleAnalyzer` import and `withAnalyzer(withSerwist(nextConfig))` export
- `package.json` - Added `@next/bundle-analyzer ^16.1.0` to devDependencies
- `scripts/baseline.mjs` - Full baseline capture + comparison script (no external deps, Node.js built-ins only)

## Decisions Made

- Used `@ts-expect-error` on the `@next/bundle-analyzer` import rather than creating a `.d.ts` stub — the package ships CommonJS types and the comment explains why. Cleaner than a separate declaration file.
- Phase 70 is the fixed reference baseline (`--ref` defaults to `70`). Each subsequent v9.0 phase compares against this anchor, not the previous phase. This way all phases show cumulative improvement.
- `npm install` was not run (project rule). `@next/bundle-analyzer` added to `package.json` only — user must run `npm install` before first use.
- Shared chunk classification: a chunk referenced by more than one route is counted as shared and not duplicated in per-route totals. This matches Next.js's own First Load JS accounting.

## Deviations from Plan

None - plan executed exactly as written. The `@ts-expect-error` approach was specified in the plan's verify step as a valid fallback.

## Issues Encountered

None. The TypeScript check confirmed pre-existing errors in unrelated files (camera snapshot route, a test file) — no new errors introduced by our changes.

## User Setup Required

Before running the bundle analyzer or baseline script, the user needs to install the new dev dependency:

```bash
npm install
```

Then to use:

```bash
# Bundle analyzer (opens treemap in browser after build)
ANALYZE=true npm run build

# Capture Phase 70 baseline (after a regular build)
npm run build
PHASE=70 node scripts/baseline.mjs

# Compare Phase 71 against Phase 70
PHASE=71 node scripts/baseline.mjs --compare
```

## Next Phase Readiness

- `next.config.ts` plugin chain is set; subsequent phases do not need to modify it
- `scripts/baseline.mjs` is reusable for phases 71-74 without changes
- Phase 70 baseline should be captured after the full phase 70 builds complete
- Phase 71 (React Compiler) can proceed immediately — no dependencies on this plan's output beyond the baseline tooling

---
*Phase: 70-measurement-baseline-quick-wins*
*Completed: 2026-02-18*

## Self-Check: PASSED

- next.config.ts: FOUND (withAnalyzer(withSerwist pattern confirmed)
- scripts/baseline.mjs: FOUND (syntax valid, 369 lines)
- 70-01-SUMMARY.md: FOUND
- Commit 5a8a1ac (Task 1): FOUND
- Commit 09dbdd4 (Task 2): FOUND
- @next/bundle-analyzer in package.json: FOUND
