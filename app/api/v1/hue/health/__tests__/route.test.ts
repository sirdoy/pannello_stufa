/**
 * Tests for GET /api/v1/hue/health
 */

jest.mock('@/lib/hue/hueProxy');
jest.mock('@/lib/auth0', () => ({
  auth0: { getSession: jest.fn() },
}));

import { GET } from '../route';
import * as hueProxy from '@/lib/hue/hueProxy';
import { auth0 } from '@/lib/auth0';

const mockGetSession = jest.mocked(auth0.getSession);
const mockGetHealth = jest.mocked(hueProxy.getHealth);
const mockSession = { user: { sub: 'auth0|123', email: 'test@test.com' } };

describe('GET /api/v1/hue/health', () => {
  let mockRequest: Request;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRequest = new Request('http://localhost:3000/api/v1/hue/health');
    mockGetSession.mockResolvedValue(mockSession as any);
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  it('should return 401 when not authenticated', async () => {
    mockGetSession.mockResolvedValue(null);

    const response = await GET(mockRequest as any, {} as any);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.code).toBe('UNAUTHORIZED');
  });

  it('should return 200 with bridge health data', async () => {
    const mockHealthData = {
      status: 'ok' as const,
      freshness: 'LIVE' as const,
      last_poll: 1234567890,
      bridge_ip: '192.168.1.10',
    };
    mockGetHealth.mockResolvedValue(mockHealthData as any);

    const response = await GET(mockRequest as any, {} as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(mockGetHealth).toHaveBeenCalled();
  });
});
