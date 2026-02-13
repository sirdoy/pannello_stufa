import { IdempotencyManager } from '../idempotencyManager';

describe('IdempotencyManager', () => {
  let manager: IdempotencyManager;

  beforeEach(() => {
    jest.useFakeTimers();
    manager = new IdempotencyManager();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('generateKey', () => {
    it('returns a valid UUID string', () => {
      const key = manager.generateKey();
      // UUID v4 format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
      expect(key).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    });
  });

  describe('registerKey', () => {
    it('returns a new key for a fresh endpoint+body combination', async () => {
      const key = await manager.registerKey('/api/stove/ignite', { temperature: 20 });

      expect(key).toBeTruthy();
      expect(key).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    });

    it('returns the SAME key when called again with same endpoint+body within TTL', async () => {
      const firstKey = await manager.registerKey('/api/stove/ignite', { temperature: 20 });
      const secondKey = await manager.registerKey('/api/stove/ignite', { temperature: 20 });

      expect(secondKey).toBe(firstKey);
    });

    it('returns a NEW key when the existing key has expired', async () => {
      const now = Date.now();
      jest.setSystemTime(now);

      const firstKey = await manager.registerKey('/api/stove/ignite', { temperature: 20 });

      // Advance time past TTL (1 hour + 1ms)
      jest.setSystemTime(now + 3600001);

      const secondKey = await manager.registerKey('/api/stove/ignite', { temperature: 20 });

      expect(secondKey).not.toBe(firstKey);
      expect(secondKey).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    });

    it('returns different keys for different endpoints', async () => {
      const key1 = await manager.registerKey('/api/stove/ignite', { temperature: 20 });
      const key2 = await manager.registerKey('/api/stove/shutdown', { temperature: 20 });

      expect(key1).not.toBe(key2);
    });

    it('returns different keys for different bodies', async () => {
      const key1 = await manager.registerKey('/api/stove/ignite', { level: 1 });
      const key2 = await manager.registerKey('/api/stove/ignite', { level: 2 });

      expect(key1).not.toBe(key2);
    });

    it('stores keys with correct TTL (1 hour)', async () => {
      const now = Date.now();
      jest.setSystemTime(now);

      const firstKey = await manager.registerKey('/api/stove/ignite', { temperature: 20 });

      // Just before expiry - should still return same key
      jest.setSystemTime(now + 3599999);
      const sameKey = await manager.registerKey('/api/stove/ignite', { temperature: 20 });
      expect(sameKey).toBe(firstKey);

      // After expiry - should return new key
      jest.setSystemTime(now + 3600001);
      const newKey = await manager.registerKey('/api/stove/ignite', { temperature: 20 });
      expect(newKey).not.toBe(firstKey);
    });
  });

  describe('cleanupExpired', () => {
    it('removes keys where Date.now() > expiresAt', async () => {
      const now = Date.now();
      jest.setSystemTime(now);

      // Register two keys
      await manager.registerKey('/api/stove/ignite', { a: 1 });
      await manager.registerKey('/api/stove/shutdown', { b: 2 });

      // Advance past TTL
      jest.setSystemTime(now + 3600001);

      const count = await manager.cleanupExpired();
      expect(count).toBe(2);
    });

    it('does NOT remove keys that are still valid', async () => {
      const now = Date.now();
      jest.setSystemTime(now);

      // Register two keys
      await manager.registerKey('/api/stove/ignite', { a: 1 });
      await manager.registerKey('/api/stove/shutdown', { b: 2 });

      // Advance only 30 minutes (keys still valid)
      jest.setSystemTime(now + 1800000);

      const count = await manager.cleanupExpired();
      expect(count).toBe(0);
    });

    it('removes only expired keys, keeps valid ones', async () => {
      const now = Date.now();
      jest.setSystemTime(now);

      // Register first key
      await manager.registerKey('/api/stove/ignite', { a: 1 });

      // Advance 30 minutes
      jest.setSystemTime(now + 1800000);

      // Register second key (will expire 30min later than first)
      await manager.registerKey('/api/stove/shutdown', { b: 2 });

      // Advance to just past first key's expiry (60min from start)
      jest.setSystemTime(now + 3600001);

      const count = await manager.cleanupExpired();
      expect(count).toBe(1); // Only first key expired

      // Second key should still work
      const key = await manager.registerKey('/api/stove/shutdown', { b: 2 });
      expect(key).toBeTruthy();
    });

    it('returns 0 when no keys exist', async () => {
      const count = await manager.cleanupExpired();
      expect(count).toBe(0);
    });
  });
});
