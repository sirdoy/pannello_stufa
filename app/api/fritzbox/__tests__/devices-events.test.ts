/**
 * Tests for /api/fritzbox/devices event detection
 *
 * Verifies device state change detection and event logging side-effect
 * Phase 65: Device History Timeline
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
  getDeviceStates,
  updateDeviceStates,
  logDeviceEvent,
} from '@/lib/fritzbox';
import { auth0 } from '@/lib/auth0';

// Device type (matches fritzboxClient.getDevices() return type)
type Device = {
  id: string;
  name: string;
  ip: string;
  mac: string;
  active: boolean;
};

const mockGetSession = jest.mocked(auth0.getSession);
const mockGetCachedData = jest.mocked(getCachedData);
const mockCheckRateLimit = jest.mocked(checkRateLimitFritzBox);
const mockGetDeviceStates = jest.mocked(getDeviceStates);
const mockUpdateDeviceStates = jest.mocked(updateDeviceStates);
const mockLogDeviceEvent = jest.mocked(logDeviceEvent);

describe('GET /api/fritzbox/devices event detection', () => {
  let mockRequest: Request;
  const mockSession = { user: { sub: 'auth0|123', email: 'test@test.com' } };

  beforeEach(() => {
    jest.clearAllMocks();
    mockRequest = new Request('http://localhost:3000/api/fritzbox/devices');

    // Default: authenticated user
    mockGetSession.mockResolvedValue(mockSession as any);

    // Default: rate limit allows
    mockCheckRateLimit.mockResolvedValue({
      allowed: true,
      suppressedCount: 0,
      nextAllowedIn: 0
    });

    // Default: event logger functions resolve
    mockUpdateDeviceStates.mockResolvedValue(undefined);
    mockLogDeviceEvent.mockResolvedValue(undefined);

    // Mock console to suppress output
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  test('new device appears -> logs connected event', async () => {
    const devices: Device[] = [
      {
        id: 'AA:BB:CC:DD:EE:FF',
        mac: 'AA:BB:CC:DD:EE:FF',
        name: 'New Device',
        ip: '192.168.1.100',
        active: true,
      },
    ];

    mockGetCachedData.mockResolvedValue(devices);
    mockGetDeviceStates.mockResolvedValue(new Map()); // No previous state

    const response = await GET(mockRequest as any, {} as any);
    const data = await response.json();

    // Should log connected event for new active device
    expect(mockLogDeviceEvent).toHaveBeenCalledWith({
      deviceMac: 'AA:BB:CC:DD:EE:FF',
      deviceName: 'New Device',
      deviceIp: '192.168.1.100',
      eventType: 'connected',
      timestamp: expect.any(Number),
    });

    // Should update device states
    expect(mockUpdateDeviceStates).toHaveBeenCalledWith(
      new Map([['AA:BB:CC:DD:EE:FF', { active: true, lastSeen: expect.any(Number) }]])
    );

    // Should return success response
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.devices).toEqual(devices);
  });

  test('device goes offline -> logs disconnected event', async () => {
    const devices: Device[] = [
      {
        id: 'AA:BB:CC:DD:EE:FF',
        mac: 'AA:BB:CC:DD:EE:FF',
        name: 'Device',
        ip: '192.168.1.100',
        active: false,
      },
    ];

    mockGetCachedData.mockResolvedValue(devices);
    mockGetDeviceStates.mockResolvedValue(
      new Map([['AA:BB:CC:DD:EE:FF', { active: true, lastSeen: Date.now() - 10000 }]])
    );

    const response = await GET(mockRequest as any, {} as any);
    const data = await response.json();

    // Should log disconnected event
    expect(mockLogDeviceEvent).toHaveBeenCalledWith({
      deviceMac: 'AA:BB:CC:DD:EE:FF',
      deviceName: 'Device',
      deviceIp: '192.168.1.100',
      eventType: 'disconnected',
      timestamp: expect.any(Number),
    });

    // Should update device states
    expect(mockUpdateDeviceStates).toHaveBeenCalledWith(
      new Map([['AA:BB:CC:DD:EE:FF', { active: false, lastSeen: expect.any(Number) }]])
    );

    // Should return success
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });

  test('device comes online -> logs connected event', async () => {
    const devices: Device[] = [
      {
        id: 'AA:BB:CC:DD:EE:FF',
        mac: 'AA:BB:CC:DD:EE:FF',
        name: 'Device',
        ip: '192.168.1.100',
        active: true,
      },
    ];

    mockGetCachedData.mockResolvedValue(devices);
    mockGetDeviceStates.mockResolvedValue(
      new Map([['AA:BB:CC:DD:EE:FF', { active: false, lastSeen: Date.now() - 10000 }]])
    );

    const response = await GET(mockRequest as any, {} as any);
    const data = await response.json();

    // Should log connected event
    expect(mockLogDeviceEvent).toHaveBeenCalledWith({
      deviceMac: 'AA:BB:CC:DD:EE:FF',
      deviceName: 'Device',
      deviceIp: '192.168.1.100',
      eventType: 'connected',
      timestamp: expect.any(Number),
    });

    // Should update device states
    expect(mockUpdateDeviceStates).toHaveBeenCalledWith(
      new Map([['AA:BB:CC:DD:EE:FF', { active: true, lastSeen: expect.any(Number) }]])
    );

    // Should return success
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });

  test('no state change -> does NOT call logDeviceEvent', async () => {
    const devices: Device[] = [
      {
        id: 'AA:BB:CC:DD:EE:FF',
        mac: 'AA:BB:CC:DD:EE:FF',
        name: 'Device',
        ip: '192.168.1.100',
        active: true,
      },
    ];

    mockGetCachedData.mockResolvedValue(devices);
    mockGetDeviceStates.mockResolvedValue(
      new Map([['AA:BB:CC:DD:EE:FF', { active: true, lastSeen: Date.now() - 10000 }]])
    );

    const response = await GET(mockRequest as any, {} as any);
    const data = await response.json();

    // Should NOT log event (no state change)
    expect(mockLogDeviceEvent).not.toHaveBeenCalled();

    // Should still update device states with current timestamp
    expect(mockUpdateDeviceStates).toHaveBeenCalledWith(
      new Map([['AA:BB:CC:DD:EE:FF', { active: true, lastSeen: expect.any(Number) }]])
    );

    // Should return success response
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.devices).toEqual(devices);
  });

  test('event logging throws error -> devices response still returns successfully', async () => {
    const devices: Device[] = [
      {
        id: 'AA:BB:CC:DD:EE:FF',
        mac: 'AA:BB:CC:DD:EE:FF',
        name: 'Device',
        ip: '192.168.1.100',
        active: true,
      },
    ];

    mockGetCachedData.mockResolvedValue(devices);
    mockGetDeviceStates.mockResolvedValue(new Map()); // New device
    mockLogDeviceEvent.mockRejectedValue(new Error('Firebase write failed'));

    const response = await GET(mockRequest as any, {} as any);
    const data = await response.json();

    // Should still return success despite logging error
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.devices).toEqual(devices);

    // Should have logged error
    expect(console.error).toHaveBeenCalledWith(
      '[FritzBox/Devices] Event detection error:',
      expect.any(Error)
    );
  });

  test('getDeviceStates returns empty Map -> all active devices get connected events', async () => {
    const devices: Device[] = [
      {
        id: 'AA:BB:CC:DD:EE:FF',
        mac: 'AA:BB:CC:DD:EE:FF',
        name: 'Device 1',
        ip: '192.168.1.100',
        active: true,
      },
      {
        id: 'BB:CC:DD:EE:FF:00',
        mac: 'BB:CC:DD:EE:FF:00',
        name: 'Device 2',
        ip: '192.168.1.101',
        active: true,
      },
      {
        id: 'CC:DD:EE:FF:00:11',
        mac: 'CC:DD:EE:FF:00:11',
        name: 'Device 3',
        ip: '192.168.1.102',
        active: false,
      },
    ];

    mockGetCachedData.mockResolvedValue(devices);
    mockGetDeviceStates.mockResolvedValue(new Map()); // No previous states

    const response = await GET(mockRequest as any, {} as any);
    const data = await response.json();

    // Should log connected events for active devices only
    expect(mockLogDeviceEvent).toHaveBeenCalledTimes(2);
    expect(mockLogDeviceEvent).toHaveBeenCalledWith({
      deviceMac: 'AA:BB:CC:DD:EE:FF',
      deviceName: 'Device 1',
      deviceIp: '192.168.1.100',
      eventType: 'connected',
      timestamp: expect.any(Number),
    });
    expect(mockLogDeviceEvent).toHaveBeenCalledWith({
      deviceMac: 'BB:CC:DD:EE:FF:00',
      deviceName: 'Device 2',
      deviceIp: '192.168.1.101',
      eventType: 'connected',
      timestamp: expect.any(Number),
    });

    // Should update all device states
    expect(mockUpdateDeviceStates).toHaveBeenCalledWith(
      new Map([
        ['AA:BB:CC:DD:EE:FF', { active: true, lastSeen: expect.any(Number) }],
        ['BB:CC:DD:EE:FF:00', { active: true, lastSeen: expect.any(Number) }],
        ['CC:DD:EE:FF:00:11', { active: false, lastSeen: expect.any(Number) }],
      ])
    );

    // Should return success
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });
});
