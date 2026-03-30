/**
 * Tests for POST /api/tuya/plugs/[device_id]/timer
 *
 * NOTE: Returns 200 (not 202) per D-01. Tuya proxy confirms command synchronously.
 */

// Mock dependencies before imports
jest.mock('@/lib/tuya/tuyaProxy');
jest.mock('@/lib/auth0', () => ({
  auth0: { getSession: jest.fn() },
}));

import { POST } from '../route';
import { setTimer } from '@/lib/tuya/tuyaProxy';
import { auth0 } from '@/lib/auth0';
import { ApiError, ERROR_CODES, HTTP_STATUS } from '@/lib/core/apiErrors';

const mockGetSession = jest.mocked(auth0.getSession);
const mockSetTimer = jest.mocked(setTimer);
const mockSession = { user: { sub: 'auth0|123', email: 'test@test.com' } };

const mockPlug = {
  device_id: 'bf123',
  switch_on: true,
  power_w: 5.2,
  voltage_v: 230.1,
  current_ma: 22.0,
  energy_kwh: 1.234,
  countdown_s: 3600,
  data_freshness: 'LIVE' as const,
  last_polled_at: 1743074190.456,
  custom_name: 'Test Plug',
  device_type: 'smart_plug',
};
const mockMutation = { ...mockPlug, data_confirmed: true };

/** Helper to create a mock POST request with JSON body */
function createPostRequest(body: object): any {
  return {
    url: 'http://localhost:3000/api/tuya/plugs/bf123/timer',
    headers: {
      get: (name: string) => {
        if (name.toLowerCase() === 'content-type') return 'application/json';
        return null;
      },
    },
    text: async () => JSON.stringify(body),
  };
}

describe('POST /api/tuya/plugs/[device_id]/timer', () => {
  let mockContext: { params: Promise<{ device_id: string }> };

  beforeEach(() => {
    jest.clearAllMocks();
    mockContext = { params: Promise.resolve({ device_id: 'bf123' }) };
    mockGetSession.mockResolvedValue(mockSession as any);
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  it('should return 401 when not authenticated', async () => {
    mockGetSession.mockResolvedValue(null);

    const response = await POST(createPostRequest({ seconds: 3600 }), mockContext as any);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.code).toBe('UNAUTHORIZED');
  });

  it('should return 200 (not 202) with TuyaPlugMutation', async () => {
    mockSetTimer.mockResolvedValue(mockMutation);

    const response = await POST(createPostRequest({ seconds: 3600 }), mockContext as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(response.status).not.toBe(202);
    expect(data.success).toBe(true);
    expect(data.data_confirmed).toBe(true);
  });

  it('should call setTimer with parsed body { seconds: 3600 } and device_id from path param', async () => {
    mockSetTimer.mockResolvedValue(mockMutation);

    await POST(createPostRequest({ seconds: 3600 }), mockContext as any);

    expect(mockSetTimer).toHaveBeenCalledWith('bf123', { seconds: 3600 });
  });

  it('should call setTimer with seconds=0 to cancel an active timer', async () => {
    mockSetTimer.mockResolvedValue({ ...mockMutation, countdown_s: 0 });

    await POST(createPostRequest({ seconds: 0 }), mockContext as any);

    expect(mockSetTimer).toHaveBeenCalledWith('bf123', { seconds: 0 });
  });

  it('should propagate ApiError on proxy failure', async () => {
    mockSetTimer.mockRejectedValue(
      new ApiError(
        ERROR_CODES.SERVICE_UNAVAILABLE,
        'Tuya plug unreachable',
        HTTP_STATUS.SERVICE_UNAVAILABLE
      )
    );

    const response = await POST(createPostRequest({ seconds: 3600 }), mockContext as any);

    expect(response.status).toBe(503);
  });
});
