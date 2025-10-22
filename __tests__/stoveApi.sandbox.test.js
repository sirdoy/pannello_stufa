/**
 * Unit tests for stoveApi sandbox integration
 *
 * Tests that API calls are correctly intercepted in sandbox mode
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';

// Mock sandboxService before importing stoveApi
jest.mock('../lib/sandboxService', () => ({
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

import * as sandboxService from '../lib/sandboxService';

describe('stoveApi with sandbox', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getStoveStatus', () => {
    it('should use sandbox when enabled in localhost', async () => {
      sandboxService.isLocalEnvironment.mockReturnValue(true);
      sandboxService.isSandboxEnabled.mockResolvedValue(true);
      sandboxService.getSandboxStoveState.mockResolvedValue({
        status: 'WORK',
        fan: 3,
        power: 4,
        temperature: 50,
      });

      const result = await getStoveStatus();

      expect(sandboxService.getSandboxStoveState).toHaveBeenCalled();
      expect(result).toEqual({
        status: 'WORK',
        fan: 3,
        power: 4,
        temperature: 50,
        isSandbox: true,
      });
    });

    it('should use real API when sandbox disabled', async () => {
      sandboxService.isLocalEnvironment.mockReturnValue(true);
      sandboxService.isSandboxEnabled.mockResolvedValue(false);

      // Mock fetch for real API call
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ StatusDescription: 'OFF' }),
        })
      );

      const result = await getStoveStatus();

      expect(sandboxService.getSandboxStoveState).not.toHaveBeenCalled();
      expect(result.isSandbox).toBe(false);
    });

    it('should use real API in production', async () => {
      sandboxService.isLocalEnvironment.mockReturnValue(false);

      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ StatusDescription: 'OFF' }),
        })
      );

      const result = await getStoveStatus();

      expect(sandboxService.isSandboxEnabled).not.toHaveBeenCalled();
      expect(result.isSandbox).toBe(false);
    });
  });

  describe('igniteStove', () => {
    it('should use sandbox ignite when enabled', async () => {
      sandboxService.isLocalEnvironment.mockReturnValue(true);
      sandboxService.isSandboxEnabled.mockResolvedValue(true);
      sandboxService.sandboxIgnite.mockResolvedValue({ success: true });

      const result = await igniteStove(4);

      expect(sandboxService.sandboxIgnite).toHaveBeenCalledWith(4);
      expect(result).toEqual({ success: true });
    });
  });

  describe('shutdownStove', () => {
    it('should use sandbox shutdown when enabled', async () => {
      sandboxService.isLocalEnvironment.mockReturnValue(true);
      sandboxService.isSandboxEnabled.mockResolvedValue(true);
      sandboxService.sandboxShutdown.mockResolvedValue({ success: true });

      const result = await shutdownStove();

      expect(sandboxService.sandboxShutdown).toHaveBeenCalled();
      expect(result).toEqual({ success: true });
    });
  });

  describe('setPowerLevel', () => {
    it('should use sandbox setPower when enabled', async () => {
      sandboxService.isLocalEnvironment.mockReturnValue(true);
      sandboxService.isSandboxEnabled.mockResolvedValue(true);
      sandboxService.sandboxSetPower.mockResolvedValue({ success: true });

      const result = await setPowerLevel(3);

      expect(sandboxService.sandboxSetPower).toHaveBeenCalledWith(3);
      expect(result).toEqual({ success: true });
    });

    it('should throw error for invalid power level', async () => {
      await expect(setPowerLevel(0)).rejects.toThrow('Potenza deve essere tra 1 e 5');
      await expect(setPowerLevel(6)).rejects.toThrow('Potenza deve essere tra 1 e 5');
    });
  });

  describe('setFanLevel', () => {
    it('should use sandbox setFan when enabled', async () => {
      sandboxService.isLocalEnvironment.mockReturnValue(true);
      sandboxService.isSandboxEnabled.mockResolvedValue(true);
      sandboxService.sandboxSetFan.mockResolvedValue({ success: true });

      const result = await setFanLevel(2);

      expect(sandboxService.sandboxSetFan).toHaveBeenCalledWith(2);
      expect(result).toEqual({ success: true });
    });

    it('should throw error for invalid fan level', async () => {
      await expect(setFanLevel(-1)).rejects.toThrow('Ventola deve essere tra 0 e 5');
      await expect(setFanLevel(6)).rejects.toThrow('Ventola deve essere tra 0 e 5');
    });
  });
});
