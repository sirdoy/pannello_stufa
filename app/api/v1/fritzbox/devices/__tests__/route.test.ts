/**
 * Tests for Fritz!Box Devices Route
 * GET /api/v1/fritzbox/devices
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

describe('GET /api/v1/fritzbox/devices', () => {
  let mockRequest: Request;
  const mockSession = mockAppSession({ sub: 'auth0|123', email: 'test@test.com' });
  const mockDevices = [
    { id: 'AA:BB:CC:DD:EE:FF', name: 'iPhone', ip: '192.168.1.100', mac: 'AA:BB:CC:DD:EE:FF', active: true },
    { id: '11:22:33:44:55:66', name: 'MacBook', ip: '192.168.1.101', mac: '11:22:33:44:55:66', active: true },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockRequest = new Request('http://localhost:3000/api/v1/fritzbox/devices');
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
    mockFritzboxClient.getDevices.mockResolvedValue(mockDevices);

    const response = await GET(asNextRequest(mockRequest), routeContext());
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      success: true,
      devices: mockDevices,
    });
    expect(mockFritzboxClient.getDevices).toHaveBeenCalled();
  });

  it('should call fritzboxClient.getDevices', async () => {
    mockFritzboxClient.getDevices.mockResolvedValue(mockDevices);

    await GET(asNextRequest(mockRequest), routeContext());

    expect(mockFritzboxClient.getDevices).toHaveBeenCalled();
  });

  it('should propagate errors from fritzboxClient', async () => {
    const error = new Error('Fritz!Box unreachable');
    mockFritzboxClient.getDevices.mockRejectedValue(error);

    const response = await GET(asNextRequest(mockRequest), routeContext());
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Fritz!Box unreachable');
  });
});
