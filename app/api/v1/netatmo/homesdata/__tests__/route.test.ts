/**
 * Tests for GET /api/v1/netatmo/homesdata
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
const mockGetProxyHomesdata = jest.mocked(netatmoProxy.getProxyHomesdata);

describe('GET /api/v1/netatmo/homesdata', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSession.mockResolvedValue(mockAppSession());
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  it('should return 401 when not authenticated', async () => {
    mockGetSession.mockResolvedValue(null);
    const request = new Request('http://localhost:3000/api/v1/netatmo/homesdata');
    const response = await GET(asNextRequest(request), routeContext());
    const data = await response.json();
    expect(response.status).toBe(401);
    expect(data.code).toBe('UNAUTHORIZED');
  });

  it('should return 200 with data', async () => {
    mockGetProxyHomesdata.mockResolvedValue({ body: { homes: [] }, status: 'ok', time_exec: 0.01, time_server: 1773000000 });
    const request = new Request('http://localhost:3000/api/v1/netatmo/homesdata');
    const response = await GET(asNextRequest(request), routeContext());
    const data = await response.json();
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(mockGetProxyHomesdata).toHaveBeenCalled();
  });
});
