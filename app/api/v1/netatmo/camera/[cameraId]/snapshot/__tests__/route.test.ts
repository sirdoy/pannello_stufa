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
import { asNextRequest, mockAppSession, routeContext } from '@/__tests__/__utils__/routeHelpers';

const mockGetSession = jest.mocked(authSession.getSession);
const mockGetCameraLive = jest.mocked(netatmoProxy.getProxyCameraLive);
const mockContext = routeContext({ cameraId: 'cam_001' });

/** Partial Response double: jsdom has no global Response, and the route only reads ok/status/body/headers. */
function upstream(status: number, contentType: string) {
  return { ok: status < 400, status, body: null, headers: new Headers({ 'Content-Type': contentType }) } as unknown as Response;
}

describe('GET /api/v1/netatmo/camera/[cameraId]/snapshot', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSession.mockResolvedValue(mockAppSession());
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  it('should return 401 when not authenticated', async () => {
    mockGetSession.mockResolvedValue(null);
    const request = new Request('http://localhost:3000/api/v1/netatmo/camera/cam_001/snapshot');

    const response = await GET(asNextRequest(request), mockContext);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.code).toBe('UNAUTHORIZED');
  });

  it('streams the JPEG from the backend live/snapshot.jpg endpoint (no redirect)', async () => {
    mockGetCameraLive.mockResolvedValue(upstream(200, 'image/jpeg'));

    const request = new Request('http://localhost:3000/api/v1/netatmo/camera/cam_001/snapshot');
    const response = await GET(asNextRequest(request), mockContext);

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('image/jpeg');
    expect(response.headers.get('Cache-Control')).toBe('no-cache, no-store, must-revalidate');
    expect(mockGetCameraLive).toHaveBeenCalledWith('cam_001', 'snapshot.jpg');
  });

  it('forwards a backend 503 without caching it', async () => {
    mockGetCameraLive.mockResolvedValue(upstream(503, 'application/problem+json'));

    const request = new Request('http://localhost:3000/api/v1/netatmo/camera/cam_001/snapshot');
    const response = await GET(asNextRequest(request), mockContext);

    expect(response.status).toBe(503);
    expect(response.headers.get('Cache-Control')).toBe('no-store');
  });
});
