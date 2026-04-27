/**
 * SplashGate Tests — Phase 176 (SPLASH-01, SPLASH-04, SPLASH-05)
 *
 * Covers full state matrix per CONTEXT.md decisions D-04..D-12, D-16, D-17, D-29:
 * Auth0 useUser() shape, sessionStorage persistence, useReducedMotion forwarding,
 * sibling-overlay render contract (children always present so dashboard fetches
 * start during splash window — SPLASH-05), forceShow bypass, incognito graceful
 * no-op on sessionStorage write failure.
 */

import { render, act } from '@testing-library/react';
import { SplashGate } from '../SplashGate';

const mockUseUser = jest.fn();
jest.mock('@auth0/nextjs-auth0/client', () => ({
  useUser: () => mockUseUser(),
}));

const mockUseReducedMotion = jest.fn(() => false);
jest.mock('@/lib/hooks/useReducedMotion', () => ({
  useReducedMotion: () => mockUseReducedMotion(),
}));

describe('SplashGate (EmberGlass orchestrator — Phase 176)', () => {
  beforeEach(() => {
    sessionStorage.clear();
    mockUseUser.mockReset();
    mockUseReducedMotion.mockReset();
    mockUseUser.mockReturnValue({ user: { sub: 'u1' }, isLoading: false });
    mockUseReducedMotion.mockReturnValue(false);
  });

  it('always renders children inside dashboard-wrapper (SPLASH-05 — children mount immediately)', () => {
    const { getByTestId, getByText } = render(
      <SplashGate>
        <div>dashboard content</div>
      </SplashGate>,
    );
    expect(getByTestId('dashboard-wrapper')).toBeInTheDocument();
    expect(getByText('dashboard content')).toBeInTheDocument();
  });

  it('mounts <Splash> when user truthy + sessionStorage unset + isLoading false (SPLASH-01)', () => {
    mockUseUser.mockReturnValue({ user: { sub: 'u1' }, isLoading: false });
    const { getByTestId } = render(
      <SplashGate>
        <div>dashboard</div>
      </SplashGate>,
    );
    expect(getByTestId('splash-overlay')).toBeInTheDocument();
  });

  it('does NOT mount <Splash> when sessionStorage flag is already "true" (SPLASH-04)', () => {
    sessionStorage.setItem('ember-glass-splash-shown', 'true');
    const { queryByTestId } = render(
      <SplashGate>
        <div>dashboard</div>
      </SplashGate>,
    );
    expect(queryByTestId('splash-overlay')).not.toBeInTheDocument();
  });

  it('does NOT mount <Splash> while Auth0 isLoading (D-10 — flicker prevention)', () => {
    mockUseUser.mockReturnValue({ user: undefined, isLoading: true });
    const { queryByTestId } = render(
      <SplashGate>
        <div>dashboard</div>
      </SplashGate>,
    );
    expect(queryByTestId('splash-overlay')).not.toBeInTheDocument();
  });

  it('does NOT mount <Splash> when user is null (logged-out state; D-12)', () => {
    mockUseUser.mockReturnValue({
      user: null,
      isLoading: false,
      error: new Error('logged out'),
    });
    const { queryByTestId } = render(
      <SplashGate>
        <div>dashboard</div>
      </SplashGate>,
    );
    expect(queryByTestId('splash-overlay')).not.toBeInTheDocument();
  });

  it('omits transform on dashboard-wrapper under reduced-motion (D-16/D-17)', () => {
    mockUseReducedMotion.mockReturnValue(true);
    const { getByTestId } = render(
      <SplashGate>
        <div>dashboard</div>
      </SplashGate>,
    );
    const wrapper = getByTestId('dashboard-wrapper');
    // Reduced-motion: opacity-only transition, NO transform style
    expect(wrapper.style.transition).toBe('opacity .2s linear');
    expect(wrapper.style.transform).toBe('');
  });

  it('writes sessionStorage flag and flips dashboard opacity to 1 when Splash.onDone fires (D-07/D-16)', () => {
    jest.useFakeTimers();
    try {
      const { getByTestId } = render(
        <SplashGate>
          <div>dashboard</div>
        </SplashGate>,
      );
      // Advance timers past full-motion phase 3 (t=2100).
      act(() => {
        jest.advanceTimersByTime(2200);
      });
      expect(sessionStorage.getItem('ember-glass-splash-shown')).toBe('true');
      const wrapper = getByTestId('dashboard-wrapper');
      expect(wrapper.style.opacity).toBe('1');
    } finally {
      jest.useRealTimers();
    }
  });

  it('forceShow bypasses sessionStorage gate (dev escape hatch + replay button)', () => {
    sessionStorage.setItem('ember-glass-splash-shown', 'true');
    const { getByTestId } = render(
      <SplashGate forceShow>
        <div>dashboard</div>
      </SplashGate>,
    );
    expect(getByTestId('splash-overlay')).toBeInTheDocument();
  });

  it('does NOT crash when sessionStorage.setItem throws (incognito graceful no-op)', () => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = jest.fn(() => {
      throw new Error('quota exceeded');
    });
    jest.useFakeTimers();
    try {
      const { queryByTestId } = render(
        <SplashGate>
          <div>dashboard</div>
        </SplashGate>,
      );
      expect(queryByTestId('splash-overlay')).toBeInTheDocument();
      // Drive the splash to completion — onDone() will attempt setItem and must swallow the throw.
      expect(() => {
        act(() => {
          jest.advanceTimersByTime(2200);
        });
      }).not.toThrow();
      // After onDone, splash unmounts cleanly.
      expect(queryByTestId('splash-overlay')).not.toBeInTheDocument();
    } finally {
      jest.useRealTimers();
      Storage.prototype.setItem = original;
    }
  });
});
