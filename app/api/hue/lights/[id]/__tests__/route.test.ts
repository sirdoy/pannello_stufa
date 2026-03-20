/**
 * Tests for GET /api/hue/lights/[id]
 * Only the GET handler is tested here; PUT is legacy (Phase 107 concern).
 */

jest.mock('@/lib/hue/hueProxy');
jest.mock('@/lib/auth0', () => ({
  auth0: { getSession: jest.fn() },
}));

import { GET } from '../route';
import * as hueProxy from '@/lib/hue/hueProxy';
import { auth0 } from '@/lib/auth0';

const mockGetSession = jest.mocked(auth0.getSession);
const mockGetLight = jest.mocked(hueProxy.getLight);
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
