/**
 * Tests for GET /api/v1/dirigera/telemetry
 */

jest.mock('@/lib/dirigera/dirigeraProxy');
jest.mock('@/lib/auth0', () => ({
  auth0: { getSession: jest.fn() },
}));

import { GET } from '../route';
import * as dirigeraProxy from '@/lib/dirigera/dirigeraProxy';
import { auth0 } from '@/lib/auth0';

const mockGetSession = jest.mocked(auth0.getSession);
const mockGetTelemetry = jest.mocked(dirigeraProxy.getTelemetry);
const mockSession = { user: { sub: 'auth0|123', email: 'test@test.com' } };

const mockTelemetryData = {
  telemetry: [
    { id: 1, sensor_id: 'xyz', battery_percentage: 90, light_level: 42, timestamp: 1773000000 },
  ],
  total: 1,
  limit: 100,
  offset: 0,
};

describe('GET /api/v1/dirigera/telemetry', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSession.mockResolvedValue(mockSession as any);
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  it('returns 401 when not authenticated', async () => {
    mockGetSession.mockResolvedValue(null);
    const request = new Request('http://localhost:3000/api/v1/dirigera/telemetry');
    const response = await GET(request as any, {} as any);
    const data = await response.json();
    expect(response.status).toBe(401);
    expect(data.code).toBe('UNAUTHORIZED');
  });

  it('returns 200 with telemetry data when authenticated (no query params)', async () => {
    mockGetTelemetry.mockResolvedValue(mockTelemetryData as any);
    const request = new Request('http://localhost:3000/api/v1/dirigera/telemetry');
    const response = await GET(request as any, {} as any);
    const data = await response.json();
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.telemetry).toEqual(mockTelemetryData.telemetry);
    expect(data.total).toBe(1);
    expect(mockGetTelemetry).toHaveBeenCalledWith();
  });

  it('forwards typed query params to proxy', async () => {
    mockGetTelemetry.mockResolvedValue(mockTelemetryData as any);
    const request = new Request(
      'http://localhost:3000/api/v1/dirigera/telemetry?sensor_id=xyz&start=1773000000&end=1773200000&limit=50&offset=10'
    );
    await GET(request as any, {} as any);
    expect(mockGetTelemetry).toHaveBeenCalledWith({
      sensor_id: 'xyz',
      start: 1773000000,
      end: 1773200000,
      limit: 50,
      offset: 10,
    });
  });

  it('drops invalid numeric params silently', async () => {
    mockGetTelemetry.mockResolvedValue(mockTelemetryData as any);
    const request = new Request(
      'http://localhost:3000/api/v1/dirigera/telemetry?limit=not-a-number'
    );
    await GET(request as any, {} as any);
    expect(mockGetTelemetry).toHaveBeenCalledWith();
  });
});
