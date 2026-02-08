/**
 * Unit tests for stoveApi sandbox integration
 *
 * Tests that API calls are correctly intercepted in sandbox mode
 */

import { describe, it, expect, beforeEach } from '@jest/globals';

// Mock sandboxService before importing stoveApi
jest.mock('../lib/sandboxService', () => ({
  STOVE_STATES: {
    OFF: 'OFF',
    START: 'START',
    WORK: 'WORK',
    CLEAN: 'CLEAN',
    FINAL: 'FINAL',
    ERROR: 'ERROR',
  },
  SANDBOX_ERRORS: {
    NONE: null,
    HIGH_TEMP: { code: 'AL01', description: 'Temperatura troppo alta' },
    LOW_PRESSURE: { code: 'AL02', description: 'Pressione insufficiente' },
    IGNITION_FAIL: { code: 'AL03', description: 'Accensione fallita' },
    PELLET_JAM: { code: 'AL04', description: 'Inceppamento pellet' },
    CLEANING_NEEDED: { code: 'AL05', description: 'Pulizia necessaria' },
  },
  isLocalEnvironment: jest.fn(),
  isSandboxEnabled: jest.fn(),
  getSandboxStoveState: jest.fn(),
  sandboxIgnite: jest.fn(),
  sandboxShutdown: jest.fn(),
  sandboxSetPower: jest.fn(),
  sandboxSetFan: jest.fn(),
}));

import {
  getStoveStatus,
  igniteStove,
  shutdownStove,
  setPowerLevel,
  setFanLevel,
} from '../lib/stoveApi';

import {
  isLocalEnvironment,
  isSandboxEnabled,
  getSandboxStoveState,
  sandboxIgnite,
  sandboxShutdown,
  sandboxSetPower,
  sandboxSetFan,
} from '../lib/sandboxService';

describe('stoveApi with sandbox', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getStoveStatus', () => {
    it('should use sandbox when enabled in localhost', async () => {
      (isLocalEnvironment as jest.Mock).mockReturnValue(true);
      (isSandboxEnabled as jest.Mock).mockResolvedValue(true);
      (getSandboxStoveState as jest.Mock).mockResolvedValue({
        status: 'WORK',
        fan: 3,
        power: 4,
        temperature: 50,
      });

      const result = await getStoveStatus();

      expect(getSandboxStoveState).toHaveBeenCalled();
      expect(result).toEqual({
        StatusDescription: 'WORK',
        Error: 0,
        ErrorDescription: '',
        isSandbox: true,
      });
    });

    it('should use real API when sandbox disabled', async () => {
      (isLocalEnvironment as jest.Mock).mockReturnValue(true);
      (isSandboxEnabled as jest.Mock).mockResolvedValue(false);

      // Mock fetch for real API call
      (global as any).fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ StatusDescription: 'OFF' }),
        })
      );

      const result = await getStoveStatus();

      expect(getSandboxStoveState).not.toHaveBeenCalled();
      expect(result.isSandbox).toBe(false);
    });

    it('should use real API in production', async () => {
      (isLocalEnvironment as jest.Mock).mockReturnValue(false);

      (global as any).fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ StatusDescription: 'OFF' }),
        })
      );

      const result = await getStoveStatus();

      expect(isSandboxEnabled).not.toHaveBeenCalled();
      expect(result.isSandbox).toBe(false);
    });
  });

  describe('igniteStove', () => {
    it('should use sandbox ignite when enabled', async () => {
      (isLocalEnvironment as jest.Mock).mockReturnValue(true);
      (isSandboxEnabled as jest.Mock).mockResolvedValue(true);
      (sandboxIgnite as jest.Mock).mockResolvedValue({ success: true });

      const result = await igniteStove(4);

      expect(sandboxIgnite).toHaveBeenCalledWith(4);
      expect(result).toEqual({ success: true });
    });
  });

  describe('shutdownStove', () => {
    it('should use sandbox shutdown when enabled', async () => {
      (isLocalEnvironment as jest.Mock).mockReturnValue(true);
      (isSandboxEnabled as jest.Mock).mockResolvedValue(true);
      (sandboxShutdown as jest.Mock).mockResolvedValue({ success: true });

      const result = await shutdownStove();

      expect(sandboxShutdown).toHaveBeenCalled();
      expect(result).toEqual({ success: true });
    });
  });

  describe('setPowerLevel', () => {
    it('should use sandbox setPower when enabled', async () => {
      (isLocalEnvironment as jest.Mock).mockReturnValue(true);
      (isSandboxEnabled as jest.Mock).mockResolvedValue(true);
      (sandboxSetPower as jest.Mock).mockResolvedValue({ success: true });

      const result = await setPowerLevel(3);

      expect(sandboxSetPower).toHaveBeenCalledWith(3);
      expect(result).toEqual({ success: true });
    });

    it('should throw error for invalid power level', async () => {
      await expect(setPowerLevel(0 as any)).rejects.toThrow('Potenza deve essere tra 1 e 5');
      await expect(setPowerLevel(6 as any)).rejects.toThrow('Potenza deve essere tra 1 e 5');
    });
  });

  describe('setFanLevel', () => {
    it('should use sandbox setFan when enabled', async () => {
      (isLocalEnvironment as jest.Mock).mockReturnValue(true);
      (isSandboxEnabled as jest.Mock).mockResolvedValue(true);
      (sandboxSetFan as jest.Mock).mockResolvedValue({ success: true });

      const result = await setFanLevel(2);

      expect(sandboxSetFan).toHaveBeenCalledWith(2);
      expect(result).toEqual({ success: true });
    });

    it('should throw error for invalid fan level', async () => {
      await expect(setFanLevel(0)).rejects.toThrow('Ventola deve essere tra 1 e 6');
      await expect(setFanLevel(7)).rejects.toThrow('Ventola deve essere tra 1 e 6');
    });
  });
});
