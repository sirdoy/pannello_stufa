/**
 * @jest-environment node
 *
 * Tests for GET /api/netatmo/getroommeasure
 * Thin proxy route: validates room_id + scale, forwards all query params.
 */

import { GET } from '@/app/api/netatmo/getroommeasure/route';
import { getProxyRoomMeasure } from '@/lib/netatmoProxy';
import type { RoomMeasureResponse } from '@/types/netatmoProxy';

// Mock dependencies
jest.mock('@/lib/netatmoProxy');
jest.mock('@/lib/core', () => ({
  withAuthAndErrorHandler: (fn: Function) => fn,
  success: (data: unknown) => ({ ok: true, data }),
  badRequest: (msg: string) => ({ ok: false, error: msg, status: 400 }),
}));

const mockGetProxyRoomMeasure = getProxyRoomMeasure as jest.MockedFunction<typeof getProxyRoomMeasure>;

// Helper: call GET with query params as a plain object
const callGET = (params: Record<string, string>) =>
  (GET as unknown as (req: { nextUrl: { searchParams: URLSearchParams } }) => Promise<unknown>)(
    { nextUrl: { searchParams: new URLSearchParams(params) } }
  );

const mockProxyResponse: RoomMeasureResponse = {
  items: [
    {
      home_id: 'home-1',
      room_id: 'room-1',
      room_name: 'Soggiorno',
      avg_temperature: 21.5,
      min_temperature: 20.0,
      max_temperature: 23.0,
      avg_heating_power: 45,
      sample_count: 12,
      hour_timestamp: 1700000000,
    },
  ],
  total: 1,
  limit: 100,
  offset: 0,
};

describe('GET /api/netatmo/getroommeasure', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should call getProxyRoomMeasure with room_id and scale, returning success(proxyResponse)', async () => {
    mockGetProxyRoomMeasure.mockResolvedValue(mockProxyResponse);

    const result = await callGET({ room_id: 'room-1', scale: '1hour' });

    expect(mockGetProxyRoomMeasure).toHaveBeenCalledTimes(1);
    const calledParams = mockGetProxyRoomMeasure.mock.calls[0]![0] as URLSearchParams;
    expect(calledParams.get('room_id')).toBe('room-1');
    expect(calledParams.get('scale')).toBe('1hour');
    expect((result as any).ok).toBe(true);
    expect((result as any).data).toEqual(mockProxyResponse);
  });

  it('should return badRequest when room_id is missing', async () => {
    const result = await callGET({ scale: '1hour' });

    expect(mockGetProxyRoomMeasure).not.toHaveBeenCalled();
    expect((result as any).ok).toBe(false);
    expect((result as any).status).toBe(400);
    expect((result as any).error).toContain('room_id');
  });

  it('should return badRequest when scale is invalid', async () => {
    const result = await callGET({ room_id: 'room-1', scale: '5min' });

    expect(mockGetProxyRoomMeasure).not.toHaveBeenCalled();
    expect((result as any).ok).toBe(false);
    expect((result as any).status).toBe(400);
    expect((result as any).error).toContain('5min');
  });

  it('should default scale to 1hour when not provided', async () => {
    mockGetProxyRoomMeasure.mockResolvedValue(mockProxyResponse);

    await callGET({ room_id: 'room-1' });

    const calledParams = mockGetProxyRoomMeasure.mock.calls[0]![0] as URLSearchParams;
    expect(calledParams.get('scale')).toBe('1hour');
  });

  it('should forward start, end, limit, offset params in the query string', async () => {
    mockGetProxyRoomMeasure.mockResolvedValue(mockProxyResponse);

    await callGET({
      room_id: 'room-1',
      scale: '1day',
      start: '1700000000',
      end: '1700086400',
      limit: '50',
      offset: '10',
    });

    const calledParams = mockGetProxyRoomMeasure.mock.calls[0]![0] as URLSearchParams;
    expect(calledParams.get('start')).toBe('1700000000');
    expect(calledParams.get('end')).toBe('1700086400');
    expect(calledParams.get('limit')).toBe('50');
    expect(calledParams.get('offset')).toBe('10');
  });

  it('should propagate proxy ApiError without catching it', async () => {
    const error = new Error('Proxy connection failed');
    mockGetProxyRoomMeasure.mockRejectedValue(error);

    await expect(callGET({ room_id: 'room-1', scale: '1hour' })).rejects.toThrow('Proxy connection failed');
  });
});
