/**
 * Tests for GET /api/v1/netatmo/camera/status
 */

jest.mock('@/lib/netatmo/netatmoProxy');
jest.mock('@/lib/auth0', () => ({
  auth0: { getSession: jest.fn() },
}));

import { GET } from '../route';
import * as netatmoProxy from '@/lib/netatmo/netatmoProxy';
import { auth0 } from '@/lib/auth0';

const mockGetSession = jest.mocked(auth0.getSession);
const mockGetCameraStatus = jest.mocked(netatmoProxy.getProxyCameraStatus);
const mockSession = { user: { sub: 'auth0|123', email: 'test@test.com' } };

describe('GET /api/v1/netatmo/camera/status', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSession.mockResolvedValue(mockSession as any);
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  it('should return 401 when not authenticated', async () => {
    mockGetSession.mockResolvedValue(null);
    const request = new Request('http://localhost:3000/api/v1/netatmo/camera/status');

    const response = await GET(request as any, {} as any);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.code).toBe('UNAUTHORIZED');
  });

  it('should return 200 with camera status', async () => {
    const mockData = { cameras: [], freshness: 'LIVE' };
    mockGetCameraStatus.mockResolvedValue(mockData as any);

    const request = new Request('http://localhost:3000/api/v1/netatmo/camera/status');

    const response = await GET(request as any, {} as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(mockGetCameraStatus).toHaveBeenCalled();
  });
});
