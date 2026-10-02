/**
 * Tests for Fritz!Box History Bandwidth Raw Route
 * GET /api/v1/fritzbox/history/bandwidth
 */

// Mock dependencies before imports
jest.mock('@/lib/fritzbox');
jest.mock('@/lib/auth/session', () => ({
  authSession: {
    getSession: jest.fn(),
  },
}));

import { GET } from '../route';
import { fritzboxClient } from '@/lib/fritzbox';
import { authSession } from '@/lib/auth/session';
import { asNextRequest, mockAppSession, routeContext } from '@/__tests__/__utils__/routeHelpers';

const mockGetSession = jest.mocked(authSession.getSession);
const mockFritzboxClient = jest.mocked(fritzboxClient);

describe('GET /api/v1/fritzbox/history/bandwidth', () => {
  let mockRequest: Request;
  const mockSession = mockAppSession({ sub: 'auth0|123', email: 'test@test.com' });
  const mockData = {
    items: [
      {
        timestamp: 1711324800,
        bytes_sent: 100000,
        bytes_received: 500000,
        upstream_rate: 1000000,
        downstream_rate: 5000000,
        latency_ms: 12,
        connection_uptime: 3600,
        external_ip: '1.2.3.4',
        connection_type: 'DSL',
      },
    ],
    total_count: 1,
    limit: 100,
    offset: 0,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockRequest = new Request('http://localhost:3000/api/v1/fritzbox/history/bandwidth');
    // Default: authenticated user
    mockGetSession.mockResolvedValue(mockSession);
    // Mock console methods to suppress output
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  it('should return 401 when not authenticated', async () => {
    mockGetSession.mockResolvedValue(null);

    const response = await GET(asNextRequest(mockRequest), routeContext());
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.success).toBe(false);
    expect(data.code).toBe('UNAUTHORIZED');
  });

  it('should return 200 with bandwidth data', async () => {
    mockFritzboxClient.getBandwidthHistoryRaw.mockResolvedValue(mockData);

    const response = await GET(asNextRequest(mockRequest), routeContext());
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({ success: true, bandwidth: mockData });
  });

  it('should call fritzboxClient.getBandwidthHistoryRaw', async () => {
    mockFritzboxClient.getBandwidthHistoryRaw.mockResolvedValue(mockData);

    await GET(asNextRequest(mockRequest), routeContext());

    expect(mockFritzboxClient.getBandwidthHistoryRaw).toHaveBeenCalled();
  });

  it('should propagate errors', async () => {
    const error = new Error('Bandwidth history query failed');
    mockFritzboxClient.getBandwidthHistoryRaw.mockRejectedValue(error);

    const response = await GET(asNextRequest(mockRequest), routeContext());
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Bandwidth history query failed');
  });
});
