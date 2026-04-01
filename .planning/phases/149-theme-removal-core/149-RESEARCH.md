# Phase 149: Theme Removal Core - Research

**Researched:** 2026-04-01
**Domain:** Next.js 15 layout hardcoding, React context deletion, CSS cleanup
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Delete all theme files in a single sweep (ThemeContext, ThemeScript, themeService, settings/theme page, API route, tests) — they are interdependent, removing one breaks the others
- **D-02:** Remove the inline theme script from `app/layout.tsx` `<head>` that reads localStorage and conditionally applies `dark` class
- **D-03:** Remove `app/settings/theme/page.tsx` entirely
- **D-04:** Remove the theme link/entry from the settings hub page (`app/settings/page.tsx`)
- **D-05:** Add `class="dark"` directly on the `<html>` element in `app/layout.tsx` (merge with existing className)
- **D-06:** Add a static `<meta name="theme-color" content="#0f172a" />` in the `<head>`, remove any dynamic theme-color logic
- **D-07:** Remove `localStorage.getItem('pannello-stufa-theme')` references — no longer needed
- **D-08:** Remove `ThemeProvider` wrapper from `app/components/ClientProviders.tsx`
- **D-09:** Remove `ThemeScript` import/usage from `app/components/ClientProviders.tsx`
- **D-10:** Keep all other providers (Auth0, Version, PageTransition, Toast, WebSocket, OnlineStatus) unchanged

### Claude's Discretion

- Ordering of deletions within the single sweep
- Whether to add a brief comment explaining dark-only decision on the html element
- How to handle any remaining imports of useTheme found during grep

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| THEME-01 | Light theme CSS variables removed from globals.css (html:not(.dark) block, light body gradient) | globals.css has a large `html:not(.dark)` semantic override block (lines ~332–1203) plus a `html:not(.dark) body` gradient block — both must be deleted |
| THEME-02 | ThemeContext, ThemeProvider, useTheme hook removed | `app/context/ThemeContext.tsx` confirmed — exports ThemeProvider + useTheme; two consumers: ClientProviders.tsx and settings/page.tsx |
| THEME-03 | ThemeScript component removed from layout | `app/components/ThemeScript.tsx` confirmed — used in ClientProviders.tsx (not layout.tsx directly); the inline `<script dangerouslySetInnerHTML>` in layout.tsx is a separate concern (D-02) |
| THEME-04 | Theme settings page removed and nav entry deleted | `app/settings/theme/page.tsx` confirmed; nav entry is a tab in `app/settings/page.tsx` (Aspetto tab + ThemeContent component), not a separate nav link |
| THEME-05 | Theme API route (GET/POST /api/user/theme) removed | `app/api/user/theme/route.ts` confirmed — both GET and POST handlers in single file |
| THEME-08 | class="dark" hardcoded on html element, localStorage theme key removed | html element currently has `className={...font variables...}` + `suppressHydrationWarning`; must append "dark" to className string; localStorage ref is only in ThemeScript and the inline script |
| THEME-09 | theme-color meta tag hardcoded to dark value (#0f172a) | Currently created dynamically by the inline JS script; must become a static `<meta>` in layout.tsx head |
</phase_requirements>

---

## Summary

Phase 149 removes all theme-switching infrastructure from the Pannello Stufa Next.js 15.5 app and permanently hardcodes the dark theme. The work is purely destructive (deletions) plus two small surgical edits to `app/layout.tsx` and `app/components/ClientProviders.tsx`, and one moderate edit to `app/settings/page.tsx`.

The full inventory of files to delete is six: `app/context/ThemeContext.tsx`, `app/components/ThemeScript.tsx`, `lib/themeService.ts`, `__tests__/lib/themeService.test.ts`, `app/settings/theme/page.tsx`, and `app/api/user/theme/route.ts`. Every file has been read and confirmed to exist with the exact content described in CONTEXT.md.

The critical complexity in this phase is `app/settings/page.tsx`, which is NOT a simple file deletion. It is the unified settings hub that inlines a `ThemeContent` component (importing `useTheme` and `THEMES`) as one of three tabs. The theme tab must be surgically removed — the `ThemeContent` function, its imports (`useTheme`, `THEMES`, `Palette` icon), the Aspetto tab trigger, and the Aspetto tab content panel — while leaving the Location and Devices tabs untouched. This is the highest-risk edit.

**Primary recommendation:** Delete the six theme files first, then fix the two high-risk consumers (`ClientProviders.tsx` and `settings/page.tsx`), then make the two surgical layout edits (`layout.tsx`). Run `npm test` at the end to confirm no remaining imports of deleted modules.

---

## Standard Stack

No new libraries required. This phase uses only existing Next.js 15.5 primitives: static `className` props on the `<html>` element and static `<meta>` tags.

### Installation

No installation needed.

---

## Architecture Patterns

### Next.js html Element — Static className Pattern

The `<html>` element in `app/layout.tsx` currently reads:

```tsx
// Current (line 36)
<html lang="it" data-scroll-behavior="smooth"
  className={`${outfit.variable} ${spaceGrotesk.variable}`}
  suppressHydrationWarning>
```

After the change it must read:

```tsx
// After (D-05 + keep suppressHydrationWarning)
<html lang="it" data-scroll-behavior="smooth"
  className={`${outfit.variable} ${spaceGrotesk.variable} dark`}
  suppressHydrationWarning>
```

`suppressHydrationWarning` stays because the font variables are still dynamic (template literals). Appending the static string `" dark"` inside the template literal is safe and does not change hydration behavior.

### Static theme-color Meta Tag Pattern (D-06)

The current inline script (lines 52–76 in layout.tsx) dynamically creates or updates a `<meta name="theme-color">` element. After removal, a static meta tag in `<head>` replaces it:

```tsx
// Add inside <head> after removing the <script> block
<meta name="theme-color" content="#0f172a" />
```

This is the dark value from `themeService.ts` line 141: `const themeColor = theme === THEMES.DARK ? '#0f172a' : '#f8fafc'`.

### ClientProviders.tsx — Provider Tree Surgery (D-08, D-09)

Current provider nesting (lines 54–75):

```tsx
<Auth0Provider user={MOCK_USER}>
  <WebSocketContext.Provider value={wsManager}>
    <OnlineStatusProvider>
      <ThemeScript />          // DELETE
      <ThemeProvider>          // DELETE wrapper, keep children
      <PageTransitionProvider>
        ...
      </PageTransitionProvider>
      </ThemeProvider>         // DELETE
    </OnlineStatusProvider>
  </WebSocketContext.Provider>
</Auth0Provider>
```

After removal, `<PageTransitionProvider>` becomes a direct child of `<OnlineStatusProvider>`. Remove lines 5 (`ThemeProvider` import), 8 (`ThemeScript` import), 56 (`<ThemeScript />`), 57 (`<ThemeProvider>`), and 71 (`</ThemeProvider>`).

### settings/page.tsx — Tab Surgery (D-04 + THEME-02 consumer)

`app/settings/page.tsx` is the more complex edit. It imports and uses theme machinery in multiple places:

- **Line 17:** `import { useTheme } from '@/app/context/ThemeContext';`
- **Line 18:** `import { THEMES } from '@/lib/themeService';`
- **Line 29:** `import { Palette, MapPin, Smartphone, ChevronUp, ChevronDown } from 'lucide-react';` — `Palette` is only used by the Aspetto tab trigger; remove `Palette` from this import
- **Lines 34–215:** `function ThemeContent() { ... }` — entire function DELETE
- **Lines 700–713:** `SettingsPageContent` render — remove the Aspetto Tabs.Trigger and Tabs.Content lines:
  ```tsx
  // DELETE these two lines:
  <Tabs.Trigger value="aspetto" icon={<Palette size={18} />}>Aspetto</Tabs.Trigger>
  <Tabs.Content value="aspetto"><ThemeContent /></Tabs.Content>
  ```
- **Line 672:** `const currentTab = searchParams.get('tab') || 'aspetto';` — change default tab from `'aspetto'` to `'posizione'` (or `'dispositivi'`) since Aspetto tab no longer exists

### globals.css — Light Mode Block Removal (THEME-01)

The `app/globals.css` contains a large `html:not(.dark)` section spanning from approximately line 332 to line 1203. The planner must specify exact line ranges. Key blocks to remove:

1. `html:not(.dark) body { background: linear-gradient(...) }` — lines ~332–341
2. `html:not(.dark) ::-webkit-scrollbar-thumb { ... }` — lines ~393–401
3. `/* ===== LIGHT MODE SEMANTIC OVERRIDES ===== */` block starting with `html:not(.dark) { ... }` — approximately lines 403–1203
4. `/* Smooth transitions for theme changes */` `* { @apply transition-colors duration-200; }` — lines ~344–346 — this can also be removed since there is no theme switching

**Important:** The `html:not(.dark)` blocks are interspersed throughout the file (they appear many times, not in one contiguous section). Grep is required to get exact line numbers before editing.

### Anti-Patterns to Avoid

- **Do not** remove `suppressHydrationWarning` from `<html>` — still needed for font className template literal
- **Do not** remove `suppressHydrationWarning` from `<body>` — it has dynamic className too
- **Do not** change the default tab to a hardcoded string without verifying valid tab values (`'posizione'` or `'dispositivi'`)
- **Do not** leave stale `Palette` icon import in settings/page.tsx after removing the Aspetto tab

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead |
|---------|-------------|-------------|
| Static dark class on html | Dynamic JS that adds dark class | Inline `" dark"` in className template literal |
| Static theme-color | JS that creates meta dynamically | Static `<meta name="theme-color" content="#0f172a" />` |

---

## Runtime State Inventory

| Category | Items Found | Action Required |
|----------|-------------|-----------------|
| Stored data | Firebase RTDB: `users/{userId}/preferences/theme` keys storing 'light' or 'dark' | No code action — data becomes orphaned (harmless); no migration needed since theme route is deleted |
| Live service config | None — theme is a client-side concern only | None |
| OS-registered state | None | None |
| Secrets/env vars | None — no env vars reference theme | None |
| Build artifacts | None | None |

The `pannello-stufa-theme` localStorage key will remain in users' browsers but has no effect once ThemeScript and ThemeContext are removed. No client-side cleanup is needed.

---

## Common Pitfalls

### Pitfall 1: settings/page.tsx Has Inline ThemeContent, Not Just a Nav Link

**What goes wrong:** Implementer deletes `app/settings/theme/page.tsx` and removes a nav link but misses the `ThemeContent` function (lines 34–215) and the `useTheme`/`THEMES` imports still inside `app/settings/page.tsx`. Build fails with "Module not found: Can't resolve '@/app/context/ThemeContext'".

**Why it happens:** The settings page was refactored to inline the theme content as a tab rather than link to a separate page. The standalone `theme/page.tsx` still exists but `settings/page.tsx` does NOT import from it — it has its own copy of the theme UI.

**How to avoid:** After deleting theme files, grep for remaining `useTheme` and `THEMES` imports and fix each one. The planner should list `app/settings/page.tsx` as a file requiring THREE changes: remove imports, remove `ThemeContent` function, remove tab trigger + content.

**Warning signs:** TypeScript/build errors referencing ThemeContext or themeService from settings/page.tsx.

### Pitfall 2: Default Tab Becomes Invalid

**What goes wrong:** After removing the Aspetto tab, the URL `/settings` (or `/settings?tab=aspetto`) renders an empty content area because `currentTab` defaults to `'aspetto'` and no matching `Tabs.Content` exists.

**Why it happens:** Line 672: `const currentTab = searchParams.get('tab') || 'aspetto'` — the fallback is hardcoded to the tab that no longer exists.

**How to avoid:** Change the default to `'posizione'` (first remaining tab).

**Warning signs:** Settings page shows no content on first load.

### Pitfall 3: Orphaned suppressHydrationWarning Removal

**What goes wrong:** Implementer removes `suppressHydrationWarning` from `<html>` thinking it was only there for theme script, causing React hydration warnings in development.

**Why it happens:** `suppressHydrationWarning` is needed on `<html>` whenever `className` is a template literal that evaluates differently server-side vs client-side (font variables use `__next_*` CSS variable names). The theme removal does not eliminate this difference.

**How to avoid:** Leave `suppressHydrationWarning` on both `<html>` and `<body>` unchanged.

### Pitfall 4: Palette Icon Left in Import After Tab Removal

**What goes wrong:** `Palette` is imported from lucide-react on line 29 of settings/page.tsx but is only used in the Aspetto tab trigger. After removing the tab, the import becomes unused, causing a TypeScript strict-mode error.

**How to avoid:** Edit the lucide-react import to remove `Palette` while keeping `MapPin`, `Smartphone`, `ChevronUp`, `ChevronDown`.

### Pitfall 5: Inline Theme Script Removal Leaves No theme-color Meta

**What goes wrong:** The inline `<script dangerouslySetInnerHTML>` block is the ONLY place `<meta name="theme-color">` is set. If the script is removed without adding a static meta tag, the iOS PWA status bar loses its configured color.

**How to avoid:** Add `<meta name="theme-color" content="#0f172a" />` to `<head>` in the same edit that removes the script block (D-06).

---

## Code Examples

### layout.tsx Final html Element

```tsx
// Source: app/layout.tsx direct code reading
<html
  lang="it"
  data-scroll-behavior="smooth"
  className={`${outfit.variable} ${spaceGrotesk.variable} dark`}
  suppressHydrationWarning
>
```

### layout.tsx Static Meta Tag (replace the entire script block)

```tsx
// Replaces lines 52-76 in app/layout.tsx
<meta name="theme-color" content="#0f172a" />
```

### ClientProviders.tsx After Cleanup

```tsx
// Lines 1-17 imports after removal:
'use client';
import { Auth0Provider } from '@auth0/nextjs-auth0/client';
import { VersionProvider } from '@/app/context/VersionContext';
// ThemeProvider import: DELETE
import { PageTransitionProvider } from '@/app/context/PageTransitionContext';
import { ToastProvider } from '@/app/components/ui';
// ThemeScript import: DELETE
...

// Provider tree after removal:
<Auth0Provider user={MOCK_USER}>
  <WebSocketContext.Provider value={wsManager}>
    <OnlineStatusProvider>
      {/* ThemeScript: DELETE */}
      {/* ThemeProvider: DELETE wrapper */}
      <PageTransitionProvider>
        <VersionProvider>
          ...
        </VersionProvider>
      </PageTransitionProvider>
      {/* </ThemeProvider>: DELETE */}
    </OnlineStatusProvider>
  </WebSocketContext.Provider>
</Auth0Provider>
```

### settings/page.tsx Default Tab Fix

```tsx
// Line 672 — change 'aspetto' to 'posizione'
const currentTab = searchParams.get('tab') || 'posizione';
```

---

## State of the Art

No new APIs introduced. This phase is internal cleanup of a custom-built theme system.

---

## Environment Availability

Step 2.6: SKIPPED (no external dependencies — phase is code/file deletion + static HTML edits only).

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Jest (jest.config.ts) + jest-environment-jsdom |
| Config file | `/Users/federicomanfredi/Sites/localhost/pannello-stufa/jest.config.ts` |
| Quick run command | `npm test -- --testPathPattern="themeService" --passWithNoTests` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| THEME-01 | globals.css has no `html:not(.dark)` blocks | manual grep check | `grep -c "html:not(.dark)" app/globals.css` (expect 0) | N/A |
| THEME-02 | ThemeContext module does not exist | build error / file absence | `test ! -f app/context/ThemeContext.tsx` | N/A |
| THEME-03 | ThemeScript module does not exist | file absence | `test ! -f app/components/ThemeScript.tsx` | N/A |
| THEME-04 | /settings/theme returns 404 | manual / smoke test | Playwright E2E (smoke suite) | existing |
| THEME-05 | /api/user/theme returns 404 | manual / smoke test | `curl -s localhost:3000/api/user/theme` | N/A |
| THEME-08 | html element has class="dark" hardcoded | unit test (new) | Jest DOM assertion | ❌ Wave 0 |
| THEME-09 | theme-color meta = #0f172a | unit test (new) | Jest DOM assertion | ❌ Wave 0 |

### Wave 0 Gaps

- [ ] `__tests__/lib/themeService.test.ts` — DELETE this file (tests a deleted module; keeping it causes test failure)
- [ ] No new test files are strictly required for THEME-08/09 since the `class="dark"` is a static string in a Server Component — it cannot be unit-tested with Jest (no JSDOM rendering of RSC). Validation is via browser inspection or Playwright smoke test.

The most important Wave 0 action is DELETING `__tests__/lib/themeService.test.ts` — failing to do so will cause `npm test` to error on "Cannot find module '@/lib/themeService'".

---

## Open Questions

1. **`* { @apply transition-colors duration-200; }` in globals.css**
   - What we know: This rule is in the "Smooth transitions for theme changes" comment block and makes all elements animate color changes.
   - What's unclear: Whether this rule should also be removed (it only made sense for theme switching) or kept (it might provide subtle UI polish elsewhere).
   - Recommendation: Remove it — it adds a 200ms CSS transition overhead to every element on every render, and it only existed for theme switching. If kept, it's harmless but wasteful.

2. **Firebase orphaned theme data**
   - What we know: `users/{userId}/preferences/theme` keys exist in Firebase RTDB for any user who previously selected a theme.
   - What's unclear: Whether a cleanup migration is needed.
   - Recommendation: No cleanup needed for this phase. The data is orphaned (no code reads it anymore) but harmless.

---

## Sources

### Primary (HIGH confidence)
- Direct file reads of all six deletion targets — confirmed content matches CONTEXT.md description
- Direct file read of `app/layout.tsx` — confirmed inline script at lines 52–76, html className at line 36
- Direct file read of `app/components/ClientProviders.tsx` — confirmed ThemeProvider wraps at lines 57/71, ThemeScript at line 56
- Direct file read of `app/settings/page.tsx` — confirmed ThemeContent inline component + Aspetto tab + useTheme/THEMES imports
- Direct file read of `app/globals.css` — confirmed `html:not(.dark)` blocks throughout

### Secondary (MEDIUM confidence)
- grep scan of entire codebase for `useTheme|ThemeContext|ThemeProvider|ThemeScript|themeService|pannello-stufa-theme` — 18 files found, 8 are in `.claude/worktrees/` (agent worktrees, not production code), 10 are production files all already identified in CONTEXT.md

---

## Metadata

**Confidence breakdown:**
- Files to delete: HIGH — all six files read and confirmed
- settings/page.tsx complexity: HIGH — full file read, inline ThemeContent function identified
- layout.tsx edits: HIGH — exact line content confirmed
- ClientProviders.tsx edits: HIGH — exact provider tree confirmed
- globals.css scope: HIGH — `html:not(.dark)` blocks confirmed via grep
- Test cleanup: HIGH — themeService.test.ts will fail if not deleted

**Research date:** 2026-04-01
**Valid until:** This is an internal codebase snapshot — valid indefinitely (no external library versions involved).
