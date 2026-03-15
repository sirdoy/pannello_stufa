/**
 * @jest-environment node
 *
 * Tests for GET /api/netatmo/camera/status
 * Migrated to use Netatmo proxy instead of Netatmo Cloud API directly.
 */

import { GET } from '@/app/api/netatmo/camera/status/route';
import { getProxyCameraStatus } from '@/lib/netatmoProxy';
import type { CameraStatusResponse } from '@/types/netatmoProxy';

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
}));

const mockGetProxyCameraStatus = getProxyCameraStatus as jest.MockedFunction<typeof getProxyCameraStatus>;

const mockCameraStatusResponse: CameraStatusResponse = {
  cameras: [
    {
      camera_id: 'cam-123',
      name: 'Front Door',
      device_type: 'NOC',
      status: 'on',
      sd_status: 'on',
      alim_status: 'on',
      firmware: 174,
      is_local: false,
    },
  ],
  data_freshness: {
    fetched_at: '2026-03-15T12:00:00Z',
    age_seconds: 30,
    source: 'cache',
  },
};

const callGET = () =>
  (GET as unknown as (req: unknown, ctx: unknown, sess: unknown) => Promise<unknown>)(
    {},
    undefined,
    undefined
  );

describe('GET /api/netatmo/camera/status', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return camera status from proxy', async () => {
    mockGetProxyCameraStatus.mockResolvedValue(mockCameraStatusResponse);

    const result = await callGET();

    expect(mockGetProxyCameraStatus).toHaveBeenCalledTimes(1);
    expect((result as any).ok).toBe(true);
    expect((result as any).data).toEqual(mockCameraStatusResponse);
  });

  it('should return cameras array from proxy response', async () => {
    mockGetProxyCameraStatus.mockResolvedValue(mockCameraStatusResponse);

    const result = await callGET();

    expect((result as any).data.cameras).toHaveLength(1);
    expect((result as any).data.cameras[0]).toMatchObject({
      camera_id: 'cam-123',
      name: 'Front Door',
      status: 'on',
    });
  });

  it('should return data_freshness from proxy response', async () => {
    mockGetProxyCameraStatus.mockResolvedValue(mockCameraStatusResponse);

    const result = await callGET();

    expect((result as any).data.data_freshness).toMatchObject({
      source: 'cache',
      age_seconds: 30,
    });
  });

  it('should propagate proxy errors', async () => {
    const proxyError = new Error('Proxy connection failed');
    mockGetProxyCameraStatus.mockRejectedValue(proxyError);

    const result = await callGET();

    expect((result as any).ok).toBe(false);
    expect((result as any).error).toBe('Proxy connection failed');
  });

  it('should return empty cameras array when proxy returns no cameras', async () => {
    mockGetProxyCameraStatus.mockResolvedValue({
      cameras: [],
      data_freshness: { fetched_at: '2026-03-15T12:00:00Z', age_seconds: 0, source: 'live' },
    });

    const result = await callGET();

    expect((result as any).ok).toBe(true);
    expect((result as any).data.cameras).toHaveLength(0);
  });
});
