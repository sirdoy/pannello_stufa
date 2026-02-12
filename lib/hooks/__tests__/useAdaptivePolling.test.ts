/**
 * @jest-environment jsdom
 */

import { renderHook, act } from '@testing-library/react';
import { useAdaptivePolling } from '../useAdaptivePolling';
import { useVisibility } from '../useVisibility';

jest.mock('../useVisibility');

const mockUseVisibility = useVisibility as jest.MockedFunction<typeof useVisibility>;

describe('useAdaptivePolling', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    // Default: tab is visible
    mockUseVisibility.mockReturnValue(true);
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it('calls callback immediately on mount when immediate is true (default)', () => {
    const callback = jest.fn();

    renderHook(() =>
      useAdaptivePolling({
        callback,
        interval: 1000,
      })
    );

    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('does not call callback on mount when immediate is false', () => {
    const callback = jest.fn();

    renderHook(() =>
      useAdaptivePolling({
        callback,
        interval: 1000,
        immediate: false,
      })
    );

    expect(callback).toHaveBeenCalledTimes(0);
  });

  it('calls callback at regular interval', () => {
    const callback = jest.fn();

    renderHook(() =>
      useAdaptivePolling({
        callback,
        interval: 1000,
        immediate: false,
      })
    );

    expect(callback).toHaveBeenCalledTimes(0);

    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(callback).toHaveBeenCalledTimes(1);

    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(callback).toHaveBeenCalledTimes(2);

    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(callback).toHaveBeenCalledTimes(3);
  });

  it('stops calling when interval changes to null', () => {
    const callback = jest.fn();

    const { rerender } = renderHook(
      ({ interval }) =>
        useAdaptivePolling({
          callback,
          interval,
          immediate: false,
        }),
      { initialProps: { interval: 1000 } }
    );

    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(callback).toHaveBeenCalledTimes(1);

    // Change interval to null (pause)
    rerender({ interval: null });

    act(() => {
      jest.advanceTimersByTime(5000);
    });
    // Should not call again
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('pauses polling when tab becomes hidden', () => {
    const callback = jest.fn();

    const { rerender } = renderHook(() =>
      useAdaptivePolling({
        callback,
        interval: 1000,
        immediate: false,
      })
    );

    // First interval tick
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(callback).toHaveBeenCalledTimes(1);

    // Tab becomes hidden
    mockUseVisibility.mockReturnValue(false);
    rerender();

    // Wait for multiple intervals - callback should not be called
    act(() => {
      jest.advanceTimersByTime(5000);
    });
    expect(callback).toHaveBeenCalledTimes(1); // Still 1
  });

  it('resumes polling and calls immediately when tab becomes visible again', () => {
    const callback = jest.fn();

    // Start with hidden tab
    mockUseVisibility.mockReturnValue(false);

    const { rerender } = renderHook(() =>
      useAdaptivePolling({
        callback,
        interval: 1000,
        immediate: false,
      })
    );

    // No calls while hidden
    act(() => {
      jest.advanceTimersByTime(3000);
    });
    expect(callback).toHaveBeenCalledTimes(0);

    // Tab becomes visible
    mockUseVisibility.mockReturnValue(true);
    rerender();

    // Should call immediately (without waiting for interval)
    expect(callback).toHaveBeenCalledTimes(1);

    // Then continue regular polling
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(callback).toHaveBeenCalledTimes(2);
  });

  it('does not pause when alwaysActive is true even if tab hidden', () => {
    const callback = jest.fn();

    // Start with hidden tab
    mockUseVisibility.mockReturnValue(false);

    renderHook(() =>
      useAdaptivePolling({
        callback,
        interval: 1000,
        immediate: false,
        alwaysActive: true,
      })
    );

    // Should still poll even though tab is hidden
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(callback).toHaveBeenCalledTimes(1);

    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(callback).toHaveBeenCalledTimes(2);
  });

  it('cleans up interval on unmount', () => {
    const callback = jest.fn();

    const { unmount } = renderHook(() =>
      useAdaptivePolling({
        callback,
        interval: 1000,
        immediate: false,
      })
    );

    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(callback).toHaveBeenCalledTimes(1);

    unmount();

    // After unmount, interval should be cleared
    act(() => {
      jest.advanceTimersByTime(5000);
    });
    // Should not call again after unmount
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('uses latest callback (no stale closures)', () => {
    let callCount = 0;
    const callback1 = jest.fn(() => {
      callCount = callCount + 1;
    });
    const callback2 = jest.fn(() => {
      callCount = callCount + 10;
    });

    const { rerender } = renderHook(
      ({ cb }) =>
        useAdaptivePolling({
          callback: cb,
          interval: 1000,
          immediate: false,
        }),
      { initialProps: { cb: callback1 } }
    );

    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(callback1).toHaveBeenCalledTimes(1);
    expect(callback2).toHaveBeenCalledTimes(0);
    expect(callCount).toBe(1);

    // Update callback to callback2
    rerender({ cb: callback2 });

    act(() => {
      jest.advanceTimersByTime(1000);
    });
    // New callback should be called
    expect(callback1).toHaveBeenCalledTimes(1); // Old not called again
    expect(callback2).toHaveBeenCalledTimes(1); // New called
    expect(callCount).toBe(11); // 1 + 10
  });

  it('does not call immediately on visibility restore when alwaysActive is true', () => {
    const callback = jest.fn();

    // Start visible with alwaysActive
    mockUseVisibility.mockReturnValue(true);

    const { rerender } = renderHook(() =>
      useAdaptivePolling({
        callback,
        interval: 1000,
        immediate: false,
        alwaysActive: true,
      })
    );

    // First interval call
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(callback).toHaveBeenCalledTimes(1);

    // Tab becomes hidden (but alwaysActive means still polling)
    mockUseVisibility.mockReturnValue(false);
    rerender();

    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(callback).toHaveBeenCalledTimes(2);

    // Tab becomes visible again
    mockUseVisibility.mockReturnValue(true);
    rerender();

    // Should NOT call immediately (because alwaysActive - was never paused)
    // Next call is on next interval
    expect(callback).toHaveBeenCalledTimes(2);

    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(callback).toHaveBeenCalledTimes(3);
  });
});
