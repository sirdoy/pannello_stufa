---
phase: 174-ember-glass-tokens-foundations
plan: 02
type: execute
wave: 1
depends_on: []
files_modified:
  - app/layout.tsx
  - app/components/EmberGlass/AmbientBg.tsx
  - app/components/EmberGlass/__tests__/AmbientBg.test.tsx
autonomous: true
requirements: [DS-03, DS-05]
tags: [ambient-glow, layout, prepaint-script, localStorage, ember-glass]

must_haves:
  truths:
    - "Inline pre-paint <script> in <head> reads localStorage 'ember-glass-accent' and applies via document.documentElement.style.setProperty('--accent', value)"
    - "Inline pre-paint <script> reads localStorage 'ember-glass-ambient' and sets document.documentElement.dataset.ambient='on' if 'true'"
    - "<AmbientBg /> mounts as the FIRST child of <body> at z-index 0 with pointer-events: none"
    - "<AmbientBg /> renders nothing when data-ambient is unset/'off' (DS-05 default OFF)"
    - "<AmbientBg /> renders 3 fixed-position blob divs when data-ambient='on'"
    - "<AmbientBg /> listens for 'ember-glass-ambient-change' CustomEvent and updates state without reload"
    - "<AmbientBg /> divs are aria-hidden=true (decorative)"
    - "app/layout.tsx imports `inter` (not `spaceGrotesk`) and applies inter.variable on <html>"
  artifacts:
    - path: "app/components/EmberGlass/AmbientBg.tsx"
      provides: "Client provider that renders ambient gradient blobs based on data-ambient + custom event"
      exports: ["default"]
    - path: "app/components/EmberGlass/__tests__/AmbientBg.test.tsx"
      provides: "Unit test: default off, data-ambient=on renders 3 blobs, custom event toggles, listener cleanup"
    - path: "app/layout.tsx"
      provides: "Inline pre-paint <script> + <AmbientBg /> mount + Inter import wiring"
      contains: "ember-glass-accent, ember-glass-ambient, AmbientBg, inter.variable"
  key_links:
    - from: "app/layout.tsx <head> inline script"
      to: "<html>.dataset.ambient + <html>.style.--accent"
      via: "documentElement DOM API before first paint"
      pattern: "document\\.documentElement\\.(style\\.setProperty|dataset\\.ambient)"
    - from: "app/components/EmberGlass/AmbientBg.tsx"
      to: "window 'ember-glass-ambient-change' event"
      via: "addEventListener in useEffect"
      pattern: "ember-glass-ambient-change"
---

<objective>
Wire the runtime layer for Ember Glass tokens: insert the inline pre-paint `<script>` in `app/layout.tsx` `<head>` (D-08, D-15) so persisted `--accent` and `data-ambient` are applied before first paint (no flash); create the `<AmbientBg />` client provider (D-12, D-15) and mount it as the first child of `<body>` (z-index 0, behind app shell); and update `app/layout.tsx` to import `inter` (not `spaceGrotesk`) and apply `${outfit.variable} ${inter.variable}` on `<html>`.

Purpose: The token block from Plan 01 needs a hydration mechanism so user-overridden accent + ambient state survive hard reload. The ambient layer is the only visual demonstration of `--accent` driving real animation. No visual change for users who never visit `/debug/design-system-v2` (default OFF per D-14).

Output: New `app/components/EmberGlass/AmbientBg.tsx` (client provider) + colocated unit test + edits to `app/layout.tsx` (import, html className, head script, body first-child mount).
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/STATE.md
@.planning/phases/174-ember-glass-tokens-foundations/174-CONTEXT.md
@.planning/phases/174-ember-glass-tokens-foundations/174-RESEARCH.md
@.planning/phases/174-ember-glass-tokens-foundations/174-PATTERNS.md
@.planning/phases/174-ember-glass-tokens-foundations/174-UI-SPEC.md
@.planning/phases/174-ember-glass-tokens-foundations/174-VALIDATION.md
@CLAUDE.md
@app/layout.tsx
@app/components/MaintenanceBar.tsx
@app/components/PWAInitializer.tsx
@app/components/layout/__tests__/CommandPaletteProvider.test.tsx

<interfaces>
<!-- Existing app/layout.tsx import + className wiring (lines 3, 36 — same-file edit): -->
```typescript
import { outfit, spaceGrotesk } from './fonts';
// ...
<html lang="it" data-scroll-behavior="smooth" className={`${outfit.variable} ${spaceGrotesk.variable} dark`} suppressHydrationWarning>
```
<!-- After edit: -->
```typescript
import { outfit, inter } from './fonts';
import AmbientBg from './components/EmberGlass/AmbientBg';
// ...
<html lang="it" data-scroll-behavior="smooth" className={`${outfit.variable} ${inter.variable} dark`} suppressHydrationWarning>
```

<!-- AmbientBg public surface (no props): -->
```typescript
export default function AmbientBg(): JSX.Element | null;
```

<!-- Custom event contract (Plan 03 dispatches, AmbientBg listens): -->
```typescript
// Picker page dispatches:
window.dispatchEvent(new CustomEvent<boolean>('ember-glass-ambient-change', { detail: true }));
// AmbientBg listens:
window.addEventListener('ember-glass-ambient-change', (e: Event) => {
  setOn((e as CustomEvent<boolean>).detail);
});
```
</interfaces>
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Create AmbientBg client provider with custom-event wiring + reduced-motion support (D-12, D-13, D-15)</name>
  <files>app/components/EmberGlass/AmbientBg.tsx, app/components/EmberGlass/__tests__/AmbientBg.test.tsx</files>
  <read_first>
    - app/components/MaintenanceBar.tsx (analog: 'use client' + useEffect + localStorage pattern, lines 1-60)
    - app/components/PWAInitializer.tsx (analog: side-effect-only client provider mounted from layout.tsx, lines 1-96)
    - app/components/layout/__tests__/CommandPaletteProvider.test.tsx (analog: provider unit test with TestHarness pattern, lines 1-85)
    - .planning/phases/174-ember-glass-tokens-foundations/174-CONTEXT.md D-12, D-13, D-14, D-15
    - .planning/phases/174-ember-glass-tokens-foundations/174-RESEARCH.md §"Pattern 7: Ambient Provider with Pre-Paint Sync" + §"Pitfall 3: Z-Index Layering" + §"Pitfall 4: localStorage Disabled"
    - .planning/phases/174-ember-glass-tokens-foundations/174-UI-SPEC.md §"Color → Ambient layer (DS-05) — visual contract" (3 blobs: positions, sizes, opacities, mix-targets, animation timings)
    - .planning/phases/174-ember-glass-tokens-foundations/174-PATTERNS.md §"app/components/EmberGlass/AmbientBg.tsx" + §"app/components/EmberGlass/AmbientBg.test.tsx"
  </read_first>
  <behavior>
    - Test 1: Renders `null` (or empty fragment) when `document.documentElement.dataset.ambient` is unset (default OFF per D-14)
    - Test 2: Renders a wrapper div with 3 blob children when `document.documentElement.dataset.ambient === 'on'` at mount
    - Test 3: After dispatching `new CustomEvent('ember-glass-ambient-change', { detail: true })` on window, the component re-renders showing the 3 blobs
    - Test 4: After dispatching `new CustomEvent('ember-glass-ambient-change', { detail: false })` on window, the component re-renders showing nothing
    - Test 5: Wrapper div has `aria-hidden="true"` (decorative)
    - Test 6: Each blob div has class `ember-ambient-blob` (so the `prefers-reduced-motion` rule from Plan 01's globals.css applies)
    - Test 7: On unmount, the `ember-glass-ambient-change` listener is removed (no leak — verify by spying `removeEventListener`)
    - Test 8: Console error spy: mounting + dispatching events produces zero `console.error` calls
  </behavior>
  <action>
**Step 1 — Write the failing tests first** at `app/components/EmberGlass/__tests__/AmbientBg.test.tsx`:

```typescript
import { render, act } from '@testing-library/react';
import AmbientBg from '../AmbientBg';

describe('AmbientBg (Phase 174 — DS-05)', () => {
  beforeEach(() => {
    delete document.documentElement.dataset.ambient;
  });

  it('renders nothing when data-ambient is unset (D-14 default OFF)', () => {
    const { container } = render(<AmbientBg />);
    expect(container.firstChild).toBeNull();
  });

  it('renders 3 blob divs when data-ambient="on" at mount', () => {
    document.documentElement.dataset.ambient = 'on';
    const { container } = render(<AmbientBg />);
    const wrapper = container.querySelector('[aria-hidden="true"]');
    expect(wrapper).not.toBeNull();
    const blobs = container.querySelectorAll('.ember-ambient-blob');
    expect(blobs.length).toBe(3);
  });

  it('responds to ember-glass-ambient-change event with detail=true', () => {
    const { container } = render(<AmbientBg />);
    expect(container.firstChild).toBeNull();
    act(() => {
      window.dispatchEvent(new CustomEvent<boolean>('ember-glass-ambient-change', { detail: true }));
    });
    const blobs = container.querySelectorAll('.ember-ambient-blob');
    expect(blobs.length).toBe(3);
  });

  it('responds to ember-glass-ambient-change event with detail=false', () => {
    document.documentElement.dataset.ambient = 'on';
    const { container } = render(<AmbientBg />);
    expect(container.querySelectorAll('.ember-ambient-blob').length).toBe(3);
    act(() => {
      window.dispatchEvent(new CustomEvent<boolean>('ember-glass-ambient-change', { detail: false }));
    });
    expect(container.firstChild).toBeNull();
  });

  it('wrapper has aria-hidden="true" (decorative)', () => {
    document.documentElement.dataset.ambient = 'on';
    const { container } = render(<AmbientBg />);
    const wrapper = container.querySelector('[aria-hidden="true"]');
    expect(wrapper).not.toBeNull();
  });

  it('cleans up event listener on unmount', () => {
    const removeSpy = jest.spyOn(window, 'removeEventListener');
    const { unmount } = render(<AmbientBg />);
    unmount();
    expect(removeSpy).toHaveBeenCalledWith('ember-glass-ambient-change', expect.any(Function));
    removeSpy.mockRestore();
  });

  it('mounts without console errors', () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    document.documentElement.dataset.ambient = 'on';
    render(<AmbientBg />);
    act(() => {
      window.dispatchEvent(new CustomEvent<boolean>('ember-glass-ambient-change', { detail: false }));
    });
    expect(errorSpy).not.toHaveBeenCalled();
    errorSpy.mockRestore();
  });
});
```

**Step 2 — Run the tests to confirm they fail (RED):**
```bash
npm test -- app/components/EmberGlass/__tests__/AmbientBg.test.tsx
```
Expected: import fails because `AmbientBg.tsx` does not yet exist.

**Step 3 — Implement `app/components/EmberGlass/AmbientBg.tsx` to make the tests pass (GREEN):**

```typescript
'use client';

import { useEffect, useState } from 'react';

/**
 * AmbientBg — Phase 174 (DS-05)
 *
 * Renders three radial-gradient blob divs at z-index 0 behind the app shell when
 * `<html data-ambient="on">` is set (by the inline pre-paint script in app/layout.tsx
 * on hard reload, or by the picker on /debug/design-system-v2 dispatching
 * `ember-glass-ambient-change` events).
 *
 * Initial state mirrors document.documentElement.dataset.ambient so there is zero
 * flash on hard reload (the inline script runs before paint, sets the attribute,
 * and useState's initializer reads it synchronously).
 *
 * Blob geometry + colors lifted from the design bundle:
 *   .planning/inbox/ember-glass-design/project/components/app.jsx:175-200
 *
 * AUDIT-EXCEPTION (DS-02): blob B mix-target #301010 and blob C static rgba color
 * are intentional non-token literals per UI-SPEC §"Claude's Discretion".
 */
export default function AmbientBg(): React.ReactElement | null {
  const [on, setOn] = useState<boolean>(() => {
    if (typeof document === 'undefined') return false;
    return document.documentElement.dataset.ambient === 'on';
  });

  useEffect(() => {
    const handler = (e: Event): void => {
      const detail = (e as CustomEvent<boolean>).detail;
      setOn(Boolean(detail));
    };
    window.addEventListener('ember-glass-ambient-change', handler);
    return () => {
      window.removeEventListener('ember-glass-ambient-change', handler);
    };
  }, []);

  if (!on) return null;

  return (
    <div
      aria-hidden="true"
      style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden' }}
    >
      <div
        className="ember-ambient-blob"
        style={{
          position: 'fixed',
          top: -60,
          left: -60,
          width: 320,
          height: 320,
          borderRadius: 999,
          filter: 'blur(60px)',
          opacity: 0.5,
          background:
            'radial-gradient(circle, color-mix(in oklab, var(--accent) 60%, transparent) 0%, transparent 70%)',
          animation: 'ambientA 14s ease-in-out infinite',
        }}
      />
      <div
        className="ember-ambient-blob"
        style={{
          position: 'fixed',
          bottom: 120,
          right: -80,
          width: 360,
          height: 360,
          borderRadius: 999,
          filter: 'blur(70px)',
          opacity: 0.4,
          // AUDIT-EXCEPTION (DS-02): #301010 lifted verbatim from design bundle app.jsx:184
          background:
            'radial-gradient(circle, color-mix(in oklab, var(--accent) 40%, #301010) 0%, transparent 70%)',
          animation: 'ambientB 18s ease-in-out infinite',
        }}
      />
      <div
        className="ember-ambient-blob"
        style={{
          position: 'fixed',
          top: '40%',
          left: '30%',
          width: 260,
          height: 260,
          borderRadius: 999,
          filter: 'blur(80px)',
          opacity: 0.4,
          // AUDIT-EXCEPTION (DS-02): static cool-blue counterpoint per UI-SPEC §Color
          background: 'radial-gradient(circle, rgba(94, 175, 255, 0.25) 0%, transparent 70%)',
          animation: 'ambientC 22s ease-in-out infinite',
        }}
      />
    </div>
  );
}
```

**Step 4 — Run the tests again to confirm they pass:**
```bash
npm test -- app/components/EmberGlass/__tests__/AmbientBg.test.tsx
```

Notes:
- The component reads `dataset.ambient` synchronously in `useState`'s initializer to mirror what the inline pre-paint script (Task 2) sets — zero flash on hard reload.
- It does NOT read localStorage directly. The inline script owns localStorage reads for the pre-paint phase; the picker (Plan 03) owns localStorage writes; the custom event is the sync channel between picker and AmbientBg in-session.
- Three documented `// AUDIT-EXCEPTION` comments explain the non-token literals (per UI-SPEC §"Audit gate" and §"Claude's Discretion"). DS-02 audit must skip lines tagged with `// AUDIT-EXCEPTION`.
- Class `ember-ambient-blob` matches the `prefers-reduced-motion` rule added in Plan 01.
- No localStorage access in the component itself = no try/catch needed (Pitfall 4 sidestepped at this layer).
  </action>
  <verify>
    <automated>npm test -- app/components/EmberGlass/__tests__/AmbientBg.test.tsx</automated>
  </verify>
  <acceptance_criteria>
    - File `app/components/EmberGlass/AmbientBg.tsx` exists
    - File `app/components/EmberGlass/__tests__/AmbientBg.test.tsx` exists
    - `grep -c "'use client'" app/components/EmberGlass/AmbientBg.tsx` returns 1
    - `grep -c "ember-glass-ambient-change" app/components/EmberGlass/AmbientBg.tsx` returns at least 2 (addEventListener + removeEventListener)
    - `grep -c "ember-ambient-blob" app/components/EmberGlass/AmbientBg.tsx` returns 3
    - `grep -c "aria-hidden" app/components/EmberGlass/AmbientBg.tsx` returns 1 (the wrapper)
    - `grep -c "AUDIT-EXCEPTION" app/components/EmberGlass/AmbientBg.tsx` returns 2 (blob B #301010 + blob C rgba blue)
    - `grep -E "var\(--accent\)" app/components/EmberGlass/AmbientBg.tsx` matches at least 2 lines (blob A + blob B)
    - `grep -c "color-mix(in oklab" app/components/EmberGlass/AmbientBg.tsx` returns at least 2
    - `grep -E "animation: ambientA 14s" app/components/EmberGlass/AmbientBg.tsx` matches 1
    - `grep -E "animation: ambientB 18s" app/components/EmberGlass/AmbientBg.tsx` matches 1
    - `grep -E "animation: ambientC 22s" app/components/EmberGlass/AmbientBg.tsx` matches 1
    - `npm test -- app/components/EmberGlass/__tests__/AmbientBg.test.tsx` exits 0 with all 7 test cases passing
  </acceptance_criteria>
  <done>
    - AmbientBg client provider exists at the path declared in CONTEXT.md D-15.
    - Default-OFF semantics verified by unit test (D-14).
    - Custom event listener attached + cleaned up (no leak).
    - Three blobs render with correct positions, sizes, animation names, and accent-driven backgrounds.
    - Two AUDIT-EXCEPTION comments in place; no other hardcoded hex/blur values in the file (DS-02 audit will pass).
    - All 7 unit tests green.
  </done>
</task>

<task type="auto">
  <name>Task 2: Wire app/layout.tsx — import inter, apply variables on html, mount AmbientBg, add inline pre-paint script (D-08, D-15, DS-04, DS-05)</name>
  <files>app/layout.tsx</files>
  <read_first>
    - app/layout.tsx (current state — same-file edit; lines 1-76 per PATTERNS.md)
    - .planning/phases/174-ember-glass-tokens-foundations/174-CONTEXT.md D-08, D-09, D-10, D-15
    - .planning/phases/174-ember-glass-tokens-foundations/174-RESEARCH.md §"Pattern 2: Inline Pre-Paint Script for Hydration" + §"Example 3: layout.tsx Edits" + §"Pitfall 2: Pre-Paint Script Runs on Server" + §"Pitfall 3: Z-Index Layering"
    - .planning/phases/174-ember-glass-tokens-foundations/174-PATTERNS.md §"app/layout.tsx (layout modify)"
  </read_first>
  <action>
Make five EDITS to `app/layout.tsx` (do not rewrite the whole file — preserve all existing imports, metadata, ClientProviders, Navbar, Footer, AppleSplashScreens, etc.):

**Edit 1 — Update font import (line 3 in current file):**

Replace:
```typescript
import { outfit, spaceGrotesk } from './fonts';
```
with:
```typescript
import { outfit, inter } from './fonts';
```

**Edit 2 — Add AmbientBg import:**

Add a sibling import (alongside the other component imports near the top of the file):
```typescript
import AmbientBg from './components/EmberGlass/AmbientBg';
```

**Edit 3 — Update `<html>` className (currently around line 36):**

Replace:
```tsx
<html lang="it" data-scroll-behavior="smooth" className={`${outfit.variable} ${spaceGrotesk.variable} dark`} suppressHydrationWarning>
```
with:
```tsx
<html lang="it" data-scroll-behavior="smooth" className={`${outfit.variable} ${inter.variable} dark`} suppressHydrationWarning>
```

**Edit 4 — Insert inline pre-paint `<script>` as the FIRST child of `<head>`:**

Inside the existing `<head>` block, insert the script BEFORE the existing `<meta name="view-transition" content="same-origin" />` (so it runs before any other head element):

```tsx
<script
  dangerouslySetInnerHTML={{
    __html: `(function(){try{var a=localStorage.getItem('ember-glass-accent');var amb=localStorage.getItem('ember-glass-ambient');if(a){document.documentElement.style.setProperty('--accent',a);}if(amb==='true'){document.documentElement.dataset.ambient='on';}}catch(e){}})();`
  }}
/>
```

Notes on the script:
- IIFE wrapped in try/catch (Pitfall 2 + Pitfall 4 — handles SSR safety + localStorage disabled gracefully).
- ONE static string literal — no template-string interpolation of any user/runtime variable. This is the threat-model mitigation for the `dangerouslySetInnerHTML` XSS surface.
- Reads two known localStorage keys (`ember-glass-accent`, `ember-glass-ambient`) and applies them via `style.setProperty('--accent', value)` and `dataset.ambient='on'`.
- The accent value is applied DIRECTLY without validation. Threat-model row T-174-02-02 accepts this on the basis that localStorage is same-origin only and CSS custom properties cannot trigger code execution. (A future hardening phase may add an allowlist check, but introducing it now would require duplicating the 6-preset map in the inline script and is out of phase 174 scope per D-08.)

**Edit 5 — Mount `<AmbientBg />` as the FIRST child of `<body>`:**

Inside the `<body>` JSX, insert `<AmbientBg />` as the first child, BEFORE the existing skip-link (`<a href="#main-content">…`):

```tsx
<body className="min-h-screen bg-slate-900 text-slate-100 flex flex-col" suppressHydrationWarning>
  <AmbientBg />
  <a href="#main-content" className="…">Salta al contenuto</a>
  {/* ... existing ClientProviders, Navbar, main, Footer ... */}
</body>
```

`<AmbientBg />` is `position: fixed; z-index: 0; pointer-events: none` (per Task 1 implementation), so it sits behind all positioned content without disrupting flex layout (fixed elements are taken out of flow — Pitfall 3 sidestepped).

Do NOT touch any other line in `app/layout.tsx`. Do NOT remove existing meta tags, AppleSplashScreens, preconnect links, theme-color, or skip-link. Do NOT modify ClientProviders / WebVitals / VersionEnforcer / Navbar / Footer wiring.
  </action>
  <verify>
    <automated>bash -c "set -e; F=app/layout.tsx; grep -q \"import { outfit, inter } from './fonts'\" \$F || (echo 'Inter import missing'; exit 1); grep -q \"import AmbientBg from\" \$F || (echo 'AmbientBg import missing'; exit 1); grep -q 'spaceGrotesk' \$F && (echo 'spaceGrotesk still referenced'; exit 1); grep -q 'inter.variable' \$F || (echo 'inter.variable not applied to html'; exit 1); grep -q 'ember-glass-accent' \$F || (echo 'pre-paint script missing accent key'; exit 1); grep -q 'ember-glass-ambient' \$F || (echo 'pre-paint script missing ambient key'; exit 1); grep -q '<AmbientBg' \$F || (echo 'AmbientBg not mounted'; exit 1); echo 'OK'"</automated>
  </verify>
  <acceptance_criteria>
    - `grep -c "import { outfit, inter } from './fonts'" app/layout.tsx` returns 1
    - `grep -c "spaceGrotesk" app/layout.tsx` returns 0
    - `grep -c "import AmbientBg from './components/EmberGlass/AmbientBg'" app/layout.tsx` returns 1
    - `grep -E "className=\\{\`\\\$\\{outfit\\.variable\\} \\\$\\{inter\\.variable\\}" app/layout.tsx` matches 1 line
    - `grep -c "ember-glass-accent" app/layout.tsx` returns 1
    - `grep -c "ember-glass-ambient" app/layout.tsx` returns 1
    - `grep -c "document.documentElement.style.setProperty('--accent'" app/layout.tsx` returns 1
    - `grep -c "document.documentElement.dataset.ambient" app/layout.tsx` returns 1
    - `grep -c "dangerouslySetInnerHTML" app/layout.tsx` returns at least 1 (the new script; project may have other instances — count just confirms presence)
    - `grep -c "<AmbientBg" app/layout.tsx` returns at least 1
    - `grep -c "try{" app/layout.tsx` returns at least 1 (the IIFE wrapper)
    - `grep -c "catch(e)" app/layout.tsx` returns at least 1
    - The inline script body is a STATIC string — no `${...}` template interpolation of variables: `grep -E 'dangerouslySetInnerHTML.*\\$\\{[a-zA-Z_]' app/layout.tsx` should match 0 lines (XSS mitigation T-174-02-01 — script body must be static literal, not interpolated)
    - `npm run test:pages -- layout` exits 0 (or "No tests found" — layout.tsx has no dedicated test file in this codebase; failure means a regression in a page that consumes layout)
  </acceptance_criteria>
  <done>
    - `app/layout.tsx` imports `inter` from `./fonts` and applies `${inter.variable}` on `<html>`.
    - `<AmbientBg />` mounts as the first child of `<body>`.
    - Inline pre-paint script lives as the first child of `<head>`, body is a static string literal (no interpolation), wrapped in try/catch IIFE.
    - All other `app/layout.tsx` content (metadata, ClientProviders, Navbar, Footer, AppleSplashScreens, preconnect links, theme-color, skip-link) is preserved unchanged.
    - No `spaceGrotesk` references remain anywhere in the file.
    - Existing test suites that exercise pages mounted via this layout still pass under `npm run test:pages`.
  </done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| Browser localStorage → CSS custom property | Inline pre-paint script reads `localStorage` and writes to `document.documentElement.style.--accent`. localStorage is same-origin, but the script trusts whatever string it finds. |
| `dangerouslySetInnerHTML` → DOM script | React's escape hatch; the body of the script becomes raw HTML. |
| Window `CustomEvent` → React state | Picker page (Plan 03) dispatches events; AmbientBg consumes them. |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-174-02-01 | XSS / Injection | `<script dangerouslySetInnerHTML>` in `app/layout.tsx` | mitigate | Script body is a STATIC string literal; no template-string interpolation of any variable (verified by grep against `dangerouslySetInnerHTML.*\\$\\{`). The only dynamic input is two known localStorage keys read by the static script body itself. |
| T-174-02-02 | Tampering | localStorage `ember-glass-accent` value applied via `setProperty('--accent', value)` without allowlist validation | accept | Same-origin localStorage only an attacker with same-origin XSS could write malicious values. CSS custom property values cannot execute code (no `url()`/`expression()` injection vector for a flat color value). A future hardening phase may add an allowlist of the 6 known oklch strings; phase 174 explicitly scoped per D-08 to the inline-script pattern verbatim from phase 149. |
| T-174-02-03 | Denial of Service | localStorage disabled (Safari private mode, extension blocking) | mitigate | Inline script wrapped in `try { ... } catch(e) {}` (Pitfall 4); AmbientBg reads `dataset.ambient` (set by the script) instead of localStorage directly, so a localStorage exception in the script falls back to default OFF — no DOM crash. |
| T-174-02-04 | Information Disclosure | `data-ambient` and `--accent` are user-visible state on `<html>` | accept | Both values are user preferences with no PII content; observable to anyone with DOM access (which is by design — they drive visual styling). |
| T-174-02-05 | Spoofing | Custom `'ember-glass-ambient-change'` event can be dispatched by any script on the page | accept | Same-origin script context only; ambient toggle is a developer-toolbar feature with no security or privacy impact. Worst case: an attacker toggles ambient glow visibility — no data exfiltration or auth bypass possible. |
| T-174-02-06 | Repudiation | n/a | accept | No audit log surface affected. |
| T-174-02-07 | Elevation of Privilege | n/a | accept | No auth surface affected. |
</threat_model>

<verification>
After Wave 1 (Plan 01 + Plan 02) merges, run:
- `npm run test:components -- AmbientBg` — should report 7 passing tests in `app/components/EmberGlass/__tests__/AmbientBg.test.tsx`.
- `npm run test:changed` — picks up `app/layout.tsx`, `app/components/EmberGlass/AmbientBg.tsx`, and any test that imports them.
- Manual: `npm run dev`, open `/`, in DevTools Console run `localStorage.setItem('ember-glass-ambient','true'); location.reload()` — on reload, `<html>` carries `data-ambient="on"` (visible in Elements panel) before any React mount.

Plan 03 adds the Playwright e2e (`tests/smoke/ambient-persist.spec.ts`) that asserts `data-ambient='on'` after hard reload — that is the canonical DS-05 hard-reload-survival verification.
</verification>

<success_criteria>
- `<AmbientBg />` mounts in production layout without a flash on hard reload.
- Hard reload with `localStorage['ember-glass-ambient']='true'` sets `<html data-ambient="on">` before first paint (verified manually in DevTools, formally via Plan 03 Playwright e2e).
- Hard reload with `localStorage['ember-glass-accent']='oklch(0.68 0.17 0)'` sets `--accent: oklch(0.68 0.17 0)` on `<html>` before first paint.
- AmbientBg unit tests pass (7 cases).
- No regression in pages that consume the layout (`npm run test:pages` green for any pages already covered).
- Body font in browser computed style for `<body>` text resolves to an Inter-derived next/font hash class (not literal `'Space Grotesk'`).
</success_criteria>

<output>
After completion, create `.planning/phases/174-ember-glass-tokens-foundations/174-02-SUMMARY.md` documenting:
- Path of new `AmbientBg.tsx` file + size (LOC)
- The 5 edits made to `app/layout.tsx` (import swap, AmbientBg import, html className, head script, body mount)
- Verbatim text of the inline pre-paint script body
- Confirmation that the script body is a static literal (no `${...}` interpolation) per T-174-02-01 mitigation
- Test count and pass status for AmbientBg.test.tsx
</output>
