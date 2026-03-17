/**
 * Tests for fritzboxClient
 *
 * Tests response transformation from raw HA proxy format to internal types.
 * haGet is mocked — no network calls, no JWT, no env var setup required.
 */

import { fritzboxClient } from '../fritzboxClient';
import { haGet } from '@/lib/haClient';

jest.mock('@/lib/haClient', () => ({
  haGet: jest.fn(),
}));

const mockHaGet = jest.mocked(haGet);

describe('fritzboxClient', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('ping()', () => {
    it('calls haGet with /health and 10s timeout', async () => {
      mockHaGet.mockResolvedValue({ status: 'ok', cache_age_seconds: 25, providers: { fritzbox: 'ok' } });
      await fritzboxClient.ping();
      expect(mockHaGet).toHaveBeenCalledWith('/health', { timeout: 10_000 });
    });
  });

  describe('debugRequest()', () => {
    it('passes endpoint directly to haGet', async () => {
      mockHaGet.mockResolvedValue({ some: 'data' });
      const result = await fritzboxClient.debugRequest('/api/v1/custom');
      expect(mockHaGet).toHaveBeenCalledWith('/api/v1/custom');
      expect(result).toEqual({ some: 'data' });
    });
  });

  describe('getDevices()', () => {
    it('transforms raw device response (status->active, mac->id)', async () => {
      mockHaGet.mockResolvedValue({
        devices: [
          { ip: '192.168.178.25', name: 'iPhone', mac: 'AA:BB:CC:DD:EE:FF', status: 1 },
          { ip: '192.168.178.30', name: 'Printer', mac: '11:22:33:44:55:66', status: 0 },
        ],
        is_stale: false,
        fetched_at: '2026-02-13T14:00:00Z',
      });

      const result = await fritzboxClient.getDevices();

      expect(mockHaGet).toHaveBeenCalledWith('/api/v1/devices');
      expect(result).toEqual([
        { id: 'AA:BB:CC:DD:EE:FF', name: 'iPhone', ip: '192.168.178.25', mac: 'AA:BB:CC:DD:EE:FF', active: true },
        { id: '11:22:33:44:55:66', name: 'Printer', ip: '192.168.178.30', mac: '11:22:33:44:55:66', active: false },
      ]);
    });

    it('returns empty array when devices is empty', async () => {
      mockHaGet.mockResolvedValue({ devices: [], is_stale: false, fetched_at: '2026-02-13T14:00:00Z' });
      const result = await fritzboxClient.getDevices();
      expect(result).toEqual([]);
    });
  });

  describe('getBandwidth()', () => {
    it('converts bps to Mbps', async () => {
      mockHaGet.mockResolvedValue({
        upstream_bps: 50_000_000,
        downstream_bps: 250_000_000,
        is_stale: false,
        fetched_at: '2026-02-13T14:00:00Z',
      });

      const result = await fritzboxClient.getBandwidth();

      expect(mockHaGet).toHaveBeenCalledWith('/api/v1/bandwidth');
      expect(result).toEqual({
        download: 250,
        upload: 50,
        timestamp: new Date('2026-02-13T14:00:00Z').getTime(),
      });
    });
  });

  describe('getWanStatus()', () => {
    it('transforms WAN response fields', async () => {
      mockHaGet.mockResolvedValue({
        external_ip: '93.219.123.45',
        is_connected: true,
        is_linked: true,
        uptime: 345678,
        max_upstream_bps: 50_000_000,
        max_downstream_bps: 250_000_000,
        is_stale: false,
        fetched_at: '2026-02-13T14:00:00Z',
      });

      const result = await fritzboxClient.getWanStatus();

      expect(mockHaGet).toHaveBeenCalledWith('/api/v1/wan');
      expect(result).toEqual({
        connected: true,
        uptime: 345678,
        externalIp: '93.219.123.45',
        linkSpeed: 250,
        timestamp: new Date('2026-02-13T14:00:00Z').getTime(),
      });
    });
  });

  describe('getBandwidthHistory()', () => {
    it('converts timestamps to ms and rates to Mbps, sorted ascending', async () => {
      mockHaGet.mockResolvedValue({
        records: [
          { timestamp: 1707840000, bytes_sent: 0, bytes_received: 0, upstream_rate: 10_000_000, downstream_rate: 100_000_000 },
          { timestamp: 1707836400, bytes_sent: 0, bytes_received: 0, upstream_rate: 5_000_000, downstream_rate: 50_000_000 },
        ],
        hours_requested: 24,
        record_count: 2,
      });

      const result = await fritzboxClient.getBandwidthHistory(24);

      expect(mockHaGet).toHaveBeenCalledWith('/api/v1/history/bandwidth?hours=24');
      expect(result).toEqual([
        { time: 1707836400000, download: 50, upload: 5 },
        { time: 1707840000000, download: 100, upload: 10 },
      ]);
    });
  });

  describe('error propagation', () => {
    it('propagates ApiError from haGet unchanged', async () => {
      const { ApiError, ERROR_CODES, HTTP_STATUS } = await import('@/lib/core/apiErrors');
      const error = new ApiError(ERROR_CODES.SERVICE_UNAVAILABLE, 'HA proxy unavailable', HTTP_STATUS.SERVICE_UNAVAILABLE);
      mockHaGet.mockRejectedValue(error);

      await expect(fritzboxClient.getDevices()).rejects.toBe(error);
    });
  });
});
