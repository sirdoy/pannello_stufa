/**
 * Tests for GET + PUT /api/v1/sonos/zones/[groupId]/sleep-timer
 */

jest.mock('@/lib/sonos/sonosProxy');
jest.mock('@/lib/auth0', () => ({
  auth0: { getSession: jest.fn() },
}));

import { GET, PUT } from '../route';
import * as sonosProxy from '@/lib/sonos/sonosProxy';
import { auth0 } from '@/lib/auth0';

const mockGetSession = jest.mocked(auth0.getSession);
const mockGetSleepTimer = jest.mocked(sonosProxy.getSleepTimer);
const mockSetSleepTimer = jest.mocked(sonosProxy.setSleepTimer);
const mockSession = { user: { sub: 'auth0|123', email: 'test@test.com' } };
const mockContext = { params: Promise.resolve({ groupId: 'RINCON_123' }) };

const mockSleepTimerData = { remaining_seconds: 300 };
const mockCommandResponse = {
  command: 'set_sleep_timer' as const,
  status: 'accepted' as const,
  group_id: 'RINCON_123',
};

/** Build a mock GET request. */
function makeGetRequest(url: string) {
  return new Request(url) as any;
}

/** Build a mock PUT request whose body is readable via parseJson (jsdom-safe). */
function makePutRequest(url: string, body: Record<string, unknown>) {
  return {
    headers: { get: (name: string) => name === 'content-type' ? 'application/json' : null },
    text: async () => JSON.stringify(body),
    nextUrl: { searchParams: new URLSearchParams() },
  } as any;
}

describe('GET /api/v1/sonos/zones/[groupId]/sleep-timer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSession.mockResolvedValue(mockSession as any);
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  it('should return 401 when not authenticated', async () => {
    mockGetSession.mockResolvedValue(null);
    const req = makeGetRequest('http://localhost:3000/api/v1/sonos/zones/RINCON_123/sleep-timer');

    const response = await GET(req, mockContext as any);
    expect(response.status).toBe(401);
  });

  it('should return 200 with sleep timer data', async () => {
    mockGetSleepTimer.mockResolvedValue(mockSleepTimerData as any);
    const req = makeGetRequest('http://localhost:3000/api/v1/sonos/zones/RINCON_123/sleep-timer');

    const response = await GET(req, mockContext as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(mockGetSleepTimer).toHaveBeenCalledWith('RINCON_123');
  });
});

describe('PUT /api/v1/sonos/zones/[groupId]/sleep-timer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSession.mockResolvedValue(mockSession as any);
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  it('should return 401 when not authenticated', async () => {
    mockGetSession.mockResolvedValue(null);
    const req = makePutRequest('http://localhost:3000/api/v1/sonos/zones/RINCON_123/sleep-timer', { duration: 600 });

    const response = await PUT(req, mockContext as any);
    expect(response.status).toBe(401);
  });

  it('should call setSleepTimer with groupId and full body and return 202', async () => {
    mockSetSleepTimer.mockResolvedValue(mockCommandResponse as any);
    const req = makePutRequest('http://localhost:3000/api/v1/sonos/zones/RINCON_123/sleep-timer', { duration: 600 });

    const response = await PUT(req, mockContext as any);
    const data = await response.json();

    expect(response.status).toBe(202);
    expect(data.suggested_poll_delay_s).toBe(1);
    expect(mockSetSleepTimer).toHaveBeenCalledWith('RINCON_123', { duration: 600 });
  });
});
