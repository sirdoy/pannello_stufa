/**
 * Tests for formatRelativeTime + useRelativeTime
 *
 * @jest-environment jsdom
 */

import { renderHook, act } from '@testing-library/react';
import { formatRelativeTime, useRelativeTime } from '../useRelativeTime';

describe('formatRelativeTime', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    act(() => { jest.runOnlyPendingTimers(); });
    jest.useRealTimers();
  });

  it('returns "Adesso" for timestamps less than 5 seconds ago', () => {
    const now = Date.now();
    expect(formatRelativeTime(now)).toBe('Adesso');
    expect(formatRelativeTime(now - 4_000)).toBe('Adesso');
  });

  it('returns seconds string for 30 seconds ago', () => {
    const now = Date.now();
    expect(formatRelativeTime(now - 30_000)).toBe('30s fa');
  });

  it('returns minutes string for 2 minutes ago', () => {
    const now = Date.now();
    expect(formatRelativeTime(now - 120_000)).toBe('2m fa');
  });

  it('returns hours string for 1.5 hours ago', () => {
    const now = Date.now();
    expect(formatRelativeTime(now - 5_400_000)).toBe('1h fa');
  });

  it('returns "5s fa" for exactly 5 seconds ago', () => {
    const now = Date.now();
    expect(formatRelativeTime(now - 5_000)).toBe('5s fa');
  });
});

describe('useRelativeTime', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    act(() => { jest.runOnlyPendingTimers(); });
    jest.useRealTimers();
  });

  it('returns null when tsMs is null', () => {
    const { result } = renderHook(() => useRelativeTime(null));
    expect(result.current).toBeNull();
  });

  it('returns "Adesso" initially for a current timestamp', () => {
    const now = Date.now();
    const { result } = renderHook(() => useRelativeTime(now));
    expect(result.current).toBe('Adesso');
  });

  it('re-renders with updated value after 10 seconds', () => {
    const tsMs = Date.now() - 3_000; // 3 seconds ago => "Adesso"
    const { result } = renderHook(() => useRelativeTime(tsMs));
    expect(result.current).toBe('Adesso');

    // Advance time by 10s — now tsMs is 13s ago => should show "13s fa"
    act(() => {
      jest.advanceTimersByTime(10_000);
    });

    expect(result.current).toBe('13s fa');
  });

  it('clears interval on unmount', () => {
    const clearIntervalSpy = jest.spyOn(global, 'clearInterval');
    const { unmount } = renderHook(() => useRelativeTime(Date.now()));

    unmount();

    expect(clearIntervalSpy).toHaveBeenCalled();
    clearIntervalSpy.mockRestore();
  });

  it('returns null again when tsMs transitions to null', () => {
    const { result, rerender } = renderHook(
      ({ ts }: { ts: number | null }) => useRelativeTime(ts),
      { initialProps: { ts: Date.now() } as { ts: number | null } },
    );
    expect(result.current).toBe('Adesso');

    rerender({ ts: null });
    expect(result.current).toBeNull();
  });
});
