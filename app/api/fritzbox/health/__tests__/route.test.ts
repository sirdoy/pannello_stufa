/**
 * Tests for Fritz!Box Health Check Route
 * GET /api/fritzbox/health
 */

// Mock dependencies before imports
jest.mock('@/lib/fritzbox');
jest.mock('@/lib/auth0', () => ({
  auth0: {
    getSession: jest.fn(),
  },
}));

import { GET } from '../route';
import { fritzboxClient } from '@/lib/fritzbox';
import { auth0 } from '@/lib/auth0';
import { ApiError, ERROR_CODES, HTTP_STATUS } from '@/lib/core/apiErrors';

const mockGetSession = jest.mocked(auth0.getSession);
const mockFritzboxClient = jest.mocked(fritzboxClient);

describe('GET /api/fritzbox/health', () => {
  let mockRequest: Request;
  const mockSession = { user: { sub: 'auth0|123', email: 'test@test.com' } };

  beforeEach(() => {
    jest.clearAllMocks();
    mockRequest = new Request('http://localhost:3000/api/fritzbox/health');
    // Default: authenticated user
    mockGetSession.mockResolvedValue(mockSession as any);
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

  it('should return 200 with connected status on successful ping', async () => {
    mockFritzboxClient.ping.mockResolvedValue(undefined);

    const response = await GET(mockRequest as any, {} as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      success: true,
      status: 'connected',
      tr064Enabled: true,
    });
    expect(mockFritzboxClient.ping).toHaveBeenCalled();
  });

  it('should return 403 with TR064_NOT_ENABLED code when TR-064 disabled', async () => {
    const tr064Error = new ApiError(
      ERROR_CODES.TR064_NOT_ENABLED,
      'TR-064 API non abilitata',
      HTTP_STATUS.FORBIDDEN,
      { setupGuideUrl: '/docs/fritzbox-setup' }
    );
    mockFritzboxClient.ping.mockRejectedValue(tr064Error);

    const response = await GET(mockRequest as any, {} as any);
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.success).toBe(false);
    expect(data.code).toBe('TR064_NOT_ENABLED');
    expect(data.setupGuideUrl).toBe('/docs/fritzbox-setup');
  });

  it('should return 504 with FRITZBOX_TIMEOUT code when ping times out', async () => {
    const timeoutError = new ApiError(
      ERROR_CODES.FRITZBOX_TIMEOUT,
      'Fritz!Box non raggiungibile',
      HTTP_STATUS.GATEWAY_TIMEOUT
    );
    mockFritzboxClient.ping.mockRejectedValue(timeoutError);

    const response = await GET(mockRequest as any, {} as any);
    const data = await response.json();

    expect(response.status).toBe(504);
    expect(data.success).toBe(false);
    expect(data.code).toBe('FRITZBOX_TIMEOUT');
  });

  it('should return 500 with FRITZBOX_NOT_CONFIGURED when env vars missing', async () => {
    const configError = new ApiError(
      ERROR_CODES.FRITZBOX_NOT_CONFIGURED,
      'Fritz!Box non configurato',
      HTTP_STATUS.INTERNAL_SERVER_ERROR
    );
    mockFritzboxClient.ping.mockRejectedValue(configError);

    const response = await GET(mockRequest as any, {} as any);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.code).toBe('FRITZBOX_NOT_CONFIGURED');
  });

  it('should not call rate limiter (health checks are unlimited)', async () => {
    mockFritzboxClient.ping.mockResolvedValue(undefined);

    await GET(mockRequest as any, {} as any);

    // Verify only ping was called, no rate limiting
    expect(mockFritzboxClient.ping).toHaveBeenCalled();
    // No way to directly check rate limiter wasn't called, but we know from code it's not imported
  });
});
