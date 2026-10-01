/**
 * Tests for GET /api/v1/hue/lights/[lightId]
 */

jest.mock('@/lib/hue/hueProxy');
jest.mock('@/lib/auth/session', () => ({
  authSession: { getSession: jest.fn() },
}));

import { GET } from '../route';
import * as hueProxy from '@/lib/hue/hueProxy';
import { authSession } from '@/lib/auth/session';
import { asNextRequest, mockAppSession, routeContext } from '@/__tests__/__utils__/routeHelpers';
import type { HueLight } from '@/types/hueProxy';

const mockGetSession = jest.mocked(authSession.getSession);
const mockGetLight = jest.mocked(hueProxy.getLight);

describe('GET /api/v1/hue/lights/[lightId]', () => {
  let mockRequest: Request;
  const mockContext = routeContext({ lightId: '5' });

  beforeEach(() => {
    jest.clearAllMocks();
    mockRequest = new Request('http://localhost:3000/api/v1/hue/lights/5');
    mockGetSession.mockResolvedValue(mockAppSession());
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  it('should return 401 when not authenticated', async () => {
    mockGetSession.mockResolvedValue(null);

    const response = await GET(asNextRequest(mockRequest), mockContext);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.code).toBe('UNAUTHORIZED');
  });

  it('should return 200 with single light data', async () => {
    const mockData: HueLight = {
      light_id: '5',
      name: 'Bedroom Light',
      on: false,
      brightness: null,
      color_temp: null,
      ct_kelvin: null,
      hue: null,
      saturation: null,
      colormode: null,
      reachable: true,
      capability_tier: 'white',
      room_id: '2',
      room_name: 'Bedroom',
      model_id: 'LWA001',
      light_type: 'Dimmable light',
    };
    mockGetLight.mockResolvedValue(mockData);

    const response = await GET(asNextRequest(mockRequest), mockContext);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(mockGetLight).toHaveBeenCalledWith('5');
  });
});
