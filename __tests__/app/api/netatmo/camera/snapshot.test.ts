/**
 * @jest-environment node
 *
 * Tests for GET /api/netatmo/camera/snapshot?cameraId=<id>
 *
 * The route issues an auth-gated redirect to the Netatmo CDN snapshot URL:
 * 1. Verify Auth0 session (handled by withAuthAndErrorHandler mock)
 * 2. GET snapshot URL from proxy (JSON)
 * 3. Issue 302 redirect to snapshot_url
 *
 * This is more resilient than server-side proxying because the browser loads
 * the CDN URL directly, regardless of the Next.js server's network access.
 */

import { GET } from '@/app/api/netatmo/camera/snapshot/route';
import { getProxyCameraSnapshot } from '@/lib/netatmoProxy';

// Mock dependencies
jest.mock('@/lib/netatmoProxy');

// Mock next/server NextResponse including the static redirect method
jest.mock('next/server', () => {
  class MockNextResponse {
    body: unknown;
    status: number;
    statusText: string;
    headers: Map<string, string>;

    constructor(body: unknown, init?: { status?: number; statusText?: string; headers?: Record<string, string> }) {
      this.body = body;
      this.status = init?.status ?? 200;
      this.statusText = init?.statusText ?? '';
      this.headers = new Map(Object.entries(init?.headers ?? {}));
    }

    static redirect(url: string, init?: { status?: number; headers?: Record<string, string> }): MockNextResponse {
      const res = new MockNextResponse(null, {
        status: (init as any)?.status ?? 302,
        headers: { ...(init as any)?.headers, Location: url },
      });
      return res;
    }
  }

  return { NextResponse: MockNextResponse };
});

const mockGetProxyCameraSnapshot = getProxyCameraSnapshot as jest.MockedFunction<typeof getProxyCameraSnapshot>;

jest.mock('@/lib/core', () => ({
  withAuthAndErrorHandler: (fn: Function) => async (...args: unknown[]) => {
    try {
      return await fn(...args);
    } catch (error: any) {
      return { ok: false, error: error.message, status: 500 };
    }
  },
  badRequest: (msg: string) => ({ ok: false, error: msg, status: 400 }),
  parseQuery: (req: { url: string }) => new URL(req.url).searchParams,
}));

const SNAPSHOT_URL = 'https://v.netatmo.com/restricted/test/camera/live/snapshot_720.jpg';
const CAMERA_ID = '70:ee:50:aa:bb:cc';

const callGET = (cameraId?: string) =>
  (GET as unknown as (req: unknown, ctx: unknown, sess: unknown) => Promise<unknown>)(
    { url: `http://localhost/api/netatmo/camera/snapshot${cameraId ? `?cameraId=${encodeURIComponent(cameraId)}` : ''}` },
    undefined,
    undefined
  );

describe('GET /api/netatmo/camera/snapshot', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return badRequest when cameraId is missing', async () => {
    const result = await callGET();

    expect((result as any).ok).toBe(false);
    expect((result as any).status).toBe(400);
    expect(mockGetProxyCameraSnapshot).not.toHaveBeenCalled();
  });

  it('should call getProxyCameraSnapshot with cameraId', async () => {
    mockGetProxyCameraSnapshot.mockResolvedValueOnce({
      camera_id: CAMERA_ID,
      snapshot_url: SNAPSHOT_URL,
    });

    await callGET(CAMERA_ID);

    expect(mockGetProxyCameraSnapshot).toHaveBeenCalledWith(CAMERA_ID);
  });

  it('should return 302 redirect to snapshot URL', async () => {
    mockGetProxyCameraSnapshot.mockResolvedValueOnce({
      camera_id: CAMERA_ID,
      snapshot_url: SNAPSHOT_URL,
    });

    const result = await callGET(CAMERA_ID);
    const response = result as any;

    expect(response.status).toBe(302);
    expect(response.headers.get('Location')).toBe(SNAPSHOT_URL);
  });

  it('should include no-cache header on redirect', async () => {
    mockGetProxyCameraSnapshot.mockResolvedValueOnce({
      camera_id: CAMERA_ID,
      snapshot_url: SNAPSHOT_URL,
    });

    const result = await callGET(CAMERA_ID);
    const response = result as any;

    expect(response.headers.get('Cache-Control')).toBe('no-cache, no-store');
  });

  it('should redirect to the exact snapshot_url returned by proxy', async () => {
    const customUrl = 'https://v.netatmo.com/restricted/abc123/live/snapshot_720.jpg';
    mockGetProxyCameraSnapshot.mockResolvedValueOnce({
      camera_id: CAMERA_ID,
      snapshot_url: customUrl,
    });

    const result = await callGET(CAMERA_ID);

    expect((result as any).headers.get('Location')).toBe(customUrl);
  });

  it('should propagate proxy errors when getProxyCameraSnapshot throws', async () => {
    mockGetProxyCameraSnapshot.mockRejectedValueOnce(new Error('Proxy not available'));

    const result = await callGET(CAMERA_ID);

    expect((result as any).ok).toBe(false);
    expect((result as any).error).toBe('Proxy not available');
  });

  it('should pass URL-decoded cameraId (colons preserved) to proxy', async () => {
    const idWithColons = '70:ee:50:aa:bb:cc';

    mockGetProxyCameraSnapshot.mockResolvedValueOnce({
      camera_id: idWithColons,
      snapshot_url: SNAPSHOT_URL,
    });

    await callGET(idWithColons);

    // After URL decoding, cameraId should have colons (not %3A)
    expect(mockGetProxyCameraSnapshot).toHaveBeenCalledWith(idWithColons);
  });
});
