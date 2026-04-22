/**
 * Tests for GET /api/v1/dirigera/sensors/contact
 */

jest.mock('@/lib/dirigera/dirigeraProxy');
jest.mock('@/lib/auth0', () => ({
  auth0: { getSession: jest.fn() },
}));

import { GET } from '../route';
import * as dirigeraProxy from '@/lib/dirigera/dirigeraProxy';
import { auth0 } from '@/lib/auth0';

const mockGetSession = jest.mocked(auth0.getSession);
const mockGetContactSensors = jest.mocked(dirigeraProxy.getContactSensors);
const mockSession = { user: { sub: 'auth0|123', email: 'test@test.com' } };

const mockContactData = {
  sensors: [
    {
      id: 'c1',
      type: 'openCloseSensor',
      custom_name: 'Front',
      room: 'Hall',
      firmware_version: '1.0',
      battery_percentage: 85,
      is_reachable: true,
      last_seen: '2026-04-01T10:00:00Z',
      is_open: true,
      data_freshness: 'LIVE',
    },
  ],
  count: 1,
  is_stale: false,
};

describe('GET /api/v1/dirigera/sensors/contact', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSession.mockResolvedValue(mockSession as any);
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  it('returns 401 when not authenticated', async () => {
    mockGetSession.mockResolvedValue(null);
    const request = new Request('http://localhost:3000/api/v1/dirigera/sensors/contact');
    const response = await GET(request as any, {} as any);
    const data = await response.json();
    expect(response.status).toBe(401);
    expect(data.code).toBe('UNAUTHORIZED');
  });

  it('returns 200 with contact sensors data when authenticated', async () => {
    mockGetContactSensors.mockResolvedValue(mockContactData as any);
    const request = new Request('http://localhost:3000/api/v1/dirigera/sensors/contact');
    const response = await GET(request as any, {} as any);
    const data = await response.json();
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.sensors[0].id).toBe('c1');
    expect(data.count).toBe(1);
    expect(data.is_stale).toBe(false);
  });

  it('returns only sensors, count, is_stale fields in response body', async () => {
    mockGetContactSensors.mockResolvedValue(mockContactData as any);
    const request = new Request('http://localhost:3000/api/v1/dirigera/sensors/contact');
    const response = await GET(request as any, {} as any);
    const data = await response.json();
    expect(data.sensors).toEqual(mockContactData.sensors);
    expect(data.count).toBe(1);
    expect(data.is_stale).toBe(false);
    expect(mockGetContactSensors).toHaveBeenCalledWith();
  });
});
