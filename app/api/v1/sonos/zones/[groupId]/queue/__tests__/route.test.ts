/**
 * Tests for GET /api/v1/sonos/zones/[groupId]/queue
 */

jest.mock('@/lib/sonos/sonosProxy');
jest.mock('@/lib/auth0', () => ({
  auth0: { getSession: jest.fn() },
}));

import { GET } from '../route';
import * as sonosProxy from '@/lib/sonos/sonosProxy';
import { auth0 } from '@/lib/auth0';

const mockGetSession = jest.mocked(auth0.getSession);
const mockGetQueue = jest.mocked(sonosProxy.getQueue);
const mockSession = { user: { sub: 'auth0|123', email: 'test@test.com' } };
const mockContext = { params: Promise.resolve({ groupId: 'RINCON_123' }) };

const mockQueueData = { items: [], total: 0 };

describe('GET /api/v1/sonos/zones/[groupId]/queue', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSession.mockResolvedValue(mockSession as any);
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  it('should return 401 when not authenticated', async () => {
    mockGetSession.mockResolvedValue(null);
    const mockRequest = { nextUrl: { searchParams: new URLSearchParams() } } as any;

    const response = await GET(mockRequest, mockContext as any);
    expect(response.status).toBe(401);
  });

  it('should return 200 with queue data (no query params)', async () => {
    mockGetQueue.mockResolvedValue(mockQueueData as any);
    const mockRequest = { nextUrl: { searchParams: new URLSearchParams() } } as any;

    const response = await GET(mockRequest, mockContext as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(mockGetQueue).toHaveBeenCalledWith('RINCON_123', undefined, undefined);
  });

  it('should pass limit and offset query params to getQueue', async () => {
    mockGetQueue.mockResolvedValue(mockQueueData as any);
    const mockRequest = { nextUrl: { searchParams: new URLSearchParams('limit=10&offset=5') } } as any;

    const response = await GET(mockRequest, mockContext as any);

    expect(response.status).toBe(200);
    expect(mockGetQueue).toHaveBeenCalledWith('RINCON_123', '10', '5');
  });
});
