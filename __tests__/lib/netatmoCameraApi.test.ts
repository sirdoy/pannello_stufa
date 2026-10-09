/**
 * Unit tests for Camera Display Helpers
 * Tests display utility functions for camera type names, event type names, and icons.
 */

import NETATMO_CAMERA_API, {
  getCameraTypeName,
  getEventTypeName,
  getSubTypeName,
} from '@/lib/netatmo/netatmoCameraApi';

/** Untyped runtime payloads may carry null/undefined: widen the parameter to exercise the fallbacks. */
const withNullableInput = (fn: (type: string) => string) =>
  fn as (type: string | null | undefined) => string;

describe('netatmoCameraApi display helpers', () => {
  describe('getCameraTypeName', () => {
    it('should return correct type names', () => {
      expect(getCameraTypeName('NACamera')).toBe('Welcome (Indoor)');
      expect(getCameraTypeName('NOC')).toBe('Presence (Outdoor)');
      expect(getCameraTypeName('NDB')).toBe('Doorbell');
    });

    it('should return type as fallback for unknown types', () => {
      expect(getCameraTypeName('UNKNOWN')).toBe('UNKNOWN');
      expect(withNullableInput(getCameraTypeName)(null)).toBe('Camera');
      expect(withNullableInput(getCameraTypeName)(undefined)).toBe('Camera');
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
      expect(withNullableInput(getEventTypeName)(null)).toBe('Evento');
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

  describe('default export', () => {
    it('should export the display helper functions', () => {
      expect(NETATMO_CAMERA_API.getCameraTypeName).toBe(getCameraTypeName);
      expect(NETATMO_CAMERA_API.getEventTypeName).toBe(getEventTypeName);
      expect(NETATMO_CAMERA_API.getSubTypeName).toBe(getSubTypeName);
    });

    it('should not export deleted API functions', () => {
      const api: Record<string, unknown> = { ...NETATMO_CAMERA_API };
      expect(api.getCamerasData).toBeUndefined();
      expect(api.parseCameras).toBeUndefined();
      expect(api.getLiveStreamUrl).toBeUndefined();
      expect(api.getEventSnapshotUrl).toBeUndefined();
    });
  });
});
