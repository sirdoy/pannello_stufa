/**
 * Tests for Device Event Logger
 *
 * Tests Firebase RTDB event logging, querying, and state tracking
 */

import type { DeviceEvent } from '@/app/components/devices/network/types';

// Mock Firebase Admin and Environment Helper BEFORE imports
jest.mock('@/lib/firebaseAdmin');
jest.mock('@/lib/environmentHelper');

// NOW import the module under test and mocked modules
import { logDeviceEvent, getDeviceEvents, getDeviceStates, updateDeviceStates } from '../deviceEventLogger';
import { adminDbSet, adminDbGet } from '@/lib/firebaseAdmin';
import { getEnvironmentPath } from '@/lib/environmentHelper';

// Get references to the mocked functions
const mockedAdminDbSet = jest.mocked(adminDbSet);
const mockedAdminDbGet = jest.mocked(adminDbGet);
const mockedGetEnvironmentPath = jest.mocked(getEnvironmentPath);

describe('deviceEventLogger', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Default environment path behavior
    mockedGetEnvironmentPath.mockImplementation((path: string) => `dev/${path}`);
  });

  describe('logDeviceEvent', () => {
    it('should write connected event to date-keyed Firebase path', async () => {
      const event: DeviceEvent = {
        deviceMac: 'AA:BB:CC:DD:EE:FF',
        deviceName: 'iPhone',
        deviceIp: '192.168.1.10',
        eventType: 'connected',
        timestamp: 1708000000000, // 2024-02-15T14:13:20.000Z
      };

      await logDeviceEvent(event);

      expect(mockedAdminDbSet).toHaveBeenCalledWith(
        'dev/fritzbox/device_events/2024-02-15/1708000000000_AA-BB-CC-DD-EE-FF_connected',
        event
      );
    });

    it('should write disconnected event to date-keyed Firebase path', async () => {
      const event: DeviceEvent = {
        deviceMac: 'AA:BB:CC:DD:EE:FF',
        deviceName: 'iPhone',
        deviceIp: '192.168.1.10',
        eventType: 'disconnected',
        timestamp: 1708000000000,
      };

      await logDeviceEvent(event);

      expect(mockedAdminDbSet).toHaveBeenCalledWith(
        'dev/fritzbox/device_events/2024-02-15/1708000000000_AA-BB-CC-DD-EE-FF_disconnected',
        event
      );
    });

    it('should replace colons with dashes in MAC address for Firebase key', async () => {
      const event: DeviceEvent = {
        deviceMac: '00:11:22:33:44:55',
        deviceName: 'Test Device',
        deviceIp: '192.168.1.20',
        eventType: 'connected',
        timestamp: 1708000000000,
      };

      await logDeviceEvent(event);

      expect(mockedAdminDbSet).toHaveBeenCalledWith(
        expect.stringContaining('00-11-22-33-44-55'),
        event
      );
    });

    it('should use getEnvironmentPath for environment-aware paths', async () => {
      mockedGetEnvironmentPath.mockReturnValue('prod/fritzbox/device_events');

      const event: DeviceEvent = {
        deviceMac: 'AA:BB:CC:DD:EE:FF',
        deviceName: 'iPhone',
        deviceIp: '192.168.1.10',
        eventType: 'connected',
        timestamp: 1708000000000,
      };

      await logDeviceEvent(event);

      expect(mockedGetEnvironmentPath).toHaveBeenCalledWith('fritzbox/device_events');
    });
  });

  describe('getDeviceEvents', () => {
    it('should query single date node and return sorted events (newest first)', async () => {
      // Query same day: 2024-02-15 00:00:00 to 2024-02-15 23:59:59
      const startTime = 1708000000000; // 2024-02-15T14:13:20.000Z
      const endTime = 1708020000000;   // 2024-02-15T19:46:40.000Z

      mockedAdminDbGet.mockResolvedValue({
        '1708005000000_AA-BB-CC-DD-EE-FF_connected': {
          deviceMac: 'AA:BB:CC:DD:EE:FF',
          deviceName: 'iPhone',
          deviceIp: '192.168.1.10',
          eventType: 'connected',
          timestamp: 1708005000000,
        },
        '1708010000000_BB-CC-DD-EE-FF-00_disconnected': {
          deviceMac: 'BB:CC:DD:EE:FF:00',
          deviceName: 'MacBook',
          deviceIp: '192.168.1.11',
          eventType: 'disconnected',
          timestamp: 1708010000000,
        },
        '1708015000000_AA-BB-CC-DD-EE-FF_disconnected': {
          deviceMac: 'AA:BB:CC:DD:EE:FF',
          deviceName: 'iPhone',
          deviceIp: '192.168.1.10',
          eventType: 'disconnected',
          timestamp: 1708015000000,
        },
      });

      const events = await getDeviceEvents(startTime, endTime);

      // Should read single date node
      expect(mockedAdminDbGet).toHaveBeenCalledTimes(1);
      expect(mockedAdminDbGet).toHaveBeenCalledWith('dev/fritzbox/device_events/2024-02-15');

      // Should return 3 events sorted newest first
      expect(events).toHaveLength(3);
      expect(events[0]?.timestamp).toBe(1708015000000);
      expect(events[1]?.timestamp).toBe(1708010000000);
      expect(events[2]?.timestamp).toBe(1708005000000);
    });

    it('should query multiple date nodes and merge results', async () => {
      // Query spanning 3 days
      const startTime = 1708000000000; // 2024-02-15
      const endTime = 1708200000000;   // 2024-02-17

      // Mock different data for each date
      mockedAdminDbGet
        .mockResolvedValueOnce({
          '1708005000000_AA-BB-CC-DD-EE-FF_connected': {
            deviceMac: 'AA:BB:CC:DD:EE:FF',
            deviceName: 'iPhone',
            deviceIp: '192.168.1.10',
            eventType: 'connected',
            timestamp: 1708005000000,
          },
        })
        .mockResolvedValueOnce({
          '1708095000000_BB-CC-DD-EE-FF-00_connected': {
            deviceMac: 'BB:CC:DD:EE:FF:00',
            deviceName: 'MacBook',
            deviceIp: '192.168.1.11',
            eventType: 'connected',
            timestamp: 1708095000000,
          },
        })
        .mockResolvedValueOnce({
          '1708185000000_AA-BB-CC-DD-EE-FF_disconnected': {
            deviceMac: 'AA:BB:CC:DD:EE:FF',
            deviceName: 'iPhone',
            deviceIp: '192.168.1.10',
            eventType: 'disconnected',
            timestamp: 1708185000000,
          },
        });

      const events = await getDeviceEvents(startTime, endTime);

      // Should read 3 date nodes
      expect(mockedAdminDbGet).toHaveBeenCalledTimes(3);
      expect(mockedAdminDbGet).toHaveBeenCalledWith('dev/fritzbox/device_events/2024-02-15');
      expect(mockedAdminDbGet).toHaveBeenCalledWith('dev/fritzbox/device_events/2024-02-16');
      expect(mockedAdminDbGet).toHaveBeenCalledWith('dev/fritzbox/device_events/2024-02-17');

      // Should merge and sort
      expect(events).toHaveLength(3);
      expect(events[0]?.timestamp).toBe(1708185000000);
      expect(events[1]?.timestamp).toBe(1708095000000);
      expect(events[2]?.timestamp).toBe(1708005000000);
    });

    it('should filter events outside timestamp range', async () => {
      const startTime = 1708005000000; // Filter start
      const endTime = 1708015000000;   // Filter end

      mockedAdminDbGet.mockResolvedValue({
        '1708000000000_AA-BB-CC-DD-EE-FF_connected': {
          timestamp: 1708000000000, // Before range
          deviceMac: 'AA:BB:CC:DD:EE:FF',
          deviceName: 'iPhone',
          deviceIp: '192.168.1.10',
          eventType: 'connected',
        },
        '1708010000000_BB-CC-DD-EE-FF-00_connected': {
          timestamp: 1708010000000, // Inside range
          deviceMac: 'BB:CC:DD:EE:FF:00',
          deviceName: 'MacBook',
          deviceIp: '192.168.1.11',
          eventType: 'connected',
        },
        '1708020000000_CC-DD-EE-FF-00-11_connected': {
          timestamp: 1708020000000, // After range
          deviceMac: 'CC:DD:EE:FF:00:11',
          deviceName: 'iPad',
          deviceIp: '192.168.1.12',
          eventType: 'connected',
        },
      });

      const events = await getDeviceEvents(startTime, endTime);

      // Should only return event inside range
      expect(events).toHaveLength(1);
      expect(events[0]?.timestamp).toBe(1708010000000);
    });

    it('should return empty array if no data exists', async () => {
      mockedAdminDbGet.mockResolvedValue(null);

      const events = await getDeviceEvents(1708000000000, 1708100000000);

      expect(events).toEqual([]);
    });

    it('should handle date node with no events', async () => {
      mockedAdminDbGet.mockResolvedValue({});

      const events = await getDeviceEvents(1708000000000, 1708100000000);

      expect(events).toEqual([]);
    });
  });

  describe('getDeviceStates', () => {
    it('should return empty Map if no states exist', async () => {
      mockedAdminDbGet.mockResolvedValue(null);

      const states = await getDeviceStates();

      expect(mockedAdminDbGet).toHaveBeenCalledWith('dev/fritzbox/device_states');
      expect(states).toBeInstanceOf(Map);
      expect(states.size).toBe(0);
    });

    it('should return populated Map with existing states', async () => {
      mockedAdminDbGet.mockResolvedValue({
        'AA:BB:CC:DD:EE:FF': { active: true, lastSeen: 1708000000000 },
        'BB:CC:DD:EE:FF:00': { active: false, lastSeen: 1707990000000 },
      });

      const states = await getDeviceStates();

      expect(states).toBeInstanceOf(Map);
      expect(states.size).toBe(2);
      expect(states.get('AA:BB:CC:DD:EE:FF')).toEqual({ active: true, lastSeen: 1708000000000 });
      expect(states.get('BB:CC:DD:EE:FF:00')).toEqual({ active: false, lastSeen: 1707990000000 });
    });

    it('should use getEnvironmentPath for environment-aware paths', async () => {
      mockedAdminDbGet.mockResolvedValue(null);

      await getDeviceStates();

      expect(mockedGetEnvironmentPath).toHaveBeenCalledWith('fritzbox/device_states');
    });
  });

  describe('updateDeviceStates', () => {
    it('should write Map as plain object to Firebase', async () => {
      const states = new Map([
        ['AA:BB:CC:DD:EE:FF', { active: true, lastSeen: 1708000000000 }],
        ['BB:CC:DD:EE:FF:00', { active: false, lastSeen: 1707990000000 }],
      ]);

      await updateDeviceStates(states);

      expect(mockedAdminDbSet).toHaveBeenCalledWith(
        'dev/fritzbox/device_states',
        {
          'AA:BB:CC:DD:EE:FF': { active: true, lastSeen: 1708000000000 },
          'BB:CC:DD:EE:FF:00': { active: false, lastSeen: 1707990000000 },
        }
      );
    });

    it('should write empty object for empty Map', async () => {
      const states = new Map();

      await updateDeviceStates(states);

      expect(mockedAdminDbSet).toHaveBeenCalledWith(
        'dev/fritzbox/device_states',
        {}
      );
    });

    it('should use getEnvironmentPath for environment-aware paths', async () => {
      const states = new Map([['AA:BB:CC:DD:EE:FF', { active: true, lastSeen: 1708000000000 }]]);

      await updateDeviceStates(states);

      expect(mockedGetEnvironmentPath).toHaveBeenCalledWith('fritzbox/device_states');
    });
  });
});
