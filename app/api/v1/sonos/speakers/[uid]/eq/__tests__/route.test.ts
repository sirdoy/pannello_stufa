/**
 * Tests for /api/v1/sonos/speakers/[uid]/eq (GET + PUT)
 */

jest.mock('@/lib/sonos/sonosProxy');
jest.mock('@/lib/auth0', () => ({
  auth0: { getSession: jest.fn() },
}));

import { GET, PUT } from '../route';
import * as sonosProxy from '@/lib/sonos/sonosProxy';
import { auth0 } from '@/lib/auth0';

const mockGetSession = jest.mocked(auth0.getSession);
const mockGetEq = jest.mocked(sonosProxy.getEq);
const mockSetEq = jest.mocked(sonosProxy.setEq);
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

describe('/api/v1/sonos/speakers/[uid]/eq', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSession.mockResolvedValue(mockSession as any);
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  it('GET returns 401 when not authenticated', async () => {
    mockGetSession.mockResolvedValue(null);
    const response = await GET({} as any, mockContext as any);
    expect(response.status).toBe(401);
  });

  it('GET returns 200 with EQ data', async () => {
    mockGetEq.mockResolvedValue({ bass: 0, treble: 0, loudness: true } as any);
    const response = await GET({} as any, mockContext as any);
    const data = await response.json();
    expect(response.status).toBe(200);
    expect(data.bass).toBe(0);
    expect(mockGetEq).toHaveBeenCalledWith('RINCON_A');
  });

  it('PUT returns 401 when not authenticated', async () => {
    mockGetSession.mockResolvedValue(null);
    const response = await PUT(makePutRequest({ bass: 5 }), mockContext as any);
    expect(response.status).toBe(401);
  });

  it('PUT returns 202 with suggested_poll_delay_s on success', async () => {
    mockSetEq.mockResolvedValue({ status: 'ok' } as any);
    const response = await PUT(makePutRequest({ bass: 5 }), mockContext as any);
    const data = await response.json();
    expect(response.status).toBe(202);
    expect(data.suggested_poll_delay_s).toBe(1);
    expect(mockSetEq).toHaveBeenCalledWith('RINCON_A', { bass: 5 });
  });
});
