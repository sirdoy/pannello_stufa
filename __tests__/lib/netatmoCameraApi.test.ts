/**
 * Unit tests for Camera Display Helpers
 * Tests display utility functions for camera type names, event type names, and icons.
 */

import NETATMO_CAMERA_API, {
  getCameraTypeName,
  getEventTypeName,
  getEventIcon,
  getSubTypeName,
  getSubTypeIcon,
} from '@/lib/netatmo/netatmoCameraApi';

describe('netatmoCameraApi display helpers', () => {
  describe('getCameraTypeName', () => {
    it('should return correct type names', () => {
      expect(getCameraTypeName('NACamera')).toBe('Welcome (Indoor)');
      expect(getCameraTypeName('NOC')).toBe('Presence (Outdoor)');
      expect(getCameraTypeName('NDB')).toBe('Doorbell');
    });

    it('should return type as fallback for unknown types', () => {
      expect(getCameraTypeName('UNKNOWN')).toBe('UNKNOWN');
      expect(getCameraTypeName(null as any)).toBe('Camera');
      expect(getCameraTypeName(undefined as any)).toBe('Camera');
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
      expect(getEventTypeName(null as any)).toBe('Evento');
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
      expect(getEventIcon(null as any)).toBe('📷');
    });
  });

  describe('getSubTypeName', () => {
    it('should return correct sub-type names', () => {
      expect(getSubTypeName(1)).toBe('Persona');
      expect(getSubTypeName(2)).toBe('Animale');
      expect(getSubTypeName(3)).toBe('Veicolo');
    });

    it('should return null for unknown sub-types', () => {
      expect(getSubTypeName(0)).toBeNull();
      expect(getSubTypeName(99)).toBeNull();
    });
  });

  describe('getSubTypeIcon', () => {
    it('should return correct sub-type icons', () => {
      expect(getSubTypeIcon(1)).toBe('🚶');
      expect(getSubTypeIcon(2)).toBe('🐾');
      expect(getSubTypeIcon(3)).toBe('🚗');
    });

    it('should return null for unknown sub-types', () => {
      expect(getSubTypeIcon(0)).toBeNull();
      expect(getSubTypeIcon(99)).toBeNull();
    });
  });

  describe('default export', () => {
    it('should export all 5 display helper functions', () => {
      expect(NETATMO_CAMERA_API.getCameraTypeName).toBe(getCameraTypeName);
      expect(NETATMO_CAMERA_API.getEventTypeName).toBe(getEventTypeName);
      expect(NETATMO_CAMERA_API.getEventIcon).toBe(getEventIcon);
      expect(NETATMO_CAMERA_API.getSubTypeName).toBe(getSubTypeName);
      expect(NETATMO_CAMERA_API.getSubTypeIcon).toBe(getSubTypeIcon);
    });

    it('should not export deleted API functions', () => {
      expect((NETATMO_CAMERA_API as any).getCamerasData).toBeUndefined();
      expect((NETATMO_CAMERA_API as any).parseCameras).toBeUndefined();
      expect((NETATMO_CAMERA_API as any).getLiveStreamUrl).toBeUndefined();
      expect((NETATMO_CAMERA_API as any).getEventSnapshotUrl).toBeUndefined();
    });
  });
});
