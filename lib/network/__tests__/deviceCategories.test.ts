import { adminDbGet, adminDbSet } from '@/lib/firebaseAdmin';
import { getEnvironmentPath } from '@/lib/environmentHelper';
import {
  categorizeByVendor,
  normalizeMacForFirebase,
  saveCategoryOverride,
  getCategoryOverride,
  getDeviceCategory,
} from '../deviceCategories';

jest.mock('@/lib/firebaseAdmin');
jest.mock('@/lib/environmentHelper');

const mockAdminDbGet = jest.mocked(adminDbGet);
const mockAdminDbSet = jest.mocked(adminDbSet);
const mockGetEnvironmentPath = jest.mocked(getEnvironmentPath);

describe('deviceCategories', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetEnvironmentPath.mockImplementation((path) => `test-env/${path}`);
  });

  describe('categorizeByVendor', () => {
    it('should categorize Apple as mobile', () => {
      expect(categorizeByVendor('Apple, Inc.')).toBe('mobile');
    });

    it('should categorize Samsung as mobile', () => {
      expect(categorizeByVendor('Samsung Electronics Co.,Ltd')).toBe('mobile');
    });

    it('should categorize Raspberry Pi as iot', () => {
      expect(categorizeByVendor('Raspberry Pi Trading Ltd')).toBe('iot');
    });

    it('should categorize Espressif as iot', () => {
      expect(categorizeByVendor('Espressif Inc.')).toBe('iot');
    });

    it('should categorize AVM as smart-home', () => {
      expect(categorizeByVendor('AVM GmbH')).toBe('smart-home');
    });

    it('should categorize TP-Link as smart-home', () => {
      expect(categorizeByVendor('TP-Link Technologies Co., Ltd.')).toBe('smart-home');
    });

    it('should categorize Philips Lighting as smart-home', () => {
      expect(categorizeByVendor('Philips Lighting BV')).toBe('smart-home');
    });

    it('should categorize Dell as pc', () => {
      expect(categorizeByVendor('Dell Inc.')).toBe('pc');
    });

    it('should categorize Intel as pc', () => {
      expect(categorizeByVendor('Intel Corporate')).toBe('pc');
    });

    it('should categorize HP as pc', () => {
      expect(categorizeByVendor('HP Inc.')).toBe('pc');
    });

    it('should return unknown for unrecognized vendor', () => {
      expect(categorizeByVendor('SomeUnknownVendor')).toBe('unknown');
    });

    it('should return unknown for null vendor', () => {
      expect(categorizeByVendor(null)).toBe('unknown');
    });

    it('should return unknown for empty string', () => {
      expect(categorizeByVendor('')).toBe('unknown');
    });

    it('should be case insensitive', () => {
      expect(categorizeByVendor('APPLE, INC.')).toBe('mobile');
    });

    it('should match partial vendor names', () => {
      expect(categorizeByVendor('Espressif Systems')).toBe('iot');
    });
  });

  describe('normalizeMacForFirebase', () => {
    it('should normalize uppercase colons to lowercase underscores', () => {
      expect(normalizeMacForFirebase('AA:BB:CC:DD:EE:FF')).toBe('aa_bb_cc_dd_ee_ff');
    });

    it('should normalize lowercase colons to underscores', () => {
      expect(normalizeMacForFirebase('aa:bb:cc:dd:ee:ff')).toBe('aa_bb_cc_dd_ee_ff');
    });

    it('should normalize uppercase dashes to lowercase underscores', () => {
      expect(normalizeMacForFirebase('AA-BB-CC-DD-EE-FF')).toBe('aa_bb_cc_dd_ee_ff');
    });
  });

  describe('saveCategoryOverride', () => {
    it('should save override to Firebase with correct path and data', async () => {
      const mac = 'AA:BB:CC:DD:EE:FF';
      const category = 'iot';
      const beforeTimestamp = Date.now();

      await saveCategoryOverride(mac, category);

      const afterTimestamp = Date.now();

      expect(mockGetEnvironmentPath).toHaveBeenCalledWith(
        'network/deviceCategories/aa_bb_cc_dd_ee_ff'
      );
      expect(mockAdminDbSet).toHaveBeenCalledWith(
        'test-env/network/deviceCategories/aa_bb_cc_dd_ee_ff',
        expect.objectContaining({
          category: 'iot',
          isManualOverride: true,
          overriddenAt: expect.any(Number),
        })
      );

      const savedData = mockAdminDbSet.mock.calls[0]?.[1] as {
        overriddenAt: number;
      };
      expect(savedData.overriddenAt).toBeGreaterThanOrEqual(beforeTimestamp);
      expect(savedData.overriddenAt).toBeLessThanOrEqual(afterTimestamp);
    });
  });

  describe('getCategoryOverride', () => {
    it('should return category when override exists', async () => {
      const mac = 'AA:BB:CC:DD:EE:FF';
      mockAdminDbGet.mockResolvedValue({
        category: 'mobile',
        overriddenAt: Date.now(),
        isManualOverride: true,
      });

      const result = await getCategoryOverride(mac);

      expect(mockGetEnvironmentPath).toHaveBeenCalledWith(
        'network/deviceCategories/aa_bb_cc_dd_ee_ff'
      );
      expect(mockAdminDbGet).toHaveBeenCalledWith(
        'test-env/network/deviceCategories/aa_bb_cc_dd_ee_ff'
      );
      expect(result).toBe('mobile');
    });

    it('should return null when no override exists', async () => {
      const mac = 'AA:BB:CC:DD:EE:FF';
      mockAdminDbGet.mockResolvedValue(null);

      const result = await getCategoryOverride(mac);

      expect(result).toBe(null);
    });
  });

  describe('getDeviceCategory', () => {
    it('should return manual override as priority 1', async () => {
      const mac = 'AA:BB:CC:DD:EE:FF';
      mockAdminDbGet.mockResolvedValue({
        category: 'pc',
        overriddenAt: Date.now(),
        isManualOverride: true,
      });

      const result = await getDeviceCategory(mac, 'mobile');

      expect(result).toBe('pc');
    });

    it('should return cached category as priority 2 when no override', async () => {
      const mac = 'AA:BB:CC:DD:EE:FF';
      mockAdminDbGet.mockResolvedValue(null);

      const result = await getDeviceCategory(mac, 'mobile');

      expect(result).toBe('mobile');
    });

    it('should return unknown as fallback when no override or cache', async () => {
      const mac = 'AA:BB:CC:DD:EE:FF';
      mockAdminDbGet.mockResolvedValue(null);

      const result = await getDeviceCategory(mac);

      expect(result).toBe('unknown');
    });

    it('should return unknown when cache is null', async () => {
      const mac = 'AA:BB:CC:DD:EE:FF';
      mockAdminDbGet.mockResolvedValue(null);

      const result = await getDeviceCategory(mac, null);

      expect(result).toBe('unknown');
    });
  });
});
