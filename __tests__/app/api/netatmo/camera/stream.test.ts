/**
 * @jest-environment node
 *
 * Tests for GET /api/netatmo/camera/stream?cameraId=<id>
 * Returns HLS stream URLs for a specific camera from the Netatmo proxy.
 */

import { GET } from '@/app/api/netatmo/camera/stream/route';
import { getProxyCameraStream } from '@/lib/netatmoProxy';
import type { CameraStreamResponse } from '@/types/netatmoProxy';

// Mock dependencies
jest.mock('@/lib/netatmoProxy');
jest.mock('@/lib/core', () => ({
  withAuthAndErrorHandler: (fn: Function) => async (...args: unknown[]) => {
    try {
      return await fn(...args);
    } catch (error: any) {
      return { ok: false, error: error.message, status: 500 };
    }
  },
  success: (data: unknown) => ({ ok: true, data }),
  badRequest: (msg: string) => ({ ok: false, error: msg, status: 400 }),
  parseQuery: (req: { url: string }) => new URL(req.url).searchParams,
}));

const mockGetProxyCameraStream = getProxyCameraStream as jest.MockedFunction<typeof getProxyCameraStream>;

const CAMERA_ID = '70:ee:50:aa:bb:cc';

const mockStreamResponse: CameraStreamResponse = {
  camera_id: CAMERA_ID,
  vpn_streams: {
    high: 'https://v.netatmo.com/restricted/test/live/high.m3u8',
    medium: 'https://v.netatmo.com/restricted/test/live/medium.m3u8',
    low: 'https://v.netatmo.com/restricted/test/live/low.m3u8',
  },
  is_local: false,
};

const mockStreamResponseLocal: CameraStreamResponse = {
  camera_id: CAMERA_ID,
  vpn_streams: {
    high: 'https://v.netatmo.com/restricted/test/live/high.m3u8',
    medium: 'https://v.netatmo.com/restricted/test/live/medium.m3u8',
    low: 'https://v.netatmo.com/restricted/test/live/low.m3u8',
  },
  is_local: true,
  local_streams: {
    high: 'http://192.168.1.100/high.m3u8',
    medium: 'http://192.168.1.100/medium.m3u8',
    low: 'http://192.168.1.100/low.m3u8',
  },
};

const callGET = (cameraId?: string) =>
  (GET as unknown as (req: unknown, ctx: unknown, sess: unknown) => Promise<unknown>)(
    { url: `http://localhost/api/netatmo/camera/stream${cameraId ? `?cameraId=${encodeURIComponent(cameraId)}` : ''}` },
    undefined,
    undefined
  );

describe('GET /api/netatmo/camera/stream', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return badRequest when cameraId is missing', async () => {
    const result = await callGET();

    expect((result as any).ok).toBe(false);
    expect((result as any).status).toBe(400);
    expect(mockGetProxyCameraStream).not.toHaveBeenCalled();
  });

  it('should call getProxyCameraStream with decoded cameraId', async () => {
    mockGetProxyCameraStream.mockResolvedValueOnce(mockStreamResponse);

    await callGET(CAMERA_ID);

    expect(mockGetProxyCameraStream).toHaveBeenCalledWith(CAMERA_ID);
  });

  it('should return stream URLs for VPN-only camera', async () => {
    mockGetProxyCameraStream.mockResolvedValueOnce(mockStreamResponse);

    const result = await callGET(CAMERA_ID);

    expect((result as any).ok).toBe(true);
    expect((result as any).data.camera_id).toBe(CAMERA_ID);
    expect((result as any).data.vpn_streams.high).toBe(
      'https://v.netatmo.com/restricted/test/live/high.m3u8'
    );
    expect((result as any).data.is_local).toBe(false);
    expect((result as any).data.local_streams).toBeUndefined();
  });

  it('should return local_streams when camera is on local network', async () => {
    mockGetProxyCameraStream.mockResolvedValueOnce(mockStreamResponseLocal);

    const result = await callGET(CAMERA_ID);

    expect((result as any).ok).toBe(true);
    expect((result as any).data.is_local).toBe(true);
    expect((result as any).data.local_streams.high).toBe(
      'http://192.168.1.100/high.m3u8'
    );
  });

  it('should return all quality levels (high, medium, low)', async () => {
    mockGetProxyCameraStream.mockResolvedValueOnce(mockStreamResponse);

    const result = await callGET(CAMERA_ID);

    const vpnStreams = (result as any).data.vpn_streams;
    expect(vpnStreams.high).toBeDefined();
    expect(vpnStreams.medium).toBeDefined();
    expect(vpnStreams.low).toBeDefined();
  });

  it('should propagate proxy errors', async () => {
    mockGetProxyCameraStream.mockRejectedValueOnce(new Error('Camera not found in homedata'));

    const result = await callGET(CAMERA_ID);

    expect((result as any).ok).toBe(false);
    expect((result as any).error).toBe('Camera not found in homedata');
  });

  it('should handle MAC address cameraId with colons', async () => {
    const macId = '70:ee:50:3b:1f:4f';
    mockGetProxyCameraStream.mockResolvedValueOnce({
      ...mockStreamResponse,
      camera_id: macId,
    });

    await callGET(macId);

    expect(mockGetProxyCameraStream).toHaveBeenCalledWith(macId);
  });
});
