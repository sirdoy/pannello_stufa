/**
 * Tests for GET /api/v1/sonos/speakers
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
const mockGetSpeakers = jest.mocked(sonosProxy.getSpeakers);

describe('GET /api/v1/sonos/speakers', () => {
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

  it('should return 200 with the backend shape { speakers: [...] }', async () => {
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
    mockGetSpeakers.mockResolvedValue({
      speakers: mockSpeakers,
      count: mockSpeakers.length,
      is_stale: false,
      fetched_at: '2026-09-24T10:00:00Z',
    });
    const response = await GET(asNextRequest({}), routeContext());
    const data = await response.json();
    expect(response.status).toBe(200);
    expect(data.speakers).toEqual(mockSpeakers);
    expect(data.devices).toBeUndefined();
    expect(data.count).toBe(2);
    expect(mockGetSpeakers).toHaveBeenCalledWith();
  });
});
