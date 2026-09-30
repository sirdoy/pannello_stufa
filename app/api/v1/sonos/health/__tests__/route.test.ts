/**
 * Tests for GET /api/v1/sonos/health
 */

jest.mock('@/lib/sonos/sonosProxy');
jest.mock('@/lib/auth/session', () => ({
  authSession: { getSession: jest.fn() },
}));

import { GET } from '../route';
import * as sonosProxy from '@/lib/sonos/sonosProxy';
import { authSession } from '@/lib/auth/session';
import { asNextRequest, mockAppSession, routeContext } from '@/__tests__/__utils__/routeHelpers';

const mockGetSession = jest.mocked(authSession.getSession);
const mockGetHealth = jest.mocked(sonosProxy.getHealth);

describe('GET /api/v1/sonos/health', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSession.mockResolvedValue(mockAppSession());
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  it('should return 401 when not authenticated', async () => {
    mockGetSession.mockResolvedValue(null);
    const response = await GET(asNextRequest({}), routeContext());
    const data = await response.json();
    expect(response.status).toBe(401);
    expect(data.code).toBe('UNAUTHORIZED');
  });

  it('should return 200 with health payload', async () => {
    mockGetHealth.mockResolvedValue({
      connected: true,
      data_freshness: 'LIVE',
      device_count: 3,
      last_poll_at: '2026-09-24T10:00:00Z',
      last_success_at: '2026-09-24T10:00:00Z',
    });
    const response = await GET(asNextRequest({}), routeContext());
    const data = await response.json();
    expect(response.status).toBe(200);
    expect(data.connected).toBe(true);
    expect(data.data_freshness).toBe('LIVE');
    expect(mockGetHealth).toHaveBeenCalledWith();
  });
});
