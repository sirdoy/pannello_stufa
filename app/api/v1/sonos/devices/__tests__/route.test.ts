/**
 * Tests for GET /api/v1/sonos/devices
 */

jest.mock('@/lib/sonos/sonosProxy');
jest.mock('@/lib/auth0', () => ({
  auth0: { getSession: jest.fn() },
}));

import { GET } from '../route';
import * as sonosProxy from '@/lib/sonos/sonosProxy';
import { auth0 } from '@/lib/auth0';

const mockGetSession = jest.mocked(auth0.getSession);
const mockGetDevices = jest.mocked(sonosProxy.getDevices);
const mockSession = { user: { sub: 'auth0|123', email: 'test@test.com' } };

describe('GET /api/v1/sonos/devices', () => {
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

  it('should return 200 with { devices: [...] } envelope', async () => {
    // HA proxy returns `{ speakers, count, is_stale, fetched_at }`; route
    // renames `speakers` → `devices` for the client envelope and forwards
    // the rest of the wrapper fields.
    const mockSpeakers = [
      { uid: 'RINCON_A', name: 'Living Room' },
      { uid: 'RINCON_B', name: 'Kitchen' },
    ];
    mockGetDevices.mockResolvedValue({
      speakers: mockSpeakers,
      count: mockSpeakers.length,
      is_stale: false,
      fetched_at: 0,
    } as any);
    const response = await GET({} as any, {} as any);
    const data = await response.json();
    expect(response.status).toBe(200);
    expect(data.devices).toEqual(mockSpeakers);
    expect(data.count).toBe(2);
    expect(mockGetDevices).toHaveBeenCalledWith();
  });
});
