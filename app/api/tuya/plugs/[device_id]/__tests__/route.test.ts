/**
 * Tests for GET /api/tuya/plugs/[device_id]
 */

// Mock dependencies before imports
jest.mock('@/lib/tuya/tuyaProxy');
jest.mock('@/lib/auth0', () => ({
  auth0: { getSession: jest.fn() },
}));

import { GET } from '../route';
import { getPlug } from '@/lib/tuya/tuyaProxy';
import { auth0 } from '@/lib/auth0';
import { ApiError, ERROR_CODES, HTTP_STATUS } from '@/lib/core/apiErrors';

const mockGetSession = jest.mocked(auth0.getSession);
const mockGetPlug = jest.mocked(getPlug);
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

describe('GET /api/tuya/plugs/[device_id]', () => {
  let mockRequest: Request;
  let mockContext: { params: Promise<{ device_id: string }> };

  beforeEach(() => {
    jest.clearAllMocks();
    mockRequest = new Request('http://localhost:3000/api/tuya/plugs/bf123');
    mockContext = { params: Promise.resolve({ device_id: 'bf123' }) };
    mockGetSession.mockResolvedValue(mockSession as any);
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  it('should return 401 when not authenticated', async () => {
    mockGetSession.mockResolvedValue(null);

    const response = await GET(mockRequest as any, mockContext as any);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.code).toBe('UNAUTHORIZED');
  });

  it('should return 200 with single plug data and call getPlug with device_id', async () => {
    mockGetPlug.mockResolvedValue(mockPlug);

    const response = await GET(mockRequest as any, mockContext as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(mockGetPlug).toHaveBeenCalledWith('bf123');
  });

  it('should propagate ApiError on proxy failure', async () => {
    mockGetPlug.mockRejectedValue(
      new ApiError(
        ERROR_CODES.NOT_FOUND,
        'Plug not found',
        HTTP_STATUS.NOT_FOUND
      )
    );

    const response = await GET(mockRequest as any, mockContext as any);

    expect(response.status).toBe(404);
  });
});
