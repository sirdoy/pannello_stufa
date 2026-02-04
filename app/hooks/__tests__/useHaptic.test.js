import { renderHook, act } from '@testing-library/react';
import { useHaptic } from '../useHaptic';
import * as vibration from '@/lib/pwa/vibration';

// Mock vibration module
jest.mock('@/lib/pwa/vibration', () => ({
  vibrateShort: jest.fn(),
  vibrateSuccess: jest.fn(),
  vibrateWarning: jest.fn(),
  vibrateError: jest.fn(),
  isVibrationSupported: jest.fn(() => true),
}));

describe('useHaptic', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return trigger function and isSupported', () => {
    const { result } = renderHook(() => useHaptic());

    expect(result.current).toHaveProperty('trigger');
    expect(result.current).toHaveProperty('isSupported');
    expect(typeof result.current.trigger).toBe('function');
    expect(typeof result.current.isSupported).toBe('boolean');
  });

  it('should call vibrateShort for "short" pattern', () => {
    const { result } = renderHook(() => useHaptic('short'));

    act(() => {
      result.current.trigger();
    });

    expect(vibration.vibrateShort).toHaveBeenCalledTimes(1);
  });

  it('should call vibrateSuccess for "success" pattern', () => {
    const { result } = renderHook(() => useHaptic('success'));

    act(() => {
      result.current.trigger();
    });

    expect(vibration.vibrateSuccess).toHaveBeenCalledTimes(1);
  });

  it('should call vibrateWarning for "warning" pattern', () => {
    const { result } = renderHook(() => useHaptic('warning'));

    act(() => {
      result.current.trigger();
    });

    expect(vibration.vibrateWarning).toHaveBeenCalledTimes(1);
  });

  it('should call vibrateError for "error" pattern', () => {
    const { result } = renderHook(() => useHaptic('error'));

    act(() => {
      result.current.trigger();
    });

    expect(vibration.vibrateError).toHaveBeenCalledTimes(1);
  });

  it('should default to vibrateShort for unknown pattern', () => {
    const { result } = renderHook(() => useHaptic('unknown'));

    act(() => {
      result.current.trigger();
    });

    expect(vibration.vibrateShort).toHaveBeenCalledTimes(1);
  });

  it('should default to "short" pattern when no pattern provided', () => {
    const { result } = renderHook(() => useHaptic());

    act(() => {
      result.current.trigger();
    });

    expect(vibration.vibrateShort).toHaveBeenCalledTimes(1);
  });

  it('should detect vibration support', () => {
    const { result } = renderHook(() => useHaptic());

    expect(result.current.isSupported).toBe(true);
    expect(vibration.isVibrationSupported).toHaveBeenCalled();
  });
});
