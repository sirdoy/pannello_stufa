import { act, renderHook } from '@testing-library/react';
import { CARD_READY_TIMEOUT_MS, useCardReady } from '../useCardReady';

describe('useCardReady (ROADMAP M15)', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  test('false until ready, true once ready', () => {
    const { result, rerender } = renderHook(({ ready }) => useCardReady(ready), {
      initialProps: { ready: false },
    });
    expect(result.current).toBe(false);
    rerender({ ready: true });
    expect(result.current).toBe(true);
  });

  test('latches: a later reload (ready=false) does not bring the skeleton back', () => {
    const { result, rerender } = renderHook(({ ready }) => useCardReady(ready), {
      initialProps: { ready: true },
    });
    rerender({ ready: false });
    expect(result.current).toBe(true);
  });

  test('safety timeout: becomes true when the first data never arrives', () => {
    const { result } = renderHook(() => useCardReady(false));
    act(() => {
      jest.advanceTimersByTime(CARD_READY_TIMEOUT_MS - 1);
    });
    expect(result.current).toBe(false);
    act(() => {
      jest.advanceTimersByTime(1);
    });
    expect(result.current).toBe(true);
  });
});
