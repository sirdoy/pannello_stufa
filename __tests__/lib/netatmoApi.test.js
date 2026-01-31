/**
 * Unit tests for Netatmo API Wrapper
 * Tests API calls, data parsing, and error handling
 */

import NETATMO_API, {
  getAccessToken,
  getHomesData,
  parseRooms,
  parseModules,
  parseSchedules,
  extractTemperatures,
  extractModulesWithStatus,
  getModulesWithLowBattery,
  hasAnyCriticalBattery,
  hasAnyLowBattery,
} from '@/lib/netatmoApi';

// Mock fetch
global.fetch = jest.fn();

describe('netatmoApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.NETATMO_CLIENT_ID = 'test-client-id';
    process.env.NETATMO_CLIENT_SECRET = 'test-client-secret';
  });

  describe('getAccessToken', () => {
    it('should exchange refresh token for access token', async () => {
      global.fetch.mockResolvedValue({
        json: async () => ({
          access_token: 'test-access-token',
          refresh_token: 'new-refresh-token',
        }),
      });

      const result = await getAccessToken('test-refresh-token');

      expect(result).toBe('test-access-token');
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.netatmo.com/oauth2/token',
        expect.objectContaining({
          method: 'POST',
        })
      );
    });

    it('should throw error when access_token is missing', async () => {
      global.fetch.mockResolvedValue({
        json: async () => ({
          error: 'invalid_grant',
        }),
      });

      await expect(getAccessToken('bad-token')).rejects.toThrow(
        'Failed to get access token'
      );
    });
  });

  describe('getHomesData', () => {
    it('should fetch homes data successfully', async () => {
      const mockHomes = [
        {
          id: 'home-1',
          name: 'Casa',
          rooms: [],
          modules: [],
        },
      ];

      global.fetch.mockResolvedValue({
        json: async () => ({
          body: { homes: mockHomes },
        }),
      });

      const result = await getHomesData('test-access-token');

      expect(result).toEqual(mockHomes);
    });

    it('should throw error when Netatmo API returns error', async () => {
      global.fetch.mockResolvedValue({
        json: async () => ({
          error: { message: 'Invalid token' },
        }),
      });

      await expect(getHomesData('bad-token')).rejects.toThrow(
        'Netatmo API Error: Invalid token'
      );
    });
  });

  describe('parseRooms', () => {
    it('should parse rooms correctly', () => {
      const homesData = [
        {
          rooms: [
            {
              id: 'room-1',
              name: 'Soggiorno',
              type: 'living_room',
              module_ids: ['module-1'],
              therm_setpoint_temperature: 21.5,
            },
            {
              id: 'room-2',
              name: 'Camera',
              type: 'bedroom',
              module_ids: ['module-2'],
              // No setpoint
            },
          ],
        },
      ];

      const result = parseRooms(homesData);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: 'room-1',
        name: 'Soggiorno',
        type: 'living_room',
        modules: ['module-1'],
        setpoint: 21.5,
      });
      expect(result[1]).toEqual({
        id: 'room-2',
        name: 'Camera',
        type: 'bedroom',
        modules: ['module-2'],
        // No setpoint property (undefined filtered out)
      });
      expect(result[1].setpoint).toBeUndefined();
    });

    it('should handle empty homes data', () => {
      const result = parseRooms([]);
      expect(result).toEqual([]);
    });

    it('should filter out undefined values for Firebase compatibility', () => {
      const homesData = [
        {
          rooms: [
            {
              id: 'room-1',
              name: 'Test',
              type: 'unknown',
              module_ids: [],
              therm_setpoint_temperature: undefined,
            },
          ],
        },
      ];

      const result = parseRooms(homesData);

      expect(result[0]).not.toHaveProperty('setpoint');
    });
  });

  describe('parseModules', () => {
    it('should parse modules correctly', () => {
      const homesData = [
        {
          modules: [
            {
              id: 'module-1',
              name: 'Valvola Soggiorno',
              type: 'NAV',
              bridge: 'bridge-1',
              room_id: 'room-1',
            },
            {
              id: 'module-2',
              name: 'Relay',
              type: 'NRV',
              // No bridge or room_id
            },
          ],
        },
      ];

      const result = parseModules(homesData);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: 'module-1',
        name: 'Valvola Soggiorno',
        type: 'NAV',
        bridge: 'bridge-1',
        room_id: 'room-1',
      });
      expect(result[1]).toEqual({
        id: 'module-2',
        name: 'Relay',
        type: 'NRV',
      });
      expect(result[1].bridge).toBeUndefined();
      expect(result[1].room_id).toBeUndefined();
    });

    it('should handle empty modules', () => {
      const result = parseModules([{ modules: [] }]);
      expect(result).toEqual([]);
    });
  });

  describe('extractTemperatures', () => {
    it('should extract temperatures from homestatus', () => {
      const homeStatus = {
        rooms: [
          {
            id: 'room-1',
            therm_measured_temperature: 20.5,
            therm_setpoint_temperature: 21.0,
            therm_setpoint_mode: 'manual',
            heating_power_request: 50,
          },
          {
            id: 'room-2',
            therm_measured_temperature: 19.0,
            therm_setpoint_temperature: 18.0,
            therm_setpoint_mode: 'home',
            heating_power_request: 0,
          },
        ],
      };

      const result = extractTemperatures(homeStatus);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        room_id: 'room-1',
        temperature: 20.5,
        setpoint: 21.0,
        mode: 'manual',
        heating: true,
      });
      expect(result[1]).toEqual({
        room_id: 'room-2',
        temperature: 19.0,
        setpoint: 18.0,
        mode: 'home',
        heating: false,
      });
    });

    it('should handle empty rooms', () => {
      const result = extractTemperatures({ rooms: [] });
      expect(result).toEqual([]);
    });
  });

  describe('API error handling', () => {
    it('should handle network errors', async () => {
      global.fetch.mockRejectedValue(new Error('Network error'));

      await expect(getHomesData('token')).rejects.toThrow();
    });

    it('should handle Netatmo API errors with object format', async () => {
      global.fetch.mockResolvedValue({
        json: async () => ({
          error: {
            code: 2,
            message: 'Invalid access token',
          },
        }),
      });

      await expect(getHomesData('bad-token')).rejects.toThrow(
        'Invalid access token'
      );
    });

    it('should handle Netatmo API errors with string format', async () => {
      global.fetch.mockResolvedValue({
        json: async () => ({
          error: 'invalid_token',
        }),
      });

      await expect(getHomesData('bad-token')).rejects.toThrow(
        'Netatmo API Error'
      );
    });
  });

  describe('POST request formatting', () => {
    it('should send POST requests with application/x-www-form-urlencoded', async () => {
      global.fetch.mockResolvedValue({
        json: async () => ({
          status: 'ok',
        }),
      });

      await NETATMO_API.setRoomThermpoint('token', {
        home_id: 'home-1',
        room_id: 'room-1',
        mode: 'manual',
        temp: 21,
      });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/x-www-form-urlencoded',
          }),
        })
      );
    });
  });

  describe('extractModulesWithStatus', () => {
    it('should extract modules with battery status from homestatus', () => {
      const homeStatus = {
        modules: [
          {
            id: 'valve-1',
            type: 'NRV',
            reachable: true,
            battery_state: 'full',
            battery_level: 3213,
            rf_strength: 82,
            bridge: 'relay-1',
            room_id: 'room-1',
            firmware_revision: 73,
          },
          {
            id: 'valve-2',
            type: 'NRV',
            reachable: true,
            battery_state: 'low',
            battery_level: 2760,
            rf_strength: 76,
            bridge: 'relay-1',
            room_id: 'room-2',
          },
          {
            id: 'relay-1',
            type: 'NAPlug',
            reachable: true,
            wifi_strength: 55,
          },
        ],
      };

      const result = extractModulesWithStatus(homeStatus);

      expect(result).toHaveLength(3);

      // Valve 1 - full battery
      expect(result[0]).toEqual({
        id: 'valve-1',
        type: 'NRV',
        reachable: true,
        battery_state: 'full',
        battery_level: 3213,
        rf_strength: 82,
        bridge: 'relay-1',
        room_id: 'room-1',
        firmware_revision: 73,
      });

      // Valve 2 - low battery
      expect(result[1]).toEqual({
        id: 'valve-2',
        type: 'NRV',
        reachable: true,
        battery_state: 'low',
        battery_level: 2760,
        rf_strength: 76,
        bridge: 'relay-1',
        room_id: 'room-2',
      });

      // Relay - no battery (mains powered)
      expect(result[2]).toEqual({
        id: 'relay-1',
        type: 'NAPlug',
        reachable: true,
        wifi_strength: 55,
      });
    });

    it('should add module names from topology if available', () => {
      const homeStatus = {
        modules: [
          {
            id: 'valve-1',
            type: 'NRV',
            reachable: true,
            battery_state: 'high',
          },
        ],
      };

      const topology = {
        modules: [
          { id: 'valve-1', name: 'Valvola Soggiorno' },
        ],
      };

      const result = extractModulesWithStatus(homeStatus, topology);

      expect(result[0].name).toBe('Valvola Soggiorno');
    });

    it('should handle empty modules array', () => {
      const result = extractModulesWithStatus({ modules: [] });
      expect(result).toEqual([]);
    });

    it('should handle missing modules property', () => {
      const result = extractModulesWithStatus({});
      expect(result).toEqual([]);
    });

    it('should filter out undefined values for Firebase compatibility', () => {
      const homeStatus = {
        modules: [
          {
            id: 'valve-1',
            type: 'NRV',
            reachable: true,
            battery_state: undefined,
            battery_level: undefined,
            rf_strength: undefined,
          },
        ],
      };

      const result = extractModulesWithStatus(homeStatus);

      expect(result[0]).not.toHaveProperty('battery_state');
      expect(result[0]).not.toHaveProperty('battery_level');
      expect(result[0]).not.toHaveProperty('rf_strength');
    });
  });

  describe('getModulesWithLowBattery', () => {
    it('should return modules with low or very_low battery', () => {
      const modules = [
        { id: 'v1', battery_state: 'full' },
        { id: 'v2', battery_state: 'high' },
        { id: 'v3', battery_state: 'medium' },
        { id: 'v4', battery_state: 'low' },
        { id: 'v5', battery_state: 'very_low' },
      ];

      const result = getModulesWithLowBattery(modules);

      expect(result).toHaveLength(2);
      expect(result.map(m => m.id)).toEqual(['v4', 'v5']);
    });

    it('should return empty array when no low battery modules', () => {
      const modules = [
        { id: 'v1', battery_state: 'full' },
        { id: 'v2', battery_state: 'high' },
      ];

      const result = getModulesWithLowBattery(modules);

      expect(result).toEqual([]);
    });
  });

  describe('hasAnyCriticalBattery', () => {
    it('should return true when any module has very_low battery', () => {
      const modules = [
        { id: 'v1', battery_state: 'full' },
        { id: 'v2', battery_state: 'very_low' },
      ];

      expect(hasAnyCriticalBattery(modules)).toBe(true);
    });

    it('should return false when no module has very_low battery', () => {
      const modules = [
        { id: 'v1', battery_state: 'full' },
        { id: 'v2', battery_state: 'low' },
      ];

      expect(hasAnyCriticalBattery(modules)).toBe(false);
    });
  });

  describe('hasAnyLowBattery', () => {
    it('should return true when any module has low battery', () => {
      const modules = [
        { id: 'v1', battery_state: 'full' },
        { id: 'v2', battery_state: 'low' },
      ];

      expect(hasAnyLowBattery(modules)).toBe(true);
    });

    it('should return true when any module has very_low battery', () => {
      const modules = [
        { id: 'v1', battery_state: 'full' },
        { id: 'v2', battery_state: 'very_low' },
      ];

      expect(hasAnyLowBattery(modules)).toBe(true);
    });

    it('should return false when all modules have adequate battery', () => {
      const modules = [
        { id: 'v1', battery_state: 'full' },
        { id: 'v2', battery_state: 'high' },
        { id: 'v3', battery_state: 'medium' },
      ];

      expect(hasAnyLowBattery(modules)).toBe(false);
    });
  });

  describe('parseSchedules', () => {
    it('should parse schedules with zones and timetable', () => {
      const homesData = [
        {
          schedules: [
            {
              id: 'schedule-1',
              name: 'Casa',
              type: 'therm',
              selected: true,
              zones: [
                {
                  id: 0,
                  name: 'Comfort',
                  type: 0,
                  rooms: ['room-1', 'room-2'],
                  temp: 21,
                },
                {
                  id: 1,
                  name: 'Notte',
                  type: 1,
                  rooms: ['room-1'],
                  temp: 18,
                },
              ],
              timetable: [
                { m_offset: 420, zone_id: 0 },
                { m_offset: 1320, zone_id: 1 },
              ],
            },
          ],
        },
      ];

      const result = parseSchedules(homesData);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: 'schedule-1',
        name: 'Casa',
        type: 'therm',
        selected: true,
        zones: [
          {
            id: 0,
            name: 'Comfort',
            type: 0,
            rooms: ['room-1', 'room-2'],
            temp: 21,
          },
          {
            id: 1,
            name: 'Notte',
            type: 1,
            rooms: ['room-1'],
            temp: 18,
          },
        ],
        timetable: [
          { m_offset: 420, zone_id: 0 },
          { m_offset: 1320, zone_id: 1 },
        ],
      });
    });

    it('should filter out undefined temp values for Firebase compatibility', () => {
      const homesData = [
        {
          schedules: [
            {
              id: 'schedule-1',
              name: 'Casa',
              type: 'therm',
              selected: true,
              zones: [
                {
                  id: 0,
                  name: 'Comfort',
                  type: 0,
                  rooms: ['room-1'],
                  temp: 21,
                },
                {
                  id: 1,
                  name: 'Away',
                  type: 5,
                  rooms: [],
                  temp: undefined, // Some zone types don't have temp
                },
              ],
            },
          ],
        },
      ];

      const result = parseSchedules(homesData);

      expect(result).toHaveLength(1);
      expect(result[0].zones).toHaveLength(2);

      // First zone should have temp
      expect(result[0].zones[0]).toHaveProperty('temp', 21);

      // Second zone should NOT have temp property (undefined filtered out)
      expect(result[0].zones[1]).not.toHaveProperty('temp');
      expect(result[0].zones[1]).toEqual({
        id: 1,
        name: 'Away',
        type: 5,
        rooms: [],
      });
    });

    it('should handle schedules without zones or timetable', () => {
      const homesData = [
        {
          schedules: [
            {
              id: 'schedule-1',
              name: 'Simple',
              type: 'therm',
              selected: false,
            },
          ],
        },
      ];

      const result = parseSchedules(homesData);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: 'schedule-1',
        name: 'Simple',
        type: 'therm',
        selected: false,
      });
      expect(result[0]).not.toHaveProperty('zones');
      expect(result[0]).not.toHaveProperty('timetable');
    });

    it('should handle empty homes data', () => {
      const result = parseSchedules([]);
      expect(result).toEqual([]);
    });

    it('should handle null or missing schedules', () => {
      const homesData = [{ schedules: null }];
      const result = parseSchedules(homesData);
      expect(result).toEqual([]);
    });

    it('should extract temp from multi-room structure (rooms_temp array)', () => {
      const homesData = [
        {
          schedules: [
            {
              id: 'schedule-1',
              name: 'Casa',
              type: 'therm',
              selected: true,
              zones: [
                {
                  id: 0,
                  name: 'Comfort',
                  type: 0,
                  rooms: [
                    { id: '2678939675', therm_setpoint_temperature: 21 },
                  ],
                  rooms_temp: [
                    { room_id: '2678939675', temp: 21 },
                  ],
                },
                {
                  id: 1,
                  name: 'Notte',
                  type: 1,
                  rooms: [
                    { id: '2678939675', therm_setpoint_temperature: 14 },
                    { id: '3297508638', therm_setpoint_temperature: 16 },
                  ],
                  rooms_temp: [
                    { room_id: '2678939675', temp: 14 },
                    { room_id: '3297508638', temp: 16 },
                  ],
                },
                {
                  id: 5,
                  name: 'Away',
                  type: 5,
                  rooms: [],
                  rooms_temp: [],
                },
              ],
            },
          ],
        },
      ];

      const result = parseSchedules(homesData);

      expect(result).toHaveLength(1);
      expect(result[0].zones).toHaveLength(3);

      // First zone - single room, average of [21] = 21
      expect(result[0].zones[0]).toHaveProperty('temp', 21);
      expect(result[0].zones[0]).toHaveProperty('rooms_temp');

      // Second zone - multi-room, average of [14, 16] = 15
      expect(result[0].zones[1]).toHaveProperty('temp', 15);
      expect(result[0].zones[1]).toHaveProperty('rooms_temp');
      expect(result[0].zones[1].rooms_temp).toHaveLength(2);

      // Third zone - Away with no rooms, should NOT have temp property
      expect(result[0].zones[2]).not.toHaveProperty('temp');
    });
  });
});
