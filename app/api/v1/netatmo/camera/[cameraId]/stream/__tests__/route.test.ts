/**
 * Tests for GET /api/v1/netatmo/camera/[cameraId]/stream
 */

jest.mock('@/lib/netatmo/netatmoProxy');
jest.mock('@/lib/auth0', () => ({
  auth0: { getSession: jest.fn() },
}));

import { GET } from '../route';
import * as netatmoProxy from '@/lib/netatmo/netatmoProxy';
import { auth0 } from '@/lib/auth0';

const mockGetSession = jest.mocked(auth0.getSession);
const mockGetCameraStream = jest.mocked(netatmoProxy.getProxyCameraStream);
const mockSession = { user: { sub: 'auth0|123', email: 'test@test.com' } };
const mockContext = { params: Promise.resolve({ cameraId: 'cam_001' }) };

describe('GET /api/v1/netatmo/camera/[cameraId]/stream', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSession.mockResolvedValue(mockSession as any);
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  it('should return 401 when not authenticated', async () => {
    mockGetSession.mockResolvedValue(null);
    const request = new Request('http://localhost:3000/api/v1/netatmo/camera/cam_001/stream');

    const response = await GET(request as any, mockContext as any);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.code).toBe('UNAUTHORIZED');
  });

  it('should return 200 with stream URLs', async () => {
    const mockData = { vpn_url: 'https://vpn.example.com', local_url: 'http://192.168.1.10' };
    mockGetCameraStream.mockResolvedValue(mockData as any);

    const request = new Request('http://localhost:3000/api/v1/netatmo/camera/cam_001/stream');

    const response = await GET(request as any, mockContext as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(mockGetCameraStream).toHaveBeenCalledWith('cam_001');
  });
});
