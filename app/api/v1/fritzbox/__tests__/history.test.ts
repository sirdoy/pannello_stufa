/**
 * Tests for /api/v1/fritzbox/history endpoint
 *
 * Verifies device event history is served from the backend
 * (/api/v1/fritzbox/history/device-events via fritzboxClient.getDeviceEvents),
 * not from the dead Firebase event log.
 */

// Mock dependencies before imports
jest.mock('@/lib/fritzbox');
jest.mock('@/lib/auth/session', () => ({
  authSession: {
    getSession: jest.fn(),
  },
}));

import { GET } from '../history/route';
import { fritzboxClient, getDeviceEvents } from '@/lib/fritzbox';
import { authSession } from '@/lib/auth/session';
import type { DeviceEvent } from '@/app/components/devices/network/types';

const mockGetSession = jest.mocked(authSession.getSession);
const mockClientGetDeviceEvents = jest.fn();
const mockFirebaseGetDeviceEvents = jest.mocked(getDeviceEvents);

describe('GET /api/v1/fritzbox/history', () => {
  let mockRequest: Request;
  const mockSession = { user: { sub: 'auth0|123', email: 'test@test.com' } };
  const now = Date.now();

  // Shape produced by fritzboxClient.getDeviceEvents from backend DeviceEventRecord
  // ({ timestamp (s), mac, name, ip, event_type }) → camelCase, timestamp in ms.
  const mockEvents: DeviceEvent[] = [
    { deviceMac: 'BB:CC:DD:EE:FF:00', deviceName: 'Device 2', deviceIp: '192.168.1.101', eventType: 'disconnected', timestamp: now - 7200000 },
    { deviceMac: 'AA:BB:CC:DD:EE:FF', deviceName: 'Device 1', deviceIp: '192.168.1.100', eventType: 'connected', timestamp: now - 3600000 },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSession.mockResolvedValue(mockSession as any);
    (fritzboxClient as any).getDeviceEvents = mockClientGetDeviceEvents;
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  test('default range (24h) fetches 24h of backend events, newest first', async () => {
    mockClientGetDeviceEvents.mockResolvedValue(mockEvents);

    mockRequest = new Request('http://localhost:3000/api/v1/fritzbox/history');
    const response = await GET(mockRequest as any, {} as any);
    const data = await response.json();

    expect(mockClientGetDeviceEvents).toHaveBeenCalledWith(24, undefined);
    expect(mockFirebaseGetDeviceEvents).not.toHaveBeenCalled();
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.events).toEqual([mockEvents[1], mockEvents[0]]);
    expect(data.range).toBe('24h');
    expect(data.totalCount).toBe(2);
  });

  test.each([
    ['7d', 168],
    ['1h', 1],
    ['invalid', 24],
  ])('range=%s requests %i hours', async (range, hours) => {
    mockClientGetDeviceEvents.mockResolvedValue([]);

    mockRequest = new Request(`http://localhost:3000/api/v1/fritzbox/history?range=${range}`);
    const response = await GET(mockRequest as any, {} as any);
    const data = await response.json();

    expect(mockClientGetDeviceEvents).toHaveBeenCalledWith(hours, undefined);
    expect(response.status).toBe(200);
    expect(data.range).toBe(range === 'invalid' ? '24h' : range);
  });

  test('device filter is forwarded to the backend as mac', async () => {
    mockClientGetDeviceEvents.mockResolvedValue([mockEvents[1]]);

    mockRequest = new Request('http://localhost:3000/api/v1/fritzbox/history?device=AA:BB:CC:DD:EE:FF');
    const response = await GET(mockRequest as any, {} as any);
    const data = await response.json();

    expect(mockClientGetDeviceEvents).toHaveBeenCalledWith(24, 'AA:BB:CC:DD:EE:FF');
    expect(data.events).toEqual([mockEvents[1]]);
    expect(data.totalCount).toBe(1);
  });

  test('malformed device filter returns no events without calling the backend', async () => {
    mockRequest = new Request('http://localhost:3000/api/v1/fritzbox/history?device=not-a-mac');
    const response = await GET(mockRequest as any, {} as any);
    const data = await response.json();

    expect(mockClientGetDeviceEvents).not.toHaveBeenCalled();
    expect(response.status).toBe(200);
    expect(data.events).toEqual([]);
    expect(data.totalCount).toBe(0);
  });

  test('no events returns empty array with totalCount 0', async () => {
    mockClientGetDeviceEvents.mockResolvedValue([]);

    mockRequest = new Request('http://localhost:3000/api/v1/fritzbox/history');
    const response = await GET(mockRequest as any, {} as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.events).toEqual([]);
    expect(data.totalCount).toBe(0);
  });
});
