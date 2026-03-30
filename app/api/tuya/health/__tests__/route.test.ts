/**
 * Tests for GET /api/tuya/health
 *
 * NOTE: Health route uses withErrorHandler (no auth per D-04).
 * No 401 test — the route never checks authentication.
 */

// Mock dependencies before imports
jest.mock('@/lib/tuya/tuyaProxy');
jest.mock('@/lib/auth0', () => ({
  auth0: { getSession: jest.fn() },
}));

import { GET } from '../route';
import { getHealth } from '@/lib/tuya/tuyaProxy';
import { ApiError, ERROR_CODES, HTTP_STATUS } from '@/lib/core/apiErrors';

const mockGetHealth = jest.mocked(getHealth);

const mockHealthData = {
  status: 'ok',
  devices: [
    {
      device_id: 'bf123',
      last_polled_at: 1743074190.456,
      data_freshness: 'LIVE' as const,
    },
  ],
};

describe('GET /api/tuya/health', () => {
  let mockRequest: Request;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRequest = new Request('http://localhost:3000/api/tuya/health');
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  it('should return 200 with health data when getHealth succeeds', async () => {
    mockGetHealth.mockResolvedValue(mockHealthData);

    const response = await GET(mockRequest as any, {} as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.status).toBe('ok');
    expect(data.devices).toHaveLength(1);
    expect(mockGetHealth).toHaveBeenCalled();
  });

  it('should propagate ApiError (503) when getHealth throws SERVICE_UNAVAILABLE', async () => {
    mockGetHealth.mockRejectedValue(
      new ApiError(
        ERROR_CODES.SERVICE_UNAVAILABLE,
        'HA proxy unavailable',
        HTTP_STATUS.SERVICE_UNAVAILABLE
      )
    );

    const response = await GET(mockRequest as any, {} as any);

    expect(response.status).toBe(503);
  });
});
