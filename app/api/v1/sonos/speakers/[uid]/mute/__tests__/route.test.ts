/**
 * Tests for PUT /api/v1/sonos/speakers/[uid]/mute
 */

jest.mock('@/lib/sonos/sonosProxy');
jest.mock('@/lib/auth0', () => ({
  auth0: { getSession: jest.fn() },
}));

import { PUT } from '../route';
import * as sonosProxy from '@/lib/sonos/sonosProxy';
import { auth0 } from '@/lib/auth0';

const mockGetSession = jest.mocked(auth0.getSession);
const mockSetSpeakerMute = jest.mocked(sonosProxy.setSpeakerMute);
const mockSession = { user: { sub: 'auth0|123', email: 'test@test.com' } };
const mockContext = { params: Promise.resolve({ uid: 'RINCON_A' }) };

/** Build a jsdom-safe mock request whose body is readable via parseJson. */
function makePutRequest(body: Record<string, unknown>): any {
  return {
    headers: { get: (name: string) => (name === 'content-type' ? 'application/json' : null) },
    text: async () => JSON.stringify(body),
    nextUrl: { searchParams: new URLSearchParams() },
  };
}

describe('PUT /api/v1/sonos/speakers/[uid]/mute', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSession.mockResolvedValue(mockSession as any);
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  it('should return 401 when not authenticated', async () => {
    mockGetSession.mockResolvedValue(null);
    const response = await PUT(makePutRequest({ mute: true }), mockContext as any);
    expect(response.status).toBe(401);
  });

  it('should return 202 with suggested_poll_delay_s', async () => {
    mockSetSpeakerMute.mockResolvedValue({ status: 'ok' } as any);
    const response = await PUT(makePutRequest({ mute: true }), mockContext as any);
    const data = await response.json();
    expect(response.status).toBe(202);
    expect(data.suggested_poll_delay_s).toBe(1);
    expect(mockSetSpeakerMute).toHaveBeenCalledWith('RINCON_A', true);
  });
});
