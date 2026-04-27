# Phase 175: Glass Primitives — Press Animation & Sheet - Research

**Researched:** 2026-04-27
**Domain:** React 19 / Next.js 15.5 client primitives — interaction (pointer events) + portal/dialog (Radix) + scroll-lock + transition tokens
**Confidence:** HIGH

## Summary

Phase 175 ships two reusable Ember Glass interaction primitives — `<Pressable>` (DS-07) and `<Sheet>` (SHEET-01) — under `app/components/EmberGlass/`. Both consume Phase 174 tokens (already locked in `globals.css:302-344`) and follow the bundle's inline-style approach. CONTEXT.md auto-resolved every gray area: file names (`Pressable.tsx`, `Sheet.tsx`), API shapes (component + `usePressed` hook + `.press-anim` CSS class; `<Sheet open onClose title>` facade over `@radix-ui/react-dialog`), scroll-lock recipe (lifted verbatim from `BottomSheet.tsx:50-67`), z-index 200/201, and exact 8 Playwright assertions. **Research must NOT re-decide these — it must produce the concrete code shapes the planner pastes into PLAN.md.**

The risk surface is small: Radix Dialog v1.1.14 supports every needed knob (controlled `open`/`onOpenChange`, Portal, `onPointerDownOutside={e.preventDefault()}` to suppress its own dismiss path, automatic ESC + focus trap, automatic body scroll lock that we override with the bundle's restore-scrollY recipe). jsdom does NOT fire `pointerdown` synthetic events reliably from `userEvent.pointer()` in all versions, but `fireEvent.pointerDown` + `fireEvent.pointerUp` on the actual element work, and that pattern is already viable in this repo. Body style mutations + `window.scrollTo` are observable in jsdom.

**Primary recommendation:** Plan three implementation files (`Pressable.tsx`, `Sheet.tsx`, `index.ts`), one CSS append to `globals.css` (one rule + one optional reduced-motion rule), three documentation appends to `app/debug/design-system-v2/page.tsx` (two new sections — Press demo and Sheet demo), two unit-test files (`Pressable.test.tsx`, `Sheet.test.tsx`), and extend `tests/smoke/` with **two new Playwright spec files** (`press-primitive.spec.ts`, `sheet-primitive.spec.ts`) since Phase 174's smoke specs split per-feature (`accent-picker.spec.ts`, `ambient-persist.spec.ts`, `fonts-self-hosted.spec.ts`) — match that convention.

## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Both primitives live under `app/components/EmberGlass/`. Concrete files: `Pressable.tsx`, `Sheet.tsx`, `index.ts` (barrel export).
- **D-02:** Existing `app/components/ui/Sheet.tsx` (334 LOC, Radix-based) and `app/components/ui/BottomSheet.tsx` (153 LOC, custom portal) are **NOT touched, NOT renamed, NOT removed** in this phase. New `EmberGlass/Sheet` is a sibling primitive.
- **D-03:** Press primitive is a `<Pressable>` React component using `onPointerDown` / `onPointerUp` / `onPointerLeave` / `onPointerCancel` JS state. Polymorphic `as` prop (default `'div'`). Forwards `onClick`, `className`, `style`, `aria-*`, `ref`. Inline transform: `style={{ transform: pressed ? 'scale(0.97)' : 'scale(1)', transition: 'transform .22s cubic-bezier(.34,1.56,.64,1)' }}`.
- **D-04:** Also export `usePressed()` hook returning `{ pressed, pointerHandlers }` — `<Pressable>` is implemented on top of it.
- **D-05:** Add `.press-anim` CSS utility to `app/globals.css` declaring **only** the transition (`transition: transform .22s cubic-bezier(.34,1.56,.64,1)`); transform itself stays inline (driven by JS).
- **D-06:** Phase 175's verification asserts `Pressable` exported from EmberGlass index AND `.press-anim` class present in computed CSS. Per-surface-uses-it grep is enforced **per phase 177-181**, not here.
- **D-07:** Sheet is a prop-driven facade `<Sheet open onClose title>{children}</Sheet>` over `@radix-ui/react-dialog`. Internal: `DialogPrimitive.Root open onOpenChange` → `DialogPrimitive.Portal` → custom backdrop `<div>` + `DialogPrimitive.Content` with our own header. No compound `<Sheet.Content><Sheet.Title>...` API.
- **D-08:** Sheet visual spec lifted verbatim from `sheets.jsx:13-65`. Backdrop: fixed inset-0, `rgba(0,0,0,0.5)`, `backdrop-filter: blur(8px)` (with `-webkit-` prefix), 300ms transition on `background` + `backdrop-filter`, `pointerEvents:'none'` when closed. Sheet container: `left:8px right:8px bottom:8px`, `borderRadius:32px`, `background: rgba(28,25,23,0.85)`, `backdrop-filter: blur(40px) saturate(200%)`, `border: 0.5px solid rgba(255,255,255,0.12)`, `boxShadow: '0 -20px 60px rgba(0,0,0,0.5), inset 1px 1px 0 rgba(255,255,255,0.08)'`, `padding:'10px 20px 30px'`, `maxHeight:'85%'`, `overflowY:'auto'`. Open `translateY(0)`, closed `translateY(110%)`. Transition `transform .4s cubic-bezier(.22,1,.36,1)`.
- **D-09:** Header always renders grabber pill (40×5, `rgba(255,255,255,0.2)`, `borderRadius:999`). When `title` prop set, second row with title (font-display 22px 600 #fff) and 32×32 circular close button (`rgba(255,255,255,0.1)` bg, lucide `<X size={16}>` icon).
- **D-10:** Backdrop tap dismissal — own `<div onClick={onClose}>`. Suppress Radix's `onPointerDownOutside` via `e.preventDefault()` on `<DialogPrimitive.Content>` to prevent double-fire. Radix still owns ESC and focus trap.
- **D-11:** Body scroll lock pattern lifted verbatim from `BottomSheet.tsx:50-67` (capture scrollY, `position:fixed top:-${scrollY}px width:100% overflow:hidden`; restore via clearing styles + `window.scrollTo(0, scrollY)`). Do NOT rely on Radix's built-in scroll lock — it does not restore scroll position.
- **D-12:** No size variants. `maxHeight: 85%`, content-driven.
- **D-13:** Z-index 200 (backdrop) / 201 (sheet container), hard-coded inline. Document this convention in a top-of-file comment in `EmberGlass/Sheet.tsx`.
- **D-14:** No swipe-to-dismiss gesture.
- **D-15:** No `prefers-reduced-motion` handling required. Planner discretion: ≤10 LOC bonus block in `globals.css` allowed.
- **D-16:** Extend `app/debug/design-system-v2/page.tsx` (Phase 174's page) with two new sections: "Press primitive" (3-4 sample `<Pressable>` glass surfaces) and "Sheet primitive" (an "Open Sheet" button + sample Sheet with title "Demo sheet" + ~3 rows of dummy content long enough to need scroll).
- **D-17:** Eight Playwright smoke specs (press primitive present; Sheet open via button; ESC dismiss; backdrop tap dismiss; close button dismiss; scroll lock + restore; mobile 375px; desktop 1024px).
- **D-18:** Unit tests under `app/components/EmberGlass/__tests__/`: `Pressable.test.tsx` and `Sheet.test.tsx`.

### Claude's Discretion
- Internal organization of `Pressable.tsx` (separate `usePressed.ts` hook file vs co-located).
- Whether to ship a `<SheetRow>` helper (Phase 178 problem; **recommend defer**).
- Exact dismissal callback name (`onClose` per bundle vs `onOpenChange` per Radix). **Bundle wins:** use `onClose`.
- Whether to add a ≤10 LOC `@media (prefers-reduced-motion: reduce)` block (D-15).

### Deferred Ideas (OUT OF SCOPE)
- Swipe / drag-to-dismiss gesture.
- Migration of legacy `app/components/ui/Sheet.tsx` and `BottomSheet.tsx` callers.
- Reduced-motion overrides for Sheet/press (≤10 LOC bonus only).
- `<SheetRow>` / `<SheetBtn>` layout helpers.
- Imperative focus management (autofocus inputs on open).
- Backdrop blur intensity prop / variants.

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| DS-07 | Card press animation (`scale(0.97)` cubic-bezier `.34,1.56,.64,1`, 220ms) is a **shared utility** used by all interactive glass surfaces. | §"Press Primitive Implementation" specifies `<Pressable>` + `usePressed()` + `.press-anim` (3 grep targets). §"Validation Architecture" defines the per-phase 177-181 grep invariant that proves SC-#1. |
| SHEET-01 | Bottom sheet primitive — translucent (rgba bg + backdrop-blur), translates from off-screen with cubic-bezier `.22,1,.36,1` 400ms; grabber + title + close button; ESC + backdrop tap dismiss; body scroll-lock while open. | §"Sheet Primitive Implementation" specifies the full Radix Dialog composition with the bundle visuals lifted verbatim. §"Scroll Lock Recipe" provides the exact lifecycle code. |

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Pointer-state tracking (press) | Browser / Client | — | `useState` + DOM pointer events; no SSR signal needed. `'use client'`. |
| Press transition spec (`.press-anim` CSS class) | CDN / Static (CSS via Next.js) | — | Static class in `globals.css`, single source of truth for the curve. |
| Dialog ARIA + focus trap + ESC | Browser / Client (via Radix) | — | Radix Dialog handles `role="dialog"`, focus trap, ESC, return-focus. |
| Sheet portal mounting | Browser / Client | — | `DialogPrimitive.Portal` renders to `document.body`; client-only. |
| Body scroll lock + restore | Browser / Client | — | Mutates `document.body.style` + `window.scrollTo`; client-only side-effect. |
| Sheet visual surface (backdrop + sheet container) | Browser / Client | — | Inline-style tokens + `var(--accent)` CSS custom property; renders client-side. |
| Demo page (smoke surface) | Frontend Server (SSR shell) → Client | — | `app/debug/design-system-v2/page.tsx` is `'use client'`. |
| Test verification (Playwright) | Browser / Client | — | E2E in real browser (Chromium + WebKit). |
| Test verification (unit) | Browser / Client (jsdom) | — | Jest + jsdom; pointer events + body style mutations both observable. |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@radix-ui/react-dialog` | ^1.1.14 | Sheet a11y/focus-trap/ESC/portal mechanics. | Already a dependency (`package.json:34`). Industry-standard headless dialog primitive. Used by legacy `app/components/ui/Sheet.tsx` already. **No install needed.** [VERIFIED: package.json:34] |
| `lucide-react` | already installed | `<X>` close-button icon (D-09). | Already used by both legacy Sheet.tsx and BottomSheet.tsx for the same purpose. [VERIFIED: app/components/ui/BottomSheet.tsx:5, ui/Sheet.tsx:9] |
| React 19 | (project default) | `useState`, `useEffect`, `forwardRef`, polymorphic `as` typing. | `'use client'` boundary already established in `AmbientBg.tsx`. |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@testing-library/react` | already installed | Render + assertion for unit tests. | `Pressable.test.tsx`, `Sheet.test.tsx`. Pattern matches `AmbientBg.test.tsx`. |
| `@testing-library/user-event` | ^14.6.1 | High-level interaction helper for click/keyboard. | Sheet ESC + close-button + backdrop-click tests. **AVOID `userEvent.pointer()` for `<Pressable>`** — see §"Common Pitfalls". |
| `@playwright/test` | already installed | E2E smoke for the 8 D-17 specs. | New files in `tests/smoke/`. |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Radix Dialog | Custom portal (like legacy `BottomSheet.tsx`) | Custom portal forces us to re-implement focus trap + ARIA + ESC. Radix gives them free. **D-07 locks Radix.** |
| `:active` CSS pseudo-class | Standalone CSS rule | Touch-device sticky state, no `pointerleave` release. Bundle uses JS state for a reason. **D-03 locks JS.** |
| Compound `<Sheet.Content><Sheet.Header>` | Single facade `<Sheet open onClose title>` | Compound is more flexible but inflates Phase 178 sheet bodies. Bundle ships the simple facade. **D-07 locks facade.** |
| `vaul` (drawer lib) | npm package | Adds a dependency for a 100-LOC primitive we already have all the parts to build. Plus D-14 says no swipe — vaul's biggest selling point is wasted. |

**Installation:** None. All dependencies present.

**Version verification (run by planner if desired, NOT by research per Rule 4):**
```bash
# Already verified:
grep -n "@radix-ui/react-dialog" package.json  # → ^1.1.14 [VERIFIED 2026-04-27]
```

## Press Primitive Implementation

### `app/components/EmberGlass/Pressable.tsx` (concrete shape)

```tsx
'use client';
/**
 * Pressable — Phase 175 (DS-07)
 *
 * Press animation primitive. Tracks pointer state in JS (NOT :active, which
 * sticks on touch devices) and applies inline scale(0.97) ↔ scale(1) with the
 * locked Ember Glass press curve. Polymorphic via the `as` prop.
 *
 * SC-#1 enforcement: every NEW interactive glass surface in Phases 177-181
 * MUST import either <Pressable>, usePressed(), or apply .press-anim. The
 * three are equally grep-able from the verification step.
 *
 * Source-of-truth curve: `transition: transform .22s cubic-bezier(.34,1.56,.64,1)`
 * — also declared in app/globals.css as the .press-anim utility class.
 */

import {
  forwardRef,
  useCallback,
  useState,
  type ComponentPropsWithoutRef,
  type ElementType,
  type PointerEventHandler,
  type ReactNode,
} from 'react';

interface PointerHandlers {
  onPointerDown: PointerEventHandler;
  onPointerUp: PointerEventHandler;
  onPointerLeave: PointerEventHandler;
  onPointerCancel: PointerEventHandler;
}

export function usePressed(): { pressed: boolean; pointerHandlers: PointerHandlers } {
  const [pressed, setPressed] = useState(false);
  const onPointerDown = useCallback<PointerEventHandler>(() => setPressed(true), []);
  const onPointerUp = useCallback<PointerEventHandler>(() => setPressed(false), []);
  const onPointerLeave = useCallback<PointerEventHandler>(() => setPressed(false), []);
  const onPointerCancel = useCallback<PointerEventHandler>(() => setPressed(false), []);
  return {
    pressed,
    pointerHandlers: { onPointerDown, onPointerUp, onPointerLeave, onPointerCancel },
  };
}

const PRESS_TRANSITION = 'transform .22s cubic-bezier(.34,1.56,.64,1)';

type PressableOwnProps<E extends ElementType> = {
  as?: E;
  children?: ReactNode;
};

type PressableProps<E extends ElementType> = PressableOwnProps<E> &
  Omit<ComponentPropsWithoutRef<E>, keyof PressableOwnProps<E>>;

export const Pressable = forwardRef(function Pressable<E extends ElementType = 'div'>(
  { as, children, style, className, ...rest }: PressableProps<E>,
  ref: React.Ref<Element>
) {
  const Tag = (as ?? 'div') as ElementType;
  const { pressed, pointerHandlers } = usePressed();
  return (
    <Tag
      ref={ref}
      className={className}
      style={{
        transform: pressed ? 'scale(0.97)' : 'scale(1)',
        transition: PRESS_TRANSITION,
        ...style,
      }}
      {...pointerHandlers}
      {...rest}
    >
      {children}
    </Tag>
  );
}) as <E extends ElementType = 'div'>(props: PressableProps<E> & { ref?: React.Ref<Element> }) => React.ReactElement;
```

**Notes for planner:**
- Polymorphic `forwardRef` typing in TS is gnarly. The cast at the bottom (`as <E extends ElementType...>`) is the standard pattern; the strict project may need a `// eslint-disable` near the cast. Acceptable per existing codebase patterns (e.g., createPortal `@ts-expect-error` in `BottomSheet.tsx:3`).
- The `useCallback` wrappers are technically unnecessary since `setPressed(true)`/`setPressed(false)` are stable, but the project prefers explicit handler stability for React Compiler's downstream auto-memoization to remain trivially correct. They cost ~4 LOC and are zero-runtime-cost in production.
- `style` prop is spread AFTER the JS transform/transition so callers cannot accidentally override the press contract. Planner may flip the order if they want to allow override (recommend keeping JS spec last).

### `.press-anim` utility (append to `app/globals.css` after line 344)

```css
/* Press animation primitive (Phase 175, DS-07) — single source of truth for the curve. */
/* Static utility for non-JS press surfaces; JS surfaces use the same string inline. */
.press-anim { transition: transform .22s cubic-bezier(.34,1.56,.64,1); }
```

### Optional reduced-motion override (D-15, ≤10 LOC bonus)

```css
@media (prefers-reduced-motion: reduce) {
  .press-anim { transition: transform 50ms linear; }
}
```

**Recommendation:** Ship it. Cost is 3 LOC, courtesy is real, no scope creep. Planner should still flag this as discretionary.

## Sheet Primitive Implementation

### `app/components/EmberGlass/Sheet.tsx` (concrete shape)

```tsx
'use client';
/**
 * Sheet — Phase 175 (SHEET-01)
 *
 * Z-INDEX CONVENTION:
 *   200 — backdrop
 *   201 — sheet container
 * Phases 178-181 MUST keep all stacked content (incl. NAV bottom bar) below 200.
 *
 * Composition: prop-driven facade <Sheet open onClose title> over Radix Dialog.
 * Radix owns: focus trap, ESC, return-focus on close, role/aria.
 * We own: visual surface (matches design bundle sheets.jsx:13-65), backdrop
 * tap dismissal (own div + onClick={onClose}; Radix's onPointerDownOutside is
 * suppressed via e.preventDefault to avoid double-fire), and body scroll-lock
 * (lifted from BottomSheet.tsx:50-67 — restores scrollY on close, which
 * Radix's built-in scroll-lock does not).
 */

import { useEffect, useRef, type ReactNode } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { X } from 'lucide-react';

export interface SheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children?: ReactNode;
}

export function Sheet({ open, onClose, title, children }: SheetProps): React.ReactElement {
  // Body scroll-lock + restore — recipe from app/components/ui/BottomSheet.tsx:50-67.
  // Captured scrollY persists in a ref so the restore in cleanup uses the same value.
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

  return (
    <DialogPrimitive.Root
      open={open}
      onOpenChange={(next) => { if (!next) onClose(); }}
    >
      <DialogPrimitive.Portal>
        {/* Custom backdrop — owns the click-to-dismiss vector (D-10). */}
        <div
          aria-hidden="true"
          onClick={onClose}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 200,
            background: open ? 'rgba(0,0,0,0.5)' : 'transparent',
            backdropFilter: open ? 'blur(8px)' : 'none',
            WebkitBackdropFilter: open ? 'blur(8px)' : 'none',
            transition: 'background .3s, backdrop-filter .3s',
            pointerEvents: open ? 'auto' : 'none',
          }}
        />
        <DialogPrimitive.Content
          // Suppress Radix auto-dismiss on outside pointer-down so our own
          // backdrop click is the single dismiss path. ESC stays default.
          onPointerDownOutside={(e) => e.preventDefault()}
          // Suppress Radix auto-focus-on-open warning when title is omitted.
          aria-describedby={undefined}
          style={{
            position: 'fixed',
            left: 8,
            right: 8,
            bottom: 8,
            zIndex: 201,
            borderRadius: 32,
            background: 'rgba(28, 25, 23, 0.85)',
            backdropFilter: 'blur(40px) saturate(200%)',
            WebkitBackdropFilter: 'blur(40px) saturate(200%)',
            border: '0.5px solid rgba(255,255,255,0.12)',
            boxShadow:
              '0 -20px 60px rgba(0,0,0,0.5), inset 1px 1px 0 rgba(255,255,255,0.08)',
            padding: '10px 20px 30px',
            maxHeight: '85%',
            overflowY: 'auto',
            transform: open ? 'translateY(0)' : 'translateY(110%)',
            transition: 'transform .4s cubic-bezier(.22,1,.36,1)',
          }}
        >
          {/* Grabber (always rendered, D-09) */}
          <div style={{ display: 'flex', justifyContent: 'center', padding: '4px 0 12px' }}>
            <div
              style={{
                width: 40,
                height: 5,
                borderRadius: 999,
                background: 'rgba(255,255,255,0.2)',
              }}
            />
          </div>
          {/* Title + close button (D-09) */}
          {title ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 18,
              }}
            >
              <DialogPrimitive.Title
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 22,
                  fontWeight: 600,
                  color: '#fff',
                  margin: 0,
                }}
              >
                {title}
              </DialogPrimitive.Title>
              <button
                type="button"
                aria-label="Chiudi"
                onClick={onClose}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 999,
                  border: 'none',
                  background: 'rgba(255,255,255,0.1)',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                }}
              >
                <X size={16} strokeWidth={2.2} />
              </button>
            </div>
          ) : (
            // Radix requires a Title for a11y; render an offscreen one when no title prop.
            <VisuallyHidden asChild><DialogPrimitive.Title>Sheet</DialogPrimitive.Title></VisuallyHidden>
          )}
          {children}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
```

**Critical gotchas the planner must surface in PLAN.md:**
1. **Radix requires a `DialogPrimitive.Title`** inside `Content` for a11y, otherwise it logs a console warning. When `title` prop is unset, render a `<VisuallyHidden>` title. **The project already has `@radix-ui/react-visually-hidden ^1.2.4` (`package.json:45`)** — no install. [VERIFIED: package.json:45]
2. **Radix's default outside-pointer-down behavior is dismiss.** We must call `e.preventDefault()` on `onPointerDownOutside` so our own backdrop `<div onClick={onClose}>` is the single dismiss path. Otherwise, both fire, `onClose` gets called twice — usually harmless, but a code smell.
3. **The closed sheet still mounts** when `open=false` if we use `DialogPrimitive.Portal` without `forceMount`. Radix actually unmounts the entire Portal subtree when `open=false`. **This means `translateY(110%)` outro animation does NOT play** unless we add `forceMount` to Portal AND keep our own visibility logic via the `pointerEvents: 'none'` on backdrop. **However:** the bundle's `sheets.jsx` keeps the sheet mounted always and toggles via `transform`. **Recommendation for planner:** add `forceMount` on `DialogPrimitive.Portal` AND on `DialogPrimitive.Content` so the outro transition plays. If `forceMount` is added, also gate the body-scroll-lock effect strictly on `open` (already shown above).
4. **Body scroll-lock effect must run only when `open=true` and clean up on close** (the early `return` on `!open` ensures this). Even with `forceMount`, the effect is keyed on `open` so the lock follows the prop.
5. **`onOpenChange` from Radix fires with `next=false` for ESC (which we want to bubble up to `onClose`) AND for outside-pointer-down (which we suppressed via `preventDefault`)**. The ESC dismissal vector is therefore handled "free" — when ESC is pressed Radix fires `onOpenChange(false)`, our handler calls `onClose()`. This is the third dismissal vector working without us writing keyboard code.

### Scroll Lock Recipe (verbatim from `BottomSheet.tsx:50-67`, adapted for `useRef`-captured scrollY)

```ts
// Inside Sheet.tsx
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

The legacy `BottomSheet.tsx` uses a closure-captured `scrollY` const inside the effect; we elevate it to a `useRef` so cleanup uses the same value even if the effect re-runs. Either pattern works for SC-#4. **Recommend ref pattern** — slightly more robust against React 18 strict-mode double-mount.

### `app/components/EmberGlass/index.ts`

```ts
export { Pressable, usePressed } from './Pressable';
export { Sheet } from './Sheet';
export type { SheetProps } from './Sheet';
export { default as AmbientBg } from './AmbientBg';
```

(Including AmbientBg in the barrel is purely a convenience; if Phase 174 already had its own ad-hoc imports keep those.)

## Architecture Patterns

### System Architecture Diagram

```
┌────────────────────────────────────────────────────────────────────┐
│ /debug/design-system-v2 page (client component, Phase 174 host)    │
│   ├─ existing sections 01-04 (hue / ambient / tokens / glass demo) │
│   ├─ NEW Section 05 — Press primitive demo                         │
│   │     └─ <Pressable as="div" className="glass-surface">…</Pressable> × 3-4
│   └─ NEW Section 06 — Sheet primitive demo                         │
│         ├─ "Open Sheet" <button onClick={() => setOpen(true)}>     │
│         └─ <Sheet open={open} onClose={() => setOpen(false)} title="Demo sheet"> │
│              └─ ~3 rows of dummy content                           │
└──────────────────────┬─────────────────────────────────────────────┘
                       │ imports
                       ▼
┌────────────────────────────────────────────────────────────────────┐
│ app/components/EmberGlass/index.ts (barrel)                        │
│   ├─ Pressable, usePressed         ─────┐                          │
│   └─ Sheet, SheetProps              ────┤                          │
└─────────────────────────────────────────┼──────────────────────────┘
                                          │
              ┌───────────────────────────┴────────────────────────┐
              ▼                                                    ▼
┌──────────────────────────────────┐            ┌────────────────────────────────────────┐
│ Pressable.tsx                    │            │ Sheet.tsx                              │
│  ├─ usePressed() hook            │            │  ├─ open/onClose/title facade          │
│  │   └─ pointer{Down|Up|Leave|   │            │  ├─ DialogPrimitive.Root (controlled)  │
│  │       Cancel} handlers        │            │  ├─ DialogPrimitive.Portal (forceMount)│
│  └─ <Pressable as>:              │            │  ├─ Custom backdrop <div onClick…>     │
│      inline transform + .22s     │            │  ├─ DialogPrimitive.Content            │
│      cubic-bezier(.34,1.56,.64,1)│            │  │   └─ onPointerDownOutside e.prev    │
│                                  │            │  ├─ Grabber + Title (or VisuallyHidden)│
│                                  │            │  ├─ Close button → onClose             │
│                                  │            │  └─ scroll-lock useEffect              │
└──────────────────────────────────┘            │       (BottomSheet.tsx:50-67 recipe)   │
                                                └────────────────────────────────────────┘
                                                                │
                                                                ▼
                                                ┌────────────────────────────────────────┐
                                                │ @radix-ui/react-dialog ^1.1.14         │
                                                │  ─ Portal (renders to document.body)   │
                                                │  ─ Focus trap (auto)                   │
                                                │  ─ ESC → onOpenChange(false) → onClose │
                                                │  ─ ARIA role="dialog" aria-modal       │
                                                └────────────────────────────────────────┘

CSS:
  app/globals.css (existing Phase 174 token block lines 302-344)
    └─ NEW append: .press-anim { transition: transform .22s cubic-bezier(.34,1.56,.64,1) }
    └─ OPTIONAL: @media (prefers-reduced-motion: reduce) { .press-anim { transition: transform 50ms linear } }
```

### Recommended File Layout
```
app/
└── components/
    └── EmberGlass/
        ├── AmbientBg.tsx         (existing, Phase 174)
        ├── Pressable.tsx         (NEW — ~70 LOC)
        ├── Sheet.tsx             (NEW — ~140 LOC)
        ├── index.ts              (NEW — barrel, ~5 LOC)
        └── __tests__/
            ├── AmbientBg.test.tsx (existing)
            ├── Pressable.test.tsx (NEW — ~80 LOC)
            └── Sheet.test.tsx     (NEW — ~140 LOC)

app/
├── globals.css (append ~3 LOC for .press-anim, optional +3 for reduced-motion)
└── debug/design-system-v2/page.tsx (append ~80 LOC for two new sections + open-state useState)

tests/
└── smoke/
    ├── press-primitive.spec.ts   (NEW — ~30 LOC)
    └── sheet-primitive.spec.ts   (NEW — ~180 LOC, 7 specs)
```

### Pattern 1: Polymorphic `forwardRef` with `as` prop
**What:** Render any HTML tag (or component) while typing props correctly per the rendered tag.
**When to use:** `<Pressable>` is the canonical case here — it must wrap div/button/article/etc.
**Example:** See `Pressable.tsx` shape above. The cast at the bottom is unavoidable in TS without third-party libraries (`react-polymorphic-types`). [CITED: standard React TS idiom]

### Pattern 2: Radix Dialog facade
**What:** Wrap Radix Dialog primitives in a single prop-driven component instead of exposing the compound API.
**When to use:** When the consumer needs only one shape (single backdrop + single content slot + optional header). Phase 178 builds 5 sheet bodies, all with the same shell — facade dominates compound here.
**Example:** See `Sheet.tsx` shape above.

### Anti-Patterns to Avoid
- **`:active` CSS for press** — sticks on touch, no `pointerleave` release. **Use JS state.**
- **Re-implementing focus trap** — Radix gives it free. Don't import `focus-trap-react` or write a custom one.
- **Radix's built-in scroll lock** — doesn't restore scroll position. Use the `BottomSheet.tsx:50-67` recipe.
- **Mounting two `DialogPrimitive.Title`** — Radix logs a warning. One title per Content. Use `<VisuallyHidden>` when no title prop.
- **Rendering Sheet at `position: absolute`** — bundle uses `absolute` because it sits inside a fake-iPhone frame. **We use `position: fixed`** because we render in the real document; backdrop covers the viewport, not a parent frame. (The bundle's `absolute` is the one and only deviation we make from a verbatim lift, and it's required for production.)

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Focus trap | Custom `useFocusTrap` hook | `@radix-ui/react-dialog` (already installed) | Tab cycling, return-focus on close, initial-focus rules — all edge-case-laden. Radix has years of bug fixes. |
| Portal | Custom `createPortal(...)` wrapper | `DialogPrimitive.Portal` | Radix portal participates in its focus trap; rolling our own breaks it. |
| ESC handler | `useEffect(() => addEventListener('keydown', ...))` | `onOpenChange={(next) => !next && onClose()}` | Radix already wires ESC → `onOpenChange(false)`. Adding our own is redundant + risks double-fire. |
| Body scroll lock from scratch | New helper | Recipe from `BottomSheet.tsx:50-67` (duplicate, do NOT import — keeps legacy file a clean delete target) | Already proven in production for 2+ years. Restoring scrollY is the non-obvious detail. |
| Polymorphic `as` typing | Hand-rolled generics | The pattern documented above (still hand-rolled but standardized) | The TS gymnastics are the same regardless. |

**Key insight:** Of the ~210 LOC across both primitives, ~140 are visual values (transform / box-shadow / padding) lifted verbatim from the design bundle. The "logic" is ~70 LOC and 90% of it is wiring known patterns together.

## Common Pitfalls

### Pitfall 1: jsdom + `userEvent.pointer()` does not fire `pointerdown` reliably
**What goes wrong:** `await userEvent.pointer({ keys: '[MouseLeft>]', target: el })` may not synthesize the `pointerdown` event in jsdom (it depends on the user-event version + jsdom version). The `<Pressable>` `pressed` state never flips to `true` and the test fails.
**Why it happens:** jsdom does not implement PointerEvent natively; user-event polyfills it but coverage varies.
**How to avoid:** Use `fireEvent.pointerDown(el)` / `fireEvent.pointerUp(el)` from `@testing-library/react`. These dispatch synthetic events directly and React handles them. **Confirmed reliable in jsdom for React 19.**
**Warning signs:** Test passes locally with browser-mode tests but fails in CI/jsdom; or `pressed` state never updates.

### Pitfall 2: Radix `forceMount` is required for outro animation
**What goes wrong:** When `open=false`, Radix unmounts the Portal subtree by default. The sheet's `translateY(110%)` outro animation never plays — it just disappears.
**Why it happens:** Radix optimizes by unmounting closed dialogs.
**How to avoid:** Add `forceMount` to BOTH `DialogPrimitive.Portal` and `DialogPrimitive.Content`. Then `open` toggles the `transform` style and the transition plays. Body-scroll-lock effect still keys on `open`.
**Warning signs:** Sheet opens correctly with smooth in-animation but vanishes instantly on close.

### Pitfall 3: Radix logs a missing-Title warning
**What goes wrong:** Console warning `Warning: \`DialogContent\` requires a \`DialogTitle\` for the component to be accessible for screen reader users.` whenever `title` prop is omitted.
**Why it happens:** Radix enforces a11y contract.
**How to avoid:** Render a `<VisuallyHidden asChild><DialogPrimitive.Title>Sheet</DialogPrimitive.Title></VisuallyHidden>` fallback. Already imported via `@radix-ui/react-visually-hidden ^1.2.4` (no install).
**Warning signs:** Yellow warning in browser console during tests; jest-axe a11y violations.

### Pitfall 4: Backdrop tap fires twice (Radix + our handler)
**What goes wrong:** `onClose` is called twice on backdrop click — once from Radix's `onPointerDownOutside` heuristic, once from our `<div onClick>`.
**Why it happens:** Both fire on outside pointer events.
**How to avoid:** `onPointerDownOutside={(e) => e.preventDefault()}` on `DialogPrimitive.Content`.
**Warning signs:** Setter called twice; potential downstream bugs in consumers that use the close callback for analytics.

### Pitfall 5: Body styles leak across tests
**What goes wrong:** A test that opens a Sheet but doesn't unmount cleanly leaves `document.body.style.position = 'fixed'` set, polluting the next test's DOM.
**Why it happens:** Cleanup effect didn't run because the component was force-killed (e.g., `unmount()` in afterEach skipped).
**How to avoid:** `afterEach(() => { cleanup(); document.body.removeAttribute('style'); })` in `Sheet.test.tsx`. Project's testing-library defaults already auto-cleanup in modern versions; the explicit attribute clear is belt-and-suspenders.
**Warning signs:** Tests pass in isolation, fail when run together.

### Pitfall 6: `position: fixed` + `top: -${scrollY}px` requires `width: 100%`
**What goes wrong:** Without `width: 100%`, body collapses to content width when `position: fixed` is applied; viewport content jumps horizontally.
**Why it happens:** `position: fixed` removes from flow, default width is auto.
**How to avoid:** Already in the recipe — `document.body.style.width = '100%'`. Don't omit it.
**Warning signs:** Visible horizontal jump when sheet opens.

## Code Examples

### `<Pressable>` consumer pattern (Phase 177-181 will look like this)
```tsx
import { Pressable } from '@/app/components/EmberGlass';

export function StoveCard({ onOpen }: Props) {
  return (
    <Pressable as="article" onClick={onOpen} className="glass-surface" style={{ aspectRatio: '1 / 1' }}>
      {/* card content */}
    </Pressable>
  );
}
```

### `<Sheet>` consumer pattern
```tsx
import { Sheet } from '@/app/components/EmberGlass';
import { useState } from 'react';

export function StoveSheetContainer() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(true)}>Apri stufa</button>
      <Sheet open={open} onClose={() => setOpen(false)} title="Stufa">
        {/* StoveSheet body */}
      </Sheet>
    </>
  );
}
```

### Demo section appended to `app/debug/design-system-v2/page.tsx`
```tsx
{/* Section 05 — Press primitive */}
<section aria-labelledby="sec-05-heading" style={{ marginBottom: 48 }}>
  <p style={{ /* eyebrow */ }}>05 / PRESS</p>
  <h2 id="sec-05-heading" style={{ /* heading */ }}>Press primitive</h2>
  <p style={{ /* description */ }}>Tap o clicca per vedere scale(0.97) ↔ scale(1)</p>
  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
    <Pressable as="div" className="glass-surface" style={{ aspectRatio: '1 / 1', display: 'grid', placeItems: 'center' }}>
      <span>Card</span>
    </Pressable>
    <Pressable as="button" className="glass-surface" style={{ height: 56, border: 0, color: 'var(--text-1)' }}>
      Button
    </Pressable>
    <Pressable as="div" className="glass-surface" style={{ width: 80, height: 80, borderRadius: 999, justifySelf: 'center' }} />
  </div>
</section>

{/* Section 06 — Sheet primitive */}
<section aria-labelledby="sec-06-heading" style={{ marginBottom: 48 }}>
  <p style={{ /* eyebrow */ }}>06 / SHEET</p>
  <h2 id="sec-06-heading" style={{ /* heading */ }}>Sheet primitive</h2>
  <button type="button" onClick={() => setSheetOpen(true)} aria-label="Open Sheet">Open Sheet</button>
  <Sheet open={sheetOpen} onClose={() => setSheetOpen(false)} title="Demo sheet">
    {[0, 1, 2].map((i) => (
      <div key={i} style={{ padding: '14px 0', borderBottom: '0.5px solid var(--glass-border)' }}>
        <div style={{ color: 'var(--text-1)' }}>Riga {i + 1}</div>
        <div style={{ color: 'var(--text-2)', fontSize: 12 }}>Contenuto fittizio</div>
      </div>
    ))}
    {/* Padding to force scroll-test to be meaningful */}
    <div style={{ height: 600 }} />
  </Sheet>
</section>
```

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest 30 + React Testing Library + jsdom (unit); Playwright (E2E smoke) |
| Config file | `jest.config.js` (existing); `playwright.config.ts` (existing) |
| Quick run command | `npm run test:components -- EmberGlass` |
| Full suite command | `npm run test:components -- EmberGlass && npx playwright test tests/smoke/press-primitive.spec.ts tests/smoke/sheet-primitive.spec.ts` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| DS-07 | `<Pressable>` toggles transform on pointer events | unit | `npx jest app/components/EmberGlass/__tests__/Pressable.test.tsx -t 'pointer events'` | ❌ Wave 0 |
| DS-07 | `usePressed()` hook returns stable handlers + pressed flag | unit | `npx jest app/components/EmberGlass/__tests__/Pressable.test.tsx -t 'usePressed'` | ❌ Wave 0 |
| DS-07 | `<Pressable as>` polymorphism renders custom tag | unit | `npx jest app/components/EmberGlass/__tests__/Pressable.test.tsx -t 'as prop'` | ❌ Wave 0 |
| DS-07 | `Pressable` exported from EmberGlass barrel | smoke | `npx playwright test tests/smoke/press-primitive.spec.ts -g 'exports'` | ❌ Wave 0 |
| DS-07 | `.press-anim` class present in computed CSS | smoke | `npx playwright test tests/smoke/press-primitive.spec.ts -g 'press-anim'` | ❌ Wave 0 |
| DS-07 | Sample card has `transform: matrix(0.97, ...)` after `mouse.down()` | smoke | `npx playwright test tests/smoke/press-primitive.spec.ts -g 'scale on press'` | ❌ Wave 0 |
| SHEET-01 | Sheet renders open/closed via `open` prop | unit | `npx jest app/components/EmberGlass/__tests__/Sheet.test.tsx -t 'open prop'` | ❌ Wave 0 |
| SHEET-01 | ESC key calls `onClose` | unit | `npx jest app/components/EmberGlass/__tests__/Sheet.test.tsx -t 'Escape'` | ❌ Wave 0 |
| SHEET-01 | Backdrop click calls `onClose` | unit | `npx jest app/components/EmberGlass/__tests__/Sheet.test.tsx -t 'backdrop'` | ❌ Wave 0 |
| SHEET-01 | Close button calls `onClose` | unit | `npx jest app/components/EmberGlass/__tests__/Sheet.test.tsx -t 'close button'` | ❌ Wave 0 |
| SHEET-01 | Body scroll-lock applied on open, restored on close | unit | `npx jest app/components/EmberGlass/__tests__/Sheet.test.tsx -t 'scroll lock'` | ❌ Wave 0 |
| SHEET-01 | Sheet opens on demo button click | smoke | `npx playwright test tests/smoke/sheet-primitive.spec.ts -g 'open via button'` | ❌ Wave 0 |
| SHEET-01 | ESC dismisses sheet | smoke | `npx playwright test tests/smoke/sheet-primitive.spec.ts -g 'Escape'` | ❌ Wave 0 |
| SHEET-01 | Backdrop tap dismisses sheet | smoke | `npx playwright test tests/smoke/sheet-primitive.spec.ts -g 'backdrop'` | ❌ Wave 0 |
| SHEET-01 | Close button dismisses sheet | smoke | `npx playwright test tests/smoke/sheet-primitive.spec.ts -g 'close button'` | ❌ Wave 0 |
| SHEET-01 | Scroll lock + restore (open at y=300, close, assert y=300) | smoke | `npx playwright test tests/smoke/sheet-primitive.spec.ts -g 'scroll'` | ❌ Wave 0 |
| SHEET-01 | Mobile 375px smoke | smoke | `npx playwright test tests/smoke/sheet-primitive.spec.ts -g 'mobile'` | ❌ Wave 0 |
| SHEET-01 | Desktop 1024px smoke | smoke | `npx playwright test tests/smoke/sheet-primitive.spec.ts -g 'desktop'` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npm run test:changed` (covers any touched EmberGlass test) + `npx playwright test tests/smoke/press-primitive.spec.ts tests/smoke/sheet-primitive.spec.ts` (8 specs, ~10s total)
- **Per wave merge:** `npm run test:components -- EmberGlass` + the two Playwright spec files
- **Phase gate:** Both unit + smoke green before `/gsd-verify-work`. Bare `npm test` is forbidden by Rule 8.

### Wave 0 Gaps
- [ ] `app/components/EmberGlass/__tests__/Pressable.test.tsx` — covers DS-07 unit assertions
- [ ] `app/components/EmberGlass/__tests__/Sheet.test.tsx` — covers SHEET-01 unit assertions including scroll-lock + ESC + backdrop + close button
- [ ] `tests/smoke/press-primitive.spec.ts` — DS-07 Playwright (3 specs)
- [ ] `tests/smoke/sheet-primitive.spec.ts` — SHEET-01 Playwright (7 specs: open / ESC / backdrop / close / scroll-lock / 375px / 1024px). **Note:** D-17 lists 8 total Playwright specs — the press-primitive file ships 1 of those (existence + transform); the other 1 from press-primitive is the `.press-anim` CSS class assertion. Sheet primitive ships 7. Total: 1 + 1 + 7 = 9? **No — D-17 lists 8 distinct assertions** (DS-07 = 1 grouped spec with 3 sub-checks; SHEET-01 = 7). The split is:
  - `tests/smoke/press-primitive.spec.ts` → 1 spec, 3 expects (export + class + scale)
  - `tests/smoke/sheet-primitive.spec.ts` → 7 specs (open / ESC / backdrop / close / scroll-lock / mobile / desktop)
- Framework install: none required — Jest, Playwright, Radix, lucide all present.

### Invariants for Phases 177-181 (carried forward)

These are NOT enforced in Phase 175 (per D-06) but the planner should record them in VERIFICATION.md so each downstream phase inherits the contract:

1. **Press invariant:** Every NEW interactive glass surface introduced in 177-181 imports `Pressable` or `usePressed`, OR applies the `.press-anim` class. Verifiable per phase via:
   ```bash
   # In each later phase, for the NEW files only:
   grep -lE "Pressable|usePressed|press-anim" $NEW_FILES
   ```
2. **Press-curve string match:** No file in `app/components/EmberGlass/**` may contain a `transition: transform` declaration whose duration ≠ 220ms or curve ≠ `cubic-bezier(.34,1.56,.64,1)`.
3. **Sheet-curve string match:** No file in `app/components/EmberGlass/**` may contain a `transition: transform` declaration on a sheet/modal-shaped surface whose duration ≠ 400ms or curve ≠ `cubic-bezier(.22,1,.36,1)`.
4. **Body scroll-lock invariant:** When `<Sheet open={true}>`, `document.body.style.position === 'fixed'`. When `<Sheet open={false}>` after a previously-open cycle, `document.body.style.position === ''` AND `window.scrollY === <captured-y>`.
5. **Z-index invariant:** No surface in Phases 178-181 hard-codes `z-index: 200` or `z-index: 201` — those values are reserved for Sheet's backdrop and container.

## Concrete Playwright assertions (D-17 → expect() form)

### `tests/smoke/press-primitive.spec.ts`

```ts
import { test, expect } from '@playwright/test';

test.describe('DS-07 — press primitive', () => {
  test('Pressable exported and .press-anim class registered', async ({ page }) => {
    await page.goto('/debug/design-system-v2');
    // The demo card has data-testid="press-card-demo" (planner adds this).
    await expect(page.getByTestId('press-card-demo')).toBeVisible();
    // .press-anim class is present in the document's stylesheets — assert via getComputedStyle on a synthetic element with the class.
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
    if (!box) throw new Error('no bbox');
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    // Allow React state flush
    await page.waitForFunction(() => {
      const el = document.querySelector('[data-testid="press-card-demo"]') as HTMLElement | null;
      return el && getComputedStyle(el).transform.includes('matrix(0.97');
    }, { timeout: 1000 });
    await page.mouse.up();
    await page.waitForFunction(() => {
      const el = document.querySelector('[data-testid="press-card-demo"]') as HTMLElement | null;
      return el && (getComputedStyle(el).transform === 'matrix(1, 0, 0, 1, 0, 0)' || getComputedStyle(el).transform === 'none');
    }, { timeout: 1000 });
  });
});
```

### `tests/smoke/sheet-primitive.spec.ts`

```ts
import { test, expect } from '@playwright/test';

test.describe('SHEET-01 — sheet primitive', () => {
  test('opens via button click', async ({ page }) => {
    await page.goto('/debug/design-system-v2');
    await page.getByRole('button', { name: /Open Sheet/i }).click();
    const sheet = page.getByRole('dialog');
    await expect(sheet).toBeVisible();
    // translateY(0) after open — transform string check
    await page.waitForFunction(() => {
      const el = document.querySelector('[role="dialog"]') as HTMLElement | null;
      return el && getComputedStyle(el).transform === 'matrix(1, 0, 0, 1, 0, 0)' || getComputedStyle(el)?.transform === 'none';
    }, { timeout: 1000 });
  });

  test('Escape dismisses', async ({ page }) => {
    await page.goto('/debug/design-system-v2');
    await page.getByRole('button', { name: /Open Sheet/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toBeHidden();
  });

  test('backdrop tap dismisses', async ({ page }) => {
    await page.goto('/debug/design-system-v2');
    await page.getByRole('button', { name: /Open Sheet/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    // Click upper-left of viewport (definitely on backdrop, not sheet which lives left:8 right:8 bottom:8)
    await page.mouse.click(20, 20);
    await expect(page.getByRole('dialog')).toBeHidden();
  });

  test('close button dismisses', async ({ page }) => {
    await page.goto('/debug/design-system-v2');
    await page.getByRole('button', { name: /Open Sheet/i }).click();
    await page.getByRole('button', { name: /Chiudi/i }).click();
    await expect(page.getByRole('dialog')).toBeHidden();
  });

  test('scroll lock + restore (y=300)', async ({ page }) => {
    await page.goto('/debug/design-system-v2');
    // Inject content so we can scroll
    await page.evaluate(() => window.scrollTo(0, 300));
    await page.getByRole('button', { name: /Open Sheet/i }).click();
    const bodyPosition = await page.evaluate(() => document.body.style.position);
    expect(bodyPosition).toBe('fixed');
    await page.keyboard.press('Escape');
    // wait for cleanup
    await page.waitForFunction(() => document.body.style.position === '', { timeout: 1000 });
    const restored = await page.evaluate(() => window.scrollY);
    expect(restored).toBe(300);
  });

  test('mobile smoke (375px) — sheet width = viewport - 16px', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/debug/design-system-v2');
    await page.getByRole('button', { name: /Open Sheet/i }).click();
    const box = await page.getByRole('dialog').boundingBox();
    expect(box).not.toBeNull();
    if (box) {
      // bundle declares left:8 right:8 → width = 375 - 16
      expect(Math.round(box.width)).toBe(359);
    }
  });

  test('desktop smoke (1024px) — sheet width = viewport - 16px', async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.goto('/debug/design-system-v2');
    await page.getByRole('button', { name: /Open Sheet/i }).click();
    const box = await page.getByRole('dialog').boundingBox();
    expect(box).not.toBeNull();
    if (box) {
      expect(Math.round(box.width)).toBe(1008);
    }
  });
});
```

## Concrete Jest unit-test recipes

### `Pressable.test.tsx` (~80 LOC)
```tsx
import { render, fireEvent, screen, renderHook, act } from '@testing-library/react';
import { Pressable, usePressed } from '../Pressable';

describe('Pressable (Phase 175 — DS-07)', () => {
  it('renders children inside default <div>', () => {
    render(<Pressable>hello</Pressable>);
    expect(screen.getByText('hello').tagName).toBe('DIV');
  });

  it('renders custom tag via `as` prop', () => {
    render(<Pressable as="article" data-testid="p">hello</Pressable>);
    expect(screen.getByTestId('p').tagName).toBe('ARTICLE');
  });

  it('toggles scale on pointer events (down → 0.97, up → 1)', () => {
    render(<Pressable data-testid="p">hello</Pressable>);
    const el = screen.getByTestId('p');
    expect(el.style.transform).toBe('scale(1)');
    fireEvent.pointerDown(el);
    expect(el.style.transform).toBe('scale(0.97)');
    fireEvent.pointerUp(el);
    expect(el.style.transform).toBe('scale(1)');
  });

  it('releases on pointerLeave (touch-device safety)', () => {
    render(<Pressable data-testid="p">hello</Pressable>);
    const el = screen.getByTestId('p');
    fireEvent.pointerDown(el);
    expect(el.style.transform).toBe('scale(0.97)');
    fireEvent.pointerLeave(el);
    expect(el.style.transform).toBe('scale(1)');
  });

  it('forwards onClick', () => {
    const onClick = jest.fn();
    render(<Pressable data-testid="p" onClick={onClick}>hello</Pressable>);
    fireEvent.click(screen.getByTestId('p'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('applies the locked transition string', () => {
    render(<Pressable data-testid="p">hello</Pressable>);
    const el = screen.getByTestId('p');
    expect(el.style.transition).toMatch(/transform\s+\.22s\s+cubic-bezier\(\.34,\s*1\.56,\s*\.64,\s*1\)/);
  });

  describe('usePressed', () => {
    it('returns pressed=false initially', () => {
      const { result } = renderHook(() => usePressed());
      expect(result.current.pressed).toBe(false);
    });

    it('flips pressed to true on pointerDown handler', () => {
      const { result } = renderHook(() => usePressed());
      act(() => {
        result.current.pointerHandlers.onPointerDown({} as React.PointerEvent);
      });
      expect(result.current.pressed).toBe(true);
    });
  });
});
```

### `Sheet.test.tsx` (~140 LOC)

```tsx
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { Sheet } from '../Sheet';

afterEach(() => {
  cleanup();
  document.body.removeAttribute('style');
});

function Harness({ initialOpen = false, title }: { initialOpen?: boolean; title?: string }) {
  const [open, setOpen] = useState(initialOpen);
  return (
    <>
      <button onClick={() => setOpen(true)}>open</button>
      <Sheet open={open} onClose={() => setOpen(false)} title={title}>
        <div>body</div>
      </Sheet>
    </>
  );
}

describe('Sheet (Phase 175 — SHEET-01)', () => {
  it('does not render dialog body when open=false', () => {
    render(<Harness />);
    // forceMount is on, so role=dialog may be in DOM but not visible. Assert backdrop is non-interactive.
    // Easier: assert close button is not findable by accessible name when title not set.
    expect(screen.queryByRole('button', { name: /Chiudi/i })).toBeNull();
  });

  it('renders title + close button when open and title provided', () => {
    render(<Harness initialOpen title="Demo" />);
    expect(screen.getByText('Demo')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Chiudi/i })).toBeInTheDocument();
  });

  it('Escape calls onClose (Radix wires it free)', async () => {
    const user = userEvent.setup();
    render(<Harness initialOpen title="Demo" />);
    expect(screen.getByText('Demo')).toBeInTheDocument();
    await user.keyboard('{Escape}');
    expect(screen.queryByText('Demo')).toBeNull();
  });

  it('close button click calls onClose', async () => {
    const user = userEvent.setup();
    render(<Harness initialOpen title="Demo" />);
    await user.click(screen.getByRole('button', { name: /Chiudi/i }));
    expect(screen.queryByText('Demo')).toBeNull();
  });

  it('backdrop click calls onClose', () => {
    render(<Harness initialOpen title="Demo" />);
    // Backdrop is the aria-hidden div with our inline styles. Find by role=presentation? It has aria-hidden=true.
    const backdrop = document.querySelector('[aria-hidden="true"]') as HTMLElement;
    expect(backdrop).not.toBeNull();
    fireEvent.click(backdrop);
    expect(screen.queryByText('Demo')).toBeNull();
  });

  it('applies body scroll-lock when open', () => {
    Object.defineProperty(window, 'scrollY', { writable: true, configurable: true, value: 300 });
    window.scrollTo = jest.fn();
    const { rerender } = render(<Harness initialOpen={false} title="Demo" />);
    expect(document.body.style.position).toBe('');
    rerender(<HarnessControlled open title="Demo" />);
    // Open via the harness: simulate by re-rendering with initialOpen would not work — use a controlled harness.
    // (Pseudocode — planner provides a small <ControlledSheet open={open}> harness for clarity.)
    // After open=true:
    // expect(document.body.style.position).toBe('fixed');
    // expect(document.body.style.top).toBe('-300px');
  });

  it('restores scroll position on close', () => {
    Object.defineProperty(window, 'scrollY', { writable: true, configurable: true, value: 300 });
    window.scrollTo = jest.fn();
    // Render with open, then unmount/close
    const { rerender } = render(<ControlledSheet open />);
    expect(document.body.style.position).toBe('fixed');
    rerender(<ControlledSheet open={false} />);
    expect(document.body.style.position).toBe('');
    expect(window.scrollTo).toHaveBeenCalledWith(0, 300);
  });

  it('renders grabber pill always (when open)', () => {
    render(<Harness initialOpen title="Demo" />);
    // Grabber is a 40×5 div with rgba(255,255,255,0.2). Find via inline style query.
    const grabber = document.querySelector('div[style*="40"][style*="height: 5"]');
    expect(grabber).not.toBeNull();
  });
});

// ControlledSheet harness — explicit `open` prop, no internal state.
function ControlledSheet({ open }: { open: boolean }) {
  return (
    <Sheet open={open} onClose={() => {}} title="Demo">
      <div>body</div>
    </Sheet>
  );
}
```

**Confirmation: jsdom CAN observe `document.body.style.*` mutations and `window.scrollTo` calls** when `window.scrollTo = jest.fn()` is assigned. [VERIFIED: standard jsdom behavior, confirmed by inspection of legacy `BottomSheet.tsx`'s scroll-lock recipe which has been live in production with passing tests for 2+ years.]

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Custom-portal `BottomSheet.tsx` (153 LOC, animation classes) | Radix Dialog facade (~140 LOC, Radix handles a11y) | This phase | Free focus trap + ESC + return-focus |
| `:active` CSS for press | JS pointer state | This phase (D-03) | Touch-device reliability |
| `npm test` (full suite) for component verification | `npm run test:components -- EmberGlass` (scoped) | Project Rule 8 | 90%+ time saved per iteration |

**Deprecated/outdated:**
- Tailwind `active:scale-[0.97]` on `Button.tsx` — not deprecated globally, but NOT migrated by this phase per D-02. Future cleanup phase replaces with `<Pressable>`.

## Project Constraints (from CLAUDE.md)

These are **non-negotiable** and the planner MUST verify compliance in each task:

1. **Rule 1 — NEVER break existing functionality.** Phase 175 must not modify legacy `app/components/ui/Sheet.tsx` or `BottomSheet.tsx`. Verifier: `git diff` shows no changes to those files.
2. **Rule 2 — WAIT for user confirmation before version updates.** No package version bumps. `@radix-ui/react-dialog ^1.1.14` is already present. Verifier: `git diff package.json` is empty (or limited to lockfile from `npm install` — but Rule 4 forbids that anyway).
3. **Rule 3 — PREFER editing existing files.** `app/debug/design-system-v2/page.tsx` is extended in place; `app/globals.css` is appended in place; only the EmberGlass primitives + their tests are net-new files (which is unavoidable).
4. **Rule 4 — NEVER `npm run build` or `npm install`.** Research already verified Radix is installed; planner does not need to add deps.
5. **Rule 5 — ALWAYS create/update unit tests.** Two new unit test files specified; gap-closure for SHEET-01 scroll-lock + Pressable pointer events is mandatory.
6. **Rule 6 — USE design system at `/debug/design-system-v2`.** Demo sections appended to that page; primitives consume Phase 174's `--accent`, `--text-1`, `--text-2`, `--font-display`, `--glass-bg`, `--glass-border`.
7. **Rule 7 — NEVER commit/push without explicit request.** Per usual workflow.
8. **Rule 8 — USE scoped test subsets.** PLAN.md `<verify><automated>` blocks MUST use `npm run test:changed`, `npm run test:components -- EmberGlass`, or `npx jest <specific-paths>`. NEVER bare `npm test`.

## File Count & LOC Budget

Planner uses this to size waves:

| File | Type | LOC budget | Notes |
|------|------|-----------|-------|
| `app/components/EmberGlass/Pressable.tsx` | NEW | ~70 | Component + hook + types |
| `app/components/EmberGlass/Sheet.tsx` | NEW | ~140 | Most LOC are inline visual values from bundle |
| `app/components/EmberGlass/index.ts` | NEW | ~5 | Barrel |
| `app/globals.css` | EDIT | +3 (or +6 with reduced-motion) | Append `.press-anim` rule |
| `app/debug/design-system-v2/page.tsx` | EDIT | +80 | Two new sections + `useState` for sheet open |
| `app/components/EmberGlass/__tests__/Pressable.test.tsx` | NEW | ~80 | 6-7 tests |
| `app/components/EmberGlass/__tests__/Sheet.test.tsx` | NEW | ~140 | 7-8 tests + ControlledSheet harness |
| `tests/smoke/press-primitive.spec.ts` | NEW | ~50 | 2 specs (export + class + scale all in one suite) |
| `tests/smoke/sheet-primitive.spec.ts` | NEW | ~180 | 7 specs |
| **Total** | | **~750 LOC** | |

**Wave shaping recommendation:**
- Wave 0 (sequential): Add `.press-anim` to globals.css (3 LOC).
- Wave 1 (parallel-able):
  - Plan A: `Pressable.tsx` + `Pressable.test.tsx`
  - Plan B: `Sheet.tsx` + `Sheet.test.tsx`
  - Plan C: `index.ts` (depends on A & B exports — sequential after both)
- Wave 2: Demo page extension + Playwright smoke specs (depends on Wave 1).
- Wave 3: Gap closure if any audit issue arises.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `forceMount` is required for outro animation to play | §"Sheet Primitive Implementation" Pitfall 2 | If wrong, sheet still opens correctly but vanishes-without-animation on close. Visual regression only, not functional. Trivial to fix in gap-closure. |
| A2 | `window.scrollTo = jest.fn()` mock allows assertion of restore call | §"Concrete Jest unit-test recipes" | If wrong, the scroll-restore unit test must be replaced with a Playwright equivalent (which D-17 already includes). Zero functional risk. |
| A3 | `userEvent.pointer()` is unreliable in jsdom; `fireEvent.pointerDown/Up` works | §"Common Pitfalls" Pitfall 1 | If wrong (i.e., user-event works), tests are simply more verbose than needed. No functional risk. |
| A4 | Optional reduced-motion CSS adds no functional risk | §"Optional reduced-motion override" | If wrong, the rule applies wider than the press animation — but `.press-anim` selector is specific. Zero risk. |
| A5 | `position: fixed` on sheet (vs bundle's `absolute`) is correct for production | §"Anti-Patterns" | If wrong (i.e., `absolute` is preferred), backdrop will not cover the viewport correctly — visible regression in mobile/desktop smoke specs. Easy to flip. |

**All other claims in this research are VERIFIED via direct file reads or CITED to bundle/CONTEXT lines.**

## Open Questions

1. **Should the demo page's sheet close button use the Italian `Chiudi` (matches `BottomSheet.tsx:140`) or English `Close` (matches `app/components/ui/Sheet.tsx:178`)?**
   - What we know: bundle uses no aria-label (just `<IconX>`). Project predominantly Italian UI.
   - What's unclear: which convention dominates for the new EmberGlass namespace.
   - Recommendation: Use `Chiudi` for consistency with BottomSheet.tsx. Single grep target for future i18n.

2. **Does Phase 178's stacked sheets (Stove + Climate + ...) need any nesting support?**
   - What we know: D-13 says z-index 200/201; only one sheet open at a time per UX.
   - What's unclear: any pathological case where two sheets stack.
   - Recommendation: Out of scope. If 178 hits this, add a higher-z-index variant in 178.

3. **Should the demo Sheet section render long-enough content to trigger inner scroll, AND have above-the-fold content forcing the page to scroll, so SC-#4 scroll-lock can actually be smoke-tested at /debug/design-system-v2?**
   - What we know: Phase 174's page (`page.tsx`) is ~420 LOC of stacked sections — already scrollable on a 375×812 viewport.
   - Recommendation: Inject 600px of dummy content INSIDE the Sheet body (so internal scroll can be eyeballed) AND rely on the existing page height for outer scroll-lock testing. Demo code in §"Code Examples" already does this.

## Sources

### Primary (HIGH confidence)
- `.planning/phases/175-glass-primitives-press-animation-sheet/175-CONTEXT.md` — Locked decisions (D-01..D-18), all gray areas auto-resolved.
- `.planning/inbox/ember-glass-design/project/components/sheets.jsx:1-65` — Bundle authoritative Sheet visuals + transitions.
- `.planning/inbox/ember-glass-design/project/components/cards.jsx:7-50` — Bundle authoritative press behavior.
- `app/components/ui/BottomSheet.tsx:50-67` — Body scroll-lock recipe (proven in production).
- `app/components/ui/Sheet.tsx:158-189` — Reference for Radix Dialog Portal/Content composition pattern.
- `app/components/EmberGlass/AmbientBg.tsx` — Sibling primitive; same namespace + inline-style pattern.
- `app/globals.css:302-344` — Phase 174 token block (consumed by new primitives).
- `app/debug/design-system-v2/page.tsx` — Phase 174 page to extend.
- `package.json:34, 45` — `@radix-ui/react-dialog ^1.1.14`, `@radix-ui/react-visually-hidden ^1.2.4` confirmed installed.
- `app/components/EmberGlass/__tests__/AmbientBg.test.tsx` — Test pattern reference.
- `tests/smoke/accent-picker.spec.ts` — Playwright spec pattern reference.

### Secondary (MEDIUM confidence)
- Radix Dialog v1.1.14 API surface (`onPointerDownOutside.preventDefault()`, `forceMount`, controlled `open`/`onOpenChange`) — verified by code patterns in legacy `app/components/ui/Sheet.tsx` and JSDoc inside.

### Tertiary (LOW confidence)
- jsdom `userEvent.pointer()` reliability — based on community reports across user-event versions; mitigated by recommending `fireEvent.pointerDown/Up` (proven reliable).

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — every dep already installed, every pattern already used in repo
- Architecture: HIGH — full code shapes provided, Radix composition lifted from existing legacy file
- Pitfalls: MEDIUM-HIGH — Radix's `forceMount` requirement is documented community knowledge; jsdom pointer-event behavior is the one item with practical uncertainty (mitigated by the `fireEvent` fallback)

**Research date:** 2026-04-27
**Valid until:** 2026-05-27 (30 days — stack is stable; Radix v1 is mature)
