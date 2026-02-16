import { adminDbGet, adminDbSet } from '@/lib/firebaseAdmin';
import { getEnvironmentPath } from '@/lib/environmentHelper';
import {
  getCachedVendor,
  cacheVendor,
  fetchVendorName,
  VENDOR_CACHE_TTL_MS,
} from '../vendorCache';
import type { VendorCacheEntry } from '@/types/firebase/network';

jest.mock('@/lib/firebaseAdmin');
jest.mock('@/lib/environmentHelper');

const mockAdminDbGet = jest.mocked(adminDbGet);
const mockAdminDbSet = jest.mocked(adminDbSet);
const mockGetEnvironmentPath = jest.mocked(getEnvironmentPath);

// Mock global fetch
global.fetch = jest.fn();
const mockFetch = jest.mocked(global.fetch);

describe('vendorCache', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetEnvironmentPath.mockImplementation((path) => `test-env/${path}`);
  });

  describe('getCachedVendor', () => {
    it('should return cached entry when within 7-day TTL', async () => {
      const mac = 'AA:BB:CC:DD:EE:FF';
      const now = Date.now();
      const cachedEntry: VendorCacheEntry = {
        vendor: 'Apple, Inc.',
        category: 'mobile',
        timestamp: now - 1000 * 60 * 60, // 1 hour ago
      };

      mockAdminDbGet.mockResolvedValue(cachedEntry);

      const result = await getCachedVendor(mac);

      expect(mockGetEnvironmentPath).toHaveBeenCalledWith(
        'network/vendorCache/aa_bb_cc_dd_ee_ff'
      );
      expect(mockAdminDbGet).toHaveBeenCalledWith(
        'test-env/network/vendorCache/aa_bb_cc_dd_ee_ff'
      );
      expect(result).toEqual(cachedEntry);
    });

    it('should return null when cache expired (>7 days)', async () => {
      const mac = 'AA:BB:CC:DD:EE:FF';
      const now = Date.now();
      const expiredEntry: VendorCacheEntry = {
        vendor: 'Apple, Inc.',
        category: 'mobile',
        timestamp: now - VENDOR_CACHE_TTL_MS - 1000, // 7 days + 1 second ago
      };

      mockAdminDbGet.mockResolvedValue(expiredEntry);

      const result = await getCachedVendor(mac);

      expect(result).toBe(null);
    });

    it('should return null when no cache entry exists', async () => {
      const mac = 'AA:BB:CC:DD:EE:FF';
      mockAdminDbGet.mockResolvedValue(null);

      const result = await getCachedVendor(mac);

      expect(result).toBe(null);
    });

    it('should use normalized MAC for Firebase path', async () => {
      const mac = 'AA-BB-CC-DD-EE-FF'; // Using dashes
      mockAdminDbGet.mockResolvedValue(null);

      await getCachedVendor(mac);

      expect(mockGetEnvironmentPath).toHaveBeenCalledWith(
        'network/vendorCache/aa_bb_cc_dd_ee_ff'
      );
    });
  });

  describe('cacheVendor', () => {
    it('should store vendor entry at correct Firebase path', async () => {
      const mac = 'AA:BB:CC:DD:EE:FF';
      const entry: VendorCacheEntry = {
        vendor: 'Apple, Inc.',
        category: 'mobile',
        timestamp: Date.now(),
      };

      await cacheVendor(mac, entry);

      expect(mockGetEnvironmentPath).toHaveBeenCalledWith(
        'network/vendorCache/aa_bb_cc_dd_ee_ff'
      );
      expect(mockAdminDbSet).toHaveBeenCalledWith(
        'test-env/network/vendorCache/aa_bb_cc_dd_ee_ff',
        entry
      );
    });

    it('should use normalized MAC for Firebase key', async () => {
      const mac = 'AA-BB-CC-DD-EE-FF'; // Using dashes
      const entry: VendorCacheEntry = {
        vendor: 'Samsung',
        category: 'mobile',
        timestamp: Date.now(),
      };

      await cacheVendor(mac, entry);

      expect(mockGetEnvironmentPath).toHaveBeenCalledWith(
        'network/vendorCache/aa_bb_cc_dd_ee_ff'
      );
    });
  });

  describe('fetchVendorName', () => {
    it('should return vendor string on 200 response', async () => {
      const mac = 'AA:BB:CC:DD:EE:FF';
      const vendorName = 'Apple, Inc.';

      mockFetch.mockResolvedValue({
        ok: true,
        text: async () => vendorName,
      } as Response);

      const result = await fetchVendorName(mac);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.macvendors.com/AA%3ABB%3ACC%3ADD%3AEE%3AFF'
      );
      expect(result).toBe(vendorName);
    });

    it('should return null on 404 (unknown MAC)', async () => {
      const mac = 'FF:FF:FF:FF:FF:FF';

      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
      } as Response);

      const result = await fetchVendorName(mac);

      expect(result).toBe(null);
    });

    it('should return null on network error (does NOT throw)', async () => {
      const mac = 'AA:BB:CC:DD:EE:FF';

      mockFetch.mockRejectedValue(new Error('Network error'));

      const result = await fetchVendorName(mac);

      expect(result).toBe(null);
    });

    it('should return null on non-200 response', async () => {
      const mac = 'AA:BB:CC:DD:EE:FF';

      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
      } as Response);

      const result = await fetchVendorName(mac);

      expect(result).toBe(null);
    });

    it('should encode MAC address in URL', async () => {
      const mac = 'AA:BB:CC:DD:EE:FF';

      mockFetch.mockResolvedValue({
        ok: true,
        text: async () => 'Some Vendor',
      } as Response);

      await fetchVendorName(mac);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.macvendors.com/AA%3ABB%3ACC%3ADD%3AEE%3AFF'
      );
    });
  });
});
