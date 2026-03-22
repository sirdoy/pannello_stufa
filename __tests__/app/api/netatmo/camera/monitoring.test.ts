/**
 * @jest-environment node
 *
 * Tests for POST /api/netatmo/camera/monitoring
 * Migrated to use Netatmo proxy instead of Netatmo Cloud API directly.
 */

import { POST } from '@/app/api/netatmo/camera/monitoring/route';
import { proxySetCameraMonitoring } from '@/lib/netatmo/netatmoProxy';
import { adminDbPush } from '@/lib/firebaseAdmin';
import type { SetMonitoringResponse } from '@/types/netatmoProxy';

// Mock dependencies
jest.mock('@/lib/netatmo/netatmoProxy');
jest.mock('@/lib/firebaseAdmin');
jest.mock('@/lib/core', () => {
  const badRequest = (msg: string) => ({ ok: false, error: msg, status: 400 });
  return {
    withAuthAndErrorHandler: (fn: Function) => async (...args: unknown[]) => {
      try {
        return await fn(...args);
      } catch (error: any) {
        return badRequest(error.message);
      }
    },
    success: (data: unknown) => ({ ok: true, data }),
    badRequest,
    parseJsonOrThrow: async (req: { json: () => Promise<unknown> }) => req.json(),
  };
});

const mockProxySetCameraMonitoring = proxySetCameraMonitoring as jest.MockedFunction<typeof proxySetCameraMonitoring>;
const mockAdminDbPush = adminDbPush as jest.MockedFunction<typeof adminDbPush>;

const mockMonitoringResponse: SetMonitoringResponse = {
  camera_id: 'cam-123',
  monitoring: 'on',
  status: 'applied',
};

const callPOST = (body: unknown, session?: unknown) =>
  (POST as unknown as (req: unknown, ctx: unknown, sess: unknown) => Promise<unknown>)(
    { json: async () => body },
    undefined,
    session
  );

describe('POST /api/netatmo/camera/monitoring', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAdminDbPush.mockResolvedValue(undefined as any);
  });

  it('should turn monitoring ON successfully', async () => {
    mockProxySetCameraMonitoring.mockResolvedValue(mockMonitoringResponse);

    const result = await callPOST({ camera_id: 'cam-123', monitoring: 'on' });

    expect(mockProxySetCameraMonitoring).toHaveBeenCalledWith('cam-123', { monitoring: 'on' });
    expect((result as any).ok).toBe(true);
    expect((result as any).data).toEqual(mockMonitoringResponse);
  });

  it('should turn monitoring OFF successfully', async () => {
    const offResponse: SetMonitoringResponse = { ...mockMonitoringResponse, monitoring: 'off' };
    mockProxySetCameraMonitoring.mockResolvedValue(offResponse);

    const result = await callPOST({ camera_id: 'cam-123', monitoring: 'off' });

    expect(mockProxySetCameraMonitoring).toHaveBeenCalledWith('cam-123', { monitoring: 'off' });
    expect((result as any).ok).toBe(true);
    expect((result as any).data.monitoring).toBe('off');
  });

  it('should return badRequest when camera_id is missing', async () => {
    const result = await callPOST({ monitoring: 'on' });

    expect((result as any).ok).toBe(false);
    expect((result as any).status).toBe(400);
    expect(mockProxySetCameraMonitoring).not.toHaveBeenCalled();
  });

  it('should return badRequest when monitoring value is missing', async () => {
    const result = await callPOST({ camera_id: 'cam-123' });

    expect((result as any).ok).toBe(false);
    expect((result as any).status).toBe(400);
    expect(mockProxySetCameraMonitoring).not.toHaveBeenCalled();
  });

  it('should return badRequest when monitoring value is invalid', async () => {
    const result = await callPOST({ camera_id: 'cam-123', monitoring: 'yes' });

    expect((result as any).ok).toBe(false);
    expect((result as any).status).toBe(400);
    expect(mockProxySetCameraMonitoring).not.toHaveBeenCalled();
  });

  it('should call adminDbPush with error field when proxy throws', async () => {
    const proxyError = new Error('Proxy request failed');
    mockProxySetCameraMonitoring.mockRejectedValue(proxyError);

    const result = await callPOST({ camera_id: 'cam-123', monitoring: 'on' });

    expect((result as any).ok).toBe(false);
    expect(mockAdminDbPush).toHaveBeenCalledWith(
      'log',
      expect.objectContaining({
        error: 'Proxy request failed',
      })
    );
  });

  it('should NOT call adminDbPush on successful proxy call', async () => {
    mockProxySetCameraMonitoring.mockResolvedValue(mockMonitoringResponse);

    await callPOST({ camera_id: 'cam-123', monitoring: 'on' });

    expect(mockAdminDbPush).not.toHaveBeenCalled();
  });
});
