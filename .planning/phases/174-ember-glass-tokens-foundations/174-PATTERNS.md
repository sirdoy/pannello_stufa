# Phase 174: Ember Glass Tokens & Foundations - Pattern Map

**Mapped:** 2026-04-27
**Files analyzed:** 9 (4 modified + 5 created)
**Analogs found:** 9 / 9

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `app/globals.css` (modify) | css/tokens | static-cascade | self (existing `@theme` + `@layer components` glass-dark/glass-vibrancy at 1029-1034, 1424-1430) | exact |
| `app/fonts.ts` (modify) | config/font | build-time | self (existing Outfit + Space_Grotesk pattern lines 1-17) | exact (same-file edit) |
| `app/layout.tsx` (modify) | layout/root | server-render + inline-script | self (existing className wiring lines 36-52) | exact (same-file edit) |
| `app/debug/page.tsx` (modify) | page/client | request-response | self (existing "Design System" button lines 363-369) | exact |
| `app/components/EmberGlass/AmbientBg.tsx` (new) | provider/client | event-driven + localStorage | `app/components/MaintenanceBar.tsx` (localStorage + useEffect) + `app/components/PWAInitializer.tsx` (side-effect-only client provider mounted from layout) | role-match |
| `app/debug/design-system-v2/page.tsx` (new) | page/client | request-response + state | `app/debug/design-system/page.tsx` (sibling client showcase page) | exact |
| `tests/smoke/fonts-self-hosted.spec.ts` (new) | test/e2e | network-assertion | `tests/smoke/page-loads.spec.ts:7-20` (`page.on()` + cleanup pattern) | role-match |
| `tests/smoke/accent-picker.spec.ts` (new) | test/e2e | DOM-assertion | `tests/smoke/page-loads.spec.ts:117-126` (goto + heading assert) | role-match |
| `tests/smoke/ambient-persist.spec.ts` (new) | test/e2e | localStorage + reload | `tests/smoke/page-loads.spec.ts` (Playwright base + `page.evaluate`) | partial |
| `app/components/EmberGlass/AmbientBg.test.tsx` (new) | test/unit | RTL render | `app/components/layout/__tests__/CommandPaletteProvider.test.tsx` (provider unit test with TestHarness) | exact |
| `app/debug/design-system-v2/page.test.tsx` (new) | test/unit | RTL render + interaction | `app/rooms/__tests__/page.test.tsx` (page-level RTL test with mocks) + `app/components/ui/__tests__/Switch.test.tsx` (interactive control with userEvent) | role-match |

## Pattern Assignments

### `app/globals.css` (CSS modify)

**Analog:** Same file — existing `@theme` block (lines 13-300) and `@layer components` glass utilities (lines 1029-1034, 1424-1430).

**Insertion point:** After line 300 (close of `@theme {}`), before existing `@layer base` at line 303. New `:root` block + Ember Glass keyframes + `.glass-surface` utility join the existing `@layer components` family.

**Existing glass utility convention** (lines 1029-1034):
```css
@layer components {
  .glass-dark {
    background: rgba(28, 25, 23, 0.8);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.06);
  }
}
```
**Apply to:** `.glass-surface` follows the same `@layer components` shape but consumes tokens (`var(--glass-bg)`, `var(--glass-blur)`).

**Existing font-family declarations to override** (lines 209-211 inside `@theme`):
```css
--font-display: 'Outfit', system-ui, sans-serif;
--font-body: 'Space Grotesk', system-ui, sans-serif;
--font-mono: 'JetBrains Mono', ui-monospace, monospace;
```
**Apply to:** New `:root` block placed AFTER `@theme {}` overrides `--font-display` / `--font-body` via cascade order (per RESEARCH.md Pitfall 1). Leave the `@theme` lines untouched (D-03 additive policy).

**File header** (line 1):
```css
/* Fonts loaded via next/font/google in app/fonts.ts — no external @import needed */

@import "tailwindcss";
```
**Apply to:** Confirms next/font is the canonical font pipeline; new `:root` block aliases `next/font` outputs (`var(--font-display-outfit)`).

---

### `app/fonts.ts` (config modify)

**Analog:** Same file (lines 1-17).

**Existing pattern** (lines 1-17):
```typescript
import { Outfit, Space_Grotesk } from 'next/font/google';

export const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
  preload: true,
  adjustFontFallback: true,
});

export const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
  preload: true,
  adjustFontFallback: true,
});
```

**Apply to:** Replace `Space_Grotesk` import with `Inter`; replace `spaceGrotesk` export with `inter`; rename both `variable` strings:
- `outfit.variable: '--font-display'` → `'--font-display-outfit'` (D-10)
- `inter.variable` → `'--font-body-inter'` (D-10)

Keep all option keys identical (`subsets`, `display`, `preload`, `adjustFontFallback`).

---

### `app/layout.tsx` (layout modify)

**Analog:** Same file (lines 1-76).

**Existing import + className pattern** (lines 3, 36):
```typescript
import { outfit, spaceGrotesk } from './fonts';
// ...
<html lang="it" data-scroll-behavior="smooth" className={`${outfit.variable} ${spaceGrotesk.variable} dark`} suppressHydrationWarning>
```
**Apply to:** Swap `spaceGrotesk` → `inter` import + variable.

**Existing `<head>` structure** (lines 37-52) — preconnect block + apple icons + theme-color:
```tsx
<head>
  <meta name="view-transition" content="same-origin" />
  {/* Preconnect: critical API domains */}
  <link rel="preconnect" href="https://pannellostufa-default-rtdb.europe-west1.firebasedatabase.app" />
  <link rel="preconnect" href="https://pannellostufa.firebaseapp.com" />
  <link rel="preconnect" href="https://pannellostufa.eu.auth0.com" />
  <AppleSplashScreens />
  {/* ... apple-touch-icon, apple-mobile-web-app-* meta ... */}
  <meta name="theme-color" content="#0f172a" />
</head>
```
**Apply to:** Insert the inline pre-paint `<script dangerouslySetInnerHTML>` immediately AFTER the opening `<head>` and BEFORE the `<meta name="view-transition">` line so it runs first. Pattern is RESEARCH.md Example 3:
```tsx
<script
  dangerouslySetInnerHTML={{
    __html: `(function(){try{
      var a=localStorage.getItem('ember-glass-accent');
      var amb=localStorage.getItem('ember-glass-ambient');
      if(a){document.documentElement.style.setProperty('--accent',a);}
      if(amb==='true'){document.documentElement.dataset.ambient='on';}
    }catch(e){}})();`
  }}
/>
```

**Existing `<body>` structure** (lines 53-73) — skip-link + ClientProviders wrapper:
```tsx
<body className="min-h-screen bg-slate-900 text-slate-100 flex flex-col" suppressHydrationWarning>
  <a href="#main-content" className="...">Salta al contenuto</a>
  <ClientProviders>
    <WebVitals />
    <VersionEnforcer />
    <Navbar />
    <main id="main-content" ...>
      <div className="max-w-7xl mx-auto">{children}</div>
    </main>
    <Footer />
  </ClientProviders>
</body>
```
**Apply to:** Mount `<AmbientBg />` as the FIRST child of `<body>` (BEFORE the skip-link), `position: fixed; z-index: 0; pointer-events: none` keeps it behind content. Existing `<body>` `flex flex-col` is unaffected (fixed elements are out of flow).

---

### `app/debug/page.tsx` (page modify)

**Analog:** Same file — existing "Design System" button (lines 363-369).

**Existing nav-button pattern** (lines 363-369):
```tsx
<Button
  variant="outline"
  onClick={() => window.location.href = '/debug/design-system'}
>
  <Palette size={18} className="mr-2" />
  Design System
</Button>
```
**Apply to:** Add a sibling `<Button>` immediately AFTER this one, same shape, label `"Design System v2"`, href `/debug/design-system-v2`. Reuse the `Palette` icon (already imported at line 30 — no new import). Per UI-SPEC §"Claude's Discretion" row 4 (`/debug` index link).

---

### `app/components/EmberGlass/AmbientBg.tsx` (new client provider)

**Analog 1:** `app/components/MaintenanceBar.tsx` (lines 1-60) — localStorage + useEffect client component.
**Analog 2:** `app/components/PWAInitializer.tsx` (lines 1-96) — side-effect-only client provider mounted from `layout.tsx` via `ClientProviders`.

**Imports pattern** (MaintenanceBar lines 1-7):
```typescript
'use client';

import { useState, useEffect, MouseEvent } from 'react';
import styles from './MaintenanceBar.module.css';
import { formatHoursToHHMM } from '@/lib/formatUtils';
import { Text, StatusBadge } from './ui';
```
**Apply to:** AmbientBg imports — `'use client';` directive first; `useEffect` + `useState` from react; no styles module needed (inline `style={{ position: 'fixed', ... }}` per RESEARCH.md Pattern 7); no UI imports (decorative `<div>`s only).

**localStorage-with-useEffect pattern** (MaintenanceBar lines 22-47):
```typescript
const [isExpanded, setIsExpanded] = useState(false);

useEffect(() => {
  if (!maintenanceStatus) return;
  const savedState = localStorage.getItem('maintenanceBarExpanded');
  if (savedState === 'false') {
    setIsExpanded(false);
    return;
  }
  if (savedState === 'true') {
    setIsExpanded(true);
    return;
  }
  // ...
}, [maintenanceStatus]);
```
**Apply to:** AmbientBg reads `<html data-ambient>` set by inline pre-paint script (RESEARCH.md Pattern 7) for initial state — DOES NOT read localStorage in the component itself (the inline script does that). useEffect attaches `'ember-glass-ambient-change'` custom event listener with cleanup (RESEARCH.md Pattern 7).

**Provider mounted from layout pattern** (PWAInitializer lines 21, 94-96):
```typescript
export default function PWAInitializer() {
  // ...side effects in useEffect blocks
  return null;
}
```
**Apply to:** AmbientBg returns either `null` (when off) or a `<div aria-hidden="true">` wrapper with three blob `<div>`s (when on). No props.

**localStorage-write pattern** (MaintenanceBar around lines 54-60):
```typescript
const toggleExpanded = (e: MouseEvent) => {
  // ...
  if (!newState) {
    localStorage.setItem('maintenanceBarExpanded', 'false');
  }
};
```
**Apply to:** AmbientBg does NOT write — the picker page writes. AmbientBg only listens via the custom event.

**Reduced-motion guard** (no existing analog — UI-SPEC §"Reduced-motion contract"):
```css
@media (prefers-reduced-motion: reduce) {
  .ambient-blob { animation: none; }
}
```
**Apply to:** Implement as CSS in `globals.css` keyframes block, NOT JS in component.

---

### `app/debug/design-system-v2/page.tsx` (new client page)

**Analog:** `app/debug/design-system/page.tsx` (lines 1-120 read).

**Imports pattern** (existing showcase page lines 1-43):
```typescript
'use client';

import Card, { CardHeader, CardTitle, CardContent } from '@/app/components/ui/Card';
import Button from '@/app/components/ui/Button';
import Heading from '@/app/components/ui/Heading';
import Text from '@/app/components/ui/Text';
import { useState } from 'react';
import { Home, Settings, Power, Moon } from 'lucide-react';
```
**Apply to:** design-system-v2 imports — `'use client';`; `useState` for active hue + ambient toggle local state; `Heading` and `Text` from `@/app/components/ui` (per CLAUDE.md "USE design system" + UI-SPEC §Typography); icons from `lucide-react` if needed for swatch borders. NO Card/Button/Toggle imports for the swatch grid + toggle widget — UI-SPEC §"Claude's Discretion" row 7 mandates hand-rolled `<button role="switch">` and `<button aria-pressed>` (no Radix import).

**Page-level state declaration pattern** (existing page lines 85-105):
```typescript
export default function DesignSystemPage() {
  const [toggleState, setToggleState] = useState<boolean>(false);
  const [selectValue, setSelectValue] = useState<string>('1');
  // ...
}
```
**Apply to:** design-system-v2 uses two state slots:
- `const [activeHue, setActiveHue] = useState<HueName>('copper');` — reflects current `--accent` from initial localStorage read
- `const [ambientOn, setAmbientOn] = useState<boolean>(false);` — synced with `data-ambient` attr

**Live `setProperty` + localStorage pattern** (RESEARCH.md Pattern 6 — adapt verbatim):
```typescript
const ACCENT_PRESETS = {
  copper: 'oklch(0.68 0.17 45)',
  rose:   'oklch(0.68 0.17 0)',
  violet: 'oklch(0.65 0.17 290)',
  blue:   'oklch(0.65 0.14 230)',
  green:  'oklch(0.68 0.12 150)',
  amber:  'oklch(0.76 0.15 75)',
} as const;

function setAccent(value: string): void {
  document.documentElement.style.setProperty('--accent', value);
  try { localStorage.setItem('ember-glass-accent', value); } catch {}
}
```

**Custom event dispatch pattern** (UI-SPEC §"Interactive contract"):
```typescript
function setAmbient(on: boolean): void {
  try { localStorage.setItem('ember-glass-ambient', on ? 'true' : 'false'); } catch {}
  document.documentElement.dataset.ambient = on ? 'on' : 'off';
  window.dispatchEvent(new CustomEvent('ember-glass-ambient-change', { detail: on }));
}
```

---

### `tests/smoke/fonts-self-hosted.spec.ts` (new e2e test)

**Analog:** `tests/smoke/page-loads.spec.ts` lines 7-20 (`collectConsoleErrors` helper) + lines 22-33 (test shape).

**Imports + helper pattern** (lines 1-20):
```typescript
import { test, expect, type ConsoleMessage, type Page } from '@playwright/test';

function collectConsoleErrors(page: Page): { errors: string[]; cleanup: () => void } {
  const errors: string[] = [];
  const handler = (msg: ConsoleMessage) => {
    if (msg.type() === 'error') {
      const text = msg.text();
      if (text.includes('Fix any of the following')) return;
      errors.push(text);
    }
  };
  page.on('console', handler);
  const cleanup = () => page.off('console', handler);
  return { errors, cleanup };
}
```
**Apply to:** Adapt `page.on('console', …)` → `page.on('request', …)` for network capture. Same `handler` + `cleanup` shape. Filter by `request.url().includes('fonts.googleapis.com') || ...includes('fonts.gstatic.com')`.

**Test shape pattern** (lines 22-33):
```typescript
test.describe('Page Loads', () => {
  test.describe('Dashboard', () => {
    test('homepage loads with dashboard cards', async ({ page }) => {
      const { errors, cleanup } = collectConsoleErrors(page);
      await page.goto('/');
      await page.waitForLoadState('domcontentloaded');
      await expect(page.locator('main')).toBeAttached({ timeout: 15000 });
      cleanup();
      expect(errors, `Console errors on /: ${errors.join(', ')}`).toHaveLength(0);
    });
  });
});
```
**Apply to:** Same `test.describe` nesting; `await page.waitForLoadState('networkidle')` (NOT `domcontentloaded` — Pitfall 5 in RESEARCH.md); assert `expect(googleFontRequests).toEqual([])` with descriptive message. Two test cases: `/` and `/debug/design-system-v2`.

---

### `tests/smoke/accent-picker.spec.ts` (new e2e test)

**Analog:** Same `tests/smoke/page-loads.spec.ts` shape — goto + assertion.

**Test pattern** (lines 117-126 from page-loads):
```typescript
test('/debug loads', async ({ page }) => {
  const { errors, cleanup } = collectConsoleErrors(page);
  await page.goto('/debug');
  await expect(page.getByRole('heading', { name: /API Debug Console/i })).toBeVisible({ timeout: 10000 });
  cleanup();
  expect(errors, `Console errors on /debug: ${errors.join(', ')}`).toHaveLength(0);
});
```
**Apply to:** New test:
1. `await page.goto('/debug/design-system-v2')`
2. `await page.getByRole('button', { name: /Set accent to Rose/i }).click()` (per UI-SPEC §"Accessibility" aria-label)
3. Assert `await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--accent'))` returns the rose oklch string
4. Optionally assert localStorage: `await page.evaluate(() => localStorage.getItem('ember-glass-accent'))`

---

### `tests/smoke/ambient-persist.spec.ts` (new e2e test)

**Analog:** Same Playwright base + `page.evaluate` for localStorage manipulation.

**Test pattern** (UI-SPEC §"Verification Mapping" DS-05 hard-reload row + RESEARCH.md §"Phase Requirements → Test Map" DS-05 e2e row):
```typescript
test('ambient toggle survives hard reload', async ({ page }) => {
  await page.goto('/debug/design-system-v2');
  await page.evaluate(() => localStorage.setItem('ember-glass-ambient', 'true'));
  await page.reload();
  const dataAmbient = await page.evaluate(() =>
    document.documentElement.dataset.ambient
  );
  expect(dataAmbient).toBe('on');
});
```
**Apply to:** Use `collectConsoleErrors` helper too (per repo convention). Add a second test asserting that AFTER a fresh visit (no localStorage), `data-ambient` is unset (D-14 default OFF).

---

### `app/components/EmberGlass/AmbientBg.test.tsx` (new unit test)

**Analog:** `app/components/layout/__tests__/CommandPaletteProvider.test.tsx` (lines 1-85) — provider unit test using a TestHarness pattern.

**Imports + describe shape** (CommandPaletteProvider.test.tsx lines 1-11):
```typescript
import { render } from '@testing-library/react';
import CommandPaletteProvider, {
  CommandPaletteContext,
} from '../CommandPaletteProvider';
import { useContext } from 'react';

const pushMock = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
}));
```
**Apply to:** AmbientBg test imports `render`, `screen`, `act` from `@testing-library/react`; imports `AmbientBg` from `../AmbientBg`. No `next/navigation` mock needed. Mock `localStorage` and `document.documentElement.dataset.ambient` via direct assignment in `beforeEach`.

**describe + it shape** (lines 34-69):
```typescript
describe('CommandPaletteProvider — nav-telephony entry (D-17)', () => {
  beforeEach(() => {
    pushMock.mockClear();
  });

  it('exposes nav-telephony entry in the Navigazione heading', () => {
    let captured: CommandGroup[] = [];
    render(
      <CommandPaletteProvider>
        <TestHarness onCommands={(c) => (captured = c)} />
      </CommandPaletteProvider>
    );
    // ...assertions
  });
});
```
**Apply to:** AmbientBg test cases:
- `it('renders nothing when data-ambient is unset')` — assert `container.firstChild === null`
- `it('renders 3 blob divs when data-ambient="on"')` — set `document.documentElement.dataset.ambient = 'on'` before render
- `it('responds to ember-glass-ambient-change custom event')` — render, then `act(() => window.dispatchEvent(new CustomEvent('ember-glass-ambient-change', { detail: true })))`, assert blobs appear
- `it('cleans up event listener on unmount')` — track `removeEventListener` mock or assert no error after unmount + dispatch

**Mounts-without-error pattern** (lines 71-84):
```typescript
it('mounts provider without console errors', () => {
  const errorSpy = jest.spyOn(console, 'error').mockImplementation();
  render(
    <CommandPaletteProvider>
      <div>child</div>
    </CommandPaletteProvider>
  );
  // ...assert no production errors
  errorSpy.mockRestore();
});
```
**Apply to:** Adopt the same console-error sentinel pattern.

---

### `app/debug/design-system-v2/page.test.tsx` (new unit test)

**Analog 1:** `app/rooms/__tests__/page.test.tsx` (lines 1-80) — page-level RTL test with module mocks.
**Analog 2:** `app/components/ui/__tests__/Switch.test.tsx` (lines 1-80) — interactive control test with `userEvent`.

**Page-test imports + mock pattern** (rooms/__tests__/page.test.tsx lines 1-30):
```typescript
import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import RoomsPage from '../page';
import type { Room, RoomsHealthResponse } from '@/types/rooms';

const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, back: jest.fn() }),
}));

jest.mock('@/app/components/SettingsLayout', () => ({
  __esModule: true,
  default: ({ children, title }: { children?: React.ReactNode; title?: string }) => (
    <div>
      <h1>{title}</h1>
      {children}
    </div>
  ),
}));
```
**Apply to:** design-system-v2 page test imports `userEvent` (from Switch.test.tsx pattern); imports `DesignSystemV2Page` from `../page`. NO module mocks needed — the page is self-contained with no external service calls. May need to mock `localStorage` setup in `beforeEach` using `Object.defineProperty(window, 'localStorage', ...)` or simply call `localStorage.clear()`.

**Interactive control test pattern** (Switch.test.tsx lines 48-68):
```typescript
describe('Keyboard Navigation', () => {
  it('toggles with Space key', async () => {
    const handleChange = jest.fn();
    render(<Switch label="Toggle me" onCheckedChange={handleChange} />);

    const switchElement = screen.getByRole('switch');
    switchElement.focus();
    expect(switchElement).toHaveFocus();

    await userEvent.keyboard(' ');
    expect(handleChange).toHaveBeenCalledWith(true);
  });
});
```
**Apply to:** design-system-v2 test cases:
- `it('exposes 6 hue preset swatches with aria-pressed')` — `screen.getAllByRole('button', { pressed: false })` length 5 (5 inactive + 1 active = 6 total)
- `it('clicking Rose swatch sets --accent on documentElement')` — spy `document.documentElement.style.setProperty`, click, assert called with `'--accent', 'oklch(0.68 0.17 0)'`
- `it('clicking Rose persists ember-glass-accent in localStorage')` — `userEvent.click(screen.getByRole('button', { name: /Set accent to Rose/i }))`, assert `localStorage.getItem('ember-glass-accent') === 'oklch(0.68 0.17 0)'`
- `it('ambient toggle dispatches ember-glass-ambient-change event')` — addEventListener spy, userEvent.click on `role="switch"`, assert event fired with `detail: true`
- `it('ambient toggle persists ember-glass-ambient in localStorage')` — same shape, assert localStorage value

**Accessibility test (Switch.test.tsx lines 17-45 + jest-axe convention):**
```typescript
expect.extend(toHaveNoViolations);

it('should have no a11y violations', async () => {
  const { container } = render(<Switch label="Enable notifications" />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```
**Apply to:** Add one axe test on `DesignSystemV2Page` to catch missing aria-labels on swatches/toggle.

---

## Shared Patterns

### `'use client'` Directive Discipline

**Source:** Project convention (CLAUDE.md "Patterns" + every interactive component sampled — `MaintenanceBar.tsx:1`, `PWAInitializer.tsx:1`, `CommandPaletteProvider.tsx:1`, `app/debug/design-system/page.tsx:1`).
**Apply to:** `AmbientBg.tsx`, `app/debug/design-system-v2/page.tsx` (both interactive). NOT to `app/layout.tsx` (stays Server Component) and NOT to `tests/*` files.

### Inline pre-paint `<script dangerouslySetInnerHTML>`

**Source:** Phase 149 historical pattern (`app/layout.tsx` lines 52-76 in pre-149 history) + RESEARCH.md Example 3.
**Apply to:** Single insertion in `app/layout.tsx` `<head>`. IIFE wrapped in try/catch; reads `localStorage` + sets `documentElement.style.setProperty` and `documentElement.dataset.ambient`.
```tsx
<script dangerouslySetInnerHTML={{
  __html: `(function(){try{
    var a=localStorage.getItem('ember-glass-accent');
    var amb=localStorage.getItem('ember-glass-ambient');
    if(a){document.documentElement.style.setProperty('--accent',a);}
    if(amb==='true'){document.documentElement.dataset.ambient='on';}
  }catch(e){}})();`
}} />
```

### localStorage with try/catch + scalar values only

**Source:** `MaintenanceBar.tsx:29-46, 60` — direct `localStorage.getItem`/`setItem` with scalar `'true'`/`'false'` strings. RESEARCH.md "Don't Hand-Roll" table forbids `useLocalStorage` libs.
**Apply to:** Picker (`page.tsx`) writes; AmbientBg + inline script read. All access in try/catch. Keys kebab-case scoped: `ember-glass-accent`, `ember-glass-ambient`.

### Tailwind v4 `@layer components { … }` for utilities

**Source:** `app/globals.css:1029-1034, 1424-1430` (`glass-dark`, `glass-vibrancy`, `glass-shine`).
**Apply to:** New `.glass-surface` class lives in a new `@layer components { ... }` block in `globals.css` after the new `:root` Ember Glass token block.

### Playwright `page.on()` listener + `cleanup()` discipline

**Source:** `tests/smoke/page-loads.spec.ts:7-20`.
**Apply to:** All three new smoke specs (`fonts-self-hosted`, `accent-picker`, `ambient-persist`). Listener registered BEFORE `page.goto()`; `cleanup()` called AFTER assertions; `expect(...)` message includes captured items for debug.

### `next/font/google` `variable:` CSS-var output

**Source:** `app/fonts.ts:1-17` + Tailwind v4 docs note in `globals.css:1`.
**Apply to:** Same module structure; only swap `Space_Grotesk` → `Inter` and rename two `variable:` keys.

### Error/empty/destructive copy

**Source:** UI-SPEC §"Copywriting Contract".
**Apply to:** No destructive/empty/error paths in this phase. Italian for UI; English for test assertion messages. Token names stay in code (`--accent`).

### Test command discipline (CLAUDE.md rule 8)

**Source:** CLAUDE.md "Rules" section.
**Apply to:** All PLAN `<verify><automated>` blocks MUST use scoped commands:
- Unit tests: `npm test -- app/components/EmberGlass/AmbientBg.test.tsx app/debug/design-system-v2/page.test.tsx`
- Component scope: `npm run test:components`
- Pages scope: `npm run test:pages`
- E2E: `npx playwright test tests/smoke/fonts-self-hosted.spec.ts tests/smoke/accent-picker.spec.ts tests/smoke/ambient-persist.spec.ts`
- NEVER bare `npm test` from agents.

### Accessibility (jest-axe)

**Source:** `app/components/ui/__tests__/Switch.test.tsx:11-13` (`toHaveNoViolations`).
**Apply to:** `page.test.tsx` for `/debug/design-system-v2` (one axe pass on full page). AmbientBg unit test does NOT need axe (decorative `aria-hidden="true"` div).

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| (none) | — | — | All 11 files have at least a role-match analog in the codebase. |

The closest historical pattern (Phase 149 inline pre-paint script in `app/layout.tsx` lines 52-76) was REMOVED by phase 149. Implementer should consult `.planning/phases/149-theme-removal-core/149-01-PLAN.md:182` for the exact original shape — RESEARCH.md Example 3 already captures it verbatim.

## Metadata

**Analog search scope:** `app/`, `app/components/`, `app/debug/`, `tests/smoke/`.
**Files scanned:** 14 (globals.css, fonts.ts, layout.tsx, debug/page.tsx, design-system/page.tsx, MaintenanceBar.tsx, PWAInitializer.tsx, ClientProviders.tsx, CommandPaletteProvider.tsx, page-loads.spec.ts, CommandPaletteProvider.test.tsx, rooms/page.test.tsx, Switch.test.tsx, Toast.test.tsx).
**Pattern extraction date:** 2026-04-27
