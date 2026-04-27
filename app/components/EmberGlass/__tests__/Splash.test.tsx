/**
 * Splash — Phase 176 (SPLASH-02 + SPLASH-03) — Jest fake-timer tests
 *
 * Coverage (13 tests):
 *  Full-motion phase state machine (5):
 *   1. flame transform: scale(0.4) → scale(1) at t=600ms (phase 0→1)
 *   2. onDone fires exactly once at t=2100ms (not at t=2099ms)
 *   3. overlay returns null after phase 3 (t=2100ms)
 *   4. all timers cleared on unmount (no late onDone after 3000ms)
 *   5. pointerEvents flips to 'none' at phase ≥ 2 (t=1500ms)
 *
 *  Reduced-motion branch (3):
 *   6. overlay transition is opacity-only (no 'transform')
 *   7. onDone fires at t=200ms (single timer)
 *   8. flame transform === 'none' (no scale applied)
 *
 *  DOM structure (5):
 *   9. overlay has aria-hidden="true"
 *  10. wordmark text === 'Home'
 *  11. caption text contains 'Connessione al gateway…' (U+2026)
 *  12. badge text contains 'Autenticato · Auth0' (U+00B7)
 *  13. overlay zIndex === 1000
 */
import { act, render, screen } from '@testing-library/react';

import { Splash } from '../Splash';

describe('Splash (EmberGlass overlay — Phase 176)', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    // Wrap in act() so any final phase updates from pending timers don't trip
    // the React-18 "update inside a test was not wrapped in act(...)" warning.
    act(() => {
      jest.runOnlyPendingTimers();
    });
    jest.useRealTimers();
  });

  describe('Full-motion phase state machine', () => {
    test('flame scales from scale(0.4) to scale(1) at t=600ms (phase 0→1)', () => {
      const onDone = jest.fn();
      render(<Splash onDone={onDone} />);

      const flameAtPhase0 = screen.getByTestId('splash-flame');
      expect(flameAtPhase0.style.transform).toContain('scale(0.4)');

      act(() => {
        jest.advanceTimersByTime(600);
      });

      const flameAtPhase1 = screen.getByTestId('splash-flame');
      expect(flameAtPhase1.style.transform).toContain('scale(1)');
    });

    test('onDone fires exactly once at t=2100ms (not at t=2099ms)', () => {
      const onDone = jest.fn();
      render(<Splash onDone={onDone} />);

      act(() => {
        jest.advanceTimersByTime(2099);
      });
      expect(onDone).not.toHaveBeenCalled();

      act(() => {
        jest.advanceTimersByTime(1); // total = 2100ms
      });
      expect(onDone).toHaveBeenCalledTimes(1);
    });

    test('overlay returns null after phase 3 (t=2100ms)', () => {
      const onDone = jest.fn();
      render(<Splash onDone={onDone} />);

      expect(screen.getByTestId('splash-overlay')).toBeInTheDocument();

      act(() => {
        jest.advanceTimersByTime(2100);
      });

      expect(screen.queryByTestId('splash-overlay')).toBeNull();
    });

    test('all timers cleared on unmount (no setState/onDone after unmount)', () => {
      const onDone = jest.fn();
      const { unmount } = render(<Splash onDone={onDone} />);

      unmount();

      act(() => {
        jest.advanceTimersByTime(3000); // > 2100ms, well past every timer
      });

      expect(onDone).not.toHaveBeenCalled();
    });

    test('pointerEvents flips to "none" once phase ≥ 2 (t=1500ms)', () => {
      const onDone = jest.fn();
      render(<Splash onDone={onDone} />);

      const overlayAtPhase0 = screen.getByTestId('splash-overlay');
      expect(overlayAtPhase0.style.pointerEvents).toBe('auto');

      act(() => {
        jest.advanceTimersByTime(1500);
      });

      const overlayAtPhase2 = screen.getByTestId('splash-overlay');
      expect(overlayAtPhase2.style.pointerEvents).toBe('none');
    });
  });

  describe('Reduced-motion branch', () => {
    test('overlay transition is opacity-only (no transform in transition string)', () => {
      const onDone = jest.fn();
      render(<Splash onDone={onDone} reducedMotion />);

      const overlay = screen.getByTestId('splash-overlay');
      expect(overlay.style.transition).toContain('opacity');
      expect(overlay.style.transition).not.toContain('transform');
    });

    test('onDone fires at t=200ms (single timer)', () => {
      const onDone = jest.fn();
      render(<Splash onDone={onDone} reducedMotion />);

      act(() => {
        jest.advanceTimersByTime(199);
      });
      expect(onDone).not.toHaveBeenCalled();

      act(() => {
        jest.advanceTimersByTime(1); // total = 200ms
      });
      expect(onDone).toHaveBeenCalledTimes(1);
    });

    test('flame container has no scale transform applied (transform === "none")', () => {
      const onDone = jest.fn();
      render(<Splash onDone={onDone} reducedMotion />);

      const flame = screen.getByTestId('splash-flame');
      // Either omitted or set to 'none' — the contract is ZERO scale/transform.
      expect(flame.style.transform === '' || flame.style.transform === 'none').toBe(true);
      expect(flame.style.transform).not.toContain('scale');
    });
  });

  describe('DOM structure', () => {
    test('overlay has aria-hidden="true"', () => {
      const onDone = jest.fn();
      render(<Splash onDone={onDone} />);

      expect(screen.getByTestId('splash-overlay').getAttribute('aria-hidden')).toBe('true');
    });

    test('wordmark text === "Home"', () => {
      const onDone = jest.fn();
      render(<Splash onDone={onDone} />);

      expect(screen.getByTestId('splash-wordmark').textContent).toBe('Home');
    });

    test('caption text === "Connessione al gateway…" (U+2026 ellipsis)', () => {
      const onDone = jest.fn();
      render(<Splash onDone={onDone} />);

      // U+2026 explicit codepoint check — guards against three-period regression.
      const ellipsis = '…';
      expect(screen.getByText(`Connessione al gateway${ellipsis}`)).toBeInTheDocument();
    });

    test('badge text contains "Autenticato · Auth0" (U+00B7 middle dot)', () => {
      const onDone = jest.fn();
      render(<Splash onDone={onDone} />);

      const badge = screen.getByTestId('splash-badge');
      // U+00B7 explicit codepoint check.
      const middleDot = '·';
      expect(badge.textContent).toContain(`Autenticato ${middleDot} Auth0`);
    });

    test('overlay zIndex === 1000 (D-06 reservation)', () => {
      const onDone = jest.fn();
      render(<Splash onDone={onDone} />);

      const overlay = screen.getByTestId('splash-overlay');
      expect(overlay.style.zIndex).toBe('1000');
    });
  });
});
