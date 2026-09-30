/**
 * Tests for POST /api/v1/sonos/zones/[groupId]/previous
 */

jest.mock('@/lib/sonos/sonosProxy');
jest.mock('@/lib/auth/session', () => ({
  authSession: { getSession: jest.fn() },
}));

import { POST } from '../route';
import * as sonosProxy from '@/lib/sonos/sonosProxy';
import { authSession } from '@/lib/auth/session';
import { asNextRequest, mockAppSession, routeContext } from '@/__tests__/__utils__/routeHelpers';

const mockGetSession = jest.mocked(authSession.getSession);
const mockPrevious = jest.mocked(sonosProxy.previous);

describe('POST /api/v1/sonos/zones/[groupId]/previous', () => {
  let mockRequest: Request;
  const mockContext = routeContext({ groupId: 'RINCON_123' });

  beforeEach(() => {
    jest.clearAllMocks();
    mockRequest = new Request('http://localhost:3000/api/v1/sonos/zones/RINCON_123/previous', {
      method: 'POST',
    });
    mockGetSession.mockResolvedValue(mockAppSession());
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  it('should return 401 when not authenticated', async () => {
    mockGetSession.mockResolvedValue(null);

    const response = await POST(asNextRequest(mockRequest), mockContext);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.code).toBe('UNAUTHORIZED');
  });

  it('should return 202 with command response', async () => {
    mockPrevious.mockResolvedValue({ data_confirmed: true });

    const response = await POST(asNextRequest(mockRequest), mockContext);
    const data = await response.json();

    expect(response.status).toBe(202);
    expect(data.success).toBe(true);
    expect(data.suggested_poll_delay_s).toBe(1);
    expect(mockPrevious).toHaveBeenCalledWith('RINCON_123');
  });
});
