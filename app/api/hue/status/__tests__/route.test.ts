/**
 * Tests for GET /api/hue/status
 */

jest.mock('@/lib/hue/hueProxy');
jest.mock('@/lib/auth0', () => ({
  auth0: { getSession: jest.fn() },
}));

import { GET } from '../route';
import * as hueProxy from '@/lib/hue/hueProxy';
import { auth0 } from '@/lib/auth0';
import { ApiError, ERROR_CODES, HTTP_STATUS } from '@/lib/core/apiErrors';

const mockGetSession = jest.mocked(auth0.getSession);
const mockGetHealth = jest.mocked(hueProxy.getHealth);
const mockSession = { user: { sub: 'auth0|123', email: 'test@test.com' } };

describe('GET /api/hue/status', () => {
  let mockRequest: Request;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRequest = new Request('http://localhost:3000/api/hue/status');
    mockGetSession.mockResolvedValue(mockSession as any);
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  it('should return 401 when not authenticated', async () => {
    mockGetSession.mockResolvedValue(null);

    const response = await GET(mockRequest as any, {} as any);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.code).toBe('UNAUTHORIZED');
  });

  it('should return 200 with bridge health data', async () => {
    const mockData = {
      connected: true,
      data_freshness: 'LIVE' as const,
      light_count: 8,
      firmware_version: '1.60',
      api_version: '1.60.0',
      last_poll_at: '2026-03-19T08:51:32+00:00',
      last_success_at: '2026-03-19T08:51:32+00:00',
    };
    mockGetHealth.mockResolvedValue(mockData);

    const response = await GET(mockRequest as any, {} as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.connected).toBe(true);
    expect(data.data_freshness).toBe('LIVE');
    expect(mockGetHealth).toHaveBeenCalled();
  });

  it('should propagate 503 when bridge unreachable', async () => {
    mockGetHealth.mockRejectedValue(
      new ApiError(ERROR_CODES.SERVICE_UNAVAILABLE, 'Bridge unreachable', HTTP_STATUS.SERVICE_UNAVAILABLE)
    );

    const response = await GET(mockRequest as any, {} as any);

    expect(response.status).toBe(503);
  });
});
