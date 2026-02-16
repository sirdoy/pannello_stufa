/**
 * Tests for /api/fritzbox/history endpoint
 *
 * Verifies device event history query with time range and device filtering
 * Phase 65: Device History Timeline
 */

// Mock dependencies before imports
jest.mock('@/lib/fritzbox');
jest.mock('@/lib/auth0', () => ({
  auth0: {
    getSession: jest.fn(),
  },
}));

import { GET } from '../history/route';
import { getDeviceEvents } from '@/lib/fritzbox';
import { auth0 } from '@/lib/auth0';
import type { DeviceEvent } from '@/app/components/devices/network/types';

const mockGetSession = jest.mocked(auth0.getSession);
const mockGetDeviceEvents = jest.mocked(getDeviceEvents);

describe('GET /api/fritzbox/history', () => {
  let mockRequest: Request;
  const mockSession = { user: { sub: 'auth0|123', email: 'test@test.com' } };

  // Mock events
  const mockEvents: DeviceEvent[] = [
    {
      deviceMac: 'AA:BB:CC:DD:EE:FF',
      deviceName: 'Device 1',
      deviceIp: '192.168.1.100',
      eventType: 'connected',
      timestamp: Date.now() - 3600000, // 1 hour ago
    },
    {
      deviceMac: 'BB:CC:DD:EE:FF:00',
      deviceName: 'Device 2',
      deviceIp: '192.168.1.101',
      eventType: 'disconnected',
      timestamp: Date.now() - 7200000, // 2 hours ago
    },
    {
      deviceMac: 'AA:BB:CC:DD:EE:FF',
      deviceName: 'Device 1',
      deviceIp: '192.168.1.100',
      eventType: 'disconnected',
      timestamp: Date.now() - 10800000, // 3 hours ago
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();

    // Default: authenticated user
    mockGetSession.mockResolvedValue(mockSession as any);

    // Mock console to suppress output
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  test('default range (24h) returns events within 24h window', async () => {
    mockGetDeviceEvents.mockResolvedValue(mockEvents);

    mockRequest = new Request('http://localhost:3000/api/fritzbox/history');
    const response = await GET(mockRequest as any, {} as any);
    const data = await response.json();

    // Should call getDeviceEvents with 24h range
    expect(mockGetDeviceEvents).toHaveBeenCalledWith(
      expect.any(Number), // startTime
      expect.any(Number)  // endTime
    );

    const [startTime, endTime] = mockGetDeviceEvents.mock.calls[0] as [number, number];
    const expectedDuration = 24 * 60 * 60 * 1000; // 24 hours in ms
    expect(endTime - startTime).toBe(expectedDuration);

    // Should return success with events
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.events).toEqual(mockEvents);
    expect(data.range).toBe('24h');
    expect(data.totalCount).toBe(3);
  });

  test('range=7d calculates correct startTime', async () => {
    mockGetDeviceEvents.mockResolvedValue(mockEvents);

    mockRequest = new Request('http://localhost:3000/api/fritzbox/history?range=7d');
    const response = await GET(mockRequest as any, {} as any);
    const data = await response.json();

    // Should call getDeviceEvents with 7d range
    const [startTime, endTime] = mockGetDeviceEvents.mock.calls[0] as [number, number];
    const expectedDuration = 7 * 24 * 60 * 60 * 1000; // 7 days in ms
    expect(endTime - startTime).toBe(expectedDuration);

    expect(response.status).toBe(200);
    expect(data.range).toBe('7d');
  });

  test('range=1h calculates correct startTime', async () => {
    mockGetDeviceEvents.mockResolvedValue(mockEvents);

    mockRequest = new Request('http://localhost:3000/api/fritzbox/history?range=1h');
    const response = await GET(mockRequest as any, {} as any);
    const data = await response.json();

    // Should call getDeviceEvents with 1h range
    const [startTime, endTime] = mockGetDeviceEvents.mock.calls[0] as [number, number];
    const expectedDuration = 60 * 60 * 1000; // 1 hour in ms
    expect(endTime - startTime).toBe(expectedDuration);

    expect(response.status).toBe(200);
    expect(data.range).toBe('1h');
  });

  test('device filter returns only events for that MAC', async () => {
    mockGetDeviceEvents.mockResolvedValue(mockEvents);

    mockRequest = new Request('http://localhost:3000/api/fritzbox/history?device=AA:BB:CC:DD:EE:FF');
    const response = await GET(mockRequest as any, {} as any);
    const data = await response.json();

    // Should filter to only Device 1 events
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.events).toHaveLength(2);
    expect(data.events[0].deviceMac).toBe('AA:BB:CC:DD:EE:FF');
    expect(data.events[1].deviceMac).toBe('AA:BB:CC:DD:EE:FF');
    expect(data.totalCount).toBe(2);
  });

  test('no events returns empty array with totalCount 0', async () => {
    mockGetDeviceEvents.mockResolvedValue([]);

    mockRequest = new Request('http://localhost:3000/api/fritzbox/history');
    const response = await GET(mockRequest as any, {} as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.events).toEqual([]);
    expect(data.totalCount).toBe(0);
  });

  test('invalid range defaults to 24h', async () => {
    mockGetDeviceEvents.mockResolvedValue(mockEvents);

    mockRequest = new Request('http://localhost:3000/api/fritzbox/history?range=invalid');
    const response = await GET(mockRequest as any, {} as any);
    const data = await response.json();

    // Should default to 24h
    const [startTime, endTime] = mockGetDeviceEvents.mock.calls[0] as [number, number];
    const expectedDuration = 24 * 60 * 60 * 1000;
    expect(endTime - startTime).toBe(expectedDuration);

    expect(response.status).toBe(200);
    expect(data.range).toBe('24h');
  });
});
