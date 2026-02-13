/**
 * Tests for Fritz!Box Devices Route
 * GET /api/fritzbox/devices
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

describe('GET /api/fritzbox/devices', () => {
  let mockRequest: Request;
  const mockSession = { user: { sub: 'auth0|123', email: 'test@test.com' } };
  const mockDevices = [
    { name: 'iPhone', ip: '192.168.1.100', mac: 'AA:BB:CC:DD:EE:FF', active: true },
    { name: 'MacBook', ip: '192.168.1.101', mac: '11:22:33:44:55:66', active: true },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockRequest = new Request('http://localhost:3000/api/fritzbox/devices');
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

  it('should return 200 with devices data when rate limit allows and cache provides data', async () => {
    mockGetCachedData.mockResolvedValue(mockDevices);

    const response = await GET(mockRequest as any, {} as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      success: true,
      devices: mockDevices,
    });
    expect(mockCheckRateLimit).toHaveBeenCalledWith('auth0|123', 'devices');
    expect(mockGetCachedData).toHaveBeenCalled();
  });

  it('should return 429 with RATE_LIMITED code and retryAfter when rate limit exceeded', async () => {
    mockCheckRateLimit.mockResolvedValue({ allowed: false, suppressedCount: 1, nextAllowedIn: 42 });

    const response = await GET(mockRequest as any, {} as any);
    const data = await response.json();

    expect(response.status).toBe(429);
    expect(data.success).toBe(false);
    expect(data.code).toBe('RATE_LIMITED');
    expect(data.error).toContain('Troppe richieste');
    expect(data.error).toContain('42s');
    expect(data.retryAfter).toBe(42);
    expect(mockGetCachedData).not.toHaveBeenCalled();
  });

  it('should call getCachedData with correct cache key and fetch function', async () => {
    mockGetCachedData.mockResolvedValue(mockDevices);

    await GET(mockRequest as any, {} as any);

    expect(mockGetCachedData).toHaveBeenCalledWith(
      'devices',
      expect.any(Function)
    );

    // Verify the fetch function is fritzboxClient.getDevices
    const fetchFn = mockGetCachedData.mock.calls[0]?.[1];
    mockFritzboxClient.getDevices.mockResolvedValue(mockDevices);
    await fetchFn?.();
    expect(mockFritzboxClient.getDevices).toHaveBeenCalled();
  });

  it('should propagate errors from fritzboxClient', async () => {
    const error = new Error('Fritz!Box unreachable');
    mockGetCachedData.mockRejectedValue(error);

    const response = await GET(mockRequest as any, {} as any);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Fritz!Box unreachable');
  });
});
