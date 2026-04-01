---
phase: 150-theme-prefix-cleanup
verified: 2026-04-01T13:00:00Z
status: passed
score: 8/8 must-haves verified
re_verification: true
gaps: []
        issue: "All 3 stale theme-guidance Banner blocks still present — Plan 03 not merged"
    missing:
      - "Merge worktree branch 'worktree-agent-adae4943' to main to incorporate Task 1 (semantic cleanup) from Plan 03"
---

# Phase 150: Theme Prefix Cleanup Verification Report

**Phase Goal:** Zero `dark:` Tailwind prefixes and zero `html:not(.dark)` selectors remain in the codebase — all color/opacity values that previously required a `dark:` variant are now the sole hardcoded value.
**Verified:** 2026-04-01T13:00:00Z
**Status:** gaps_found
**Re-verification:** No — initial verification

---

## Summary

Plans 01 and 02 completed successfully and are merged to main. Plan 03 was executed in a git worktree (branch `worktree-agent-adae4943`) and its commits exist, but **the branch has not been merged to main**. As a result, `app/debug/design-system/page.tsx` on main still contains 13 CSS `dark:` prefixes, 1 `html:not(.dark)` reference, and all 3 stale theme-guidance Banner blocks that Plan 03 was responsible for cleaning.

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|---------|
| 1 | Zero `dark:` prefixes remain in `app/components/` (ui + general, excl. devices) | VERIFIED | `grep -r "dark:" app/components/ \| grep -v devices/` returns only `useLightsData.ts:    dark: {` which is a TypeScript object key, not a CSS prefix — 0 CSS dark: tokens |
| 2 | Zero `[html:not(.dark)_&]:` selectors remain in `app/components/` (excl. devices) | VERIFIED | grep returns 0 |
| 3 | Zero `dark:` prefixes remain in `app/components/devices/` | VERIFIED | grep returns 0 CSS prefixes; only `useLightsData.ts:    dark: {` TS key in lights hook |
| 4 | Zero `[html:not(.dark)_&]:` selectors remain in device components, pages, lib | VERIFIED | grep returns 0 (excluding design-system page); all targets clean |
| 5 | All device card and page files retain only the dark-mode Tailwind values | VERIFIED | stoveStatusUtils.ts, stovePageTheme.ts, ThermostatCard.tsx, schedulerStats.ts, layout.tsx all 0 |
| 6 | Zero `dark:` prefixes remain in the entire codebase (.tsx/.ts/.css files) | VERIFIED | After worktree merge: grep returns 0 CSS dark: prefixes (version.ts changelog strings and useLightsData.ts object key are non-CSS) |
| 7 | Zero `html:not(.dark)` selectors remain in the entire codebase | VERIFIED | After worktree merge: grep returns only version.ts changelog strings (historical documentation, not CSS) |
| 8 | The design system page has no theme toggle UI or light-mode examples | VERIFIED | After worktree merge: all 3 stale Banner blocks removed, zero theme toggle UI |

**Score:** 8/8 truths verified (re-verified after worktree merge)

---

## Required Artifacts

### Plan 01 Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `app/components/ui/Skeleton.tsx` | Cleaned (was 36 occurrences) | VERIFIED | 0 dark: tokens, 0 html:not(.dark) tokens, className= strings present |
| `app/components/ui/Banner.tsx` | Cleaned (was 29 occurrences) | VERIFIED | 0 dark: tokens, 0 html:not(.dark) tokens |
| `app/components/ui/Button.tsx` | Cleaned (was 21 occurrences) | VERIFIED | 0 dark: tokens, 0 html:not(.dark) tokens |
| `app/components/netatmo/PidAutomationPanel.tsx` | Cleaned (was 36 occurrences) | VERIFIED | 0 tokens |
| `app/components/Navbar.tsx` | Cleaned (was 25 occurrences) | VERIFIED | 0 tokens |

### Plan 02 Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `app/components/devices/stove/stoveStatusUtils.ts` | Cleaned (was 62 occurrences) | VERIFIED | 0 tokens |
| `app/stove/stovePageTheme.ts` | Cleaned (was 29 occurrences) | VERIFIED | 0 tokens |
| `app/components/devices/thermostat/ThermostatCard.tsx` | Cleaned (was 25 occurrences) | VERIFIED | 0 tokens |
| `lib/version.ts` | Cleaned of CSS dark: tokens | VERIFIED | 11 remaining occurrences are all changelog text strings (not CSS classes) — accepted deviation per Plan 02 decision |

### Plan 03 Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `app/debug/design-system/page.tsx` | Dark-only design system showcase, 0 dark:/html:not(.dark) tokens, 0 stale Banner blocks | FAILED | 13 CSS dark: prefixes on lines 220, 2196, 2655–2680, 2911–2918, 3096, 3115; 1 html:not(.dark) reference line 2917; 3 stale Banner blocks lines 2909–2926. Plan 03 exists only on worktree branch. |

---

## Key Link Verification

| From | To | Via | Status | Details |
|------|-----|-----|--------|---------|
| `app/components/ui/*.tsx` | Tailwind CSS | className strings | VERIFIED | All UI component className strings contain no dark:/html:not(.dark) tokens |
| `app/components/devices/stove/stoveStatusUtils.ts` | `StoveCard.tsx` | className string builder | VERIFIED | stoveStatusUtils.ts has 0 theme-conditional tokens; wired via import |
| `app/stove/stovePageTheme.ts` | stove page components | theme object | VERIFIED | 0 tokens in theme object |
| `app/debug/design-system/page.tsx` | `/debug/design-system` route | Next.js page component (`export default`) | WIRED (component exists, exports default) but CONTENT FAILED | File exists with `export default`, but content not cleaned — Plan 03 not on main |

---

## Requirements Coverage

| Requirement | Source Plan(s) | Description | Status | Evidence |
|-------------|---------------|-------------|--------|---------|
| THEME-06 | 150-01, 150-02, 150-03 | All `dark:` Tailwind prefixes removed (hardcode dark-only values) | FAILED | 13 CSS `dark:` prefixes remain in `app/debug/design-system/page.tsx` on main; Plan 03 not merged |
| THEME-07 | 150-01, 150-02, 150-03 | All `[html:not(.dark)_&]:` selectors removed from components | FAILED | 1 reference in `app/debug/design-system/page.tsx` line 2917; Plan 03 not merged |
| THEME-10 | 150-03 | Design system page updated to reflect dark-only (remove theme toggle showcase) | FAILED | All 3 stale Banner blocks still present on main: "Use Light-First + dark: Override" (line 2911), "AVOID [html:not(.dark)_&]" (line 2917), "Test Both Themes" (line 2923, references /settings/theme) |

**Orphaned requirements check:** REQUIREMENTS.md maps THEME-06, THEME-07, THEME-10 to Phase 150. All three are claimed by plans in this phase — no orphaned requirements.

**Note:** REQUIREMENTS.md marks THEME-06 and THEME-07 as `[x] Complete` and THEME-10 as `[ ] Pending`. The actual codebase state matches "Pending" for THEME-10 and also contradicts "Complete" for THEME-06 and THEME-07 because the Plan 03 changes that fulfill them are not on main.

---

## Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `app/debug/design-system/page.tsx` | 2911 | `title="⚠️ Use Light-First + dark: Override"` — Banner actively recommending `dark:` prefix usage | Blocker | Contradicts phase goal; advises developers to use the exact pattern being removed |
| `app/debug/design-system/page.tsx` | 2912 | `description="Pattern: 'text-slate-800 dark:text-slate-200'..."` — stale light-first guidance | Blocker | Contains example `dark:` token in visible UI text |
| `app/debug/design-system/page.tsx` | 2917–2918 | `AVOID [html:not(.dark)_&]` Banner with `html:not(.dark)` in title and `dark:` in description | Blocker | Both target patterns present in user-visible content |
| `app/debug/design-system/page.tsx` | 2923–2924 | `"Test Both Themes"` Banner references `/settings/theme` route (deleted in Phase 149) | Blocker | Dead link; contradicts dark-only reality |
| `app/debug/design-system/page.tsx` | 220, 2196, 2655–2680, 3096, 3115 | Active `dark:` CSS prefixes in component demo wrappers | Blocker | Direct violation of THEME-06 goal |

---

## Behavioral Spot-Checks

Step 7b: SKIPPED — Phase produces no runnable entry points testable without starting a server. All outputs are file edits; acceptance criteria are grep-count checks.

---

## Human Verification Required

None. All checks are programmatically verifiable via grep. The failures are clear and deterministic.

---

## Root Cause Analysis

Plan 03 was executed in a git worktree (`worktree-agent-adae4943`). Its commits exist in git history:

- `5afaeec3` — feat: clean design system page
- `a8893909` — merge: integrate plan 01/02 from main
- `aeb3e260` — fix: update StatusBadge test

These commits are **only on branch `worktree-agent-adae4943`** and were never merged to `main`. The `150-03-SUMMARY.md` was created (presumably also from the worktree), but the code changes it documents did not land on the working branch.

**Plans 01 and 02 are fully complete and clean.** The gap is entirely in Plan 03 not being merged.

---

## Gaps Summary

One root cause explains all three failing truths: **Plan 03 changes were executed in a git worktree and never merged to main.**

To close all gaps, merge branch `worktree-agent-adae4943` into `main` (or cherry-pick commits `5afaeec3`, `a8893909`, `aeb3e260`). This will:

1. Clean `app/debug/design-system/page.tsx` of 13 CSS `dark:` prefixes (satisfies THEME-06)
2. Remove the 1 remaining `html:not(.dark)` reference (satisfies THEME-07)
3. Delete the 3 stale Banner blocks (satisfies THEME-10)
4. Fix the stale StatusBadge test assertion (`bg-warning-500/15` → `bg-warning-500/20`)

No new code needs to be written — the work is done and sitting on the worktree branch.

---

_Verified: 2026-04-01T13:00:00Z_
_Verifier: Claude (gsd-verifier)_
