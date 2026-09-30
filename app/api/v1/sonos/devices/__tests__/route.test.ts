/**
 * Tests for GET /api/v1/sonos/devices
 */

jest.mock('@/lib/sonos/sonosProxy');
jest.mock('@/lib/auth/session', () => ({
  authSession: { getSession: jest.fn() },
}));

import { GET } from '../route';
import * as sonosProxy from '@/lib/sonos/sonosProxy';
import { authSession } from '@/lib/auth/session';
import { asNextRequest, mockAppSession, routeContext } from '@/__tests__/__utils__/routeHelpers';
import type { SonosDeviceResponse } from '@/types/sonosProxy';

const mockGetSession = jest.mocked(authSession.getSession);
const mockGetDevices = jest.mocked(sonosProxy.getDevices);

describe('GET /api/v1/sonos/devices', () => {
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

  it('should return 200 with { devices: [...] } envelope', async () => {
    // HA proxy returns `{ speakers, count, is_stale, fetched_at }`; route
    // renames `speakers` → `devices` for the client envelope and forwards
    // the rest of the wrapper fields.
    const livingRoom: SonosDeviceResponse = {
      uid: 'RINCON_A',
      name: 'Living Room',
      ip: '192.168.1.20',
      model: 'Sonos Beam (Gen 2)',
      firmware: null,
      serial: null,
      role: 'soundbar',
      is_visible: true,
      is_coordinator: true,
    };
    const mockSpeakers: SonosDeviceResponse[] = [
      livingRoom,
      { ...livingRoom, uid: 'RINCON_B', name: 'Kitchen', ip: '192.168.1.21', role: 'speaker' },
    ];
    mockGetDevices.mockResolvedValue({
      speakers: mockSpeakers,
      count: mockSpeakers.length,
      is_stale: false,
      fetched_at: '2026-09-24T10:00:00Z',
    });
    const response = await GET(asNextRequest({}), routeContext());
    const data = await response.json();
    expect(response.status).toBe(200);
    expect(data.devices).toEqual(mockSpeakers);
    expect(data.count).toBe(2);
    expect(mockGetDevices).toHaveBeenCalledWith();
  });
});
