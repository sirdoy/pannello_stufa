/**
 * Tests for POST /api/tuya/plugs/[device_id]/state
 *
 * NOTE: Returns 200 (not 202) per D-01. Tuya proxy confirms command synchronously.
 */

// Mock dependencies before imports
jest.mock('@/lib/tuya/tuyaProxy');
jest.mock('@/lib/auth0', () => ({
  auth0: { getSession: jest.fn() },
}));

import { POST } from '../route';
import { setState } from '@/lib/tuya/tuyaProxy';
import { auth0 } from '@/lib/auth0';
import { ApiError, ERROR_CODES, HTTP_STATUS } from '@/lib/core/apiErrors';

const mockGetSession = jest.mocked(auth0.getSession);
const mockSetState = jest.mocked(setState);
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
const mockMutation = { ...mockPlug, data_confirmed: true };

/** Helper to create a mock POST request with JSON body */
function createPostRequest(body: object): any {
  return {
    url: 'http://localhost:3000/api/tuya/plugs/bf123/state',
    headers: {
      get: (name: string) => {
        if (name.toLowerCase() === 'content-type') return 'application/json';
        return null;
      },
    },
    text: async () => JSON.stringify(body),
  };
}

describe('POST /api/tuya/plugs/[device_id]/state', () => {
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

    const response = await POST(createPostRequest({ on: true }), mockContext as any);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.code).toBe('UNAUTHORIZED');
  });

  it('should return 200 (not 202) with TuyaPlugMutation including data_confirmed', async () => {
    mockSetState.mockResolvedValue(mockMutation);

    const response = await POST(createPostRequest({ on: true }), mockContext as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(response.status).not.toBe(202);
    expect(data.success).toBe(true);
    expect(data.data_confirmed).toBe(true);
  });

  it('should call setState with parsed body { on: true } and device_id from path param', async () => {
    mockSetState.mockResolvedValue(mockMutation);

    await POST(createPostRequest({ on: true }), mockContext as any);

    expect(mockSetState).toHaveBeenCalledWith('bf123', { on: true });
  });

  it('should call setState with { on: false } when toggling off', async () => {
    mockSetState.mockResolvedValue({ ...mockMutation, switch_on: false });

    await POST(createPostRequest({ on: false }), mockContext as any);

    expect(mockSetState).toHaveBeenCalledWith('bf123', { on: false });
  });

  it('should propagate ApiError on proxy failure', async () => {
    mockSetState.mockRejectedValue(
      new ApiError(
        ERROR_CODES.SERVICE_UNAVAILABLE,
        'Tuya plug unreachable',
        HTTP_STATUS.SERVICE_UNAVAILABLE
      )
    );

    const response = await POST(createPostRequest({ on: true }), mockContext as any);

    expect(response.status).toBe(503);
  });
});
