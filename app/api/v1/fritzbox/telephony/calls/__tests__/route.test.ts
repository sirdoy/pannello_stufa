/**
 * Tests for Fritz!Box Telephony Calls Route
 * GET /api/v1/fritzbox/telephony/calls
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

const mockGetSession = jest.mocked(authSession.getSession);
const mockFritzboxClient = jest.mocked(fritzboxClient);
const mockGetCachedData = jest.mocked(getCachedData);
const mockCheckRateLimit = jest.mocked(checkRateLimitFritzBox);

describe('GET /api/v1/fritzbox/telephony/calls', () => {
  let mockRequest: Request;
  const mockSession = { user: { sub: 'auth0|123', email: 'test@test.com' } };
  // Real backend shape (PaginatedResponse[CallRecordModel], backend/api/models.py).
  const mockData = {
    items: [
      {
        call_type: 'received',
        call_type_code: 1,
        name: 'Test Caller',
        caller: '+39123456789',
        called: '030987654',
        caller_number: '+39123456789',
        called_number: '030987654',
        date: '2026-02-17T10:30:00',
        duration_seconds: 120,
        device: 'Wohnzimmer',
        port: 'FON1',
      },
    ],
    total_count: 1,
    limit: 20,
    offset: 0,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockRequest = new Request('http://localhost:3000/api/v1/fritzbox/telephony/calls');
    // Default: authenticated user
    mockGetSession.mockResolvedValue(mockSession as any);
    // Default: rate limit allows
    mockCheckRateLimit.mockResolvedValue({ allowed: true, suppressedCount: 0, nextAllowedIn: 0 });
    // Ensure Phase 162 methods exist on the auto-mock (may not be present in main repo yet)
    if (!mockFritzboxClient.getCallHistory) {
      (mockFritzboxClient as any).getCallHistory = jest.fn();
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

  it('should return 200 with calls data', async () => {
    mockGetCachedData.mockResolvedValue(mockData);

    const response = await GET(mockRequest as any, {} as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({ success: true, calls: mockData });
    expect(mockCheckRateLimit).toHaveBeenCalledWith('auth0|123', 'telephony-calls');
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

  it('should call getCachedData with a default cache key when no params are given', async () => {
    mockGetCachedData.mockResolvedValue(mockData);

    await GET(mockRequest as any, {} as any);

    expect(mockGetCachedData).toHaveBeenCalledWith('telephony-calls-all-default-0', expect.any(Function));

    // Verify the fetch function calls the correct client method
    const fetchFn = mockGetCachedData.mock.calls[0]?.[1];
    mockFritzboxClient.getCallHistory.mockResolvedValue(mockData as any);
    await fetchFn?.();
    expect(mockFritzboxClient.getCallHistory).toHaveBeenCalled();
    const params = mockFritzboxClient.getCallHistory.mock.calls[0]?.[0] as URLSearchParams;
    expect(params.toString()).toBe('');
  });

  it('should forward call_type, limit and offset and key the cache on them', async () => {
    mockGetCachedData.mockResolvedValue(mockData);
    const req = new Request(
      'http://localhost:3000/api/v1/fritzbox/telephony/calls?call_type=missed&limit=50&offset=100'
    );

    await GET(req as any, {} as any);

    expect(mockGetCachedData).toHaveBeenCalledWith('telephony-calls-missed-50-100', expect.any(Function));
    const fetchFn = mockGetCachedData.mock.calls[0]?.[1];
    mockFritzboxClient.getCallHistory.mockResolvedValue(mockData as any);
    await fetchFn?.();
    const params = mockFritzboxClient.getCallHistory.mock.calls[0]?.[0] as URLSearchParams;
    expect(params.get('call_type')).toBe('missed');
    expect(params.get('limit')).toBe('50');
    expect(params.get('offset')).toBe('100');
  });

  it('should use distinct cache keys for different pages', async () => {
    mockGetCachedData.mockResolvedValue(mockData);

    await GET(new Request('http://localhost:3000/x?limit=50&offset=0') as any, {} as any);
    await GET(new Request('http://localhost:3000/x?limit=50&offset=50') as any, {} as any);

    const keys = mockGetCachedData.mock.calls.map((c) => c[0]);
    expect(keys[0]).not.toBe(keys[1]);
  });

  it('should drop malformed query params', async () => {
    mockGetCachedData.mockResolvedValue(mockData);
    const req = new Request(
      'http://localhost:3000/x?call_type=../evil&limit=abc&offset=-1'
    );

    await GET(req as any, {} as any);

    expect(mockGetCachedData).toHaveBeenCalledWith('telephony-calls-all-default-0', expect.any(Function));
    const fetchFn = mockGetCachedData.mock.calls[0]?.[1];
    mockFritzboxClient.getCallHistory.mockResolvedValue(mockData as any);
    await fetchFn?.();
    const params = mockFritzboxClient.getCallHistory.mock.calls[0]?.[0] as URLSearchParams;
    expect(params.toString()).toBe('');
  });

  it('should propagate errors', async () => {
    const error = new Error('Call history query failed');
    mockGetCachedData.mockRejectedValue(error);

    const response = await GET(mockRequest as any, {} as any);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Call history query failed');
  });
});
