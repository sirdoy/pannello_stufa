/**
 * Tests for POST /api/v1/sonos/speakers/[uid]/source
 */

jest.mock('@/lib/sonos/sonosProxy');
jest.mock('@/lib/auth/session', () => ({
  authSession: { getSession: jest.fn() },
}));

import type { NextRequest } from 'next/server';
import { POST } from '../route';
import * as sonosProxy from '@/lib/sonos/sonosProxy';
import { authSession } from '@/lib/auth/session';
import { asNextRequest, mockAppSession, routeContext } from '@/__tests__/__utils__/routeHelpers';

const mockGetSession = jest.mocked(authSession.getSession);
const mockSwitchSource = jest.mocked(sonosProxy.switchSource);
const mockContext = routeContext({ uid: 'RINCON_A' });

/** Build a jsdom-safe mock request whose body is readable via parseJson. */
function makePostRequest(body: Record<string, unknown>): NextRequest {
  return asNextRequest({
    headers: { get: (name: string) => (name === 'content-type' ? 'application/json' : null) },
    text: async () => JSON.stringify(body),
    nextUrl: { searchParams: new URLSearchParams() },
  });
}

describe('POST /api/v1/sonos/speakers/[uid]/source', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSession.mockResolvedValue(mockAppSession());
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  it('should return 401 when not authenticated', async () => {
    mockGetSession.mockResolvedValue(null);
    const response = await POST(makePostRequest({ source: 'tv' }), mockContext);
    expect(response.status).toBe(401);
  });

  it('should return 202 with suggested_poll_delay_s', async () => {
    mockSwitchSource.mockResolvedValue({ data_confirmed: true });
    const response = await POST(makePostRequest({ source: 'tv' }), mockContext);
    const data = await response.json();
    expect(response.status).toBe(202);
    expect(data.suggested_poll_delay_s).toBe(1);
    expect(mockSwitchSource).toHaveBeenCalledWith('RINCON_A', 'tv');
  });
});
