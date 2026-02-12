/**
 * @jest-environment jsdom
 */

import { renderHook, act } from '@testing-library/react';
import { useVisibility } from '../useVisibility';

describe('useVisibility', () => {
  beforeEach(() => {
    // Reset document.hidden to false (visible by default)
    Object.defineProperty(document, 'hidden', {
      writable: true,
      configurable: true,
      value: false,
    });
  });

  it('returns true initially when tab is visible', () => {
    const { result } = renderHook(() => useVisibility());
    expect(result.current).toBe(true);
  });

  it('returns false when document.hidden is true and visibilitychange fires', () => {
    const { result } = renderHook(() => useVisibility());
    expect(result.current).toBe(true);

    // Simulate tab becoming hidden
    act(() => {
      Object.defineProperty(document, 'hidden', {
        writable: true,
        configurable: true,
        value: true,
      });
      document.dispatchEvent(new Event('visibilitychange'));
    });

    expect(result.current).toBe(false);
  });

  it('returns true again when document.hidden becomes false and visibilitychange fires', () => {
    // Start with hidden tab
    Object.defineProperty(document, 'hidden', {
      writable: true,
      configurable: true,
      value: true,
    });

    const { result } = renderHook(() => useVisibility());
    expect(result.current).toBe(false);

    // Tab becomes visible
    act(() => {
      Object.defineProperty(document, 'hidden', {
        writable: true,
        configurable: true,
        value: false,
      });
      document.dispatchEvent(new Event('visibilitychange'));
    });

    expect(result.current).toBe(true);
  });

  it('cleans up event listener on unmount', () => {
    const removeEventListenerSpy = jest.spyOn(document, 'removeEventListener');
    const { unmount } = renderHook(() => useVisibility());

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      'visibilitychange',
      expect.any(Function)
    );

    removeEventListenerSpy.mockRestore();
  });
});
