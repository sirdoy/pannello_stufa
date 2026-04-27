import { act, fireEvent, render, renderHook } from '@testing-library/react';
import { createRef } from 'react';
import { Pressable, usePressed } from '../Pressable';

describe('Pressable Component', () => {
  describe('Rendering', () => {
    test('renders a div by default with children', () => {
      const { container, getByText } = render(<Pressable>hello</Pressable>);
      const el = container.firstElementChild as HTMLElement;
      expect(el.tagName).toBe('DIV');
      expect(getByText('hello')).toBeInTheDocument();
    });

    test('renders the host element specified by `as` prop', () => {
      const { container } = render(
        <Pressable as="button" type="button">
          click me
        </Pressable>
      );
      const el = container.firstElementChild as HTMLElement;
      expect(el.tagName).toBe('BUTTON');
    });

    test('forwards ref to the host element', () => {
      const ref = createRef<HTMLButtonElement>();
      render(
        <Pressable as="button" type="button" ref={ref}>
          ref test
        </Pressable>
      );
      expect(ref.current).not.toBeNull();
      expect(ref.current?.tagName).toBe('BUTTON');
    });
  });

  describe('Pointer events', () => {
    test('initial inline style has scale(1) and the DS-07 cubic-bezier transition', () => {
      const { container } = render(<Pressable>child</Pressable>);
      const el = container.firstElementChild as HTMLElement;
      expect(el.style.transform).toContain('scale(1)');
      expect(el.style.transition).toContain('cubic-bezier(.34,1.56,.64,1)');
      // jsdom may serialize as either "0.22s" or ".22s" — accept both forms.
      expect(el.style.transition).toMatch(/(0\.22s|\.22s)/);
    });

    test('pointerDown flips inline transform to scale(0.97)', () => {
      const { container } = render(<Pressable>child</Pressable>);
      const el = container.firstElementChild as HTMLElement;
      fireEvent.pointerDown(el);
      expect(el.style.transform).toContain('scale(0.97)');
    });

    test('pointerUp after pointerDown returns transform to scale(1)', () => {
      const { container } = render(<Pressable>child</Pressable>);
      const el = container.firstElementChild as HTMLElement;
      fireEvent.pointerDown(el);
      expect(el.style.transform).toContain('scale(0.97)');
      fireEvent.pointerUp(el);
      expect(el.style.transform).toContain('scale(1)');
    });

    test('pointerLeave after pointerDown returns transform to scale(1)', () => {
      const { container } = render(<Pressable>child</Pressable>);
      const el = container.firstElementChild as HTMLElement;
      fireEvent.pointerDown(el);
      expect(el.style.transform).toContain('scale(0.97)');
      fireEvent.pointerLeave(el);
      expect(el.style.transform).toContain('scale(1)');
    });

    test('pointerCancel after pointerDown returns transform to scale(1)', () => {
      const { container } = render(<Pressable>child</Pressable>);
      const el = container.firstElementChild as HTMLElement;
      fireEvent.pointerDown(el);
      expect(el.style.transform).toContain('scale(0.97)');
      fireEvent.pointerCancel(el);
      expect(el.style.transform).toContain('scale(1)');
    });
  });

  describe('data-pressable-focusable attribute', () => {
    test('as="button" host has data-pressable-focusable="true"', () => {
      const { container } = render(
        <Pressable as="button" type="button">
          x
        </Pressable>
      );
      const el = container.firstElementChild as HTMLElement;
      expect(el.getAttribute('data-pressable-focusable')).toBe('true');
    });

    test('as="div" without tabIndex does NOT have data-pressable-focusable', () => {
      const { container } = render(<Pressable as="div">x</Pressable>);
      const el = container.firstElementChild as HTMLElement;
      expect(el.getAttribute('data-pressable-focusable')).toBeNull();
    });

    test('as="div" with tabIndex={0} has data-pressable-focusable="true"', () => {
      const { container } = render(
        <Pressable as="div" tabIndex={0}>
          x
        </Pressable>
      );
      const el = container.firstElementChild as HTMLElement;
      expect(el.getAttribute('data-pressable-focusable')).toBe('true');
    });
  });

  describe('usePressed hook', () => {
    test('returns pressed=false initially and pointer handlers that toggle it', () => {
      const { result } = renderHook(() => usePressed());
      expect(result.current.pressed).toBe(false);
      expect(typeof result.current.pointerHandlers.onPointerDown).toBe('function');
      expect(typeof result.current.pointerHandlers.onPointerUp).toBe('function');
      expect(typeof result.current.pointerHandlers.onPointerLeave).toBe('function');
      expect(typeof result.current.pointerHandlers.onPointerCancel).toBe('function');

      act(() => {
        result.current.pointerHandlers.onPointerDown({} as never);
      });
      expect(result.current.pressed).toBe(true);

      act(() => {
        result.current.pointerHandlers.onPointerUp({} as never);
      });
      expect(result.current.pressed).toBe(false);
    });

    test('caller style is spread but cannot override the press contract', () => {
      const { container } = render(
        <Pressable style={{ background: 'red' }}>x</Pressable>
      );
      const el = container.firstElementChild as HTMLElement;
      // Caller's other style keys win.
      expect(el.style.background).toBe('red');
      // Press contract still present.
      expect(el.style.transform).toContain('scale(1)');
      expect(el.style.transition).toContain('cubic-bezier(.34,1.56,.64,1)');
    });
  });
});
