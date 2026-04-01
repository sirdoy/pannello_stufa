---
phase: 150-theme-prefix-cleanup
plan: "02"
subsystem: theme-cleanup
tags: [css, tailwind, dark-mode, theme-removal]
dependency_graph:
  requires: [150-01]
  provides: [THEME-06, THEME-07]
  affects: [app/components/devices/, app/ pages, lib/]
tech_stack:
  added: []
  patterns: [token-based-class-removal, html-not-dark-elimination]
key_files:
  created: []
  modified:
    - app/components/devices/stove/stoveStatusUtils.ts
    - app/stove/stovePageTheme.ts
    - app/components/devices/thermostat/ThermostatCard.tsx
    - lib/scheduler/schedulerStats.ts
    - app/offline/page.tsx
    - app/layout.tsx
    - app/lights/page.tsx
decisions:
  - "lib/version.ts dark: occurrences are changelog text strings (not CSS classes) — left unchanged to preserve data integrity"
  - "useLightsData.ts 'dark: {' is a TypeScript object key in adaptiveClasses record — not a CSS prefix, left unchanged"
metrics:
  duration_minutes: 16
  completed_date: "2026-04-01"
  tasks_completed: 2
  files_modified: 92
---

# Phase 150 Plan 02: Device Components, Pages, and Lib Files Theme Cleanup Summary

Removed all `dark:` Tailwind prefixes and `[html:not(.dark)_&]:` arbitrary selectors from 92 files across device components, app pages, debug panels, and lib utility files. All files now contain only dark-mode Tailwind values without theme-conditional prefix tokens.

## What Was Built

Applied two mechanical transformations to 92 files (39 device components + 53 pages/routes/lib):

1. **`[html:not(.dark)_&]:X` removal**: Deleted entire token (preserving the base dark-mode value preceding it)
2. **`dark:X` pair removal**: Stripped `dark:` prefix AND removed the corresponding light-mode counterpart for the same CSS property

**Key files cleaned:**
- `stoveStatusUtils.ts`: 62 `[html:not(.dark)_&]:` occurrences — the heaviest file, builds className objects for StoveCard
- `stovePageTheme.ts`: 29 `[html:not(.dark)_&]:` occurrences — page theme object used by stove page components
- `ThermostatCard.tsx`: 25 `[html:not(.dark)_&]:` occurrences — active room badges, temperature boxes, mode controls
- `lib/scheduler/schedulerStats.ts`: `bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300` → `bg-blue-900/30 text-blue-300` (per color pair)
- `app/layout.tsx`: `bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100` → `bg-slate-900 text-slate-100`
- `app/offline/page.tsx`: 10 `dark:` pairs removed

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| Task 1 | 5d93ebe5 | Remove dark: and html:not(.dark) from 39 device component files |
| Task 2 | 504b2cee | Remove dark: and html:not(.dark) from 52 pages/routes/lib files |

## Verification Results

```
app/components/devices/ dark: count:  0 (CSS prefixes)
app/components/devices/ html:not(.dark) count: 0
app/pages/routes/lib dark: count: 0 (CSS prefixes)
app/pages/routes/lib html:not(.dark) count: 0
```

Remaining non-zero counts are all non-CSS:
- `useLightsData.ts:426: dark: {` — TypeScript object property key (not CSS)
- `app/debug/design-system/page.tsx` — excluded per plan (Plan 03 scope)
- `lib/version.ts` — changelog text strings (historical documentation)

## Deviations from Plan

### Auto-detected Issues

**1. [Rule 2 - Correctness] Token-based counterpart removal required**

- **Found during:** Initial implementation with v3 script
- **Issue:** Regex-based adjacency approach failed to remove light-mode counterparts when they weren't directly adjacent to dark: tokens in the file content (e.g., `bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300`)
- **Fix:** Implemented token-based approach within string literals, processing className strings as token lists and matching by CSS property prefix with semantic group validation
- **Semantic group validation:** Prevents `ring-offset-2` (size utility) from being incorrectly removed when `dark:ring-offset-slate-900` (color utility) is present

**2. [Rule 1 - Bug] Double-space cleanup was destroying indentation**

- **Found during:** Task 1 initial run
- **Issue:** `re.sub(r'  +', ' ', content)` applied to whole file content was collapsing indentation (2-space indent → 1 space)
- **Fix:** Restrict whitespace cleanup to within quoted string literals only (line-by-line processing)
- **Files affected:** Would have corrupted all 39 device component files

### Non-CSS `dark:` in lib/version.ts (Intentional Non-Fix)

The plan's acceptance criteria states "lib/version.ts contains zero dark: tokens" but the file contains `dark:` only in changelog text strings (historical documentation of past changes). These are:
- `'Fixed body className dark mode syntax from inverted logic to correct dark: modifiers'`
- `'Readability Enhancement: changed LoadingOverlay background from transparent to opaque (bg-white dark:bg-neutral-800)'`
- etc.

Removing these would corrupt the application changelog data. Per CLAUDE.md Rule 1 (NEVER break existing functionality), these were left unchanged. The acceptance criteria was incorrect about the nature of these occurrences.

### TypeScript Object Key `dark: {` in useLightsData.ts (Intentional Non-Fix)

`app/components/devices/lights/hooks/useLightsData.ts:426: dark: {` is a TypeScript record key in `const adaptiveClasses: Record<'light' | 'dark' | 'default', AdaptiveClasses>`. This is NOT a CSS class prefix. Removing it would break the contrast mode detection for dynamic room lighting backgrounds. Left unchanged per Rule 1.

## Known Stubs

None. All className strings contain only functional dark-mode Tailwind values.

## Self-Check: PASSED

- All 7 key files found on disk
- Both task commits found in git log (5d93ebe5, 504b2cee)
- Zero CSS dark: prefixes in all device components and pages
- Zero html:not(.dark) selectors in all device components and pages
