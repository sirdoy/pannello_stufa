/**
 * Tests for GET /api/hue/lights
 */

jest.mock('@/lib/hue/hueProxy');
jest.mock('@/lib/auth0', () => ({
  auth0: { getSession: jest.fn() },
}));

import { GET } from '../route';
import * as hueProxy from '@/lib/hue/hueProxy';
import { auth0 } from '@/lib/auth0';
import { ApiError, ERROR_CODES, HTTP_STATUS } from '@/lib/core/apiErrors';

const mockGetSession = jest.mocked(auth0.getSession);
const mockGetLights = jest.mocked(hueProxy.getLights);
const mockSession = { user: { sub: 'auth0|123', email: 'test@test.com' } };

describe('GET /api/hue/lights', () => {
  let mockRequest: Request;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRequest = new Request('http://localhost:3000/api/hue/lights');
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

  it('should return 200 with lights array', async () => {
    const mockData = [
      {
        light_id: '1',
        name: 'Living Room Light',
        on: true,
        brightness: 200,
        ct_mirek: 370,
        ct_kelvin: 2703,
        hue: null,
        saturation: null,
        colormode: 'ct' as const,
        reachable: true,
        capability_tier: 'ambiance' as const,
        room_id: '1',
        room_name: 'Living Room',
        model_id: 'LCA001',
        light_type: 'Color temperature light',
      },
    ];
    mockGetLights.mockResolvedValue(mockData);

    const response = await GET(mockRequest as any, {} as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(Array.isArray(data)).toBe(false); // wrapped in success()
    expect(mockGetLights).toHaveBeenCalled();
  });

  it('should propagate 503 when proxy unavailable', async () => {
    mockGetLights.mockRejectedValue(
      new ApiError(ERROR_CODES.SERVICE_UNAVAILABLE, 'Proxy unavailable', HTTP_STATUS.SERVICE_UNAVAILABLE)
    );

    const response = await GET(mockRequest as any, {} as any);

    expect(response.status).toBe(503);
  });
});
