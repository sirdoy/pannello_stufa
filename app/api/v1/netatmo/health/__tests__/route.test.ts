/**
 * Tests for GET /api/v1/netatmo/health
 */

jest.mock('@/lib/netatmo/netatmoProxy');
jest.mock('@/lib/auth/session', () => ({
  authSession: { getSession: jest.fn() },
}));

import { GET } from '../route';
import * as netatmoProxy from '@/lib/netatmo/netatmoProxy';
import { authSession } from '@/lib/auth/session';
import { asNextRequest, mockAppSession, routeContext } from '@/__tests__/__utils__/routeHelpers';

const mockGetSession = jest.mocked(authSession.getSession);
const mockGetProxyHealth = jest.mocked(netatmoProxy.getProxyHealth);

describe('GET /api/v1/netatmo/health', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSession.mockResolvedValue(mockAppSession());
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  it('should return 401 when not authenticated', async () => {
    mockGetSession.mockResolvedValue(null);
    const request = new Request('http://localhost:3000/api/v1/netatmo/health');
    const response = await GET(asNextRequest(request), routeContext());
    const data = await response.json();
    expect(response.status).toBe(401);
    expect(data.code).toBe('UNAUTHORIZED');
  });

  it('should return 200 with data', async () => {
    mockGetProxyHealth.mockResolvedValue({
      token_status: 'valid',
      expires_at: 1773003600,
      last_refresh_at: 1773000000,
      consecutive_failures: 0,
      last_error: null,
      provider_status: 'ok',
      data_freshness: 'LIVE',
      token_source: 'sqlite',
      requests_this_hour: 10,
      rate_limit_ceiling: 500,
      last_poll_at: 1773000000,
    });
    const request = new Request('http://localhost:3000/api/v1/netatmo/health');
    const response = await GET(asNextRequest(request), routeContext());
    const data = await response.json();
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(mockGetProxyHealth).toHaveBeenCalled();
  });
});
