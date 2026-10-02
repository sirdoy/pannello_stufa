/**
 * Tests for Fritz!Box History Bandwidth Auto-Granularity Route
 * GET /api/v1/fritzbox/history/bandwidth/auto
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

describe('GET /api/v1/fritzbox/history/bandwidth/auto', () => {
  let mockRequest: Request;
  const mockSession = mockAppSession({ sub: 'auth0|123', email: 'test@test.com' });
  const mockData: Awaited<ReturnType<typeof fritzboxClient.getBandwidthAuto>> = {
    items: [
      {
        timestamp: 1711324800,
        granularity: 'hourly',
        avg_upstream_rate: 1000,
        min_upstream_rate: 500,
        max_upstream_rate: 1500,
        avg_downstream_rate: 5000,
        min_downstream_rate: 4000,
        max_downstream_rate: 6000,
        avg_bytes_sent: 100000,
        avg_bytes_received: 500000,
        sample_count: 60,
      },
    ],
    total_count: 1,
    limit: 100,
    offset: 0,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockRequest = new Request('http://localhost:3000/api/v1/fritzbox/history/bandwidth/auto');
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

  it('should return 200 with auto-granularity data', async () => {
    mockFritzboxClient.getBandwidthAuto.mockResolvedValue(mockData);

    const response = await GET(asNextRequest(mockRequest), routeContext());
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({ success: true, auto: mockData });
  });

  it('should call fritzboxClient.getBandwidthAuto', async () => {
    mockFritzboxClient.getBandwidthAuto.mockResolvedValue(mockData);

    await GET(asNextRequest(mockRequest), routeContext());

    expect(mockFritzboxClient.getBandwidthAuto).toHaveBeenCalled();
  });

  it('should propagate errors', async () => {
    const error = new Error('Auto bandwidth query failed');
    mockFritzboxClient.getBandwidthAuto.mockRejectedValue(error);

    const response = await GET(asNextRequest(mockRequest), routeContext());
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Auto bandwidth query failed');
  });
});
