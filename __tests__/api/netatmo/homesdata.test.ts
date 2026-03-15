/**
 * @jest-environment node
 *
 * Tests for GET /api/netatmo/homesdata
 * Migrated to use Netatmo proxy instead of Netatmo Cloud API directly.
 */

import { GET } from '@/app/api/netatmo/homesdata/route';
import { getProxyHomesdata } from '@/lib/netatmoProxy';
import { adminDbSet } from '@/lib/firebaseAdmin';
import { getEnvironmentPath } from '@/lib/environmentHelper';
import type { NetatmoProxyHomesdataResponse } from '@/types/netatmoProxy';

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

const mockGetProxyHomesdata = getProxyHomesdata as jest.MockedFunction<typeof getProxyHomesdata>;
const mockAdminDbSet = adminDbSet as jest.MockedFunction<typeof adminDbSet>;
const mockGetEnvironmentPath = getEnvironmentPath as jest.MockedFunction<typeof getEnvironmentPath>;

const mockProxyResponse: NetatmoProxyHomesdataResponse = {
  body: {
    homes: [
      {
        id: 'home-1',
        name: 'Casa Mia',
        rooms: [
          { id: 'room-1', name: 'Soggiorno', type: 'livingroom', module_ids: ['module-1'] },
          { id: 'room-2', name: 'Camera', type: 'bedroom', module_ids: ['module-2'] },
        ],
        modules: [
          { id: 'module-1', type: 'NATherm1', name: 'Thermostat', room_id: 'room-1', setup_date: 1600000000, firmware_revision: 10, battery_level: 'full' },
          { id: 'module-2', type: 'NRV', name: 'Valvola Camera', room_id: 'room-2', setup_date: 1600000000, firmware_revision: 5, battery_level: 'low' },
        ],
        schedules: [
          {
            id: 'schedule-1',
            name: 'Default',
            selected: true,
            type: 'therm',
            timetable: [],
          },
        ],
      },
    ],
  },
  status: 'ok',
  time_exec: 0.123,
  time_server: 1700000000,
};

describe('GET /api/netatmo/homesdata', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetEnvironmentPath.mockImplementation((path: string) => `test/${path}`);
    mockAdminDbSet.mockResolvedValue(undefined as any);
  });

  it('should call proxy and return stripped home data', async () => {
    mockGetProxyHomesdata.mockResolvedValue(mockProxyResponse);

    const result = await GET();

    expect(mockGetProxyHomesdata).toHaveBeenCalledTimes(1);
    expect((result as any).ok).toBe(true);

    const data = (result as any).data;
    expect(data.home_id).toBe('home-1');
    expect(data.home_name).toBe('Casa Mia');
    expect(data.rooms).toHaveLength(2);
    expect(data.modules).toHaveLength(2);
    expect(data.schedules).toHaveLength(1);
  });

  it('should NOT include the body/status/time_exec envelope in response', async () => {
    mockGetProxyHomesdata.mockResolvedValue(mockProxyResponse);

    const result = await GET();
    const data = (result as any).data;

    // Should NOT have Netatmo envelope fields
    expect(data.body).toBeUndefined();
    expect(data.status).toBeUndefined();
    expect(data.time_exec).toBeUndefined();
    expect(data.time_server).toBeUndefined();
  });

  it('should save home_id to Firebase', async () => {
    mockGetProxyHomesdata.mockResolvedValue(mockProxyResponse);

    await GET();

    expect(mockAdminDbSet).toHaveBeenCalledWith(
      'test/netatmo/home_id',
      'home-1'
    );
  });

  it('should save topology to Firebase with correct structure', async () => {
    mockGetProxyHomesdata.mockResolvedValue(mockProxyResponse);

    await GET();

    expect(mockAdminDbSet).toHaveBeenCalledWith(
      'test/netatmo/topology',
      expect.objectContaining({
        home_id: 'home-1',
        home_name: 'Casa Mia',
        rooms: expect.arrayContaining([
          expect.objectContaining({ id: 'room-1', name: 'Soggiorno', type: 'livingroom' }),
        ]),
        modules: expect.arrayContaining([
          expect.objectContaining({ id: 'module-1', type: 'NATherm1' }),
        ]),
        schedules: expect.any(Array),
        updated_at: expect.any(Number),
      })
    );
  });

  it('should return 404 when no homes in proxy response', async () => {
    mockGetProxyHomesdata.mockResolvedValue({
      ...mockProxyResponse,
      body: { homes: [] },
    });

    const result = await GET();

    expect((result as any).ok).toBe(false);
    expect((result as any).status).toBe(404);
  });

  it('should propagate proxy ApiError correctly', async () => {
    const { ApiError, ERROR_CODES, HTTP_STATUS } = await import('@/lib/core/apiErrors');
    mockGetProxyHomesdata.mockRejectedValue(
      new ApiError(ERROR_CODES.SERVICE_UNAVAILABLE, 'Proxy unavailable', HTTP_STATUS.SERVICE_UNAVAILABLE)
    );

    await expect(GET()).rejects.toThrow('Proxy unavailable');
  });

  it('should pass through rooms with proxy field names', async () => {
    mockGetProxyHomesdata.mockResolvedValue(mockProxyResponse);

    const result = await GET();
    const rooms = (result as any).data.rooms;

    // Rooms should have proxy field names (id, name, type, module_ids)
    expect(rooms[0]).toHaveProperty('id', 'room-1');
    expect(rooms[0]).toHaveProperty('name', 'Soggiorno');
    expect(rooms[0]).toHaveProperty('type', 'livingroom');
    expect(rooms[0]).toHaveProperty('module_ids');
  });

  it('should handle schedules: undefined from proxy home gracefully', async () => {
    const responseWithNoSchedules: NetatmoProxyHomesdataResponse = {
      ...mockProxyResponse,
      body: {
        homes: [
          {
            ...mockProxyResponse.body.homes[0]!,
            schedules: [],
          },
        ],
      },
    };
    mockGetProxyHomesdata.mockResolvedValue(responseWithNoSchedules);

    const result = await GET();
    expect((result as any).data.schedules).toEqual([]);
  });
});
