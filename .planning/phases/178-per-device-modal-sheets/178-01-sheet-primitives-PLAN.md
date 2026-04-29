---
phase: 178
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - app/components/EmberGlass/sheets/primitives/SheetRow.tsx
  - app/components/EmberGlass/sheets/primitives/Stepper.tsx
  - app/components/EmberGlass/sheets/primitives/Slider.tsx
  - app/components/EmberGlass/sheets/primitives/RadialDial.tsx
  - app/components/EmberGlass/sheets/primitives/SheetBtn.tsx
  - app/components/EmberGlass/sheets/primitives/QuickActionButton.tsx
  - app/components/EmberGlass/sheets/primitives/__tests__/SheetRow.test.tsx
  - app/components/EmberGlass/sheets/primitives/__tests__/Stepper.test.tsx
  - app/components/EmberGlass/sheets/primitives/__tests__/Slider.test.tsx
  - app/components/EmberGlass/sheets/primitives/__tests__/RadialDial.test.tsx
  - app/components/EmberGlass/sheets/primitives/__tests__/SheetBtn.test.tsx
  - app/components/EmberGlass/sheets/primitives/__tests__/QuickActionButton.test.tsx
  - app/globals.css
autonomous: true
requirements: [SHEET-02, SHEET-03, SHEET-04, SHEET-05, SHEET-06]
tags: [ember-glass, sheets, primitives]
must_haves:
  truths:
    - "Six sheet sub-primitive component files exist under app/components/EmberGlass/sheets/primitives/"
    - "Each interactive sub-primitive button carries data-sheet-focusable=\"true\""
    - "globals.css contains [data-sheet-focusable=\"true\"]:focus-visible rule"
    - "Every sub-primitive has a jest spec that asserts data-testid presence + onChange/onClick wiring"
    - "Zero useMemo / useCallback in any sub-primitive file"
    - "Zero Tailwind classes for visual values; bundle inline-style verbatim"
  artifacts:
    - path: app/components/EmberGlass/sheets/primitives/SheetRow.tsx
      provides: "label + value + right-slot row primitive (D-10)"
      min_lines: 25
    - path: app/components/EmberGlass/sheets/primitives/Stepper.tsx
      provides: "36×36 ± + 18px display number stepper (D-11)"
      min_lines: 35
    - path: app/components/EmberGlass/sheets/primitives/Slider.tsx
      provides: "140×6 custom range with two-stop gradient fill (D-12)"
      min_lines: 25
    - path: app/components/EmberGlass/sheets/primitives/RadialDial.tsx
      provides: "220×220 SVG arc + center label + 44×44 ± buttons (D-13)"
      min_lines: 70
    - path: app/components/EmberGlass/sheets/primitives/SheetBtn.tsx
      provides: "Icon + label flat sheet button (D-14)"
      min_lines: 20
    - path: app/components/EmberGlass/sheets/primitives/QuickActionButton.tsx
      provides: "Yellow-active pill button (D-15)"
      min_lines: 20
  key_links:
    - from: app/globals.css
      to: app/components/EmberGlass/sheets/primitives/*.tsx
      via: "[data-sheet-focusable=\"true\"]:focus-visible"
      pattern: "data-sheet-focusable=\\\"true\\\""
user_setup: []
---

<objective>
Ship the six bundle-verbatim sheet sub-primitives that every Phase 178 sheet body composes. Each primitive is a presentational React 19 component with inline-style + `var(--token)` references, lifted verbatim from `.planning/inbox/ember-glass-design/project/components/sheets.jsx` per CONTEXT D-02.

Primitives delivered:
- `<SheetRow>` (D-10) — label + optional 12px subtitle + optional right-slot child.
- `<Stepper>` (D-11) — 36×36 ± buttons + 18px Outfit display value.
- `<Slider>` (D-12) — 140×6 custom range with two-stop gradient (ships unused; Phase 179 consumes).
- `<RadialDial>` (D-13) — 220×220 SVG (270° arc) + 68px center value + 44×44 ± buttons.
- `<SheetBtn>` (D-14) — flat 16px-pad icon + label button.
- `<QuickActionButton>` (D-15) — yellow-active pill button (Lights "Tutte on/off").

Plus: append the 3-LOC `[data-sheet-focusable="true"]:focus-visible` rule to `app/globals.css` (UI-SPEC §"Focus-visible outlines").

Purpose: Foundation primitives for Wave 2 sheet bodies. Verbatim bundle visuals; no behavioral interpretation.
Output: 6 .tsx primitive files, 6 jest specs, 1 globals.css edit (3-LOC append).
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@.planning/ROADMAP.md
@.planning/phases/178-per-device-modal-sheets/178-CONTEXT.md
@.planning/phases/178-per-device-modal-sheets/178-UI-SPEC.md
@.planning/phases/178-per-device-modal-sheets/178-PATTERNS.md
@.planning/inbox/ember-glass-design/project/components/sheets.jsx
@app/components/EmberGlass/InlineToggle.tsx
@app/globals.css

<interfaces>
<!-- Bundle source line ranges (PRIMARY visual contract): -->
<!-- SheetRow:  sheets.jsx:469-482 -->
<!-- Stepper:   sheets.jsx:484-500 -->
<!-- Slider:    sheets.jsx:502-513 -->
<!-- RadialDial: sheets.jsx:536-579 -->
<!-- SheetBtn:  sheets.jsx:581-592 -->
<!-- QuickActionButton: sheets.jsx:299-306 (the `quickBtn` style helper, ported to component) -->

<!-- All primitives use inline `style={{ }}` + `var(--token)` per Phase 174 D-12 / 175 D-08 / 177 D-02 mandate. -->
<!-- No Tailwind classes for visual values. No useMemo / useCallback. -->
<!-- AUDIT-EXCEPTION comments tag every hex/rgba literal lifted from bundle. -->
</interfaces>
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Ship SheetRow + Stepper + SheetBtn + QuickActionButton primitives + jest specs</name>
  <files>
    app/components/EmberGlass/sheets/primitives/SheetRow.tsx,
    app/components/EmberGlass/sheets/primitives/Stepper.tsx,
    app/components/EmberGlass/sheets/primitives/SheetBtn.tsx,
    app/components/EmberGlass/sheets/primitives/QuickActionButton.tsx,
    app/components/EmberGlass/sheets/primitives/__tests__/SheetRow.test.tsx,
    app/components/EmberGlass/sheets/primitives/__tests__/Stepper.test.tsx,
    app/components/EmberGlass/sheets/primitives/__tests__/SheetBtn.test.tsx,
    app/components/EmberGlass/sheets/primitives/__tests__/QuickActionButton.test.tsx
  </files>
  <read_first>
    - .planning/inbox/ember-glass-design/project/components/sheets.jsx (lines 469-500, 581-592, 299-306 — verbatim source for all 4 primitives)
    - .planning/phases/178-per-device-modal-sheets/178-UI-SPEC.md (§"Component API + Variants" → SheetRow / Stepper / SheetBtn / QuickActionButton)
    - .planning/phases/178-per-device-modal-sheets/178-PATTERNS.md (lines 313-403 — verbatim port code; lines 410-418 for SheetBtn / QuickActionButton)
    - .planning/phases/178-per-device-modal-sheets/178-CONTEXT.md (D-10, D-11, D-14, D-15, D-24 — no Pressable wrap)
    - app/components/EmberGlass/InlineToggle.tsx (existing primitive structure reference)
  </read_first>
  <behavior>
    SheetRow:
    - Test 1: renders `data-testid="sheet-row"`, `data-testid="sheet-row-label"` with the given label.
    - Test 2: when `value` prop is set, renders `data-testid="sheet-row-value"` with the value text.
    - Test 3: when `value` prop is undefined, NO `sheet-row-value` element is rendered.
    - Test 4: children prop is rendered as the right-slot child.

    Stepper:
    - Test 1: renders `data-testid="stepper"`, `stepper-minus`, `stepper-value`, `stepper-plus`. The displayed value matches `value` prop.
    - Test 2: clicking minus button fires `onChange(value - 1)` when `value > min`.
    - Test 3: clicking minus when `value === min` fires `onChange(min)` (clamped — does NOT go below min).
    - Test 4: clicking plus button fires `onChange(value + 1)` when `value < max`.
    - Test 5: clicking plus when `value === max` fires `onChange(max)` (clamped).
    - Test 6: minus button has `aria-label="Diminuisci"`, plus button has `aria-label="Aumenta"`.
    - Test 7: both buttons carry `data-sheet-focusable="true"`.

    SheetBtn:
    - Test 1: renders `<button>` with `data-component="sheet-btn"` AND `data-testid="sheet-btn-{label-slug}"` (e.g. `sheet-btn-orari` for label "Orari"). Per checker WARNING 6, JSX accepts only one `data-testid`; the class selector is `data-component`.
    - Test 2: renders given Icon component AND label text.
    - Test 3: clicking fires the `onClick` callback.
    - Test 4: button carries `data-sheet-focusable="true"`.

    QuickActionButton:
    - Test 1: renders `data-testid="quick-action-button"` and `data-testid="quick-action-{label-slug}"`.
    - Test 2: when `active === true`, button background contains `rgba(245,200,74,0.18)` (yellow tint) and color is `#f5c84a`.
    - Test 3: when `active === false`, button background contains `rgba(255,255,255,0.05)` and color is `#fff`.
    - Test 4: clicking fires `onClick`.
    - Test 5: button carries `data-sheet-focusable="true"`.
  </behavior>
  <action>
Create FOUR primitive files plus FOUR jest specs. Use the Write tool — never `cat <<EOF`. Each file is `'use client'` not required (these are presentational, no hooks). All specs use `@testing-library/react` (existing project convention — mirror `app/components/EmberGlass/__tests__/InlineToggle.test.tsx` if present, otherwise mirror any existing primitive spec pattern).

**File 1: `app/components/EmberGlass/sheets/primitives/SheetRow.tsx`** (verbatim port of bundle `sheets.jsx:469-482`):

```tsx
import type { ReactNode } from 'react';

/**
 * Sheet row primitive (CONTEXT D-10) — label + optional 12px subtitle + optional right-slot child.
 *
 * Used by StoveSheet (Livello fiamma, Ventola), ClimateSheet (Tipo).
 *
 * Visual contract verbatim from bundle `sheets.jsx:469-482`. NO Pressable wrap (D-24)
 * — sheet sub-primitives are bare structural elements, not glass surfaces.
 */
export interface SheetRowProps {
  label: string;
  value?: string;
  children?: ReactNode;
}

export function SheetRow({ label, value, children }: SheetRowProps) {
  return (
    <div
      data-testid="sheet-row"
      style={{
        marginTop: 18,
        padding: '14px 0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '0.5px solid rgba(255,255,255,0.06)', // AUDIT-EXCEPTION (sheets.jsx:473)
        gap: 12,
      }}
    >
      <div>
        <div
          data-testid="sheet-row-label"
          style={{ fontSize: 14, color: '#fff', fontWeight: 500 }} // AUDIT-EXCEPTION '#fff' (sheets.jsx:477)
        >
          {label}
        </div>
        {value !== undefined && (
          <div
            data-testid="sheet-row-value"
            style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 2 }}
          >
            {value}
          </div>
        )}
      </div>
      {children}
    </div>
  );
}
```

**File 2: `app/components/EmberGlass/sheets/primitives/Stepper.tsx`** (verbatim port of bundle `sheets.jsx:484-500`, with lucide icons + `data-sheet-focusable` + ARIA + JSDoc per UI-SPEC §"Component API"):

```tsx
import { Minus, Plus } from 'lucide-react';

/**
 * Stepper primitive (CONTEXT D-11) — 36×36 minus + 18px Outfit display value + 36×36 plus.
 *
 * **Caller signature wrap caveat** — emits a raw `number` via `onChange`. Callers wrap to fit
 * consuming hook signatures, e.g. `useStoveCommands.handlePowerChange` takes
 * `{ target: { value: String(v) } }`, so StoveSheet does:
 *   `onChange={(v) => handlePowerChange({ target: { value: String(v) } })}`.
 * Phase 179 (Rooms tab) MUST follow the same pattern when reusing Stepper for thermostat ±.
 *
 * Visual contract verbatim from bundle `sheets.jsx:484-500`. NO Pressable wrap (D-24).
 */
export interface StepperProps {
  value: number;
  min: number;
  max: number;
  onChange: (next: number) => void;
}

export function Stepper({ value, min, max, onChange }: StepperProps) {
  return (
    <div
      data-testid="stepper"
      style={{ display: 'flex', alignItems: 'center', gap: 8 }}
    >
      <button
        type="button"
        data-testid="stepper-minus"
        data-sheet-focusable="true"
        aria-label="Diminuisci"
        onClick={() => onChange(Math.max(min, value - 1))}
        style={{
          width: 36,
          height: 36,
          borderRadius: 999,
          border: 'none',
          background: 'rgba(255,255,255,0.1)', // AUDIT-EXCEPTION (sheets.jsx:488)
          color: '#fff', // AUDIT-EXCEPTION
          cursor: 'pointer',
        }}
      >
        <Minus size={14} strokeWidth={2.5} />
      </button>
      <div
        data-testid="stepper-value"
        style={{
          minWidth: 36,
          textAlign: 'center',
          fontFamily: 'var(--font-display)',
          fontSize: 18,
          fontWeight: 600,
          color: '#fff', // AUDIT-EXCEPTION (sheets.jsx:491)
        }}
      >
        {value}
      </div>
      <button
        type="button"
        data-testid="stepper-plus"
        data-sheet-focusable="true"
        aria-label="Aumenta"
        onClick={() => onChange(Math.min(max, value + 1))}
        style={{
          width: 36,
          height: 36,
          borderRadius: 999,
          border: 'none',
          background: 'rgba(255,255,255,0.1)', // AUDIT-EXCEPTION (sheets.jsx:495)
          color: '#fff',
          cursor: 'pointer',
        }}
      >
        <Plus size={14} strokeWidth={2.5} />
      </button>
    </div>
  );
}
```

**File 3: `app/components/EmberGlass/sheets/primitives/SheetBtn.tsx`** (verbatim port of bundle `sheets.jsx:581-592`):

Per checker WARNING 6 — JSX accepts only ONE `data-testid` attribute. The class-of-element selector is provided via `data-component="sheet-btn"`; the per-instance selector is the slugged `data-testid={`sheet-btn-${slugify(label)}`}`. This satisfies UI-SPEC selectors (`sheet-btn-orari`, `sheet-btn-manutenzione`) and lets specs query by both attribute selectors. Do NOT also add a `data-testid="sheet-btn"`.

```tsx
import type { LucideIcon } from 'lucide-react';

/**
 * Sheet button primitive (CONTEXT D-14) — 16px-pad rounded 16px box, 0.5px white border,
 * 14px 500 label with leading lucide icon. Used by StoveSheet (Orari, Manutenzione).
 *
 * Visual contract verbatim from bundle `sheets.jsx:581-592`. NO Pressable wrap (D-24).
 */
export interface SheetBtnProps {
  Icon: LucideIcon;
  label: string;
  onClick?: () => void;
}

function slugify(label: string): string {
  return label.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

export function SheetBtn({ Icon, label, onClick }: SheetBtnProps) {
  return (
    <button
      type="button"
      data-component="sheet-btn"
      data-testid={`sheet-btn-${slugify(label)}`}
      data-sheet-focusable="true"
      onClick={onClick}
      style={{
        padding: 16,
        borderRadius: 16,
        border: '0.5px solid rgba(255,255,255,0.06)', // AUDIT-EXCEPTION (sheets.jsx:585)
        background: 'rgba(255,255,255,0.05)', // AUDIT-EXCEPTION (sheets.jsx:584)
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        color: '#fff', // AUDIT-EXCEPTION
        fontSize: 14,
        fontWeight: 500,
        cursor: 'pointer',
      }}
    >
      <Icon size={18} stroke="var(--text-2)" />
      {label}
    </button>
  );
}
```

**File 4: `app/components/EmberGlass/sheets/primitives/QuickActionButton.tsx`** (verbatim port of bundle `quickBtn` helper `sheets.jsx:299-306`):

```tsx
/**
 * Quick action pill button primitive (CONTEXT D-15) — yellow-active pill for LightsSheet
 * "Tutte on / Tutte off". Active state uses Lights yellow (#f5c84a); inactive is neutral white-04.
 *
 * Visual contract verbatim from bundle `sheets.jsx:299-306` (the `quickBtn` style helper, ported
 * to a tiny presentational component). NO Pressable wrap (D-24).
 */
export interface QuickActionButtonProps {
  active: boolean;
  onClick: () => void;
  label: string;
}

function slugify(label: string): string {
  return label.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

export function QuickActionButton({ active, onClick, label }: QuickActionButtonProps) {
  return (
    <button
      type="button"
      data-component="quick-action-button"
      data-testid={`quick-action-${slugify(label)}`}
      data-sheet-focusable="true"
      onClick={onClick}
      style={{
        padding: '10px 14px',
        borderRadius: 12,
        border: active
          ? '0.5px solid rgba(245,200,74,0.3)' // AUDIT-EXCEPTION (sheets.jsx:304)
          : '0.5px solid rgba(255,255,255,0.06)', // AUDIT-EXCEPTION
        background: active
          ? 'rgba(245,200,74,0.18)' // AUDIT-EXCEPTION (sheets.jsx:302)
          : 'rgba(255,255,255,0.05)', // AUDIT-EXCEPTION
        color: active ? '#f5c84a' : '#fff', // AUDIT-EXCEPTION (sheets.jsx:303)
        fontSize: 12,
        fontWeight: 600,
        whiteSpace: 'nowrap',
        cursor: 'pointer',
      }}
    >
      {label}
    </button>
  );
}
```

**Jest specs (4 files)** — under `app/components/EmberGlass/sheets/primitives/__tests__/`. Use `@testing-library/react` `render` + `screen.getByTestId` + `userEvent`/`fireEvent`. Mirror the spec patterns from existing EmberGlass primitive tests. Each spec MUST cover the behavior listed above. Use `'use strict'`; no React import needed (Next.js automatic JSX runtime).

Example spec skeleton for Stepper:
```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { Stepper } from '../Stepper';

describe('Stepper (CONTEXT D-11)', () => {
  it('renders ± buttons + value display with required testids', () => {
    render(<Stepper value={3} min={1} max={5} onChange={() => undefined} />);
    expect(screen.getByTestId('stepper')).toBeInTheDocument();
    expect(screen.getByTestId('stepper-minus')).toBeInTheDocument();
    expect(screen.getByTestId('stepper-value')).toHaveTextContent('3');
    expect(screen.getByTestId('stepper-plus')).toBeInTheDocument();
  });

  it('clicking minus emits value - 1', () => {
    const onChange = jest.fn();
    render(<Stepper value={3} min={1} max={5} onChange={onChange} />);
    fireEvent.click(screen.getByTestId('stepper-minus'));
    expect(onChange).toHaveBeenCalledWith(2);
  });

  it('clicking minus at min clamps to min', () => {
    const onChange = jest.fn();
    render(<Stepper value={1} min={1} max={5} onChange={onChange} />);
    fireEvent.click(screen.getByTestId('stepper-minus'));
    expect(onChange).toHaveBeenCalledWith(1);
  });

  it('clicking plus emits value + 1', () => {
    const onChange = jest.fn();
    render(<Stepper value={3} min={1} max={5} onChange={onChange} />);
    fireEvent.click(screen.getByTestId('stepper-plus'));
    expect(onChange).toHaveBeenCalledWith(4);
  });

  it('clicking plus at max clamps to max', () => {
    const onChange = jest.fn();
    render(<Stepper value={5} min={1} max={5} onChange={onChange} />);
    fireEvent.click(screen.getByTestId('stepper-plus'));
    expect(onChange).toHaveBeenCalledWith(5);
  });

  it('buttons carry aria-label + data-sheet-focusable', () => {
    render(<Stepper value={3} min={1} max={5} onChange={() => undefined} />);
    expect(screen.getByTestId('stepper-minus')).toHaveAttribute('aria-label', 'Diminuisci');
    expect(screen.getByTestId('stepper-plus')).toHaveAttribute('aria-label', 'Aumenta');
    expect(screen.getByTestId('stepper-minus')).toHaveAttribute('data-sheet-focusable', 'true');
    expect(screen.getByTestId('stepper-plus')).toHaveAttribute('data-sheet-focusable', 'true');
  });
});
```

Apply the same shape to `SheetRow.test.tsx`, `SheetBtn.test.tsx`, `QuickActionButton.test.tsx`. For QuickActionButton, use `getAttribute('style')` or the inline-style serialization to assert background/color values (jsdom returns the inline style string).
  </action>
  <verify>
    <automated>npm run test:components -- app/components/EmberGlass/sheets/primitives/__tests__/SheetRow.test.tsx app/components/EmberGlass/sheets/primitives/__tests__/Stepper.test.tsx app/components/EmberGlass/sheets/primitives/__tests__/SheetBtn.test.tsx app/components/EmberGlass/sheets/primitives/__tests__/QuickActionButton.test.tsx</automated>
  </verify>
  <acceptance_criteria>
    - File `app/components/EmberGlass/sheets/primitives/SheetRow.tsx` exists and contains `data-testid="sheet-row"` AND `borderBottom: '0.5px solid rgba(255,255,255,0.06)'`.
    - File `app/components/EmberGlass/sheets/primitives/Stepper.tsx` exists and contains `aria-label="Diminuisci"` AND `aria-label="Aumenta"` AND `<Minus size={14}` AND `<Plus size={14}` AND `data-sheet-focusable="true"`.
    - File `app/components/EmberGlass/sheets/primitives/SheetBtn.tsx` exists and contains `data-component="sheet-btn"` AND uses `LucideIcon` type.
    - File `app/components/EmberGlass/sheets/primitives/QuickActionButton.tsx` exists and contains `rgba(245,200,74,0.18)` AND `#f5c84a` AND `data-component="quick-action-button"`.
    - Each `__tests__/{Name}.test.tsx` jest spec exits 0 under `npm run test:components`.
    - Zero matches for `useMemo\|useCallback` in any of the four primitive files: `! grep -E "useMemo|useCallback" app/components/EmberGlass/sheets/primitives/SheetRow.tsx app/components/EmberGlass/sheets/primitives/Stepper.tsx app/components/EmberGlass/sheets/primitives/SheetBtn.tsx app/components/EmberGlass/sheets/primitives/QuickActionButton.tsx` returns no hits.
  </acceptance_criteria>
  <done>
    Four primitive .tsx files + four jest specs exist; all four spec files green under scoped jest run; zero useMemo / useCallback in source files.
  </done>
</task>

<task type="auto" tdd="true">
  <name>Task 2: Ship Slider + RadialDial primitives + jest specs + globals.css focus rule</name>
  <files>
    app/components/EmberGlass/sheets/primitives/Slider.tsx,
    app/components/EmberGlass/sheets/primitives/RadialDial.tsx,
    app/components/EmberGlass/sheets/primitives/__tests__/Slider.test.tsx,
    app/components/EmberGlass/sheets/primitives/__tests__/RadialDial.test.tsx,
    app/globals.css
  </files>
  <read_first>
    - .planning/inbox/ember-glass-design/project/components/sheets.jsx (lines 502-513 for Slider; 536-579 for RadialDial)
    - .planning/phases/178-per-device-modal-sheets/178-UI-SPEC.md (§"Component API + Variants" → Slider / RadialDial; §"Focus-visible outlines")
    - .planning/phases/178-per-device-modal-sheets/178-PATTERNS.md (lines 410-418 for Slider/RadialDial; lines 689-699 for globals.css append)
    - .planning/phases/178-per-device-modal-sheets/178-CONTEXT.md (D-12, D-13)
    - app/globals.css (read existing `[data-pressable-focusable]:focus-visible` rule near lines 360-388 for analog placement)
  </read_first>
  <behavior>
    Slider:
    - Test 1: renders `<input type="range">` with `data-testid="slider"`, `min`, `max`, `value` matching props.
    - Test 2: changing the input value fires `onChange(Number(e.target.value))`.
    - Test 3: when `color` prop omitted, the inline `background` contains `var(--accent)`.
    - Test 4: when `color="#b080ff"` prop passed, the inline `background` contains `#b080ff` (twice — both filled stops).

    RadialDial:
    - Test 1: renders `data-testid="radial-dial"`, `radial-dial-value`, `radial-dial-label`, `radial-dial-minus`, `radial-dial-plus`.
    - Test 2: `radial-dial-value` text content matches `value` prop.
    - Test 3: `radial-dial-label` text content matches `label` prop.
    - Test 4: clicking minus fires `onChange(value - 1)` when above min; clamps at min.
    - Test 5: clicking plus fires `onChange(value + 1)` when below max; clamps at max.
    - Test 6: SVG contains two `<circle>` elements; the filled arc's `stroke` attribute matches the `color` prop.
    - Test 7: minus button has `aria-label="Diminuisci temperatura"`, plus button has `aria-label="Aumenta temperatura"`; both carry `data-sheet-focusable="true"`.

    globals.css append:
    - The string `[data-sheet-focusable="true"]:focus-visible` appears exactly once in the file.
    - The block contains `outline: 2px solid var(--accent)` AND `outline-offset: 2px`.
  </behavior>
  <action>
**File 1: `app/components/EmberGlass/sheets/primitives/Slider.tsx`** (verbatim port of bundle `sheets.jsx:502-513`):

```tsx
/**
 * Custom range slider primitive (CONTEXT D-12) — 140×6 input with two-stop gradient fill.
 *
 * **Phase 178 consumption status:** UNUSED in Phase 178 (SonosSheet uses a plain
 * `<input type="range" accentColor="#b080ff">` per bundle `sheets.jsx:374-380`).
 * Shipped now (~30 LOC) for Phase 179 (Rooms tab lights brightness) per CONTEXT D-12.
 *
 * Visual contract verbatim from bundle `sheets.jsx:502-513`.
 */
export interface SliderProps {
  value: number;
  min: number;
  max: number;
  onChange: (next: number) => void;
  color?: string;
}

export function Slider({ value, min, max, onChange, color = 'var(--accent)' }: SliderProps) {
  const pct = max === min ? 0 : (value - min) / (max - min);
  return (
    <input
      type="range"
      data-testid="slider"
      data-sheet-focusable="true"
      min={min}
      max={max}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      style={{
        WebkitAppearance: 'none',
        appearance: 'none',
        width: 140,
        height: 6,
        borderRadius: 999,
        outline: 'none',
        background: `linear-gradient(to right, ${color} 0%, ${color} ${pct * 100}%, rgba(255,255,255,0.1) ${pct * 100}%, rgba(255,255,255,0.1) 100%)`, // AUDIT-EXCEPTION (sheets.jsx:510)
      }}
    />
  );
}
```

**File 2: `app/components/EmberGlass/sheets/primitives/RadialDial.tsx`** (verbatim port of bundle `sheets.jsx:536-579`):

```tsx
import { Minus, Plus } from 'lucide-react';

/**
 * Apple-Home-style radial dial primitive (CONTEXT D-13) — 220×220 SVG (270° arc) +
 * 68px Outfit center value + 28px ° superscript + 12px sublabel + 44×44 ± buttons.
 *
 * NO drag/touch on the arc (CONTEXT D-13) — only ± buttons drive `onChange`.
 *
 * Visual contract verbatim from bundle `sheets.jsx:536-579`. Buttons are bare (no Pressable, D-24).
 */
export interface RadialDialProps {
  value: number;
  min: number;
  max: number;
  onChange: (next: number) => void;
  color: string;
  label: string;
}

export function RadialDial({ value, min, max, onChange, color, label }: RadialDialProps) {
  const pct = max === min ? 0 : (value - min) / (max - min);
  const size = 220;
  const r = 92;
  const circ = 2 * Math.PI * r;
  const arcLen = circ * 0.75;

  return (
    <div
      data-testid="radial-dial"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '8px 0 16px',
        position: 'relative',
      }}
    >
      <svg width={size} height={size} style={{ transform: 'rotate(135deg)' }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="rgba(255,255,255,0.08)" /* AUDIT-EXCEPTION (sheets.jsx:549) */
          strokeWidth={10}
          strokeLinecap="round"
          strokeDasharray={`${arcLen} ${circ}`}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={10}
          strokeLinecap="round"
          strokeDasharray={`${arcLen * pct} ${circ}`}
          style={{ filter: `drop-shadow(0 0 12px ${color})`, transition: 'stroke-dasharray .3s' }}
        />
      </svg>
      <div
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: 0,
          right: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          data-testid="radial-dial-value"
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 68,
            fontWeight: 600,
            color: '#fff', // AUDIT-EXCEPTION (sheets.jsx:560)
            lineHeight: 1,
            letterSpacing: -3,
          }}
        >
          {value}
          <span style={{ fontSize: 28, opacity: 0.5 }}>°</span>
        </div>
        <div
          data-testid="radial-dial-label"
          style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 4 }}
        >
          {label}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 12, marginTop: 14 }}>
        <button
          type="button"
          data-testid="radial-dial-minus"
          data-sheet-focusable="true"
          aria-label="Diminuisci temperatura"
          onClick={() => onChange(Math.max(min, value - 1))}
          style={{
            width: 44,
            height: 44,
            borderRadius: 999,
            border: 'none',
            background: 'rgba(255,255,255,0.08)', // AUDIT-EXCEPTION (sheets.jsx:567)
            color: '#fff',
            cursor: 'pointer',
          }}
        >
          <Minus size={18} strokeWidth={2.2} />
        </button>
        <button
          type="button"
          data-testid="radial-dial-plus"
          data-sheet-focusable="true"
          aria-label="Aumenta temperatura"
          onClick={() => onChange(Math.min(max, value + 1))}
          style={{
            width: 44,
            height: 44,
            borderRadius: 999,
            border: 'none',
            background: 'rgba(255,255,255,0.08)', // AUDIT-EXCEPTION (sheets.jsx:572)
            color: '#fff',
            cursor: 'pointer',
          }}
        >
          <Plus size={18} strokeWidth={2.2} />
        </button>
      </div>
    </div>
  );
}
```

**File 3: `app/components/EmberGlass/sheets/primitives/__tests__/Slider.test.tsx`** — covers behaviors above. Use `fireEvent.change(input, { target: { value: '50' } })`.

**File 4: `app/components/EmberGlass/sheets/primitives/__tests__/RadialDial.test.tsx`** — covers behaviors above. Assert SVG arc's `stroke` attribute via `container.querySelector('svg circle:nth-child(2)')?.getAttribute('stroke')`.

**File 5: `app/globals.css`** — APPEND (do not edit existing rules) the 3-LOC focus-visible rule. Locate the existing `[data-pressable-focusable="true"]:focus-visible` rule (around lines 360-388 per RESEARCH §Sources). Add the new rule IMMEDIATELY AFTER it with a comment header:

```css

/* Phase 178 — sheet sub-primitive focus ring (mirror Phase 175 [data-pressable-focusable]) */
[data-sheet-focusable="true"]:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}
```

Read globals.css first to find the correct insertion point (after the existing pressable rule). Use Edit (NOT Write) to append.
  </action>
  <verify>
    <automated>npm run test:components -- app/components/EmberGlass/sheets/primitives/__tests__/Slider.test.tsx app/components/EmberGlass/sheets/primitives/__tests__/RadialDial.test.tsx</automated>
  </verify>
  <acceptance_criteria>
    - File `app/components/EmberGlass/sheets/primitives/Slider.tsx` exists and contains `width: 140` AND `linear-gradient(to right` AND default `color = 'var(--accent)'`.
    - File `app/components/EmberGlass/sheets/primitives/RadialDial.tsx` exists and contains `<Minus size={18}` AND `<Plus size={18}` AND `aria-label="Diminuisci temperatura"` AND `aria-label="Aumenta temperatura"` AND `transform: 'rotate(135deg)'` AND `r=92` (or `r={92}`) AND `width: 44, height: 44`.
    - `app/globals.css` contains exactly one `[data-sheet-focusable="true"]:focus-visible` block with `outline: 2px solid var(--accent)` and `outline-offset: 2px`.
    - Both test files exit 0 under `npm run test:components`.
    - Zero `useMemo`/`useCallback` in source files: `! grep -E "useMemo|useCallback" app/components/EmberGlass/sheets/primitives/Slider.tsx app/components/EmberGlass/sheets/primitives/RadialDial.tsx` returns no hits.
  </acceptance_criteria>
  <done>
    Slider + RadialDial .tsx + 2 jest specs ship green; globals.css carries the new focus-visible rule; zero useMemo/useCallback.
  </done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| client → no API | None — these are presentational primitives with no network calls |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-178-01-01 | Tampering | Sub-primitive label/value rendering | accept | React's text-content escaping is unchanged; no `dangerouslySetInnerHTML`; labels are passed verbatim from sheet bodies that source from typed device hooks (no untrusted text). |
| T-178-01-02 | Information Disclosure | data-sheet-focusable attribute | accept | Public DOM attribute; reveals nothing sensitive. Mirrors Phase 175 `data-pressable-focusable` precedent. |
</threat_model>

<verification>
After both tasks complete:

```bash
npm run test:components -- app/components/EmberGlass/sheets/primitives
```

All 6 spec files green. Zero useMemo / useCallback across all 6 primitive files. globals.css carries the new focus rule.
</verification>

<success_criteria>
- [ ] Six primitive .tsx files exist with bundle-verbatim inline styles + AUDIT-EXCEPTION comments.
- [ ] Six jest specs assert testids + onChange/onClick wiring + ARIA labels.
- [ ] `app/globals.css` carries `[data-sheet-focusable="true"]:focus-visible` rule.
- [ ] Zero useMemo / useCallback in any new file.
- [ ] All scoped jest runs exit 0.
</success_criteria>

<output>
After completion, create `.planning/phases/178-per-device-modal-sheets/178-01-SUMMARY.md`.
</output>
