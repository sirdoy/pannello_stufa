/**
 * Tests for GET /api/v1/sonos/zones
 */

jest.mock('@/lib/sonos/sonosProxy');
jest.mock('@/lib/auth0', () => ({
  auth0: { getSession: jest.fn() },
}));

import { GET } from '../route';
import * as sonosProxy from '@/lib/sonos/sonosProxy';
import { auth0 } from '@/lib/auth0';

const mockGetSession = jest.mocked(auth0.getSession);
const mockGetZones = jest.mocked(sonosProxy.getZones);
const mockSession = { user: { sub: 'auth0|123', email: 'test@test.com' } };

describe('GET /api/v1/sonos/zones', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSession.mockResolvedValue(mockSession as any);
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  it('should return 401 when not authenticated', async () => {
    mockGetSession.mockResolvedValue(null);
    const response = await GET({} as any, {} as any);
    expect(response.status).toBe(401);
  });

  it('should return 200 with a flat { zones: [...] } array from the backend wrapper', async () => {
    const mockZones = [
      { group_id: 'RINCON_A', coordinator_uid: 'RINCON_A', members: [] },
    ];
    // Real backend shape: GET /api/v1/sonos/zones returns a wrapper, not a bare array
    mockGetZones.mockResolvedValue({
      zones: mockZones,
      count: 1,
      is_stale: false,
      fetched_at: '2026-09-24T10:00:00Z',
      data_freshness: 'LIVE',
    } as any);
    const response = await GET({} as any, {} as any);
    const data = await response.json();
    expect(response.status).toBe(200);
    expect(Array.isArray(data.zones)).toBe(true);
    expect(data.zones).toEqual(mockZones);
    expect(data.data_freshness).toBe('LIVE');
    expect(mockGetZones).toHaveBeenCalledWith();
  });
});
