/**
 * Tests for GET /api/v1/netatmo/camera/[cameraId]/stream
 */

jest.mock('@/lib/netatmo/netatmoProxy');
jest.mock('@/lib/auth/session', () => ({
  authSession: { getSession: jest.fn() },
}));

import { GET } from '../route';
import * as netatmoProxy from '@/lib/netatmo/netatmoProxy';
import { authSession } from '@/lib/auth/session';
import type { CameraStreamResponse } from '@/types/netatmoProxy';
import { asNextRequest, mockAppSession, routeContext } from '@/__tests__/__utils__/routeHelpers';

const mockGetSession = jest.mocked(authSession.getSession);
const mockGetCameraStream = jest.mocked(netatmoProxy.getProxyCameraStream);
const mockContext = routeContext({ cameraId: 'cam_001' });

describe('GET /api/v1/netatmo/camera/[cameraId]/stream', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSession.mockResolvedValue(mockAppSession());
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  it('should return 401 when not authenticated', async () => {
    mockGetSession.mockResolvedValue(null);
    const request = new Request('http://localhost:3000/api/v1/netatmo/camera/cam_001/stream');

    const response = await GET(asNextRequest(request), mockContext);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.code).toBe('UNAUTHORIZED');
  });

  it('should return 200 with stream URLs', async () => {
    const mockData: CameraStreamResponse = {
      camera_id: 'cam_001',
      vpn_streams: {
        high: 'https://vpn.example.com/live/files/high/index.m3u8',
        medium: 'https://vpn.example.com/live/files/medium/index.m3u8',
        low: 'https://vpn.example.com/live/files/low/index.m3u8',
      },
      is_local: false,
    };
    mockGetCameraStream.mockResolvedValue(mockData);

    const request = new Request('http://localhost:3000/api/v1/netatmo/camera/cam_001/stream');

    const response = await GET(asNextRequest(request), mockContext);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(mockGetCameraStream).toHaveBeenCalledWith('cam_001');
  });
});
