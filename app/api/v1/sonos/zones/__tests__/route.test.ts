/**
 * Tests for GET /api/v1/sonos/zones
 */

jest.mock('@/lib/sonos/sonosProxy');
jest.mock('@/lib/auth/session', () => ({
  authSession: { getSession: jest.fn() },
}));

import { GET } from '../route';
import * as sonosProxy from '@/lib/sonos/sonosProxy';
import { authSession } from '@/lib/auth/session';
import { asNextRequest, mockAppSession, routeContext } from '@/__tests__/__utils__/routeHelpers';
import type { SonosZoneResponse } from '@/types/sonosProxy';

const mockGetSession = jest.mocked(authSession.getSession);
const mockGetZones = jest.mocked(sonosProxy.getZones);

describe('GET /api/v1/sonos/zones', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSession.mockResolvedValue(mockAppSession());
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  it('should return 401 when not authenticated', async () => {
    mockGetSession.mockResolvedValue(null);
    const response = await GET(asNextRequest({}), routeContext());
    expect(response.status).toBe(401);
  });

  it('should return 200 with a flat { zones: [...] } array from the backend wrapper', async () => {
    const mockZones: SonosZoneResponse[] = [
      {
        group_id: 'RINCON_A',
        label: 'Living Room',
        coordinator_uid: 'RINCON_A',
        coordinator_name: 'Living Room',
        member_count: 0,
        members: [],
      },
    ];
    // Real backend shape: GET /api/v1/sonos/zones returns a wrapper, not a bare array
    mockGetZones.mockResolvedValue({
      zones: mockZones,
      count: 1,
      is_stale: false,
      fetched_at: '2026-09-24T10:00:00Z',
      data_freshness: 'LIVE',
    });
    const response = await GET(asNextRequest({}), routeContext());
    const data = await response.json();
    expect(response.status).toBe(200);
    expect(Array.isArray(data.zones)).toBe(true);
    expect(data.zones).toEqual(mockZones);
    expect(data.data_freshness).toBe('LIVE');
    expect(mockGetZones).toHaveBeenCalledWith();
  });
});
