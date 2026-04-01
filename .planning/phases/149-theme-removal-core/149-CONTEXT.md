# Phase 149: Theme Removal Core - Context

**Gathered:** 2026-04-01
**Status:** Ready for planning

<domain>
## Phase Boundary

Remove all theme machinery from the codebase: ThemeContext, ThemeProvider, ThemeScript, theme settings page, theme API route, and themeService. Hardcode `class="dark"` on the `<html>` element and set theme-color meta tag to `#0f172a`. After this phase, the app is permanently dark — no runtime theme switching exists.

</domain>

<decisions>
## Implementation Decisions

### Deletion Strategy
- **D-01:** Delete all theme files in a single sweep (ThemeContext, ThemeScript, themeService, settings/theme page, API route, tests) — they are interdependent, removing one breaks the others
- **D-02:** Remove the inline theme script from `app/layout.tsx` `<head>` that reads localStorage and conditionally applies `dark` class

### Settings Page Cleanup
- **D-03:** Remove `app/settings/theme/page.tsx` entirely
- **D-04:** Remove the theme link/entry from the settings hub page (`app/settings/page.tsx`)

### Layout Hardcoding
- **D-05:** Add `class="dark"` directly on the `<html>` element in `app/layout.tsx` (merge with existing className)
- **D-06:** Add a static `<meta name="theme-color" content="#0f172a" />` in the `<head>`, remove any dynamic theme-color logic
- **D-07:** Remove `localStorage.getItem('pannello-stufa-theme')` references — no longer needed

### Provider Tree Cleanup
- **D-08:** Remove `ThemeProvider` wrapper from `app/components/ClientProviders.tsx`
- **D-09:** Remove `ThemeScript` import/usage from `app/components/ClientProviders.tsx`
- **D-10:** Keep all other providers (Auth0, Version, PageTransition, Toast, WebSocket, OnlineStatus) unchanged

### Claude's Discretion
- Ordering of deletions within the single sweep
- Whether to add a brief comment explaining dark-only decision on the html element
- How to handle any remaining imports of useTheme found during grep

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Theme System (files to delete/modify)
- `app/context/ThemeContext.tsx` — ThemeProvider + useTheme hook (DELETE)
- `app/components/ThemeScript.tsx` — Blocking theme script component (DELETE)
- `lib/themeService.ts` — Theme service: getThemePreference, applyThemeToDOM, THEMES (DELETE)
- `__tests__/lib/themeService.test.ts` — Tests for theme service (DELETE)
- `app/settings/theme/page.tsx` — Theme settings page (DELETE)
- `app/api/user/theme/route.ts` — Theme API route GET/POST (DELETE)

### Files to modify
- `app/layout.tsx` — Hardcode `class="dark"` on html, add static theme-color meta, remove inline theme script
- `app/components/ClientProviders.tsx` — Remove ThemeProvider wrapper + ThemeScript import
- `app/settings/page.tsx` — Remove theme settings nav entry

### Requirements
- `.planning/REQUIREMENTS.md` — THEME-01 through THEME-05, THEME-08, THEME-09

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- None needed — this phase is purely deletion + minimal hardcoding

### Established Patterns
- Provider tree in `ClientProviders.tsx` — nested providers pattern, remove ThemeProvider layer
- Settings page hub pattern — card-based links to sub-pages, remove theme entry
- `app/layout.tsx` — html element already has className with font variables, append "dark"

### Integration Points
- `app/layout.tsx:36` — html element where `class="dark"` must be hardcoded
- `app/layout.tsx:52-70` — inline script block to remove entirely
- `app/components/ClientProviders.tsx:5,8` — ThemeProvider/ThemeScript imports to remove
- `app/settings/page.tsx` — theme nav link to remove
- Any component importing `useTheme` from ThemeContext — must grep and clean up

</code_context>

<specifics>
## Specific Ideas

No specific requirements — straightforward deletion and hardcoding per requirements THEME-01 through THEME-05, THEME-08, THEME-09.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 149-theme-removal-core*
*Context gathered: 2026-04-01*
