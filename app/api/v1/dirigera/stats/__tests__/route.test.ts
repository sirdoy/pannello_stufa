/**
 * Tests for GET /api/v1/dirigera/stats
 */

jest.mock('@/lib/dirigera/dirigeraProxy');
jest.mock('@/lib/auth/session', () => ({
  authSession: { getSession: jest.fn() },
}));

import { GET } from '../route';
import * as dirigeraProxy from '@/lib/dirigera/dirigeraProxy';
import { authSession } from '@/lib/auth/session';

const mockGetSession = jest.mocked(authSession.getSession);
const mockGetStats = jest.mocked(dirigeraProxy.getStats);
const mockSession = { user: { sub: 'auth0|123', email: 'test@test.com' } };

const mockStatsData = {
  aggregation: {

    last_run: 1773244800,

    last_sensors_processed: 248,

    total_runs: 7,

  },
  retention: {

    last_run: 1773244800,

    last_raw_events_deleted: 42,

    last_daily_rows_deleted: 0,

    last_telemetry_deleted: 0,

    total_runs: 7,

  },
};

describe('GET /api/v1/dirigera/stats', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSession.mockResolvedValue(mockSession as any);
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  it('returns 401 when not authenticated', async () => {
    mockGetSession.mockResolvedValue(null);
    const request = new Request('http://localhost:3000/api/v1/dirigera/stats');
    const response = await GET(request as any, {} as any);
    const data = await response.json();
    expect(response.status).toBe(401);
    expect(data.code).toBe('UNAUTHORIZED');
  });

  it('returns 200 with stats data when authenticated', async () => {
    mockGetStats.mockResolvedValue(mockStatsData as any);
    const request = new Request('http://localhost:3000/api/v1/dirigera/stats');
    const response = await GET(request as any, {} as any);
    const data = await response.json();
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.aggregation.total_runs).toBe(7);
    expect(data.retention.last_raw_events_deleted).toBe(42);
    expect(mockGetStats).toHaveBeenCalledTimes(1);
    expect(mockGetStats).toHaveBeenCalledWith();
  });
});
