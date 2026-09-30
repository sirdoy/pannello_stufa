/**
 * Tests for GET /api/v1/sonos/history
 */

jest.mock('@/lib/sonos/sonosProxy');
jest.mock('@/lib/auth/session', () => ({
  authSession: { getSession: jest.fn() },
}));

import type { NextRequest } from 'next/server';
import { GET } from '../route';
import * as sonosProxy from '@/lib/sonos/sonosProxy';
import { authSession } from '@/lib/auth/session';
import { asNextRequest, mockAppSession, routeContext } from '@/__tests__/__utils__/routeHelpers';
import type { SonosHistoryResponse } from '@/types/sonosProxy';

const mockGetSession = jest.mocked(authSession.getSession);
const mockGetHistory = jest.mocked(sonosProxy.getHistory);
const emptyHistory: SonosHistoryResponse = {
  items: [],
  total: 0,
  granularity: 'raw',
  limit: 100,
  offset: 0,
};

/** Build a mock request whose nextUrl.searchParams matches the given query string. */
function makeGetRequest(query: string = ''): NextRequest {
  return asNextRequest({ nextUrl: { searchParams: new URLSearchParams(query) } });
}

describe('GET /api/v1/sonos/history', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSession.mockResolvedValue(mockAppSession());
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  it('should return 401 when not authenticated', async () => {
    mockGetSession.mockResolvedValue(null);
    const response = await GET(makeGetRequest(), routeContext());
    expect(response.status).toBe(401);
  });

  it('should pass all 7 query params through to getHistory', async () => {
    mockGetHistory.mockResolvedValue(emptyHistory);
    const req = makeGetRequest(
      'type=volume&speaker_uid=RINCON_A&group_id=RINCON_A&start=2026-04-01&end=2026-04-20&limit=100&offset=0'
    );
    const response = await GET(req, routeContext());
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
    mockGetHistory.mockResolvedValue(emptyHistory);
    const response = await GET(makeGetRequest(), routeContext());
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
