/**
 * Tests for PUT /api/v1/hue/lights/[lightId]/state
 */

jest.mock('@/lib/hue/hueProxy');
jest.mock('@/lib/firebaseAdmin', () => ({ adminDbPush: jest.fn() }));
jest.mock('@/lib/auth/session', () => ({
  authSession: { getSession: jest.fn() },
}));

import { PUT } from '../route';
import * as hueProxy from '@/lib/hue/hueProxy';
import { authSession } from '@/lib/auth/session';
import { asNextRequest, mockAppSession, routeContext } from '@/__tests__/__utils__/routeHelpers';
import type { HueCommandResponse } from '@/types/hueProxy';

const mockGetSession = jest.mocked(authSession.getSession);
const mockSetLightState = jest.mocked(hueProxy.setLightState);

const mockProxyResponse: HueCommandResponse = {
  light_id: '1',
  name: 'Lampada',
  on: true,
  brightness: 200,
  ct_mirek: null,
  ct_kelvin: null,
  hue: null,
  saturation: null,
  colormode: null,
  reachable: true,
  capability_tier: 'white',
  room_id: null,
  room_name: null,
  model_id: null,
  light_type: null,
  data_confirmed: true,
};

describe('PUT /api/v1/hue/lights/[lightId]/state', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSession.mockResolvedValue(mockAppSession());
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

    const response = await PUT(asNextRequest(req), routeContext({ lightId: '1' }));
    expect(response.status).toBe(401);
  });

  it('should call setLightState and return 202', async () => {
    mockSetLightState.mockResolvedValue(mockProxyResponse);
    const req = new Request('http://localhost:3000/api/v1/hue/lights/1/state', {
      method: 'PUT',
      body: JSON.stringify({ on: true, bri: 200 }),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await PUT(asNextRequest(req), routeContext({ lightId: '1' }));
    const data = await response.json();

    expect(response.status).toBe(202);
    expect(data.light_id).toBe('1');
    expect(data.data_confirmed).toBe(true);
    expect(mockSetLightState).toHaveBeenCalledWith('1', expect.any(Object));
  });
});
