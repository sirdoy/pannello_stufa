/**
 * Tests for useTuyaCommands Hook
 *
 * Validates togglePlug, setTimer, cancelTimer command functions.
 * Verifies correct URLs, request bodies, optimistic returns, and error handling.
 */

import { renderHook, act } from '@testing-library/react';
import type { TuyaPlugMutation } from '@/types/tuyaProxy';

describe('useTuyaCommands', () => {
  let useTuyaCommands: typeof import('../useTuyaCommands').useTuyaCommands;

  beforeAll(async () => {
    const mod = await import('../useTuyaCommands');
    useTuyaCommands = mod.useTuyaCommands;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  // Mock mutation response fixture
  const mockMutation: TuyaPlugMutation = {
    device_id: 'bf_test_plug_001',
    switch_on: true,
    power_w: 45.2,
    voltage_v: 230.1,
    current_ma: 196.5,
    energy_kwh: 1.23,
    countdown_s: 0,
    data_freshness: 'LIVE',
    last_polled_at: 1711800000,
    custom_name: 'Presa Soggiorno',
    device_type: 'smart_plug',
    data_confirmed: true,
  };

  function makeFetchMock(response: TuyaPlugMutation, ok = true) {
    return jest.fn().mockResolvedValue({
      ok,
      json: () => Promise.resolve(response),
    });
  }

  // ---------------------------------------------------------------------------
  // togglePlug
  // ---------------------------------------------------------------------------

  it('togglePlug calls POST /api/tuya/plugs/{deviceId}/state with { on: !currentState }', async () => {
    (global.fetch as jest.Mock) = makeFetchMock(mockMutation);

    const { result } = renderHook(() => useTuyaCommands());

    let mutation: TuyaPlugMutation | null = null;
    await act(async () => {
      mutation = await result.current.togglePlug('bf_test_plug_001', false);
    });

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/tuya/plugs/bf_test_plug_001/state',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ on: true }),
      })
    );
    expect(mutation).toEqual(mockMutation);
  });

  it('togglePlug sends on: false when currentState is true', async () => {
    (global.fetch as jest.Mock) = makeFetchMock(mockMutation);

    const { result } = renderHook(() => useTuyaCommands());

    await act(async () => {
      await result.current.togglePlug('bf_test_plug_001', true);
    });

    const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body as string) as { on: boolean };
    expect(body.on).toBe(false);
  });

  it('togglePlug returns null when data_confirmed is false', async () => {
    const unconfirmedMutation: TuyaPlugMutation = { ...mockMutation, data_confirmed: false };
    (global.fetch as jest.Mock) = makeFetchMock(unconfirmedMutation);

    const { result } = renderHook(() => useTuyaCommands());

    let mutation: TuyaPlugMutation | null | undefined;
    await act(async () => {
      mutation = await result.current.togglePlug('bf_test_plug_001', false);
    });

    expect(mutation).toBeNull();
  });

  it('togglePlug returns null on fetch error', async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useTuyaCommands());

    let mutation: TuyaPlugMutation | null | undefined;
    await act(async () => {
      mutation = await result.current.togglePlug('bf_test_plug_001', false);
    });

    expect(mutation).toBeNull();
  });

  it('togglePlug returns null when response is not ok', async () => {
    (global.fetch as jest.Mock) = makeFetchMock(mockMutation, false);

    const { result } = renderHook(() => useTuyaCommands());

    let mutation: TuyaPlugMutation | null | undefined;
    await act(async () => {
      mutation = await result.current.togglePlug('bf_test_plug_001', false);
    });

    expect(mutation).toBeNull();
  });

  // ---------------------------------------------------------------------------
  // setTimer
  // ---------------------------------------------------------------------------

  it('setTimer calls POST /api/tuya/plugs/{deviceId}/timer with { seconds }', async () => {
    (global.fetch as jest.Mock) = makeFetchMock(mockMutation);

    const { result } = renderHook(() => useTuyaCommands());

    await act(async () => {
      await result.current.setTimer('bf_test_plug_001', 3600);
    });

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/tuya/plugs/bf_test_plug_001/timer',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ seconds: 3600 }),
      })
    );
  });

  it('setTimer returns mutation when data_confirmed is true', async () => {
    (global.fetch as jest.Mock) = makeFetchMock(mockMutation);

    const { result } = renderHook(() => useTuyaCommands());

    let mutation: TuyaPlugMutation | null | undefined;
    await act(async () => {
      mutation = await result.current.setTimer('bf_test_plug_001', 3600);
    });

    expect(mutation).toEqual(mockMutation);
  });

  it('setTimer returns null when data_confirmed is false', async () => {
    const unconfirmedMutation: TuyaPlugMutation = { ...mockMutation, data_confirmed: false };
    (global.fetch as jest.Mock) = makeFetchMock(unconfirmedMutation);

    const { result } = renderHook(() => useTuyaCommands());

    let mutation: TuyaPlugMutation | null | undefined;
    await act(async () => {
      mutation = await result.current.setTimer('bf_test_plug_001', 3600);
    });

    expect(mutation).toBeNull();
  });

  // ---------------------------------------------------------------------------
  // cancelTimer
  // ---------------------------------------------------------------------------

  it('cancelTimer calls setTimer with seconds=0', async () => {
    (global.fetch as jest.Mock) = makeFetchMock(mockMutation);

    const { result } = renderHook(() => useTuyaCommands());

    await act(async () => {
      await result.current.cancelTimer('bf_test_plug_001');
    });

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/tuya/plugs/bf_test_plug_001/timer',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ seconds: 0 }),
      })
    );
  });

  it('cancelTimer returns null when data_confirmed is false', async () => {
    const unconfirmedMutation: TuyaPlugMutation = { ...mockMutation, data_confirmed: false };
    (global.fetch as jest.Mock) = makeFetchMock(unconfirmedMutation);

    const { result } = renderHook(() => useTuyaCommands());

    let mutation: TuyaPlugMutation | null | undefined;
    await act(async () => {
      mutation = await result.current.cancelTimer('bf_test_plug_001');
    });

    expect(mutation).toBeNull();
  });
});
