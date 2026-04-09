/**
 * Tests for Fritz!Box History Bandwidth Raw Route
 * GET /api/fritzbox/history/bandwidth
 */

// Mock dependencies before imports
jest.mock('@/lib/fritzbox');
jest.mock('@/lib/auth0', () => ({
  auth0: {
    getSession: jest.fn(),
  },
}));

import { GET } from '../route';
import { fritzboxClient, getCachedData, checkRateLimitFritzBox } from '@/lib/fritzbox';
import { auth0 } from '@/lib/auth0';

const mockGetSession = jest.mocked(auth0.getSession);
const mockFritzboxClient = jest.mocked(fritzboxClient);
const mockGetCachedData = jest.mocked(getCachedData);
const mockCheckRateLimit = jest.mocked(checkRateLimitFritzBox);

describe('GET /api/fritzbox/history/bandwidth', () => {
  let mockRequest: Request;
  const mockSession = { user: { sub: 'auth0|123', email: 'test@test.com' } };
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
    mockRequest = new Request('http://localhost:3000/api/fritzbox/history/bandwidth');
    // Default: authenticated user
    mockGetSession.mockResolvedValue(mockSession as any);
    // Default: rate limit allows
    mockCheckRateLimit.mockResolvedValue({ allowed: true, suppressedCount: 0, nextAllowedIn: 0 });
    // Guard for new method that may not be in the auto-mock yet
    if (!mockFritzboxClient.getBandwidthHistoryRaw) {
      (mockFritzboxClient as any).getBandwidthHistoryRaw = jest.fn();
    }
    // Mock console methods to suppress output
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  it('should return 401 when not authenticated', async () => {
    mockGetSession.mockResolvedValue(null);

    const response = await GET(mockRequest as any, {} as any);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.success).toBe(false);
    expect(data.code).toBe('UNAUTHORIZED');
  });

  it('should return 200 with bandwidth data', async () => {
    mockGetCachedData.mockResolvedValue(mockData);

    const response = await GET(mockRequest as any, {} as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({ success: true, bandwidth: mockData });
    expect(mockCheckRateLimit).toHaveBeenCalledWith('auth0|123', 'history-bandwidth-raw');
  });

  it('should return 429 when rate limited', async () => {
    mockCheckRateLimit.mockResolvedValue({ allowed: false, suppressedCount: 1, nextAllowedIn: 30 });

    const response = await GET(mockRequest as any, {} as any);
    const data = await response.json();

    expect(response.status).toBe(429);
    expect(data.success).toBe(false);
    expect(data.code).toBe('RATE_LIMITED');
    expect(data.retryAfter).toBe(30);
    expect(mockGetCachedData).not.toHaveBeenCalled();
  });

  it('should call getCachedData with correct cache key', async () => {
    mockGetCachedData.mockResolvedValue(mockData);

    await GET(mockRequest as any, {} as any);

    expect(mockGetCachedData).toHaveBeenCalledWith('history-bandwidth-raw', expect.any(Function));

    // Verify the fetch function calls the correct client method
    const fetchFn = mockGetCachedData.mock.calls[0]?.[1];
    mockFritzboxClient.getBandwidthHistoryRaw.mockResolvedValue(mockData as any);
    await fetchFn?.();
    expect(mockFritzboxClient.getBandwidthHistoryRaw).toHaveBeenCalled();
  });

  it('should propagate errors', async () => {
    const error = new Error('Bandwidth history query failed');
    mockGetCachedData.mockRejectedValue(error);

    const response = await GET(mockRequest as any, {} as any);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Bandwidth history query failed');
  });
});
