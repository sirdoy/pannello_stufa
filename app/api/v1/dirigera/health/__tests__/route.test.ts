/**
 * Tests for GET /api/v1/dirigera/health
 */

jest.mock('@/lib/dirigera/dirigeraProxy');
jest.mock('@/lib/auth0', () => ({
  auth0: { getSession: jest.fn() },
}));

import { GET } from '../route';
import * as dirigeraProxy from '@/lib/dirigera/dirigeraProxy';
import { auth0 } from '@/lib/auth0';

const mockGetSession = jest.mocked(auth0.getSession);
const mockGetHealth = jest.mocked(dirigeraProxy.getHealth);
const mockSession = { user: { sub: 'auth0|123', email: 'test@test.com' } };

const mockHealthData = {
  firmware_version: '2.465.0',
  connected_sensors: 6,
  is_reachable: true,
};

describe('GET /api/v1/dirigera/health', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSession.mockResolvedValue(mockSession as any);
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  it('returns 401 when not authenticated', async () => {
    mockGetSession.mockResolvedValue(null);
    const request = new Request('http://localhost:3000/api/v1/dirigera/health');
    const response = await GET(request as any, {} as any);
    const data = await response.json();
    expect(response.status).toBe(401);
    expect(data.code).toBe('UNAUTHORIZED');
  });

  it('returns 200 with health data when authenticated', async () => {
    mockGetHealth.mockResolvedValue(mockHealthData as any);
    const request = new Request('http://localhost:3000/api/v1/dirigera/health');
    const response = await GET(request as any, {} as any);
    const data = await response.json();
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.firmware_version).toBe('2.465.0');
    expect(data.connected_sensors).toBe(6);
    expect(mockGetHealth).toHaveBeenCalledTimes(1);
    expect(mockGetHealth).toHaveBeenCalledWith();
  });
});
