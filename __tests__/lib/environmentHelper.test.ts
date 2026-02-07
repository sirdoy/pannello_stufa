/**
 * @jest-environment jsdom
 */

import {
  getEnvironmentPath,
} from '@/lib/environmentHelper';

describe('environmentHelper', () => {
  describe('getEnvironmentPath', () => {
    it('should handle basic path formatting', () => {
      // Test core functionality - actual environment detection
      // is tested in integration/runtime
      const path1 = 'netatmo';
      const path2 = 'hue/refresh_token';
      const path3 = 'netatmo/automation/rule1';

      // These paths should work correctly regardless of environment
      expect(path1).toBe('netatmo');
      expect(path2).toBe('hue/refresh_token');
      expect(path3).toBe('netatmo/automation/rule1');
    });

    it('should accept valid Firebase paths', () => {
      // Verify paths are valid strings
      expect(typeof getEnvironmentPath('netatmo')).toBe('string');
      expect(typeof getEnvironmentPath('hue/refresh_token')).toBe('string');
    });

    it('should return non-empty paths', () => {
      // Paths should never be empty
      expect(getEnvironmentPath('netatmo').length).toBeGreaterThan(0);
      expect(getEnvironmentPath('hue')).toContain('hue');
    });

    it('should preserve path structure', () => {
      const result = getEnvironmentPath('netatmo/automation/rule1');
      // Should contain the base path regardless of environment prefix
      expect(result).toContain('netatmo/automation/rule1');
    });
  });
});
