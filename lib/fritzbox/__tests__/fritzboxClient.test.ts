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
    it('transforms paginated device response (status->active, mac->id)', async () => {
      mockHaGet.mockResolvedValue({
        items: [
          { ip: '192.168.178.25', name: 'iPhone', mac: 'AA:BB:CC:DD:EE:FF', status: 1, provider_type: 'fritzbox' },
          { ip: '192.168.178.30', name: 'Printer', mac: '11:22:33:44:55:66', status: 0, provider_type: 'fritzbox' },
        ],
        total_count: 2,
        limit: 1000,
        offset: 0,
      });

      const result = await fritzboxClient.getDevices();

      expect(mockHaGet).toHaveBeenCalledWith('/api/v1/fritzbox/devices?limit=1000');
      expect(result).toEqual([
        { id: 'AA:BB:CC:DD:EE:FF', name: 'iPhone', ip: '192.168.178.25', mac: 'AA:BB:CC:DD:EE:FF', active: true },
        { id: '11:22:33:44:55:66', name: 'Printer', ip: '192.168.178.30', mac: '11:22:33:44:55:66', active: false },
      ]);
    });

    it('returns empty array when items is empty', async () => {
      mockHaGet.mockResolvedValue({ items: [], total_count: 0, limit: 1000, offset: 0 });
      const result = await fritzboxClient.getDevices();
      expect(result).toEqual([]);
    });
  });

  describe('getBandwidth()', () => {
    it('converts bps to Mbps', async () => {
      mockHaGet.mockResolvedValue({
        upstream_bps: 50_000_000,
        downstream_bps: 250_000_000,
        bytes_sent: 45678901234,
        bytes_received: 123456789012,
        is_stale: false,
        fetched_at: '2026-02-13T14:00:00Z',
      });

      const result = await fritzboxClient.getBandwidth();

      expect(mockHaGet).toHaveBeenCalledWith('/api/v1/fritzbox/bandwidth');
      expect(result).toEqual({
        download: 250,
        upload: 50,
        timestamp: new Date('2026-02-13T14:00:00Z').getTime(),
      });
    });

    it('uses Date.now() when fetched_at is null', async () => {
      const now = Date.now();
      mockHaGet.mockResolvedValue({
        upstream_bps: 0,
        downstream_bps: 0,
        bytes_sent: 0,
        bytes_received: 0,
        is_stale: true,
        fetched_at: null,
      });

      const result = await fritzboxClient.getBandwidth();

      expect(result.timestamp).toBeGreaterThanOrEqual(now);
    });

    it('handles non-standard ISO 8601 with duplicate timezone (offset+Z)', async () => {
      mockHaGet.mockResolvedValue({
        upstream_bps: 1_000_000,
        downstream_bps: 10_000_000,
        bytes_sent: 0,
        bytes_received: 0,
        is_stale: false,
        fetched_at: '2026-03-18T09:01:49.196496+00:00Z',
      });

      const result = await fritzboxClient.getBandwidth();

      expect(result.timestamp).toBe(new Date('2026-03-18T09:01:49.196496+00:00').getTime());
      expect(result.download).toBe(10);
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

      expect(mockHaGet).toHaveBeenCalledWith('/api/v1/fritzbox/wan');
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
    it('converts paginated timestamps to ms and rates to Mbps, sorted ascending', async () => {
      mockHaGet.mockResolvedValue({
        items: [
          { timestamp: 1707840000, bytes_sent: 0, bytes_received: 0, upstream_rate: 10_000_000, downstream_rate: 100_000_000, latency_ms: null, connection_uptime: null, external_ip: null, connection_type: null },
          { timestamp: 1707836400, bytes_sent: 0, bytes_received: 0, upstream_rate: 5_000_000, downstream_rate: 50_000_000, latency_ms: null, connection_uptime: null, external_ip: null, connection_type: null },
        ],
        total_count: 2,
        limit: 1000,
        offset: 0,
      });

      const result = await fritzboxClient.getBandwidthHistory(24);

      expect(mockHaGet).toHaveBeenCalledWith('/api/v1/fritzbox/history/bandwidth?hours=24&limit=1000');
      expect(result).toEqual([
        { time: 1707836400000, download: 50, upload: 5 },
        { time: 1707840000000, download: 100, upload: 10 },
      ]);
    });

    it('returns empty array when no records', async () => {
      mockHaGet.mockResolvedValue({ items: [], total_count: 0, limit: 1000, offset: 0 });
      const result = await fritzboxClient.getBandwidthHistory(1);
      expect(result).toEqual([]);
    });
  });

  describe('getSystemInfo()', () => {
    it('calls haGet with /api/v1/fritzbox/system and returns raw response', async () => {
      const mockResponse = {
        model: 'FRITZ!Box 7590 AX',
        firmware_version: '8.20',
        update_available: '',
        device_uptime_seconds: 432000,
        device_uptime_formatted: '5 days, 0:00:00',
        is_stale: false,
        fetched_at: '2026-02-16T12:34:56Z',
      };
      mockHaGet.mockResolvedValue(mockResponse);

      const result = await fritzboxClient.getSystemInfo();

      expect(mockHaGet).toHaveBeenCalledWith('/api/v1/fritzbox/system');
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getWifiClients()', () => {
    it('calls haGet without query string when no params provided', async () => {
      const mockResponse = { items: [], total_count: 0, limit: 50, offset: 0 };
      mockHaGet.mockResolvedValue(mockResponse);

      const result = await fritzboxClient.getWifiClients();

      expect(mockHaGet).toHaveBeenCalledWith('/api/v1/fritzbox/wifi/clients');
      expect(result).toEqual(mockResponse);
    });

    it('forwards band/limit params as query string', async () => {
      const mockResponse = { items: [], total_count: 0, limit: 50, offset: 0 };
      mockHaGet.mockResolvedValue(mockResponse);

      const params = new URLSearchParams({ band: '5GHz', limit: '50' });
      await fritzboxClient.getWifiClients(params);

      expect(mockHaGet).toHaveBeenCalledWith('/api/v1/fritzbox/wifi/clients?band=5GHz&limit=50');
    });
  });

  describe('getWifiNetworks()', () => {
    it('calls haGet with /api/v1/fritzbox/wifi/networks and returns raw response', async () => {
      const mockResponse = {
        networks: [
          { service: 1, band: '2.4GHz', ssid: 'MyNetwork', channel: 6, possible_channels: '1,6,11', is_enabled: true, beacon_type: 'OWETransition' },
        ],
        is_stale: false,
        fetched_at: '2026-02-16T12:34:56Z',
      };
      mockHaGet.mockResolvedValue(mockResponse);

      const result = await fritzboxClient.getWifiNetworks();

      expect(mockHaGet).toHaveBeenCalledWith('/api/v1/fritzbox/wifi/networks');
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getDhcpReservations()', () => {
    it('calls haGet without query string when no params provided', async () => {
      const mockResponse = { items: [], total_count: 0, limit: 50, offset: 0 };
      mockHaGet.mockResolvedValue(mockResponse);

      await fritzboxClient.getDhcpReservations();

      expect(mockHaGet).toHaveBeenCalledWith('/api/v1/fritzbox/network/dhcp/reservations');
    });

    it('forwards limit/offset params as query string', async () => {
      const mockResponse = { items: [], total_count: 0, limit: 10, offset: 20 };
      mockHaGet.mockResolvedValue(mockResponse);

      const params = new URLSearchParams({ limit: '10', offset: '20' });
      await fritzboxClient.getDhcpReservations(params);

      expect(mockHaGet).toHaveBeenCalledWith('/api/v1/fritzbox/network/dhcp/reservations?limit=10&offset=20');
    });
  });

  describe('getPortForwarding()', () => {
    it('calls haGet without query string when no params provided', async () => {
      const mockResponse = { items: [], total_count: 0, limit: 50, offset: 0 };
      mockHaGet.mockResolvedValue(mockResponse);

      await fritzboxClient.getPortForwarding();

      expect(mockHaGet).toHaveBeenCalledWith('/api/v1/fritzbox/network/port-forwarding');
    });

    it('forwards limit/offset params as query string', async () => {
      const mockResponse = { items: [], total_count: 0, limit: 10, offset: 0 };
      mockHaGet.mockResolvedValue(mockResponse);

      const params = new URLSearchParams({ limit: '10', offset: '0' });
      await fritzboxClient.getPortForwarding(params);

      expect(mockHaGet).toHaveBeenCalledWith('/api/v1/fritzbox/network/port-forwarding?limit=10&offset=0');
    });
  });

  describe('getUpnpStatus()', () => {
    it('calls haGet with /api/v1/fritzbox/network/upnp and returns raw response', async () => {
      const mockResponse = {
        enabled: true,
        upnp_ports: [
          { external_port: 8080, internal_port: 80, protocol: 'TCP', internal_client: '192.168.178.50', enabled: true, description: 'Web server', lease_duration: 0 },
        ],
        is_stale: false,
        fetched_at: '2026-02-16T12:34:56Z',
      };
      mockHaGet.mockResolvedValue(mockResponse);

      const result = await fritzboxClient.getUpnpStatus();

      expect(mockHaGet).toHaveBeenCalledWith('/api/v1/fritzbox/network/upnp');
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getMeshTopology()', () => {
    it('calls haGet with /api/v1/fritzbox/network/mesh and returns response with nullable link fields', async () => {
      const mockResponse = {
        schema_version: null,
        node_count: 2,
        link_count: 1,
        nodes: [
          { uid: 'node-1', name: 'FRITZ!Box 7590 AX', model: '7590 AX', mac: 'AA:BB:CC:DD:EE:FF', vendor: 'AVM', is_meshed: true, device_category: 'router' },
          { uid: 'node-2', name: 'FRITZ!Repeater 1200', model: '1200', mac: '11:22:33:44:55:66', vendor: 'AVM', is_meshed: true, device_category: 'repeater' },
        ],
        links: [
          { source_uid: 'node-1', source_name: 'FRITZ!Box 7590 AX', target_uid: 'node-2', target_name: 'FRITZ!Repeater 1200', type: null, state: null, cur_rx_kbps: null, cur_tx_kbps: null, max_rx_kbps: null, max_tx_kbps: null },
        ],
        is_stale: false,
        fetched_at: '2026-02-16T12:34:56Z',
      };
      mockHaGet.mockResolvedValue(mockResponse);

      const result = await fritzboxClient.getMeshTopology();

      expect(mockHaGet).toHaveBeenCalledWith('/api/v1/fritzbox/network/mesh');
      expect(result).toEqual(mockResponse);
      // Verify nullable link fields are preserved
      expect(result.links[0]?.type).toBeNull();
      expect(result.links[0]?.cur_rx_kbps).toBeNull();
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
