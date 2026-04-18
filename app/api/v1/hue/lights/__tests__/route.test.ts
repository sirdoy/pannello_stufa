/**
 * Tests for GET /api/v1/hue/lights
 */

jest.mock('@/lib/hue/hueProxy');
jest.mock('@/lib/auth0', () => ({
  auth0: { getSession: jest.fn() },
}));

import { GET } from '../route';
import * as hueProxy from '@/lib/hue/hueProxy';
import { auth0 } from '@/lib/auth0';

const mockGetSession = jest.mocked(auth0.getSession);
const mockGetLights = jest.mocked(hueProxy.getLights);
const mockSession = { user: { sub: 'auth0|123', email: 'test@test.com' } };

describe('GET /api/v1/hue/lights', () => {
  const mockLightsData = [
    {
      light_id: '1',
      name: 'Desk Lamp',
      on: true,
      brightness: 254,
      reachable: true,
      type: 'Extended color light',
    },
    {
      light_id: '2',
      name: 'Ceiling',
      on: false,
      brightness: 0,
      reachable: true,
      type: 'Color temperature light',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSession.mockResolvedValue(mockSession as any);
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  it('should return 401 when not authenticated', async () => {
    mockGetSession.mockResolvedValue(null);
    const req = new Request('http://localhost:3000/api/v1/hue/lights');

    const response = await GET(req as any, {} as any);

    expect(response.status).toBe(401);
  });

  it('should return 200 with lights array', async () => {
    mockGetLights.mockResolvedValue(mockLightsData as any);
    const req = new Request('http://localhost:3000/api/v1/hue/lights');

    const response = await GET(req as any, {} as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.lights).toBeInstanceOf(Array);
    expect(data.lights).toHaveLength(2);
    expect(mockGetLights).toHaveBeenCalled();
  });
});
