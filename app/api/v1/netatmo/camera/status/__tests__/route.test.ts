/**
 * Tests for GET /api/v1/netatmo/camera/status
 */

jest.mock('@/lib/netatmo/netatmoProxy');
jest.mock('@/lib/auth/session', () => ({
  authSession: { getSession: jest.fn() },
}));

import { GET } from '../route';
import * as netatmoProxy from '@/lib/netatmo/netatmoProxy';
import { authSession } from '@/lib/auth/session';
import type { CameraStatusResponse } from '@/types/netatmoProxy';
import { asNextRequest, mockAppSession, routeContext } from '@/__tests__/__utils__/routeHelpers';

const mockGetSession = jest.mocked(authSession.getSession);
const mockGetCameraStatus = jest.mocked(netatmoProxy.getProxyCameraStatus);

describe('GET /api/v1/netatmo/camera/status', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSession.mockResolvedValue(mockAppSession());
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  it('should return 401 when not authenticated', async () => {
    mockGetSession.mockResolvedValue(null);
    const request = new Request('http://localhost:3000/api/v1/netatmo/camera/status');

    const response = await GET(asNextRequest(request), routeContext());
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.code).toBe('UNAUTHORIZED');
  });

  it('should return 200 with camera status', async () => {
    const mockData: CameraStatusResponse = { cameras: [], data_freshness: 'LIVE' };
    mockGetCameraStatus.mockResolvedValue(mockData);

    const request = new Request('http://localhost:3000/api/v1/netatmo/camera/status');

    const response = await GET(asNextRequest(request), routeContext());
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(mockGetCameraStatus).toHaveBeenCalled();
  });
});
