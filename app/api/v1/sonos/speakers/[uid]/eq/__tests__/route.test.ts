/**
 * Tests for /api/v1/sonos/speakers/[uid]/eq (GET + PUT)
 */

jest.mock('@/lib/sonos/sonosProxy');
jest.mock('@/lib/auth/session', () => ({
  authSession: { getSession: jest.fn() },
}));

import type { NextRequest } from 'next/server';
import { GET, PUT } from '../route';
import * as sonosProxy from '@/lib/sonos/sonosProxy';
import { authSession } from '@/lib/auth/session';
import { asNextRequest, mockAppSession, routeContext } from '@/__tests__/__utils__/routeHelpers';

const mockGetSession = jest.mocked(authSession.getSession);
const mockGetEq = jest.mocked(sonosProxy.getEq);
const mockSetEq = jest.mocked(sonosProxy.setEq);
const mockContext = routeContext({ uid: 'RINCON_A' });

/** Build a jsdom-safe mock request whose body is readable via parseJson. */
function makePutRequest(body: Record<string, unknown>): NextRequest {
  return asNextRequest({
    headers: { get: (name: string) => (name === 'content-type' ? 'application/json' : null) },
    text: async () => JSON.stringify(body),
    nextUrl: { searchParams: new URLSearchParams() },
  });
}

describe('/api/v1/sonos/speakers/[uid]/eq', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSession.mockResolvedValue(mockAppSession());
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  it('GET returns 401 when not authenticated', async () => {
    mockGetSession.mockResolvedValue(null);
    const response = await GET(asNextRequest({}), mockContext);
    expect(response.status).toBe(401);
  });

  it('GET returns 200 with EQ data', async () => {
    mockGetEq.mockResolvedValue({ uid: 'RINCON_A', bass: 0, treble: 0, loudness: true });
    const response = await GET(asNextRequest({}), mockContext);
    const data = await response.json();
    expect(response.status).toBe(200);
    expect(data.bass).toBe(0);
    expect(mockGetEq).toHaveBeenCalledWith('RINCON_A');
  });

  it('PUT returns 401 when not authenticated', async () => {
    mockGetSession.mockResolvedValue(null);
    const response = await PUT(makePutRequest({ bass: 5 }), mockContext);
    expect(response.status).toBe(401);
  });

  it('PUT returns 202 with suggested_poll_delay_s on success', async () => {
    mockSetEq.mockResolvedValue({ data_confirmed: true });
    const response = await PUT(makePutRequest({ bass: 5 }), mockContext);
    const data = await response.json();
    expect(response.status).toBe(202);
    expect(data.suggested_poll_delay_s).toBe(1);
    expect(mockSetEq).toHaveBeenCalledWith('RINCON_A', { bass: 5 });
  });
});
