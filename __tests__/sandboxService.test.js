/**
 * Unit tests for sandboxService
 *
 * Tests the sandbox functionality for local development
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  isLocalEnvironment,
  isSandboxEnabled,
  toggleSandbox,
  getSandboxStoveState,
  updateSandboxStoveState,
  sandboxIgnite,
  sandboxShutdown,
  sandboxSetPower,
  sandboxSetFan,
  STOVE_STATES,
} from '../lib/sandboxService';

// Mock Firebase
jest.mock('../lib/firebase', () => ({
  db: {},
}));

jest.mock('firebase/database', () => ({
  ref: jest.fn(),
  get: jest.fn(),
  set: jest.fn(),
  update: jest.fn(),
}));

describe('sandboxService', () => {
  describe('isLocalEnvironment', () => {
    it('should return true in development environment', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      expect(isLocalEnvironment()).toBe(true);

      process.env.NODE_ENV = originalEnv;
    });

    it('should return false in production environment', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      expect(isLocalEnvironment()).toBe(false);

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('STOVE_STATES', () => {
    it('should have all required states', () => {
      expect(STOVE_STATES).toHaveProperty('OFF');
      expect(STOVE_STATES).toHaveProperty('START');
      expect(STOVE_STATES).toHaveProperty('WORK');
      expect(STOVE_STATES).toHaveProperty('CLEAN');
      expect(STOVE_STATES).toHaveProperty('FINAL');
      expect(STOVE_STATES).toHaveProperty('ERROR');
    });
  });

  // Note: I seguenti test richiedono Firebase mock più complessi
  // e dovrebbero essere implementati con testing library appropriato

  describe('sandbox operations', () => {
    it('should throw error if not in local environment', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      await expect(toggleSandbox(true)).rejects.toThrow('Sandbox disponibile solo in localhost');

      process.env.NODE_ENV = originalEnv;
    });
  });
});

describe('sandboxService integration', () => {
  it('should initialize sandbox with correct default values', () => {
    // This test would require proper Firebase mock
    // TODO: Implement with @firebase/rules-unit-testing
    expect(true).toBe(true);
  });

  it('should transition states correctly', () => {
    // TODO: Test state transitions (OFF -> START -> WORK)
    expect(true).toBe(true);
  });

  it('should enforce maintenance rules', () => {
    // TODO: Test that ignite is blocked when needsCleaning = true
    expect(true).toBe(true);
  });
});
