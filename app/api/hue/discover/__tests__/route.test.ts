/**
 * Tests for Philips Hue Bridge Discovery Route
 * GET /api/hue/discover
 */

// Mock dependencies before imports
jest.mock('@/lib/hue/hueApi');
jest.mock('@/lib/auth0', () => ({
  auth0: {
    getSession: jest.fn(),
  },
}));

import { GET } from '../route';
import { discoverBridges } from '@/lib/hue/hueApi';
import { auth0 } from '@/lib/auth0';

describe('GET /api/hue/discover', () => {
  let mockRequest;
  const mockSession = { user: { sub: 'auth0|123', email: 'test@test.com' } };

  beforeEach(() => {
    jest.clearAllMocks();
    mockRequest = new Request('http://localhost:3000/api/hue/discover');
    // Default: authenticated user
    auth0.getSession.mockResolvedValue(mockSession);
  });

  it('should return 401 when not authenticated', async () => {
    auth0.getSession.mockResolvedValue(null);

    const response = await GET(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.success).toBe(false);
    expect(data.code).toBe('UNAUTHORIZED');
  });

  it('should return discovered bridges successfully', async () => {
    const mockBridges = [
      {
        id: '001788fffe123456',
        internalipaddress: '192.168.1.100',
      },
      {
        id: '001788fffe789abc',
        internalipaddress: '192.168.1.101',
      },
    ];

    discoverBridges.mockResolvedValue(mockBridges);

    const response = await GET(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      success: true,
      bridges: mockBridges,
    });
    expect(discoverBridges).toHaveBeenCalled();
  });

  it('should return empty array when no bridges found', async () => {
    discoverBridges.mockResolvedValue([]);

    const response = await GET(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      success: true,
      bridges: [],
    });
  });

  it('should handle discovery errors gracefully', async () => {
    discoverBridges.mockRejectedValue(new Error('Network error'));

    const response = await GET(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Network error');
  });

  it('should handle bridge discovery service timeout', async () => {
    discoverBridges.mockRejectedValue(new Error('Failed to discover bridges'));

    const response = await GET(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Failed to discover bridges');
  });
});
