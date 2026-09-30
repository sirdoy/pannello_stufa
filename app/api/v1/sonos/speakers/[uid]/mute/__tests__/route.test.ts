/**
 * Tests for PUT /api/v1/sonos/speakers/[uid]/mute
 */

jest.mock('@/lib/sonos/sonosProxy');
jest.mock('@/lib/auth/session', () => ({
  authSession: { getSession: jest.fn() },
}));

import type { NextRequest } from 'next/server';
import { PUT } from '../route';
import * as sonosProxy from '@/lib/sonos/sonosProxy';
import { authSession } from '@/lib/auth/session';
import { asNextRequest, mockAppSession, routeContext } from '@/__tests__/__utils__/routeHelpers';

const mockGetSession = jest.mocked(authSession.getSession);
const mockSetSpeakerMute = jest.mocked(sonosProxy.setSpeakerMute);
const mockContext = routeContext({ uid: 'RINCON_A' });

/** Build a jsdom-safe mock request whose body is readable via parseJson. */
function makePutRequest(body: Record<string, unknown>): NextRequest {
  return asNextRequest({
    headers: { get: (name: string) => (name === 'content-type' ? 'application/json' : null) },
    text: async () => JSON.stringify(body),
    nextUrl: { searchParams: new URLSearchParams() },
  });
}

describe('PUT /api/v1/sonos/speakers/[uid]/mute', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSession.mockResolvedValue(mockAppSession());
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  it('should return 401 when not authenticated', async () => {
    mockGetSession.mockResolvedValue(null);
    const response = await PUT(makePutRequest({ mute: true }), mockContext);
    expect(response.status).toBe(401);
  });

  it('should return 202 with suggested_poll_delay_s', async () => {
    mockSetSpeakerMute.mockResolvedValue({ data_confirmed: true });
    const response = await PUT(makePutRequest({ mute: true }), mockContext);
    const data = await response.json();
    expect(response.status).toBe(202);
    expect(data.suggested_poll_delay_s).toBe(1);
    expect(mockSetSpeakerMute).toHaveBeenCalledWith('RINCON_A', true);
  });
});
