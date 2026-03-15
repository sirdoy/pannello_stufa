/**
 * @jest-environment node
 *
 * Tests for GET /api/netatmo/homestatus
 * Migrated to use Netatmo proxy instead of Netatmo Cloud API directly.
 */

import { GET } from '@/app/api/netatmo/homestatus/route';
import { getProxyHomestatus } from '@/lib/netatmoProxy';
import { adminDbGet, adminDbSet } from '@/lib/firebaseAdmin';
import { getEnvironmentPath } from '@/lib/environmentHelper';
import type { NetatmoProxyHomestatusResponse } from '@/types/netatmoProxy';

// Mock dependencies
jest.mock('@/lib/netatmoProxy');
jest.mock('@/lib/firebaseAdmin');
jest.mock('@/lib/environmentHelper');
jest.mock('@/lib/core', () => ({
  withAuthAndErrorHandler: (fn: Function) => fn,
  success: (data: unknown) => ({ ok: true, data }),
  badRequest: (msg: string) => ({ ok: false, error: msg, status: 400 }),
  notFound: (msg: string) => ({ ok: false, error: msg, status: 404 }),
}));

// GET is the inner handler (no request arg needed due to mock above)
const callGET = () => (GET as unknown as () => Promise<unknown>)();

const mockGetProxyHomestatus = getProxyHomestatus as jest.MockedFunction<typeof getProxyHomestatus>;
const mockAdminDbGet = adminDbGet as jest.MockedFunction<typeof adminDbGet>;
const mockAdminDbSet = adminDbSet as jest.MockedFunction<typeof adminDbSet>;
const mockGetEnvironmentPath = getEnvironmentPath as jest.MockedFunction<typeof getEnvironmentPath>;

const mockProxyResponse: NetatmoProxyHomestatusResponse = {
  rooms: [
    {
      home_id: 'home-1',
      room_id: 'room-1',
      room_name: 'Soggiorno',
      temperature: 21.5,
      therm_setpoint_temperature: 22.0,
      heating_power_request: 50,
      timestamp: 1700000000,
    },
    {
      home_id: 'home-1',
      room_id: 'room-2',
      room_name: 'Camera',
      temperature: 19.0,
      therm_setpoint_temperature: 18.0,
      heating_power_request: 0,
      timestamp: 1700000000,
    },
  ],
  data_freshness: 'LIVE',
};

const mockTopology = {
  rooms: [
    { id: 'room-1', name: 'Soggiorno', type: 'livingroom' },
    { id: 'room-2', name: 'Camera', type: 'bedroom' },
  ],
  modules: [
    { id: 'module-1', type: 'NATherm1', name: 'Thermostat', room_id: 'room-1', battery_level: 'full' },
    { id: 'module-2', type: 'NRV', name: 'Valvola Camera', room_id: 'room-2', battery_level: 'low' },
  ],
};

describe('GET /api/netatmo/homestatus', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetEnvironmentPath.mockImplementation((path: string) => `test/${path}`);
    mockAdminDbSet.mockResolvedValue(undefined as any);
  });

  it('should call proxy and return enriched rooms with mapped fields', async () => {
    mockGetProxyHomestatus.mockResolvedValue(mockProxyResponse);
    mockAdminDbGet.mockImplementation(async (path: string) => {
      if (path === 'test/netatmo/topology') return mockTopology;
      if (path === 'test/netatmo/stoveSync') return null;
      return null;
    });

    const result = await callGET();

    expect(mockGetProxyHomestatus).toHaveBeenCalledTimes(1);
    expect((result as any).ok).toBe(true);

    const rooms = (result as any).data.rooms;
    expect(rooms).toHaveLength(2);

    // First room — heating active (heating_power_request > 0)
    const room1 = rooms.find((r: any) => r.room_id === 'room-1');
    expect(room1).toBeDefined();
    expect(room1.room_name).toBe('Soggiorno');
    expect(room1.room_type).toBe('livingroom');
    expect(room1.temperature).toBe(21.5);
    expect(room1.setpoint).toBe(22.0);
    expect(room1.heating).toBe(true);

    // Second room — heating off (heating_power_request === 0)
    const room2 = rooms.find((r: any) => r.room_id === 'room-2');
    expect(room2).toBeDefined();
    expect(room2.room_type).toBe('bedroom');
    expect(room2.heating).toBe(false);
  });

  it('should include data_freshness in response', async () => {
    mockGetProxyHomestatus.mockResolvedValue(mockProxyResponse);
    mockAdminDbGet.mockImplementation(async (path: string) => {
      if (path === 'test/netatmo/topology') return mockTopology;
      if (path === 'test/netatmo/stoveSync') return null;
      return null;
    });

    const result = await callGET();

    expect((result as any).data.data_freshness).toBe('LIVE');
  });

  it('should include data_freshness STALE in response', async () => {
    mockGetProxyHomestatus.mockResolvedValue({ ...mockProxyResponse, data_freshness: 'STALE' });
    mockAdminDbGet.mockImplementation(async (path: string) => {
      if (path === 'test/netatmo/topology') return mockTopology;
      if (path === 'test/netatmo/stoveSync') return null;
      return null;
    });

    const result = await callGET();

    expect((result as any).data.data_freshness).toBe('STALE');
  });

  it('should enrich rooms with stoveSync data for synced rooms', async () => {
    mockGetProxyHomestatus.mockResolvedValue(mockProxyResponse);
    mockAdminDbGet.mockImplementation(async (path: string) => {
      if (path === 'test/netatmo/topology') return mockTopology;
      if (path === 'test/netatmo/stoveSync') return {
        enabled: true,
        stoveMode: 'Comfort',
        stoveTemperature: 22,
        rooms: [{ id: 'room-1' }],
      };
      return null;
    });

    const result = await callGET();
    const rooms = (result as any).data.rooms;

    const room1 = rooms.find((r: any) => r.room_id === 'room-1');
    expect(room1.stoveSync).toBe(true);
    expect(room1.stoveSyncSetpoint).toBe(22);

    // Room 2 should NOT have stoveSync
    const room2 = rooms.find((r: any) => r.room_id === 'room-2');
    expect(room2.stoveSync).toBeUndefined();
  });

  it('should include modules battery info from Firebase topology', async () => {
    mockGetProxyHomestatus.mockResolvedValue(mockProxyResponse);
    mockAdminDbGet.mockImplementation(async (path: string) => {
      if (path === 'test/netatmo/topology') return mockTopology;
      if (path === 'test/netatmo/stoveSync') return null;
      return null;
    });

    const result = await callGET();
    const data = (result as any).data;

    expect(data.modules).toBeDefined();
    expect(Array.isArray(data.modules)).toBe(true);
    expect(data.hasLowBattery).toBeDefined();
    expect(data.hasCriticalBattery).toBeDefined();
    expect(data.lowBatteryModules).toBeDefined();
  });

  it('should save current status to Firebase', async () => {
    mockGetProxyHomestatus.mockResolvedValue(mockProxyResponse);
    mockAdminDbGet.mockImplementation(async (path: string) => {
      if (path === 'test/netatmo/topology') return mockTopology;
      if (path === 'test/netatmo/stoveSync') return null;
      return null;
    });

    await callGET();

    expect(mockAdminDbSet).toHaveBeenCalledWith(
      'test/netatmo/currentStatus',
      expect.objectContaining({
        rooms: expect.any(Array),
        modules: expect.any(Array),
        updated_at: expect.any(Number),
      })
    );
  });

  it('should use room_type from topology, falling back to unknown', async () => {
    mockGetProxyHomestatus.mockResolvedValue({
      ...mockProxyResponse,
      rooms: [
        {
          home_id: 'home-1',
          room_id: 'room-unknown',
          room_name: 'Unknown Room',
          temperature: 20.0,
          therm_setpoint_temperature: 21.0,
          heating_power_request: 0,
          timestamp: 1700000000,
        },
      ],
    });
    mockAdminDbGet.mockImplementation(async (path: string) => {
      if (path === 'test/netatmo/topology') return mockTopology; // topology has no room-unknown
      if (path === 'test/netatmo/stoveSync') return null;
      return null;
    });

    const result = await callGET();
    const rooms = (result as any).data.rooms;

    expect(rooms[0]!.room_type).toBe('unknown');
  });

  it('should propagate proxy ApiError correctly', async () => {
    const { ApiError, ERROR_CODES, HTTP_STATUS } = await import('@/lib/core/apiErrors');
    mockGetProxyHomestatus.mockRejectedValue(
      new ApiError(ERROR_CODES.SERVICE_UNAVAILABLE, 'Proxy unavailable', HTTP_STATUS.SERVICE_UNAVAILABLE)
    );
    mockAdminDbGet.mockResolvedValue(null);

    await expect(callGET()).rejects.toThrow('Proxy unavailable');
  });

  it('should handle null heating_power_request as heating: false', async () => {
    mockGetProxyHomestatus.mockResolvedValue({
      ...mockProxyResponse,
      rooms: [
        {
          home_id: 'home-1',
          room_id: 'room-1',
          room_name: 'Soggiorno',
          temperature: 20.0,
          therm_setpoint_temperature: 22.0,
          heating_power_request: null,
          timestamp: 1700000000,
        },
      ],
    });
    mockAdminDbGet.mockImplementation(async (path: string) => {
      if (path === 'test/netatmo/topology') return mockTopology;
      if (path === 'test/netatmo/stoveSync') return null;
      return null;
    });

    const result = await callGET();
    const rooms = (result as any).data.rooms;

    expect(rooms[0]!.heating).toBe(false);
  });
});
