import { renderHook, waitFor, act } from '@testing-library/react';
import { useFritzServiceDiscovery } from '../useFritzServiceDiscovery';

describe('useFritzServiceDiscovery', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('fetches services on mount (success)', async () => {
    const sample = [
      { name: 'WANIPConnection', type: 'urn:dslforum-org:service:WANIPConnection:1', url: '/upnp/control/wanipconn1' },
    ];

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ discovery: { services: sample } }),
    }) as jest.Mock;

    const { result } = renderHook(() => useFritzServiceDiscovery());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.services).toHaveLength(1);
    expect(result.current.services[0]!.name).toBe('WANIPConnection');
    expect(result.current.error).toBeNull();
  });

  it('normalizes a raw backend services dict (keyed by service name) into an array', async () => {
    // Backend routes.py get_service_discovery shape
    const backendServices = {
      'WANIPConnection:1': {
        version: '1',
        service_type: 'urn:schemas-upnp-org:service:WANIPConnection:1',
        control_url: '/igdupnp/control/WANIPConn1',
        actions: [],
        action_count: 12,
      },
    };

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ discovery: { model: 'FRITZ!Box', service_count: 1, services: backendServices } }),
    }) as jest.Mock;

    const { result } = renderHook(() => useFritzServiceDiscovery());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBeNull();
    expect(result.current.services).toEqual([
      { name: 'WANIPConnection:1', type: 'urn:schemas-upnp-org:service:WANIPConnection:1', url: '/igdupnp/control/WANIPConn1' },
    ]);
  });

  it('sets error on non-OK response (500)', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: () => Promise.resolve({}),
    }) as jest.Mock;

    const { result } = renderHook(() => useFritzServiceDiscovery());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toContain('500');
    expect(result.current.services).toEqual([]);
  });

  it('refresh() re-fetches and updates services', async () => {
    const initial = [{ name: 'A', type: 'urn:a', url: '/a' }];
    const updated = [
      { name: 'B', type: 'urn:b', url: '/b' },
      { name: 'C', type: 'urn:c', url: '/c' },
    ];

    const fetchMock = jest
      .fn()
      .mockImplementation(() =>
        Promise.resolve({ ok: true, json: () => Promise.resolve({ discovery: { services: initial } }) })
      );
    global.fetch = fetchMock as jest.Mock;

    const { result } = renderHook(() => useFritzServiceDiscovery());

    // Wait for mount fetch to settle.
    await waitFor(() => expect(result.current.loading).toBe(false));

    // Now switch the mock to return the `updated` list and manually call refresh.
    fetchMock.mockImplementation(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve({ discovery: { services: updated } }) })
    );

    await act(async () => {
      await result.current.refresh();
    });

    expect(result.current.services).toHaveLength(2);
    expect(result.current.services[0]!.name).toBe('B');
  });

  it('network error (rejected fetch) sets error without throwing', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('Network')) as jest.Mock;

    const { result } = renderHook(() => useFritzServiceDiscovery());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toContain('Network');
    expect(result.current.services).toEqual([]);
  });
});
