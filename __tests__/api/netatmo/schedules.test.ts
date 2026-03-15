/**
 * @jest-environment node
 *
 * Tests for GET /api/netatmo/schedules
 * Migrated to use Netatmo proxy (getProxyHomesdata) — no legacy OAuth, cache, or rate limiter.
 */

import { GET } from '@/app/api/netatmo/schedules/route';
import { getProxyHomesdata } from '@/lib/netatmoProxy';
import type { NetatmoProxyHomesdataResponse } from '@/types/netatmoProxy';

// Mock dependencies
jest.mock('@/lib/netatmoProxy');
jest.mock('@/lib/core', () => ({
  withAuthAndErrorHandler: (fn: Function) => fn,
  success: (data: unknown) => ({ ok: true, data }),
  badRequest: (msg: string) => ({ ok: false, error: msg, status: 400 }),
}));

// GET is the inner handler (no request arg needed due to mock above)
const callGET = () => (GET as unknown as () => Promise<unknown>)();

const mockGetProxyHomesdata = getProxyHomesdata as jest.MockedFunction<typeof getProxyHomesdata>;

const mockProxyResponse: NetatmoProxyHomesdataResponse = {
  body: {
    homes: [
      {
        id: 'home-1',
        name: 'Casa Mia',
        rooms: [],
        modules: [],
        schedules: [
          { id: 'schedule-1', name: 'Morning', selected: true, type: 'therm', timetable: [] },
          { id: 'schedule-2', name: 'Evening', selected: false, type: 'therm', timetable: [] },
        ],
      },
    ],
  },
  status: 'ok',
  time_exec: 0.1,
  time_server: 1700000000,
};

describe('GET /api/netatmo/schedules', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return schedules from proxy homesdata', async () => {
    mockGetProxyHomesdata.mockResolvedValue(mockProxyResponse);

    const result = await callGET();

    expect(mockGetProxyHomesdata).toHaveBeenCalledTimes(1);
    expect((result as any).ok).toBe(true);
    expect((result as any).data.schedules).toHaveLength(2);
    expect((result as any).data.schedules[0]).toMatchObject({
      id: 'schedule-1',
      name: 'Morning',
      selected: true,
    });
  });

  it('should return empty array when proxy returns no homes', async () => {
    mockGetProxyHomesdata.mockResolvedValue({
      ...mockProxyResponse,
      body: { homes: [] },
    });

    const result = await callGET();

    expect((result as any).ok).toBe(true);
    expect((result as any).data.schedules).toEqual([]);
  });

  it('should propagate proxy ApiError', async () => {
    const { ApiError, ERROR_CODES, HTTP_STATUS } = await import('@/lib/core/apiErrors');
    mockGetProxyHomesdata.mockRejectedValue(
      new ApiError(ERROR_CODES.SERVICE_UNAVAILABLE, 'Proxy unavailable', HTTP_STATUS.SERVICE_UNAVAILABLE)
    );

    await expect(callGET()).rejects.toThrow('Proxy unavailable');
  });

  it('should NOT export a POST handler', async () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const routeModule = await import('@/app/api/netatmo/schedules/route');
    expect((routeModule as any).POST).toBeUndefined();
  });
});
