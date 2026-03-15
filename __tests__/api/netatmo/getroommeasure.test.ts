/**
 * @jest-environment node
 *
 * Tests for GET /api/netatmo/getroommeasure
 * Thin proxy route: validates room_id + scale, forwards all query params.
 */

import { GET } from '@/app/api/netatmo/getroommeasure/route';
import { netatmoProxyGet } from '@/lib/netatmoProxy';
import type { RoomMeasureResponse } from '@/types/netatmoProxy';

// Mock dependencies
jest.mock('@/lib/netatmoProxy');
jest.mock('@/lib/core', () => ({
  withAuthAndErrorHandler: (fn: Function) => fn,
  success: (data: unknown) => ({ ok: true, data }),
  badRequest: (msg: string) => ({ ok: false, error: msg, status: 400 }),
}));

const mockNetatmoProxyGet = netatmoProxyGet as jest.MockedFunction<typeof netatmoProxyGet>;

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

  it('should call netatmoProxyGet with room_id and scale, returning success(proxyResponse)', async () => {
    mockNetatmoProxyGet.mockResolvedValue(mockProxyResponse);

    const result = await callGET({ room_id: 'room-1', scale: '1hour' });

    expect(mockNetatmoProxyGet).toHaveBeenCalledTimes(1);
    const calledUrl = (mockNetatmoProxyGet as jest.Mock).mock.calls[0][0] as string;
    expect(calledUrl).toContain('/getroommeasure');
    expect(calledUrl).toContain('room_id=room-1');
    expect(calledUrl).toContain('scale=1hour');
    expect((result as any).ok).toBe(true);
    expect((result as any).data).toEqual(mockProxyResponse);
  });

  it('should return badRequest when room_id is missing', async () => {
    const result = await callGET({ scale: '1hour' });

    expect(mockNetatmoProxyGet).not.toHaveBeenCalled();
    expect((result as any).ok).toBe(false);
    expect((result as any).status).toBe(400);
    expect((result as any).error).toContain('room_id');
  });

  it('should return badRequest when scale is invalid', async () => {
    const result = await callGET({ room_id: 'room-1', scale: '5min' });

    expect(mockNetatmoProxyGet).not.toHaveBeenCalled();
    expect((result as any).ok).toBe(false);
    expect((result as any).status).toBe(400);
    expect((result as any).error).toContain('5min');
  });

  it('should default scale to 1hour when not provided', async () => {
    mockNetatmoProxyGet.mockResolvedValue(mockProxyResponse);

    await callGET({ room_id: 'room-1' });

    const calledUrl = (mockNetatmoProxyGet as jest.Mock).mock.calls[0][0] as string;
    expect(calledUrl).toContain('scale=1hour');
  });

  it('should forward start, end, limit, offset params in the query string', async () => {
    mockNetatmoProxyGet.mockResolvedValue(mockProxyResponse);

    await callGET({
      room_id: 'room-1',
      scale: '1day',
      start: '1700000000',
      end: '1700086400',
      limit: '50',
      offset: '10',
    });

    const calledUrl = (mockNetatmoProxyGet as jest.Mock).mock.calls[0][0] as string;
    expect(calledUrl).toContain('start=1700000000');
    expect(calledUrl).toContain('end=1700086400');
    expect(calledUrl).toContain('limit=50');
    expect(calledUrl).toContain('offset=10');
  });

  it('should propagate proxy ApiError without catching it', async () => {
    const error = new Error('Proxy connection failed');
    mockNetatmoProxyGet.mockRejectedValue(error);

    await expect(callGET({ room_id: 'room-1', scale: '1hour' })).rejects.toThrow('Proxy connection failed');
  });
});
