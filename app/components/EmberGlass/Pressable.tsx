'use client';
/**
 * Pressable — Phase 175 (DS-07)
 *
 * Press animation primitive. Tracks pointer state in JS (NOT :active, which
 * sticks on touch devices and does not release on pointerleave) and applies
 * inline scale(0.97) ↔ scale(1) with the locked Ember Glass press curve.
 * Polymorphic via the `as` prop (default 'div').
 *
 * Three grep targets satisfy the SC-#1 "shared utility" contract for Phases
 * 177-181:
 *   1. <Pressable> component (this file)
 *   2. usePressed() hook (this file)
 *   3. .press-anim CSS class (app/globals.css)
 *
 * Source-of-truth curve: `transition: transform .22s cubic-bezier(.34,1.56,.64,1)`
 * — the SAME string is the .press-anim utility's transition value in
 * app/globals.css (character-for-character invariant per SC-#1).
 *
 * Bundle source:
 *   .planning/inbox/ember-glass-design/project/components/cards.jsx:11-14
 *
 * Reduced-motion: Pressable's inline transition is the bouncy 220ms by design
 * (the bounce is brand). Reduced-motion users with strict needs can compose
 * the .press-anim CSS class instead — the global media query collapses it to
 * 50ms linear. Detecting `prefers-reduced-motion` inside this primitive was
 * rejected per UI-SPEC §Accessibility (would force a useEffect for what
 * should be a zero-cost render).
 *
 * Focus-visible: hosts that are natively focusable (button/a/input/select/
 * textarea OR consumer-set `tabIndex >= 0`) receive `data-pressable-focusable
 * ="true"`; the global CSS rule paints a 2px var(--accent) outline on
 * `:focus-visible`. Inline styles cannot express :focus-visible, hence the
 * data-attribute bridge.
 */

import {
  forwardRef,
  useCallback,
  useState,
  type ComponentPropsWithoutRef,
  type ElementType,
  type PointerEventHandler,
  type ReactNode,
  type Ref,
} from 'react';

export interface PointerHandlers {
  onPointerDown: PointerEventHandler;
  onPointerUp: PointerEventHandler;
  onPointerLeave: PointerEventHandler;
  onPointerCancel: PointerEventHandler;
}

/**
 * Hook form of the press primitive — for consumers that already have a wrapper
 * element and want to opt into press behavior without an extra DOM node.
 *
 * Returns `{ pressed, pointerHandlers }`. Spread `pointerHandlers` onto the
 * host element and apply your own `transform`/`transition` (or the
 * `.press-anim` class for the transition shape and inline transform for the
 * scale).
 */
export function usePressed(): { pressed: boolean; pointerHandlers: PointerHandlers } {
  const [pressed, setPressed] = useState<boolean>(false);
  const onPointerDown = useCallback<PointerEventHandler>(() => setPressed(true), []);
  const onPointerUp = useCallback<PointerEventHandler>(() => setPressed(false), []);
  const onPointerLeave = useCallback<PointerEventHandler>(() => setPressed(false), []);
  const onPointerCancel = useCallback<PointerEventHandler>(() => setPressed(false), []);
  return {
    pressed,
    pointerHandlers: { onPointerDown, onPointerUp, onPointerLeave, onPointerCancel },
  };
}

/**
 * DS-07 transition string — single source of truth shared with the
 * `.press-anim` utility class in app/globals.css.
 */
const PRESS_TRANSITION = 'transform .22s cubic-bezier(.34,1.56,.64,1)';

/**
 * HTML tags that are natively keyboard-focusable. When the consumer renders
 * Pressable with `as` set to one of these (or passes a non-negative tabIndex
 * for non-focusable tags), Pressable adds `data-pressable-focusable="true"`
 * so the global :focus-visible rule paints the accent outline.
 */
const FOCUSABLE_HOSTS = new Set(['button', 'a', 'input', 'select', 'textarea']);

type PressableOwnProps<E extends ElementType> = {
  as?: E;
  children?: ReactNode;
};

export type PressableProps<E extends ElementType> = PressableOwnProps<E> &
  Omit<ComponentPropsWithoutRef<E>, keyof PressableOwnProps<E>>;

const PressableInner = forwardRef(function PressableInner<E extends ElementType = 'div'>(
  { as, children, style, className, ...rest }: PressableProps<E>,
  ref: Ref<Element>
) {
  const Tag = (as ?? 'div') as ElementType;
  const { pressed, pointerHandlers } = usePressed();
  const tabIndex = (rest as { tabIndex?: number }).tabIndex;
  const isFocusable =
    (typeof Tag === 'string' && FOCUSABLE_HOSTS.has(Tag)) ||
    (typeof tabIndex === 'number' && tabIndex >= 0);
  return (
    <Tag
      ref={ref}
      className={className}
      {...(isFocusable ? { 'data-pressable-focusable': 'true' } : {})}
      {...pointerHandlers}
      {...rest}
      style={{
        transform: pressed ? 'scale(0.97)' : 'scale(1)',
        transition: PRESS_TRANSITION,
        ...style,
      }}
    >
      {children}
    </Tag>
  );
});

(PressableInner as { displayName?: string }).displayName = 'Pressable';

/**
 * Polymorphic press-animation primitive. Default host is `div`; pass `as` to
 * render any other element type. Forwards `ref` to the host element.
 *
 * Caller `style` is spread AFTER the press contract, so the consumer cannot
 * accidentally override `transform` / `transition` (other style keys win
 * normally).
 */
export const Pressable = PressableInner as unknown as <E extends ElementType = 'div'>(
  props: PressableProps<E> & { ref?: Ref<Element> }
) => React.ReactElement;
