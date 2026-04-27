---
phase: 175-glass-primitives-press-animation-sheet
plan: 03
type: execute
wave: 2
depends_on: [01, 02]
files_modified:
  - app/components/EmberGlass/index.ts
  - app/debug/design-system-v2/page.tsx
  - tests/smoke/press-primitive.spec.ts
  - tests/smoke/sheet-primitive.spec.ts
autonomous: true
requirements: [DS-07, SHEET-01]
requirements_addressed: [DS-07, SHEET-01]
tags: [ember-glass, barrel-export, design-system-v2, playwright, smoke-tests, ds-07, sheet-01]

must_haves:
  truths:
    - "app/components/EmberGlass/index.ts barrel exports Pressable, usePressed, Sheet, types, and re-exports default AmbientBg"
    - "/debug/design-system-v2 page contains a new Section 05 (eyebrow '05 / PRESS', heading 'Animazione di pressione') with 3 Pressable demo surfaces (card / button / circle)"
    - "/debug/design-system-v2 page contains a new Section 06 (eyebrow '06 / SHEET', heading 'Sheet primitivo') with an 'Apri sheet demo' button and a Sheet body with 3 dummy rows + 600px spacer"
    - "tests/smoke/press-primitive.spec.ts ships 1 describe block with 3 expects (test naming covers: barrel export visibility, .press-anim class in computed CSS, transform after mouse.down)"
    - "tests/smoke/sheet-primitive.spec.ts ships 7 specs: opens via button, ESC dismiss, backdrop tap dismiss, close button dismiss, scroll-lock at y=300, mobile 375px, desktop 1024px"
    - "Playwright press primitive smoke: getComputedStyle(.press-anim element).transition matches the DS-07 curve regex (0.22s + cubic-bezier(0.34, 1.56, 0.64, 1))"
    - "Playwright Sheet primitive smoke: clicking 'Apri sheet demo' makes role=dialog visible; pressing Escape hides it; clicking [data-sheet-backdrop=true] hides it; clicking close button (aria-label='Chiudi') hides it"
    - "Playwright scroll-lock smoke: scroll to y=300, open Sheet, document.body.style.position === 'fixed'; close Sheet, window.scrollY === 300"
    - "Playwright responsive smoke: at viewport 375x812 the dialog bounding box width === 359 (375-16); at 1024x768 it === 1008 (1024-16)"
    - "All 4 EmberGlass tests + both Playwright specs pass"
  artifacts:
    - path: "app/components/EmberGlass/index.ts"
      provides: "Barrel export for the EmberGlass namespace consumed by Phases 177-181"
      exports: ["Pressable", "usePressed", "Sheet", "AmbientBg", "PressableProps", "PointerHandlers", "SheetProps"]
      min_lines: 4
    - path: "app/debug/design-system-v2/page.tsx"
      provides: "Section 05 (Press primitive demo) + Section 06 (Sheet primitive demo) appended to existing Phase 174 page"
      contains: "05 / PRESS"
    - path: "tests/smoke/press-primitive.spec.ts"
      provides: "Playwright DS-07 smoke spec — 3 expects (export visibility, .press-anim transition curve, mouse.down → scale(0.97))"
      min_lines: 25
    - path: "tests/smoke/sheet-primitive.spec.ts"
      provides: "Playwright SHEET-01 smoke spec — 7 tests covering open/ESC/backdrop/close/scroll-lock/mobile/desktop"
      min_lines: 130
  key_links:
    - from: "app/components/EmberGlass/index.ts"
      to: "Pressable, usePressed (./Pressable)"
      via: "named re-export"
      pattern: "export \\{ Pressable"
    - from: "app/components/EmberGlass/index.ts"
      to: "Sheet (./Sheet)"
      via: "named re-export"
      pattern: "export \\{ Sheet"
    - from: "app/debug/design-system-v2/page.tsx (imports)"
      to: "@/app/components/EmberGlass"
      via: "import { Pressable, Sheet }"
      pattern: "from '@/app/components/EmberGlass'"
    - from: "tests/smoke/press-primitive.spec.ts"
      to: "/debug/design-system-v2 Section 05"
      via: "page.getByTestId('press-card-demo') and getByRole('button', { name: /Esempio bottone pressabile/i })"
      pattern: "press-card-demo"
    - from: "tests/smoke/sheet-primitive.spec.ts"
      to: "/debug/design-system-v2 Section 06"
      via: "page.getByRole('button', { name: /Apri sheet demo/i })"
      pattern: "Apri sheet demo"
---

<objective>
Wire the two primitives shipped by Plans 01 + 02 into the existing `/debug/design-system-v2` page (extending the Phase 174 surface) AND ship the Playwright smoke specs that satisfy SC-#1, SC-#2, SC-#3, SC-#4, SC-#5 end-to-end.

Three deliverables:
1. **Barrel** (`app/components/EmberGlass/index.ts`) — public namespace import path for Phases 177-181 (`@/app/components/EmberGlass`).
2. **Demo page extension** (`app/debug/design-system-v2/page.tsx`) — append Section 05 (Press primitive) + Section 06 (Sheet primitive) AFTER existing Section 04. Existing Sections 01-04 untouched.
3. **Playwright smoke specs** (`tests/smoke/press-primitive.spec.ts` + `tests/smoke/sheet-primitive.spec.ts`) — match the per-feature naming convention from Phase 174 (`accent-picker.spec.ts`, `ambient-persist.spec.ts`).

Purpose: SC-#5 (mobile 375px + desktop 1024px parity) is enforced ONLY here; SC-#1/2/3/4 also get end-to-end coverage in addition to the unit tests from Plans 01-02.

Output:
- `app/components/EmberGlass/index.ts` (~5 LOC)
- `app/debug/design-system-v2/page.tsx` append (~90 LOC across 2 sections + a `useState` hook)
- `tests/smoke/press-primitive.spec.ts` (~30 LOC, 1 describe with 2 tests)
- `tests/smoke/sheet-primitive.spec.ts` (~180 LOC, 1 describe with 7 tests)
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@.planning/ROADMAP.md
@.planning/REQUIREMENTS.md
@.planning/phases/175-glass-primitives-press-animation-sheet/175-CONTEXT.md
@.planning/phases/175-glass-primitives-press-animation-sheet/175-RESEARCH.md
@.planning/phases/175-glass-primitives-press-animation-sheet/175-UI-SPEC.md
@.planning/phases/175-glass-primitives-press-animation-sheet/175-PATTERNS.md
@.planning/phases/175-glass-primitives-press-animation-sheet/175-01-pressable-primitive-PLAN.md
@.planning/phases/175-glass-primitives-press-animation-sheet/175-02-sheet-primitive-PLAN.md
@.planning/phases/174-ember-glass-tokens-foundations/174-03-design-system-v2-page-PLAN.md
@./CLAUDE.md
@app/components/EmberGlass/AmbientBg.tsx
@app/components/EmberGlass/Pressable.tsx
@app/components/EmberGlass/Sheet.tsx
@app/debug/design-system-v2/page.tsx
@tests/smoke/accent-picker.spec.ts
@tests/smoke/ambient-persist.spec.ts
@tests/smoke/page-loads.spec.ts

<interfaces>
<!-- Barrel public surface (lifted from RESEARCH §index.ts and UI-SPEC §"Component Inventory" line 569) -->
```ts
// app/components/EmberGlass/index.ts
export { Pressable, usePressed } from './Pressable';
export type { PressableProps, PointerHandlers } from './Pressable';
export { Sheet } from './Sheet';
export type { SheetProps } from './Sheet';
export { default as AmbientBg } from './AmbientBg';
```

<!-- Demo page consumer pattern (UI-SPEC §"Demo Page Sections" lines 360-441) -->
```tsx
// app/debug/design-system-v2/page.tsx — at top of file imports
import { Pressable, Sheet } from '@/app/components/EmberGlass';

// Inside the existing client component (Phase 174 page is 'use client'):
const [sheetOpen, setSheetOpen] = useState<boolean>(false);

// Section 05: 3 Pressable surfaces in a 3-col grid
// Section 06: "Apri sheet demo" <button> + <Sheet open={sheetOpen} onClose={() => setSheetOpen(false)} title="Demo sheet">
```

<!-- Playwright spec file shape (analog: tests/smoke/accent-picker.spec.ts) -->
```ts
import { test, expect } from '@playwright/test';

test.describe('DS-07 — press primitive', () => { /* 2 tests */ });
test.describe('SHEET-01 — sheet primitive', () => { /* 7 tests */ });
```
</interfaces>

<existing_page_structure>
The Phase 174 page (`app/debug/design-system-v2/page.tsx`) already contains:
- `'use client'` directive
- `useState` calls for accent picker + ambient toggle
- Section 01 (Hue picker — `01 / HUE` eyebrow, `Tinte accento` heading)
- Section 02 (Ambient toggle)
- Section 03 (Token grid)
- Section 04 (Glass-surface demo)

Phase 175 appends Section 05 + Section 06 AFTER Section 04. Use the SAME eyebrow/heading/helper pattern (UI-SPEC line 366-371). Use `marginBottom: 48` between sections (UI-SPEC line 51 — matches Phase 174 convention).
</existing_page_structure>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Create EmberGlass barrel index.ts (re-exports Pressable, Sheet, types, AmbientBg)</name>
  <files>app/components/EmberGlass/index.ts</files>
  <read_first>
    - app/components/EmberGlass/Pressable.tsx (verify exported names: Pressable, usePressed, type PressableProps, type PointerHandlers)
    - app/components/EmberGlass/Sheet.tsx (verify exported names: Sheet, type SheetProps)
    - app/components/EmberGlass/AmbientBg.tsx (verify it's a default export — line 23 per RESEARCH.md line 290)
    - app/components/ui/index.ts (analog barrel pattern — re-export style)
    - .planning/phases/175-glass-primitives-press-animation-sheet/175-CONTEXT.md §"D-01" (line 33-35)
    - .planning/phases/175-glass-primitives-press-animation-sheet/175-UI-SPEC.md §"Component Inventory" (line 569)
    - .planning/phases/175-glass-primitives-press-animation-sheet/175-RESEARCH.md §"index.ts" (lines 408-417)
  </read_first>
  <action>
    Create `app/components/EmberGlass/index.ts` with exactly this content (per UI-SPEC line 569):

    ```ts
    export { Pressable, usePressed } from './Pressable';
    export type { PressableProps, PointerHandlers } from './Pressable';
    export { Sheet } from './Sheet';
    export type { SheetProps } from './Sheet';
    export { default as AmbientBg } from './AmbientBg';
    ```

    No additional comments needed (analog `app/components/ui/index.ts` is similarly terse). The file enables `import { Pressable, Sheet } from '@/app/components/EmberGlass'` in Phases 177-181 per CONTEXT D-01.
  </action>
  <verify>
    <automated>node -e "const fs=require('fs');const c=fs.readFileSync('app/components/EmberGlass/index.ts','utf8');if(!c.includes(\"export { Pressable, usePressed } from './Pressable'\"))process.exit(1);if(!c.includes(\"export { Sheet } from './Sheet'\"))process.exit(2);if(!c.includes(\"export { default as AmbientBg } from './AmbientBg'\"))process.exit(3);console.log('OK')"</automated>
  </verify>
  <done>
    `app/components/EmberGlass/index.ts` exists with all 5 re-export lines. The file is the public namespace surface; consumers import via `@/app/components/EmberGlass`.
  </done>
</task>

<task type="auto">
  <name>Task 2: Append Section 05 (Press primitive demo) + Section 06 (Sheet primitive demo) to /debug/design-system-v2 page</name>
  <files>app/debug/design-system-v2/page.tsx</files>
  <read_first>
    - app/debug/design-system-v2/page.tsx (read the entire file — locate end of Section 04 and the `useState` block; verify the file is `'use client'` and observe inline-style conventions)
    - app/components/EmberGlass/Pressable.tsx (verify Pressable API: `as`, `style`, `className`, `aria-label`)
    - app/components/EmberGlass/Sheet.tsx (verify Sheet API: `open`, `onClose`, `title`, `children`)
    - .planning/phases/175-glass-primitives-press-animation-sheet/175-UI-SPEC.md §"Demo Page Sections" (lines 360-441) — locked layout, copy, sample shapes
    - .planning/phases/175-glass-primitives-press-animation-sheet/175-UI-SPEC.md §"Copywriting Contract" (lines 445-498) — exact Italian copy
    - .planning/phases/175-glass-primitives-press-animation-sheet/175-RESEARCH.md §"Demo section appended" (lines 597-631) — concrete JSX shape
    - .planning/phases/175-glass-primitives-press-animation-sheet/175-PATTERNS.md §"design-system-v2/page.tsx" (lines 621-680)
    - .planning/phases/174-ember-glass-tokens-foundations/174-03-design-system-v2-page-PLAN.md (analog plan — observe how Sections 01-04 were composed)
  </read_first>
  <behavior>
    - Top of file: `import { Pressable, Sheet } from '@/app/components/EmberGlass';` added alongside existing imports.
    - Inside the existing client component: `const [sheetOpen, setSheetOpen] = useState<boolean>(false);` added alongside existing `useState` calls (mirror the position of accent + ambient state hooks).
    - Section 05 (after existing Section 04) renders eyebrow `05 / PRESS`, heading `Animazione di pressione`, helper `Tap o clicca per vedere scale(0.97) ↔ scale(1) con cubic-bezier(.34,1.56,.64,1) su 220ms`, and a 3-column grid (`gridTemplateColumns: 'repeat(3, 1fr)'`, gap 16) with three Pressable surfaces.
    - Section 05 surface 1: `<Pressable as="div" data-testid="press-card-demo" className="glass-surface" style={{ aspectRatio: '1 / 1', display: 'grid', placeItems: 'center', touchAction: 'manipulation' }}>` containing `<span style={{ fontSize: 16, fontFamily: 'var(--font-display)', fontWeight: 600, color: 'var(--text-1)' }}>Card</span>`. **CRITICAL:** the `data-testid="press-card-demo"` is consumed by the Playwright smoke spec.
    - Section 05 surface 2: `<Pressable as="button" type="button" className="glass-surface press-anim" style={{ height: 56, border: 0, color: 'var(--text-1)', fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 600, cursor: 'pointer', touchAction: 'manipulation' }} aria-label="Esempio bottone pressabile">Pressable button</Pressable>`. **Note:** `className="glass-surface press-anim"` co-locates the press-anim class for the Playwright .press-anim CSS-class assertion.
    - Section 05 surface 3: `<Pressable as="div" className="glass-surface" style={{ width: 80, height: 80, borderRadius: 999, justifySelf: 'center', touchAction: 'manipulation' }} />`.
    - Section 06 (after Section 05) renders eyebrow `06 / SHEET`, heading `Sheet primitivo`, helper `Apri lo sheet di esempio per testare le tre vie di chiusura: Esc, tap fuori, e bottone X`, and an "Apri sheet demo" `<button>`.
    - Open button: `<button type="button" onClick={() => setSheetOpen(true)} style={{ height: 56, padding: '0 24px', borderRadius: 16, border: 'none', background: 'rgba(255,255,255,0.06)', color: 'var(--text-1)', fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 600, cursor: 'pointer' }}>Apri sheet demo</button>`. (UI-SPEC line 414-418)
    - Sheet: `<Sheet open={sheetOpen} onClose={() => setSheetOpen(false)} title="Demo sheet">` body has 3 rows (per UI-SPEC line 423-436): `Riga 1` / `Contenuto fittizio`, `Riga 2` / `Contenuto fittizio`, `Riga di esempio lunga abbastanza da scrollare` / `Contenuto fittizio`. Each row: `<div style={{ padding: '14px 0', borderBottom: '0.5px solid var(--glass-border)' }}>` with primary 16px `var(--text-1)` and secondary 12px `var(--text-2)`. Add a `<div aria-hidden="true" style={{ height: 600 }} />` spacer at the end (UI-SPEC line 440 — required for the scroll-lock smoke test to be meaningful).
    - All copy strings exactly match UI-SPEC tables 458-482. Italian for visible UI; English for any code-style values.
    - Both new sections use `marginBottom: 48` between them (matches Phase 174 convention).
  </behavior>
  <action>
    Use the Edit tool to:
    1. Add the import line at the top: `import { Pressable, Sheet } from '@/app/components/EmberGlass';` (alongside other imports — observe existing `import` structure of the page).
    2. Add `const [sheetOpen, setSheetOpen] = useState<boolean>(false);` next to existing `useState` calls inside the component body.
    3. Append two new `<section>` blocks AFTER existing Section 04, BEFORE the closing tags. Use the SAME eyebrow/heading/helper pattern from PATTERNS.md lines 626-664:
       - Eyebrow: `<p>` with `fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600, letterSpacing: '1.2px', textTransform: 'uppercase', color: 'var(--text-2)'`.
       - Heading: `<h2 id="sec-05-heading">` (and `sec-06-heading`) with `fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 600, color: 'var(--text-1)', margin: '4px 0 8px 0'`.
       - Helper: `<p>` with `fontFamily: 'var(--font-body)', fontSize: 16, color: 'var(--text-2)', marginBottom: 16`.
       - Section element: `<section aria-labelledby="sec-05-heading" style={{ marginBottom: 48 }}>`.

    Per CLAUDE.md Rule 3 (PREFER editing existing files): edit the existing page, do not create a sibling. Do NOT modify Sections 01-04. Do NOT change the page-level header from Phase 174.

    Per UI-SPEC line 83: ALL `fontSize` values in the new sections MUST be in `{12, 16, 22, 24}`. ALL `fontWeight` MUST be in `{400, 600}` (treat 500 as a violation — RESEARCH/UI-SPEC tolerate `fontWeight: 500` ONLY inside the demo Sheet primary row text? Re-check: UI-SPEC line 433 shows `fontWeight: 500` in the bundle-style mock; this conflicts with the 4-size 2-weight budget. **Locked: use `fontWeight: 600` for primary and omit fontWeight for secondary** to keep the 2-weight invariant.)

    Concrete shape for Section 05 (per RESEARCH lines 599-613):
    ```tsx
    <section aria-labelledby="sec-05-heading" style={{ marginBottom: 48 }}>
      <p style={{ /* eyebrow */ }}>05 / PRESS</p>
      <h2 id="sec-05-heading" style={{ /* heading */ }}>Animazione di pressione</h2>
      <p style={{ /* helper */ }}>Tap o clicca per vedere scale(0.97) ↔ scale(1) con cubic-bezier(.34,1.56,.64,1) su 220ms</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        <Pressable as="div" data-testid="press-card-demo" className="glass-surface" style={{ aspectRatio: '1 / 1', display: 'grid', placeItems: 'center', touchAction: 'manipulation' }}>
          <span style={{ fontSize: 16, fontFamily: 'var(--font-display)', fontWeight: 600, color: 'var(--text-1)' }}>Card</span>
        </Pressable>
        <Pressable as="button" type="button" className="glass-surface press-anim" style={{ height: 56, border: 0, color: 'var(--text-1)', fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 600, cursor: 'pointer', touchAction: 'manipulation' }} aria-label="Esempio bottone pressabile">Pressable button</Pressable>
        <Pressable as="div" className="glass-surface" style={{ width: 80, height: 80, borderRadius: 999, justifySelf: 'center', touchAction: 'manipulation' }} />
      </div>
    </section>
    ```

    Concrete shape for Section 06 (per RESEARCH lines 615-630):
    ```tsx
    <section aria-labelledby="sec-06-heading" style={{ marginBottom: 48 }}>
      <p style={{ /* eyebrow */ }}>06 / SHEET</p>
      <h2 id="sec-06-heading" style={{ /* heading */ }}>Sheet primitivo</h2>
      <p style={{ /* helper */ }}>Apri lo sheet di esempio per testare le tre vie di chiusura: Esc, tap fuori, e bottone X</p>
      <button
        type="button"
        onClick={() => setSheetOpen(true)}
        style={{ height: 56, padding: '0 24px', borderRadius: 16, border: 'none', background: 'rgba(255,255,255,0.06)', color: 'var(--text-1)', fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 600, cursor: 'pointer' }}
      >
        Apri sheet demo
      </button>
      <Sheet open={sheetOpen} onClose={() => setSheetOpen(false)} title="Demo sheet">
        {[
          { primary: 'Riga 1', secondary: 'Contenuto fittizio' },
          { primary: 'Riga 2', secondary: 'Contenuto fittizio' },
          { primary: 'Riga di esempio lunga abbastanza da scrollare', secondary: 'Contenuto fittizio' },
        ].map((row, i) => (
          <div key={i} style={{ padding: '14px 0', borderBottom: '0.5px solid var(--glass-border)' }}>
            <div style={{ fontSize: 16, color: 'var(--text-1)', fontWeight: 600 }}>{row.primary}</div>
            <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 2 }}>{row.secondary}</div>
          </div>
        ))}
        <div aria-hidden="true" style={{ height: 600 }} />
      </Sheet>
    </section>
    ```
  </action>
  <verify>
    <automated>grep -F "05 / PRESS" app/debug/design-system-v2/page.tsx && grep -F "06 / SHEET" app/debug/design-system-v2/page.tsx && grep -F "Apri sheet demo" app/debug/design-system-v2/page.tsx && grep -F "press-card-demo" app/debug/design-system-v2/page.tsx && grep -F "Animazione di pressione" app/debug/design-system-v2/page.tsx && grep -F "Sheet primitivo" app/debug/design-system-v2/page.tsx && grep -F "from '@/app/components/EmberGlass'" app/debug/design-system-v2/page.tsx && npm run test:pages -- design-system-v2</automated>
  </verify>
  <done>
    `/debug/design-system-v2` page renders Sections 05 + 06 with exact UI-SPEC copy, three Pressable demo surfaces (one with `data-testid="press-card-demo"`, one with `className="glass-surface press-anim"` and `aria-label="Esempio bottone pressabile"`), the "Apri sheet demo" button, and a Sheet body with 3 dummy rows + 600px spacer. Existing Sections 01-04 untouched. Page test (if it exists) still passes.
  </done>
</task>

<task type="auto">
  <name>Task 3: Ship Playwright press-primitive.spec.ts smoke (DS-07 — 1 describe with 2 tests)</name>
  <files>tests/smoke/press-primitive.spec.ts</files>
  <read_first>
    - tests/smoke/accent-picker.spec.ts (analog — file header, describe block, page.goto + heading visibility setup)
    - tests/smoke/page-loads.spec.ts (collectConsoleErrors helper if needed)
    - .planning/phases/175-glass-primitives-press-animation-sheet/175-UI-SPEC.md §"Component Inventory" line 576 (3 expects budget) + §"Verification Mapping" line 608
    - .planning/phases/175-glass-primitives-press-animation-sheet/175-RESEARCH.md §"Concrete Playwright assertions" lines 696-737 (the canonical assertions)
    - .planning/phases/175-glass-primitives-press-animation-sheet/175-PATTERNS.md §"press-primitive.spec.ts" (lines 429-483)
    - .planning/phases/175-glass-primitives-press-animation-sheet/175-VALIDATION.md (Wave 0 reference)
  </read_first>
  <behavior>
    - File starts with `import { test, expect } from '@playwright/test';`.
    - File header JSDoc cites `DS-07 — press primitive on /debug/design-system-v2`.
    - `test.describe('DS-07 — press primitive', () => { ... })` block with 2 tests:
      - Test 1: `'Pressable exported and .press-anim class registered'` — visits `/debug/design-system-v2`, asserts `page.getByTestId('press-card-demo')` is visible (proves barrel export wired into page); asserts that injecting an empty div with `className="press-anim"` yields `getComputedStyle(el).transition` matching the regex `/transform\s+0\.22s\s+cubic-bezier\(0?\.34,\s*1\.56,\s*0?\.64,\s*1\)/` (proves Plan 01's `.press-anim` rule shipped to globals.css).
      - Test 2: `'press toggles scale(0.97) via JS state'` — visits `/debug/design-system-v2`, locates `getByTestId('press-card-demo')`, calls `page.mouse.move()` to bbox center, `page.mouse.down()`, waits for `getComputedStyle(el).transform` to include `matrix(0.97`, then `page.mouse.up()` and waits for transform to return to `none` or `matrix(1, 0, 0, 1, 0, 0)`.
  </behavior>
  <action>
    Create `tests/smoke/press-primitive.spec.ts` with the exact structure from RESEARCH.md lines 698-737. Use the analog convention from `tests/smoke/accent-picker.spec.ts` for file header and describe block.

    Concrete file content:
    ```ts
    import { test, expect } from '@playwright/test';

    /**
     * DS-07 — press primitive on /debug/design-system-v2 (Phase 175).
     *
     * Asserts:
     * - Pressable demo card is rendered (proves barrel export → page consumer wiring).
     * - .press-anim class in app/globals.css produces the locked DS-07 transition curve
     *   (transform .22s cubic-bezier(.34,1.56,.64,1)).
     * - Pressing the demo card toggles transform: matrix(0.97, ...) via JS pointer state.
     */
    test.describe('DS-07 — press primitive', () => {
      test('Pressable exported and .press-anim class registered', async ({ page }) => {
        await page.goto('/debug/design-system-v2');
        await expect(page.getByRole('heading', { level: 1, name: /Ember Glass/i })).toBeVisible({ timeout: 10000 });
        await expect(page.getByTestId('press-card-demo')).toBeVisible();
        const transition = await page.evaluate(() => {
          const el = document.createElement('div');
          el.className = 'press-anim';
          document.body.appendChild(el);
          const t = getComputedStyle(el).transition;
          el.remove();
          return t;
        });
        expect(transition).toMatch(/transform\s+0\.22s\s+cubic-bezier\(0?\.34,\s*1\.56,\s*0?\.64,\s*1\)/);
      });

      test('press toggles scale(0.97) via JS state', async ({ page }) => {
        await page.goto('/debug/design-system-v2');
        const card = page.getByTestId('press-card-demo');
        await expect(card).toBeVisible();
        const box = await card.boundingBox();
        if (!box) throw new Error('press-card-demo bounding box missing');
        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
        await page.mouse.down();
        await page.waitForFunction(() => {
          const el = document.querySelector('[data-testid="press-card-demo"]') as HTMLElement | null;
          return !!el && getComputedStyle(el).transform.includes('matrix(0.97');
        }, { timeout: 1000 });
        await page.mouse.up();
        await page.waitForFunction(() => {
          const el = document.querySelector('[data-testid="press-card-demo"]') as HTMLElement | null;
          if (!el) return false;
          const t = getComputedStyle(el).transform;
          return t === 'matrix(1, 0, 0, 1, 0, 0)' || t === 'none';
        }, { timeout: 1000 });
      });
    });
    ```

    Heading regex `/Ember Glass/i` matches the existing Phase 174 page header (verified via `app/debug/design-system-v2/page.tsx` and `tests/smoke/accent-picker.spec.ts:14`).
  </action>
  <verify>
    <automated>npx playwright test tests/smoke/press-primitive.spec.ts --reporter=line</automated>
  </verify>
  <done>
    `tests/smoke/press-primitive.spec.ts` exists. Both Playwright tests pass against the running dev server. The .press-anim transition regex matches the DS-07 locked curve. The mouse.down → matrix(0.97 assertion proves the JS pointer-state press contract from Plan 01.
  </done>
</task>

<task type="auto">
  <name>Task 4: Ship Playwright sheet-primitive.spec.ts smoke (SHEET-01 — 1 describe with 7 tests)</name>
  <files>tests/smoke/sheet-primitive.spec.ts</files>
  <read_first>
    - tests/smoke/ambient-persist.spec.ts (analog — multi-test describe block + reset pattern; file header JSDoc shape)
    - tests/smoke/page-loads.spec.ts (collectConsoleErrors helper if used)
    - .planning/phases/175-glass-primitives-press-animation-sheet/175-CONTEXT.md §"D-17" (lines 100-108) — the 7+1 spec list
    - .planning/phases/175-glass-primitives-press-animation-sheet/175-UI-SPEC.md §"Component Inventory" line 577 + §"Responsive Behavior" lines 553-555 (assert `right - left === viewport.width - 16`)
    - .planning/phases/175-glass-primitives-press-animation-sheet/175-RESEARCH.md §"Concrete Playwright assertions" lines 740-end (sheet-primitive specs)
    - .planning/phases/175-glass-primitives-press-animation-sheet/175-PATTERNS.md §"sheet-primitive.spec.ts" (lines 487-566)
    - app/components/EmberGlass/Sheet.tsx (verify the `data-sheet-backdrop="true"` attribute is on the backdrop div — required by Test 3)
  </read_first>
  <behavior>
    - File starts with `import { test, expect } from '@playwright/test';`.
    - File header JSDoc cites `SHEET-01 — sheet primitive on /debug/design-system-v2`.
    - `test.describe('SHEET-01 — sheet primitive', () => { ... })` with 7 tests:
      - Test 1: `'opens via button click'` — click "Apri sheet demo" → `getByRole('dialog')` visible AND `getComputedStyle(dialog).transform` does NOT match the closed translateY(110%) matrix.
      - Test 2: `'dismisses via Escape'` — open sheet → `page.keyboard.press('Escape')` → wait for `getByRole('dialog')` to be hidden.
      - Test 3: `'dismisses via backdrop tap'` — open sheet → click `[data-sheet-backdrop="true"]` at position {x:10,y:10} → wait for dialog hidden. **Important:** click position must NOT overlap with the sheet container — `{x:10,y:10}` from the backdrop's top-left is safely above the sheet (which is at `bottom: 8px`).
      - Test 4: `'dismisses via close button'` — open sheet → click `getByRole('button', { name: /chiudi/i })` → wait for dialog hidden.
      - Test 5: `'scroll-lock applied + restored at y=300'` — `page.evaluate(() => window.scrollTo(0, 300))` (page must have enough content to scroll — the 600px spacer inside the demo sheet does NOT help scroll the OUTER page; **add scroll content via `await page.evaluate(() => { document.body.style.minHeight = '2000px'; })` BEFORE the scroll** to guarantee the page can scroll to y=300 in the smoke environment), open sheet → assert `document.body.style.position === 'fixed'`, close sheet via Escape, wait 500ms, assert `window.scrollY === 300`.
      - Test 6: `'mobile 375px sheet width = viewport - 16'` — `page.setViewportSize({ width: 375, height: 812 })`, open sheet, assert `Math.round(dialog.boundingBox().width) === 359`.
      - Test 7: `'desktop 1024px sheet width = viewport - 16'` — `page.setViewportSize({ width: 1024, height: 768 })`, open sheet, assert `Math.round(dialog.boundingBox().width) === 1008`.
  </behavior>
  <action>
    Create `tests/smoke/sheet-primitive.spec.ts` (~180 LOC) with the exact 7 tests above. Use a shared `openSheet(page)` helper at top of describe block (synthesized from RESEARCH lines 507-511):

    ```ts
    import { test, expect, type Page } from '@playwright/test';

    /**
     * SHEET-01 — sheet primitive on /debug/design-system-v2 (Phase 175).
     *
     * Asserts the three dismissal vectors (Escape / backdrop tap / close button), body
     * scroll-lock with restore (open at y=300 → close → window.scrollY === 300), and
     * cross-viewport parity (375px and 1024px both yield sheet width = viewport - 16).
     */

    async function openSheet(page: Page): Promise<void> {
      await page.goto('/debug/design-system-v2');
      await expect(page.getByRole('heading', { level: 1, name: /Ember Glass/i })).toBeVisible({ timeout: 10000 });
      await page.getByRole('button', { name: /Apri sheet demo/i }).click();
      await expect(page.getByRole('dialog')).toBeVisible();
    }

    test.describe('SHEET-01 — sheet primitive', () => {
      test('opens via button click', async ({ page }) => {
        await openSheet(page);
        const dialog = page.getByRole('dialog');
        // Wait for the 400ms outro animation to settle to its open identity transform
        // before reading getComputedStyle. toBeVisible alone resolves at first paint
        // and can capture a mid-animation matrix(1, 0, 0, 1, 0, <intermediate>).
        await page.waitForFunction(
          () => {
            const el = document.querySelector('[role="dialog"]');
            if (!el) return false;
            const t = getComputedStyle(el).transform;
            return t === 'none' || t === 'matrix(1, 0, 0, 1, 0, 0)';
          },
          { timeout: 1500 }
        );
        const transform = await dialog.evaluate((el) => getComputedStyle(el).transform);
        // Open state: translateY(0) ⇒ matrix(1, 0, 0, 1, 0, 0) or 'none'.
        expect(transform === 'none' || transform === 'matrix(1, 0, 0, 1, 0, 0)').toBeTruthy();
      });

      test('dismisses via Escape', async ({ page }) => {
        await openSheet(page);
        await page.keyboard.press('Escape');
        await expect(page.getByRole('dialog')).toBeHidden({ timeout: 1500 });
      });

      test('dismisses via backdrop tap', async ({ page }) => {
        await openSheet(page);
        // Backdrop covers viewport; click in upper-left, well above the sheet (which sits at bottom:8).
        await page.locator('[data-sheet-backdrop="true"]').click({ position: { x: 10, y: 10 } });
        await expect(page.getByRole('dialog')).toBeHidden({ timeout: 1500 });
      });

      test('dismisses via close button', async ({ page }) => {
        await openSheet(page);
        await page.getByRole('button', { name: /chiudi/i }).click();
        await expect(page.getByRole('dialog')).toBeHidden({ timeout: 1500 });
      });

      test('scroll-lock applied + restored at y=300', async ({ page }) => {
        await page.goto('/debug/design-system-v2');
        await expect(page.getByRole('heading', { level: 1, name: /Ember Glass/i })).toBeVisible({ timeout: 10000 });
        // Force a scrollable page in the smoke environment.
        await page.evaluate(() => { document.body.style.minHeight = '2000px'; });
        await page.evaluate(() => window.scrollTo(0, 300));
        // Sanity: confirm the page actually scrolled to 300.
        const before = await page.evaluate(() => window.scrollY);
        expect(before).toBeGreaterThanOrEqual(295); // small tolerance for sub-pixel rounding
        await page.getByRole('button', { name: /Apri sheet demo/i }).click();
        await expect(page.getByRole('dialog')).toBeVisible();
        const positionWhenOpen = await page.evaluate(() => document.body.style.position);
        expect(positionWhenOpen).toBe('fixed');
        await page.keyboard.press('Escape');
        await expect(page.getByRole('dialog')).toBeHidden({ timeout: 1500 });
        // Allow Sheet outro + cleanup effect to flush.
        await page.waitForTimeout(500);
        const restoredScrollY = await page.evaluate(() => window.scrollY);
        expect(Math.round(restoredScrollY)).toBe(300);
      });

      test('mobile 375px sheet width = viewport - 16', async ({ page }) => {
        await page.setViewportSize({ width: 375, height: 812 });
        await openSheet(page);
        const box = await page.getByRole('dialog').boundingBox();
        if (!box) throw new Error('dialog bounding box missing at 375px');
        expect(Math.round(box.width)).toBe(359);
      });

      test('desktop 1024px sheet width = viewport - 16', async ({ page }) => {
        await page.setViewportSize({ width: 1024, height: 768 });
        await openSheet(page);
        const box = await page.getByRole('dialog').boundingBox();
        if (!box) throw new Error('dialog bounding box missing at 1024px');
        expect(Math.round(box.width)).toBe(1008);
      });
    });
    ```

    All test names match the regex grep targets in VALIDATION.md (e.g., `-g 'Escape'`, `-g 'backdrop'`, `-g 'mobile'`, `-g 'desktop'`).
  </action>
  <verify>
    <automated>npx playwright test tests/smoke/sheet-primitive.spec.ts --reporter=line</automated>
  </verify>
  <done>
    `tests/smoke/sheet-primitive.spec.ts` exists with 7 tests in a single describe block. All tests pass against the running dev server. SC-#3 (3 dismissal vectors), SC-#4 (scroll-lock + restore at y=300), and SC-#5 (375px + 1024px parity) all pass end-to-end.
  </done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| Test browser ↔ /debug/design-system-v2 page | Playwright drives a real browser against the developer-facing debug page. No production user data crossing the boundary. |
| Demo page consumer ↔ EmberGlass primitives | Demo page imports `Pressable` and `Sheet` from the barrel. Caller (the demo page) provides static, hard-coded children — no untrusted content crosses into the primitives. |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-175-01 | Information Disclosure | `/debug/design-system-v2` page accessibility | accept | The `/debug` namespace is dev-only; no PII or auth tokens render on the page. Phase 174 already shipped the page; Phase 175 only appends two new sections. No new threat surface. LOW severity. |
| T-175-02 | Tampering | Playwright spec body-style assertions | mitigate | Test 5 (scroll-lock) writes `document.body.style.minHeight` to force a scrollable page. This is reset on next `page.goto()` (browser context isolated per test). No leak between tests. LOW severity. |
| T-175-03 | Denial of Service | Sheet outro animation in tests | accept | Tests use `toBeHidden({ timeout: 1500 })` — 1.5s window for the 400ms outro to complete + cleanup. If a regression doubles the transition time, the test fails fast (no infinite wait). LOW severity. |
</threat_model>

<verification>
- `npm run test:components -- EmberGlass` passes (covers Plans 01 + 02 unit tests; Plan 03 does not add new unit tests).
- `npx playwright test tests/smoke/press-primitive.spec.ts tests/smoke/sheet-primitive.spec.ts --reporter=line` passes (2 + 7 = 9 specs total).
- `grep -F "from '@/app/components/EmberGlass'" app/debug/design-system-v2/page.tsx` returns one match (consumer-side import).
- `grep -F "Pressable" app/components/EmberGlass/index.ts` and `grep -F "Sheet" app/components/EmberGlass/index.ts` both return matches.
- `grep -F "press-card-demo" tests/smoke/press-primitive.spec.ts app/debug/design-system-v2/page.tsx` returns matches in BOTH files (test ↔ page wiring intact).
- `grep -F "Apri sheet demo" tests/smoke/sheet-primitive.spec.ts app/debug/design-system-v2/page.tsx` returns matches in BOTH files.
- `grep -F "data-sheet-backdrop" tests/smoke/sheet-primitive.spec.ts app/components/EmberGlass/Sheet.tsx` returns matches in BOTH files (test ↔ component wiring intact).
- TypeScript compiles cleanly across all modified files (verified by jest + Playwright runs).
</verification>

<success_criteria>
- DS-07 + SHEET-01 end-to-end coverage: barrel public surface, demo page consumes both primitives, Playwright smoke verifies SC-#1 (grep targets), SC-#2 (curve regex), SC-#3 (3 dismissal vectors), SC-#4 (scroll-lock + restore), SC-#5 (375px + 1024px).
- Phase 174 surface preservation: existing Sections 01-04 of `/debug/design-system-v2` untouched; only append.
- Test gate (per CLAUDE.md Rule 8): scoped commands `npm run test:components -- EmberGlass` (unit) + `npx playwright test tests/smoke/press-primitive.spec.ts tests/smoke/sheet-primitive.spec.ts` (smoke). NEVER bare `npm test`.
- File contracts: `index.ts` ~5 LOC; demo page additions ~90 LOC; press spec ~30 LOC, 2 tests; sheet spec ~180 LOC, 7 tests (totals match UI-SPEC line 569, 572-573, 576-577).
- Naming convention: spec files match Phase 174's per-feature pattern (`accent-picker.spec.ts`, `ambient-persist.spec.ts`).
- Italian copy verbatim (UI-SPEC tables 458-482).
- Phase 175 SC-#5 (375px + 1024px parity) is enforced ONLY by this plan's Playwright specs.
</success_criteria>

<output>
After completion, create `.planning/phases/175-glass-primitives-press-animation-sheet/175-03-SUMMARY.md` per `templates/summary.md`. Include:
- Files created/modified (4 files)
- Test counts: 2 Playwright specs in press-primitive, 7 in sheet-primitive (9 total smoke)
- Confirmation that all 5 SC items have automated verification across Plans 01 + 02 + 03
- Phase-level lock: `<Pressable>`, `usePressed()`, `<Sheet>`, `.press-anim` are now consumable by Phases 177-181 via `import { Pressable, Sheet, usePressed } from '@/app/components/EmberGlass'`
- Per-phase invariants for 177-181 (carried forward from RESEARCH §"Validation Architecture" lines 680-693): each later phase should grep its NEW glass surfaces for `Pressable|usePressed|press-anim` and assert no z-index 200/201 collisions
</output>
