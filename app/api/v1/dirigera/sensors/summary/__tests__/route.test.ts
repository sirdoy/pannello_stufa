/**
 * Tests for GET /api/v1/dirigera/sensors/summary
 */

jest.mock('@/lib/dirigera/dirigeraProxy');
jest.mock('@/lib/auth0', () => ({
  auth0: { getSession: jest.fn() },
}));

import { GET } from '../route';
import * as dirigeraProxy from '@/lib/dirigera/dirigeraProxy';
import { auth0 } from '@/lib/auth0';

const mockGetSession = jest.mocked(auth0.getSession);
const mockGetSensorSummary = jest.mocked(dirigeraProxy.getSensorSummary);
const mockSession = { user: { sub: 'auth0|123', email: 'test@test.com' } };

const mockSummaryData = {
  total_sensors: 3,
  open_count: 1,
  offline_count: 0,
  low_battery_count: 0,
  is_stale: false,
};

describe('GET /api/v1/dirigera/sensors/summary', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSession.mockResolvedValue(mockSession as any);
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  it('returns 401 when not authenticated', async () => {
    mockGetSession.mockResolvedValue(null);
    const request = new Request('http://localhost:3000/api/v1/dirigera/sensors/summary');
    const response = await GET(request as any, {} as any);
    const data = await response.json();
    expect(response.status).toBe(401);
    expect(data.code).toBe('UNAUTHORIZED');
  });

  it('returns 200 with sensor summary data when authenticated', async () => {
    mockGetSensorSummary.mockResolvedValue(mockSummaryData as any);
    const request = new Request('http://localhost:3000/api/v1/dirigera/sensors/summary');
    const response = await GET(request as any, {} as any);
    const data = await response.json();
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.total_sensors).toBe(3);
    expect(data.open_count).toBe(1);
    expect(mockGetSensorSummary).toHaveBeenCalledTimes(1);
    expect(mockGetSensorSummary).toHaveBeenCalledWith();
  });
});
