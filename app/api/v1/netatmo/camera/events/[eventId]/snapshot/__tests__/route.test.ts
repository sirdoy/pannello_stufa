/**
 * Tests for GET /api/v1/netatmo/camera/events/[eventId]/snapshot
 */

jest.mock('@/lib/netatmo/netatmoProxy');
jest.mock('@/lib/auth0', () => ({
  auth0: { getSession: jest.fn() },
}));

import { GET } from '../route';
import * as netatmoProxy from '@/lib/netatmo/netatmoProxy';
import { auth0 } from '@/lib/auth0';

const mockGetSession = jest.mocked(auth0.getSession);
const mockGetCameraEventSnapshot = jest.mocked(netatmoProxy.getProxyCameraEventSnapshot);
const mockSession = { user: { sub: 'auth0|123', email: 'test@test.com' } };
const mockContext = { params: Promise.resolve({ eventId: 'evt_123' }) };

describe('GET /api/v1/netatmo/camera/events/[eventId]/snapshot', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSession.mockResolvedValue(mockSession as any);
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  it('should return 401 when not authenticated', async () => {
    mockGetSession.mockResolvedValue(null);
    const request = new Request('http://localhost:3000/api/v1/netatmo/camera/events/evt_123/snapshot');

    const response = await GET(request as any, mockContext as any);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.code).toBe('UNAUTHORIZED');
  });

  it('should return 200 with binary JPEG response', async () => {
    const mockBody = null; // body is piped through, not read in test
    mockGetCameraEventSnapshot.mockResolvedValue({
      body: mockBody,
      status: 200,
    } as any);

    const request = new Request('http://localhost:3000/api/v1/netatmo/camera/events/evt_123/snapshot');

    const response = await GET(request as any, mockContext as any);

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('image/jpeg');
    expect(mockGetCameraEventSnapshot).toHaveBeenCalledWith('evt_123');
  });
});
