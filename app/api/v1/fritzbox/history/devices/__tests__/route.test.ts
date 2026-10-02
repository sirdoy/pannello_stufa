/**
 * Tests for Fritz!Box History Devices Raw Route
 * GET /api/v1/fritzbox/history/devices
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

describe('GET /api/v1/fritzbox/history/devices', () => {
  let mockRequest: Request;
  const mockSession = mockAppSession({ sub: 'auth0|123', email: 'test@test.com' });
  const mockData = {
    items: [
      {
        timestamp: 1711324800,
        mac: 'AA:BB:CC:DD:EE:FF',
        name: 'iPhone',
        ip: '192.168.1.100',
        is_online: 1,
      },
    ],
    total_count: 1,
    limit: 100,
    offset: 0,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockRequest = new Request('http://localhost:3000/api/v1/fritzbox/history/devices');
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

  it('should return 200 with devices data', async () => {
    mockFritzboxClient.getDevicePresenceHistory.mockResolvedValue(mockData);

    const response = await GET(asNextRequest(mockRequest), routeContext());
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({ success: true, devices: mockData });
  });

  it('should call fritzboxClient.getDevicePresenceHistory', async () => {
    mockFritzboxClient.getDevicePresenceHistory.mockResolvedValue(mockData);

    await GET(asNextRequest(mockRequest), routeContext());

    expect(mockFritzboxClient.getDevicePresenceHistory).toHaveBeenCalled();
  });

  it('should propagate errors', async () => {
    const error = new Error('Device presence history query failed');
    mockFritzboxClient.getDevicePresenceHistory.mockRejectedValue(error);

    const response = await GET(asNextRequest(mockRequest), routeContext());
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Device presence history query failed');
  });
});
