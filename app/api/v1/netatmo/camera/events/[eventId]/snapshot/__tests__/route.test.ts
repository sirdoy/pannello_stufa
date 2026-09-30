/**
 * Tests for GET /api/v1/netatmo/camera/events/[eventId]/snapshot
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
const mockGetCameraEventSnapshot = jest.mocked(netatmoProxy.getProxyCameraEventSnapshot);
const mockContext = routeContext({ eventId: 'evt_123' });

/** Partial Response double: jsdom has no global Response, and the route only reads ok/status/body/headers. */
function upstream(status: number, contentType: string) {
  return { ok: status < 400, status, body: null, headers: new Headers({ 'Content-Type': contentType }) } as unknown as Response;
}

describe('GET /api/v1/netatmo/camera/events/[eventId]/snapshot', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSession.mockResolvedValue(mockAppSession());
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  it('should return 401 when not authenticated', async () => {
    mockGetSession.mockResolvedValue(null);
    const request = new Request('http://localhost:3000/api/v1/netatmo/camera/events/evt_123/snapshot');

    const response = await GET(asNextRequest(request), mockContext);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.code).toBe('UNAUTHORIZED');
  });

  it('should return 200 with binary JPEG response', async () => {
    // body is piped through, not read in test
    mockGetCameraEventSnapshot.mockResolvedValue(upstream(200, 'image/jpeg'));

    const request = new Request('http://localhost:3000/api/v1/netatmo/camera/events/evt_123/snapshot');

    const response = await GET(asNextRequest(request), mockContext);

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('image/jpeg');
    expect(mockGetCameraEventSnapshot).toHaveBeenCalledWith('evt_123');
  });

  it('forwards a backend 404 with no-store instead of a cached 200 JPEG', async () => {
    mockGetCameraEventSnapshot.mockResolvedValue(upstream(404, 'application/problem+json'));

    const request = new Request('http://localhost:3000/api/v1/netatmo/camera/events/evt_123/snapshot');
    const response = await GET(asNextRequest(request), mockContext);

    expect(response.status).toBe(404);
    expect(response.headers.get('Content-Type')).toBe('application/problem+json');
    expect(response.headers.get('Cache-Control')).toBe('no-store');
  });
});
