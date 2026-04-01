---
phase: 149-theme-removal-core
plan: "01"
subsystem: theme
tags: [dark-only, cleanup, deletion]
dependency_graph:
  requires: []
  provides: [dark-only-html, no-theme-infrastructure]
  affects: [app/layout.tsx, app/components/ClientProviders.tsx, app/settings/page.tsx]
tech_stack:
  added: []
  patterns: [hardcoded-dark-class, static-theme-color-meta]
key_files:
  created: []
  modified:
    - app/layout.tsx
    - app/components/ClientProviders.tsx
    - app/settings/page.tsx
  deleted:
    - app/context/ThemeContext.tsx
    - app/components/ThemeScript.tsx
    - lib/themeService.ts
    - __tests__/lib/themeService.test.ts
    - app/settings/theme/page.tsx
    - app/api/user/theme/route.ts
decisions:
  - "Hardcode dark class on html element permanently — no runtime switching needed"
  - "Replace inline localStorage theme script with static meta tag — simpler, no flash risk"
  - "Settings page defaults to posizione tab after Aspetto removal"
metrics:
  duration_seconds: 414
  completed_date: "2026-04-01"
  tasks_completed: 2
  files_changed: 9
requirements_satisfied:
  - THEME-02
  - THEME-03
  - THEME-04
  - THEME-05
  - THEME-08
  - THEME-09
---

# Phase 149 Plan 01: Theme Infrastructure Deletion Summary

## One-Liner

Deleted all theme infrastructure (6 files, ~1030 LOC) and hardcoded permanent dark class on html element with static #0f172a theme-color meta.

## What Was Built

Removed the entire light/dark theme switching system as part of the v18.0 Dark-Only & Mobile-First milestone. The application is now permanently in dark mode with no user-controllable theme preference.

### Files Deleted

| File | Purpose |
|------|---------|
| `app/context/ThemeContext.tsx` | ThemeProvider + useTheme hook |
| `app/components/ThemeScript.tsx` | Inline script for flash prevention |
| `lib/themeService.ts` | Theme service with THEMES constant + Firebase persistence |
| `__tests__/lib/themeService.test.ts` | Unit tests for themeService |
| `app/settings/theme/page.tsx` | Theme settings page at /settings/theme |
| `app/api/user/theme/route.ts` | Theme persistence API route |

### Consumer Files Modified

**`app/components/ClientProviders.tsx`:** Removed ThemeProvider wrapper and ThemeScript component. PageTransitionProvider is now a direct child of OnlineStatusProvider. Provider tree simplified to: Auth0 → WebSocket → OnlineStatus → PageTransition → Version → Toast → CommandPalette.

**`app/settings/page.tsx`:** Removed ThemeContent function (~185 LOC), removed useTheme/THEMES/Palette imports, removed Aspetto tab trigger and content. Settings page now has 2 tabs (Posizione, Dispositivi) and defaults to posizione.

**`app/layout.tsx`:** Added `dark` class to html element className. Replaced 25-line `dangerouslySetInnerHTML` script block (which read localStorage) with a single static `<meta name="theme-color" content="#0f172a" />` tag.

## Verification Results

- All 6 theme files confirmed deleted (test ! -f passes for all)
- Zero theme references remain in app/, lib/, or __tests__/ directories
- `html` element has hardcoded `dark` class in className
- Static theme-color meta with `content="#0f172a"` present
- No dangerouslySetInnerHTML, localStorage, or pannello-stufa-theme references remain
- npm test: only failures are in `.claude/worktrees/` (parallel agent workspaces, excluded from verification scope)

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None — all consumer wiring was removed cleanly, no placeholder data flows to UI.

## Commits

| Task | Commit | Message |
|------|--------|---------|
| Task 1 | 13393ca0 | feat(149-01): delete theme infrastructure and fix consumer imports |
| Task 2 | ac8eff79 | feat(149-01): hardcode dark class on html and static theme-color meta |

## Self-Check: PASSED

- `app/layout.tsx`: FOUND (contains `dark` and static theme-color)
- `app/components/ClientProviders.tsx`: FOUND (no ThemeProvider/ThemeScript)
- `app/settings/page.tsx`: FOUND (no Aspetto tab, defaults to posizione)
- Commits 13393ca0 and ac8eff79: FOUND in git log
