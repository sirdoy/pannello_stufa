/**
 * Tests for stoveStatusUtils
 *
 * Pure function tests - no mocking needed, no renderHook.
 * Uses proxy stove_state strings (exact equality).
 */

import {
  getStatusInfo,
  getStatusDisplay,
  getStatusGlow,
  isStoveActive,
  isStoveOff,
} from '@/app/components/devices/stove/stoveStatusUtils';

describe('stoveStatusUtils', () => {
  describe('getStatusInfo', () => {
    it('returns loading state for null status', () => {
      const result = getStatusInfo(null);
      expect(result.label).toBe('CARICAMENTO...');
      expect(result.icon).toBe('⏳');
      expect(result.animated).toBe(true);
    });

    it('returns working status with ember colors and pulse', () => {
      const result = getStatusInfo('working');
      expect(result.label).toBe('IN FUNZIONE');
      expect(result.icon).toBe('🔥');
      expect(result.animated).toBe(true);
      expect(result.pulse).toBe(true);
      expect(result.textColor).toContain('ember');
    });

    it('returns off status with slate colors and no animation', () => {
      const result = getStatusInfo('off');
      expect(result.label).toBe('SPENTA');
      expect(result.icon).toBe('❄️');
      expect(result.animated).toBe(false);
      expect(result.pulse).toBeUndefined();
      expect(result.textColor).toContain('slate');
    });

    it('returns igniting status with ocean colors and pulse', () => {
      const result = getStatusInfo('igniting');
      expect(result.label).toBe('AVVIO IN CORSO');
      expect(result.icon).toBe('🚀');
      expect(result.animated).toBe(true);
      expect(result.pulse).toBe(true);
      expect(result.textColor).toContain('ocean');
    });

    it('returns standby status with warning colors', () => {
      const result = getStatusInfo('standby');
      expect(result.label).toBe('IN ATTESA');
      expect(result.icon).toBe('💤');
      expect(result.animated).toBe(true);
      expect(result.textColor).toContain('warning');
    });

    it('returns alarm status with danger colors and pulse', () => {
      const result = getStatusInfo('alarm');
      expect(result.label).toBe('ERRORE');
      expect(result.icon).toBe('⚠️');
      expect(result.animated).toBe(true);
      expect(result.pulse).toBe(true);
      expect(result.textColor).toContain('danger');
    });

    it('returns cleaning status with sage colors and pulse', () => {
      const result = getStatusInfo('cleaning');
      expect(result.label).toBe('PULIZIA');
      expect(result.icon).toBe('🔄');
      expect(result.animated).toBe(true);
      expect(result.pulse).toBe(true);
      expect(result.textColor).toContain('sage');
    });

    it('returns modulating status with ocean colors', () => {
      const result = getStatusInfo('modulating');
      expect(result.label).toBe('MODULAZIONE');
      expect(result.icon).toBe('🌡️');
      expect(result.animated).toBe(true);
      expect(result.textColor).toContain('ocean');
    });
  });

  describe('getStatusDisplay', () => {
    it('returns loading display for null status', () => {
      const result = getStatusDisplay(null);
      expect(result.label).toBe('CARICAMENTO...');
      expect(result.variant).toBe('neutral');
      expect(result.pulse).toBe(true);
      expect(result.health).toBe('ok');
    });

    it('returns ember variant for working status', () => {
      const result = getStatusDisplay('working');
      expect(result.label).toBe('IN FUNZIONE');
      expect(result.variant).toBe('ember');
      expect(result.pulse).toBe(true);
      expect(result.health).toBe('ok');
    });

    it('returns neutral variant for off status', () => {
      const result = getStatusDisplay('off');
      expect(result.label).toBe('SPENTA');
      expect(result.variant).toBe('neutral');
      expect(result.pulse).toBe(false);
      expect(result.health).toBe('ok');
    });

    it('returns ocean variant for igniting status', () => {
      const result = getStatusDisplay('igniting');
      expect(result.variant).toBe('ocean');
      expect(result.pulse).toBe(true);
    });

    it('returns warning variant and health for standby', () => {
      const result = getStatusDisplay('standby');
      expect(result.variant).toBe('warning');
      expect(result.health).toBe('warning');
      expect(result.pulse).toBe(true);
    });

    it('returns danger variant and error health for alarm', () => {
      const result = getStatusDisplay('alarm');
      expect(result.variant).toBe('danger');
      expect(result.health).toBe('error');
      expect(result.pulse).toBe(true);
    });

    it('returns sage variant for cleaning status', () => {
      const result = getStatusDisplay('cleaning');
      expect(result.variant).toBe('sage');
      expect(result.health).toBe('ok');
    });

    it('returns ocean variant for modulating status', () => {
      const result = getStatusDisplay('modulating');
      expect(result.variant).toBe('ocean');
      expect(result.pulse).toBe(true);
    });
  });

  describe('getStatusGlow', () => {
    it('returns ember glow for ember variant', () => {
      const result = getStatusGlow('ember');
      expect(result).toBe('shadow-ember-glow');
    });

    it('returns sage glow for sage variant', () => {
      const result = getStatusGlow('sage');
      expect(result).toContain('shadow-[0_0_20px_rgba(96,115,96,0.3)]');
    });

    it('returns ocean glow for ocean variant', () => {
      const result = getStatusGlow('ocean');
      expect(result).toContain('shadow-[0_0_30px_rgba(67,125,174,0.3)]');
    });

    it('returns warning glow for warning variant', () => {
      const result = getStatusGlow('warning');
      expect(result).toContain('shadow-[0_0_20px_rgba(234,179,8,0.2)]');
    });

    it('returns danger glow for danger variant', () => {
      const result = getStatusGlow('danger');
      expect(result).toContain('shadow-[0_0_30px_rgba(239,68,68,0.3)]');
    });

    it('returns empty string for neutral variant', () => {
      const result = getStatusGlow('neutral');
      expect(result).toBe('');
    });

    it('returns empty string for unknown variant', () => {
      const result = getStatusGlow('unknown');
      expect(result).toBe('');
    });
  });

  describe('isStoveActive', () => {
    it('returns true for working status', () => {
      expect(isStoveActive('working')).toBe(true);
    });

    it('returns true for igniting status', () => {
      expect(isStoveActive('igniting')).toBe(true);
    });

    it('returns true for modulating status', () => {
      expect(isStoveActive('modulating')).toBe(true);
    });

    it('returns false for off status', () => {
      expect(isStoveActive('off')).toBe(false);
    });

    it('returns false for alarm status', () => {
      expect(isStoveActive('alarm')).toBe(false);
    });

    it('returns false for standby status', () => {
      expect(isStoveActive('standby')).toBe(false);
    });
  });

  describe('isStoveOff', () => {
    it('returns true for off status', () => {
      expect(isStoveOff('off')).toBe(true);
    });

    it('returns true for alarm status', () => {
      expect(isStoveOff('alarm')).toBe(true);
    });

    it('returns true for standby status', () => {
      expect(isStoveOff('standby')).toBe(true);
    });

    it('returns false for working status', () => {
      expect(isStoveOff('working')).toBe(false);
    });

    it('returns false for igniting status', () => {
      expect(isStoveOff('igniting')).toBe(false);
    });

    it('returns false for modulating status', () => {
      expect(isStoveOff('modulating')).toBe(false);
    });
  });
});
