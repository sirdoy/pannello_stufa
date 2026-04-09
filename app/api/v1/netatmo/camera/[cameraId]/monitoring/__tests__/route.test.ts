/**
 * Tests for POST /api/v1/netatmo/camera/[cameraId]/monitoring
 */

jest.mock('@/lib/netatmo/netatmoProxy');
jest.mock('@/lib/auth0', () => ({
  auth0: { getSession: jest.fn() },
}));

import { POST } from '../route';
import * as netatmoProxy from '@/lib/netatmo/netatmoProxy';
import { auth0 } from '@/lib/auth0';

const mockGetSession = jest.mocked(auth0.getSession);
const mockSetCameraMonitoring = jest.mocked(netatmoProxy.proxySetCameraMonitoring);
const mockSession = { user: { sub: 'auth0|123', email: 'test@test.com' } };
const mockContext = { params: Promise.resolve({ cameraId: 'cam_001' }) };

/** Build a mock POST request whose body is readable via parseJson (jsdom-safe). */
function makePostRequest(url: string, body: Record<string, unknown>) {
  return {
    headers: { get: (name: string) => name === 'content-type' ? 'application/json' : null },
    text: async () => JSON.stringify(body),
    nextUrl: { searchParams: new URLSearchParams() },
  } as any;
}

describe('POST /api/v1/netatmo/camera/[cameraId]/monitoring', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSession.mockResolvedValue(mockSession as any);
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  it('should return 401 when not authenticated', async () => {
    mockGetSession.mockResolvedValue(null);
    const request = makePostRequest(
      'http://localhost:3000/api/v1/netatmo/camera/cam_001/monitoring',
      { monitoring: 'on' }
    );

    const response = await POST(request, mockContext as any);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.code).toBe('UNAUTHORIZED');
  });

  it('should return 202 with suggested_poll_delay_s and call proxy with cameraId from path', async () => {
    const mockData = { status: 'ok' };
    mockSetCameraMonitoring.mockResolvedValue(mockData as any);

    const request = makePostRequest(
      'http://localhost:3000/api/v1/netatmo/camera/cam_001/monitoring',
      { monitoring: 'on' }
    );

    const response = await POST(request, mockContext as any);
    const data = await response.json();

    expect(response.status).toBe(202);
    expect(data.suggested_poll_delay_s).toBe(1);
    expect(mockSetCameraMonitoring).toHaveBeenCalledWith('cam_001', { monitoring: 'on' });
  });
});
