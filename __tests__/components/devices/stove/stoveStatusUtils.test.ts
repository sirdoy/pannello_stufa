/**
 * Tests for stoveStatusUtils
 *
 * Pure function tests - no mocking needed, no renderHook.
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

    it('returns WORK status with ember colors and pulse', () => {
      const result = getStatusInfo('WORK PHASE 1');
      expect(result.label).toBe('IN FUNZIONE');
      expect(result.icon).toBe('🔥');
      expect(result.animated).toBe(true);
      expect(result.pulse).toBe(true);
      expect(result.textColor).toContain('ember');
    });

    it('returns OFF status with slate colors and no animation', () => {
      const result = getStatusInfo('OFF');
      expect(result.label).toBe('SPENTA');
      expect(result.icon).toBe('❄️');
      expect(result.animated).toBe(false);
      expect(result.pulse).toBeUndefined();
      expect(result.textColor).toContain('slate');
    });

    it('returns START status with ocean colors and pulse', () => {
      const result = getStatusInfo('STARTING UP');
      expect(result.label).toBe('AVVIO IN CORSO');
      expect(result.icon).toBe('🚀');
      expect(result.animated).toBe(true);
      expect(result.pulse).toBe(true);
      expect(result.textColor).toContain('ocean');
    });

    it('returns STANDBY status with warning colors', () => {
      const result = getStatusInfo('STANDBY');
      expect(result.label).toBe('IN ATTESA');
      expect(result.icon).toBe('💤');
      expect(result.animated).toBe(true);
      expect(result.textColor).toContain('warning');
    });

    it('returns WAIT status with warning colors', () => {
      const result = getStatusInfo('WAIT');
      expect(result.label).toBe('IN ATTESA');
      expect(result.icon).toBe('💤');
      expect(result.textColor).toContain('warning');
    });

    it('returns ERROR status with danger colors and pulse', () => {
      const result = getStatusInfo('ERROR CODE 5');
      expect(result.label).toBe('ERRORE');
      expect(result.icon).toBe('⚠️');
      expect(result.animated).toBe(true);
      expect(result.pulse).toBe(true);
      expect(result.textColor).toContain('danger');
    });

    it('returns ALARM status with danger colors', () => {
      const result = getStatusInfo('ALARM 7');
      expect(result.label).toBe('ERRORE');
      expect(result.icon).toBe('⚠️');
      expect(result.pulse).toBe(true);
    });

    it('returns CLEAN status with sage colors and pulse', () => {
      const result = getStatusInfo('CLEANING');
      expect(result.label).toBe('PULIZIA');
      expect(result.icon).toBe('🔄');
      expect(result.animated).toBe(true);
      expect(result.pulse).toBe(true);
      expect(result.textColor).toContain('sage');
    });

    it('returns MODULATION status with ocean colors', () => {
      const result = getStatusInfo('MODULATION');
      expect(result.label).toBe('MODULAZIONE');
      expect(result.icon).toBe('🌡️');
      expect(result.animated).toBe(true);
      expect(result.textColor).toContain('ocean');
    });

    it('returns unknown status as-is with slate colors', () => {
      const result = getStatusInfo('UNKNOWN_STATUS');
      expect(result.label).toBe('UNKNOWN_STATUS');
      expect(result.icon).toBe('❔');
      expect(result.animated).toBe(false);
      expect(result.textColor).toContain('slate');
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

    it('returns ember variant for WORK status', () => {
      const result = getStatusDisplay('WORK PHASE 2');
      expect(result.label).toBe('IN FUNZIONE');
      expect(result.variant).toBe('ember');
      expect(result.pulse).toBe(true);
      expect(result.health).toBe('ok');
    });

    it('returns neutral variant for OFF status', () => {
      const result = getStatusDisplay('OFF');
      expect(result.label).toBe('SPENTA');
      expect(result.variant).toBe('neutral');
      expect(result.pulse).toBe(false);
      expect(result.health).toBe('ok');
    });

    it('returns ocean variant for START status', () => {
      const result = getStatusDisplay('START');
      expect(result.variant).toBe('ocean');
      expect(result.pulse).toBe(true);
    });

    it('returns warning variant and health for STANDBY', () => {
      const result = getStatusDisplay('STANDBY');
      expect(result.variant).toBe('warning');
      expect(result.health).toBe('warning');
      expect(result.pulse).toBe(true);
    });

    it('returns danger variant and error health for ERROR', () => {
      const result = getStatusDisplay('ERROR 3');
      expect(result.variant).toBe('danger');
      expect(result.health).toBe('error');
      expect(result.pulse).toBe(true);
    });

    it('returns sage variant for CLEAN status', () => {
      const result = getStatusDisplay('CLEAN');
      expect(result.variant).toBe('sage');
      expect(result.health).toBe('ok');
    });

    it('returns ocean variant for MODULATION', () => {
      const result = getStatusDisplay('MODULATION');
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
    it('returns true for WORK status', () => {
      expect(isStoveActive('WORK PHASE 1')).toBe(true);
    });

    it('returns true for START status', () => {
      expect(isStoveActive('STARTING UP')).toBe(true);
    });

    it('returns false for OFF status', () => {
      expect(isStoveActive('OFF')).toBe(false);
    });

    it('returns false for ERROR status', () => {
      expect(isStoveActive('ERROR 5')).toBe(false);
    });

    it('returns false for STANDBY status', () => {
      expect(isStoveActive('STANDBY')).toBe(false);
    });
  });

  describe('isStoveOff', () => {
    it('returns true for OFF status', () => {
      expect(isStoveOff('OFF')).toBe(true);
    });

    it('returns true for ERROR status', () => {
      expect(isStoveOff('ERROR CODE 5')).toBe(true);
    });

    it('returns true for WAIT status', () => {
      expect(isStoveOff('WAIT')).toBe(true);
    });

    it('returns false for WORK status', () => {
      expect(isStoveOff('WORK PHASE 2')).toBe(false);
    });

    it('returns false for START status', () => {
      expect(isStoveOff('STARTING')).toBe(false);
    });

    it('returns false for STANDBY status', () => {
      expect(isStoveOff('STANDBY')).toBe(false);
    });
  });
});
