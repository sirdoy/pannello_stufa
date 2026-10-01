/**
 * Tests for Fritz!Box Budget Stats Route
 * GET /api/v1/fritzbox/budget-stats
 */

// Mock dependencies before imports
jest.mock('@/lib/fritzbox');
jest.mock('@/lib/auth/session', () => ({
  authSession: {
    getSession: jest.fn(),
  },
}));

import { GET } from '../route';
import { fritzboxClient, getCachedData, checkRateLimitFritzBox } from '@/lib/fritzbox';
import { authSession } from '@/lib/auth/session';
import { asNextRequest, mockAppSession, routeContext } from '@/__tests__/__utils__/routeHelpers';

const mockGetSession = jest.mocked(authSession.getSession);
const mockFritzboxClient = jest.mocked(fritzboxClient);
const mockGetCachedData = jest.mocked(getCachedData);
const mockCheckRateLimit = jest.mocked(checkRateLimitFritzBox);

describe('GET /api/v1/fritzbox/budget-stats', () => {
  let mockRequest: Request;
  const mockSession = mockAppSession({ sub: 'auth0|123', email: 'test@test.com' });
  const mockStats: Awaited<ReturnType<typeof fritzboxClient.getBudgetStats>> = {
    window_seconds: 3600,
    current_window_requests: 42,
    soft_limit: 100,
    hard_limit: 150,
    total_lifetime_requests: 12345,
    warning_count: 0,
    utilization_percent: 42.0,
    status: 'ok',
    message: 'Budget usage normal',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockRequest = new Request('http://localhost:3000/api/v1/fritzbox/budget-stats');
    // Default: authenticated user
    mockGetSession.mockResolvedValue(mockSession);
    // Default: rate limit allows
    mockCheckRateLimit.mockResolvedValue({ allowed: true, suppressedCount: 0, nextAllowedIn: 0 });
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

  it('should return 200 with budget stats', async () => {
    mockGetCachedData.mockResolvedValue(mockStats);

    const response = await GET(asNextRequest(mockRequest), routeContext());
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      success: true,
      stats: mockStats,
    });
    expect(mockCheckRateLimit).toHaveBeenCalledWith('auth0|123', 'budget-stats');
    expect(mockGetCachedData).toHaveBeenCalled();
  });

  it('should return 429 when rate limited', async () => {
    mockCheckRateLimit.mockResolvedValue({ allowed: false, suppressedCount: 1, nextAllowedIn: 30 });

    const response = await GET(asNextRequest(mockRequest), routeContext());
    const data = await response.json();

    expect(response.status).toBe(429);
    expect(data.success).toBe(false);
    expect(data.code).toBe('RATE_LIMITED');
    expect(data.error).toContain('Troppe richieste');
    expect(data.error).toContain('30s');
    expect(data.retryAfter).toBe(30);
    expect(mockGetCachedData).not.toHaveBeenCalled();
  });

  it('should call getCachedData with correct cache key and fetch function', async () => {
    mockGetCachedData.mockResolvedValue(mockStats);

    await GET(asNextRequest(mockRequest), routeContext());

    expect(mockGetCachedData).toHaveBeenCalledWith(
      'budget-stats',
      expect.any(Function)
    );

    // Verify the fetch function calls fritzboxClient.getBudgetStats
    const fetchFn = mockGetCachedData.mock.calls[0]?.[1];
    mockFritzboxClient.getBudgetStats.mockResolvedValue(mockStats);
    await fetchFn?.();
    expect(mockFritzboxClient.getBudgetStats).toHaveBeenCalled();
  });

  it('should propagate errors from fritzboxClient', async () => {
    const error = new Error('Budget stats query failed');
    mockGetCachedData.mockRejectedValue(error);

    const response = await GET(asNextRequest(mockRequest), routeContext());
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Budget stats query failed');
  });
});
