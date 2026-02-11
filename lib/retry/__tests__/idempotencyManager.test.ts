import { idempotencyManager, IdempotencyManager } from '../idempotencyManager';
import { ref, get, set, remove } from 'firebase/database';
import { db } from '@/lib/firebase';

// Mock Firebase database functions
jest.mock('firebase/database', () => ({
  ref: jest.fn(),
  get: jest.fn(),
  set: jest.fn(),
  remove: jest.fn(),
}));

// Mock Firebase client
jest.mock('@/lib/firebase', () => ({
  db: {},
}));

describe('IdempotencyManager', () => {
  let manager: IdempotencyManager;
  const mockRef = jest.mocked(ref);
  const mockGet = jest.mocked(get);
  const mockSet = jest.mocked(set);
  const mockRemove = jest.mocked(remove);

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    manager = new IdempotencyManager();

    // Mock ref to return a reference object
    mockRef.mockReturnValue({} as any);
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
      mockGet.mockResolvedValue({
        exists: () => false,
        val: () => null,
      } as any);

      const key = await manager.registerKey('/api/stove/ignite', { temperature: 20 });

      expect(key).toBeTruthy();
      expect(key).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
      expect(mockSet).toHaveBeenCalledTimes(2); // keys/{key} and lookup/{hash}
    });

    it('returns the SAME key when called again with same endpoint+body within TTL', async () => {
      const existingKey = 'existing-uuid-key';
      const now = Date.now();

      // First call - lookup returns nothing
      mockGet.mockResolvedValueOnce({
        exists: () => false,
        val: () => null,
      } as any);

      const firstKey = await manager.registerKey('/api/stove/ignite', { temperature: 20 });

      // Setup mock for second call - lookup returns existing key
      mockGet.mockResolvedValueOnce({
        exists: () => true,
        val: () => ({
          key: firstKey,
          expiresAt: now + 3600000, // Not expired
        }),
      } as any);

      const secondKey = await manager.registerKey('/api/stove/ignite', { temperature: 20 });

      expect(secondKey).toBe(firstKey);
    });

    it('returns a NEW key when the existing key has expired', async () => {
      const expiredKey = 'expired-uuid-key';
      const now = Date.now();

      // First call - lookup returns expired key
      mockGet.mockResolvedValueOnce({
        exists: () => true,
        val: () => ({
          key: expiredKey,
          expiresAt: now - 1000, // Expired
        }),
      } as any);

      const newKey = await manager.registerKey('/api/stove/ignite', { temperature: 20 });

      expect(newKey).not.toBe(expiredKey);
      expect(newKey).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    });

    it('stores key in Firebase RTDB at idempotency/keys/{key} path', async () => {
      mockGet.mockResolvedValue({
        exists: () => false,
        val: () => null,
      } as any);

      const key = await manager.registerKey('/api/stove/ignite', { temperature: 20 });

      expect(mockRef).toHaveBeenCalledWith(db, `idempotency/keys/${key}`);
      expect(mockSet).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          key,
          endpoint: '/api/stove/ignite',
          bodyHash: expect.any(String),
          createdAt: expect.any(Number),
          expiresAt: expect.any(Number),
        })
      );
    });

    it('stores lookup entry at idempotency/lookup/{hash} path', async () => {
      mockGet.mockResolvedValue({
        exists: () => false,
        val: () => null,
      } as any);

      await manager.registerKey('/api/stove/ignite', { temperature: 20 });

      // Should create a lookup entry
      const lookupCalls = mockRef.mock.calls.filter(call =>
        call[1]?.toString().includes('idempotency/lookup/')
      );
      expect(lookupCalls.length).toBeGreaterThan(0);
    });

    it('stores keys with endpoint, bodyHash, createdAt, and expiresAt fields', async () => {
      const now = Date.now();
      jest.setSystemTime(now);

      mockGet.mockResolvedValue({
        exists: () => false,
        val: () => null,
      } as any);

      await manager.registerKey('/api/stove/ignite', { temperature: 20 });

      expect(mockSet).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          key: expect.any(String),
          endpoint: '/api/stove/ignite',
          bodyHash: expect.any(String),
          createdAt: now,
          expiresAt: now + 3600000, // 1 hour TTL
        })
      );
    });

    it('TTL defaults to 1 hour (3600000ms)', async () => {
      const now = Date.now();
      jest.setSystemTime(now);

      mockGet.mockResolvedValue({
        exists: () => false,
        val: () => null,
      } as any);

      await manager.registerKey('/api/stove/ignite', { temperature: 20 });

      expect(mockSet).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          expiresAt: now + 3600000,
        })
      );
    });
  });

  describe('cleanupExpired', () => {
    it('removes keys where Date.now() > expiresAt', async () => {
      const now = Date.now();
      jest.setSystemTime(now);

      const expiredKey1 = 'expired-1';
      const expiredKey2 = 'expired-2';

      // Mock get for keys path
      mockGet.mockResolvedValueOnce({
        exists: () => true,
        val: () => ({
          [expiredKey1]: {
            key: expiredKey1,
            expiresAt: now - 1000,
          },
          [expiredKey2]: {
            key: expiredKey2,
            expiresAt: now - 2000,
          },
        }),
      } as any);

      const count = await manager.cleanupExpired();

      expect(count).toBe(2);
      expect(mockRemove).toHaveBeenCalledTimes(2);
    });

    it('does NOT remove keys that are still valid', async () => {
      const now = Date.now();
      jest.setSystemTime(now);

      const validKey = 'valid-key';
      const expiredKey = 'expired-key';

      mockGet.mockResolvedValueOnce({
        exists: () => true,
        val: () => ({
          [validKey]: {
            key: validKey,
            expiresAt: now + 1000, // Still valid
          },
          [expiredKey]: {
            key: expiredKey,
            expiresAt: now - 1000, // Expired
          },
        }),
      } as any);

      const count = await manager.cleanupExpired();

      expect(count).toBe(1);
      expect(mockRemove).toHaveBeenCalledTimes(1);
    });
  });
});
