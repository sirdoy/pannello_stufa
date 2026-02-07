---
status: resolved
trigger: "The stove page has a mix of dark and light theme elements when using the light theme"
created: 2026-02-07T00:00:00Z
updated: 2026-02-07T00:03:00Z
---

## Current Focus

hypothesis: CONFIRMED AND FIXED
test: All dark-mode-only classes in stove page now have [html:not(.dark)_&] light mode overrides
expecting: All elements render consistently in both dark and light themes
next_action: Archive session

## Symptoms

expected: When light theme is active, ALL elements on the stove page should use light theme colors consistently
actual: Some elements appear in dark theme style while others are in light theme, creating an inconsistent visual experience
errors: No JS errors, purely visual/CSS issue
reproduction: Switch to light theme and navigate to the stove page
started: Likely related to recent TypeScript migration or theme system changes

## Eliminated

## Evidence

- timestamp: 2026-02-07T00:00:30Z
  checked: Theme system architecture
  found: Theme uses .dark class on html. Light mode = html:not(.dark). Semantic CSS vars override in light mode. Card, MaintenanceBar, CronHealthBanner all handle light mode correctly.
  implication: The pattern [html:not(.dark)_&] is the standard approach for light mode in this codebase

- timestamp: 2026-02-07T00:00:45Z
  checked: app/stove/page.tsx hardcoded dark colors
  found: 30+ instances of dark-only styling across 6 categories:
    1. themeColors object: bg gradients (slate-950, ember-950, etc) - dark only
    2. Metrics panels: bg-slate-900/60 - dark only
    3. Text colors: text-slate-400, text-ocean-400, text-ember-400 - dark palette
    4. Progress bars: bg-slate-800 track - dark only
    5. Mode/icon backgrounds: bg-*-900/50 - dark only
    6. Navigation card icons: bg-*-900/50 - dark only
  implication: Root cause confirmed

- timestamp: 2026-02-07T00:02:30Z
  checked: Test suite after fix
  found: 109 suites pass, 2841 tests pass. 22 pre-existing failures (module resolution from TS migration, unrelated to CSS changes)
  implication: Fix introduces no regressions

## Resolution

root_cause: app/stove/page.tsx was designed as dark-first without light mode CSS overrides. The themeColors object used -950 gradient stops, and all inline styling used dark palette colors (bg-slate-900/60, bg-slate-800, bg-*-900/50, text-*-400) without [html:not(.dark)_&] light mode alternatives.

fix: Added [html:not(.dark)_&] light mode overrides to all dark-only classes in app/stove/page.tsx:
  - themeColors object: Added light gradient stops (50-100 range), lighter glow shadows, darker accent text colors (600-700 range), lighter accent backgrounds, and lighter borders
  - Metrics panels (fan/power gauges): bg-white/70, text-slate-500, text-ocean-600, text-ember-600, bg-slate-200 track
  - Mode indicator: bg-white/60 container, *-100 icon backgrounds, *-300 borders, *-700 text colors
  - Fan/Power controls: *-100 icon backgrounds, *-300 borders, *-600 text values, *-400 denominators
  - Navigation cards: *-100 icon backgrounds, *-300 borders, *-600 hover text colors

verification: All dark-mode classes in stove page confirmed to have light mode overrides via grep. Test suite passes (2841 tests, no new failures). Sub-pages (scheduler, maintenance, errors) already have proper theme support.

files_changed: [app/stove/page.tsx]
