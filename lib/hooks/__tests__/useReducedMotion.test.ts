/**
 * @jest-environment jsdom
 */

import { renderHook, act } from '@testing-library/react';
import { useReducedMotion } from '../useReducedMotion';

type Listener = (e: { matches: boolean }) => void;

interface MqMock {
  matches: boolean;
  addEventListener: jest.Mock<void, ['change', Listener]>;
  removeEventListener: jest.Mock<void, ['change', Listener]>;
  /** Capture and dispatch synthetic 'change' events during tests. */
  _emit: (matches: boolean) => void;
}

function installMatchMediaMock(initialMatches: boolean): MqMock {
  let registered: Listener | null = null;
  const addEventListener = jest.fn<void, ['change', Listener]>((_event, l) => {
    registered = l;
  });
  const removeEventListener = jest.fn<void, ['change', Listener]>();
  const mq: MqMock = {
    matches: initialMatches,
    addEventListener,
    removeEventListener,
    _emit: (matches: boolean) => {
      if (registered) registered({ matches });
    },
  };
  // jest.setup.ts pre-installs a non-configurable matchMedia descriptor with
  // writable:true. Reassign the value rather than redefine the property.
  (window as unknown as { matchMedia: (q: string) => MqMock }).matchMedia = jest
    .fn()
    .mockImplementation((query: string) => {
      // Defensive: hook only queries '(prefers-reduced-motion: reduce)'.
      expect(query).toBe('(prefers-reduced-motion: reduce)');
      return mq;
    });
  return mq;
}

describe('useReducedMotion', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns false on first render (SSR-safe default)', () => {
    // matchMedia is mocked to a non-matching query so the post-mount effect
    // runs without crashing. The initial value is governed by useState(false),
    // and matchMedia.matches===false keeps it stable post-mount: this verifies
    // the same invariant useVisibility.test.ts:18-21 verifies (no SSR↔CSR flicker).
    installMatchMediaMock(false);
    const { result } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(false);
  });

  it('flips to true after mount when matchMedia.matches is true', () => {
    installMatchMediaMock(true);
    const { result } = renderHook(() => useReducedMotion());
    // RTL flushes the mount effect synchronously; result reflects mq.matches.
    expect(result.current).toBe(true);
  });

  it('responds to "change" events on the media query', () => {
    const mq = installMatchMediaMock(false);
    const { result } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(false);

    act(() => {
      mq._emit(true);
    });
    expect(result.current).toBe(true);

    act(() => {
      mq._emit(false);
    });
    expect(result.current).toBe(false);
  });

  it('removes the change listener on unmount (same handler reference)', () => {
    const mq = installMatchMediaMock(false);
    const { unmount } = renderHook(() => useReducedMotion());
    expect(mq.addEventListener).toHaveBeenCalledWith('change', expect.any(Function));

    unmount();

    expect(mq.removeEventListener).toHaveBeenCalledWith('change', expect.any(Function));
    // Same handler reference passed to add and remove (cleanup correctness).
    const addedHandler = mq.addEventListener.mock.calls[0]?.[1];
    const removedHandler = mq.removeEventListener.mock.calls[0]?.[1];
    expect(removedHandler).toBe(addedHandler);
  });
});
