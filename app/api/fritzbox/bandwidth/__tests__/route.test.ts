/**
 * Tests for Fritz!Box Bandwidth Route
 * GET /api/fritzbox/bandwidth
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

describe('GET /api/fritzbox/bandwidth', () => {
  let mockRequest: Request;
  const mockSession = { user: { sub: 'auth0|123', email: 'test@test.com' } };
  const mockBandwidth = {
    uploadCurrent: 1024,
    downloadCurrent: 5120,
    uploadMax: 10240,
    downloadMax: 51200,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockRequest = new Request('http://localhost:3000/api/fritzbox/bandwidth');
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

  it('should return 200 with bandwidth data when rate limit allows and cache provides data', async () => {
    mockGetCachedData.mockResolvedValue(mockBandwidth);

    const response = await GET(mockRequest as any, {} as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      success: true,
      bandwidth: mockBandwidth,
    });
    expect(mockCheckRateLimit).toHaveBeenCalledWith('auth0|123', 'bandwidth');
    expect(mockGetCachedData).toHaveBeenCalled();
  });

  it('should return 429 with RATE_LIMITED code and retryAfter when rate limit exceeded', async () => {
    mockCheckRateLimit.mockResolvedValue({ allowed: false, suppressedCount: 1, nextAllowedIn: 30 });

    const response = await GET(mockRequest as any, {} as any);
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
    mockGetCachedData.mockResolvedValue(mockBandwidth);

    await GET(mockRequest as any, {} as any);

    expect(mockGetCachedData).toHaveBeenCalledWith(
      'bandwidth',
      expect.any(Function)
    );

    // Verify the fetch function is fritzboxClient.getBandwidth
    const fetchFn = mockGetCachedData.mock.calls[0]?.[1];
    mockFritzboxClient.getBandwidth.mockResolvedValue(mockBandwidth);
    await fetchFn?.();
    expect(mockFritzboxClient.getBandwidth).toHaveBeenCalled();
  });

  it('should propagate errors from fritzboxClient', async () => {
    const error = new Error('Bandwidth query failed');
    mockGetCachedData.mockRejectedValue(error);

    const response = await GET(mockRequest as any, {} as any);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Bandwidth query failed');
  });
});
