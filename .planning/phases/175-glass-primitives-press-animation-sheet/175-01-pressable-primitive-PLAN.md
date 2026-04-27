---
phase: 175-glass-primitives-press-animation-sheet
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - app/components/EmberGlass/Pressable.tsx
  - app/components/EmberGlass/__tests__/Pressable.test.tsx
  - app/globals.css
autonomous: true
requirements: [DS-07]
requirements_addressed: [DS-07]
tags: [ember-glass, pressable, primitive, ds-07, jest, polymorphic-component]

must_haves:
  truths:
    - "<Pressable> component is exported from app/components/EmberGlass/Pressable.tsx with polymorphic `as` prop (default 'div')"
    - "usePressed() hook is exported from the same module returning { pressed, pointerHandlers }"
    - "On pointerdown the host element's inline transform becomes scale(0.97); on pointerup/pointerleave/pointercancel it returns to scale(1)"
    - "Inline transition is exactly 'transform .22s cubic-bezier(.34,1.56,.64,1)' (DS-07 curve)"
    - ".press-anim utility class in app/globals.css declares the same transition string"
    - "Hosts that are natively focusable (button/a/input/select/textarea OR tabIndex>=0) receive a data-pressable-focusable='true' attribute"
    - "[data-pressable-focusable=true]:focus-visible CSS rule paints outline: 2px solid var(--accent) with offset 2px"
    - "@media (prefers-reduced-motion: reduce) .press-anim collapses to 'transform 50ms linear'"
    - "All Pressable jest tests pass"
  artifacts:
    - path: "app/components/EmberGlass/Pressable.tsx"
      provides: "Polymorphic <Pressable> component + usePressed() hook"
      exports: ["Pressable", "usePressed", "PressableProps", "PointerHandlers"]
      min_lines: 50
    - path: "app/components/EmberGlass/__tests__/Pressable.test.tsx"
      provides: "Jest unit tests covering pointer events, polymorphism, hook, focusable attribute"
      min_lines: 60
    - path: "app/globals.css"
      provides: ".press-anim utility class + reduced-motion override + [data-pressable-focusable]:focus-visible rule"
      contains: ".press-anim"
  key_links:
    - from: "app/components/EmberGlass/Pressable.tsx"
      to: "app/globals.css (.press-anim)"
      via: "CSS class and inline transition string match exactly"
      pattern: "transform .22s cubic-bezier\\(.34,1.56,.64,1\\)"
    - from: "app/components/EmberGlass/Pressable.tsx (data-pressable-focusable)"
      to: "app/globals.css ([data-pressable-focusable=true]:focus-visible)"
      via: "data-attribute selector"
      pattern: "data-pressable-focusable"
---

<objective>
Ship the DS-07 press animation primitive: a polymorphic `<Pressable>` React component plus a `usePressed()` hook in `app/components/EmberGlass/Pressable.tsx`, alongside a `.press-anim` CSS utility class and `[data-pressable-focusable]:focus-visible` rule appended to `app/globals.css`. This delivers the SHARED utility every NEW interactive glass surface in Phases 177-181 will compose against (verifiable via grep for `Pressable` / `usePressed` / `.press-anim`).

Purpose: Phase 175 SC-#1 — "A single shared utility applies `scale(0.97)` with cubic-bezier `.34,1.56,.64,1` over 220ms on press, and is reused by every interactive glass surface in Phases 177-181."

Output:
- `app/components/EmberGlass/Pressable.tsx` (~70 LOC) — `'use client'` polymorphic forwardRef component + `usePressed` hook + JSDoc citing bundle source
- `app/globals.css` append (~12 LOC) — `.press-anim` rule + reduced-motion media query + `[data-pressable-focusable]:focus-visible` rule
- `app/components/EmberGlass/__tests__/Pressable.test.tsx` (~80 LOC) — Wave 0 jest unit tests
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
@app/components/EmberGlass/AmbientBg.tsx
@app/globals.css
@app/components/ui/__tests__/BottomSheet.test.tsx

<interfaces>
<!-- Concrete API contract for <Pressable> + usePressed (lifted from UI-SPEC §Component API + Variants and RESEARCH §Press Primitive Implementation). -->

```ts
// app/components/EmberGlass/Pressable.tsx — public surface

export interface PointerHandlers {
  onPointerDown: PointerEventHandler;
  onPointerUp: PointerEventHandler;
  onPointerLeave: PointerEventHandler;
  onPointerCancel: PointerEventHandler;
}

export function usePressed(): {
  pressed: boolean;
  pointerHandlers: PointerHandlers;
};

export const Pressable: <E extends ElementType = 'div'>(
  props: PressableProps<E> & { ref?: React.Ref<Element> }
) => React.ReactElement;
```

```css
/* app/globals.css append (after the existing reduced-motion ambient guard, ~line 363) */
.press-anim { transition: transform .22s cubic-bezier(.34,1.56,.64,1); }

[data-pressable-focusable="true"]:focus-visible,
[data-sheet-close="true"]:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

@media (prefers-reduced-motion: reduce) {
  .press-anim { transition: transform 50ms linear; }
}
```

<!-- Tokens consumed: var(--accent) (Phase 174 lock). No new tokens introduced. -->
</interfaces>
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Append .press-anim, focus-visible, and reduced-motion rules to app/globals.css</name>
  <files>app/globals.css</files>
  <read_first>
    - app/globals.css (read the entire current file to locate the existing Phase 174 reduced-motion guard near line 360-363; verify token block at lines 302-344)
    - .planning/phases/175-glass-primitives-press-animation-sheet/175-UI-SPEC.md §"Component API + Variants" (lines 212-219), §"Component Inventory" (lines 570-571 — utility class budget)
    - .planning/phases/175-glass-primitives-press-animation-sheet/175-PATTERNS.md §"app/globals.css (edit, append)" (lines 570-617)
    - .planning/phases/175-glass-primitives-press-animation-sheet/175-RESEARCH.md §".press-anim utility" (lines 193-208)
  </read_first>
  <behavior>
    - After append, `grep -n "press-anim" app/globals.css` returns at least 2 lines (the rule + the reduced-motion override).
    - The rule string MUST be exactly: `transition: transform .22s cubic-bezier(.34,1.56,.64,1);` (no spaces inside cubic-bezier args; matches the JS-inline transition string in Pressable.tsx character-for-character).
    - `[data-pressable-focusable="true"]:focus-visible, [data-sheet-close="true"]:focus-visible` selector paints `outline: 2px solid var(--accent); outline-offset: 2px;`.
    - `@media (prefers-reduced-motion: reduce) { .press-anim { transition: transform 50ms linear; } }` block exists.
  </behavior>
  <action>
    Append the following block to `app/globals.css` AFTER the existing `@media (prefers-reduced-motion: reduce)` ambient guard (the one that contains `.ember-ambient-blob { animation: none !important; }` near line 360-363). Do NOT modify the existing `:root` token block or the `.glass-surface` utility. The block:

    ```css
    /* ===== EMBER GLASS PRIMITIVES (Phase 175 — DS-07, SHEET-01) ===== */
    /* Press animation transition shape (DS-07). Transform itself is JS-driven (Pressable component sets it inline). This class exists so reduced-motion overrides have one canonical token AND any future static :active consumers can use it. */
    .press-anim {
      transition: transform .22s cubic-bezier(.34,1.56,.64,1);
    }

    /* Focus-visible accent outline for Pressable hosts that are natively focusable (Pressable adds data-pressable-focusable='true') AND for the Sheet close button (data-sheet-close='true'). Inline styles cannot express :focus-visible, so this lives globally. */
    [data-pressable-focusable="true"]:focus-visible,
    [data-sheet-close="true"]:focus-visible {
      outline: 2px solid var(--accent);
      outline-offset: 2px;
    }

    /* Reduced-motion override for .press-anim (Sheet's 400ms transition is intentionally NOT collapsed in Phase 175 — see 175-UI-SPEC.md). */
    @media (prefers-reduced-motion: reduce) {
      .press-anim { transition: transform 50ms linear; }
    }
    ```

    Use Edit tool with the existing reduced-motion block as the anchor. Do NOT use heredoc.
  </action>
  <verify>
    <automated>grep -n "press-anim" app/globals.css | wc -l | awk '{ if ($1 >= 2) exit 0; else exit 1 }' && grep -F "transition: transform .22s cubic-bezier(.34,1.56,.64,1)" app/globals.css && grep -F "[data-pressable-focusable=\"true\"]:focus-visible" app/globals.css && grep -F "transition: transform 50ms linear" app/globals.css</automated>
  </verify>
  <done>
    `app/globals.css` contains the `.press-anim` rule with the exact DS-07 curve string; the `[data-pressable-focusable]:focus-visible` rule paints accent outline; the reduced-motion override collapses the press transition to 50ms linear; all existing rules remain untouched.
  </done>
</task>

<task type="auto" tdd="true">
  <name>Task 2: Write Pressable.test.tsx (Wave 0 — RED) covering pointer events, polymorphism, hook, focusable attribute</name>
  <files>app/components/EmberGlass/__tests__/Pressable.test.tsx</files>
  <read_first>
    - app/components/ui/__tests__/BottomSheet.test.tsx (analog test file — describe block organization, fireEvent patterns, jest.fn() mock conventions)
    - app/components/EmberGlass/AmbientBg.tsx (Phase 174 sibling primitive — JSDoc style, `'use client'` boundary)
    - .planning/phases/175-glass-primitives-press-animation-sheet/175-RESEARCH.md §"Common Pitfalls" Pitfall 1 (lines 528-532 — fireEvent.pointerDown reliable in jsdom; userEvent.pointer flaky)
    - .planning/phases/175-glass-primitives-press-animation-sheet/175-PATTERNS.md §"Pressable.test.tsx" (lines 296-334)
    - .planning/phases/175-glass-primitives-press-animation-sheet/175-UI-SPEC.md §"<Pressable>" props table (lines 170-180), §"data-pressable-focusable" mechanism (lines 508-516)
  </read_first>
  <behavior>
    - Test 1 (Rendering): renders default `as="div"` with children.
    - Test 2 (Rendering): `as="button"` renders a `<button>` element (verify `tagName === 'BUTTON'`).
    - Test 3 (Rendering): `ref` prop forwards to host element (`forwardRef` smoke).
    - Test 4 (Pointer events): initial inline `style.transform` contains `scale(1)` and `transition` contains `cubic-bezier(.34,1.56,.64,1)` and `0.22s` (or `.22s`).
    - Test 5 (Pointer events): `fireEvent.pointerDown(el)` flips inline `style.transform` to contain `scale(0.97)`.
    - Test 6 (Pointer events): `fireEvent.pointerUp(el)` after pointerDown returns inline `style.transform` to `scale(1)`.
    - Test 7 (Pointer events): `fireEvent.pointerLeave(el)` after pointerDown returns inline `style.transform` to `scale(1)`.
    - Test 8 (Pointer events): `fireEvent.pointerCancel(el)` after pointerDown returns inline `style.transform` to `scale(1)`.
    - Test 9 (data-pressable-focusable): `<Pressable as="button">` host has attribute `data-pressable-focusable="true"`.
    - Test 10 (data-pressable-focusable): `<Pressable as="div">` host does NOT have the attribute.
    - Test 11 (data-pressable-focusable): `<Pressable as="div" tabIndex={0}>` host HAS the attribute.
    - Test 12 (usePressed hook): `renderHook(() => usePressed())` returns `{ pressed: false, pointerHandlers: { onPointerDown, onPointerUp, onPointerLeave, onPointerCancel } }`; calling `act(() => result.current.pointerHandlers.onPointerDown(...))` flips `pressed` to `true`.
    - Test 13 (caller style spread): `<Pressable style={{ background: 'red' }}>` host has `style.background === 'red'` AND still has `transform`/`transition` from press contract.
  </behavior>
  <action>
    Create `app/components/EmberGlass/__tests__/Pressable.test.tsx` with the test surface above. Use the same import shape as `app/components/ui/__tests__/BottomSheet.test.tsx` (analog). Use `import { fireEvent, render, renderHook, act } from '@testing-library/react'`. Import the SUT via `import { Pressable, usePressed } from '../Pressable'` (Pressable.tsx will be created in Task 3 — this test file is Wave 0 RED, so initial run MUST fail with "Cannot find module '../Pressable'" or similar).

    Organize into 4 describe blocks: "Rendering", "Pointer events", "data-pressable-focusable attribute", "usePressed hook". Use `jest.fn()` only if needed (not required here — tests inspect inline style/attribute).

    For Test 5/6/7/8 use this exact assertion shape (copy verbatim, adapt selector):
    ```tsx
    const { container } = render(<Pressable data-testid="x">child</Pressable>);
    const el = container.firstElementChild as HTMLElement;
    expect(el.style.transform).toContain('scale(1)');
    fireEvent.pointerDown(el);
    expect(el.style.transform).toContain('scale(0.97)');
    fireEvent.pointerUp(el);
    expect(el.style.transform).toContain('scale(1)');
    ```

    For Test 12 (hook):
    ```tsx
    const { result } = renderHook(() => usePressed());
    expect(result.current.pressed).toBe(false);
    act(() => { result.current.pointerHandlers.onPointerDown({} as never); });
    expect(result.current.pressed).toBe(true);
    act(() => { result.current.pointerHandlers.onPointerUp({} as never); });
    expect(result.current.pressed).toBe(false);
    ```

    Test/error/console output stays in English per UI-SPEC line 491 ("Test/error output stays in English").
  </action>
  <verify>
    <automated>npx jest app/components/EmberGlass/__tests__/Pressable.test.tsx --listTests 2>&1 | grep -q "Pressable.test.tsx" && echo "Test file discovered" && (npx jest app/components/EmberGlass/__tests__/Pressable.test.tsx 2>&1 | grep -E "(Cannot find module|FAIL)" || echo "RED state expected — Pressable.tsx not yet created")</automated>
  </verify>
  <done>
    Test file exists at `app/components/EmberGlass/__tests__/Pressable.test.tsx` with all 13 tests organized in 4 describe blocks. Jest discovers it. Initial run is RED (Cannot find `../Pressable` module) — Task 3 will turn it GREEN.
  </done>
</task>

<task type="auto" tdd="true">
  <name>Task 3: Implement Pressable.tsx (component + usePressed hook) — turn RED tests GREEN</name>
  <files>app/components/EmberGlass/Pressable.tsx</files>
  <read_first>
    - app/components/EmberGlass/Pressable.test.tsx (the just-written test file — drives implementation contract)
    - app/components/EmberGlass/AmbientBg.tsx (sibling Phase 174 primitive — `'use client'` + JSDoc + inline-style approach)
    - app/components/ui/Sheet.tsx lines 1-150 (forwardRef + displayName pattern from legacy)
    - .planning/phases/175-glass-primitives-press-animation-sheet/175-UI-SPEC.md §"<Pressable>" entire section (lines 148-225)
    - .planning/phases/175-glass-primitives-press-animation-sheet/175-RESEARCH.md §"Press Primitive Implementation" (lines 104-209) for the exact concrete shape
    - .planning/phases/175-glass-primitives-press-animation-sheet/175-PATTERNS.md §"app/components/EmberGlass/Pressable.tsx" (lines 27-141)
    - .planning/inbox/ember-glass-design/project/components/cards.jsx lines 1-50 (bundle source of press behavior)
    - ./CLAUDE.md Rule 3 (PREFER editing existing files — but this is a new file required by D-01) and Rule 5 (always tests)
  </read_first>
  <behavior>
    - All 13 tests in `Pressable.test.tsx` pass.
    - File starts with `'use client';` directive.
    - JSDoc cites: Phase 175 (DS-07), bundle source `cards.jsx:11-14`, the `.press-anim` global utility, and the SC-#1 grep contract.
    - `usePressed()` exported as a named function returning `{ pressed: boolean; pointerHandlers: PointerHandlers }`.
    - `Pressable` exported as a polymorphic `forwardRef` component with default `as='div'`.
    - Inline `style.transform` toggles between `'scale(1)'` (idle) and `'scale(0.97)'` (pressed).
    - Inline `style.transition` is exactly `'transform .22s cubic-bezier(.34,1.56,.64,1)'`.
    - Caller `style` is spread AFTER the press contract (caller cannot override `transform`/`transition`, but their other style keys win).
    - `data-pressable-focusable="true"` attribute is set when host tag is `button | a | input | select | textarea` OR consumer passed `tabIndex` >= 0.
    - `displayName = 'Pressable'` set after the `forwardRef` definition.
  </behavior>
  <action>
    Create `app/components/EmberGlass/Pressable.tsx` (~70 LOC) using the concrete shape from RESEARCH.md §"Press Primitive Implementation" (lines 108-186). Top of file:

    ```tsx
    'use client';
    /**
     * Pressable — Phase 175 (DS-07)
     *
     * Press animation primitive. Tracks pointer state in JS (NOT :active, which sticks
     * on touch devices and does not release on pointerleave) and applies inline
     * scale(0.97) ↔ scale(1) with the locked Ember Glass press curve. Polymorphic via
     * the `as` prop (default 'div').
     *
     * Three grep targets satisfy the SC-#1 "shared utility" contract for Phases 177-181:
     *   1. <Pressable> component (this file)
     *   2. usePressed() hook (this file)
     *   3. .press-anim CSS class (app/globals.css)
     *
     * Source-of-truth curve: `transition: transform .22s cubic-bezier(.34,1.56,.64,1)`.
     * Bundle source: .planning/inbox/ember-glass-design/project/components/cards.jsx:11-14
     */
    ```

    Implement:
    - `interface PointerHandlers` with the four `PointerEventHandler` keys.
    - `export function usePressed()`: `useState<boolean>(false)`, four `useCallback` handlers (onPointerDown→true; onPointerUp/onPointerLeave/onPointerCancel→false), return `{ pressed, pointerHandlers }`.
    - Constant `const PRESS_TRANSITION = 'transform .22s cubic-bezier(.34,1.56,.64,1)';` (single source of truth — same string the test asserts against).
    - Constant `const FOCUSABLE_HOSTS = new Set(['button', 'a', 'input', 'select', 'textarea']);`.
    - Polymorphic `Pressable` via `forwardRef` with the standard cast pattern (per RESEARCH lines 164-185). Inside: derive `Tag = (as ?? 'div') as ElementType`; compute `isFocusable = (typeof Tag === 'string' && FOCUSABLE_HOSTS.has(Tag)) || (typeof rest.tabIndex === 'number' && rest.tabIndex >= 0)`; spread caller `...rest` AFTER pointer handlers; spread caller `style` AFTER the press contract (so caller cannot override transform/transition); conditionally include `'data-pressable-focusable': 'true'` when `isFocusable`.
    - Final cast: `as <E extends ElementType = 'div'>(props: PressableProps<E> & { ref?: React.Ref<Element> }) => React.ReactElement;` (per RESEARCH line 185).
    - Set `(Pressable as { displayName?: string }).displayName = 'Pressable';`.
    - Export named: `Pressable`, `usePressed`. Export types: `PressableProps`, `PointerHandlers`.

    No `aria-label` is added by Pressable itself (consumer responsibility per UI-SPEC lines 203-206). No reduced-motion `useEffect` (rejected per UI-SPEC line 517). No hover state (per UI-SPEC line 194 — bundle does not implement hover).

    Per CLAUDE.md Pattern: file starts with `'use client';` (Pattern: Client Components).
  </action>
  <verify>
    <automated>npm run test:components -- Pressable</automated>
  </verify>
  <done>
    `app/components/EmberGlass/Pressable.tsx` exists (~70 LOC), all 13 jest tests in `Pressable.test.tsx` pass, `displayName === 'Pressable'`, the file exports `Pressable`, `usePressed`, and the `PressableProps`/`PointerHandlers` types.
  </done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| Browser DOM ↔ React component | Pointer events flow from DOM into React state; no untrusted external input crosses this boundary (`<Pressable>` is a primitive with no network/storage I/O). |
| Caller props ↔ Pressable internals | Caller's `style` prop is spread AFTER the press contract — caller cannot override `transform`/`transition`. No XSS sink: children prop passed through React (not `dangerouslySetInnerHTML`). |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-175-01 | Information Disclosure | `<Pressable>` children prop | accept | Children rendered through React's standard JSX path; no `dangerouslySetInnerHTML` used. No mitigation needed beyond avoiding raw HTML injection (which is not introduced here). LOW severity. |
| T-175-02 | Tampering | Caller `style` prop | mitigate | Caller's `style` is spread AFTER the JS-driven `transform`/`transition`, so a caller cannot accidentally (or maliciously) override the DS-07 press contract. Documented in JSDoc and UI-SPEC line 176-177. LOW severity. |
| T-175-03 | Denial of Service | Pointer event handler tight loop | accept | `useState` flips a boolean; React batches updates. No O(n²) work, no recursion. Cannot DoS via rapid pointer events. LOW severity. |
</threat_model>

<verification>
- `npm run test:components -- Pressable` passes (all 13 unit tests).
- `grep -n "press-anim" app/globals.css` shows the rule + reduced-motion override + (optionally) the focus-visible selector.
- `grep -F "transition: transform .22s cubic-bezier(.34,1.56,.64,1)" app/components/EmberGlass/Pressable.tsx` returns one match (constant declaration).
- `grep -F "transition: transform .22s cubic-bezier(.34,1.56,.64,1)" app/globals.css` returns one match (`.press-anim` rule).
- The two strings above MUST be identical character-for-character (Phase 175 SC-#1 invariant; Phases 177-181 will assert the same regex).
- `grep -F "data-pressable-focusable" app/components/EmberGlass/Pressable.tsx` returns at least one match.
- `grep -F "[data-pressable-focusable=\"true\"]:focus-visible" app/globals.css` returns one match.
- TypeScript compiles cleanly (no new `tsc` errors introduced — verified by jest run, which would fail on TS errors).
</verification>

<success_criteria>
- DS-07 deliverable: `<Pressable>` and `usePressed()` exported from `app/components/EmberGlass/Pressable.tsx`; `.press-anim` class registered in `app/globals.css`. All three grep targets satisfy the per-phase 177-181 invariant from RESEARCH §"Validation Architecture".
- Test gate: 13 unit tests green via `npm run test:components -- Pressable` (scoped per CLAUDE.md Rule 8).
- Bundle fidelity: inline transform/transition match `cards.jsx:11-14` semantics (JS pointer state, not `:active`).
- Phase 174 token consumption: `var(--accent)` is used by the focus-visible rule (no hardcoded accent color anywhere in this plan's files).
- File contracts: `Pressable.tsx` ~70 LOC budget hit (UI-SPEC line 567), file starts `'use client';`, JSDoc cites bundle source line numbers.
</success_criteria>

<output>
After completion, create `.planning/phases/175-glass-primitives-press-animation-sheet/175-01-SUMMARY.md` per `templates/summary.md`. Include:
- Files created/modified with LOC counts
- Test counts (13 unit tests passing)
- Confirmation that all three SC-#1 grep targets exist (`Pressable`, `usePressed`, `.press-anim`)
- Any TypeScript polymorphic-component cast caveats (the standard `as <E extends ElementType...>` cast is acceptable per existing repo precedent — see `BottomSheet.tsx:3` `@ts-expect-error` pattern)
</output>
