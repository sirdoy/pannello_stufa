/**
 * @jest-environment jsdom
 */

import { renderHook, act } from '@testing-library/react';
import { useSyncedState } from '../useSyncedState';

describe('useSyncedState', () => {
  it('starts from the source value', () => {
    const { result } = renderHook(() => useSyncedState(5));
    expect(result.current[0]).toBe(5);
  });

  it('keeps local edits while the source is unchanged', () => {
    const { result, rerender } = renderHook(({ src }) => useSyncedState(src), {
      initialProps: { src: 5 },
    });
    act(() => result.current[1](8));
    rerender({ src: 5 });
    expect(result.current[0]).toBe(8);
  });

  it('resets to the source when it changes', () => {
    const { result, rerender } = renderHook(({ src }) => useSyncedState(src), {
      initialProps: { src: 5 },
    });
    act(() => result.current[1](8));
    rerender({ src: 3 });
    expect(result.current[0]).toBe(3);
  });

  it('drops source changes while paused, applies the next one after resuming', () => {
    const { result, rerender } = renderHook(
      ({ src, paused }) => useSyncedState(src, paused),
      { initialProps: { src: 5, paused: true } }
    );
    act(() => result.current[1](8));
    rerender({ src: 3, paused: true });
    expect(result.current[0]).toBe(8);
    rerender({ src: 3, paused: false });
    expect(result.current[0]).toBe(8);
    rerender({ src: 4, paused: false });
    expect(result.current[0]).toBe(4);
  });
});
