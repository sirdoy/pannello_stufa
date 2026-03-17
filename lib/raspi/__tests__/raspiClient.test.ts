/**
 * Tests for raspiClient
 *
 * Tests that each method calls haGet with the correct endpoint path and returns typed responses.
 * haGet is mocked — no network calls, no env var setup required.
 */

import { raspiClient } from '../raspiClient';
import { haGet } from '@/lib/haClient';

jest.mock('@/lib/haClient', () => ({
  haGet: jest.fn(),
}));

const mockHaGet = jest.mocked(haGet);

describe('raspiClient', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getHealth()', () => {
    it('calls haGet with /api/v1/raspi/health and returns typed RaspiHealthResponse', async () => {
      const mockResponse = { status: 'ok' as const, data_freshness: 'LIVE' as const };
      mockHaGet.mockResolvedValue(mockResponse);

      const result = await raspiClient.getHealth();

      expect(mockHaGet).toHaveBeenCalledWith('/api/v1/raspi/health');
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getCpu()', () => {
    it('calls haGet with /api/v1/raspi/cpu and returns typed CpuResponse', async () => {
      const mockResponse = { cpu_percent: 23.5, data_freshness: 'LIVE' as const };
      mockHaGet.mockResolvedValue(mockResponse);

      const result = await raspiClient.getCpu();

      expect(mockHaGet).toHaveBeenCalledWith('/api/v1/raspi/cpu');
      expect(result.cpu_percent).toBe(23.5);
    });
  });

  describe('getMemory()', () => {
    it('calls haGet with /api/v1/raspi/memory and returns typed MemoryResponse', async () => {
      const mockResponse = {
        used_bytes: 1073741824,
        total_bytes: 8589934592,
        percent: 12.5,
        data_freshness: 'LIVE' as const,
      };
      mockHaGet.mockResolvedValue(mockResponse);

      const result = await raspiClient.getMemory();

      expect(mockHaGet).toHaveBeenCalledWith('/api/v1/raspi/memory');
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getDisk()', () => {
    it('calls haGet with /api/v1/raspi/disk and returns typed DiskResponse', async () => {
      const mockResponse = {
        used_bytes: 16106127360,
        total_bytes: 31268536320,
        percent: 51.5,
        mount_point: '/' as const,
        data_freshness: 'LIVE' as const,
      };
      mockHaGet.mockResolvedValue(mockResponse);

      const result = await raspiClient.getDisk();

      expect(mockHaGet).toHaveBeenCalledWith('/api/v1/raspi/disk');
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getSystem()', () => {
    it('calls haGet with /api/v1/raspi/system and returns typed SystemResponse', async () => {
      const mockResponse = {
        cpu_temperature: 52.3,
        uptime_seconds: 345600,
        load_avg_1: 0.42,
        load_avg_5: 0.38,
        load_avg_15: 0.35,
        process_count: 142,
        network: {
          bytes_sent: 1073741824,
          bytes_recv: 5368709120,
          interface: 'wlan0',
        },
        data_freshness: 'LIVE' as const,
      };
      mockHaGet.mockResolvedValue(mockResponse);

      const result = await raspiClient.getSystem();

      expect(mockHaGet).toHaveBeenCalledWith('/api/v1/raspi/system');
      expect(result).toEqual(mockResponse);
    });
  });

  describe('error propagation', () => {
    it('propagates ApiError from haGet unchanged (same reference)', async () => {
      const { ApiError, ERROR_CODES, HTTP_STATUS } = await import('@/lib/core/apiErrors');
      const apiError = new ApiError(
        ERROR_CODES.SERVICE_UNAVAILABLE,
        'HA proxy unavailable',
        HTTP_STATUS.SERVICE_UNAVAILABLE
      );
      mockHaGet.mockRejectedValue(apiError);

      await expect(raspiClient.getHealth()).rejects.toBe(apiError);
    });
  });
});
