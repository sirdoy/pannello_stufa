/**
 * Tests for GET /api/v1/netatmo/camera/[cameraId]/snapshot
 */

jest.mock('@/lib/netatmo/netatmoProxy');
jest.mock('@/lib/auth/session', () => ({
  authSession: { getSession: jest.fn() },
}));

import { GET } from '../route';
import * as netatmoProxy from '@/lib/netatmo/netatmoProxy';
import { authSession } from '@/lib/auth/session';

const mockGetSession = jest.mocked(authSession.getSession);
const mockGetCameraLive = jest.mocked(netatmoProxy.getProxyCameraLive);
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

  it('streams the JPEG from the backend live/snapshot.jpg endpoint (no redirect)', async () => {
    mockGetCameraLive.mockResolvedValue({
      ok: true,
      status: 200,
      body: null,
      headers: new Headers({ 'Content-Type': 'image/jpeg' }),
    } as any);

    const request = new Request('http://localhost:3000/api/v1/netatmo/camera/cam_001/snapshot');
    const response = await GET(request as any, mockContext as any);

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('image/jpeg');
    expect(response.headers.get('Cache-Control')).toBe('no-cache, no-store, must-revalidate');
    expect(mockGetCameraLive).toHaveBeenCalledWith('cam_001', 'snapshot.jpg');
  });

  it('forwards a backend 503 without caching it', async () => {
    mockGetCameraLive.mockResolvedValue({
      ok: false,
      status: 503,
      body: null,
      headers: new Headers({ 'Content-Type': 'application/problem+json' }),
    } as any);

    const request = new Request('http://localhost:3000/api/v1/netatmo/camera/cam_001/snapshot');
    const response = await GET(request as any, mockContext as any);

    expect(response.status).toBe(503);
    expect(response.headers.get('Cache-Control')).toBe('no-store');
  });
});
