/**
 * Tests for POST /api/v1/sonos/speakers/[uid]/unjoin
 */

jest.mock('@/lib/sonos/sonosProxy');
jest.mock('@/lib/auth0', () => ({
  auth0: { getSession: jest.fn() },
}));

import { POST } from '../route';
import * as sonosProxy from '@/lib/sonos/sonosProxy';
import { auth0 } from '@/lib/auth0';

const mockGetSession = jest.mocked(auth0.getSession);
const mockUnjoin = jest.mocked(sonosProxy.unjoin);
const mockSession = { user: { sub: 'auth0|123', email: 'test@test.com' } };
const mockContext = { params: Promise.resolve({ uid: 'RINCON_A' }) };

describe('POST /api/v1/sonos/speakers/[uid]/unjoin', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSession.mockResolvedValue(mockSession as any);
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  it('should return 401 when not authenticated', async () => {
    mockGetSession.mockResolvedValue(null);
    const response = await POST({} as any, mockContext as any);
    expect(response.status).toBe(401);
  });

  it('should return 202 with suggested_poll_delay_s', async () => {
    mockUnjoin.mockResolvedValue({ status: 'ok' } as any);
    const response = await POST({} as any, mockContext as any);
    const data = await response.json();
    expect(response.status).toBe(202);
    expect(data.suggested_poll_delay_s).toBe(1);
    expect(mockUnjoin).toHaveBeenCalledWith('RINCON_A');
  });
});
