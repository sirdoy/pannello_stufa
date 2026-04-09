/**
 * Tests for GET /api/v1/sonos/zones/[groupId]/playback
 */

jest.mock('@/lib/sonos/sonosProxy');
jest.mock('@/lib/auth0', () => ({
  auth0: { getSession: jest.fn() },
}));

import { GET } from '../route';
import * as sonosProxy from '@/lib/sonos/sonosProxy';
import { auth0 } from '@/lib/auth0';

const mockGetSession = jest.mocked(auth0.getSession);
const mockGetPlayback = jest.mocked(sonosProxy.getPlayback);
const mockSession = { user: { sub: 'auth0|123', email: 'test@test.com' } };

describe('GET /api/v1/sonos/zones/[groupId]/playback', () => {
  let mockRequest: Request;
  let mockContext: { params: Promise<{ groupId: string }> };

  beforeEach(() => {
    jest.clearAllMocks();
    mockRequest = new Request('http://localhost:3000/api/v1/sonos/zones/RINCON_123/playback');
    mockContext = { params: Promise.resolve({ groupId: 'RINCON_123' }) };
    mockGetSession.mockResolvedValue(mockSession as any);
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  it('should return 401 when not authenticated', async () => {
    mockGetSession.mockResolvedValue(null);

    const response = await GET(mockRequest as any, mockContext as any);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.code).toBe('UNAUTHORIZED');
  });

  it('should return 200 with playback data', async () => {
    const mockData = {
      group_id: 'RINCON_123',
      transport_state: 'PLAYING',
    };
    mockGetPlayback.mockResolvedValue(mockData as any);

    const response = await GET(mockRequest as any, mockContext as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(mockGetPlayback).toHaveBeenCalledWith('RINCON_123');
  });
});
