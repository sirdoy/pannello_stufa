/**
 * @jest-environment jsdom
 */

import {
  rgbToXY,
  hexToXY,
  supportsColor,
  COLOR_PRESETS,
} from '../colorUtils';

describe('colorUtils', () => {
  describe('rgbToXY', () => {
    it('should convert pure red (255, 0, 0) to XY', () => {
      const result = rgbToXY(255, 0, 0);
      expect(result).toHaveProperty('x');
      expect(result).toHaveProperty('y');
      expect(result.x).toBeCloseTo(0.7, 1);
      expect(result.y).toBeCloseTo(0.3, 1);
    });

    it('should convert pure green (0, 255, 0) to XY', () => {
      const result = rgbToXY(0, 255, 0);
      expect(result.x).toBeCloseTo(0.17, 1);
      expect(result.y).toBeCloseTo(0.7, 1);
    });

    it('should convert pure blue (0, 0, 255) to XY', () => {
      const result = rgbToXY(0, 0, 255);
      expect(result.x).toBeCloseTo(0.14, 1);
      expect(result.y).toBeCloseTo(0.05, 1);
    });

    it('should convert white (255, 255, 255) to XY', () => {
      const result = rgbToXY(255, 255, 255);
      expect(result.x).toBeGreaterThan(0);
      expect(result.x).toBeLessThan(1);
      expect(result.y).toBeGreaterThan(0);
      expect(result.y).toBeLessThan(1);
    });

    it('should convert black (0, 0, 0) to XY (0, 0)', () => {
      const result = rgbToXY(0, 0, 0);
      expect(result.x).toBe(0);
      expect(result.y).toBe(0);
    });

    it('should clamp values to 0-1 range', () => {
      const result = rgbToXY(255, 128, 64);
      expect(result.x).toBeGreaterThanOrEqual(0);
      expect(result.x).toBeLessThanOrEqual(1);
      expect(result.y).toBeGreaterThanOrEqual(0);
      expect(result.y).toBeLessThanOrEqual(1);
    });
  });

  describe('hexToXY', () => {
    it('should convert hex red (#FF0000) to XY', () => {
      const result = hexToXY('#FF0000');
      expect(result.x).toBeCloseTo(0.7, 1);
      expect(result.y).toBeCloseTo(0.3, 1);
    });

    it('should convert hex green (#00FF00) to XY', () => {
      const result = hexToXY('#00FF00');
      expect(result.x).toBeCloseTo(0.17, 1);
      expect(result.y).toBeCloseTo(0.7, 1);
    });

    it('should convert hex blue (#0000FF) to XY', () => {
      const result = hexToXY('#0000FF');
      expect(result.x).toBeCloseTo(0.14, 1);
      expect(result.y).toBeCloseTo(0.05, 1);
    });

    it('should handle hex without # prefix', () => {
      const result1 = hexToXY('#FF0000');
      const result2 = hexToXY('FF0000');
      expect(result1.x).toBeCloseTo(result2.x, 4);
      expect(result1.y).toBeCloseTo(result2.y, 4);
    });

    it('should convert yellow (#FFFF00) to XY', () => {
      const result = hexToXY('#FFFF00');
      expect(result.x).toBeCloseTo(0.4432, 2);
      expect(result.y).toBeCloseTo(0.5154, 2);
    });

    it('should convert orange (#FFA500) to XY', () => {
      const result = hexToXY('#FFA500');
      expect(result.x).toBeCloseTo(0.5614, 2);
      expect(result.y).toBeCloseTo(0.4156, 2);
    });
  });

  describe('supportsColor', () => {
    it('should return true for light with color.xy property', () => {
      const light = {
        color: {
          xy: { x: 0.5, y: 0.5 },
        },
      };
      expect(supportsColor(light)).toBe(true);
    });

    it('should return true for light with color.gamut property', () => {
      const light = {
        color: {
          gamut: {
            red: { x: 0.6915, y: 0.3083 },
            green: { x: 0.17, y: 0.7 },
            blue: { x: 0.1532, y: 0.0475 },
          },
        },
      };
      expect(supportsColor(light)).toBe(true);
    });

    it('should return false for light without color property', () => {
      const light = {
        on: { on: true },
        dimming: { brightness: 50 },
      };
      expect(supportsColor(light)).toBe(false);
    });

    it('should return false for light with empty color object', () => {
      const light = {
        color: {},
      };
      expect(supportsColor(light)).toBe(false);
    });

    it('should return false for null light', () => {
      expect(supportsColor(null)).toBe(false);
    });

    it('should return false for undefined light', () => {
      expect(supportsColor(undefined)).toBe(false);
    });
  });

  describe('COLOR_PRESETS', () => {
    it('should have at least 10 color presets', () => {
      expect(COLOR_PRESETS.length).toBeGreaterThanOrEqual(10);
    });

    it('should have all required properties for each preset', () => {
      COLOR_PRESETS.forEach(preset => {
        expect(preset).toHaveProperty('name');
        expect(preset).toHaveProperty('hex');
        expect(preset).toHaveProperty('xy');
        expect(preset).toHaveProperty('icon');
        expect(preset.xy).toHaveProperty('x');
        expect(preset.xy).toHaveProperty('y');
      });
    });

    it('should have valid XY coordinates in 0-1 range', () => {
      COLOR_PRESETS.forEach(preset => {
        expect(preset.xy.x).toBeGreaterThanOrEqual(0);
        expect(preset.xy.x).toBeLessThanOrEqual(1);
        expect(preset.xy.y).toBeGreaterThanOrEqual(0);
        expect(preset.xy.y).toBeLessThanOrEqual(1);
      });
    });

    it('should have valid hex colors', () => {
      COLOR_PRESETS.forEach(preset => {
        expect(preset.hex).toMatch(/^#[0-9A-F]{6}$/i);
      });
    });

    it('should include common colors', () => {
      const colorNames = COLOR_PRESETS.map(p => p.name);
      expect(colorNames.some(name => name.includes('Rosso'))).toBe(true);
      expect(colorNames.some(name => name.includes('Verde'))).toBe(true);
      expect(colorNames.some(name => name.includes('Blu'))).toBe(true);
      expect(colorNames.some(name => name.includes('Giallo'))).toBe(true);
    });

    it('should have matching XY values for preset hex colors', () => {
      // Test a few presets to ensure hex and xy are consistent
      const redPreset = COLOR_PRESETS.find(p => p.name === 'Rosso');
      const greenPreset = COLOR_PRESETS.find(p => p.name === 'Verde');
      const bluePreset = COLOR_PRESETS.find(p => p.name === 'Blu');

      if (redPreset) {
        const calculatedXY = hexToXY(redPreset.hex);
        expect(calculatedXY.x).toBeCloseTo(redPreset.xy.x, 1);
        expect(calculatedXY.y).toBeCloseTo(redPreset.xy.y, 1);
      }

      if (greenPreset) {
        const calculatedXY = hexToXY(greenPreset.hex);
        expect(calculatedXY.x).toBeCloseTo(greenPreset.xy.x, 1);
        expect(calculatedXY.y).toBeCloseTo(greenPreset.xy.y, 1);
      }

      if (bluePreset) {
        const calculatedXY = hexToXY(bluePreset.hex);
        expect(calculatedXY.x).toBeCloseTo(bluePreset.xy.x, 1);
        expect(calculatedXY.y).toBeCloseTo(bluePreset.xy.y, 1);
      }
    });
  });
});
