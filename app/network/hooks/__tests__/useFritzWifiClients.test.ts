import { renderHook, waitFor, act } from '@testing-library/react';
import { useFritzWifiClients } from '../useFritzWifiClients';

let mockAdaptivePollingInterval: number | null = null;

// Mock useAdaptivePolling to capture interval and call callback immediately
jest.mock('@/lib/hooks/useAdaptivePolling', () => ({
  useAdaptivePolling: ({ callback, interval }: { callback: () => void; interval: number | null }) => {
    mockAdaptivePollingInterval = interval;
    if (interval !== null) {
      callback();
    }
  },
}));

// Mock useVisibility to return true
jest.mock('@/lib/hooks/useVisibility', () => ({
  useVisibility: () => true,
}));

describe('useFritzWifiClients', () => {
  const mockClients = [
    {
      hostname: 'laptop',
      mac: 'AA:BB:CC:DD:EE:FF',
      ip: '192.168.1.100',
      band: '5GHz',
      ssid: 'HomeWifi',
      signal_strength: -55,
      link_speed_mbps: 300,
      is_active: true,
    },
    {
      hostname: 'phone',
      mac: 'FF:EE:DD:CC:BB:AA',
      ip: '192.168.1.101',
      band: '2.4GHz',
      ssid: 'HomeWifi',
      signal_strength: -70,
      link_speed_mbps: 54,
      is_active: true,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockAdaptivePollingInterval = null;
  });

  it('fetches with no band param when band is "all"', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ clients: { items: mockClients, total: 2 } }),
    }) as jest.Mock;

    renderHook(() => useFritzWifiClients());

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });

    const fetchUrl = (global.fetch as jest.Mock).mock.calls[0][0] as string;
    expect(fetchUrl).toContain('/api/v1/fritzbox/wifi/clients');
    expect(fetchUrl).not.toContain('band=');
    expect(fetchUrl).toContain('limit=1000');
  });

  it('fetches with band param when band is "5GHz"', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ clients: { items: [], total: 0 } }),
    }) as jest.Mock;

    const { result } = renderHook(() => useFritzWifiClients());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Clear mock to capture next call
    (global.fetch as jest.Mock).mockClear();

    act(() => {
      result.current.setBand('5GHz');
    });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });

    const fetchUrl = (global.fetch as jest.Mock).mock.calls[0][0] as string;
    expect(fetchUrl).toContain('band=5GHz');
  });

  it('stops polling (interval: null) when paused', () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ clients: { items: [], total: 0 } }),
    }) as jest.Mock;

    renderHook(() => useFritzWifiClients({ paused: true }));

    expect(mockAdaptivePollingInterval).toBeNull();
  });

  it('sets clients from json.clients.items on success', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ clients: { items: mockClients, total: 2 } }),
    }) as jest.Mock;

    const { result } = renderHook(() => useFritzWifiClients());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.clients).toHaveLength(2);
    expect(result.current.total).toBe(2);
  });

  it('exposes setBand to change filter', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ clients: { items: [], total: 0 } }),
    }) as jest.Mock;

    const { result } = renderHook(() => useFritzWifiClients());

    expect(result.current.band).toBe('all');

    act(() => {
      result.current.setBand('2.4GHz');
    });

    expect(result.current.band).toBe('2.4GHz');
  });
});
