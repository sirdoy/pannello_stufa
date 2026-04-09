/**
 * Tests for PUT /api/v1/hue/lights/[lightId]/state
 */

jest.mock('@/lib/hue/hueProxy');
jest.mock('@/lib/firebaseAdmin', () => ({ adminDbPush: jest.fn() }));
jest.mock('@/lib/auth0', () => ({
  auth0: { getSession: jest.fn() },
}));

import { PUT } from '../route';
import * as hueProxy from '@/lib/hue/hueProxy';
import { auth0 } from '@/lib/auth0';

const mockGetSession = jest.mocked(auth0.getSession);
const mockSetLightState = jest.mocked(hueProxy.setLightState);
const mockSession = { user: { sub: 'auth0|123', email: 'test@test.com' } };

const mockProxyResponse = {
  command: 'set_light_state' as const,
  status: 'accepted' as const,
  light_id: '1',
  requested_state: { on: true, bri: 200 },
  suggested_poll_delay_s: 2,
  poll_endpoint: '/api/v1/hue/lights/1',
};

describe('PUT /api/v1/hue/lights/[lightId]/state', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSession.mockResolvedValue(mockSession as any);
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  it('should return 401 when not authenticated', async () => {
    mockGetSession.mockResolvedValue(null);
    const req = new Request('http://localhost:3000/api/v1/hue/lights/1/state', {
      method: 'PUT',
      body: JSON.stringify({ on: true }),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await PUT(req as any, { params: Promise.resolve({ lightId: '1' }) } as any);
    expect(response.status).toBe(401);
  });

  it('should call setLightState and return 202', async () => {
    mockSetLightState.mockResolvedValue(mockProxyResponse);
    const req = new Request('http://localhost:3000/api/v1/hue/lights/1/state', {
      method: 'PUT',
      body: JSON.stringify({ on: true, bri: 200 }),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await PUT(req as any, { params: Promise.resolve({ lightId: '1' }) } as any);
    const data = await response.json();

    expect(response.status).toBe(202);
    expect(data.command).toBe('set_light_state');
    expect(mockSetLightState).toHaveBeenCalledWith('1', expect.any(Object));
  });
});
