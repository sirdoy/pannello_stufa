/**
 * Tests for Fritz!Box History Devices Daily Route
 * GET /api/v1/fritzbox/history/devices/daily
 */

// Mock dependencies before imports
jest.mock('@/lib/fritzbox');
jest.mock('@/lib/auth/session', () => ({
  authSession: {
    getSession: jest.fn(),
  },
}));

import { GET } from '../route';
import { fritzboxClient } from '@/lib/fritzbox';
import { authSession } from '@/lib/auth/session';
import { asNextRequest, mockAppSession, routeContext } from '@/__tests__/__utils__/routeHelpers';

const mockGetSession = jest.mocked(authSession.getSession);
const mockFritzboxClient = jest.mocked(fritzboxClient);

describe('GET /api/v1/fritzbox/history/devices/daily', () => {
  let mockRequest: Request;
  const mockSession = mockAppSession({ sub: 'auth0|123', email: 'test@test.com' });
  const mockData = {
    items: [
      {
        day_timestamp: 1711238400,
        hour_bucket: 14,
        online_count: 12,
        offline_count: 3,
        total_devices: 15,
      },
    ],
    total_count: 1,
    limit: 100,
    offset: 0,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockRequest = new Request('http://localhost:3000/api/v1/fritzbox/history/devices/daily');
    // Default: authenticated user
    mockGetSession.mockResolvedValue(mockSession);
    // Mock console methods to suppress output
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  it('should return 401 when not authenticated', async () => {
    mockGetSession.mockResolvedValue(null);

    const response = await GET(asNextRequest(mockRequest), routeContext());
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.success).toBe(false);
    expect(data.code).toBe('UNAUTHORIZED');
  });

  it('should return 200 with device count data', async () => {
    mockFritzboxClient.getDevicesDaily.mockResolvedValue(mockData);

    const response = await GET(asNextRequest(mockRequest), routeContext());
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      success: true,
      deviceCounts: mockData,
    });
    expect(mockFritzboxClient.getDevicesDaily).toHaveBeenCalled();
  });

  it('should call fritzboxClient.getDevicesDaily', async () => {
    mockFritzboxClient.getDevicesDaily.mockResolvedValue(mockData);

    await GET(asNextRequest(mockRequest), routeContext());

    expect(mockFritzboxClient.getDevicesDaily).toHaveBeenCalled();
  });

  it('should propagate errors from fritzboxClient', async () => {
    const error = new Error('Device count query failed');
    mockFritzboxClient.getDevicesDaily.mockRejectedValue(error);

    const response = await GET(asNextRequest(mockRequest), routeContext());
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Device count query failed');
  });
});
