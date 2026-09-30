/**
 * Tests for GET /api/v1/netatmo/camera/events
 */

jest.mock('@/lib/netatmo/netatmoProxy');
jest.mock('@/lib/auth/session', () => ({
  authSession: { getSession: jest.fn() },
}));

import { GET } from '../route';
import * as netatmoProxy from '@/lib/netatmo/netatmoProxy';
import { authSession } from '@/lib/auth/session';
import type { CameraEventsResponse } from '@/types/netatmoProxy';
import { asNextRequest, mockAppSession, routeContext } from '@/__tests__/__utils__/routeHelpers';

const mockGetSession = jest.mocked(authSession.getSession);
const mockGetCameraEvents = jest.mocked(netatmoProxy.getProxyCameraEvents);

describe('GET /api/v1/netatmo/camera/events', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSession.mockResolvedValue(mockAppSession());
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  it('should return 401 when not authenticated', async () => {
    mockGetSession.mockResolvedValue(null);
    const request = new Request('http://localhost:3000/api/v1/netatmo/camera/events');

    const response = await GET(asNextRequest(request), routeContext());
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.code).toBe('UNAUTHORIZED');
  });

  it('should return 200 with events data (no hours param)', async () => {
    const mockData: CameraEventsResponse = { events: [], count: 0 };
    mockGetCameraEvents.mockResolvedValue(mockData);

    const request = new Request('http://localhost:3000/api/v1/netatmo/camera/events');

    const response = await GET(asNextRequest(request), routeContext());
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(mockGetCameraEvents).toHaveBeenCalledWith(undefined);
  });

  it('should return 200 with events data and pass hours param', async () => {
    const mockData: CameraEventsResponse = { events: [], count: 0 };
    mockGetCameraEvents.mockResolvedValue(mockData);

    const request = new Request('http://localhost:3000/api/v1/netatmo/camera/events?hours=24');

    const response = await GET(asNextRequest(request), routeContext());
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(mockGetCameraEvents).toHaveBeenCalledWith(24);
  });
});
