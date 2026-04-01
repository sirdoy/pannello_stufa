---
phase: 150-theme-prefix-cleanup
plan: "03"
subsystem: design-system
tags: [theme-cleanup, design-system, dark-only, tailwind, verification]
dependency_graph:
  requires: [150-01, 150-02]
  provides: [THEME-06, THEME-07, THEME-10]
  affects: [app/debug/design-system/page.tsx, StatusBadge test suite]
tech_stack:
  added: []
  patterns: [dark-only-design-system, stale-guidance-removal]
key_files:
  created: []
  modified:
    - app/debug/design-system/page.tsx
    - app/components/ui/__tests__/StatusBadge.variants.test.tsx
decisions:
  - "lib/version.ts dark: and html:not(.dark) occurrences are changelog text strings — inherited decision from Plan 02, left unchanged to preserve history"
  - "useLightsData.ts 'dark: {' is a TypeScript object property key — not a CSS prefix, left unchanged (inherited from Plan 02)"
  - "StatusBadge test bg-warning-500/15 updated to bg-warning-500/20 — Plan 01 promoted dark value to primary, test was stale"
  - "All 5 conflict hunks in design-system/page.tsx resolved in favour of HEAD (already had clean dark-only versions)"
metrics:
  duration: 20min
  completed: "2026-04-01T12:00:00Z"
  tasks: 2
  files: 2
requirements:
  - THEME-10
---

# Phase 150 Plan 03: Design System Page Cleanup and Final Codebase Verification Summary

**One-liner:** Cleaned design system page of dark: prefixes, html:not(.dark) tokens, and stale theme-guidance banners, then confirmed zero CSS dark: and html:not(.dark) tokens across the entire codebase (THEME-06, THEME-07, THEME-10).

## What Was Built

Applied three types of cleanup to `app/debug/design-system/page.tsx`:

1. **Mechanical dark: removal**: Confirmed zero dark: prefixes after merge (main's Plan 01/02 changes resolved all mechanical tokens)
2. **Mechanical html:not(.dark) removal**: Removed 4 `[html:not(.dark)_&]:` tokens from className strings (ToC nav links, CommandPalette features list, WeatherIconDemo)
3. **Semantic stale-guidance removal**: Deleted/replaced 3 Banner blocks with outdated theme advice:
   - "DON'T Mix dark: and [html:not(.dark)_&]:" Banner — deleted (irrelevant now that both patterns are gone)
   - "Dark-First Philosophy / Test both modes always" Banner — replaced with "Dark-Only Philosophy" (accurate for current state)
   - "AVOID Triple Overrides" Banner — updated to remove html:not(.dark) examples from description
   - "Components handle dark/light mode internally" description — updated to remove light-mode reference

Then ran codebase-wide verification to confirm THEME-06 and THEME-07, fixing one stale test in the process.

## Tasks Completed

| Task | Description | Commit | Files |
|------|-------------|--------|-------|
| 1 | Clean design system page — dark:/html:not(.dark)/stale banners | 5afaeec3 | 1 |
| merge | Integrate Plan 01/02 changes from main | a8893909 | many |
| 2 | Final codebase verification + StatusBadge test fix | aeb3e260 | 1 |

## Verification Results

```
THEME-06 (CSS dark: in tsx/ts/css files, excl. non-CSS strings): 0
THEME-07 (html:not(.dark) in tsx/ts/css files, excl. changelog): 0
THEME-10 (design system stale content): 0
Tests passing: 232/232 (Button|Banner|StatusBadge|OfflineBanner|Skeleton)
```

Remaining non-zero in raw grep (intentional, inherited from Plan 02 decision):
- `lib/version.ts`: 11 changelog text strings (historical documentation, not CSS)
- `useLightsData.ts:426: dark: {`: TypeScript object property key (not CSS prefix)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] StatusBadge test expected stale light-mode class value**
- **Found during:** Task 2 test run
- **Issue:** `StatusBadge.variants.test.tsx` line 26 expected `bg-warning-500/15` which was the old light-mode default. Plan 01's cleanup promoted the `dark:bg-warning-500/20` value to primary, making the test stale.
- **Fix:** Updated test assertion from `bg-warning-500/15` to `bg-warning-500/20`
- **Files modified:** `app/components/ui/__tests__/StatusBadge.variants.test.tsx`
- **Commit:** aeb3e260

**2. [Rule 3 - Merge Required] Worktree predated Plan 01/02 commits**
- **Found during:** Task 2 codebase-wide verification (104 dark: prefixes found)
- **Issue:** The worktree was branched from a commit before Plans 01 and 02 executed on main. The verification grep returned 104 because those files hadn't been merged yet.
- **Fix:** Ran `git merge main` to incorporate Plan 01/02 changes. Resolved 5 conflict hunks in `app/debug/design-system/page.tsx` in favour of HEAD (already had clean dark-only versions from Task 1).
- **Commit:** a8893909

## Known Stubs

None. All transformations are mechanical or text-content updates. No functional behaviour changed.

## Self-Check: PASSED

- FOUND: app/debug/design-system/page.tsx
- FOUND: app/components/ui/__tests__/StatusBadge.variants.test.tsx
- FOUND commit: 5afaeec3 (Task 1)
- FOUND commit: a8893909 (merge)
- FOUND commit: aeb3e260 (Task 2 / test fix)
- Verified: 0 CSS dark: tokens (excl. version.ts changelog + TS object key)
- Verified: 0 html:not(.dark) tokens (excl. version.ts changelog)
- Verified: 0 stale theme guidance in design-system/page.tsx
- Verified: 232/232 tests passing
