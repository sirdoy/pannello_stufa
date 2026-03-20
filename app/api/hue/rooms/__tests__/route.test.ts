/**
 * Tests for GET /api/hue/rooms
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
const mockGetGroups = jest.mocked(hueProxy.getGroups);
const mockSession = { user: { sub: 'auth0|123', email: 'test@test.com' } };

describe('GET /api/hue/rooms', () => {
  let mockRequest: Request;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRequest = new Request('http://localhost:3000/api/hue/rooms');
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

  it('should return 200 with groups array', async () => {
    const mockData = [
      {
        group_id: '1',
        name: 'Living Room',
        type: 'Room',
        group_class: 'Living room',
        lights: ['1', '2', '3'],
        any_on: true,
        all_on: false,
        brightness: 180,
        color_temp: 370,
        colormode: 'ct',
      },
    ];
    mockGetGroups.mockResolvedValue(mockData);

    const response = await GET(mockRequest as any, {} as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(mockGetGroups).toHaveBeenCalled();
  });

  it('should propagate 503 when proxy unavailable', async () => {
    mockGetGroups.mockRejectedValue(
      new ApiError(ERROR_CODES.SERVICE_UNAVAILABLE, 'Proxy unavailable', HTTP_STATUS.SERVICE_UNAVAILABLE)
    );

    const response = await GET(mockRequest as any, {} as any);

    expect(response.status).toBe(503);
  });
});
