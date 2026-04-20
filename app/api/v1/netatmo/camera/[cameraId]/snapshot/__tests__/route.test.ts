/**
 * Tests for GET /api/v1/netatmo/camera/[cameraId]/snapshot
 */

jest.mock('@/lib/netatmo/netatmoProxy');
jest.mock('@/lib/auth0', () => ({
  auth0: { getSession: jest.fn() },
}));

import { GET } from '../route';
import * as netatmoProxy from '@/lib/netatmo/netatmoProxy';
import { auth0 } from '@/lib/auth0';

const mockGetSession = jest.mocked(auth0.getSession);
const mockGetCameraSnapshot = jest.mocked(netatmoProxy.getProxyCameraSnapshot);
const mockSession = { user: { sub: 'auth0|123', email: 'test@test.com' } };
const mockContext = { params: Promise.resolve({ cameraId: 'cam_001' }) };

describe('GET /api/v1/netatmo/camera/[cameraId]/snapshot', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSession.mockResolvedValue(mockSession as any);
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  it('should return 401 when not authenticated', async () => {
    mockGetSession.mockResolvedValue(null);
    const request = new Request('http://localhost:3000/api/v1/netatmo/camera/cam_001/snapshot');

    const response = await GET(request as any, mockContext as any);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.code).toBe('UNAUTHORIZED');
  });

  it('should return 302 redirect to Netatmo CDN snapshot URL', async () => {
    const mockData = { snapshot_url: 'https://example.com/snap.jpg' };
    mockGetCameraSnapshot.mockResolvedValue(mockData as any);

    const request = new Request('http://localhost:3000/api/v1/netatmo/camera/cam_001/snapshot');

    const response = await GET(request as any, mockContext as any);

    // 302 redirect preserves <img src> compatibility — browser follows the redirect
    // to the Netatmo CDN URL and loads the JPEG directly (Phase 168 Q3 decision).
    expect(response.status).toBe(302);
    expect(response.headers.get('location')).toBe('https://example.com/snap.jpg');
    expect(response.headers.get('cache-control')).toBe('no-cache, no-store');
    expect(mockGetCameraSnapshot).toHaveBeenCalledWith('cam_001');
  });
});
