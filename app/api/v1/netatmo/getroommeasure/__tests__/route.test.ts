/**
 * Tests for GET /api/v1/netatmo/getroommeasure
 */

jest.mock('@/lib/netatmo/netatmoProxy');
jest.mock('@/lib/auth/session', () => ({
  authSession: { getSession: jest.fn() },
}));

import { GET } from '../route';
import * as netatmoProxy from '@/lib/netatmo/netatmoProxy';
import { authSession } from '@/lib/auth/session';
import { asNextRequest, mockAppSession, routeContext } from '@/__tests__/__utils__/routeHelpers';

const mockGetSession = jest.mocked(authSession.getSession);
const mockGetProxyRoomMeasure = jest.mocked(netatmoProxy.getProxyRoomMeasure);

describe('GET /api/v1/netatmo/getroommeasure', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSession.mockResolvedValue(mockAppSession());
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  it('should return 401 when not authenticated', async () => {
    mockGetSession.mockResolvedValue(null);
    const request = new Request('http://localhost:3000/api/v1/netatmo/getroommeasure?home_id=abc&room_id=123&scale=1hour&type=temperature');
    const response = await GET(asNextRequest(request), routeContext());
    const data = await response.json();
    expect(response.status).toBe(401);
    expect(data.code).toBe('UNAUTHORIZED');
  });

  it('should return 200 with data', async () => {
    mockGetProxyRoomMeasure.mockResolvedValue({
      items: [{
        home_id: 'abc', room_id: '123', room_name: null,
        avg_temperature: 20.5, min_temperature: 20.1, max_temperature: 20.9, avg_heating_power: null,
        sample_count: 12, hour_timestamp: 1000,
      }],
      total_count: 1,
      limit: 100,
      offset: 0,
    });
    const request = new Request('http://localhost:3000/api/v1/netatmo/getroommeasure?home_id=abc&room_id=123&scale=1hour&type=temperature');
    const response = await GET(asNextRequest(request), routeContext());
    const data = await response.json();
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(mockGetProxyRoomMeasure).toHaveBeenCalledWith(expect.any(URLSearchParams));
  });
});
