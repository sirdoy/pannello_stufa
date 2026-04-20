/**
 * Tests for GET /api/v1/sonos/history
 */

jest.mock('@/lib/sonos/sonosProxy');
jest.mock('@/lib/auth0', () => ({
  auth0: { getSession: jest.fn() },
}));

import { GET } from '../route';
import * as sonosProxy from '@/lib/sonos/sonosProxy';
import { auth0 } from '@/lib/auth0';

const mockGetSession = jest.mocked(auth0.getSession);
const mockGetHistory = jest.mocked(sonosProxy.getHistory);
const mockSession = { user: { sub: 'auth0|123', email: 'test@test.com' } };

/** Build a mock request whose nextUrl.searchParams matches the given query string. */
function makeGetRequest(query: string = ''): any {
  return { nextUrl: { searchParams: new URLSearchParams(query) } };
}

describe('GET /api/v1/sonos/history', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSession.mockResolvedValue(mockSession as any);
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  it('should return 401 when not authenticated', async () => {
    mockGetSession.mockResolvedValue(null);
    const response = await GET(makeGetRequest(), {} as any);
    expect(response.status).toBe(401);
  });

  it('should pass all 7 query params through to getHistory', async () => {
    mockGetHistory.mockResolvedValue({ events: [] } as any);
    const req = makeGetRequest(
      'type=volume&speaker_uid=RINCON_A&group_id=RINCON_A&start=2026-04-01&end=2026-04-20&limit=100&offset=0'
    );
    const response = await GET(req, {} as any);
    expect(response.status).toBe(200);
    expect(mockGetHistory).toHaveBeenCalledWith({
      type: 'volume',
      speaker_uid: 'RINCON_A',
      group_id: 'RINCON_A',
      start: '2026-04-01',
      end: '2026-04-20',
      limit: '100',
      offset: '0',
    });
  });

  it('should pass undefined for missing params', async () => {
    mockGetHistory.mockResolvedValue({ events: [] } as any);
    const response = await GET(makeGetRequest(), {} as any);
    expect(response.status).toBe(200);
    expect(mockGetHistory).toHaveBeenCalledWith({
      type: undefined,
      speaker_uid: undefined,
      group_id: undefined,
      start: undefined,
      end: undefined,
      limit: undefined,
      offset: undefined,
    });
  });
});
