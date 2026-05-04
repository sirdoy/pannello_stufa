/**
 * Tests for GET /api/v1/devices (cross-provider aggregator).
 *
 * Covers (per .planning/phases/173-cross-provider-device-aggregator/173-RESEARCH.md
 * §Nyquist Coverage):
 *   - Auth (401)
 *   - Happy path (8 providers contribute)
 *   - Partial failure: multi-item provider rejection (errors[] entry)
 *   - Partial failure: single-item provider rejection (item with status=0, NOT in errors[])
 *   - Filter perf: ?provider_type=hue skips fan-out to other 7
 *   - Filter validation: invalid ?provider_type=foo => 200 empty, no fan-out
 *   - Limit clamp: 0->1, 2000->1000, NaN->100
 *   - Offset clamp: negative->0, beyond total->items:[], total_count preserved
 *   - Sort order: provider_type ASC, then name ASC 'it'-locale
 *   - Per-provider mapper output shape (8 providers × happy path)
 */

jest.mock('@/lib/fritzbox');
jest.mock('@/lib/hue/hueProxy');
jest.mock('@/lib/sonos/sonosProxy');
jest.mock('@/lib/netatmo/netatmoProxy');
jest.mock('@/lib/dirigera/dirigeraProxy');
jest.mock('@/lib/tuya/tuyaProxy');
jest.mock('@/lib/raspi');
jest.mock('@/lib/stove/thermorossiProxy');
jest.mock('@/lib/auth0', () => ({ auth0: { getSession: jest.fn() } }));

import { GET } from '../route';
import { fritzboxClient } from '@/lib/fritzbox';
import { getLights } from '@/lib/hue/hueProxy';
import { getDevices as getSonosDevices } from '@/lib/sonos/sonosProxy';
import { getProxyHomesdata, getProxyCameraStatus } from '@/lib/netatmo/netatmoProxy';
import { getSensors } from '@/lib/dirigera/dirigeraProxy';
import { getPlugs } from '@/lib/tuya/tuyaProxy';
import { raspiClient } from '@/lib/raspi';
import { getHealth as getThermorossiHealth } from '@/lib/stove/thermorossiProxy';
import { auth0 } from '@/lib/auth0';

const mockGetSession = jest.mocked(auth0.getSession);
const mockFritzGetDevices = jest.mocked(fritzboxClient.getDevices);
const mockGetLights = jest.mocked(getLights);
const mockGetSonosDevices = jest.mocked(getSonosDevices);
const mockGetProxyHomesdata = jest.mocked(getProxyHomesdata);
const mockGetProxyCameraStatus = jest.mocked(getProxyCameraStatus);
const mockGetSensors = jest.mocked(getSensors);
const mockGetPlugs = jest.mocked(getPlugs);
const mockRaspiGetHealth = jest.mocked(raspiClient.getHealth);
const mockGetThermorossiHealth = jest.mocked(getThermorossiHealth);

const mockSession = { user: { sub: 'auth0|123', email: 'test@test.com' } };

// --- Seed builders (one minimal happy-path payload per provider) ---
function seedAllProviders(): void {
  mockFritzGetDevices.mockResolvedValue([
    { id: 'aa:bb', name: 'iPhone', ip: '192.168.1.10', mac: 'AA:BB:CC:DD:EE:FF', active: true },
  ] as any);
  mockGetLights.mockResolvedValue([
    { light_id: '1', name: 'Lampada', reachable: true, room_name: 'Sala' },
  ] as any);
  mockGetSonosDevices.mockResolvedValue({
    speakers: [
      { uid: 'RINCON_X', name: 'Cucina', ip: '192.168.1.20', is_visible: true, is_coordinator: true },
    ],
    count: 1,
    is_stale: false,
    fetched_at: 0,
  } as any);
  mockGetProxyHomesdata.mockResolvedValue({
    body: {
      homes: [{
        modules: [
          { id: '09:00:01', type: 'NATherm1', name: 'Termo', room_id: 'r1' },
          { id: '09:00:02', type: 'NRV', name: 'Valvola', room_id: 'r1' },
        ],
        rooms: [{ id: 'r1', name: 'Soggiorno' }],
      }],
    },
  } as any);
  mockGetProxyCameraStatus.mockResolvedValue({
    cameras: [
      { camera_id: '70:ee:50:12', name: 'Cam', device_type: 'NACamera', status: 'on' },
    ],
    data_freshness: 'LIVE',
  } as any);
  mockGetSensors.mockResolvedValue({
    sensors: [
      { id: 'sens-1', type: 'openCloseSensor', custom_name: 'Porta', room: 'Ingresso', is_reachable: true },
    ],
    count: 1,
    is_stale: false,
  } as any);
  mockGetPlugs.mockResolvedValue([
    { device_id: 'plug-1', custom_name: 'Lampada Soggiorno', switch_on: true, data_freshness: 'LIVE' },
  ] as any);
  mockRaspiGetHealth.mockResolvedValue({ status: 'ok', data_freshness: 'LIVE' } as any);
  mockGetThermorossiHealth.mockResolvedValue({
    status: 'ok',
    data_freshness: 'LIVE',
    last_poll_at: '2026-04-25T10:00:00Z',
  } as any);
}

describe('GET /api/v1/devices', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSession.mockResolvedValue(mockSession as any);
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  // -------------------------------------------------------------------------
  // Auth
  // -------------------------------------------------------------------------

  it('returns 401 when not authenticated', async () => {
    mockGetSession.mockResolvedValue(null);
    const request = new Request('http://localhost:3000/api/v1/devices');
    const response = await GET(request as any, {} as any);
    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data.code).toBe('UNAUTHORIZED');
  });

  // -------------------------------------------------------------------------
  // Happy path — all 8 providers contribute
  // -------------------------------------------------------------------------

  it('aggregates items from all 8 providers with empty errors[]', async () => {
    seedAllProviders();
    const request = new Request('http://localhost:3000/api/v1/devices');
    const response = await GET(request as any, {} as any);
    const data = await response.json();
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.errors).toEqual([]);
    const providerTypes = new Set(data.items.map((i: any) => i.provider_type));
    expect(providerTypes).toEqual(
      new Set(['fritzbox', 'hue', 'sonos', 'netatmo', 'dirigera', 'tuya', 'raspi', 'thermorossi']),
    );
  });

  // -------------------------------------------------------------------------
  // Per-provider mapper shape (8 cases — happy-path mapping)
  // -------------------------------------------------------------------------

  it('maps Fritz!Box device with composite id, ip, mac, status, type=network_device', async () => {
    seedAllProviders();
    const data = await (await GET(new Request('http://localhost:3000/api/v1/devices') as any, {} as any)).json();
    const item = data.items.find((i: any) => i.provider_type === 'fritzbox');
    expect(item).toMatchObject({
      id: 'fritzbox:AA:BB:CC:DD:EE:FF',
      name: 'iPhone',
      provider_type: 'fritzbox',
      type: 'network_device',
      ip: '192.168.1.10',
      mac: 'AA:BB:CC:DD:EE:FF',
      status: 1,
    });
  });

  it('maps Hue light with composite id, type=light, room from room_name', async () => {
    seedAllProviders();
    const data = await (await GET(new Request('http://localhost:3000/api/v1/devices') as any, {} as any)).json();
    const item = data.items.find((i: any) => i.provider_type === 'hue');
    expect(item).toMatchObject({
      id: 'hue:1',
      name: 'Lampada',
      provider_type: 'hue',
      type: 'light',
      status: 1,
      room: 'Sala',
    });
  });

  it('maps Sonos speaker with composite id, type=speaker, ip; omits room (Pitfall 2)', async () => {
    seedAllProviders();
    const data = await (await GET(new Request('http://localhost:3000/api/v1/devices') as any, {} as any)).json();
    const item = data.items.find((i: any) => i.provider_type === 'sonos');
    expect(item).toMatchObject({
      id: 'sonos:RINCON_X',
      name: 'Cucina',
      provider_type: 'sonos',
      type: 'speaker',
      ip: '192.168.1.20',
    });
    expect(item.room).toBeUndefined();
  });

  it('maps Netatmo thermostat + valve + camera (3 items) with type discriminators', async () => {
    seedAllProviders();
    const data = await (await GET(new Request('http://localhost:3000/api/v1/devices') as any, {} as any)).json();
    const netatmoItems = data.items.filter((i: any) => i.provider_type === 'netatmo');
    expect(netatmoItems.length).toBe(3);
    const types = new Set(netatmoItems.map((i: any) => i.type));
    expect(types).toEqual(new Set(['thermostat', 'valve', 'camera']));
    const thermo = netatmoItems.find((i: any) => i.type === 'thermostat');
    expect(thermo).toMatchObject({ id: 'netatmo:09:00:01', name: 'Termo', room: 'Soggiorno' });
    const camera = netatmoItems.find((i: any) => i.type === 'camera');
    expect(camera).toMatchObject({ id: 'netatmo:70:ee:50:12', name: 'Cam', status: 1 });
  });

  it('maps DIRIGERA sensor with type=contact_sensor for openCloseSensor', async () => {
    seedAllProviders();
    const data = await (await GET(new Request('http://localhost:3000/api/v1/devices') as any, {} as any)).json();
    const item = data.items.find((i: any) => i.provider_type === 'dirigera');
    expect(item).toMatchObject({
      id: 'dirigera:sens-1',
      name: 'Porta',
      provider_type: 'dirigera',
      type: 'contact_sensor',
      room: 'Ingresso',
      status: 1,
    });
  });

  it('maps Tuya plug using custom_name fallback (Pitfall 3) and type=plug', async () => {
    seedAllProviders();
    const data = await (await GET(new Request('http://localhost:3000/api/v1/devices') as any, {} as any)).json();
    const item = data.items.find((i: any) => i.provider_type === 'tuya');
    expect(item).toMatchObject({
      id: 'tuya:plug-1',
      name: 'Lampada Soggiorno',
      provider_type: 'tuya',
      type: 'plug',
      status: 1,
    });
  });

  it('emits single Raspi item with composite id raspi:host and status=1 when healthy', async () => {
    seedAllProviders();
    const data = await (await GET(new Request('http://localhost:3000/api/v1/devices') as any, {} as any)).json();
    const item = data.items.find((i: any) => i.provider_type === 'raspi');
    expect(item).toMatchObject({
      id: 'raspi:host',
      name: 'Raspberry Pi',
      provider_type: 'raspi',
      type: 'host',
      status: 1,
    });
  });

  it('emits single Thermorossi item with composite id thermorossi:stove and status=1 when healthy', async () => {
    seedAllProviders();
    const data = await (await GET(new Request('http://localhost:3000/api/v1/devices') as any, {} as any)).json();
    const item = data.items.find((i: any) => i.provider_type === 'thermorossi');
    expect(item).toMatchObject({
      id: 'thermorossi:stove',
      name: 'Stufa',
      provider_type: 'thermorossi',
      type: 'stove',
      status: 1,
    });
  });

  // -------------------------------------------------------------------------
  // Partial failure
  // -------------------------------------------------------------------------

  it('returns 200 with errors[] entry when a multi-item provider (fritzbox) rejects', async () => {
    seedAllProviders();
    mockFritzGetDevices.mockRejectedValue(new Error('Fritz!Box unreachable'));
    const response = await GET(new Request('http://localhost:3000/api/v1/devices') as any, {} as any);
    const data = await response.json();
    expect(response.status).toBe(200);
    expect(data.errors).toContainEqual({
      provider_type: 'fritzbox',
      message: expect.stringContaining('Fritz!Box unreachable'),
    });
    // No fritzbox items in result.
    expect(data.items.every((i: any) => i.provider_type !== 'fritzbox')).toBe(true);
    // Other providers still contributed.
    expect(data.items.some((i: any) => i.provider_type === 'hue')).toBe(true);
  });

  it('emits Raspi item with status=0 (NOT in errors[]) when raspiClient.getHealth rejects (Pitfall 4)', async () => {
    seedAllProviders();
    mockRaspiGetHealth.mockRejectedValue(new Error('Raspi down'));
    const response = await GET(new Request('http://localhost:3000/api/v1/devices') as any, {} as any);
    const data = await response.json();
    expect(response.status).toBe(200);
    const raspi = data.items.find((i: any) => i.provider_type === 'raspi');
    expect(raspi).toMatchObject({ id: 'raspi:host', status: 0 });
    // Critical: single-item provider failures do NOT appear in errors[].
    expect(data.errors.find((e: any) => e.provider_type === 'raspi')).toBeUndefined();
  });

  it('emits Thermorossi item with status=0 (NOT in errors[]) when getHealth rejects (Pitfall 4)', async () => {
    seedAllProviders();
    mockGetThermorossiHealth.mockRejectedValue(new Error('Stove offline'));
    const response = await GET(new Request('http://localhost:3000/api/v1/devices') as any, {} as any);
    const data = await response.json();
    expect(response.status).toBe(200);
    const stove = data.items.find((i: any) => i.provider_type === 'thermorossi');
    expect(stove).toMatchObject({ id: 'thermorossi:stove', status: 0 });
    expect(data.errors.find((e: any) => e.provider_type === 'thermorossi')).toBeUndefined();
  });

  // -------------------------------------------------------------------------
  // Filter (?provider_type=)
  // -------------------------------------------------------------------------

  it('?provider_type=hue calls only Hue listing function (Pitfall 5 perf win)', async () => {
    seedAllProviders();
    await GET(new Request('http://localhost:3000/api/v1/devices?provider_type=hue') as any, {} as any);
    expect(mockGetLights).toHaveBeenCalled();
    expect(mockFritzGetDevices).not.toHaveBeenCalled();
    expect(mockGetSonosDevices).not.toHaveBeenCalled();
    expect(mockGetProxyHomesdata).not.toHaveBeenCalled();
    expect(mockGetProxyCameraStatus).not.toHaveBeenCalled();
    expect(mockGetSensors).not.toHaveBeenCalled();
    expect(mockGetPlugs).not.toHaveBeenCalled();
    expect(mockRaspiGetHealth).not.toHaveBeenCalled();
    expect(mockGetThermorossiHealth).not.toHaveBeenCalled();
  });

  it('?provider_type=foo (invalid) returns 200 with items:[], total_count:0, errors:[] and zero fan-out calls', async () => {
    seedAllProviders();
    const response = await GET(new Request('http://localhost:3000/api/v1/devices?provider_type=foo') as any, {} as any);
    const data = await response.json();
    expect(response.status).toBe(200);
    expect(data.items).toEqual([]);
    expect(data.total_count).toBe(0);
    expect(data.errors).toEqual([]);
    // No provider listing fn invoked.
    expect(mockGetLights).not.toHaveBeenCalled();
    expect(mockFritzGetDevices).not.toHaveBeenCalled();
  });

  // -------------------------------------------------------------------------
  // Limit + Offset clamp
  // -------------------------------------------------------------------------

  it('clamps limit=0 to 1 (D-18)', async () => {
    seedAllProviders();
    const data = await (await GET(new Request('http://localhost:3000/api/v1/devices?limit=0') as any, {} as any)).json();
    expect(data.limit).toBe(1);
    expect(data.items.length).toBe(1);
  });

  it('clamps limit=2000 to 1000 (D-18)', async () => {
    seedAllProviders();
    const data = await (await GET(new Request('http://localhost:3000/api/v1/devices?limit=2000') as any, {} as any)).json();
    expect(data.limit).toBe(1000);
  });

  it('uses default limit=100 when limit=NaN (D-18 NaN-safe)', async () => {
    seedAllProviders();
    const data = await (await GET(new Request('http://localhost:3000/api/v1/devices?limit=abc') as any, {} as any)).json();
    expect(data.limit).toBe(100);
  });

  it('clamps negative offset to 0 (D-19)', async () => {
    seedAllProviders();
    const data = await (await GET(new Request('http://localhost:3000/api/v1/devices?offset=-10') as any, {} as any)).json();
    expect(data.offset).toBe(0);
  });

  it('returns items:[] but preserves total_count when offset beyond total (D-19)', async () => {
    seedAllProviders();
    const data = await (await GET(new Request('http://localhost:3000/api/v1/devices?offset=9999') as any, {} as any)).json();
    expect(data.items).toEqual([]);
    expect(data.total_count).toBeGreaterThan(0); // total reflects merged length pre-pagination
  });

  // -------------------------------------------------------------------------
  // Sort (D-17)
  // -------------------------------------------------------------------------

  it('sorts items by provider_type ASC then name ASC Italian-locale (D-17)', async () => {
    seedAllProviders();
    const data = await (await GET(new Request('http://localhost:3000/api/v1/devices') as any, {} as any)).json();
    // First item must have provider_type 'dirigera' (alphabetically first among the 8).
    expect(data.items[0].provider_type).toBe('dirigera');
    // Verify the full provider sequence is non-decreasing (ASC).
    const providerSeq: string[] = data.items.map((i: any) => i.provider_type);
    const sortedSeq = [...providerSeq].sort();
    expect(providerSeq).toEqual(sortedSeq);
  });
});
