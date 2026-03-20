/**
 * Tests for GET /api/hue/lights/[id]
 * Tests for PUT /api/hue/lights/[id]
 */

jest.mock('@/lib/hue/hueProxy');
jest.mock('@/lib/firebaseAdmin', () => ({ adminDbPush: jest.fn() }));
jest.mock('@/lib/auth0', () => ({
  auth0: { getSession: jest.fn() },
}));

import { GET, PUT } from '../route';
import * as hueProxy from '@/lib/hue/hueProxy';
import { auth0 } from '@/lib/auth0';
import { ApiError, ERROR_CODES, HTTP_STATUS } from '@/lib/core/apiErrors';

const mockGetSession = jest.mocked(auth0.getSession);
const mockGetLight = jest.mocked(hueProxy.getLight);
const mockSetLightState = jest.mocked(hueProxy.setLightState);
const mockSession = { user: { sub: 'auth0|123', email: 'test@test.com' } };

describe('GET /api/hue/lights/[id]', () => {
  let mockRequest: Request;
  let mockContext: { params: Promise<{ id: string }> };

  beforeEach(() => {
    jest.clearAllMocks();
    mockRequest = new Request('http://localhost:3000/api/hue/lights/5');
    mockContext = { params: Promise.resolve({ id: '5' }) };
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

  it('should return 200 with single light data', async () => {
    const mockData = {
      light_id: '5',
      name: 'Bedroom Light',
      on: false,
      brightness: null,
      ct_mirek: null,
      ct_kelvin: null,
      hue: null,
      saturation: null,
      colormode: null,
      reachable: true,
      capability_tier: 'white' as const,
      room_id: '2',
      room_name: 'Bedroom',
      model_id: 'LWA001',
      light_type: 'Dimmable light',
    };
    mockGetLight.mockResolvedValue(mockData);

    const response = await GET(mockRequest as any, mockContext as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(mockGetLight).toHaveBeenCalledWith('5');
  });
});

describe('PUT /api/hue/lights/[id]', () => {
  const mockProxyResponse = {
    command: 'set_light_state' as const,
    status: 'accepted' as const,
    light_id: '1',
    requested_state: { on: true, bri: 200 },
    suggested_poll_delay_s: 2,
    poll_endpoint: '/api/v1/hue/lights/1',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSession.mockResolvedValue(mockSession as any);
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  it('should return 401 when not authenticated', async () => {
    mockGetSession.mockResolvedValue(null);
    const req = new Request('http://localhost:3000/api/hue/lights/1', {
      method: 'PUT',
      body: JSON.stringify({ on: true }),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await PUT(req as any, { params: Promise.resolve({ id: '1' }) } as any);
    expect(response.status).toBe(401);
  });

  it('should call setLightState and return 202', async () => {
    mockSetLightState.mockResolvedValue(mockProxyResponse);
    const req = new Request('http://localhost:3000/api/hue/lights/1', {
      method: 'PUT',
      body: JSON.stringify({ on: true, bri: 200 }),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await PUT(req as any, { params: Promise.resolve({ id: '1' }) } as any);
    const data = await response.json();

    expect(response.status).toBe(202);
    expect(data.command).toBe('set_light_state');
    expect(data.suggested_poll_delay_s).toBe(2);
    // setLightState called with light id and parsed body
    expect(mockSetLightState).toHaveBeenCalledWith('1', expect.any(Object));
  });

  it('should return 409 when light is unreachable', async () => {
    mockSetLightState.mockRejectedValue(
      new ApiError(ERROR_CODES.CONFLICT, 'Light unreachable', HTTP_STATUS.CONFLICT)
    );
    const req = new Request('http://localhost:3000/api/hue/lights/1', {
      method: 'PUT',
      body: JSON.stringify({ on: true }),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await PUT(req as any, { params: Promise.resolve({ id: '1' }) } as any);
    expect(response.status).toBe(409);
  });
});
