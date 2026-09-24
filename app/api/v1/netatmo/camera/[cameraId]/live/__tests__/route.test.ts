/**
 * HLS relay routes: /live/[quality]/index.m3u8 and /live/[quality]/seg/[...rest]
 * → backend /api/v1/netatmo/camera/{id}/live/{quality}/(index.m3u8|seg/...)
 */

jest.mock('@/lib/netatmo/netatmoProxy');
jest.mock('@/lib/auth0', () => ({
  auth0: { getSession: jest.fn() },
}));

import { GET as getPlaylist } from '../[quality]/index.m3u8/route';
import { GET as getSegment } from '../[quality]/seg/[...rest]/route';
import * as netatmoProxy from '@/lib/netatmo/netatmoProxy';
import { auth0 } from '@/lib/auth0';

const mockGetSession = jest.mocked(auth0.getSession);
const mockGetCameraLive = jest.mocked(netatmoProxy.getProxyCameraLive);
const req = new Request('http://localhost:3000/x');

function upstream(status: number, contentType: string) {
  return { ok: status < 400, status, body: null, headers: new Headers({ 'Content-Type': contentType }) } as any;
}
function ctx(params: Record<string, unknown>) {
  return { params: Promise.resolve(params) } as any;
}

describe('camera live HLS relay routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSession.mockResolvedValue({ user: { sub: 'auth0|1' } } as any);
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('playlist: 401 without session', async () => {
    mockGetSession.mockResolvedValue(null as any);
    const res = await getPlaylist(req as any, ctx({ cameraId: 'cam1', quality: 'high' }));
    expect(res.status).toBe(401);
    expect(mockGetCameraLive).not.toHaveBeenCalled();
  });

  it('playlist: relays the backend-rewritten m3u8 without caching', async () => {
    mockGetCameraLive.mockResolvedValue(upstream(200, 'application/vnd.apple.mpegurl'));
    const res = await getPlaylist(req as any, ctx({ cameraId: 'cam1', quality: 'high' }));
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('application/vnd.apple.mpegurl');
    expect(res.headers.get('Cache-Control')).toBe('no-store');
    expect(mockGetCameraLive).toHaveBeenCalledWith('cam1', 'high/index.m3u8');
  });

  it('playlist: rejects an unknown quality', async () => {
    const res = await getPlaylist(req as any, ctx({ cameraId: 'cam1', quality: 'ultra' }));
    expect(res.status).toBe(400);
    expect(mockGetCameraLive).not.toHaveBeenCalled();
  });

  it('segment: joins catch-all parts and relays the .ts body', async () => {
    mockGetCameraLive.mockResolvedValue(upstream(200, 'video/MP2T'));
    const res = await getSegment(req as any, ctx({ cameraId: 'cam1', quality: 'low', rest: ['sub', 'seg 12.ts'] }));
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('video/MP2T');
    expect(mockGetCameraLive).toHaveBeenCalledWith('cam1', 'low/seg/sub/seg%2012.ts');
  });

  it('segment: rejects path traversal', async () => {
    const res = await getSegment(req as any, ctx({ cameraId: 'cam1', quality: 'low', rest: ['..', 'etc'] }));
    expect(res.status).toBe(400);
    expect(mockGetCameraLive).not.toHaveBeenCalled();
  });

  it('segment: forwards backend errors (e.g. 502 from the VPN) uncached', async () => {
    mockGetCameraLive.mockResolvedValue(upstream(502, 'application/problem+json'));
    const res = await getSegment(req as any, ctx({ cameraId: 'cam1', quality: 'high', rest: ['a.ts'] }));
    expect(res.status).toBe(502);
    expect(res.headers.get('Cache-Control')).toBe('no-store');
  });
});
