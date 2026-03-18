/**
 * Tests for /api/fritzbox/devices route behavior
 *
 * Verifies rate limiting, cached device retrieval, and response shape.
 * Event detection logic was moved to HA proxy (no longer in this route).
 * Phase 93: Test Fix TFIX-08
 */

// Mock dependencies before imports
jest.mock('@/lib/fritzbox');
jest.mock('@/lib/auth0', () => ({
  auth0: {
    getSession: jest.fn(),
  },
}));

import { GET } from '../devices/route';
import {
  getCachedData,
  checkRateLimitFritzBox,
  fritzboxClient,
  getDeviceStates,
  updateDeviceStates,
  logDeviceEvent,
} from '@/lib/fritzbox';
import { auth0 } from '@/lib/auth0';

const mockGetSession = jest.mocked(auth0.getSession);
const mockGetCachedData = jest.mocked(getCachedData);
const mockCheckRateLimit = jest.mocked(checkRateLimitFritzBox);
const mockGetDeviceStates = jest.mocked(getDeviceStates);
const mockUpdateDeviceStates = jest.mocked(updateDeviceStates);
const mockLogDeviceEvent = jest.mocked(logDeviceEvent);

describe('GET /api/fritzbox/devices', () => {
  let mockRequest: Request;
  const mockSession = { user: { sub: 'auth0|123', email: 'test@test.com' } };

  const mockDevices = [
    { id: 'AA:BB:CC:DD:EE:FF', mac: 'AA:BB:CC:DD:EE:FF', name: 'Device 1', ip: '192.168.1.100', active: true },
    { id: 'BB:CC:DD:EE:FF:00', mac: 'BB:CC:DD:EE:FF:00', name: 'Device 2', ip: '192.168.1.101', active: false },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockRequest = new Request('http://localhost:3000/api/fritzbox/devices');

    // Default: authenticated user
    mockGetSession.mockResolvedValue(mockSession as any);

    // Default: rate limit allows
    mockCheckRateLimit.mockResolvedValue({
      allowed: true,
      suppressedCount: 0,
      nextAllowedIn: 0,
    });

    // Mock console to suppress output
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  test('returns devices list on success', async () => {
    mockGetCachedData.mockResolvedValue(mockDevices);

    const response = await GET(mockRequest as any, {} as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.devices).toEqual(mockDevices);
    expect(mockGetCachedData).toHaveBeenCalledWith('devices', expect.any(Function));
  });

  test('returns empty array when no devices', async () => {
    mockGetCachedData.mockResolvedValue([]);

    const response = await GET(mockRequest as any, {} as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.devices).toEqual([]);
  });

  test('rate limit exceeded returns 429', async () => {
    mockCheckRateLimit.mockResolvedValue({
      allowed: false,
      suppressedCount: 5,
      nextAllowedIn: 30,
    });

    const response = await GET(mockRequest as any, {} as any);

    expect(response.status).toBe(429);
  });

  test('passes session user sub to rate limit check', async () => {
    mockGetCachedData.mockResolvedValue(mockDevices);

    await GET(mockRequest as any, {} as any);

    expect(mockCheckRateLimit).toHaveBeenCalledWith('auth0|123', 'devices');
  });

  test('getCachedData uses fritzboxClient.getDevices as fetcher', async () => {
    mockGetCachedData.mockResolvedValue(mockDevices);
    jest.mocked(fritzboxClient).getDevices = jest.fn().mockResolvedValue(mockDevices);

    await GET(mockRequest as any, {} as any);

    const fetcher = mockGetCachedData.mock.calls[0]?.[1];
    expect(fetcher).toBeDefined();
    if (fetcher) {
      await fetcher();
      expect(jest.mocked(fritzboxClient).getDevices).toHaveBeenCalled();
    }
  });

  test('does not call any event detection functions', async () => {
    mockGetCachedData.mockResolvedValue(mockDevices);

    await GET(mockRequest as any, {} as any);

    expect(mockGetDeviceStates).not.toHaveBeenCalled();
    expect(mockUpdateDeviceStates).not.toHaveBeenCalled();
    expect(mockLogDeviceEvent).not.toHaveBeenCalled();
  });
});
