/**
 * Geofencing Service Tests
 */

import { isGeolocationSupported, calculateDistance } from '../geofencing';

describe('geofencing', () => {
  describe('isGeolocationSupported', () => {
    it('returns boolean', () => {
      const result = isGeolocationSupported();
      expect(typeof result).toBe('boolean');
    });

    it('returns true when geolocation exists', () => {
      // Mock navigator.geolocation
      const originalGeolocation = navigator.geolocation;
      Object.defineProperty(navigator, 'geolocation', {
        value: { getCurrentPosition: jest.fn() },
        writable: true,
        configurable: true,
      });

      const result = isGeolocationSupported();
      expect(result).toBe(true);

      // Restore
      Object.defineProperty(navigator, 'geolocation', {
        value: originalGeolocation,
        writable: true,
        configurable: true,
      });
    });
  });

  describe('calculateDistance', () => {
    it('returns 0 for same coordinates', () => {
      const distance = calculateDistance(45.0, 9.0, 45.0, 9.0);
      expect(distance).toBe(0);
    });

    it('calculates distance between two points correctly', () => {
      // Milan to Rome is approximately 477 km
      const milan = { lat: 45.4642, lon: 9.19 };
      const rome = { lat: 41.9028, lon: 12.4964 };

      const distance = calculateDistance(milan.lat, milan.lon, rome.lat, rome.lon);

      // Should be approximately 477 km (477000 m) ± 5%
      expect(distance).toBeGreaterThan(450000);
      expect(distance).toBeLessThan(500000);
    });

    it('calculates short distance correctly', () => {
      // Two points ~100m apart
      const point1 = { lat: 45.0, lon: 9.0 };
      const point2 = { lat: 45.0009, lon: 9.0 }; // ~100m north

      const distance = calculateDistance(
        point1.lat,
        point1.lon,
        point2.lat,
        point2.lon
      );

      // Should be approximately 100m ± 10%
      expect(distance).toBeGreaterThan(90);
      expect(distance).toBeLessThan(110);
    });

    it('is symmetric', () => {
      const lat1 = 45.0,
        lon1 = 9.0;
      const lat2 = 46.0,
        lon2 = 10.0;

      const distance1 = calculateDistance(lat1, lon1, lat2, lon2);
      const distance2 = calculateDistance(lat2, lon2, lat1, lon1);

      expect(distance1).toBeCloseTo(distance2, 5);
    });
  });
});
