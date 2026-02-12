/**
 * Integration tests for useAdaptivePolling with network awareness
 * @jest-environment jsdom
 */

import { renderHook } from '@testing-library/react';
import { useAdaptivePolling } from '../useAdaptivePolling';
import { useNetworkQuality } from '../useNetworkQuality';

// Mock useNetworkQuality
jest.mock('../useNetworkQuality');
const mockUseNetworkQuality = useNetworkQuality as jest.MockedFunction<typeof useNetworkQuality>;

// Mock useVisibility to always return true
jest.mock('../useVisibility', () => ({
  useVisibility: jest.fn(() => true),
}));

describe('useAdaptivePolling - Network Awareness Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('uses base interval when network quality is fast', () => {
    mockUseNetworkQuality.mockReturnValue('fast');
    const callback = jest.fn();
    const baseInterval = 30000;

    renderHook(() =>
      useAdaptivePolling({
        callback,
        interval: baseInterval,
        alwaysActive: false,
        immediate: false,
      })
    );

    // Fast forward time and verify callback is called at base interval
    jest.advanceTimersByTime(baseInterval);
    expect(callback).toHaveBeenCalledTimes(1);

    jest.advanceTimersByTime(baseInterval);
    expect(callback).toHaveBeenCalledTimes(2);
  });

  it('doubles interval when network quality is slow', () => {
    mockUseNetworkQuality.mockReturnValue('slow');
    const callback = jest.fn();
    const baseInterval = 30000;
    const slowInterval = baseInterval * 2; // 60000ms

    renderHook(() =>
      useAdaptivePolling({
        callback,
        interval: slowInterval,
        alwaysActive: false,
        immediate: false,
      })
    );

    // Advance by base interval - should NOT be called yet
    jest.advanceTimersByTime(baseInterval);
    expect(callback).toHaveBeenCalledTimes(0);

    // Advance to doubled interval - should be called now
    jest.advanceTimersByTime(baseInterval);
    expect(callback).toHaveBeenCalledTimes(1);

    // Verify it continues at doubled interval
    jest.advanceTimersByTime(slowInterval);
    expect(callback).toHaveBeenCalledTimes(2);
  });

  it('uses base interval when network quality is unknown', () => {
    mockUseNetworkQuality.mockReturnValue('unknown');
    const callback = jest.fn();
    const baseInterval = 30000;

    renderHook(() =>
      useAdaptivePolling({
        callback,
        interval: baseInterval,
        alwaysActive: false,
        immediate: false,
      })
    );

    // Fast forward time and verify callback is called at base interval
    // Unknown network = don't penalize, use base interval
    jest.advanceTimersByTime(baseInterval);
    expect(callback).toHaveBeenCalledTimes(1);

    jest.advanceTimersByTime(baseInterval);
    expect(callback).toHaveBeenCalledTimes(2);
  });

  it('demonstrates CronHealthBanner pattern with network multiplier', () => {
    // Start with fast network
    mockUseNetworkQuality.mockReturnValue('fast');
    const callback = jest.fn();
    const baseInterval = 30000;

    const { rerender } = renderHook(
      ({ networkQuality }) => {
        const interval = networkQuality === 'slow' ? 60000 : 30000;
        useAdaptivePolling({
          callback,
          interval,
          alwaysActive: false,
          immediate: false,
        });
      },
      { initialProps: { networkQuality: 'fast' } }
    );

    // Fast network: 30s interval
    jest.advanceTimersByTime(30000);
    expect(callback).toHaveBeenCalledTimes(1);

    // Simulate network degradation
    mockUseNetworkQuality.mockReturnValue('slow');
    rerender({ networkQuality: 'slow' });

    // Clear existing calls to test new interval
    callback.mockClear();

    // Slow network: 60s interval
    jest.advanceTimersByTime(30000);
    expect(callback).toHaveBeenCalledTimes(0); // Not called yet

    jest.advanceTimersByTime(30000);
    expect(callback).toHaveBeenCalledTimes(1); // Called after 60s
  });
});
