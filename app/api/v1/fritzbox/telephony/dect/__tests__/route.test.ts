/**
 * Tests for Fritz!Box Telephony DECT Route
 * GET /api/v1/fritzbox/telephony/dect
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

describe('GET /api/v1/fritzbox/telephony/dect', () => {
  let mockRequest: Request;
  const mockSession = mockAppSession({ sub: 'auth0|123', email: 'test@test.com' });
  // Real backend shape (DectListResponse, backend/api/models.py) — not paginated.
  const mockData = {
    handsets: [
      {
        dect_id: 1,
        name: 'Wohnzimmer',
        phonebook_id: 0,
        model: null,
        registration_status: 'registered',
      },
    ],
    handset_count: 1,
    is_stale: false,
    fetched_at: '2026-02-17T13:00:00Z',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockRequest = new Request('http://localhost:3000/api/v1/fritzbox/telephony/dect');
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

  it('should return 200 with dect data', async () => {
    mockGetCachedData.mockResolvedValue(mockData);

    const response = await GET(asNextRequest(mockRequest), routeContext());
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({ success: true, dect: mockData });
    expect(data.dect.handsets[0].dect_id).toBe(1);
    expect(data.dect.handset_count).toBe(1);
    expect(mockCheckRateLimit).toHaveBeenCalledWith('auth0|123', 'telephony-dect');
  });

  it('should return 429 when rate limited', async () => {
    mockCheckRateLimit.mockResolvedValue({ allowed: false, suppressedCount: 1, nextAllowedIn: 30 });

    const response = await GET(asNextRequest(mockRequest), routeContext());
    const data = await response.json();

    expect(response.status).toBe(429);
    expect(data.success).toBe(false);
    expect(data.code).toBe('RATE_LIMITED');
    expect(data.retryAfter).toBe(30);
    expect(mockGetCachedData).not.toHaveBeenCalled();
  });

  it('should call getCachedData with correct cache key', async () => {
    mockGetCachedData.mockResolvedValue(mockData);

    await GET(asNextRequest(mockRequest), routeContext());

    expect(mockGetCachedData).toHaveBeenCalledWith('telephony-dect', expect.any(Function));

    // Verify the fetch function calls the correct client method
    const fetchFn = mockGetCachedData.mock.calls[0]?.[1];
    mockFritzboxClient.getDectHandsets.mockResolvedValue(mockData);
    await fetchFn?.();
    expect(mockFritzboxClient.getDectHandsets).toHaveBeenCalled();
  });

  it('should propagate errors', async () => {
    const error = new Error('DECT handsets query failed');
    mockGetCachedData.mockRejectedValue(error);

    const response = await GET(asNextRequest(mockRequest), routeContext());
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toBe('DECT handsets query failed');
  });
});
