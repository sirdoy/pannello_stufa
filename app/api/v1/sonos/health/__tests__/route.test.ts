/**
 * Tests for GET /api/v1/sonos/health
 */

jest.mock('@/lib/sonos/sonosProxy');
jest.mock('@/lib/auth0', () => ({
  auth0: { getSession: jest.fn() },
}));

import { GET } from '../route';
import * as sonosProxy from '@/lib/sonos/sonosProxy';
import { auth0 } from '@/lib/auth0';

const mockGetSession = jest.mocked(auth0.getSession);
const mockGetHealth = jest.mocked(sonosProxy.getHealth);
const mockSession = { user: { sub: 'auth0|123', email: 'test@test.com' } };

describe('GET /api/v1/sonos/health', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSession.mockResolvedValue(mockSession as any);
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  it('should return 401 when not authenticated', async () => {
    mockGetSession.mockResolvedValue(null);
    const response = await GET({} as any, {} as any);
    const data = await response.json();
    expect(response.status).toBe(401);
    expect(data.code).toBe('UNAUTHORIZED');
  });

  it('should return 200 with health payload', async () => {
    mockGetHealth.mockResolvedValue({ status: 'ok', data_fresh: true } as any);
    const response = await GET({} as any, {} as any);
    const data = await response.json();
    expect(response.status).toBe(200);
    expect(data.status).toBe('ok');
    expect(data.data_fresh).toBe(true);
    expect(mockGetHealth).toHaveBeenCalledWith();
  });
});
