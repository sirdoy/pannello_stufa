/**
 * Tests for useDeviceHistory hook
 */

import { renderHook, waitFor } from '@testing-library/react';
import { useDeviceHistory } from '../useDeviceHistory';
import type { DeviceEvent } from '@/app/components/devices/network/types';

// Mock global fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('useDeviceHistory', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  it('should fetch events on mount with default 24h range', async () => {
    const mockEvents: DeviceEvent[] = [
      {
        deviceMac: 'AA:BB:CC:DD:EE:FF',
        deviceName: 'Device 1',
        deviceIp: '192.168.1.100',
        eventType: 'connected',
        timestamp: Date.now(),
      },
    ];

    mockFetch.mockResolvedValueOnce({
      json: async () => ({
        success: true,
        data: { events: mockEvents },
      }),
    });

    const { result } = renderHook(() => useDeviceHistory());

    // Should start loading
    expect(result.current.isLoading).toBe(true);
    expect(result.current.timeRange).toBe('24h');

    // Wait for fetch to complete
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Verify fetch was called with correct params
    expect(mockFetch).toHaveBeenCalledWith('/api/fritzbox/history?range=24h');
    expect(result.current.events).toEqual(mockEvents);
    expect(result.current.isEmpty).toBe(false);
  });

  it('should re-fetch when timeRange changes', async () => {
    mockFetch.mockResolvedValue({
      json: async () => ({
        success: true,
        data: { events: [] },
      }),
    });

    const { result, rerender } = renderHook(() => useDeviceHistory());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockFetch).toHaveBeenCalledWith('/api/fritzbox/history?range=24h');

    // Change time range
    result.current.setTimeRange('7d');

    rerender();

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/fritzbox/history?range=7d');
    });
  });

  it('should re-fetch when deviceFilter changes', async () => {
    mockFetch.mockResolvedValue({
      json: async () => ({
        success: true,
        data: { events: [] },
      }),
    });

    const { result, rerender } = renderHook(() => useDeviceHistory());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockFetch).toHaveBeenCalledWith('/api/fritzbox/history?range=24h');

    // Set device filter
    result.current.setDeviceFilter('AA:BB:CC:DD:EE:FF');

    rerender();

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/fritzbox/history?range=24h&device=AA%3ABB%3ACC%3ADD%3AEE%3AFF');
    });
  });

  it('should handle fetch failure gracefully', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useDeviceHistory());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.events).toEqual([]);
    expect(result.current.isEmpty).toBe(true);
  });

  it('should handle unsuccessful API response', async () => {
    mockFetch.mockResolvedValueOnce({
      json: async () => ({
        success: false,
        error: 'Rate limited',
      }),
    });

    const { result } = renderHook(() => useDeviceHistory());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.events).toEqual([]);
    expect(result.current.isEmpty).toBe(true);
  });

  it('should set isEmpty to true when events array is empty', async () => {
    mockFetch.mockResolvedValueOnce({
      json: async () => ({
        success: true,
        data: { events: [] },
      }),
    });

    const { result } = renderHook(() => useDeviceHistory());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.events).toEqual([]);
    expect(result.current.isEmpty).toBe(true);
  });

  it('should provide refresh function that re-fetches events', async () => {
    const mockEvents: DeviceEvent[] = [
      {
        deviceMac: 'AA:BB:CC:DD:EE:FF',
        deviceName: 'Device 1',
        deviceIp: '192.168.1.100',
        eventType: 'connected',
        timestamp: Date.now(),
      },
    ];

    mockFetch.mockResolvedValue({
      json: async () => ({
        success: true,
        data: { events: mockEvents },
      }),
    });

    const { result } = renderHook(() => useDeviceHistory());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const callCountAfterMount = mockFetch.mock.calls.length;

    // Call refresh
    await result.current.refresh();

    await waitFor(() => {
      expect(mockFetch.mock.calls.length).toBe(callCountAfterMount + 1);
    });

    expect(result.current.events).toEqual(mockEvents);
  });
});
