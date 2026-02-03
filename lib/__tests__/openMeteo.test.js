/**
 * Tests for Open-Meteo API wrapper
 *
 * @see lib/openMeteo.js
 */

import { interpretWeatherCode, WMO_CODES, fetchWeatherForecast, fetchAirQuality } from '../openMeteo';

// Mock global fetch
global.fetch = jest.fn();

describe('openMeteo', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('interpretWeatherCode', () => {
    it('returns correct description for clear sky (code 0)', () => {
      const result = interpretWeatherCode(0);
      expect(result.description).toBe('Sereno');
      expect(result.icon).toBe('01');
    });

    it('returns correct description for thunderstorm (code 95)', () => {
      const result = interpretWeatherCode(95);
      expect(result.description).toBe('Temporale');
      expect(result.icon).toBe('11');
    });

    it('returns correct description for rain (code 63)', () => {
      const result = interpretWeatherCode(63);
      expect(result.description).toBe('Pioggia moderata');
      expect(result.icon).toBe('10');
    });

    it('returns Sconosciuto for unknown codes', () => {
      const result = interpretWeatherCode(999);
      expect(result.description).toBe('Sconosciuto');
      expect(result.icon).toBe('01');
    });

    it('handles all documented WMO codes', () => {
      const knownCodes = Object.keys(WMO_CODES).map(Number);
      knownCodes.forEach((code) => {
        const result = interpretWeatherCode(code);
        expect(result.description).toBeTruthy();
        expect(result.icon).toBeTruthy();
      });
    });
  });

  describe('fetchWeatherForecast', () => {
    it('constructs correct API URL with all required parameters', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ test: 'data' }),
      });

      await fetchWeatherForecast(45.4642, 9.19);

      expect(global.fetch).toHaveBeenCalledTimes(1);
      const calledUrl = global.fetch.mock.calls[0][0];

      // Verify base URL
      expect(calledUrl).toContain('https://api.open-meteo.com/v1/forecast');

      // Verify coordinates
      expect(calledUrl).toContain('latitude=45.4642');
      expect(calledUrl).toContain('longitude=9.1900');

      // Verify current parameters (including new surface_pressure)
      expect(calledUrl).toContain('temperature_2m');
      expect(calledUrl).toContain('apparent_temperature');
      expect(calledUrl).toContain('relative_humidity_2m');
      expect(calledUrl).toContain('wind_speed_10m');
      expect(calledUrl).toContain('weather_code');
      expect(calledUrl).toContain('surface_pressure');

      // Verify daily parameters (including new fields)
      expect(calledUrl).toContain('uv_index_max');
      expect(calledUrl).toContain('precipitation_probability_max');
      expect(calledUrl).toContain('relative_humidity_2m_max');
      expect(calledUrl).toContain('wind_speed_10m_max');
      expect(calledUrl).toContain('sunrise');
      expect(calledUrl).toContain('sunset');

      // Verify timezone
      expect(calledUrl).toContain('timezone=auto');
    });

    it('rounds coordinates to 4 decimal places', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({}),
      });

      await fetchWeatherForecast(45.46429999, 9.19000001);

      const calledUrl = global.fetch.mock.calls[0][0];
      expect(calledUrl).toContain('latitude=45.4643');
      expect(calledUrl).toContain('longitude=9.1900');
    });

    it('throws error for non-OK response', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      await expect(fetchWeatherForecast(45.4642, 9.19)).rejects.toThrow(
        'Open-Meteo API error: 500 Internal Server Error'
      );
    });

    it('returns JSON data on success', async () => {
      const mockData = {
        current: { temperature_2m: 15.5 },
        daily: { temperature_2m_max: [20, 21, 22] },
      };
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockData),
      });

      const result = await fetchWeatherForecast(45.4642, 9.19);
      expect(result).toEqual(mockData);
    });
  });

  describe('fetchAirQuality', () => {
    it('constructs correct API URL for air quality', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ current: { european_aqi: 25 } }),
      });

      await fetchAirQuality(45.4642, 9.19);

      expect(global.fetch).toHaveBeenCalledTimes(1);
      const calledUrl = global.fetch.mock.calls[0][0];

      // Verify base URL (air quality uses a different subdomain)
      expect(calledUrl).toContain('https://air-quality-api.open-meteo.com/v1/air-quality');

      // Verify coordinates
      expect(calledUrl).toContain('latitude=45.4642');
      expect(calledUrl).toContain('longitude=9.1900');

      // Verify current parameter
      expect(calledUrl).toContain('european_aqi');

      // Verify timezone
      expect(calledUrl).toContain('timezone=auto');
    });

    it('throws error for non-OK response', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 503,
        statusText: 'Service Unavailable',
      });

      await expect(fetchAirQuality(45.4642, 9.19)).rejects.toThrow(
        'Open-Meteo Air Quality API error: 503 Service Unavailable'
      );
    });

    it('returns JSON data with european_aqi on success', async () => {
      const mockData = { current: { european_aqi: 35 } };
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockData),
      });

      const result = await fetchAirQuality(45.4642, 9.19);
      expect(result).toEqual(mockData);
      expect(result.current.european_aqi).toBe(35);
    });
  });
});
