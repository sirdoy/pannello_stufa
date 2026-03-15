/**
 * @jest-environment node
 *
 * Tests for GET /api/netatmo/camera/events
 * Migrated to use Netatmo proxy instead of Netatmo Cloud API directly.
 */

import { GET } from '@/app/api/netatmo/camera/events/route';
import { getProxyCameraEvents } from '@/lib/netatmoProxy';
import type { CameraEventsResponse } from '@/types/netatmoProxy';

// Mock dependencies
jest.mock('@/lib/netatmoProxy');
jest.mock('@/lib/core', () => ({
  withAuthAndErrorHandler: (fn: Function) => async (...args: unknown[]) => {
    try {
      return await fn(...args);
    } catch (error: any) {
      return { ok: false, error: error.message, status: 500 };
    }
  },
  success: (data: unknown) => ({ ok: true, data }),
  parseQuery: (req: any) => new URLSearchParams(req._query || ''),
}));

const mockGetProxyCameraEvents = getProxyCameraEvents as jest.MockedFunction<typeof getProxyCameraEvents>;

const mockEventsResponse: CameraEventsResponse = {
  events: [
    {
      event_id: 'evt-001',
      camera_id: 'cam-123',
      event_type: 'movement',
      timestamp: 1741870800,
      message: 'Movement detected',
      snapshot_url: 'https://example.com/snap.jpg',
      person_id: null,
    },
    {
      event_id: 'evt-002',
      camera_id: 'cam-123',
      event_type: 'person',
      timestamp: 1741870700,
      message: 'Person detected',
      snapshot_url: null,
      person_id: 'person-1',
    },
  ],
  count: 2,
};

const makeRequest = (query = '') => ({ _query: query });

const callGET = (query = '') =>
  (GET as unknown as (req: unknown, ctx: unknown, sess: unknown) => Promise<unknown>)(
    makeRequest(query),
    undefined,
    undefined
  );

describe('GET /api/netatmo/camera/events', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return events from proxy without hours param', async () => {
    mockGetProxyCameraEvents.mockResolvedValue(mockEventsResponse);

    const result = await callGET();

    expect(mockGetProxyCameraEvents).toHaveBeenCalledWith(undefined);
    expect((result as any).ok).toBe(true);
    expect((result as any).data.events).toHaveLength(2);
    expect((result as any).data.count).toBe(2);
  });

  it('should pass hours param to proxy when provided', async () => {
    mockGetProxyCameraEvents.mockResolvedValue(mockEventsResponse);

    const result = await callGET('hours=24');

    expect(mockGetProxyCameraEvents).toHaveBeenCalledWith(24);
    expect((result as any).ok).toBe(true);
  });

  it('should clamp hours to minimum 1', async () => {
    mockGetProxyCameraEvents.mockResolvedValue(mockEventsResponse);

    await callGET('hours=0');

    expect(mockGetProxyCameraEvents).toHaveBeenCalledWith(1);
  });

  it('should clamp hours to maximum 168', async () => {
    mockGetProxyCameraEvents.mockResolvedValue(mockEventsResponse);

    await callGET('hours=999');

    expect(mockGetProxyCameraEvents).toHaveBeenCalledWith(168);
  });

  it('should pass undefined to proxy when hours param is invalid (NaN)', async () => {
    mockGetProxyCameraEvents.mockResolvedValue(mockEventsResponse);

    await callGET('hours=abc');

    // NaN hours should be treated as no hours provided
    expect(mockGetProxyCameraEvents).toHaveBeenCalledWith(undefined);
  });

  it('should return event fields with proxy field names', async () => {
    mockGetProxyCameraEvents.mockResolvedValue(mockEventsResponse);

    const result = await callGET();

    const firstEvent = (result as any).data.events[0];
    expect(firstEvent).toMatchObject({
      event_id: 'evt-001',
      camera_id: 'cam-123',
      event_type: 'movement',
      timestamp: 1741870800,
    });
  });

  it('should propagate proxy errors', async () => {
    const proxyError = new Error('Proxy unavailable');
    mockGetProxyCameraEvents.mockRejectedValue(proxyError);

    const result = await callGET();

    expect((result as any).ok).toBe(false);
    expect((result as any).error).toBe('Proxy unavailable');
  });
});
