/**
 * Tests for GET /api/v1/sonos/zones/[groupId]/queue
 */

jest.mock('@/lib/sonos/sonosProxy');
jest.mock('@/lib/auth/session', () => ({
  authSession: { getSession: jest.fn() },
}));

import { GET } from '../route';
import * as sonosProxy from '@/lib/sonos/sonosProxy';
import { authSession } from '@/lib/auth/session';
import { asNextRequest, mockAppSession, routeContext } from '@/__tests__/__utils__/routeHelpers';
import type { SonosQueueResponse } from '@/types/sonosProxy';

const mockGetSession = jest.mocked(authSession.getSession);
const mockGetQueue = jest.mocked(sonosProxy.getQueue);
const mockContext = routeContext({ groupId: 'RINCON_123' });

const mockQueueData: SonosQueueResponse = { group_id: 'RINCON_123', items: [], total_count: 0, limit: 100, offset: 0 };

describe('GET /api/v1/sonos/zones/[groupId]/queue', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSession.mockResolvedValue(mockAppSession());
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  it('should return 401 when not authenticated', async () => {
    mockGetSession.mockResolvedValue(null);
    const mockRequest = asNextRequest({ nextUrl: { searchParams: new URLSearchParams() } });

    const response = await GET(mockRequest, mockContext);
    expect(response.status).toBe(401);
  });

  it('should return 200 with queue data (no query params)', async () => {
    mockGetQueue.mockResolvedValue(mockQueueData);
    const mockRequest = asNextRequest({ nextUrl: { searchParams: new URLSearchParams() } });

    const response = await GET(mockRequest, mockContext);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(mockGetQueue).toHaveBeenCalledWith('RINCON_123', undefined, undefined);
  });

  it('should pass limit and offset query params to getQueue', async () => {
    mockGetQueue.mockResolvedValue(mockQueueData);
    const mockRequest = asNextRequest({ nextUrl: { searchParams: new URLSearchParams('limit=10&offset=5') } });

    const response = await GET(mockRequest, mockContext);

    expect(response.status).toBe(200);
    expect(mockGetQueue).toHaveBeenCalledWith('RINCON_123', '10', '5');
  });
});
