/**
 * Tests for GET + PUT /api/v1/sonos/zones/[groupId]/sleep-timer
 */

jest.mock('@/lib/sonos/sonosProxy');
jest.mock('@/lib/auth/session', () => ({
  authSession: { getSession: jest.fn() },
}));

import { GET, PUT } from '../route';
import * as sonosProxy from '@/lib/sonos/sonosProxy';
import { authSession } from '@/lib/auth/session';
import { asNextRequest, mockAppSession, routeContext } from '@/__tests__/__utils__/routeHelpers';
import type { SonosCommandOkResponse, SonosSleepTimerResponse } from '@/types/sonosProxy';

const mockGetSession = jest.mocked(authSession.getSession);
const mockGetSleepTimer = jest.mocked(sonosProxy.getSleepTimer);
const mockSetSleepTimer = jest.mocked(sonosProxy.setSleepTimer);
const mockContext = routeContext({ groupId: 'RINCON_123' });

const mockSleepTimerData: SonosSleepTimerResponse = { group_id: 'RINCON_123', remaining_seconds: 300 };
const mockCommandResponse: SonosCommandOkResponse = { data_confirmed: true };

/** Build a mock GET request. */
function makeGetRequest(url: string) {
  return asNextRequest(new Request(url));
}

/** Build a mock PUT request whose body is readable via parseJson (jsdom-safe). */
function makePutRequest(url: string, body: Record<string, unknown>) {
  return asNextRequest({
    headers: { get: (name: string) => name === 'content-type' ? 'application/json' : null },
    text: async () => JSON.stringify(body),
    nextUrl: { searchParams: new URLSearchParams() },
  });
}

describe('GET /api/v1/sonos/zones/[groupId]/sleep-timer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSession.mockResolvedValue(mockAppSession());
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  it('should return 401 when not authenticated', async () => {
    mockGetSession.mockResolvedValue(null);
    const req = makeGetRequest('http://localhost:3000/api/v1/sonos/zones/RINCON_123/sleep-timer');

    const response = await GET(req, mockContext);
    expect(response.status).toBe(401);
  });

  it('should return 200 with sleep timer data', async () => {
    mockGetSleepTimer.mockResolvedValue(mockSleepTimerData);
    const req = makeGetRequest('http://localhost:3000/api/v1/sonos/zones/RINCON_123/sleep-timer');

    const response = await GET(req, mockContext);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(mockGetSleepTimer).toHaveBeenCalledWith('RINCON_123');
  });
});

describe('PUT /api/v1/sonos/zones/[groupId]/sleep-timer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSession.mockResolvedValue(mockAppSession());
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  it('should return 401 when not authenticated', async () => {
    mockGetSession.mockResolvedValue(null);
    const req = makePutRequest('http://localhost:3000/api/v1/sonos/zones/RINCON_123/sleep-timer', { duration: 600 });

    const response = await PUT(req, mockContext);
    expect(response.status).toBe(401);
  });

  it('should call setSleepTimer with groupId and full body and return 202', async () => {
    mockSetSleepTimer.mockResolvedValue(mockCommandResponse);
    const req = makePutRequest('http://localhost:3000/api/v1/sonos/zones/RINCON_123/sleep-timer', { duration: 600 });

    const response = await PUT(req, mockContext);
    const data = await response.json();

    expect(response.status).toBe(202);
    expect(data.suggested_poll_delay_s).toBe(1);
    expect(mockSetSleepTimer).toHaveBeenCalledWith('RINCON_123', { duration: 600 });
  });
});
