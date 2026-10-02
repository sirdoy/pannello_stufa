/**
 * Tests for Fritz!Box Bandwidth Route
 * GET /api/v1/fritzbox/bandwidth
 */

// Mock dependencies before imports
jest.mock('@/lib/fritzbox');
jest.mock('@/lib/auth/session', () => ({
  authSession: {
    getSession: jest.fn(),
  },
}));

import { GET } from '../route';
import { fritzboxClient } from '@/lib/fritzbox';
import { authSession } from '@/lib/auth/session';
import { asNextRequest, mockAppSession, routeContext } from '@/__tests__/__utils__/routeHelpers';

const mockGetSession = jest.mocked(authSession.getSession);
const mockFritzboxClient = jest.mocked(fritzboxClient);

describe('GET /api/v1/fritzbox/bandwidth', () => {
  let mockRequest: Request;
  const mockSession = mockAppSession({ sub: 'auth0|123', email: 'test@test.com' });
  const mockBandwidth = {
    download: 5120,
    upload: 1024,
    timestamp: 1711324800000,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockRequest = new Request('http://localhost:3000/api/v1/fritzbox/bandwidth');
    // Default: authenticated user
    mockGetSession.mockResolvedValue(mockSession);
    // Mock console methods to suppress output
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  it('should return 401 when not authenticated', async () => {
    mockGetSession.mockResolvedValue(null);

    const response = await GET(asNextRequest(mockRequest), routeContext());
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.success).toBe(false);
    expect(data.code).toBe('UNAUTHORIZED');
  });

  it('should return 200 with bandwidth data', async () => {
    mockFritzboxClient.getBandwidth.mockResolvedValue(mockBandwidth);

    const response = await GET(asNextRequest(mockRequest), routeContext());
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      success: true,
      bandwidth: mockBandwidth,
    });
    expect(mockFritzboxClient.getBandwidth).toHaveBeenCalled();
  });

  it('should call fritzboxClient.getBandwidth', async () => {
    mockFritzboxClient.getBandwidth.mockResolvedValue(mockBandwidth);

    await GET(asNextRequest(mockRequest), routeContext());

    expect(mockFritzboxClient.getBandwidth).toHaveBeenCalled();
  });

  it('should propagate errors from fritzboxClient', async () => {
    const error = new Error('Bandwidth query failed');
    mockFritzboxClient.getBandwidth.mockRejectedValue(error);

    const response = await GET(asNextRequest(mockRequest), routeContext());
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Bandwidth query failed');
  });
});
