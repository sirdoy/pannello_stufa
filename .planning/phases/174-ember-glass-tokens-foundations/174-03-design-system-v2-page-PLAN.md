---
phase: 174-ember-glass-tokens-foundations
plan: 03
type: execute
wave: 2
depends_on: [01, 02]
files_modified:
  - app/debug/page.tsx
  - app/debug/design-system-v2/page.tsx
  - app/debug/design-system-v2/__tests__/page.test.tsx
  - tests/smoke/fonts-self-hosted.spec.ts
  - tests/smoke/accent-picker.spec.ts
  - tests/smoke/ambient-persist.spec.ts
autonomous: true
requirements: [DS-02, DS-03, DS-04, DS-05]
tags: [debug-page, accent-picker, ambient-toggle, playwright, smoke-tests, ds-02-audit, ember-glass]

must_haves:
  truths:
    - "/debug/design-system-v2 page renders with 6 hue-preset swatches (Copper default + 5 alternatives)"
    - "Clicking a hue swatch sets --accent on document.documentElement and persists ember-glass-accent in localStorage"
    - "Active hue swatch carries aria-pressed=true; others aria-pressed=false"
    - "Ambient toggle (role=switch) writes ember-glass-ambient to localStorage and dispatches 'ember-glass-ambient-change' CustomEvent"
    - "/debug index page exposes a Design System v2 button linking to /debug/design-system-v2"
    - "Playwright network test confirms zero requests to fonts.googleapis.com / fonts.gstatic.com on / and /debug/design-system-v2"
    - "Playwright accent-picker test confirms swatch click updates --accent and persists localStorage"
    - "Playwright ambient-persist test confirms localStorage ambient='true' + reload yields <html data-ambient='on'>"
    - "DS-02 audit grep confirms zero hardcoded glass/blur/accent hex values in NEW glass surface files (app/components/EmberGlass/, app/debug/design-system-v2/) outside AUDIT-EXCEPTION-tagged lines"
  artifacts:
    - path: "app/debug/design-system-v2/page.tsx"
      provides: "Client page with 6-hue picker + ambient toggle + token grid + glass-surface demo card"
      exports: ["default"]
    - path: "app/debug/design-system-v2/__tests__/page.test.tsx"
      provides: "Unit test: 6 swatches, click behavior, localStorage persistence, custom-event dispatch"
    - path: "tests/smoke/fonts-self-hosted.spec.ts"
      provides: "Playwright network assertion: zero Google Fonts requests"
    - path: "tests/smoke/accent-picker.spec.ts"
      provides: "Playwright DOM assertion: hue swatch click updates --accent + localStorage"
    - path: "tests/smoke/ambient-persist.spec.ts"
      provides: "Playwright reload-survival: localStorage ambient='true' + reload sets data-ambient='on'"
    - path: "app/debug/page.tsx"
      provides: "/debug index with Design System v2 button"
      contains: "design-system-v2"
  key_links:
    - from: "app/debug/design-system-v2/page.tsx (ambient toggle)"
      to: "app/components/EmberGlass/AmbientBg.tsx"
      via: "window 'ember-glass-ambient-change' CustomEvent"
      pattern: "ember-glass-ambient-change"
    - from: "app/debug/design-system-v2/page.tsx (hue picker)"
      to: ":root --accent"
      via: "document.documentElement.style.setProperty"
      pattern: "setProperty\\('--accent'"
    - from: "app/debug/page.tsx (nav link)"
      to: "/debug/design-system-v2"
      via: "Button onClick href"
      pattern: "/debug/design-system-v2"
---

<objective>
Build the verification surface for Phase 174: the `/debug/design-system-v2` reference page (the only new visual surface this phase per D-19), the four required test artifacts (1 unit page test + 3 Playwright smoke specs), the `/debug` index nav link, and the DS-02 audit grep verification.

Purpose: Plans 01 and 02 produce the token + provider foundation but ship no observable UI. This plan ships the page that lets a developer SEE the tokens, click between the 6 oklch hues, toggle ambient, and lets the test suite confirm that fonts self-host (DS-04), the accent picker mutates state correctly (DS-03), the ambient layer survives hard reload (DS-05), and no NEW glass surface violates the hardcoded-value audit (DS-02 per D-04 scope).

Output: 1 modified page (`app/debug/page.tsx`), 1 new page (`app/debug/design-system-v2/page.tsx`), 1 unit test, 3 Playwright smoke specs.
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
@.planning/phases/174-ember-glass-tokens-foundations/174-01-SUMMARY.md
@.planning/phases/174-ember-glass-tokens-foundations/174-02-SUMMARY.md
@CLAUDE.md
@app/debug/page.tsx
@app/debug/design-system/page.tsx
@app/components/EmberGlass/AmbientBg.tsx
@tests/smoke/page-loads.spec.ts
@app/components/ui/__tests__/Switch.test.tsx
@app/rooms/__tests__/page.test.tsx

<interfaces>
<!-- Custom event contract (provided by Plan 02 AmbientBg) — picker must match this name + detail shape: -->
```typescript
window.dispatchEvent(new CustomEvent<boolean>('ember-glass-ambient-change', { detail: true | false }));
```

<!-- localStorage keys (Plan 02 inline script reads these on hard reload): -->
```
ember-glass-accent  → oklch string, e.g. 'oklch(0.68 0.17 0)'
ember-glass-ambient → 'true' | 'false'
```

<!-- 6 oklch hue presets (per D-05 + UI-SPEC §"6-hue preset palette" — VERBATIM, do not alter): -->
```typescript
const ACCENT_PRESETS = {
  copper: 'oklch(0.68 0.17 45)',
  rose:   'oklch(0.68 0.17 0)',
  violet: 'oklch(0.65 0.17 290)',
  blue:   'oklch(0.65 0.14 230)',
  green:  'oklch(0.68 0.12 150)',
  amber:  'oklch(0.76 0.15 75)',
} as const;
```

<!-- Existing /debug/page.tsx Design System button (lines 363-369 — sibling pattern): -->
```tsx
<Button
  variant="outline"
  onClick={() => window.location.href = '/debug/design-system'}
>
  <Palette size={18} className="mr-2" />
  Design System
</Button>
```

<!-- Existing tests/smoke/page-loads.spec.ts collectConsoleErrors helper (lines 7-20 — adapt for request listener): -->
```typescript
function collectConsoleErrors(page: Page): { errors: string[]; cleanup: () => void } {
  const errors: string[] = [];
  const handler = (msg: ConsoleMessage) => {
    if (msg.type() === 'error') errors.push(msg.text());
  };
  page.on('console', handler);
  return { errors, cleanup: () => page.off('console', handler) };
}
```
</interfaces>
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Create /debug/design-system-v2 page (6-hue picker + ambient toggle + token grid + glass demo) with unit test (DS-02, DS-03, DS-05)</name>
  <files>app/debug/design-system-v2/page.tsx, app/debug/design-system-v2/__tests__/page.test.tsx</files>
  <read_first>
    - app/debug/design-system/page.tsx (sibling analog, lines 1-120 for imports + page-level state pattern)
    - app/components/ui/__tests__/Switch.test.tsx (analog: interactive control test with userEvent + jest-axe)
    - app/rooms/__tests__/page.test.tsx (analog: page-level RTL test)
    - app/components/EmberGlass/AmbientBg.tsx (Plan 02 output — confirms event name + detail shape contract)
    - .planning/phases/174-ember-glass-tokens-foundations/174-CONTEXT.md D-05, D-06, D-07, D-13, D-14
    - .planning/phases/174-ember-glass-tokens-foundations/174-UI-SPEC.md §"/debug/design-system-v2 Page Layout" (full layout spec) + §"Copywriting Contract" (Italian copy strings) + §"Accessibility" (aria contract) + §"Claude's Discretion" (single-file, hand-rolled toggle)
    - .planning/phases/174-ember-glass-tokens-foundations/174-PATTERNS.md §"app/debug/design-system-v2/page.tsx" + §"app/debug/design-system-v2/page.test.tsx"
    - .planning/phases/174-ember-glass-tokens-foundations/174-RESEARCH.md §"Pattern 6: Live Accent Override + Persistence"
  </read_first>
  <behavior>
    13 unit-test cases (6 hue picker + 4 ambient toggle + 3 page structure):
    - Test 1: Page renders 6 hue swatches as `<button aria-pressed>` elements with aria-labels `Set accent to {Name}` matching the 6 ACCENT_PRESETS keys (Copper, Rose, Violet, Blue, Green, Amber). The English aria-label format is asserted indirectly via the `getByRole('button', { name: /Set accent to/i })` matcher used throughout the suite.
    - Test 2: Initially Copper swatch has aria-pressed="true"; Rose has aria-pressed="false"
    - Test 3: Clicking the Rose swatch calls `document.documentElement.style.setProperty('--accent', 'oklch(0.68 0.17 0)')` (spy assertion)
    - Test 4: Clicking the Rose swatch sets `localStorage.getItem('ember-glass-accent')` to `'oklch(0.68 0.17 0)'`
    - Test 5: After clicking Rose, Rose has aria-pressed="true" and Copper has aria-pressed="false"
    - Test 6: localStorage exceptions during click do NOT throw (try/catch wraps every localStorage write)
    - Test 7: Page renders an ambient toggle as `<button role="switch" aria-checked>` with Italian aria-label `"Attiva glow ambient"`
    - Test 8: Initially the ambient toggle has aria-checked="false" (D-14 default OFF)
    - Test 9: Clicking the ambient toggle sets aria-checked="true" + persists `localStorage.getItem('ember-glass-ambient') === 'true'` + dispatches a `'ember-glass-ambient-change'` CustomEvent with `detail: true`
    - Test 10: Clicking again sets aria-checked="false" + persists `'false'` + dispatches `detail: false`
    - Test 11: Page renders the Italian title "Ember Glass" inside a single `<h1>`
    - Test 12: Page contains an element with class `glass-surface` (the demo card consumes the utility — DS-06 visible demonstration)
    - Test 13: Page renders an axe-clean DOM (jest-axe `toHaveNoViolations`)
  </behavior>
  <action>
**Step 1 — Write the failing tests first** at `app/debug/design-system-v2/__tests__/page.test.tsx`:

```typescript
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import DesignSystemV2Page from '../page';

expect.extend(toHaveNoViolations);

describe('DesignSystemV2Page (Phase 174 — DS-03, DS-05)', () => {
  beforeEach(() => {
    localStorage.clear();
    delete document.documentElement.dataset.ambient;
    document.documentElement.style.removeProperty('--accent');
  });

  describe('Hue picker (DS-03)', () => {
    it('renders 6 hue swatches', () => {
      render(<DesignSystemV2Page />);
      const swatches = screen.getAllByRole('button', { name: /Set accent to/i });
      expect(swatches).toHaveLength(6);
    });

    it('Copper is initially active (aria-pressed=true)', () => {
      render(<DesignSystemV2Page />);
      expect(screen.getByRole('button', { name: /Set accent to Copper/i })).toHaveAttribute('aria-pressed', 'true');
      expect(screen.getByRole('button', { name: /Set accent to Rose/i })).toHaveAttribute('aria-pressed', 'false');
    });

    it('clicking Rose calls setProperty(--accent, oklch(0.68 0.17 0))', async () => {
      const setProp = jest.spyOn(document.documentElement.style, 'setProperty');
      render(<DesignSystemV2Page />);
      await userEvent.click(screen.getByRole('button', { name: /Set accent to Rose/i }));
      expect(setProp).toHaveBeenCalledWith('--accent', 'oklch(0.68 0.17 0)');
      setProp.mockRestore();
    });

    it('clicking Rose persists ember-glass-accent in localStorage', async () => {
      render(<DesignSystemV2Page />);
      await userEvent.click(screen.getByRole('button', { name: /Set accent to Rose/i }));
      expect(localStorage.getItem('ember-glass-accent')).toBe('oklch(0.68 0.17 0)');
    });

    it('clicking Rose updates aria-pressed (Rose=true, Copper=false)', async () => {
      render(<DesignSystemV2Page />);
      await userEvent.click(screen.getByRole('button', { name: /Set accent to Rose/i }));
      expect(screen.getByRole('button', { name: /Set accent to Rose/i })).toHaveAttribute('aria-pressed', 'true');
      expect(screen.getByRole('button', { name: /Set accent to Copper/i })).toHaveAttribute('aria-pressed', 'false');
    });

    it('does not throw when localStorage.setItem fails', async () => {
      const setItemSpy = jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('QuotaExceeded');
      });
      render(<DesignSystemV2Page />);
      await expect(
        userEvent.click(screen.getByRole('button', { name: /Set accent to Rose/i }))
      ).resolves.not.toThrow();
      setItemSpy.mockRestore();
    });
  });

  describe('Ambient toggle (DS-05)', () => {
    it('renders a switch with aria-label "Attiva glow ambient"', () => {
      render(<DesignSystemV2Page />);
      const toggle = screen.getByRole('switch', { name: /Attiva glow ambient/i });
      expect(toggle).toBeInTheDocument();
    });

    it('initial aria-checked is false (default OFF — D-14)', () => {
      render(<DesignSystemV2Page />);
      expect(screen.getByRole('switch', { name: /Attiva glow ambient/i })).toHaveAttribute('aria-checked', 'false');
    });

    it('click sets aria-checked=true, persists localStorage, dispatches event with detail=true', async () => {
      const dispatchSpy = jest.spyOn(window, 'dispatchEvent');
      render(<DesignSystemV2Page />);
      const toggle = screen.getByRole('switch', { name: /Attiva glow ambient/i });
      await userEvent.click(toggle);
      expect(toggle).toHaveAttribute('aria-checked', 'true');
      expect(localStorage.getItem('ember-glass-ambient')).toBe('true');
      const event = dispatchSpy.mock.calls
        .map((c) => c[0])
        .find((e): e is CustomEvent<boolean> => (e as Event).type === 'ember-glass-ambient-change') as CustomEvent<boolean> | undefined;
      expect(event).toBeDefined();
      expect(event!.detail).toBe(true);
      dispatchSpy.mockRestore();
    });

    it('second click sets aria-checked=false, persists "false", dispatches detail=false', async () => {
      render(<DesignSystemV2Page />);
      const toggle = screen.getByRole('switch', { name: /Attiva glow ambient/i });
      await userEvent.click(toggle);
      const dispatchSpy = jest.spyOn(window, 'dispatchEvent');
      await userEvent.click(toggle);
      expect(toggle).toHaveAttribute('aria-checked', 'false');
      expect(localStorage.getItem('ember-glass-ambient')).toBe('false');
      const event = dispatchSpy.mock.calls
        .map((c) => c[0])
        .find((e): e is CustomEvent<boolean> => (e as Event).type === 'ember-glass-ambient-change') as CustomEvent<boolean> | undefined;
      expect(event!.detail).toBe(false);
      dispatchSpy.mockRestore();
    });
  });

  describe('Page structure (DS-01 demo + DS-06 demo)', () => {
    it('renders a single h1 with text "Ember Glass"', () => {
      render(<DesignSystemV2Page />);
      const headings = screen.getAllByRole('heading', { level: 1 });
      expect(headings).toHaveLength(1);
      expect(headings[0]).toHaveTextContent('Ember Glass');
    });

    it('contains a .glass-surface demo card (DS-06 visible demo)', () => {
      const { container } = render(<DesignSystemV2Page />);
      expect(container.querySelector('.glass-surface')).not.toBeNull();
    });

    it('has no a11y violations', async () => {
      const { container } = render(<DesignSystemV2Page />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});
```

**Step 2 — Run the tests to confirm they fail (RED):**
```bash
npm test -- app/debug/design-system-v2/__tests__/page.test.tsx
```

**Step 3 — Implement `app/debug/design-system-v2/page.tsx`** (single-file client component per UI-SPEC §"Claude's Discretion"):

```typescript
'use client';

import React, { useState, useEffect } from 'react';

// 6 oklch hue presets — locked verbatim from CONTEXT.md D-05 / UI-SPEC §"6-hue preset palette".
// AUDIT-EXCEPTION (DS-02): literal oklch() strings are allowed here — this map IS the source of truth.
const ACCENT_PRESETS = {
  copper: 'oklch(0.68 0.17 45)',
  rose:   'oklch(0.68 0.17 0)',
  violet: 'oklch(0.65 0.17 290)',
  blue:   'oklch(0.65 0.14 230)',
  green:  'oklch(0.68 0.12 150)',
  amber:  'oklch(0.76 0.15 75)',
} as const;

type HueName = keyof typeof ACCENT_PRESETS;

const HUE_DISPLAY_NAMES: Record<HueName, string> = {
  copper: 'Copper',
  rose:   'Rose',
  violet: 'Violet',
  blue:   'Blue',
  green:  'Green',
  amber:  'Amber',
};

function setAccent(value: string): void {
  document.documentElement.style.setProperty('--accent', value);
  try { localStorage.setItem('ember-glass-accent', value); } catch { /* noop */ }
}

function setAmbient(on: boolean): void {
  try { localStorage.setItem('ember-glass-ambient', on ? 'true' : 'false'); } catch { /* noop */ }
  document.documentElement.dataset.ambient = on ? 'on' : 'off';
  window.dispatchEvent(new CustomEvent<boolean>('ember-glass-ambient-change', { detail: on }));
}

export default function DesignSystemV2Page(): React.ReactElement {
  const [activeHue, setActiveHue] = useState<HueName>('copper');
  const [ambientOn, setAmbientOn] = useState<boolean>(false);

  // Sync state with localStorage on mount (already applied to documentElement by inline pre-paint script)
  useEffect(() => {
    try {
      const persistedAccent = localStorage.getItem('ember-glass-accent');
      if (persistedAccent) {
        const match = (Object.entries(ACCENT_PRESETS) as Array<[HueName, string]>).find(([, v]) => v === persistedAccent);
        if (match) setActiveHue(match[0]);
      }
      const persistedAmbient = localStorage.getItem('ember-glass-ambient');
      if (persistedAmbient === 'true') setAmbientOn(true);
    } catch { /* noop */ }
  }, []);

  const onSwatchClick = (hue: HueName): void => {
    setAccent(ACCENT_PRESETS[hue]);
    setActiveHue(hue);
  };

  const onAmbientToggle = (): void => {
    const next = !ambientOn;
    setAmbient(next);
    setAmbientOn(next);
  };

  return (
    <main style={{ maxWidth: 1240, margin: '0 auto', padding: 'var(--pad-card)', position: 'relative', zIndex: 1 }}>
      {/* Page header */}
      <header style={{ marginBottom: 32 }}>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600, letterSpacing: '1.2px', textTransform: 'uppercase', color: 'var(--text-2)' }}>
          DESIGN SYSTEM · v2
        </p>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 40, fontWeight: 600, lineHeight: 1.05, letterSpacing: '-1px', color: 'var(--text-1)', margin: 0 }}>
          Ember Glass
        </h1>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 16, fontWeight: 400, color: 'var(--text-2)', marginTop: 8 }}>
          Riferimento token e picker live · Phase 174
        </p>
      </header>

      <hr style={{ border: 0, borderTop: '0.5px solid var(--glass-border)', margin: '24px 0' }} />

      {/* Section 01 — Hue picker */}
      <section aria-labelledby="sec-01-heading" style={{ marginBottom: 48 }}>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600, letterSpacing: '1.2px', textTransform: 'uppercase', color: 'var(--text-2)' }}>
          01 / HUE
        </p>
        <h2 id="sec-01-heading" style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 600, color: 'var(--text-1)', margin: '4px 0 8px 0' }}>
          Tinte accento
        </h2>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 16, color: 'var(--text-2)', marginBottom: 16 }}>
          Clicca uno swatch per aggiornare --accent in tempo reale
        </p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {(Object.keys(ACCENT_PRESETS) as HueName[]).map((hue) => {
            const isActive = activeHue === hue;
            return (
              <button
                key={hue}
                type="button"
                aria-label={`Set accent to ${HUE_DISPLAY_NAMES[hue]}`}
                aria-pressed={isActive}
                onClick={() => onSwatchClick(hue)}
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: ACCENT_PRESETS[hue],
                  border: isActive ? '2px solid var(--accent)' : '1px solid var(--glass-border)',
                  cursor: 'pointer',
                  outlineOffset: 2,
                }}
              />
            );
          })}
        </div>
      </section>

      {/* Section 02 — Ambient toggle */}
      <section aria-labelledby="sec-02-heading" style={{ marginBottom: 48 }}>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600, letterSpacing: '1.2px', textTransform: 'uppercase', color: 'var(--text-2)' }}>
          02 / AMBIENT
        </p>
        <h2 id="sec-02-heading" style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 600, color: 'var(--text-1)', margin: '4px 0 8px 0' }}>
          Glow ambient
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ fontFamily: 'var(--font-body)', fontSize: 16, color: 'var(--text-1)' }}>
            Glow ambient
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={ambientOn}
            aria-label="Attiva glow ambient"
            onClick={onAmbientToggle}
            style={{
              width: 44,
              height: 24,
              borderRadius: 999,
              background: ambientOn ? 'var(--accent)' : 'var(--glass-bg)',
              border: '1px solid var(--glass-border)',
              cursor: 'pointer',
              padding: 2,
              position: 'relative',
            }}
          >
            <span
              aria-hidden="true"
              style={{
                display: 'block',
                width: 18,
                height: 18,
                borderRadius: 999,
                background: 'var(--text-1)',
                transform: ambientOn ? 'translateX(20px)' : 'translateX(0)',
                transition: 'transform 200ms cubic-bezier(.34,1.56,.64,1)',
              }}
            />
          </button>
        </div>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 16, color: 'var(--text-2)', marginTop: 8 }}>
          Persistito in localStorage. Spento di default per risparmiare frame.
        </p>
      </section>

      {/* Section 03 — Token grid (live) */}
      <section aria-labelledby="sec-03-heading" style={{ marginBottom: 48 }}>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600, letterSpacing: '1.2px', textTransform: 'uppercase', color: 'var(--text-2)' }}>
          03 / TOKENS
        </p>
        <h2 id="sec-03-heading" style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 600, color: 'var(--text-1)', margin: '4px 0 8px 0' }}>
          Token
        </h2>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 16, color: 'var(--text-2)', marginBottom: 16 }}>
          11 variabili CSS · sorgente: globals.css
        </p>
        <dl style={{ display: 'grid', gridTemplateColumns: 'minmax(180px, 1fr) 2fr', gap: 8, fontFamily: 'var(--font-body)', fontSize: 12 }}>
          {[
            ['--glass-bg', 'rgba(255, 255, 255, 0.04)'],
            ['--glass-blur', '24px'],
            ['--glass-border', 'rgba(255, 255, 255, 0.08)'],
            ['--glass-shadow', '0 8px 32px ...'],
            ['--accent', `${ACCENT_PRESETS[activeHue]} (${HUE_DISPLAY_NAMES[activeHue]})`],
            ['--text-1', '#f5f5f4'],
            ['--text-2', 'rgba(245, 245, 244, 0.55)'],
            ['--r-card', '24px'],
            ['--pad-card', '16px'],
            ['--font-display', 'Outfit (next/font)'],
            ['--font-body', 'Inter (next/font)'],
          ].map(([name, val]) => (
            <React.Fragment key={name}>
              <dt style={{ fontWeight: 600, color: 'var(--text-1)' }}>{name}</dt>
              <dd style={{ color: 'var(--text-2)', margin: 0 }}>{val}</dd>
            </React.Fragment>
          ))}
        </dl>
      </section>

      {/* Section 04 — Glass surface demo */}
      <section aria-labelledby="sec-04-heading" style={{ marginBottom: 48 }}>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600, letterSpacing: '1.2px', textTransform: 'uppercase', color: 'var(--text-2)' }}>
          04 / DEMO
        </p>
        <h2 id="sec-04-heading" style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 600, color: 'var(--text-1)', margin: '4px 0 16px 0' }}>
          Demo glass-surface
        </h2>
        <div className="glass-surface" style={{ padding: 'var(--pad-card)' }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 600, color: 'var(--text-1)', margin: 0 }}>
            Superficie vetro
          </h3>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 16, color: 'var(--text-2)', margin: '8px 0' }}>
            Anteprima dei token. Clicca un colore sopra per vedere --accent aggiornarsi.
          </p>
          <div
            aria-label="Live accent preview"
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: 'var(--accent)',
              marginTop: 8,
            }}
          />
        </div>
      </section>
    </main>
  );
}
```

**Step 4 — Run the tests to confirm they pass (GREEN):**
```bash
npm test -- app/debug/design-system-v2/__tests__/page.test.tsx
```

DS-02 audit notes:
- The single `// AUDIT-EXCEPTION` comment at the top of `ACCENT_PRESETS` documents the only allowed literal-oklch occurrence (per UI-SPEC audit gate).
- All visual styling uses CSS variables (`var(--glass-bg)`, `var(--glass-border)`, `var(--accent)`, `var(--text-1)`, `var(--text-2)`, `var(--r-card)`, `var(--pad-card)`, `var(--font-display)`, `var(--font-body)`) — no hardcoded hex/rgba/blur values in inline styles.
- Spacing uses pixel literals (4-multiple scale per UI-SPEC §Spacing) — these are NOT design-token violations; the audit grep only flags hex colors and blur-px values.
  </action>
  <verify>
    <automated>npm test -- app/debug/design-system-v2/__tests__/page.test.tsx</automated>
  </verify>
  <acceptance_criteria>
    - File `app/debug/design-system-v2/page.tsx` exists
    - File `app/debug/design-system-v2/__tests__/page.test.tsx` exists
    - `grep -c "'use client'" app/debug/design-system-v2/page.tsx` returns 1
    - `grep -c "ACCENT_PRESETS" app/debug/design-system-v2/page.tsx` returns at least 1
    - `grep -c "oklch(0.68 0.17 45)" app/debug/design-system-v2/page.tsx` returns 1 (Copper preset, only literal oklch instance)
    - `grep -c "oklch(0.68 0.17 0)" app/debug/design-system-v2/page.tsx` returns 1 (Rose)
    - `grep -c "oklch(0.65 0.17 290)" app/debug/design-system-v2/page.tsx` returns 1 (Violet)
    - `grep -c "oklch(0.65 0.14 230)" app/debug/design-system-v2/page.tsx` returns 1 (Blue)
    - `grep -c "oklch(0.68 0.12 150)" app/debug/design-system-v2/page.tsx` returns 1 (Green)
    - `grep -c "oklch(0.76 0.15 75)" app/debug/design-system-v2/page.tsx` returns 1 (Amber)
    - `grep -c "ember-glass-accent" app/debug/design-system-v2/page.tsx` returns at least 2 (read in useEffect + write in setAccent)
    - `grep -c "ember-glass-ambient-change" app/debug/design-system-v2/page.tsx` returns at least 1 (CustomEvent dispatch)
    - `grep -c "ember-glass-ambient" app/debug/design-system-v2/page.tsx` returns at least 2 (read + write)
    - `grep -c 'role="switch"' app/debug/design-system-v2/page.tsx` returns 1
    - `grep -c "aria-pressed" app/debug/design-system-v2/page.tsx` returns at least 1
    - `grep -c "aria-checked" app/debug/design-system-v2/page.tsx` returns at least 1
    - `grep -c "glass-surface" app/debug/design-system-v2/page.tsx` returns 1
    - `grep -c "AUDIT-EXCEPTION" app/debug/design-system-v2/page.tsx` returns 1 (the ACCENT_PRESETS map comment)
    - `npm test -- app/debug/design-system-v2/__tests__/page.test.tsx` exits 0 with all 13 unit-test cases passing
  </acceptance_criteria>
  <done>
    - Page exists at `app/debug/design-system-v2/page.tsx` as a single-file client component (UI-SPEC discretion).
    - 6 hue swatches with `aria-pressed` + `aria-label="Set accent to {Name}"` (English aria, Italian visible copy).
    - Ambient toggle is hand-rolled `<button role="switch" aria-checked aria-label="Attiva glow ambient">`.
    - Click handlers persist to localStorage with try/catch and dispatch the custom event in matching shape with Plan 02 AmbientBg.
    - Token grid renders all 11 token names (live `--accent` value reflects active hue).
    - One `.glass-surface` demo card present.
    - 13 unit tests + jest-axe pass.
    - One `// AUDIT-EXCEPTION` comment documents the only allowed oklch literal (the preset map).
  </done>
</task>

<task type="auto">
  <name>Task 2: Create three Playwright smoke specs (DS-04 fonts self-host, DS-03 accent picker, DS-05 ambient persist)</name>
  <files>tests/smoke/fonts-self-hosted.spec.ts, tests/smoke/accent-picker.spec.ts, tests/smoke/ambient-persist.spec.ts</files>
  <read_first>
    - tests/smoke/page-loads.spec.ts (analog: Playwright base + page.on() listener pattern, lines 1-130)
    - .planning/phases/174-ember-glass-tokens-foundations/174-CONTEXT.md D-11
    - .planning/phases/174-ember-glass-tokens-foundations/174-RESEARCH.md §"Example 4: Playwright Network Assertion" + §"Pitfall 5: Playwright networkidle Misses Late Font Requests"
    - .planning/phases/174-ember-glass-tokens-foundations/174-PATTERNS.md §"tests/smoke/fonts-self-hosted.spec.ts" + §"tests/smoke/accent-picker.spec.ts" + §"tests/smoke/ambient-persist.spec.ts"
    - .planning/phases/174-ember-glass-tokens-foundations/174-VALIDATION.md §"Per-Task Verification Map" rows 174-03-02, 174-03-04, 174-03-05
    - playwright.config.ts (existing — auth setup project, baseURL, browsers)
  </read_first>
  <action>
**Spec 1 — `tests/smoke/fonts-self-hosted.spec.ts` (DS-04):**

```typescript
import { test, expect, type Page } from '@playwright/test';

function collectGoogleFontRequests(page: Page): { urls: string[]; cleanup: () => void } {
  const urls: string[] = [];
  const handler = (request: { url: () => string }): void => {
    const u = request.url();
    if (u.includes('fonts.googleapis.com') || u.includes('fonts.gstatic.com')) {
      urls.push(u);
    }
  };
  page.on('request', handler);
  return { urls, cleanup: () => page.off('request', handler) };
}

test.describe('DS-04 — fonts self-hosted (no Google CDN)', () => {
  test('zero requests to fonts.googleapis.com / fonts.gstatic.com on /', async ({ page }) => {
    const { urls, cleanup } = collectGoogleFontRequests(page);
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    cleanup();
    expect(urls, `Expected zero Google Fonts requests on /, got: ${urls.join(', ')}`).toEqual([]);
  });

  test('zero requests to fonts.googleapis.com / fonts.gstatic.com on /debug/design-system-v2', async ({ page }) => {
    const { urls, cleanup } = collectGoogleFontRequests(page);
    await page.goto('/debug/design-system-v2');
    await page.waitForLoadState('networkidle');
    cleanup();
    expect(urls, `Expected zero Google Fonts requests on design-system-v2, got: ${urls.join(', ')}`).toEqual([]);
  });
});
```

**Spec 2 — `tests/smoke/accent-picker.spec.ts` (DS-03):**

```typescript
import { test, expect } from '@playwright/test';

test.describe('DS-03 — accent picker (live --accent + localStorage)', () => {
  test('clicking Rose swatch updates --accent and persists in localStorage', async ({ page }) => {
    await page.goto('/debug/design-system-v2');
    await expect(page.getByRole('heading', { level: 1, name: /Ember Glass/i })).toBeVisible({ timeout: 10000 });

    // Click Rose
    await page.getByRole('button', { name: /Set accent to Rose/i }).click();

    // Assert --accent on documentElement
    const accent = await page.evaluate(() =>
      document.documentElement.style.getPropertyValue('--accent').trim()
    );
    expect(accent).toBe('oklch(0.68 0.17 0)');

    // Assert localStorage persistence
    const persisted = await page.evaluate(() => localStorage.getItem('ember-glass-accent'));
    expect(persisted).toBe('oklch(0.68 0.17 0)');

    // Assert aria-pressed flipped
    await expect(page.getByRole('button', { name: /Set accent to Rose/i })).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByRole('button', { name: /Set accent to Copper/i })).toHaveAttribute('aria-pressed', 'false');
  });

  test('all 6 swatches present with aria-labels', async ({ page }) => {
    await page.goto('/debug/design-system-v2');
    for (const name of ['Copper', 'Rose', 'Violet', 'Blue', 'Green', 'Amber']) {
      await expect(page.getByRole('button', { name: new RegExp(`Set accent to ${name}`, 'i') })).toBeVisible();
    }
  });
});
```

**Spec 3 — `tests/smoke/ambient-persist.spec.ts` (DS-05):**

```typescript
import { test, expect } from '@playwright/test';

test.describe('DS-05 — ambient persistence (hard reload survival)', () => {
  test.beforeEach(async ({ page }) => {
    // Reset state before each test: clear persisted ambient + reset documentElement.dataset.ambient
    // (the inline pre-paint script may have set dataset.ambient='on' from a previous test's leak).
    await page.goto('/debug/design-system-v2');
    await page.evaluate(() => {
      localStorage.removeItem('ember-glass-ambient');
      delete document.documentElement.dataset.ambient;
    });
  });

  test('localStorage ember-glass-ambient=true survives hard reload via inline pre-paint script', async ({ page }) => {
    await page.goto('/debug/design-system-v2');
    await page.evaluate(() => localStorage.setItem('ember-glass-ambient', 'true'));
    await page.reload();
    const dataAmbient = await page.evaluate(() => document.documentElement.dataset.ambient);
    expect(dataAmbient).toBe('on');
  });

  test('default visit (no localStorage) leaves data-ambient unset (D-14 default OFF)', async ({ page }) => {
    // Use a fresh context so no prior localStorage leaks in
    await page.goto('/debug/design-system-v2');
    await page.evaluate(() => localStorage.removeItem('ember-glass-ambient'));
    await page.reload();
    const dataAmbient = await page.evaluate(() => document.documentElement.dataset.ambient);
    expect(dataAmbient === undefined || dataAmbient === '' || dataAmbient === 'off').toBe(true);
  });

  test('ambient toggle on /debug/design-system-v2 dispatches event and updates dataset', async ({ page }) => {
    await page.goto('/debug/design-system-v2');
    await page.evaluate(() => localStorage.removeItem('ember-glass-ambient'));
    await page.reload();
    await page.getByRole('switch', { name: /Attiva glow ambient/i }).click();
    const dataAmbient = await page.evaluate(() => document.documentElement.dataset.ambient);
    expect(dataAmbient).toBe('on');
    const persisted = await page.evaluate(() => localStorage.getItem('ember-glass-ambient'));
    expect(persisted).toBe('true');
  });
});
```

Notes:
- `waitForLoadState('networkidle')` is used in fonts spec because `domcontentloaded` may miss late lazy `@font-face` resolutions (Pitfall 5).
- All three specs hit the dev server (or built preview) configured in `playwright.config.ts`. They do NOT require a fresh build — only the dev server.
- The auth-setup convention used by other specs in this repo is preserved by virtue of `playwright.config.ts` projects; if `/debug/design-system-v2` is gated by Auth0 in this codebase, the specs inherit `storageState` from the existing auth project. `/debug/*` routes ARE gated; the existing `tests/auth.setup.ts` storageState applies via project config — no extra setup needed in these specs.
- `page.evaluate` is used to read/write `localStorage` and `documentElement` state because Playwright runs assertions against in-page DOM snapshots, not the test runner's globals.
  </action>
  <verify>
    <automated>npx playwright test tests/smoke/fonts-self-hosted.spec.ts tests/smoke/accent-picker.spec.ts tests/smoke/ambient-persist.spec.ts --reporter=line</automated>
  </verify>
  <acceptance_criteria>
    - File `tests/smoke/fonts-self-hosted.spec.ts` exists
    - File `tests/smoke/accent-picker.spec.ts` exists
    - File `tests/smoke/ambient-persist.spec.ts` exists
    - `grep -c "fonts.googleapis.com" tests/smoke/fonts-self-hosted.spec.ts` returns at least 2 (filter + error message)
    - `grep -c "fonts.gstatic.com" tests/smoke/fonts-self-hosted.spec.ts` returns at least 2
    - `grep -c "waitForLoadState('networkidle')" tests/smoke/fonts-self-hosted.spec.ts` returns at least 2
    - `grep -c "Set accent to Rose" tests/smoke/accent-picker.spec.ts` returns at least 1
    - `grep -c "oklch(0.68 0.17 0)" tests/smoke/accent-picker.spec.ts` returns at least 2 (--accent assertion + localStorage assertion)
    - `grep -c "Set accent to" tests/smoke/accent-picker.spec.ts` returns at least 2
    - `grep -c "data-ambient" tests/smoke/ambient-persist.spec.ts` returns 0 (uses dataset.ambient via evaluate; just confirms semantic)
    - `grep -c "dataset.ambient" tests/smoke/ambient-persist.spec.ts` returns at least 3
    - `grep -c "page.reload" tests/smoke/ambient-persist.spec.ts` returns at least 2
    - `grep -c "ember-glass-ambient" tests/smoke/ambient-persist.spec.ts` returns at least 3
    - `grep -c "Attiva glow ambient" tests/smoke/ambient-persist.spec.ts` returns 1
    - `npx playwright test tests/smoke/fonts-self-hosted.spec.ts tests/smoke/accent-picker.spec.ts tests/smoke/ambient-persist.spec.ts` exits 0 (all tests green)
  </acceptance_criteria>
  <done>
    - Three Playwright spec files exist at `tests/smoke/`.
    - Fonts spec asserts zero Google Fonts requests on `/` and `/debug/design-system-v2` (DS-04).
    - Accent picker spec asserts swatch click → --accent updates → localStorage persists (DS-03).
    - Ambient persist spec asserts localStorage ambient='true' + reload → data-ambient='on' (DS-05).
    - All three specs run under existing Playwright config inheriting auth storageState.
    - Listener pattern matches existing `page.on()` + cleanup convention.
  </done>
</task>

<task type="auto">
  <name>Task 3: Add Design System v2 nav link to /debug index + run DS-02 audit grep + run scoped suite verification</name>
  <files>app/debug/page.tsx</files>
  <read_first>
    - app/debug/page.tsx (current state, lines 360-380 for the existing Design System button at lines 363-369 per PATTERNS.md)
    - .planning/phases/174-ember-glass-tokens-foundations/174-CONTEXT.md D-06
    - .planning/phases/174-ember-glass-tokens-foundations/174-PATTERNS.md §"app/debug/page.tsx (page modify)"
    - .planning/phases/174-ember-glass-tokens-foundations/174-RESEARCH.md §"Open Question 4: Where to surface the picker entry from /debug/page.tsx"
    - .planning/phases/174-ember-glass-tokens-foundations/174-UI-SPEC.md §"Component Inventory" — `/debug` index link row
  </read_first>
  <action>
**Edit 1 — Add a sibling nav button to `/debug/page.tsx`:**

Locate the existing "Design System" button (around lines 363-369 — `<Button variant="outline" onClick={() => window.location.href = '/debug/design-system'}><Palette …/>Design System</Button>`).

Insert a sibling `<Button>` IMMEDIATELY AFTER it, with identical shape but linking to `/debug/design-system-v2` and labeled `Design System v2`. Reuse the already-imported `Palette` icon (no new imports):

```tsx
<Button
  variant="outline"
  onClick={() => window.location.href = '/debug/design-system-v2'}
>
  <Palette size={18} className="mr-2" />
  Design System v2
</Button>
```

Do not modify any other line in `app/debug/page.tsx`.

**Edit 2 — Run the DS-02 audit grep (no file changes, verification only):**

Execute the audit grep manually (this is a one-time verification — record the result in 174-03-SUMMARY.md):

```bash
# Forbidden in NEW glass surface files (per D-04 scope):
# 1. Hardcoded hex colors (3, 6, or 8-digit hex literals)
grep -rEn '#[0-9a-fA-F]{3,8}\b' \
  app/components/EmberGlass/ \
  app/debug/design-system-v2/ \
  | grep -v 'AUDIT-EXCEPTION' \
  || echo "PASS: no hardcoded hex colors outside AUDIT-EXCEPTION"

# 2. Hardcoded blur(Npx) values (must use var(--glass-blur))
grep -rEn 'blur\([0-9]+px\)' \
  app/components/EmberGlass/ \
  app/debug/design-system-v2/ \
  | grep -v 'AUDIT-EXCEPTION' \
  || echo "PASS: no hardcoded blur values outside AUDIT-EXCEPTION"

# 3. Hardcoded oklch() values outside the picker preset map (which is itself the source-of-truth and tagged AUDIT-EXCEPTION)
grep -rEn 'oklch\(' \
  app/components/EmberGlass/ \
  | grep -v 'AUDIT-EXCEPTION' \
  || echo "PASS: AmbientBg uses var(--accent), no oklch literals"
```

Expected results:
- AmbientBg blob B's `#301010` mix-target is on a line tagged `// AUDIT-EXCEPTION` → excluded.
- AmbientBg blob C's `rgba(94, 175, 255, 0.25)` is on a line tagged `// AUDIT-EXCEPTION` → excluded.
- The `ACCENT_PRESETS` map in design-system-v2/page.tsx is documented under one block-level `// AUDIT-EXCEPTION` comment → excluded.
- All three grep lines should print PASS.

If any grep returns a non-PASS hit (a hex color or `blur(Npx)` literal NOT tagged `AUDIT-EXCEPTION`), the audit fails — FIX before completing the task by replacing the literal with the appropriate `var(--*)` token reference.

**Edit 3 — Run the full Phase 174 verification cascade:**

```bash
# 1. Unit tests for new files
npm test -- app/components/EmberGlass/__tests__/AmbientBg.test.tsx app/debug/design-system-v2/__tests__/page.test.tsx

# 2. Scoped page suite (sanity)
npm run test:pages -- design-system-v2

# 3. Component suite (sanity)
npm run test:components -- AmbientBg

# 4. Playwright smoke specs
npx playwright test tests/smoke/fonts-self-hosted.spec.ts tests/smoke/accent-picker.spec.ts tests/smoke/ambient-persist.spec.ts

# 5. DS-01 token count grep
grep -E '^\s+--(glass-bg|glass-blur|glass-border|glass-shadow|accent|text-1|text-2|r-card|pad-card|font-display|font-body):' app/globals.css | wc -l
# Expected: >= 11

# 6. DS-06 fallback grep
grep -E '@supports not \(\(backdrop-filter: blur\(1px\)\) or \(-webkit-backdrop-filter: blur\(1px\)\)\)' app/globals.css
# Expected: 1 hit
```

Record all outcomes in 174-03-SUMMARY.md.
  </action>
  <verify>
    <automated>bash -c "set -e; grep -c 'design-system-v2' app/debug/page.tsx | awk '{if(\$1<1){print \"FAIL: nav link missing\"; exit 1} else {print \"OK\"}}'; HEX_HITS=\$(grep -rEn '#[0-9a-fA-F]{3,8}\\b' app/components/EmberGlass/ app/debug/design-system-v2/ 2>/dev/null | grep -v AUDIT-EXCEPTION | wc -l | tr -d ' '); if [ \"\$HEX_HITS\" != \"0\" ]; then echo \"FAIL: \$HEX_HITS untagged hex colors in NEW glass files\"; exit 1; fi; BLUR_HITS=\$(grep -rEn 'blur\\([0-9]+px\\)' app/components/EmberGlass/ app/debug/design-system-v2/ 2>/dev/null | grep -v AUDIT-EXCEPTION | wc -l | tr -d ' '); if [ \"\$BLUR_HITS\" != \"0\" ]; then echo \"FAIL: \$BLUR_HITS untagged blur literals\"; exit 1; fi; OKLCH_HITS=\$(grep -rEn 'oklch\\(' app/components/EmberGlass/ 2>/dev/null | grep -v AUDIT-EXCEPTION | wc -l | tr -d ' '); if [ \"\$OKLCH_HITS\" != \"0\" ]; then echo \"FAIL: \$OKLCH_HITS untagged oklch literals in EmberGlass dir\"; exit 1; fi; echo 'DS-02 audit PASS'"</automated>
  </verify>
  <acceptance_criteria>
    - `grep -c "/debug/design-system-v2" app/debug/page.tsx` returns at least 1
    - `grep -c "Design System v2" app/debug/page.tsx` returns at least 1
    - `grep -c "Design System" app/debug/page.tsx` returns at least 2 (existing v1 button + new v2 button)
    - DS-02 audit grep (hex colors): `grep -rEn '#[0-9a-fA-F]{3,8}\b' app/components/EmberGlass/ app/debug/design-system-v2/ | grep -v AUDIT-EXCEPTION` returns 0 lines
    - DS-02 audit grep (blur literals): `grep -rEn 'blur\([0-9]+px\)' app/components/EmberGlass/ app/debug/design-system-v2/ | grep -v AUDIT-EXCEPTION` returns 0 lines
    - DS-02 audit grep (oklch outside picker): `grep -rEn 'oklch\(' app/components/EmberGlass/ | grep -v AUDIT-EXCEPTION` returns 0 lines
    - DS-01 token count: `grep -E '^\s+--(glass-bg|glass-blur|glass-border|glass-shadow|accent|text-1|text-2|r-card|pad-card|font-display|font-body):' app/globals.css | wc -l` returns >= 11
    - DS-06 fallback present: `grep -E '@supports not \(\(backdrop-filter' app/globals.css` returns at least 1 line
    - `npm run test:components -- AmbientBg` exits 0
    - `npm run test:pages -- design-system-v2` exits 0
    - `npx playwright test tests/smoke/fonts-self-hosted.spec.ts tests/smoke/accent-picker.spec.ts tests/smoke/ambient-persist.spec.ts` exits 0
  </acceptance_criteria>
  <done>
    - `/debug` index has a "Design System v2" button next to the existing "Design System" button, linking to `/debug/design-system-v2`.
    - DS-02 audit grep verifies zero untagged hex / blur / oklch literals across all NEW glass surface files (per D-04 scope).
    - DS-01 token count is at least 11 (verifies Plan 01 token block intact).
    - DS-06 `@supports not` fallback rule confirmed in globals.css.
    - All Wave 0 tests created in this plan pass under their scoped commands.
    - Playwright smoke specs all green.
  </done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| Browser → /debug/design-system-v2 page | Auth0-gated route (existing `/debug/*` gate per project layout); only authenticated users reach the picker UI. |
| Picker click → localStorage write | Same-origin localStorage; values applied via `setProperty('--accent', value)` with no allowlist (mirrors T-174-02-02 acceptance from Plan 02). |
| Picker click → CustomEvent dispatch | Same-page event channel between the picker and the AmbientBg provider; both same-origin. |
| Playwright spec → live dev/preview server | Tests run against the project's playwright config; no production credentials transmitted. |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-174-03-01 | Tampering | Picker writes raw oklch string to localStorage; downstream Plan 02 inline script applies it via `setProperty('--accent', value)` without validation | accept | Same as T-174-02-02 (inherited from Plan 02 threat model). The picker page restricts choices to the 6 known oklch strings (no free-text input field exists in this UI), so the only way an attacker can poison localStorage is via a separate same-origin XSS — which would have higher-impact vectors than visual styling. Future hardening phase may add allowlist validation in the inline script. |
| T-174-03-02 | XSS / Injection | Italian/English copy strings rendered via React (auto-escaped) | accept | All copy is hardcoded; no user input rendered; React JSX auto-escapes. |
| T-174-03-03 | Information Disclosure | `/debug/design-system-v2` exposes design tokens (visible to authenticated devs) | accept | Page is dev-only; values are not secrets. |
| T-174-03-04 | Denial of Service | localStorage QuotaExceededError on setItem | mitigate | All `localStorage.setItem` calls wrapped in `try { … } catch { /* noop */ }` (verified by unit test "does not throw when localStorage.setItem fails"). |
| T-174-03-05 | Spoofing | CustomEvent `'ember-glass-ambient-change'` could be dispatched by any same-origin script to spoof a user toggle | accept | Same-origin only; no security or auth impact (visual styling toggle). Same as T-174-02-05. |
| T-174-03-06 | Repudiation | n/a | accept | No audit log surface. |
| T-174-03-07 | Elevation of Privilege | n/a | accept | No auth surface modified; route is gated by existing project Auth0 layout. |
</threat_model>

<verification>
Plan 03 IS the canonical verification surface for Phase 174. Run after merge:
- `npm run test:components -- AmbientBg` (Plan 02 unit test, regression check)
- `npm run test:pages -- design-system-v2` (Task 1 unit test)
- `npx playwright test tests/smoke/fonts-self-hosted.spec.ts tests/smoke/accent-picker.spec.ts tests/smoke/ambient-persist.spec.ts` (Task 2 e2e)
- DS-02 audit grep (Task 3 acceptance criteria — automated in `<verify><automated>`)
- DS-01 token count grep (>= 11)
- DS-06 `@supports not` grep (>= 1)

For human-only verification (UI-SPEC §"Manual-Only Verifications"):
- Visual inspection of ambient gradient animations on `/debug/design-system-v2` (Compare against `.planning/inbox/ember-glass-design/project/Pannello Stufa - Redesign.html`).
- Backdrop-filter fallback test in Safari Technology Preview with `Develop > Disable Backdrop Filter`.
- Outfit + Inter visual pairing match against `Design System.html`.
</verification>

<success_criteria>
- DS-01: 11 Ember Glass tokens declared on `:root` (verified by grep against `app/globals.css`).
- DS-02: Zero hardcoded glass/blur/accent values in NEW glass surface files outside `AUDIT-EXCEPTION` tags.
- DS-03: `/debug/design-system-v2` ships 6 hue-preset swatches; clicking updates `--accent` live + persists localStorage; verified by unit test (13 cases) and Playwright `accent-picker.spec.ts` (2 cases).
- DS-04: Playwright `fonts-self-hosted.spec.ts` confirms zero Google Fonts requests on `/` and `/debug/design-system-v2`.
- DS-05: Ambient toggle persists in localStorage; hard reload sets `<html data-ambient="on">` via inline pre-paint script; verified by `ambient-persist.spec.ts` (3 cases).
- DS-06: `.glass-surface` utility + `@supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px)))` fallback confirmed by grep; manual visual verification deferred to UAT (Safari Technology Preview).
</success_criteria>

<output>
After completion, create `.planning/phases/174-ember-glass-tokens-foundations/174-03-SUMMARY.md` documenting:
- Path of new design-system-v2 page + LOC
- Path of new unit test + count of test cases passing
- Paths of three Playwright spec files + count of tests passing each
- Verbatim output of the DS-02 audit grep cascade (3 grep commands)
- Confirmation of `/debug` index nav link added (line of insertion)
- Confirmation that DS-01 token count grep returns >= 11
- Confirmation that DS-06 `@supports not` grep returns >= 1
- Outstanding manual-only verifications (UI-SPEC §"Manual-Only Verifications" — 3 items deferred to UAT/visual review)
</output>
