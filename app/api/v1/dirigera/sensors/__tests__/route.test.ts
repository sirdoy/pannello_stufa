/**
 * Tests for GET /api/v1/dirigera/sensors
 */

jest.mock('@/lib/dirigera/dirigeraProxy');
jest.mock('@/lib/auth0', () => ({
  auth0: { getSession: jest.fn() },
}));

import { GET } from '../route';
import * as dirigeraProxy from '@/lib/dirigera/dirigeraProxy';
import { auth0 } from '@/lib/auth0';

const mockGetSession = jest.mocked(auth0.getSession);
const mockGetSensors = jest.mocked(dirigeraProxy.getSensors);
const mockSession = { user: { sub: 'auth0|123', email: 'test@test.com' } };

const mockSensorsData = {
  sensors: [
    {
      id: 'abc',
      type: 'openCloseSensor',
      custom_name: 'Door',
      room: 'Hall',
      firmware_version: '1.0',
      battery_percentage: 85,
      is_reachable: true,
      last_seen: '2026-04-01T10:00:00Z',
      is_open: false,
    },
  ],
  count: 1,
  is_stale: false,
};

describe('GET /api/v1/dirigera/sensors', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSession.mockResolvedValue(mockSession as any);
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  it('returns 401 when not authenticated', async () => {
    mockGetSession.mockResolvedValue(null);
    const request = new Request('http://localhost:3000/api/v1/dirigera/sensors');
    const response = await GET(request as any, {} as any);
    const data = await response.json();
    expect(response.status).toBe(401);
    expect(data.code).toBe('UNAUTHORIZED');
  });

  it('returns 200 with sensors data when authenticated', async () => {
    mockGetSensors.mockResolvedValue(mockSensorsData as any);
    const request = new Request('http://localhost:3000/api/v1/dirigera/sensors');
    const response = await GET(request as any, {} as any);
    const data = await response.json();
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.sensors.length).toBe(1);
    expect(data.count).toBe(1);
    expect(data.is_stale).toBe(false);
  });

  it('returns only sensors, count, is_stale fields in response body', async () => {
    mockGetSensors.mockResolvedValue(mockSensorsData as any);
    const request = new Request('http://localhost:3000/api/v1/dirigera/sensors');
    const response = await GET(request as any, {} as any);
    const data = await response.json();
    expect(data.sensors).toEqual(mockSensorsData.sensors);
    expect(data.count).toBe(1);
    expect(data.is_stale).toBe(false);
    expect(mockGetSensors).toHaveBeenCalledWith();
  });
});
