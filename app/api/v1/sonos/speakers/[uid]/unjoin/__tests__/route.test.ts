/**
 * Tests for POST /api/v1/sonos/speakers/[uid]/unjoin
 */

jest.mock('@/lib/sonos/sonosProxy');
jest.mock('@/lib/auth/session', () => ({
  authSession: { getSession: jest.fn() },
}));

import { POST } from '../route';
import * as sonosProxy from '@/lib/sonos/sonosProxy';
import { authSession } from '@/lib/auth/session';
import { asNextRequest, mockAppSession, routeContext } from '@/__tests__/__utils__/routeHelpers';

const mockGetSession = jest.mocked(authSession.getSession);
const mockUnjoin = jest.mocked(sonosProxy.unjoin);
const mockContext = routeContext({ uid: 'RINCON_A' });

describe('POST /api/v1/sonos/speakers/[uid]/unjoin', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSession.mockResolvedValue(mockAppSession());
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  it('should return 401 when not authenticated', async () => {
    mockGetSession.mockResolvedValue(null);
    const response = await POST(asNextRequest({}), mockContext);
    expect(response.status).toBe(401);
  });

  it('should return 202 with suggested_poll_delay_s', async () => {
    mockUnjoin.mockResolvedValue({ data_confirmed: true });
    const response = await POST(asNextRequest({}), mockContext);
    const data = await response.json();
    expect(response.status).toBe(202);
    expect(data.suggested_poll_delay_s).toBe(1);
    expect(mockUnjoin).toHaveBeenCalledWith('RINCON_A');
  });
});
