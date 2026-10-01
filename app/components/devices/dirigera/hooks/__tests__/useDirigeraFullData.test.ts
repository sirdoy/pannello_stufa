/**
 * Tests for useDirigeraFullData — `stale` follows the backend cache freshness
 * (REST `is_stale`, WS `data_freshness`), not only fetch failures.
 */

import { renderHook, waitFor, act } from '@testing-library/react';
import type { DirigeraHealthResponse, DirigeraSensorsResponse } from '@/types/dirigeraProxy';
import type { DirigeraData as WsDirigeraData } from '@/types/websocket';

jest.mock('@/lib/hooks/useAdaptivePolling');
jest.mock('@/lib/hooks/useVisibility');
jest.mock('@/app/context/WebSocketContext');
jest.mock('@/lib/hooks/useWebSocketManager', () => ({
  ReadyState: { OPEN: 1, CLOSED: 3, CONNECTING: 0, CLOSING: 2, UNINSTANTIATED: -1 },
}));

import { useAdaptivePolling } from '@/lib/hooks/useAdaptivePolling';
import { useVisibility } from '@/lib/hooks/useVisibility';
import { useWebSocketContext } from '@/app/context/WebSocketContext';
import { useDirigeraFullData } from '../useDirigeraFullData';

const mockUseVisibility = useVisibility as jest.MockedFunction<typeof useVisibility>;
const mockUseAdaptivePolling = useAdaptivePolling as jest.MockedFunction<typeof useAdaptivePolling>;
const mockUseWebSocketContext = useWebSocketContext as jest.MockedFunction<typeof useWebSocketContext>;

const mockSubscribe = jest.fn();
const mockUnsubscribe = jest.fn();

function setWsConnected(connected: boolean) {
  mockUseWebSocketContext.mockReturnValue({
    subscribe: mockSubscribe,
    unsubscribe: mockUnsubscribe,
    readyState: connected ? 1 : 3,
  } as ReturnType<typeof useWebSocketContext>);
}

const health: DirigeraHealthResponse = { firmware_version: '2.465.0', connected_sensors: 1, is_reachable: true };

const sensor = {
  id: 'a1',
  relation_id: null,
  type: 'openCloseSensor',
  custom_name: 'Porta',
  room: 'Ingresso',
  firmware_version: null,
  battery_percentage: 90,
  is_reachable: true,
  last_seen: null,
  is_open: false,
};

function sensorsBody(isStale: boolean): DirigeraSensorsResponse {
  return {
    sensors: [sensor],
    count: 1,
    is_stale: isStale,
    fetched_at: '2026-10-01T10:00:00Z',
    data_freshness: isStale ? 'STALE' : 'LIVE',
  };
}

function mockFetch(body: DirigeraSensorsResponse) {
  global.fetch = jest.fn((url: string) =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve(url === '/api/v1/dirigera/health' ? health : { success: true, ...body }),
    })
  ) as unknown as typeof fetch;
}

describe('useDirigeraFullData', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseVisibility.mockReturnValue(true);
    setWsConnected(false);
    mockUseAdaptivePolling.mockImplementation(({ callback, immediate, interval }) => {
      if (immediate && interval !== null) {
        setTimeout(() => void callback(), 0);
      }
    });
  });

  it('is not stale when the backend serves live data', async () => {
    mockFetch(sensorsBody(false));

    const { result } = renderHook(() => useDirigeraFullData('all'));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data?.sensors).toHaveLength(1);
    expect(result.current.stale).toBe(false);
  });

  it('is stale when a successful fetch returns is_stale: true', async () => {
    mockFetch(sensorsBody(true));

    const { result } = renderHook(() => useDirigeraFullData('all'));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data?.sensors).toHaveLength(1);
    expect(result.current.stale).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it('follows data_freshness of WS pushes', async () => {
    setWsConnected(true);

    const { result } = renderHook(() => useDirigeraFullData('all'));
    const handler = mockSubscribe.mock.calls.find(([topic]) => topic === 'dirigera')?.[1] as (d: unknown) => void;
    const push = (freshness: 'LIVE' | 'STALE'): WsDirigeraData => ({
      sensors: [sensor],
      count: 1,
      data_freshness: freshness,
      is_stale: freshness === 'STALE',
      fetched_at: null,
    });

    act(() => handler(push('STALE')));
    expect(result.current.stale).toBe(true);

    act(() => handler(push('LIVE')));
    expect(result.current.stale).toBe(false);
  });
});
