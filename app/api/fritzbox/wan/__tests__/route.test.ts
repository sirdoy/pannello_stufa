/**
 * Tests for Fritz!Box WAN Route
 * GET /api/fritzbox/wan
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

describe('GET /api/fritzbox/wan', () => {
  let mockRequest: Request;
  const mockSession = { user: { sub: 'auth0|123', email: 'test@test.com' } };
  const mockWan = {
    status: 'Connected',
    uptime: 123456,
    externalIp: '1.2.3.4',
    connectionType: 'PPPoE',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockRequest = new Request('http://localhost:3000/api/fritzbox/wan');
    // Default: authenticated user
    mockGetSession.mockResolvedValue(mockSession as any);
    // Default: rate limit allows
    mockCheckRateLimit.mockResolvedValue({ allowed: true, suppressedCount: 0, nextAllowedIn: 0 });
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

  it('should return 200 with WAN data when rate limit allows and cache provides data', async () => {
    mockGetCachedData.mockResolvedValue(mockWan);

    const response = await GET(mockRequest as any, {} as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      success: true,
      wan: mockWan,
    });
    expect(mockCheckRateLimit).toHaveBeenCalledWith('auth0|123', 'wan');
    expect(mockGetCachedData).toHaveBeenCalled();
  });

  it('should return 429 with RATE_LIMITED code and retryAfter when rate limit exceeded', async () => {
    mockCheckRateLimit.mockResolvedValue({ allowed: false, suppressedCount: 1, nextAllowedIn: 15 });

    const response = await GET(mockRequest as any, {} as any);
    const data = await response.json();

    expect(response.status).toBe(429);
    expect(data.success).toBe(false);
    expect(data.code).toBe('RATE_LIMITED');
    expect(data.error).toContain('Troppe richieste');
    expect(data.error).toContain('15s');
    expect(data.retryAfter).toBe(15);
    expect(mockGetCachedData).not.toHaveBeenCalled();
  });

  it('should call getCachedData with correct cache key and fetch function', async () => {
    mockGetCachedData.mockResolvedValue(mockWan);

    await GET(mockRequest as any, {} as any);

    expect(mockGetCachedData).toHaveBeenCalledWith(
      'wan',
      expect.any(Function)
    );

    // Verify the fetch function is fritzboxClient.getWanStatus
    const fetchFn = mockGetCachedData.mock.calls[0]?.[1];
    mockFritzboxClient.getWanStatus.mockResolvedValue(mockWan);
    await fetchFn?.();
    expect(mockFritzboxClient.getWanStatus).toHaveBeenCalled();
  });

  it('should propagate errors from fritzboxClient', async () => {
    const error = new Error('WAN query failed');
    mockGetCachedData.mockRejectedValue(error);

    const response = await GET(mockRequest as any, {} as any);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toBe('WAN query failed');
  });
});
