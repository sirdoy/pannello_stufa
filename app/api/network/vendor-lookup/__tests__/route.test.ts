/**
 * Tests for Network Vendor Lookup Route
 * GET /api/network/vendor-lookup?mac=XX:XX:XX:XX:XX:XX
 */

// Mock dependencies before imports
jest.mock('@/lib/network/vendorCache');
jest.mock('@/lib/network/deviceCategories');
jest.mock('@/lib/auth0', () => ({
  auth0: {
    getSession: jest.fn(),
  },
}));

import { GET } from '../route';
import { getCachedVendor, cacheVendor, fetchVendorName } from '@/lib/network/vendorCache';
import { categorizeByVendor } from '@/lib/network/deviceCategories';
import { auth0 } from '@/lib/auth0';

const mockGetSession = jest.mocked(auth0.getSession);
const mockGetCachedVendor = jest.mocked(getCachedVendor);
const mockCacheVendor = jest.mocked(cacheVendor);
const mockFetchVendorName = jest.mocked(fetchVendorName);
const mockCategorizeByVendor = jest.mocked(categorizeByVendor);

describe('GET /api/network/vendor-lookup', () => {
  const mockSession = { user: { sub: 'auth0|123', email: 'test@test.com' } };
  const testMac = 'AA:BB:CC:DD:EE:FF';

  beforeEach(() => {
    jest.clearAllMocks();
    // Default: authenticated user
    mockGetSession.mockResolvedValue(mockSession as any);
    // Mock console methods to suppress output
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  it('should return 401 when not authenticated', async () => {
    mockGetSession.mockResolvedValue(null);
    const mockRequest = new Request(`http://localhost:3000/api/network/vendor-lookup?mac=${testMac}`);

    const response = await GET(mockRequest as any, {} as any);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.success).toBe(false);
    expect(data.code).toBe('UNAUTHORIZED');
  });

  it('should return 400 when MAC parameter missing', async () => {
    const mockRequest = new Request('http://localhost:3000/api/network/vendor-lookup');

    const response = await GET(mockRequest as any, {} as any);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.code).toBe('VALIDATION_ERROR');
    expect(data.error).toBe('Indirizzo MAC richiesto');
  });

  it('should return 200 with cached vendor and cached:true when cache hit', async () => {
    mockGetCachedVendor.mockResolvedValue({
      vendor: 'Apple',
      category: 'mobile',
      timestamp: Date.now() - 1000,
    });
    const mockRequest = new Request(`http://localhost:3000/api/network/vendor-lookup?mac=${testMac}`);

    const response = await GET(mockRequest as any, {} as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      success: true,
      vendor: 'Apple',
      category: 'mobile',
      cached: true,
    });
    expect(mockGetCachedVendor).toHaveBeenCalledWith(testMac);
    expect(mockFetchVendorName).not.toHaveBeenCalled();
  });

  it('should return 200 with fresh vendor and cached:false when cache miss', async () => {
    mockGetCachedVendor.mockResolvedValue(null);
    mockFetchVendorName.mockResolvedValue('Samsung Electronics');
    mockCategorizeByVendor.mockReturnValue('mobile');
    const mockRequest = new Request(`http://localhost:3000/api/network/vendor-lookup?mac=${testMac}`);

    const response = await GET(mockRequest as any, {} as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      success: true,
      vendor: 'Samsung Electronics',
      category: 'mobile',
      cached: false,
    });
    expect(mockFetchVendorName).toHaveBeenCalledWith(testMac);
    expect(mockCategorizeByVendor).toHaveBeenCalledWith('Samsung Electronics');
    expect(mockCacheVendor).toHaveBeenCalledWith(testMac, {
      vendor: 'Samsung Electronics',
      category: 'mobile',
      timestamp: expect.any(Number),
    });
  });

  it('should return category unknown when fetchVendorName returns null', async () => {
    mockGetCachedVendor.mockResolvedValue(null);
    mockFetchVendorName.mockResolvedValue(null);
    mockCategorizeByVendor.mockReturnValue('unknown');
    const mockRequest = new Request(`http://localhost:3000/api/network/vendor-lookup?mac=${testMac}`);

    const response = await GET(mockRequest as any, {} as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      success: true,
      vendor: '',
      category: 'unknown',
      cached: false,
    });
    expect(mockCategorizeByVendor).toHaveBeenCalledWith(null);
  });

  it('should cache even unknown results to prevent repeated API calls', async () => {
    mockGetCachedVendor.mockResolvedValue(null);
    mockFetchVendorName.mockResolvedValue(null);
    mockCategorizeByVendor.mockReturnValue('unknown');
    const mockRequest = new Request(`http://localhost:3000/api/network/vendor-lookup?mac=${testMac}`);

    await GET(mockRequest as any, {} as any);

    expect(mockCacheVendor).toHaveBeenCalledWith(testMac, {
      vendor: '',
      category: 'unknown',
      timestamp: expect.any(Number),
    });
  });

  it('should handle fetchVendorName failure gracefully and return unknown category', async () => {
    mockGetCachedVendor.mockResolvedValue(null);
    mockFetchVendorName.mockResolvedValue(null); // API returns null on failure
    mockCategorizeByVendor.mockReturnValue('unknown');
    const mockRequest = new Request(`http://localhost:3000/api/network/vendor-lookup?mac=${testMac}`);

    const response = await GET(mockRequest as any, {} as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.category).toBe('unknown');
  });
});
