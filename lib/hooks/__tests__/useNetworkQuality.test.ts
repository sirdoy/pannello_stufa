/**
 * @jest-environment jsdom
 */

import { renderHook, act } from '@testing-library/react';
import { useNetworkQuality } from '../useNetworkQuality';
import type { NetworkQuality } from '../useNetworkQuality';

describe('useNetworkQuality', () => {
  let mockConnection: {
    effectiveType: string;
    addEventListener: jest.Mock;
    removeEventListener: jest.Mock;
  };

  beforeEach(() => {
    // Remove any existing navigator.connection mock
    if ('connection' in navigator) {
      delete (navigator as any).connection;
    }
  });

  afterEach(() => {
    // Clean up mock
    if ('connection' in navigator) {
      delete (navigator as any).connection;
    }
  });

  it('returns "unknown" when navigator.connection is not available', () => {
    const { result } = renderHook(() => useNetworkQuality());
    expect(result.current).toBe('unknown');
  });

  it('returns "fast" when effectiveType is "4g"', () => {
    mockConnection = {
      effectiveType: '4g',
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    };
    Object.defineProperty(navigator, 'connection', {
      writable: true,
      configurable: true,
      value: mockConnection,
    });

    const { result } = renderHook(() => useNetworkQuality());
    expect(result.current).toBe('fast');
  });

  it('returns "fast" when effectiveType is "3g"', () => {
    mockConnection = {
      effectiveType: '3g',
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    };
    Object.defineProperty(navigator, 'connection', {
      writable: true,
      configurable: true,
      value: mockConnection,
    });

    const { result } = renderHook(() => useNetworkQuality());
    expect(result.current).toBe('fast');
  });

  it('returns "slow" when effectiveType is "2g"', () => {
    mockConnection = {
      effectiveType: '2g',
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    };
    Object.defineProperty(navigator, 'connection', {
      writable: true,
      configurable: true,
      value: mockConnection,
    });

    const { result } = renderHook(() => useNetworkQuality());
    expect(result.current).toBe('slow');
  });

  it('returns "slow" when effectiveType is "slow-2g"', () => {
    mockConnection = {
      effectiveType: 'slow-2g',
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    };
    Object.defineProperty(navigator, 'connection', {
      writable: true,
      configurable: true,
      value: mockConnection,
    });

    const { result } = renderHook(() => useNetworkQuality());
    expect(result.current).toBe('slow');
  });

  it('updates when connection change event fires', () => {
    let changeHandler: (() => void) | null = null;

    mockConnection = {
      effectiveType: '4g',
      addEventListener: jest.fn((event: string, handler: () => void) => {
        if (event === 'change') {
          changeHandler = handler;
        }
      }),
      removeEventListener: jest.fn(),
    };
    Object.defineProperty(navigator, 'connection', {
      writable: true,
      configurable: true,
      value: mockConnection,
    });

    const { result } = renderHook(() => useNetworkQuality());
    expect(result.current).toBe('fast');

    // Simulate connection change to 2g
    act(() => {
      mockConnection.effectiveType = '2g';
      if (changeHandler) {
        changeHandler();
      }
    });

    expect(result.current).toBe('slow');
  });

  it('cleans up event listener on unmount', () => {
    mockConnection = {
      effectiveType: '4g',
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    };
    Object.defineProperty(navigator, 'connection', {
      writable: true,
      configurable: true,
      value: mockConnection,
    });

    const { unmount } = renderHook(() => useNetworkQuality());
    unmount();

    expect(mockConnection.removeEventListener).toHaveBeenCalledWith(
      'change',
      expect.any(Function)
    );
  });
});
