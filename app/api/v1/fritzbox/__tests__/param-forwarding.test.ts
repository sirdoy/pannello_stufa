/**
 * Parameterized Fritz!Box proxy routes must forward only whitelisted,
 * well-formed query params to the backend.
 */

jest.mock('@/lib/fritzbox');
jest.mock('@/lib/auth/session', () => ({
  authSession: { getSession: jest.fn() },
}));

import { fritzboxClient } from '@/lib/fritzbox';
import { authSession } from '@/lib/auth/session';
import { GET as wifiClients } from '../wifi/clients/route';
import { GET as dhcp } from '../network/dhcp/reservations/route';
import { GET as portForwarding } from '../network/port-forwarding/route';
import { GET as historyBandwidth } from '../history/bandwidth/route';
import { GET as historyDeviceEvents } from '../history/device-events/route';
import { GET as historyDevices } from '../history/devices/route';
import { GET as historyHourly } from '../history/bandwidth/hourly/route';
import { GET as historyDaily } from '../history/bandwidth/daily/route';
import { GET as historyAuto } from '../history/bandwidth/auto/route';
import { GET as historyDevicesDaily } from '../history/devices/daily/route';

const client = fritzboxClient as unknown as Record<string, jest.Mock>;

type Handler = typeof wifiClients;

interface Case {
  name: string;
  handler: Handler;
  path: string;
  method: string;
  queryA: string;
  queryB: string;
  /** Params expected to be forwarded for queryA */
  forwardedA: Record<string, string>;
}

const cases: Case[] = [
  { name: 'wifi/clients', handler: wifiClients, path: 'wifi/clients', method: 'getWifiClients',
    queryA: 'band=2.4GHz&limit=10&offset=0', queryB: 'band=5GHz&limit=10&offset=0',
    forwardedA: { band: '2.4GHz', limit: '10', offset: '0' } },
  { name: 'network/dhcp/reservations', handler: dhcp, path: 'network/dhcp/reservations', method: 'getDhcpReservations',
    queryA: 'limit=10&offset=0', queryB: 'limit=10&offset=10',
    forwardedA: { limit: '10', offset: '0' } },
  { name: 'network/port-forwarding', handler: portForwarding, path: 'network/port-forwarding', method: 'getPortForwarding',
    queryA: 'limit=10&offset=0', queryB: 'limit=10&offset=10',
    forwardedA: { limit: '10', offset: '0' } },
  { name: 'history/bandwidth', handler: historyBandwidth, path: 'history/bandwidth', method: 'getBandwidthHistoryRaw',
    queryA: 'hours=1&limit=100&offset=0', queryB: 'hours=24&limit=100&offset=0',
    forwardedA: { hours: '1', limit: '100', offset: '0' } },
  { name: 'history/device-events', handler: historyDeviceEvents, path: 'history/device-events', method: 'getDeviceEventsRaw',
    queryA: 'hours=24&mac=AA:BB:CC:DD:EE:FF&offset=0', queryB: 'hours=24&mac=11:22:33:44:55:66&offset=0',
    forwardedA: { hours: '24', offset: '0', mac: 'AA:BB:CC:DD:EE:FF' } },
  { name: 'history/devices', handler: historyDevices, path: 'history/devices', method: 'getDevicePresenceHistory',
    queryA: 'hours=168&limit=100&offset=0', queryB: 'hours=24&limit=100&offset=0',
    forwardedA: { hours: '168', limit: '100', offset: '0' } },
  { name: 'history/bandwidth/hourly', handler: historyHourly, path: 'history/bandwidth/hourly', method: 'getBandwidthHourly',
    queryA: 'days=7&limit=1000', queryB: 'days=30&limit=1000',
    forwardedA: { days: '7', limit: '1000' } },
  { name: 'history/bandwidth/daily', handler: historyDaily, path: 'history/bandwidth/daily', method: 'getBandwidthDaily',
    queryA: 'days=30&limit=1000', queryB: 'days=365&limit=1000',
    forwardedA: { days: '30', limit: '1000' } },
  { name: 'history/bandwidth/auto', handler: historyAuto, path: 'history/bandwidth/auto', method: 'getBandwidthAuto',
    queryA: 'days=7&limit=1000', queryB: 'days=90&limit=1000',
    forwardedA: { days: '7', limit: '1000' } },
  { name: 'history/devices/daily', handler: historyDevicesDaily, path: 'history/devices/daily', method: 'getDevicesDaily',
    queryA: 'days=30&limit=720', queryB: 'days=7&limit=168',
    forwardedA: { days: '30', limit: '720' } },
];

const call = (c: Case, query: string) =>
  c.handler(
    new Request(`http://localhost:3000/api/v1/fritzbox/${c.path}?${query}`) as unknown as Parameters<Handler>[0],
    {} as Parameters<Handler>[1]
  );

describe('Fritz!Box parameterized routes: param forwarding', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(authSession.getSession).mockResolvedValue({ user: { sub: 'auth0|123' } } as never);
    for (const c of cases) {
      client[c.method] = jest.fn().mockResolvedValue({ items: [], total_count: 0, limit: 100, offset: 0 });
    }
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  describe.each(cases)('$name', (c) => {
    it('forwards the validated params to the backend client', async () => {
      await call(c, c.queryA);

      const params = client[c.method]!.mock.calls[0]![0] as URLSearchParams;
      expect(Object.fromEntries(params.entries())).toEqual(c.forwardedA);
    });

    it('drops malformed params', async () => {
      await call(c, 'limit=abc&offset=-1&days=1e9&hours=../x&band=a/b&mac=zz');

      const params = client[c.method]!.mock.calls[0]![0] as URLSearchParams;
      expect(params.toString()).toBe('');
    });
  });
});
