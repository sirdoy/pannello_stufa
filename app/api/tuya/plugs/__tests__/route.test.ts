/**
 * Tests for GET /api/tuya/plugs
 */

// Mock dependencies before imports
jest.mock('@/lib/tuya/tuyaProxy');
jest.mock('@/lib/auth0', () => ({
  auth0: { getSession: jest.fn() },
}));

import { GET } from '../route';
import { getPlugs } from '@/lib/tuya/tuyaProxy';
import { auth0 } from '@/lib/auth0';
import { ApiError, ERROR_CODES, HTTP_STATUS } from '@/lib/core/apiErrors';

const mockGetSession = jest.mocked(auth0.getSession);
const mockGetPlugs = jest.mocked(getPlugs);
const mockSession = { user: { sub: 'auth0|123', email: 'test@test.com' } };

const mockPlug = {
  device_id: 'bf123',
  switch_on: true,
  power_w: 5.2,
  voltage_v: 230.1,
  current_ma: 22.0,
  energy_kwh: 1.234,
  countdown_s: 0,
  data_freshness: 'LIVE' as const,
  last_polled_at: 1743074190.456,
  custom_name: 'Test Plug',
  device_type: 'smart_plug',
};

describe('GET /api/tuya/plugs', () => {
  let mockRequest: Request;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRequest = new Request('http://localhost:3000/api/tuya/plugs');
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

  it('should return 200 with array of plugs when authenticated', async () => {
    mockGetPlugs.mockResolvedValue([mockPlug]);

    const response = await GET(mockRequest as any, {} as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(mockGetPlugs).toHaveBeenCalled();
  });

  it('should propagate ApiError on proxy failure', async () => {
    mockGetPlugs.mockRejectedValue(
      new ApiError(
        ERROR_CODES.SERVICE_UNAVAILABLE,
        'Tuya proxy unavailable',
        HTTP_STATUS.SERVICE_UNAVAILABLE
      )
    );

    const response = await GET(mockRequest as any, {} as any);

    expect(response.status).toBe(503);
  });
});
