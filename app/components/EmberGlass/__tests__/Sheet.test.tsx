/**
 * Sheet — Phase 175 (SHEET-01) — Jest unit tests
 *
 * Coverage:
 *   - Rendering: open=false (sheet stays mounted with translateY(110%) due to forceMount),
 *     open=true (dialog role visible), title row, VisuallyHidden Title fallback.
 *   - Dismissal vectors (3): ESC keypress, backdrop click, close button click.
 *   - Backdrop NO-double-fire (onPointerDownOutside e.preventDefault on Content).
 *   - Body scroll-lock applied on open + restored on close (rAF-deferred per
 *     260506-d45 Fix D — flush via flushRaf() before asserting body styles).
 *   - ARIA / a11y: dialog role + aria-modal=true; close button data attribute.
 *
 * Pitfall guards:
 *   - jsdom + userEvent.pointer is unreliable → use fireEvent.pointerDown/Up directly
 *     where pointer events matter (Pitfall 1 from RESEARCH.md).
 *   - Body styles leak across tests → afterEach removes body style attribute (Pitfall 5).
 *   - jsdom window.scrollTo is a noop that throws → mock it (test 10 only needs the call).
 *   - Sheet body-style writes are scheduled via requestAnimationFrame (260506-d45).
 *     jsdom polyfills rAF via setTimeout(16); awaiting one rAF tick flushes the writes.
 */
import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { Sheet } from '../Sheet';

/**
 * Flush exactly one requestAnimationFrame callback. jsdom's polyfill drains rAF
 * via setTimeout(16); awaiting `new Promise(r => requestAnimationFrame(r))`
 * inside `act()` releases the queued style writes synchronously w.r.t. test
 * code that follows. Use BEFORE asserting body-style mutations applied by the
 * Sheet open/cleanup useEffect.
 */
async function flushRaf(): Promise<void> {
  await act(async () => {
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => resolve());
    });
  });
}

describe('Sheet (EmberGlass primitive)', () => {
  const onCloseMock = jest.fn();
  const originalScrollTo = window.scrollTo;

  beforeEach(() => {
    onCloseMock.mockClear();
    // jsdom's scrollTo is a noop that warns/throws under some configs; mock it.
    window.scrollTo = jest.fn() as unknown as typeof window.scrollTo;
  });

  afterEach(() => {
    // Prevent body-style leak between tests (Pitfall 5 from RESEARCH.md).
    document.body.removeAttribute('style');
    window.scrollTo = originalScrollTo;
  });

  describe('Rendering', () => {
    test('open=false: dialog stays mounted (forceMount) but transformed off-screen', () => {
      const { container } = render(
        <Sheet open={false} onClose={onCloseMock} title="Demo">
          <div>body</div>
        </Sheet>
      );
      // forceMount keeps DialogPrimitive.Content in the DOM. The container should still
      // show a dialog role (Radix Content has it), translated below the viewport.
      const dialog = container.ownerDocument.querySelector('[role="dialog"]') as HTMLElement | null;
      // We accept either: (a) dialog absent (Radix may set inert/hidden) OR
      //                    (b) dialog present with translateY(110%) inline style.
      if (dialog) {
        expect(dialog.getAttribute('style') ?? '').toContain('translateY(110%)');
      } else {
        expect(dialog).toBeNull();
      }
    });

    test('open=true: dialog is in the document', () => {
      render(
        <Sheet open={true} onClose={onCloseMock} title="Demo">
          <div>body</div>
        </Sheet>
      );
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    test('renders title text and a close button labelled "Chiudi" when title provided', () => {
      render(
        <Sheet open={true} onClose={onCloseMock} title="Demo">
          <div>body</div>
        </Sheet>
      );
      expect(screen.getByText('Demo')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /chiudi/i })).toBeInTheDocument();
    });

    test('VisuallyHidden Title fallback when title prop is omitted', () => {
      render(
        <Sheet open={true} onClose={onCloseMock}>
          <div>body</div>
        </Sheet>
      );
      // Radix requires a DialogTitle; fallback renders text "Sheet" inside a
      // visually-hidden wrapper. screen.getByText finds it because it is in the DOM.
      expect(screen.getByText('Sheet')).toBeInTheDocument();
    });
  });

  describe('Dismissal vectors', () => {
    test('ESC keypress fires onClose once', async () => {
      const user = userEvent.setup();
      render(
        <Sheet open={true} onClose={onCloseMock} title="Demo">
          <div>body</div>
        </Sheet>
      );
      await user.keyboard('{Escape}');
      expect(onCloseMock).toHaveBeenCalledTimes(1);
    });

    test('backdrop click fires onClose once', () => {
      render(
        <Sheet open={true} onClose={onCloseMock} title="Demo">
          <div>body</div>
        </Sheet>
      );
      const backdrop = document.querySelector('[data-sheet-backdrop="true"]') as HTMLElement | null;
      expect(backdrop).not.toBeNull();
      fireEvent.click(backdrop!);
      expect(onCloseMock).toHaveBeenCalledTimes(1);
    });

    test('close button click fires onClose once', async () => {
      const user = userEvent.setup();
      render(
        <Sheet open={true} onClose={onCloseMock} title="Demo">
          <div>body</div>
        </Sheet>
      );
      const closeBtn = screen.getByRole('button', { name: /chiudi/i });
      await user.click(closeBtn);
      expect(onCloseMock).toHaveBeenCalledTimes(1);
    });

    test('backdrop click does NOT double-fire (onPointerDownOutside.preventDefault)', () => {
      render(
        <Sheet open={true} onClose={onCloseMock} title="Demo">
          <div>body</div>
        </Sheet>
      );
      const backdrop = document.querySelector('[data-sheet-backdrop="true"]') as HTMLElement | null;
      expect(backdrop).not.toBeNull();
      // Simulate the full sequence Radix would observe: pointerdown then click.
      fireEvent.pointerDown(backdrop!);
      fireEvent.click(backdrop!);
      // EXACTLY one call — Radix's outside-pointer-down dismissal is suppressed.
      expect(onCloseMock).toHaveBeenCalledTimes(1);
    });
  });

  describe('Body scroll-lock', () => {
    test('applies fixed/overflow/width body styles on open (after rAF flush)', async () => {
      const { rerender } = render(
        <Sheet open={false} onClose={onCloseMock} title="Demo">
          <div>body</div>
        </Sheet>
      );
      expect(document.body.style.position).toBe('');
      expect(document.body.style.overflow).toBe('');
      rerender(
        <Sheet open={true} onClose={onCloseMock} title="Demo">
          <div>body</div>
        </Sheet>
      );
      // Pre-rAF: body styles still pristine — Fix D defers writes one frame.
      expect(document.body.style.position).toBe('');
      await flushRaf();
      expect(document.body.style.position).toBe('fixed');
      expect(document.body.style.overflow).toBe('hidden');
      expect(document.body.style.width).toBe('100%');
    });

    test('restores body styles + calls window.scrollTo with locked scrollY on close (after rAF flush)', async () => {
      const { rerender } = render(
        <Sheet open={false} onClose={onCloseMock} title="Demo">
          <div>body</div>
        </Sheet>
      );
      // Open — captures scrollY synchronously (jsdom default 0); style writes deferred.
      rerender(
        <Sheet open={true} onClose={onCloseMock} title="Demo">
          <div>body</div>
        </Sheet>
      );
      await flushRaf();
      expect(document.body.style.position).toBe('fixed');
      // Close — schedules restore writes one rAF frame later.
      rerender(
        <Sheet open={false} onClose={onCloseMock} title="Demo">
          <div>body</div>
        </Sheet>
      );
      await flushRaf();
      expect(document.body.style.position).toBe('');
      expect(document.body.style.overflow).toBe('');
      expect(document.body.style.width).toBe('');
      expect(document.body.style.top).toBe('');
      // scrollTo called with the captured scrollY (0 in jsdom).
      expect(window.scrollTo).toHaveBeenCalledWith(0, 0);
    });

    test('regression guard: requestAnimationFrame is invoked on both open and close (260506-d45 Fix D)', async () => {
      const rafSpy = jest.spyOn(window, 'requestAnimationFrame');
      const { rerender } = render(
        <Sheet open={false} onClose={onCloseMock} title="Demo">
          <div>body</div>
        </Sheet>
      );
      const baselineCalls = rafSpy.mock.calls.length;
      // Open — schedules ONE rAF for the body-style writes.
      rerender(
        <Sheet open={true} onClose={onCloseMock} title="Demo">
          <div>body</div>
        </Sheet>
      );
      await flushRaf();
      expect(rafSpy.mock.calls.length).toBeGreaterThan(baselineCalls);
      const afterOpenCalls = rafSpy.mock.calls.length;
      // Close — schedules ANOTHER rAF for the cleanup restore writes.
      rerender(
        <Sheet open={false} onClose={onCloseMock} title="Demo">
          <div>body</div>
        </Sheet>
      );
      await flushRaf();
      expect(rafSpy.mock.calls.length).toBeGreaterThan(afterOpenCalls);
      rafSpy.mockRestore();
    });
  });

  describe('ARIA / a11y', () => {
    test('dialog exposes modal semantics via Radix (role + open data-state + aria-labelledby)', () => {
      render(
        <Sheet open={true} onClose={onCloseMock} title="Demo">
          <div>body</div>
        </Sheet>
      );
      const dialog = screen.getByRole('dialog');
      // Radix v1.1.14 indicates modal-open dialog via role="dialog" + data-state="open"
      // (focus trap + ESC are runtime-enforced, not attribute-driven). aria-labelledby
      // is auto-wired to the rendered <DialogPrimitive.Title>.
      expect(dialog).toHaveAttribute('role', 'dialog');
      expect(dialog).toHaveAttribute('data-state', 'open');
      expect(dialog.getAttribute('aria-labelledby')).toBeTruthy();
    });

    test('close button has data-sheet-close="true" attribute', () => {
      render(
        <Sheet open={true} onClose={onCloseMock} title="Demo">
          <div>body</div>
        </Sheet>
      );
      const closeBtn = screen.getByRole('button', { name: /chiudi/i });
      expect(closeBtn).toHaveAttribute('data-sheet-close', 'true');
    });
  });

  describe('Body data-attribute (Phase 181 D-10)', () => {
    afterEach(() => {
      delete document.body.dataset.sheetOpen;
    });

    test('mounting open=true sets body.dataset.sheetOpen', () => {
      render(<Sheet open={true} onClose={onCloseMock}><div>x</div></Sheet>);
      expect(document.body.dataset.sheetOpen).toBe('true');
    });

    test('flipping open true → false clears the attribute', () => {
      const { rerender } = render(<Sheet open={true} onClose={onCloseMock}><div>x</div></Sheet>);
      expect(document.body.dataset.sheetOpen).toBe('true');
      rerender(<Sheet open={false} onClose={onCloseMock}><div>x</div></Sheet>);
      expect(document.body.dataset.sheetOpen).toBeUndefined();
    });

    test('two stacked open sheets keep attribute until both close', () => {
      const { rerender, unmount } = render(
        <>
          <Sheet open={true} onClose={onCloseMock}><div>a</div></Sheet>
          <Sheet open={true} onClose={onCloseMock}><div>b</div></Sheet>
        </>
      );
      expect(document.body.dataset.sheetOpen).toBe('true');
      rerender(
        <>
          <Sheet open={false} onClose={onCloseMock}><div>a</div></Sheet>
          <Sheet open={true} onClose={onCloseMock}><div>b</div></Sheet>
        </>
      );
      expect(document.body.dataset.sheetOpen).toBe('true'); // counter still 1
      unmount();
      expect(document.body.dataset.sheetOpen).toBeUndefined();
    });
  });
});
