/**
 * Tests for POST /api/v1/sonos/zones/[groupId]/play
 */

jest.mock('@/lib/sonos/sonosProxy');
jest.mock('@/lib/auth0', () => ({
  auth0: { getSession: jest.fn() },
}));

import { POST } from '../route';
import * as sonosProxy from '@/lib/sonos/sonosProxy';
import { auth0 } from '@/lib/auth0';

const mockGetSession = jest.mocked(auth0.getSession);
const mockPlay = jest.mocked(sonosProxy.play);
const mockSession = { user: { sub: 'auth0|123', email: 'test@test.com' } };

describe('POST /api/v1/sonos/zones/[groupId]/play', () => {
  let mockRequest: Request;
  let mockContext: { params: Promise<{ groupId: string }> };

  beforeEach(() => {
    jest.clearAllMocks();
    mockRequest = new Request('http://localhost:3000/api/v1/sonos/zones/RINCON_123/play', {
      method: 'POST',
    });
    mockContext = { params: Promise.resolve({ groupId: 'RINCON_123' }) };
    mockGetSession.mockResolvedValue(mockSession as any);
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  it('should return 401 when not authenticated', async () => {
    mockGetSession.mockResolvedValue(null);

    const response = await POST(mockRequest as any, mockContext as any);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.code).toBe('UNAUTHORIZED');
  });

  it('should return 202 with command response', async () => {
    mockPlay.mockResolvedValue({ success: true } as any);

    const response = await POST(mockRequest as any, mockContext as any);
    const data = await response.json();

    expect(response.status).toBe(202);
    expect(data.success).toBe(true);
    expect(data.suggested_poll_delay_s).toBe(1);
    expect(mockPlay).toHaveBeenCalledWith('RINCON_123');
  });
});
