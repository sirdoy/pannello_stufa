/**
 * Tests for useDeviceStaleness hook
 *
 * @jest-environment jsdom
 */

import { renderHook, waitFor } from '@testing-library/react';
import { useDeviceStaleness } from '../useDeviceStaleness';
import * as stalenessDetector from '@/lib/pwa/stalenessDetector';

// Mock staleness detector
jest.mock('@/lib/pwa/stalenessDetector');

describe('useDeviceStaleness', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('returns null initially', () => {
    jest.mocked(stalenessDetector.getDeviceStaleness).mockResolvedValue({
      isStale: false,
      cachedAt: new Date(),
      ageSeconds: 5,
    });

    const { result } = renderHook(() => useDeviceStaleness('stove'));

    expect(result.current).toBeNull();
  });

  it('calls getDeviceStaleness on mount', async () => {
    const mockStaleness = {
      isStale: false,
      cachedAt: new Date(),
      ageSeconds: 5,
    };
    jest.mocked(stalenessDetector.getDeviceStaleness).mockResolvedValue(mockStaleness);

    renderHook(() => useDeviceStaleness('stove'));

    await waitFor(() => {
      expect(stalenessDetector.getDeviceStaleness).toHaveBeenCalledWith('stove');
    });
  });

  it('updates state after initial fetch', async () => {
    const mockStaleness = {
      isStale: false,
      cachedAt: new Date(),
      ageSeconds: 5,
    };
    jest.mocked(stalenessDetector.getDeviceStaleness).mockResolvedValue(mockStaleness);

    const { result } = renderHook(() => useDeviceStaleness('stove'));

    await waitFor(() => {
      expect(result.current).toEqual(mockStaleness);
    });
  });

  it('polls every 5 seconds', async () => {
    const mockStaleness = {
      isStale: false,
      cachedAt: new Date(),
      ageSeconds: 5,
    };
    jest.mocked(stalenessDetector.getDeviceStaleness).mockResolvedValue(mockStaleness);

    renderHook(() => useDeviceStaleness('stove'));

    // Initial call
    await waitFor(() => {
      expect(stalenessDetector.getDeviceStaleness).toHaveBeenCalled();
    });
    const initialCalls = jest.mocked(stalenessDetector.getDeviceStaleness).mock.calls.length;

    // Advance 5 seconds
    jest.advanceTimersByTime(5000);

    await waitFor(() => {
      expect(stalenessDetector.getDeviceStaleness).toHaveBeenCalledTimes(initialCalls + 1);
    });

    // Advance another 5 seconds
    jest.advanceTimersByTime(5000);

    await waitFor(() => {
      expect(stalenessDetector.getDeviceStaleness).toHaveBeenCalledTimes(initialCalls + 2);
    });
  });

  it('updates state on each poll', async () => {
    let ageSeconds = 5;
    jest.mocked(stalenessDetector.getDeviceStaleness).mockImplementation(async () => ({
      isStale: ageSeconds > 30,
      cachedAt: new Date(Date.now() - ageSeconds * 1000),
      ageSeconds,
    }));

    const { result } = renderHook(() => useDeviceStaleness('stove'));

    // Wait for initial fetch
    await waitFor(() => {
      expect(result.current?.ageSeconds).toBe(5);
    });

    // Update age and advance timer
    ageSeconds = 10;
    jest.advanceTimersByTime(5000);

    await waitFor(() => {
      expect(result.current?.ageSeconds).toBe(10);
    });

    // Update to stale
    ageSeconds = 60;
    jest.advanceTimersByTime(5000);

    await waitFor(() => {
      expect(result.current?.ageSeconds).toBe(60);
      expect(result.current?.isStale).toBe(true);
    });
  });

  it('cleans up interval on unmount', async () => {
    const mockStaleness = {
      isStale: false,
      cachedAt: new Date(),
      ageSeconds: 5,
    };
    jest.mocked(stalenessDetector.getDeviceStaleness).mockResolvedValue(mockStaleness);

    const { unmount } = renderHook(() => useDeviceStaleness('stove'));

    await waitFor(() => {
      expect(stalenessDetector.getDeviceStaleness).toHaveBeenCalled();
    });

    const callsBeforeUnmount = jest.mocked(stalenessDetector.getDeviceStaleness).mock.calls.length;

    unmount();

    // Advance time after unmount
    jest.advanceTimersByTime(10000);

    // Should not call again after unmount
    expect(stalenessDetector.getDeviceStaleness).toHaveBeenCalledTimes(callsBeforeUnmount);
  });

  it('handles different device IDs', async () => {
    const mockStaleness = {
      isStale: false,
      cachedAt: new Date(),
      ageSeconds: 5,
    };
    jest.mocked(stalenessDetector.getDeviceStaleness).mockResolvedValue(mockStaleness);

    const { rerender } = renderHook(
      ({ deviceId }) => useDeviceStaleness(deviceId),
      { initialProps: { deviceId: 'stove' } }
    );

    await waitFor(() => {
      expect(stalenessDetector.getDeviceStaleness).toHaveBeenCalledWith('stove');
    });

    // Change device ID
    rerender({ deviceId: 'thermostat' });

    await waitFor(() => {
      expect(stalenessDetector.getDeviceStaleness).toHaveBeenCalledWith('thermostat');
    });
  });

  it('handles errors gracefully', async () => {
    jest.mocked(stalenessDetector.getDeviceStaleness).mockRejectedValue(
      new Error('IndexedDB error')
    );

    const { result } = renderHook(() => useDeviceStaleness('stove'));

    // Should remain null on error
    await waitFor(() => {
      expect(stalenessDetector.getDeviceStaleness).toHaveBeenCalled();
    });

    expect(result.current).toBeNull();
  });
});
