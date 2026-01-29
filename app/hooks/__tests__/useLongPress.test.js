import { renderHook, act } from '@testing-library/react';
import { useLongPress } from '../useLongPress';

// Mock the vibration module
jest.mock('@/lib/pwa/vibration', () => ({
  vibrateShort: jest.fn(),
}));

import { vibrateShort } from '@/lib/pwa/vibration';

describe('useLongPress Hook', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Immediate Callback', () => {
    test('calls callback immediately on mousedown', () => {
      const callback = jest.fn();
      const { result } = renderHook(() => useLongPress(callback));

      act(() => {
        result.current.onMouseDown();
      });

      expect(callback).toHaveBeenCalledTimes(1);
    });

    test('calls callback immediately on touchstart', () => {
      const callback = jest.fn();
      const { result } = renderHook(() => useLongPress(callback));

      const mockEvent = { preventDefault: jest.fn() };

      act(() => {
        result.current.onTouchStart(mockEvent);
      });

      expect(callback).toHaveBeenCalledTimes(1);
      expect(mockEvent.preventDefault).toHaveBeenCalled();
    });
  });

  describe('Repeat After Delay', () => {
    test('starts repeating after delay (default 400ms)', () => {
      const callback = jest.fn();
      const { result } = renderHook(() => useLongPress(callback));

      act(() => {
        result.current.onMouseDown();
      });

      expect(callback).toHaveBeenCalledTimes(1);

      // Advance past delay
      act(() => {
        jest.advanceTimersByTime(400);
      });

      // One more call after delay starts
      expect(callback).toHaveBeenCalledTimes(1);

      // Advance one interval (default 100ms)
      act(() => {
        jest.advanceTimersByTime(100);
      });

      expect(callback).toHaveBeenCalledTimes(2);
    });

    test('uses custom delay', () => {
      const callback = jest.fn();
      const { result } = renderHook(() =>
        useLongPress(callback, { delay: 200 })
      );

      act(() => {
        result.current.onMouseDown();
      });

      expect(callback).toHaveBeenCalledTimes(1);

      // Should not repeat before custom delay
      act(() => {
        jest.advanceTimersByTime(199);
      });

      expect(callback).toHaveBeenCalledTimes(1);

      // Advance past custom delay + one interval
      act(() => {
        jest.advanceTimersByTime(101);
      });

      expect(callback).toHaveBeenCalledTimes(2);
    });
  });

  describe('Constant Interval Rate', () => {
    test('repeats at constant interval (not accelerating)', () => {
      const callback = jest.fn();
      const { result } = renderHook(() =>
        useLongPress(callback, { delay: 400, interval: 100 })
      );

      act(() => {
        result.current.onMouseDown();
      });

      // Initial call
      expect(callback).toHaveBeenCalledTimes(1);

      // After delay
      act(() => {
        jest.advanceTimersByTime(400);
      });

      // After 5 intervals (500ms more)
      act(() => {
        jest.advanceTimersByTime(500);
      });

      // Initial + 5 intervals = 6 calls
      expect(callback).toHaveBeenCalledTimes(6);

      // After 5 more intervals (500ms more)
      act(() => {
        jest.advanceTimersByTime(500);
      });

      // Initial + 10 intervals = 11 calls
      expect(callback).toHaveBeenCalledTimes(11);
    });

    test('uses custom interval', () => {
      const callback = jest.fn();
      const { result } = renderHook(() =>
        useLongPress(callback, { delay: 200, interval: 50 })
      );

      act(() => {
        result.current.onMouseDown();
      });

      // Initial call
      expect(callback).toHaveBeenCalledTimes(1);

      // After delay + 4 intervals (200 + 200 = 400ms total)
      act(() => {
        jest.advanceTimersByTime(400);
      });

      // Initial + 4 intervals = 5 calls
      expect(callback).toHaveBeenCalledTimes(5);
    });
  });

  describe('Stop on Mouse Events', () => {
    test('stops on mouseup', () => {
      const callback = jest.fn();
      const { result } = renderHook(() => useLongPress(callback));

      act(() => {
        result.current.onMouseDown();
      });

      expect(callback).toHaveBeenCalledTimes(1);

      act(() => {
        result.current.onMouseUp();
      });

      // Advance time - should not call again
      act(() => {
        jest.advanceTimersByTime(1000);
      });

      expect(callback).toHaveBeenCalledTimes(1);
    });

    test('stops on mouseleave', () => {
      const callback = jest.fn();
      const { result } = renderHook(() => useLongPress(callback));

      act(() => {
        result.current.onMouseDown();
      });

      expect(callback).toHaveBeenCalledTimes(1);

      act(() => {
        result.current.onMouseLeave();
      });

      // Advance time - should not call again
      act(() => {
        jest.advanceTimersByTime(1000);
      });

      expect(callback).toHaveBeenCalledTimes(1);
    });
  });

  describe('Stop on Touch Events', () => {
    test('stops on touchend', () => {
      const callback = jest.fn();
      const { result } = renderHook(() => useLongPress(callback));

      const mockEvent = { preventDefault: jest.fn() };

      act(() => {
        result.current.onTouchStart(mockEvent);
      });

      expect(callback).toHaveBeenCalledTimes(1);

      act(() => {
        result.current.onTouchEnd();
      });

      // Advance time - should not call again
      act(() => {
        jest.advanceTimersByTime(1000);
      });

      expect(callback).toHaveBeenCalledTimes(1);
    });

    test('stops on touchcancel', () => {
      const callback = jest.fn();
      const { result } = renderHook(() => useLongPress(callback));

      const mockEvent = { preventDefault: jest.fn() };

      act(() => {
        result.current.onTouchStart(mockEvent);
      });

      expect(callback).toHaveBeenCalledTimes(1);

      act(() => {
        result.current.onTouchCancel();
      });

      // Advance time - should not call again
      act(() => {
        jest.advanceTimersByTime(1000);
      });

      expect(callback).toHaveBeenCalledTimes(1);
    });
  });

  describe('Haptic Feedback', () => {
    test('calls vibrateShort when haptic=true (default)', () => {
      const callback = jest.fn();
      const { result } = renderHook(() => useLongPress(callback));

      act(() => {
        result.current.onMouseDown();
      });

      expect(vibrateShort).toHaveBeenCalledTimes(1);

      // Advance to trigger more callbacks
      act(() => {
        jest.advanceTimersByTime(600); // delay + 2 intervals
      });

      expect(vibrateShort).toHaveBeenCalledTimes(3);
    });

    test('does not call vibrateShort when haptic=false', () => {
      const callback = jest.fn();
      const { result } = renderHook(() =>
        useLongPress(callback, { haptic: false })
      );

      act(() => {
        result.current.onMouseDown();
      });

      expect(vibrateShort).not.toHaveBeenCalled();

      // Advance to trigger more callbacks
      act(() => {
        jest.advanceTimersByTime(600);
      });

      expect(vibrateShort).not.toHaveBeenCalled();
    });
  });

  describe('Double Start Prevention', () => {
    test('prevents double-start when already active', () => {
      const callback = jest.fn();
      const { result } = renderHook(() => useLongPress(callback));

      act(() => {
        result.current.onMouseDown();
        result.current.onMouseDown(); // Double call
      });

      // Should only be called once
      expect(callback).toHaveBeenCalledTimes(1);
    });

    test('allows restart after stop', () => {
      const callback = jest.fn();
      const { result } = renderHook(() => useLongPress(callback));

      act(() => {
        result.current.onMouseDown();
      });

      expect(callback).toHaveBeenCalledTimes(1);

      act(() => {
        result.current.onMouseUp();
      });

      act(() => {
        result.current.onMouseDown();
      });

      expect(callback).toHaveBeenCalledTimes(2);
    });
  });

  describe('Callback Updates', () => {
    test('uses latest callback without restarting', () => {
      let value = 0;
      const callback1 = jest.fn(() => (value = 1));
      const callback2 = jest.fn(() => (value = 2));

      const { result, rerender } = renderHook(
        ({ cb }) => useLongPress(cb),
        { initialProps: { cb: callback1 } }
      );

      act(() => {
        result.current.onMouseDown();
      });

      expect(value).toBe(1);

      // Update callback
      rerender({ cb: callback2 });

      // Advance to next interval
      act(() => {
        jest.advanceTimersByTime(500);
      });

      // Should use new callback
      expect(value).toBe(2);
    });
  });

  describe('Event Handler References', () => {
    test('returns stable event handler references', () => {
      const callback = jest.fn();
      const { result, rerender } = renderHook(() => useLongPress(callback));

      const firstHandlers = result.current;
      rerender();
      const secondHandlers = result.current;

      expect(firstHandlers.onMouseDown).toBe(secondHandlers.onMouseDown);
      expect(firstHandlers.onMouseUp).toBe(secondHandlers.onMouseUp);
      expect(firstHandlers.onMouseLeave).toBe(secondHandlers.onMouseLeave);
      expect(firstHandlers.onTouchStart).toBe(secondHandlers.onTouchStart);
      expect(firstHandlers.onTouchEnd).toBe(secondHandlers.onTouchEnd);
      expect(firstHandlers.onTouchCancel).toBe(secondHandlers.onTouchCancel);
    });
  });
});
