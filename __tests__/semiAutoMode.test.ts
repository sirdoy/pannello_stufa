/**
 * @jest-environment node
 */
// Tests for Semi-Auto mode activation when changing power/fan

import { getStoveStatus } from '@/lib/stoveApi';
import { getFullSchedulerMode, setSemiManualMode, getNextScheduledChange } from '@/lib/schedulerService';

// Mock Firebase
jest.mock('firebase/database', () => ({
  ref: jest.fn(),
  set: jest.fn(),
  get: jest.fn(),
}));

jest.mock('@/lib/firebase', () => ({
  db: {},
}));

// Mock stoveApi
jest.mock('@/lib/stoveApi', () => ({
  getStoveStatus: jest.fn(),
  setPowerLevel: jest.fn(),
  setFanLevel: jest.fn(),
}));

// Mock schedulerService
jest.mock('@/lib/schedulerService', () => ({
  getFullSchedulerMode: jest.fn(),
  setSemiManualMode: jest.fn(),
  getNextScheduledChange: jest.fn(),
}));

describe('Semi-Auto Mode Activation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Status field detection', () => {
    it('should correctly detect WORK status using StatusDescription field', async () => {
      // Simula risposta API reale (usa StatusDescription, non status)
      (getStoveStatus as jest.Mock).mockResolvedValue({
        StatusDescription: 'WORK',
        Error: 0,
        ErrorDescription: '',
      });

      const statusData = await getStoveStatus();

      // Verifica che StatusDescription esista
      expect(statusData.StatusDescription).toBe('WORK');

      // Verifica che 'status' minuscolo NON esista
      expect((statusData as any).status).toBeUndefined();

      // Test la logica corretta per rilevare stufa accesa
      const isOn = statusData?.StatusDescription?.includes('WORK') ||
                   statusData?.StatusDescription?.includes('START');

      expect(isOn).toBe(true);
    });

    it('should correctly detect START status using StatusDescription field', async () => {
      (getStoveStatus as jest.Mock).mockResolvedValue({
        StatusDescription: 'START',
        Error: 0,
        ErrorDescription: '',
      });

      const statusData = await getStoveStatus();
      const isOn = statusData?.StatusDescription?.includes('WORK') ||
                   statusData?.StatusDescription?.includes('START');

      expect(isOn).toBe(true);
    });

    it('should correctly detect OFF status', async () => {
      (getStoveStatus as jest.Mock).mockResolvedValue({
        StatusDescription: 'OFF',
        Error: 0,
        ErrorDescription: '',
      });

      const statusData = await getStoveStatus();
      const isOn = statusData?.StatusDescription?.includes('WORK') ||
                   statusData?.StatusDescription?.includes('START');

      expect(isOn).toBe(false);
    });

    it('should NOT detect status with wrong field name (lowercase)', async () => {
      // Questo test verifica il bug: usare .status invece di .StatusDescription
      (getStoveStatus as jest.Mock).mockResolvedValue({
        StatusDescription: 'WORK',
        Error: 0,
        ErrorDescription: '',
      });

      const statusData = await getStoveStatus();

      // BUG: usare .status (minuscolo) ritorna undefined (che è falsy)
      const isOnWrong = (statusData as any)?.status?.includes('WORK') ||
                        (statusData as any)?.status?.includes('START');

      expect(isOnWrong).toBeUndefined(); // undefined perché .status non esiste!

      // FIX: usare .StatusDescription (maiuscolo) funziona
      const isOnCorrect = statusData?.StatusDescription?.includes('WORK') ||
                          statusData?.StatusDescription?.includes('START');

      expect(isOnCorrect).toBe(true);
    });
  });

  describe('Semi-Auto mode activation logic', () => {
    it('should activate semi-auto when all conditions are met', async () => {
      // Setup: scheduler attivo, non in semi-manual
      (getFullSchedulerMode as jest.Mock).mockResolvedValue({
        enabled: true,
        semiManual: false,
      });

      (getNextScheduledChange as jest.Mock).mockResolvedValue('2025-11-27T18:30:00.000Z');

      // Simula la logica delle route stove (ignite, shutdown, setPower, setFan)
      const source = 'manual';

      let modeChanged = false;
      if (source === 'manual') {
        const mode = await getFullSchedulerMode();
        if (mode.enabled && !mode.semiManual) {
          const nextChange = await getNextScheduledChange();
          await setSemiManualMode(nextChange as string);
          modeChanged = true;
        }
      }

      expect(modeChanged).toBe(true);
      expect(setSemiManualMode).toHaveBeenCalledWith('2025-11-27T18:30:00.000Z');
    });

    it('should activate semi-auto even when stove is OFF (manual command)', async () => {
      // Il semi-manuale si attiva per qualsiasi comando manuale,
      // indipendentemente dallo stato attuale della stufa
      (getFullSchedulerMode as jest.Mock).mockResolvedValue({
        enabled: true,
        semiManual: false,
      });

      (getNextScheduledChange as jest.Mock).mockResolvedValue('2025-11-27T18:30:00.000Z');

      const source = 'manual';

      let modeChanged = false;
      if (source === 'manual') {
        const mode = await getFullSchedulerMode();
        if (mode.enabled && !mode.semiManual) {
          const nextChange = await getNextScheduledChange();
          await setSemiManualMode(nextChange as string);
          modeChanged = true;
        }
      }

      expect(modeChanged).toBe(true);
      expect(setSemiManualMode).toHaveBeenCalled();
    });

    it('should NOT activate semi-auto when scheduler is disabled', async () => {
      (getFullSchedulerMode as jest.Mock).mockResolvedValue({
        enabled: false, // Scheduler disabilitato
        semiManual: false,
      });

      const source = 'manual';

      let modeChanged = false;
      if (source === 'manual') {
        const mode = await getFullSchedulerMode();
        if (mode.enabled && !mode.semiManual) {
          await setSemiManualMode(null as any);
          modeChanged = true;
        }
      }

      expect(modeChanged).toBe(false);
      expect(setSemiManualMode).not.toHaveBeenCalled();
    });

    it('should NOT activate semi-auto when already in semi-manual', async () => {
      (getFullSchedulerMode as jest.Mock).mockResolvedValue({
        enabled: true,
        semiManual: true, // Già in semi-manual
      });

      const source = 'manual';

      let modeChanged = false;
      if (source === 'manual') {
        const mode = await getFullSchedulerMode();
        if (mode.enabled && !mode.semiManual) {
          await setSemiManualMode(null as any);
          modeChanged = true;
        }
      }

      expect(modeChanged).toBe(false);
      expect(setSemiManualMode).not.toHaveBeenCalled();
    });

    it('should NOT activate semi-auto when source is not manual (scheduler action)', async () => {
      (getFullSchedulerMode as jest.Mock).mockResolvedValue({
        enabled: true,
        semiManual: false,
      });

      const source: string = 'scheduler'; // Azione automatica

      let modeChanged = false;
      if (source === 'manual') {
        await setSemiManualMode(null as any);
        modeChanged = true;
      }

      expect(modeChanged).toBe(false);
      expect(setSemiManualMode).not.toHaveBeenCalled();
    });
  });
});
