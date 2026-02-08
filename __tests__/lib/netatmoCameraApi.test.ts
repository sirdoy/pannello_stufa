/**
 * Unit tests for Netatmo Camera API Wrapper
 * Tests camera data parsing and helper functions
 */

import NETATMO_CAMERA_API, {
  parseCameras,
  parsePersons,
  parseEvents,
  getSnapshotUrl,
  getEventSnapshotUrl,
  getCameraTypeName,
  getEventTypeName,
  getEventIcon,
} from '@/lib/netatmoCameraApi';

describe('netatmoCameraApi', () => {
  describe('parseCameras', () => {
    it('should return empty array for empty input', () => {
      expect(parseCameras([])).toEqual([]);
      expect(parseCameras(null)).toEqual([]);
      expect(parseCameras(undefined)).toEqual([]);
    });

    it('should parse cameras correctly', () => {
      const input = [{
        id: 'home1',
        name: 'Home',
        cameras: [{
          id: 'cam1',
          name: 'Test Camera',
          type: 'NACamera',
          status: 'on',
          vpn_url: 'https://vpn.test.com',
          is_local: true,
          local_url: 'http://192.168.1.10',
          sd_status: 'on',
        }],
      }] as any[];

      const result = parseCameras(input);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('cam1');
      expect(result[0].name).toBe('Test Camera');
      expect(result[0].type).toBe('NACamera');
      expect(result[0].status).toBe('on');
      expect(result[0].vpn_url).toBe('https://vpn.test.com');
      expect(result[0].is_local).toBe(true);
      expect(result[0].local_url).toBe('http://192.168.1.10');
      expect(result[0].sd_status).toBe('on');
    });

    it('should filter out undefined optional properties', () => {
      const input = [{
        id: 'home1',
        cameras: [{
          id: 'cam1',
          name: 'Camera',
          type: 'NOC',
          status: 'off',
          // No vpn_url, local_url, etc.
        }],
      }] as any[];

      const result = parseCameras(input);

      expect(result[0]).not.toHaveProperty('vpn_url');
      expect(result[0]).not.toHaveProperty('local_url');
      expect(result[0]).not.toHaveProperty('sd_status');
    });

    it('should handle Presence camera with light_mode_status', () => {
      const input = [{
        id: 'home1',
        cameras: [{
          id: 'cam2',
          name: 'Outdoor',
          type: 'NOC',
          status: 'on',
          light_mode_status: 'auto',
        }],
      }] as any[];

      const result = parseCameras(input);

      expect(result[0].light_mode_status).toBe('auto');
    });
  });

  describe('parsePersons', () => {
    it('should return empty array for empty input', () => {
      expect(parsePersons([])).toEqual([]);
      expect(parsePersons(null)).toEqual([]);
    });

    it('should parse persons correctly', () => {
      const input = [{
        id: 'home1',
        persons: [{
          id: 'person1',
          pseudo: 'John',
          last_seen: 1704067200,
          out_of_sight: false,
          face: {
            id: 'face1',
            key: 'abc123',
          },
        }],
      }] as any[];

      const result = parsePersons(input);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('person1');
      expect(result[0].name).toBe('John');
      expect(result[0].last_seen).toBe(1704067200);
      expect(result[0].out_of_sight).toBe(false);
      expect(result[0].face).toEqual({ id: 'face1', key: 'abc123' });
    });

    it('should handle person without pseudo', () => {
      const input = [{
        id: 'home1',
        persons: [{
          id: 'person2',
          last_seen: 1704067200,
        }],
      }] as any[];

      const result = parsePersons(input);

      expect(result[0].name).toBe('Sconosciuto');
    });
  });

  describe('parseEvents', () => {
    it('should return empty array for empty input', () => {
      expect(parseEvents([])).toEqual([]);
      expect(parseEvents(null)).toEqual([]);
    });

    it('should parse events correctly', () => {
      const input = [{
        id: 'event1',
        type: 'person',
        time: 1704067200,
        camera_id: 'cam1',
        person_id: 'person1',
        snapshot: {
          id: 'snap1',
          key: 'snapkey1',
        },
        video_id: 'video1',
        video_status: 'available',
      }];

      const result = parseEvents(input);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('event1');
      expect(result[0].type).toBe('person');
      expect(result[0].time).toBe(1704067200);
      expect(result[0].camera_id).toBe('cam1');
      expect(result[0].person_id).toBe('person1');
      expect(result[0].snapshot).toEqual({ id: 'snap1', key: 'snapkey1' });
      expect(result[0].video_id).toBe('video1');
      expect(result[0].video_status).toBe('available');
    });

    it('should filter out undefined optional properties', () => {
      const input = [{
        id: 'event2',
        type: 'movement',
        time: 1704067200,
        camera_id: 'cam1',
      }];

      const result = parseEvents(input);

      expect(result[0]).not.toHaveProperty('person_id');
      expect(result[0]).not.toHaveProperty('snapshot');
      expect(result[0]).not.toHaveProperty('video_id');
    });
  });

  describe('getSnapshotUrl', () => {
    it('should return VPN URL by default', () => {
      const camera = {
        vpn_url: 'https://vpn.test.com',
        local_url: 'http://192.168.1.10',
        is_local: true,
      } as any;

      const url = getSnapshotUrl(camera, false);
      expect(url).toBe('https://vpn.test.com/live/snapshot_720.jpg');
    });

    it('should return local URL when preferred and available', () => {
      const camera = {
        vpn_url: 'https://vpn.test.com',
        local_url: 'http://192.168.1.10',
        is_local: true,
      } as any;

      const url = getSnapshotUrl(camera, true);
      expect(url).toBe('http://192.168.1.10/live/snapshot_720.jpg');
    });

    it('should fall back to VPN URL when local not available', () => {
      const camera = {
        vpn_url: 'https://vpn.test.com',
        is_local: false,
      } as any;

      const url = getSnapshotUrl(camera, true);
      expect(url).toBe('https://vpn.test.com/live/snapshot_720.jpg');
    });

    it('should return null when no URL available', () => {
      const camera = {} as any;

      const url = getSnapshotUrl(camera, false);
      expect(url).toBeNull();
    });
  });

  describe('getEventSnapshotUrl', () => {
    it('should return snapshot URL for event', () => {
      const event = {
        snapshot: {
          id: 'snap123',
          key: 'key456',
        },
      } as any;

      const url = getEventSnapshotUrl(event);
      expect(url).toBe('https://api.netatmo.com/api/getcamerapicture?image_id=snap123&key=key456');
    });

    it('should return null when no snapshot', () => {
      const event = {} as any;
      const url = getEventSnapshotUrl(event);
      expect(url).toBeNull();
    });
  });

  describe('getCameraTypeName', () => {
    it('should return correct type names', () => {
      expect(getCameraTypeName('NACamera')).toBe('Welcome (Indoor)');
      expect(getCameraTypeName('NOC')).toBe('Presence (Outdoor)');
      expect(getCameraTypeName('NDB')).toBe('Doorbell');
    });

    it('should return type as fallback for unknown types', () => {
      expect(getCameraTypeName('UNKNOWN')).toBe('UNKNOWN');
      expect(getCameraTypeName(null)).toBe('Camera');
      expect(getCameraTypeName(undefined)).toBe('Camera');
    });
  });

  describe('getEventTypeName', () => {
    it('should return correct event type names in Italian', () => {
      expect(getEventTypeName('person')).toBe('Persona riconosciuta');
      expect(getEventTypeName('movement')).toBe('Movimento');
      expect(getEventTypeName('human')).toBe('Persona');
      expect(getEventTypeName('animal')).toBe('Animale');
      expect(getEventTypeName('vehicle')).toBe('Veicolo');
      expect(getEventTypeName('outdoor')).toBe('Movimento esterno');
    });

    it('should return type as fallback for unknown types', () => {
      expect(getEventTypeName('unknown')).toBe('unknown');
      expect(getEventTypeName(null)).toBe('Evento');
    });
  });

  describe('getEventIcon', () => {
    it('should return correct emoji icons', () => {
      expect(getEventIcon('person')).toBe('👤');
      expect(getEventIcon('human')).toBe('🚶');
      expect(getEventIcon('animal')).toBe('🐾');
      expect(getEventIcon('vehicle')).toBe('🚗');
      expect(getEventIcon('movement')).toBe('📷');
      expect(getEventIcon('outdoor')).toBe('🌳');
    });

    it('should return camera icon for unknown types', () => {
      expect(getEventIcon('unknown')).toBe('📷');
      expect(getEventIcon(null)).toBe('📷');
    });
  });

  describe('default export', () => {
    it('should export all functions', () => {
      expect(NETATMO_CAMERA_API.parseCameras).toBe(parseCameras);
      expect(NETATMO_CAMERA_API.parsePersons).toBe(parsePersons);
      expect(NETATMO_CAMERA_API.parseEvents).toBe(parseEvents);
      expect(NETATMO_CAMERA_API.getSnapshotUrl).toBe(getSnapshotUrl);
      expect(NETATMO_CAMERA_API.getEventSnapshotUrl).toBe(getEventSnapshotUrl);
      expect(NETATMO_CAMERA_API.getCameraTypeName).toBe(getCameraTypeName);
      expect(NETATMO_CAMERA_API.getEventTypeName).toBe(getEventTypeName);
      expect(NETATMO_CAMERA_API.getEventIcon).toBe(getEventIcon);
    });
  });
});
