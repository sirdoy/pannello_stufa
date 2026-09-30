/**
 * Tests for GET /api/v1/sonos/zones/[groupId]/playback
 */

jest.mock('@/lib/sonos/sonosProxy');
jest.mock('@/lib/auth/session', () => ({
  authSession: { getSession: jest.fn() },
}));

import { GET } from '../route';
import * as sonosProxy from '@/lib/sonos/sonosProxy';
import { authSession } from '@/lib/auth/session';
import { asNextRequest, mockAppSession, routeContext } from '@/__tests__/__utils__/routeHelpers';
import type { SonosPlaybackResponse } from '@/types/sonosProxy';

const mockGetSession = jest.mocked(authSession.getSession);
const mockGetPlayback = jest.mocked(sonosProxy.getPlayback);

describe('GET /api/v1/sonos/zones/[groupId]/playback', () => {
  let mockRequest: Request;
  const mockContext = routeContext({ groupId: 'RINCON_123' });

  beforeEach(() => {
    jest.clearAllMocks();
    mockRequest = new Request('http://localhost:3000/api/v1/sonos/zones/RINCON_123/playback');
    mockGetSession.mockResolvedValue(mockAppSession());
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  it('should return 401 when not authenticated', async () => {
    mockGetSession.mockResolvedValue(null);

    const response = await GET(asNextRequest(mockRequest), mockContext);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.code).toBe('UNAUTHORIZED');
  });

  it('should return 200 with playback data', async () => {
    const mockData: SonosPlaybackResponse = {
      group_id: 'RINCON_123',
      transport_state: 'PLAYING',
      title: null,
      artist: null,
      album: null,
      album_art_url: null,
      position: null,
      duration: null,
      source_type: null,
    };
    mockGetPlayback.mockResolvedValue(mockData);

    const response = await GET(asNextRequest(mockRequest), mockContext);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(mockGetPlayback).toHaveBeenCalledWith('RINCON_123');
  });
});
