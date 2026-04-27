---
phase: 175-glass-primitives-press-animation-sheet
plan: 02
type: execute
wave: 1
depends_on: []
files_modified:
  - app/components/EmberGlass/Sheet.tsx
  - app/components/EmberGlass/__tests__/Sheet.test.tsx
autonomous: true
requirements: [SHEET-01]
requirements_addressed: [SHEET-01]
tags: [ember-glass, sheet, primitive, sheet-01, jest, radix-dialog, scroll-lock]

must_haves:
  truths:
    - "<Sheet open onClose title> exported from app/components/EmberGlass/Sheet.tsx wraps @radix-ui/react-dialog with bundle-verbatim visuals"
    - "Sheet container transition is exactly 'transform .4s cubic-bezier(.22,1,.36,1)' (SHEET-01 SC-#2 curve)"
    - "Sheet container translates between translateY(0) (open) and translateY(110%) (closed) — outro animation plays via forceMount"
    - "Backdrop (z-index 200) and Sheet container (z-index 201) hardcoded inline; documented in top-of-file comment"
    - "Three dismissal vectors all fire onClose: ESC key (Radix-handled), backdrop tap (own div onClick), close button click"
    - "Backdrop double-fire suppressed via onPointerDownOutside={(e) => e.preventDefault()} on DialogPrimitive.Content"
    - "Body scroll-lock applied on open via useRef-captured scrollY; restored on close via window.scrollTo(0, lockedScrollY.current)"
    - "When title prop is provided: grabber (40x5 pill) + title (Outfit 22px 600 #fff) + 32x32 circular close button (X icon, aria-label='Chiudi') render"
    - "When title prop is omitted: <VisuallyHidden><DialogPrimitive.Title>Sheet</DialogPrimitive.Title></VisuallyHidden> renders for a11y compliance"
    - "Close button has data-sheet-close='true' attribute paired with the global :focus-visible accent outline rule"
    - "All Sheet jest tests pass"
  artifacts:
    - path: "app/components/EmberGlass/Sheet.tsx"
      provides: "<Sheet open onClose title> Radix Dialog facade with bundle-verbatim visuals + scroll-lock + 3 dismissal vectors"
      exports: ["Sheet", "SheetProps"]
      min_lines: 100
    - path: "app/components/EmberGlass/__tests__/Sheet.test.tsx"
      provides: "Jest unit tests covering open/close, ESC, backdrop, close button, scroll-lock, VisuallyHidden fallback"
      min_lines: 100
  key_links:
    - from: "app/components/EmberGlass/Sheet.tsx (DialogPrimitive.Root onOpenChange)"
      to: "props.onClose"
      via: "onOpenChange={(next) => { if (!next) onClose() }} adapter"
      pattern: "onOpenChange"
    - from: "app/components/EmberGlass/Sheet.tsx (custom backdrop div)"
      to: "props.onClose"
      via: "onClick={onClose}"
      pattern: "data-sheet-backdrop"
    - from: "app/components/EmberGlass/Sheet.tsx (close button)"
      to: "props.onClose"
      via: "<button onClick={onClose} aria-label='Chiudi'>"
      pattern: "data-sheet-close"
    - from: "app/components/EmberGlass/Sheet.tsx (useEffect on open)"
      to: "document.body.style + window.scrollTo"
      via: "useRef-captured scrollY recipe lifted from BottomSheet.tsx:50-67"
      pattern: "lockedScrollY"
---

<objective>
Ship the SHEET-01 bottom sheet primitive: a prop-driven `<Sheet open onClose title>{children}</Sheet>` component in `app/components/EmberGlass/Sheet.tsx` that wraps `@radix-ui/react-dialog` with bundle-verbatim visuals lifted from `.planning/inbox/ember-glass-design/project/components/sheets.jsx:13-65`. Three dismissal vectors (ESC, backdrop tap, close button) all converge on `onClose`. Body scroll-lock is implemented via the proven `BottomSheet.tsx:50-67` recipe with `useRef`-captured `scrollY` to restore position on close.

Purpose: Phase 175 SC-#2/3/4 — translucent sheet, slide-in from off-screen with cubic-bezier `.22,1,.36,1` over 400ms, three dismissal vectors, body scroll-lock with restore.

Output:
- `app/components/EmberGlass/Sheet.tsx` (~140 LOC) — `'use client'` Radix Dialog facade + scroll-lock + bundle-verbatim visuals + z-index 200/201 documented in JSDoc
- `app/components/EmberGlass/__tests__/Sheet.test.tsx` (~140 LOC) — Wave 0 jest unit tests covering all dismissal vectors + scroll-lock + VisuallyHidden fallback
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
@.planning/phases/174-ember-glass-tokens-foundations/174-CONTEXT.md
@./CLAUDE.md
@app/components/ui/Sheet.tsx
@app/components/ui/BottomSheet.tsx
@app/components/ui/__tests__/BottomSheet.test.tsx
@app/components/ui/__tests__/Modal.test.tsx
@.planning/inbox/ember-glass-design/project/components/sheets.jsx

<interfaces>
<!-- Concrete API contract for <Sheet> (lifted from UI-SPEC §Component API + Variants and RESEARCH §Sheet Primitive Implementation). -->

```ts
// app/components/EmberGlass/Sheet.tsx — public surface

export interface SheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children?: ReactNode;
}

export function Sheet(props: SheetProps): React.ReactElement;
```

<!-- Already-installed dependencies consumed (no install): -->
<!-- @radix-ui/react-dialog ^1.1.14 (DialogPrimitive.Root/Portal/Content/Title) -->
<!-- @radix-ui/react-visually-hidden ^1.2.4 (VisuallyHidden for Title fallback) -->
<!-- lucide-react (X icon) -->

<!-- Scroll-lock recipe (lifted verbatim from BottomSheet.tsx:50-67, adapted to useRef): -->
```ts
const lockedScrollY = useRef<number>(0);
useEffect(() => {
  if (!open) return;
  lockedScrollY.current = window.scrollY;
  document.body.style.position = 'fixed';
  document.body.style.top = `-${lockedScrollY.current}px`;
  document.body.style.width = '100%';
  document.body.style.overflow = 'hidden';
  return () => {
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.width = '';
    document.body.style.overflow = '';
    window.scrollTo(0, lockedScrollY.current);
  };
}, [open]);
```
</interfaces>
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Write Sheet.test.tsx (Wave 0 — RED) covering open/close, 3 dismissal vectors, scroll-lock, Title fallback</name>
  <files>app/components/EmberGlass/__tests__/Sheet.test.tsx</files>
  <read_first>
    - app/components/ui/__tests__/BottomSheet.test.tsx (analog — describe organization, dialog role assertion, close-button click pattern)
    - app/components/ui/__tests__/Modal.test.tsx lines 180-220 (ESC + backdrop-click on Radix Dialog patterns)
    - .planning/phases/175-glass-primitives-press-animation-sheet/175-PATTERNS.md §"Sheet.test.tsx" (lines 338-425)
    - .planning/phases/175-glass-primitives-press-animation-sheet/175-UI-SPEC.md §"<Sheet>" (lines 226-339), §"Component Inventory" (line 575)
    - .planning/phases/175-glass-primitives-press-animation-sheet/175-RESEARCH.md §"Common Pitfalls" Pitfall 5 (line 552-557 — body style cleanup between tests)
    - .planning/phases/175-glass-primitives-press-animation-sheet/175-CONTEXT.md §"D-18" (line 109-111)
  </read_first>
  <behavior>
    - Test 1 (Rendering, open=false): `screen.queryByRole('dialog')` is null OR (if forceMount) the dialog has `transform: translateY(110%)` applied.
    - Test 2 (Rendering, open=true): `screen.getByRole('dialog')` is in the document.
    - Test 3 (Title rendering): `<Sheet open title="Demo">` renders the title text via `screen.getByText('Demo')`; close button is present with `aria-label="Chiudi"`.
    - Test 4 (VisuallyHidden fallback): `<Sheet open>` (no title) renders a `DialogPrimitive.Title` with text "Sheet" inside a visually-hidden wrapper — query via `screen.getByText('Sheet')` (visually hidden but in the DOM).
    - Test 5 (ESC dismissal): `<Sheet open title="X" onClose={onCloseMock}>` + `await user.keyboard('{Escape}')` → `onCloseMock` called once.
    - Test 6 (Backdrop click dismissal): query the backdrop via `document.querySelector('[data-sheet-backdrop="true"]')`; `await user.click(backdrop)` → `onCloseMock` called once.
    - Test 7 (Close button dismissal): `screen.getByRole('button', { name: /chiudi/i })` + `await user.click(closeBtn)` → `onCloseMock` called once.
    - Test 8 (Backdrop NOT double-fire): when backdrop is clicked, `onCloseMock` is called EXACTLY once (verifies `onPointerDownOutside={(e) => e.preventDefault()}` suppresses Radix's auto-dismiss).
    - Test 9 (Scroll-lock applied on open): `document.body.style.position` is `''` before render; `rerender(<Sheet open={true} ...>)` → `document.body.style.position === 'fixed'`, `style.overflow === 'hidden'`, `style.width === '100%'`.
    - Test 10 (Scroll-lock restored on close): after open then `rerender(<Sheet open={false} ...>)` → `document.body.style.position === ''`, `style.overflow === ''`, `style.width === ''`.
    - Test 11 (Dialog ARIA): `screen.getByRole('dialog')` has `aria-modal="true"` (Radix-provided).
    - Test 12 (Close button data attribute): close button has `data-sheet-close="true"` attribute (paired with global focus-visible CSS rule from Plan 01).

    `afterEach`: `document.body.removeAttribute('style')` to prevent leak between tests (Pitfall 5).
  </behavior>
  <action>
    Create `app/components/EmberGlass/__tests__/Sheet.test.tsx`. Use the same test infrastructure as `app/components/ui/__tests__/BottomSheet.test.tsx`:

    ```tsx
    import { fireEvent, render, screen, waitFor } from '@testing-library/react';
    import userEvent from '@testing-library/user-event';
    import { Sheet } from '../Sheet';

    describe('Sheet (EmberGlass primitive)', () => {
      const onCloseMock = jest.fn();

      beforeEach(() => {
        onCloseMock.mockClear();
      });

      afterEach(() => {
        // Prevent body-style leak between tests (Pitfall 5 from RESEARCH.md).
        document.body.removeAttribute('style');
      });

      describe('Rendering', () => { /* tests 1-4 */ });
      describe('Dismissal vectors', () => { /* tests 5-8 */ });
      describe('Body scroll-lock', () => { /* tests 9-10 */ });
      describe('ARIA / a11y', () => { /* tests 11-12 */ });
    });
    ```

    Use `userEvent.setup()` per test that needs interaction. For ESC: `await user.keyboard('{Escape}')`. For close button: `screen.getByRole('button', { name: /chiudi/i })`. For backdrop: `document.querySelector('[data-sheet-backdrop="true"]') as HTMLElement`.

    For scroll-lock tests use `rerender`:
    ```tsx
    const { rerender } = render(<Sheet open={false} onClose={onCloseMock} title="X">body</Sheet>);
    expect(document.body.style.position).toBe('');
    rerender(<Sheet open={true} onClose={onCloseMock} title="X">body</Sheet>);
    expect(document.body.style.position).toBe('fixed');
    expect(document.body.style.overflow).toBe('hidden');
    expect(document.body.style.width).toBe('100%');
    rerender(<Sheet open={false} onClose={onCloseMock} title="X">body</Sheet>);
    expect(document.body.style.position).toBe('');
    expect(document.body.style.overflow).toBe('');
    ```

    Test/error/console output stays in English per UI-SPEC line 491.
  </action>
  <verify>
    <automated>npx jest app/components/EmberGlass/__tests__/Sheet.test.tsx --listTests 2>&1 | grep -q "Sheet.test.tsx" && echo "Test file discovered" && (npx jest app/components/EmberGlass/__tests__/Sheet.test.tsx 2>&1 | grep -E "(Cannot find module|FAIL)" || echo "RED state expected — Sheet.tsx not yet created")</automated>
  </verify>
  <done>
    Test file exists at `app/components/EmberGlass/__tests__/Sheet.test.tsx` with all 12 tests organized in 4 describe blocks. Jest discovers it. Initial run is RED (Cannot find `../Sheet` module) — Task 2 will turn it GREEN.
  </done>
</task>

<task type="auto" tdd="true">
  <name>Task 2: Implement Sheet.tsx (Radix Dialog facade + scroll-lock + bundle-verbatim visuals) — turn RED tests GREEN</name>
  <files>app/components/EmberGlass/Sheet.tsx</files>
  <read_first>
    - app/components/EmberGlass/__tests__/Sheet.test.tsx (just-written test file — drives implementation contract)
    - app/components/ui/Sheet.tsx (legacy Radix-based — `* as DialogPrimitive` import shape, forwardRef pattern; do NOT import from this file, only reference)
    - app/components/ui/BottomSheet.tsx lines 50-67 (scroll-lock recipe — DUPLICATE the ~10 lines, do NOT import per CONTEXT line 164)
    - app/components/EmberGlass/AmbientBg.tsx (sibling Phase 174 primitive — `'use client'` + JSDoc + AUDIT-EXCEPTION inline tagging convention)
    - .planning/phases/175-glass-primitives-press-animation-sheet/175-UI-SPEC.md §"<Sheet>" entire section (lines 226-356) — locked composition, props, dismissal vectors, scroll-lock recipe
    - .planning/phases/175-glass-primitives-press-animation-sheet/175-RESEARCH.md §"Sheet Primitive Implementation" (lines 211-417) — concrete shape with all bundle visuals
    - .planning/phases/175-glass-primitives-press-animation-sheet/175-RESEARCH.md §"Common Pitfalls" lines 533-562 (Pitfall 2: forceMount required for outro; Pitfall 3: VisuallyHidden Title fallback; Pitfall 4: backdrop double-fire suppression; Pitfall 6: width:100% required)
    - .planning/phases/175-glass-primitives-press-animation-sheet/175-PATTERNS.md §"Sheet.tsx" (lines 144-264) — exact Radix wiring + close button shape
    - .planning/inbox/ember-glass-design/project/components/sheets.jsx lines 1-65 (canonical bundle source for visuals; every value tagged AUDIT-EXCEPTION must cite the bundle line number inline)
    - ./CLAUDE.md Pattern: `'use client';` for client components; Pattern: design system → `/debug/design-system`
  </read_first>
  <behavior>
    - All 12 tests in `Sheet.test.tsx` pass.
    - File starts with `'use client';`.
    - JSDoc top-of-file documents Z-INDEX RESERVATION (200=backdrop, 201=container) per D-13 + UI-SPEC lines 63-66; cites bundle source `sheets.jsx:13-65`.
    - `import * as DialogPrimitive from '@radix-ui/react-dialog'`; `import { VisuallyHidden } from '@radix-ui/react-visually-hidden'`; `import { X } from 'lucide-react'`; `import { useEffect, useRef } from 'react'`.
    - Composition: `<DialogPrimitive.Root open={open} onOpenChange={(next) => { if (!next) onClose(); }}>` → `<DialogPrimitive.Portal forceMount>` → custom backdrop `<div data-sheet-backdrop="true" aria-hidden="true" onClick={onClose} ...>` → `<DialogPrimitive.Content forceMount onPointerDownOutside={(e) => e.preventDefault()} aria-describedby={undefined} ...>`.
    - Backdrop inline style includes: `position:'fixed'`, `inset:0`, `zIndex:200`, `background: open ? 'rgba(0,0,0,0.5)' : 'transparent'` (AUDIT-EXCEPTION sheets.jsx:20), `backdropFilter: open ? 'blur(8px)' : 'none'` (+ WebKit prefix; AUDIT-EXCEPTION sheets.jsx:21), `transition: 'background .3s, backdrop-filter .3s'`, `pointerEvents: open ? 'auto' : 'none'`.
    - Sheet container inline style includes: `position:'fixed'`, `left:8`, `right:8`, `bottom:8`, `zIndex:201`, `borderRadius:32`, `background:'rgba(28, 25, 23, 0.85)'` (AUDIT-EXCEPTION sheets.jsx:31), `backdropFilter:'blur(40px) saturate(200%)'` (+ WebKit; AUDIT-EXCEPTION sheets.jsx:32), `border:'0.5px solid rgba(255,255,255,0.12)'` (AUDIT-EXCEPTION sheets.jsx:34), `boxShadow:'0 -20px 60px rgba(0,0,0,0.5), inset 1px 1px 0 rgba(255,255,255,0.08)'` (AUDIT-EXCEPTION sheets.jsx:35), `padding:'10px 20px 30px'`, `maxHeight:'85%'`, `overflowY:'auto'`, `transform: open ? 'translateY(0)' : 'translateY(110%)'`, `transition:'transform .4s cubic-bezier(.22,1,.36,1)'`.
    - Grabber row (always rendered): `<div style={{ display:'flex', justifyContent:'center', padding:'4px 0 12px' }}>` containing `<div style={{ width:40, height:5, borderRadius:999, background:'rgba(255,255,255,0.2)' }} />` (AUDIT-EXCEPTION sheets.jsx:44).
    - Title row (when `title` provided): flex space-between with `marginBottom:18`. Title is `<DialogPrimitive.Title style={{ fontFamily:'var(--font-display)', fontSize:22, fontWeight:600, color:'#fff', margin:0 }}>{title}</DialogPrimitive.Title>` (AUDIT-EXCEPTION color #fff sheets.jsx:39). Close button: `<button type="button" data-sheet-close="true" aria-label="Chiudi" onClick={onClose} style={{ width:32, height:32, borderRadius:999, border:'none', background:'rgba(255,255,255,0.1)', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}><X size={16} strokeWidth={2.2} /></button>` (AUDIT-EXCEPTION close-button bg sheets.jsx:53).
    - When `title` is omitted: render `<VisuallyHidden asChild><DialogPrimitive.Title>Sheet</DialogPrimitive.Title></VisuallyHidden>` (Pitfall 3 — Radix a11y requirement).
    - `{children}` rendered after the header.
    - Body scroll-lock effect (useRef-captured `lockedScrollY`) runs only when `open=true`; cleanup restores body styles + `window.scrollTo(0, lockedScrollY.current)`.
  </behavior>
  <action>
    Create `app/components/EmberGlass/Sheet.tsx` (~140 LOC). Top of file:

    ```tsx
    'use client';
    /**
     * Sheet — Phase 175 (SHEET-01) — Ember Glass primitive
     *
     * Z-INDEX RESERVATION (Phase 175 contract; downstream phases 178-181 must respect):
     *   200 → Sheet backdrop
     *   201 → Sheet container
     * Bottom-tab bar (Phase 181 NAV-01..04), dashboard cards (Phase 177), and any other
     * stacked content MUST stay below 200 so this Sheet hides them cleanly when open.
     *
     * Composition: prop-driven facade <Sheet open onClose title> over Radix Dialog.
     * Radix owns: focus trap, ESC, return-focus on close, role/aria.
     * We own: visual surface (matches design bundle sheets.jsx:13-65), backdrop tap
     * dismissal (own div + onClick={onClose}; Radix's onPointerDownOutside is suppressed
     * via e.preventDefault to avoid double-fire), and body scroll-lock (lifted from
     * BottomSheet.tsx:50-67 — restores scrollY on close, which Radix's built-in
     * scroll-lock does not).
     *
     * Bundle source: .planning/inbox/ember-glass-design/project/components/sheets.jsx:13-65
     */
    ```

    Implement per RESEARCH.md §"Sheet Primitive Implementation" (lines 213-374) and PATTERNS.md §"Sheet.tsx" (lines 144-264). Key implementation notes:

    1. `forceMount` on BOTH `<DialogPrimitive.Portal>` AND `<DialogPrimitive.Content>` (Pitfall 2 — needed for outro animation).
    2. `aria-describedby={undefined}` on `DialogPrimitive.Content` to suppress Radix's missing-description warning (UI-SPEC line 524).
    3. Each AUDIT-EXCEPTION value MUST have an inline comment citing the bundle line, e.g.: `background: 'rgba(28, 25, 23, 0.85)', // AUDIT-EXCEPTION (DS-02): bundle sheets.jsx:31`. This tags lines for the DS-02 grep gate (Phase 174 inheritance per UI-SPEC line 125).
    4. Scroll-lock effect: copy the recipe from `BottomSheet.tsx:50-67` but adapt to `useRef`-captured `scrollY` per UI-SPEC lines 314-330. Do NOT import from `BottomSheet.tsx` — duplicate the lines (CONTEXT D-11 line 164: keeps legacy file a clean delete target later).
    5. The close button uses a plain `<button>` (NOT `<DialogPrimitive.Close>`) so the component stays prop-driven and matches the bundle.
    6. Export named: `Sheet`. Export type: `SheetProps`.

    Per CLAUDE.md: file starts `'use client';`. No `npm install` needed (all deps verified present in package.json — `@radix-ui/react-dialog ^1.1.14`, `@radix-ui/react-visually-hidden ^1.2.4`, `lucide-react`).

    AUDIT-EXCEPTION inline comments are MANDATORY on these 10 lines (per UI-SPEC table 124-138):
    - backdrop background `rgba(0,0,0,0.5)` → sheets.jsx:20
    - backdrop blur `blur(8px)` → sheets.jsx:21
    - sheet bg `rgba(28, 25, 23, 0.85)` → sheets.jsx:31
    - sheet blur `blur(40px) saturate(200%)` → sheets.jsx:32
    - sheet border `0.5px solid rgba(255,255,255,0.12)` → sheets.jsx:34
    - sheet shadow `0 -20px 60px rgba(0,0,0,0.5), inset 1px 1px 0 rgba(255,255,255,0.08)` → sheets.jsx:35
    - grabber bg `rgba(255,255,255,0.2)` → sheets.jsx:44
    - title color `#fff` → sheets.jsx:39
    - close button bg `rgba(255,255,255,0.1)` → sheets.jsx:53
    - close button icon color `#fff` → sheets.jsx:55
  </action>
  <verify>
    <automated>npm run test:components -- Sheet</automated>
  </verify>
  <done>
    `app/components/EmberGlass/Sheet.tsx` exists (~140 LOC), all 12 jest tests in `Sheet.test.tsx` pass. Z-index reservation documented in JSDoc. All 10 AUDIT-EXCEPTION values tagged inline with bundle line refs. ESC + backdrop tap + close button all converge on `onClose` via the documented mechanisms. Scroll-lock body-style mutations + `window.scrollTo` restore observable in jsdom.
  </done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| Browser DOM ↔ Sheet portal | Sheet content renders into `document.body` via `DialogPrimitive.Portal`. `children` prop crosses from caller to portal. |
| User input ↔ document.body styles | Scroll-lock effect mutates `document.body.style.position/top/width/overflow` — must clean up even on crash. |
| Window scroll position ↔ useRef | `lockedScrollY` ref captures `window.scrollY` on open; restored on close via `window.scrollTo`. |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-175-01 | Information Disclosure | Sheet portal `children` | accept | Children rendered through React's standard JSX path into `DialogPrimitive.Portal` (which uses `createPortal` internally) — no `dangerouslySetInnerHTML` introduced by this primitive. Caller responsible for sanitizing untrusted content. LOW severity. |
| T-175-02 | Tampering | localStorage / persistence | N/A | Sheet primitive does NOT use localStorage. Phase 174 already handles accent/ambient persistence; no new keys added in 175. No threat surface. |
| T-175-03 | Denial of Service | Body style mutation cleanup | mitigate | Scroll-lock effect's cleanup function runs on unmount via React's effect lifecycle (`return () => { ... }`). If component crashes mid-render, React's error boundary still triggers cleanup of mounted effects. Belt-and-suspenders: jsdom test asserts body style restored after `rerender(open=false)`. LOW severity. |
| T-175-04 | Spoofing | Backdrop double-fire | mitigate | `onPointerDownOutside={(e) => e.preventDefault()}` on `DialogPrimitive.Content` ensures `onClose` fires exactly once per dismissal vector — preventing a malicious caller's analytics/state-machine from observing duplicate close events. Test 8 in Sheet.test.tsx asserts this. LOW severity. |
</threat_model>

<verification>
- `npm run test:components -- Sheet` passes (all 12 unit tests).
- `grep -n "z-index" app/components/EmberGlass/Sheet.tsx` shows the 200/201 documentation comment.
- `grep -F "transition: 'transform .4s cubic-bezier(.22,1,.36,1)'" app/components/EmberGlass/Sheet.tsx` returns one match (SC-#2 invariant) — note: the inline-style format may use object notation, so also accept `transition:'transform .4s cubic-bezier(.22,1,.36,1)'` or with surrounding whitespace.
- `grep -F "AUDIT-EXCEPTION" app/components/EmberGlass/Sheet.tsx | wc -l` returns at least 10 (one per non-token literal per UI-SPEC table 124-138).
- `grep -F "data-sheet-close" app/components/EmberGlass/Sheet.tsx` returns at least one match (close button attribute paired with global focus-visible rule from Plan 01).
- `grep -F "data-sheet-backdrop" app/components/EmberGlass/Sheet.tsx` returns at least one match (backdrop attribute used by tests).
- `grep -F "lockedScrollY" app/components/EmberGlass/Sheet.tsx` returns at least 4 matches (declaration + 3 references — capture, top, restore in scrollTo).
- `grep -F "forceMount" app/components/EmberGlass/Sheet.tsx | wc -l` returns at least 2 (Portal + Content per Pitfall 2).
- `grep -F "VisuallyHidden" app/components/EmberGlass/Sheet.tsx` returns at least 2 matches (import + usage in Title fallback).
- `grep -F "onPointerDownOutside" app/components/EmberGlass/Sheet.tsx` returns one match with `preventDefault`.
- TypeScript compiles cleanly (verified by jest run).
</verification>

<success_criteria>
- SHEET-01 deliverable: `<Sheet>` exported from `app/components/EmberGlass/Sheet.tsx` with the prop-driven facade `{ open, onClose, title?, children? }`.
- Bundle fidelity: every visual value listed in UI-SPEC lines 124-138 lifted verbatim with AUDIT-EXCEPTION inline tag citing bundle line number.
- SC-#2 (motion curve): `transition: 'transform .4s cubic-bezier(.22,1,.36,1)'` matches verbatim in Sheet.tsx.
- SC-#3 (3 dismissal vectors): ESC (Radix `onOpenChange`), backdrop tap (own `onClick`), close button click — all converge on `onClose` exactly once each.
- SC-#4 (scroll-lock + restore): `useRef`-captured `lockedScrollY` recipe with `window.scrollTo(0, lockedScrollY.current)` restoration on close.
- Z-index reservation: 200 (backdrop) / 201 (container) hardcoded inline; documented in top-of-file JSDoc for downstream Phases 178-181.
- Test gate: 12 unit tests green via `npm run test:components -- Sheet` (scoped per CLAUDE.md Rule 8).
- File contracts: `Sheet.tsx` ~140 LOC budget hit (UI-SPEC line 568), file starts `'use client';`.
- a11y: Radix-provided `role="dialog"` + `aria-modal="true"` + focus trap + ESC + return-focus all functional via the wrapper. Title fallback via `<VisuallyHidden>` when `title` prop omitted (Pitfall 3).
</success_criteria>

<output>
After completion, create `.planning/phases/175-glass-primitives-press-animation-sheet/175-02-SUMMARY.md` per `templates/summary.md`. Include:
- Files created with LOC counts
- Test counts (12 unit tests passing)
- AUDIT-EXCEPTION inline-tag count (≥10)
- Confirmation that Radix Dialog dependencies were already present (no install needed per CLAUDE.md Rule 4)
- Any deviations from the bundle (the only intentional one is `position: fixed` instead of `absolute` per RESEARCH §"Anti-patterns" line 512 — bundle's `absolute` is for the fake-iPhone frame; we render in the real document)
</output>
