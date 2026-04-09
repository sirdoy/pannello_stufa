/**
 * Tests for PUT /api/v1/sonos/zones/[groupId]/seek
 */

jest.mock('@/lib/sonos/sonosProxy');
jest.mock('@/lib/auth0', () => ({
  auth0: { getSession: jest.fn() },
}));

import { PUT } from '../route';
import * as sonosProxy from '@/lib/sonos/sonosProxy';
import { auth0 } from '@/lib/auth0';

const mockGetSession = jest.mocked(auth0.getSession);
const mockSeek = jest.mocked(sonosProxy.seek);
const mockSession = { user: { sub: 'auth0|123', email: 'test@test.com' } };
const mockContext = { params: Promise.resolve({ groupId: 'RINCON_123' }) };

const mockProxyResponse = {
  command: 'seek' as const,
  status: 'accepted' as const,
  group_id: 'RINCON_123',
};

/** Build a mock request whose body is readable via parseJson (jsdom-safe). */
function makePutRequest(url: string, body: Record<string, unknown>) {
  return {
    headers: { get: (name: string) => name === 'content-type' ? 'application/json' : null },
    text: async () => JSON.stringify(body),
    nextUrl: { searchParams: new URLSearchParams() },
  } as any;
}

describe('PUT /api/v1/sonos/zones/[groupId]/seek', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSession.mockResolvedValue(mockSession as any);
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  it('should return 401 when not authenticated', async () => {
    mockGetSession.mockResolvedValue(null);
    const req = makePutRequest('http://localhost:3000/api/v1/sonos/zones/RINCON_123/seek', { position: '0:02:30' });

    const response = await PUT(req, mockContext as any);
    expect(response.status).toBe(401);
  });

  it('should call seek with groupId and position and return 202', async () => {
    mockSeek.mockResolvedValue(mockProxyResponse as any);
    const req = makePutRequest('http://localhost:3000/api/v1/sonos/zones/RINCON_123/seek', { position: '0:02:30' });

    const response = await PUT(req, mockContext as any);
    const data = await response.json();

    expect(response.status).toBe(202);
    expect(data.suggested_poll_delay_s).toBe(1);
    expect(mockSeek).toHaveBeenCalledWith('RINCON_123', '0:02:30');
  });
});
