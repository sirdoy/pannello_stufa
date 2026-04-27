# Phase 175: Glass Primitives — Press Animation & Sheet — Pattern Map

**Mapped:** 2026-04-27
**Files analyzed:** 9 (5 new + 2 modified production + 2 new test pairs)
**Analogs found:** 9 / 9

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `app/components/EmberGlass/Pressable.tsx` (new) | component + hook (primitive) | event-driven (pointer) | `app/components/EmberGlass/AmbientBg.tsx` (sibling primitive) + `app/components/ui/Sheet.tsx:136-147` (forwardRef shape) | exact (sibling namespace) + role-match (forwardRef) |
| `app/components/EmberGlass/Sheet.tsx` (new) | component (Radix Dialog facade) | event-driven (open/close) | `app/components/ui/Sheet.tsx` (Radix Dialog) + `app/components/ui/BottomSheet.tsx:50-67` (scroll-lock) | exact for Radix wiring; lifted-recipe for scroll-lock |
| `app/components/EmberGlass/index.ts` (new) | barrel export | n/a | `app/components/ui/index.ts:1-90` | exact |
| `app/components/EmberGlass/__tests__/Pressable.test.tsx` (new) | unit test (jest+RTL) | event-driven | `app/components/ui/__tests__/BottomSheet.test.tsx` | role-match (component test) |
| `app/components/EmberGlass/__tests__/Sheet.test.tsx` (new) | unit test (jest+RTL) | event-driven | `app/components/ui/__tests__/BottomSheet.test.tsx` + `app/components/ui/__tests__/Modal.test.tsx:185-220` | exact (dialog dismissal) |
| `tests/smoke/press-primitive.spec.ts` (new) | playwright smoke | request-response | `tests/smoke/accent-picker.spec.ts` | exact (DS-N spec on /debug/design-system-v2) |
| `tests/smoke/sheet-primitive.spec.ts` (new) | playwright smoke | event-driven | `tests/smoke/ambient-persist.spec.ts` + `tests/smoke/page-loads.spec.ts:1-20` (consoleErrors helper) | exact (multi-spec describe block) + role-match |
| `app/globals.css` (edit, append) | config (CSS) | n/a | `app/globals.css:327-363` (Phase 174 glass-surface + reduced-motion block) | exact |
| `app/debug/design-system-v2/page.tsx` (edit, append 2 sections) | page (client component) | event-driven | `app/debug/design-system-v2/page.tsx:155-287` (existing Sections 01-02 stack pattern) | exact (own file, append-shape) |

---

## Pattern Assignments

### `app/components/EmberGlass/Pressable.tsx` (new — component + hook)

**Primary analog:** `app/components/EmberGlass/AmbientBg.tsx` (sibling Phase 174 primitive — same namespace, same `'use client'` boundary, same inline-style approach). **Secondary analog:** `app/components/ui/Sheet.tsx:136-147` for `forwardRef` + `displayName` shape.

**Top-of-file `'use client'` + JSDoc** (copy from `AmbientBg.tsx:1-22`):
```tsx
'use client';

import { useEffect, useState } from 'react';

/**
 * AmbientBg — Phase 174 (DS-05)
 *
 * Renders three radial-gradient blob divs at z-index 0 behind the app shell ...
 *
 * Blob geometry + colors lifted from the design bundle:
 *   .planning/inbox/ember-glass-design/project/components/app.jsx:175-200
 *
 * AUDIT-EXCEPTION (DS-02): blob B mix-target #301010 and blob C static rgba color
 * are intentional non-token literals per UI-SPEC §"Claude's Discretion".
 */
```

Apply the same shape to `Pressable.tsx`: `'use client'`, then a multi-line JSDoc citing Phase 175 + bundle file + bundle line numbers (`.planning/inbox/ember-glass-design/project/components/cards.jsx:11-14`). Document the `data-pressable-focusable` attribute contract per UI-SPEC line 508.

**Inline style + token consumption pattern** (copy from `AmbientBg.tsx:43-62`):
```tsx
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
        filter: 'blur(60px)', // AUDIT-EXCEPTION (DS-02)
        ...
        background:
          'radial-gradient(circle, color-mix(in oklab, var(--accent) 60%, transparent) 0%, transparent 70%)',
```
This is the inline-`style={{}}` approach (NOT Tailwind). `Pressable.tsx` follows this verbatim — `transform`/`transition` go in inline style; `data-pressable-focusable` goes as a literal attribute on the host.

**`forwardRef` + `displayName` pattern** (copy from `app/components/ui/Sheet.tsx:136-147`):
```tsx
const SheetOverlay = forwardRef<React.ElementRef<typeof DialogPrimitive.Overlay>, SheetOverlayProps>(
  function SheetOverlay({ className, ...props }, ref) {
    return (
      <DialogPrimitive.Overlay
        ref={ref}
        className={cn(overlayVariants(), className)}
        {...props}
      />
    );
  }
);
SheetOverlay.displayName = 'SheetOverlay';
```
Adapt for polymorphic `Pressable`: use `forwardRef<Element, PressableProps<E>>` with a generic `as` extending `ElementType`. Set `displayName = 'Pressable'` after the `forwardRef` call (Phase 175 UI-SPEC line 567 budgets ~70 LOC for the file).

**`useState` + pointer-handler pattern** (synthesize from bundle `cards.jsx:11-14` per CONTEXT D-03):
```tsx
const [pressed, setPressed] = useState(false);
const onPointerDown = useCallback(() => setPressed(true), []);
const onPointerUp = useCallback(() => setPressed(false), []);
const onPointerLeave = useCallback(() => setPressed(false), []);
const onPointerCancel = useCallback(() => setPressed(false), []);
// Stable identity → no re-render churn for downstream React Compiler memoization.
```

**`usePressed()` hook export** (per UI-SPEC line 160-163, locked co-located in same file):
```tsx
export function usePressed(): { pressed: boolean; pointerHandlers: PointerHandlers } {
  const [pressed, setPressed] = useState(false);
  const pointerHandlers = useMemo<PointerHandlers>(() => ({
    onPointerDown: () => setPressed(true),
    onPointerUp:   () => setPressed(false),
    onPointerLeave:() => setPressed(false),
    onPointerCancel:() => setPressed(false),
  }), []);
  return { pressed, pointerHandlers };
}
```
`Pressable` is implemented on top of `usePressed()` (D-04). Both are exported from the same module so `import { Pressable, usePressed }` works.

**Polymorphic-component + `data-pressable-focusable` attribute** (per UI-SPEC §Accessibility lines 508-516):
```tsx
const FOCUSABLE_HOSTS = new Set(['button', 'a', 'input', 'select', 'textarea']);
const isFocusable = typeof asTag === 'string' && FOCUSABLE_HOSTS.has(asTag)
                   || (typeof rest.tabIndex === 'number' && rest.tabIndex >= 0);
const Tag = (asTag || 'div') as ElementType;
return (
  <Tag
    ref={ref}
    {...rest}
    {...(isFocusable ? { 'data-pressable-focusable': 'true' } : {})}
    onPointerDown={onPointerDown}
    onPointerUp={onPointerUp}
    onPointerLeave={onPointerLeave}
    onPointerCancel={onPointerCancel}
    style={{
      transform: pressed ? 'scale(0.97)' : 'scale(1)',
      transition: 'transform .22s cubic-bezier(.34,1.56,.64,1)',
      ...rest.style, // caller's style spread AFTER → caller cannot override transform/transition
    }}
  />
);
```
The CSS rule `[data-pressable-focusable="true"]:focus-visible { outline: 2px solid var(--accent); ... }` lives in `globals.css` (D-pattern below).

---

### `app/components/EmberGlass/Sheet.tsx` (new — Radix Dialog facade)

**Primary analog:** `app/components/ui/Sheet.tsx` (Radix-based, 334 LOC — DialogPrimitive wiring exemplar). **Secondary analog:** `app/components/ui/BottomSheet.tsx:50-67` (scroll-lock recipe — verbatim lift).

**`'use client'` + Radix import block** (copy from `app/components/ui/Sheet.tsx:1-9`):
```tsx
'use client';

import type React from 'react';
import { forwardRef } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import type { VariantProps } from 'class-variance-authority';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils/cn';
import { X } from 'lucide-react';
```
Adapt for Phase 175: drop CVA + `cn` (inline-style only — UI-SPEC line 30); add `import { VisuallyHidden } from '@radix-ui/react-visually-hidden'` for the title fallback (UI-SPEC line 287-289). Keep `* as DialogPrimitive`, `forwardRef`, `X` from lucide-react.

**Top-of-file z-index documentation comment** (per CONTEXT D-13, UI-SPEC lines 63-66):
```tsx
/**
 * Sheet — Phase 175 (SHEET-01) — Ember Glass primitive
 *
 * Z-INDEX RESERVATION (Phase 175 contract; downstream phases 178-181 must respect):
 *   200 → Sheet backdrop
 *   201 → Sheet container
 * Bottom-tab bar (Phase 181 NAV-01..04), dashboard cards (Phase 177), and any other
 * stacked content MUST stay below 200 so this Sheet hides them cleanly when open.
 *
 * Visuals lifted verbatim from `.planning/inbox/ember-glass-design/project/components/sheets.jsx:13-65`.
 * AUDIT-EXCEPTION literals are tagged inline with bundle source line refs.
 */
```

**DialogPrimitive composition shape** (copy structure from `app/components/ui/Sheet.tsx:158-187`):
```tsx
const SheetContent = forwardRef<...>( function SheetContent({ ... }, ref) {
  return (
    <DialogPrimitive.Portal>
      <SheetOverlay />
      <DialogPrimitive.Content ref={ref} {...props}>
        {showCloseButton && (
          <DialogPrimitive.Close ... aria-label="Close">
            <X className="h-5 w-5" />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        )}
        {children}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
});
```
Adapt for Phase 175 facade (UI-SPEC lines 252-294): wrap with `<DialogPrimitive.Root open onOpenChange>`, add `forceMount` on Portal + Content, custom backdrop `<div onClick={onClose}>` instead of `<DialogPrimitive.Overlay>`, add `onPointerDownOutside={(e) => e.preventDefault()}` (D-10), use a plain `<button onClick={onClose}>` for close (NOT `<DialogPrimitive.Close>` — keeps the component prop-driven, matches bundle).

**Body scroll-lock recipe** (lift verbatim from `app/components/ui/BottomSheet.tsx:50-67`):
```tsx
// Scroll lock quando aperto
useEffect(() => {
  if (isOpen) {
    const scrollY = window.scrollY;
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = '100%';
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.style.overflow = '';
      window.scrollTo(0, scrollY);
    };
  }
}, [isOpen]);
```
**Key adaptation per UI-SPEC line 315-330:** lift the `scrollY` snapshot into a `useRef` (not closure-captured) so React 18 Strict Mode double-mount cleanup uses the same value:
```tsx
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
**Do NOT import from `BottomSheet.tsx` — duplicate the ~10 lines** (CONTEXT line 164 — keeps legacy file a clean delete target later).

**`<X>` icon from lucide-react** (copy from `app/components/ui/BottomSheet.tsx:5,140`):
```tsx
import { X } from 'lucide-react';
// ...later...
<ActionButton icon={<X />} ariaLabel="Chiudi" />
```
For Phase 175 (no ActionButton dependency, bundle-verbatim 32×32 button), inline:
```tsx
<button
  type="button"
  data-sheet-close="true"
  aria-label="Chiudi"
  onClick={onClose}
  style={{
    width: 32, height: 32, borderRadius: 999,
    background: 'rgba(255,255,255,0.1)', // AUDIT-EXCEPTION (DS-02): bundle sheets.jsx:53
    border: 'none', color: '#fff', cursor: 'pointer',
    display: 'grid', placeItems: 'center',
  }}
>
  <X size={16} strokeWidth={2.2} />
</button>
```
The `data-sheet-close="true"` attribute pairs with the global focus-visible CSS rule (mirrors the `data-pressable-focusable` mechanism per UI-SPEC line 630).

---

### `app/components/EmberGlass/index.ts` (new — barrel export)

**Analog:** `app/components/ui/index.ts:1-90`.

**Pattern (copy structure from analog lines 1-10, simplified):**
```ts
// app/components/ui/index.ts
export { default as Card, CardHeader, CardTitle, CardContent, ... } from './Card';
export { default as Button } from './Button';
export { default as BottomSheet } from './BottomSheet';
// ...
export { default as Sheet, SheetTrigger, SheetContent, ... } from './Sheet';
// ...
export type { ButtonProps } from './Button';
export type { SheetProps, SheetContentProps, ... } from './Sheet';
```
For `EmberGlass/index.ts` (~5 LOC per UI-SPEC line 569):
```ts
export { Pressable, usePressed } from './Pressable';
export type { PressableProps, PointerHandlers } from './Pressable';
export { Sheet } from './Sheet';
export type { SheetProps } from './Sheet';
export { default as AmbientBg } from './AmbientBg';
```
Keep `default as AmbientBg` form because `AmbientBg.tsx` is a `default export` (verified at `AmbientBg.tsx:23`).

---

### `app/components/EmberGlass/__tests__/Pressable.test.tsx` (new — jest unit test)

**Analog:** `app/components/ui/__tests__/BottomSheet.test.tsx`.

**Imports + describe-block + onClose mock pattern** (copy from `BottomSheet.test.tsx:1-10`):
```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import BottomSheet from '../BottomSheet';

describe('BottomSheet Component', () => {
  const onCloseMock = jest.fn();

  beforeEach(() => {
    onCloseMock.mockClear();
  });

  describe('Rendering', () => {
    test('does not render when isOpen is false', () => {
      render(<BottomSheet isOpen={false} onClose={onCloseMock}>Content</BottomSheet>);
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
```
Adapt for `Pressable`: `import { Pressable, usePressed } from '../Pressable'`, organize into `describe` blocks for: "Rendering" (default `as='div'`, `as='button'`, ref forwarding), "Pointer events" (transform toggle on `pointerDown`/`pointerUp`/`pointerLeave`/`pointerCancel`), "data-pressable-focusable attribute" (true for `as='button'`, false for `as='div'`, true for `tabIndex >= 0`), "usePressed hook" (`renderHook` with pointer events).

**Pointer-event test pattern** (synthesized — Phase 175 needs `fireEvent.pointerDown` on the host):
```tsx
import { fireEvent, render } from '@testing-library/react';

test('toggles transform scale on pointer down/up', () => {
  const { container } = render(<Pressable data-testid="x">child</Pressable>);
  const el = container.firstElementChild!;
  expect(el.getAttribute('style')).toContain('scale(1)');
  fireEvent.pointerDown(el);
  expect(el.getAttribute('style')).toContain('scale(0.97)');
  fireEvent.pointerUp(el);
  expect(el.getAttribute('style')).toContain('scale(1)');
});
```

---

### `app/components/EmberGlass/__tests__/Sheet.test.tsx` (new — jest unit test)

**Primary analog:** `app/components/ui/__tests__/BottomSheet.test.tsx` (dialog dismissal patterns). **Secondary analog:** `app/components/ui/__tests__/Modal.test.tsx:185-220` (ESC + backdrop click on Radix Dialog).

**ESC dismissal pattern** (copy from `Modal.test.tsx:185-195`):
```tsx
test('closes on ESC keypress', async () => {
  const handleClose = jest.fn();
  const user = userEvent.setup();

  render(<TestModal onClose={handleClose} />);
  expect(screen.getByRole('dialog')).toBeInTheDocument();

  // Press ESC
  await user.keyboard('{Escape}');

  expect(handleClose).toHaveBeenCalledTimes(1);
});
```

**Backdrop-click dismissal pattern** (copy from `Modal.test.tsx:198-215`):
```tsx
test('closes on backdrop click', async () => {
  const handleClose = jest.fn();
  const user = userEvent.setup();

  render(<TestModal onClose={handleClose} />);

  // The overlay is the backdrop - find it by class
  const overlay = document.querySelector('.backdrop-blur-md');
  expect(overlay).toBeInTheDocument();

  // Click the overlay (backdrop)
  await user.click(overlay!);

  await waitFor(() => {
    expect(handleClose).toHaveBeenCalled();
  });
});
```
Adapt for Phase 175: query the backdrop div by `[aria-hidden="true"]` (Phase 175 backdrop has no class — it's inline-style). Use `screen.getAllByRole('generic', { hidden: true })` filtered for `position: fixed` + `inset: 0`, OR add a `data-sheet-backdrop="true"` attribute on the backdrop div for test queryability.

**Close-button dismissal pattern** (copy from `BottomSheet.test.tsx:79-89`):
```tsx
test('calls onClose when close button clicked', async () => {
  const user = userEvent.setup();
  render(
    <BottomSheet isOpen={true} onClose={onCloseMock} title="Title">
      Content
    </BottomSheet>
  );
  const closeButton = screen.getByRole('button', { name: /chiudi/i });
  await user.click(closeButton);
  expect(onCloseMock).toHaveBeenCalledTimes(1);
});
```
Adapt directly for Phase 175 — the close button has `aria-label="Chiudi"` (UI-SPEC line 301), so `screen.getByRole('button', { name: /chiudi/i })` matches.

**ARIA / dialog-role assertions** (copy from `BottomSheet.test.tsx:117-145`):
```tsx
test('has dialog role', () => {
  render(<BottomSheet isOpen={true} onClose={onCloseMock}>Content</BottomSheet>);
  expect(screen.getByRole('dialog')).toBeInTheDocument();
});

test('has aria-modal attribute', () => {
  render(<BottomSheet isOpen={true} onClose={onCloseMock}>Content</BottomSheet>);
  const dialog = screen.getByRole('dialog');
  expect(dialog).toHaveAttribute('aria-modal', 'true');
});
```
Radix `DialogPrimitive.Content` provides `role="dialog"` + `aria-modal="true"` automatically — the same assertion pattern works.

**Scroll-lock body-style assertions** (synthesize from D-11 + UI-SPEC line 575):
```tsx
test('applies scroll-lock body styles when open', () => {
  // jsdom: window.scrollY defaults to 0
  const { rerender } = render(<Sheet open={false} onClose={jest.fn()}>x</Sheet>);
  expect(document.body.style.position).toBe('');
  rerender(<Sheet open={true} onClose={jest.fn()}>x</Sheet>);
  expect(document.body.style.position).toBe('fixed');
  expect(document.body.style.overflow).toBe('hidden');
  expect(document.body.style.width).toBe('100%');
  rerender(<Sheet open={false} onClose={jest.fn()}>x</Sheet>);
  expect(document.body.style.position).toBe('');
  expect(document.body.style.overflow).toBe('');
});
```

---

### `tests/smoke/press-primitive.spec.ts` (new — Playwright smoke)

**Analog:** `tests/smoke/accent-picker.spec.ts` (DS-N spec on `/debug/design-system-v2`, `test.describe` block with 2-3 tests).

**File header + describe + page.goto pattern** (copy from `accent-picker.spec.ts:1-20`):
```ts
import { test, expect } from '@playwright/test';

/**
 * DS-03 — accent picker live update + localStorage persistence (Phase 174).
 *
 * Asserts:
 * - Click on Rose swatch updates document.documentElement.style.--accent
 *   to oklch(0.68 0.17 0).
 * - localStorage 'ember-glass-accent' is set to the same value.
 * - aria-pressed flips: Rose=true, Copper=false.
 * - All 6 hue swatches are visible with aria-label="Set accent to {Name}".
 */
test.describe('DS-03 — accent picker (live --accent + localStorage)', () => {
  test('clicking Rose swatch updates --accent and persists in localStorage', async ({ page }) => {
    await page.goto('/debug/design-system-v2');
    await expect(page.getByRole('heading', { level: 1, name: /Ember Glass/i })).toBeVisible({ timeout: 10000 });
```
Adapt for Phase 175: rename describe to `'DS-07 — Pressable primitive'`, copy the `page.goto('/debug/design-system-v2')` + `await expect(page.getByRole('heading', { level: 1, ... })).toBeVisible()` pattern.

**3 expects per UI-SPEC line 576:**
```ts
test('Pressable exported from EmberGlass barrel', async ({ page }) => {
  // Indirect: confirm a sample Pressable surface renders on demo page (the barrel
  // import is what makes it render). The grep gate for the barrel itself is in CI.
  await page.goto('/debug/design-system-v2');
  await expect(page.getByRole('button', { name: /Esempio bottone pressabile/i })).toBeVisible();
});

test('.press-anim transition matches DS-07 curve in computed CSS', async ({ page }) => {
  await page.goto('/debug/design-system-v2');
  // The Sample 2 button uses className="glass-surface press-anim"
  const btn = page.getByRole('button', { name: /Esempio bottone pressabile/i });
  const transition = await btn.evaluate((el) => getComputedStyle(el).transition);
  expect(transition).toContain('0.22s');
  expect(transition).toContain('cubic-bezier(0.34, 1.56, 0.64, 1)');
});

test('press surface scales to 0.97 on mouse.down', async ({ page }) => {
  await page.goto('/debug/design-system-v2');
  const btn = page.getByRole('button', { name: /Esempio bottone pressabile/i });
  const box = await btn.boundingBox();
  await page.mouse.move(box!.x + 10, box!.y + 10);
  await page.mouse.down();
  await page.waitForTimeout(50);
  const transform = await btn.evaluate((el) => getComputedStyle(el).transform);
  expect(transform).toMatch(/matrix\(0\.97/);
  await page.mouse.up();
});
```

---

### `tests/smoke/sheet-primitive.spec.ts` (new — Playwright smoke, 7 specs)

**Analog:** `tests/smoke/ambient-persist.spec.ts` (3-spec describe block) + `tests/smoke/page-loads.spec.ts:1-20` (collectConsoleErrors helper for any console error gate).

**Multi-test describe + beforeEach reset pattern** (copy from `ambient-persist.spec.ts:14-25`):
```ts
test.describe('DS-05 — ambient persistence (hard reload survival)', () => {
  test.beforeEach(async ({ page }) => {
    // Reset any leak from previous tests
    await page.goto('/debug/design-system-v2');
    await page.evaluate(() => {
      localStorage.removeItem('ember-glass-ambient');
      delete document.documentElement.dataset.ambient;
    });
  });
```
Adapt for Phase 175: rename describe to `'SHEET-01 — Sheet primitive'`. No `beforeEach` reset is strictly needed (sheet state is React-local, no localStorage); the open/close cycle is fresh per test.

**Open + dismiss patterns** (synthesized for the 7 specs from D-17, UI-SPEC line 577):
```ts
async function openSheet(page) {
  await page.goto('/debug/design-system-v2');
  await page.getByRole('button', { name: /Apri sheet demo/i }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
}

test('opens via button click', async ({ page }) => {
  await openSheet(page);
  const dialog = page.getByRole('dialog');
  const transform = await dialog.evaluate((el) => getComputedStyle(el).transform);
  expect(transform).not.toContain('matrix(1, 0, 0, 1, 0, 110'); // not translated 110%
});

test('dismisses via Escape', async ({ page }) => {
  await openSheet(page);
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toBeHidden({ timeout: 1000 });
});

test('dismisses via backdrop tap', async ({ page }) => {
  await openSheet(page);
  // Backdrop is the inline-styled div with data-sheet-backdrop="true"
  await page.locator('[data-sheet-backdrop="true"]').click({ position: { x: 10, y: 10 } });
  await expect(page.getByRole('dialog')).toBeHidden({ timeout: 1000 });
});

test('dismisses via close button', async ({ page }) => {
  await openSheet(page);
  await page.getByRole('button', { name: /Chiudi/i }).click();
  await expect(page.getByRole('dialog')).toBeHidden({ timeout: 1000 });
});

test('scroll-lock applied + restored at y=300', async ({ page }) => {
  await page.goto('/debug/design-system-v2');
  await page.evaluate(() => window.scrollTo(0, 300));
  await page.getByRole('button', { name: /Apri sheet demo/i }).click();
  const positionWhenOpen = await page.evaluate(() => document.body.style.position);
  expect(positionWhenOpen).toBe('fixed');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(500); // allow Sheet outro
  const restoredScrollY = await page.evaluate(() => window.scrollY);
  expect(restoredScrollY).toBe(300);
});

test('mobile 375px sheet width = viewport - 16', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await openSheet(page);
  const dialog = page.getByRole('dialog');
  const box = await dialog.boundingBox();
  expect(Math.round(box!.width)).toBe(359); // 375 - 16
});

test('desktop 1024px sheet width = viewport - 16', async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 768 });
  await openSheet(page);
  const dialog = page.getByRole('dialog');
  const box = await dialog.boundingBox();
  expect(Math.round(box!.width)).toBe(1008); // 1024 - 16
});
```

---

### `app/globals.css` (edit — append `.press-anim` + reduced-motion + focus-visible rules)

**Analog:** `app/globals.css:327-363` (Phase 174 `glass-surface` utility + reduced-motion block).

**Existing pattern (Phase 174, lines 327-344):**
```css
/* Glass surface utility (D-16) — single consumer of the four glass tokens; pattern follows existing glass-dark @layer components precedent at globals.css:1029-1034 */
@layer components {
  .glass-surface {
    background: var(--glass-bg);
    backdrop-filter: blur(var(--glass-blur)) saturate(180%);
    -webkit-backdrop-filter: blur(var(--glass-blur)) saturate(180%);
    border: 1px solid var(--glass-border);
    box-shadow: var(--glass-shadow);
    border-radius: var(--r-card);
  }
}
```

**Existing reduced-motion block (Phase 174, lines 360-363):**
```css
/* Reduced-motion guard (UI-SPEC §"Reduced-motion contract") */
@media (prefers-reduced-motion: reduce) {
  .ember-ambient-blob { animation: none !important; }
}
```

**Append for Phase 175** (per UI-SPEC lines 213-218, 510-514, 570-571 — total ~12 LOC after line 363):
```css
/* ===== EMBER GLASS PRIMITIVES (Phase 175 — DS-07, SHEET-01) ===== */
/* Press animation transition shape (DS-07). Transform itself is JS-driven (Pressable component sets it inline). This class exists so reduced-motion overrides have one canonical token AND any future static :active consumers can use it. */
.press-anim {
  transition: transform .22s cubic-bezier(.34,1.56,.64,1);
}

/* Focus-visible rule for Pressable hosts that are natively focusable (added by Pressable component as a data attribute) AND for the Sheet close button. */
[data-pressable-focusable="true"]:focus-visible,
[data-sheet-close="true"]:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

/* Reduced-motion override (UI-SPEC §"Reduced motion" — D-15 locked YES for press-anim only; Sheet's 400ms remains for visual continuity per UI-SPEC §Component Inventory). */
@media (prefers-reduced-motion: reduce) {
  .press-anim { transition: transform 50ms linear; }
}
```
**Append AFTER line 363** (the existing reduced-motion guard for ambient). Do NOT modify the existing `:root` token block (lines 304-325) or the `.glass-surface` rule (lines 329-336).

---

### `app/debug/design-system-v2/page.tsx` (edit — append Section 05 + Section 06)

**Analog:** existing Sections 01-04 in the same file (`page.tsx:155-418`).

**Section eyebrow + heading + helper pattern** (copy from `page.tsx:155-189` for Section 01):
```tsx
{/* Section 01 — Hue picker */}
<section aria-labelledby="sec-01-heading" style={{ marginBottom: 48 }}>
  <p
    style={{
      fontFamily: 'var(--font-body)',
      fontSize: 12,
      fontWeight: 600,
      letterSpacing: '1.2px',
      textTransform: 'uppercase',
      color: 'var(--text-2)',
    }}
  >
    01 / HUE
  </p>
  <h2
    id="sec-01-heading"
    style={{
      fontFamily: 'var(--font-display)',
      fontSize: 24,
      fontWeight: 600,
      color: 'var(--text-1)',
      margin: '4px 0 8px 0',
    }}
  >
    Tinte accento
  </h2>
  <p
    style={{
      fontFamily: 'var(--font-body)',
      fontSize: 16,
      color: 'var(--text-2)',
      marginBottom: 16,
    }}
  >
    Clicca uno swatch per aggiornare --accent in tempo reale
  </p>
  ...
</section>
```
**Append Section 05** with eyebrow `05 / PRESS`, heading `Animazione di pressione` (UI-SPEC line 462), helper `Tap o clicca per vedere scale(0.97) ↔ scale(1) con cubic-bezier(.34,1.56,.64,1) su 220ms`, and the 3-Pressable grid (UI-SPEC lines 380-391).

**Append Section 06** with eyebrow `06 / SHEET`, heading `Sheet primitivo` (UI-SPEC line 473), helper text per UI-SPEC line 474, an `Apri sheet demo` button + the `<Sheet>` body with 3 dummy rows + 600px spacer (UI-SPEC lines 421-441).

**Imports update** at top of `page.tsx`:
```tsx
import { Pressable, Sheet } from '@/app/components/EmberGlass';
```
(or `from '../components/EmberGlass'` matching existing relative-import conventions in the file — verify project tsconfig path-alias settings; the existing file uses `import React, { useState, useEffect } from 'react'` with no project-internal paths yet, so add the alias-style import per the project pattern observed elsewhere).

**State for Sheet open/close** — add alongside existing `useState` calls (mirror line 70-71 pattern):
```tsx
const [sheetOpen, setSheetOpen] = useState<boolean>(false);
```

---

## Shared Patterns

### Inline-style + `'use client'` boundary

**Source:** `app/components/EmberGlass/AmbientBg.tsx:1-3, 43-95` (Phase 174 sibling primitive).
**Apply to:** Both `Pressable.tsx` and `Sheet.tsx` (UI-SPEC line 30 explicitly mandates inline styles, NOT Tailwind).

```tsx
'use client';

import { useEffect, useState } from 'react';

// ...component...

return (
  <div
    style={{
      position: 'fixed',
      inset: 0,
      // tokens consumed via var()
      background: 'var(--glass-bg)',
      filter: 'blur(60px)', // AUDIT-EXCEPTION (DS-02): canonical from bundle
    }}
  />
);
```

### AUDIT-EXCEPTION inline-comment tagging (DS-02 inheritance)

**Source:** `app/components/EmberGlass/AmbientBg.tsx:56, 72, 75, 88, 90` (Phase 174 lines tagged inline).
**Apply to:** Every hardcoded literal in `Sheet.tsx` (10 lines per UI-SPEC table at lines 128-138). Pattern:

```tsx
filter: 'blur(60px)', // AUDIT-EXCEPTION (DS-02): canonical blur from design bundle (UI-SPEC §Ambient)
```

Tag template for Phase 175:
```tsx
background: 'rgba(28, 25, 23, 0.85)', // AUDIT-EXCEPTION (DS-02): bundle sheets.jsx:31
```

### `data-*` attribute for `:focus-visible` (since inline styles cannot express pseudo-selectors)

**Source:** Phase 175 design decision per UI-SPEC line 630.
**Apply to:** `Pressable.tsx` (data-pressable-focusable) + `Sheet.tsx` close button (data-sheet-close). Globally targeted by one CSS rule in `globals.css`:
```css
[data-pressable-focusable="true"]:focus-visible,
[data-sheet-close="true"]:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}
```

### Italian aria-labels, English test/console output

**Source:** `app/components/ui/BottomSheet.tsx:140` (`ariaLabel: 'Chiudi'`) + `app/components/ui/__tests__/BottomSheet.test.tsx:66` (`{ name: /chiudi/i }`).
**Apply to:** Sheet close button `aria-label="Chiudi"` (UI-SPEC line 301), test queries use `/chiudi/i`. Test/error output stays in English (per UI-SPEC line 491).

### Console-error gate in Playwright (optional)

**Source:** `tests/smoke/page-loads.spec.ts:6-20`:
```ts
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
**Apply to (optional):** `sheet-primitive.spec.ts` "opens via button click" test — assert no Radix `aria-describedby` warning fires (UI-SPEC line 524 sets `aria-describedby={undefined}` to suppress). Only worth the 5 LOC overhead if there's a regression risk; planner may skip.

---

## No Analog Found

None — every file has at least one strong analog in the codebase.

---

## Metadata

**Analog search scope:**
- `app/components/EmberGlass/` (Phase 174 sibling)
- `app/components/ui/Sheet.tsx`, `BottomSheet.tsx`, `Modal.tsx` and their `__tests__`
- `app/components/ui/index.ts` (barrel export)
- `app/globals.css` (Phase 174 token block + utilities)
- `app/debug/design-system-v2/page.tsx` (target page; existing sections)
- `tests/smoke/*.spec.ts` (Playwright smoke patterns from Phase 174)

**Files scanned:** 9 directly read + 4 grep-located.

**Pattern extraction date:** 2026-04-27.

**Key conventions identified:**
1. `'use client'` + JSDoc citing bundle source line numbers + AUDIT-EXCEPTION comments inline (Phase 174 sibling pattern from `AmbientBg.tsx`).
2. Inline `style={{}}` consuming `var(--token)` references (NOT Tailwind / NOT CVA — UI-SPEC line 30 mandates).
3. `forwardRef` + `displayName` on every primitive (legacy `Sheet.tsx:136` pattern).
4. Scroll-lock recipe lifted verbatim from `BottomSheet.tsx:50-67` (do NOT import — duplicate the ~10 lines).
5. `data-*-focusable` attribute pattern paired with one global `:focus-visible` rule in `globals.css` (since inline styles cannot express pseudo-selectors).
6. Jest tests use `screen.getByRole('dialog')` + `userEvent.keyboard('{Escape}')` + `await user.click(overlay!)` (Modal/BottomSheet test convention).
7. Playwright smoke uses `page.goto('/debug/design-system-v2')` + `expect(page.getByRole('heading', { level: 1, name: /Ember Glass/i })).toBeVisible({ timeout: 10000 })` as canonical setup.
8. Italian visible/aria copy, English test/error output (project locale convention, Phase 174 line 491).
9. `48px` margin between major demo sections (`marginBottom: 48` consistent at lines 156, 217, 290, 359 in `page.tsx`).
