/**
 * Tests for GET /api/v1/dirigera/history
 */

jest.mock('@/lib/dirigera/dirigeraProxy');
jest.mock('@/lib/auth0', () => ({
  auth0: { getSession: jest.fn() },
}));

import { GET } from '../route';
import * as dirigeraProxy from '@/lib/dirigera/dirigeraProxy';
import { auth0 } from '@/lib/auth0';

const mockGetSession = jest.mocked(auth0.getSession);
const mockGetHistory = jest.mocked(dirigeraProxy.getHistory);
const mockSession = { user: { sub: 'auth0|123', email: 'test@test.com' } };

const mockHistoryData = {
  events: [
    { id: 1, sensor_id: 'abc', sensor_name: 'Door', event_type: 'open', recorded_at: 1 },
  ],
  total: 1,
  limit: 100,
  offset: 0,
};

describe('GET /api/v1/dirigera/history', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSession.mockResolvedValue(mockSession as any);
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  it('returns 401 when not authenticated', async () => {
    mockGetSession.mockResolvedValue(null);
    const request = new Request('http://localhost:3000/api/v1/dirigera/history');
    const response = await GET(request as any, {} as any);
    const data = await response.json();
    expect(response.status).toBe(401);
    expect(data.code).toBe('UNAUTHORIZED');
  });

  it('returns 200 with history data when authenticated (no query params)', async () => {
    mockGetHistory.mockResolvedValue(mockHistoryData as any);
    const request = new Request('http://localhost:3000/api/v1/dirigera/history');
    const response = await GET(request as any, {} as any);
    const data = await response.json();
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.events).toEqual(mockHistoryData.events);
    expect(data.total).toBe(1);
    expect(mockGetHistory).toHaveBeenCalledWith();
  });

  it('forwards typed query params to proxy', async () => {
    mockGetHistory.mockResolvedValue(mockHistoryData as any);
    const request = new Request(
      'http://localhost:3000/api/v1/dirigera/history?sensor_id=abc&event_type=open&limit=50&offset=10'
    );
    await GET(request as any, {} as any);
    expect(mockGetHistory).toHaveBeenCalledWith({
      sensor_id: 'abc',
      event_type: 'open',
      limit: 50,
      offset: 10,
    });
  });

  it('drops invalid numeric params silently', async () => {
    mockGetHistory.mockResolvedValue(mockHistoryData as any);
    const request = new Request(
      'http://localhost:3000/api/v1/dirigera/history?limit=not-a-number'
    );
    await GET(request as any, {} as any);
    expect(mockGetHistory).toHaveBeenCalledWith();
  });
});
