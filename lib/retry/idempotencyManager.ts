/**
 * Represents an idempotency key record stored in memory.
 */
export interface IdempotencyRecord {
  key: string;
  endpoint: string;
  bodyHash: string;
  createdAt: number;
  expiresAt: number;
}

/**
 * Manages idempotency keys for device commands to prevent duplicate physical actions.
 *
 * Keys are stored in an in-memory Map with a 1-hour TTL. The same endpoint+body combination
 * within the TTL window returns the same idempotency key, preventing duplicate commands
 * from being executed on physical devices.
 *
 * The server-side `withIdempotency` middleware handles the actual dedup check
 * using Firebase RTDB via admin SDK. This client-side manager only ensures
 * rapid duplicate clicks get the same key.
 */
export class IdempotencyManager {
  private readonly TTL_MS = 60 * 60 * 1000; // 1 hour
  private readonly lookupCache = new Map<string, { key: string; expiresAt: number }>();
  private readonly keyCache = new Map<string, IdempotencyRecord>();

  /**
   * Generates a new UUID-based idempotency key.
   * @returns A UUID v4 string
   */
  generateKey(): string {
    return crypto.randomUUID();
  }

  /**
   * Registers or retrieves an idempotency key for a device command.
   *
   * If the same endpoint+body combination already has a non-expired key,
   * returns the existing key. Otherwise, generates and stores a new key.
   *
   * @param endpoint - The API endpoint (e.g., '/api/stove/ignite')
   * @param body - The request body object
   * @returns The idempotency key (existing or newly generated)
   */
  async registerKey(endpoint: string, body: Record<string, unknown>): Promise<string> {
    const bodyHash = this.createHash(endpoint, body);

    // Check if we already have a key for this combination
    const existing = this.lookupCache.get(bodyHash);
    if (existing) {
      const now = Date.now();
      // If key hasn't expired, return existing key
      if (existing.expiresAt > now) {
        return existing.key;
      }
      // Expired - clean up
      this.lookupCache.delete(bodyHash);
      this.keyCache.delete(existing.key);
    }

    // Generate new key
    const key = this.generateKey();
    const now = Date.now();
    const record: IdempotencyRecord = {
      key,
      endpoint,
      bodyHash,
      createdAt: now,
      expiresAt: now + this.TTL_MS,
    };

    // Store in both caches
    this.keyCache.set(key, record);
    this.lookupCache.set(bodyHash, { key, expiresAt: record.expiresAt });

    return key;
  }

  /**
   * Cleans up expired idempotency keys from memory.
   *
   * @returns The number of keys removed
   */
  async cleanupExpired(): Promise<number> {
    const now = Date.now();
    let removedCount = 0;

    for (const [keyId, record] of this.keyCache.entries()) {
      if (record.expiresAt <= now) {
        this.keyCache.delete(keyId);
        this.lookupCache.delete(record.bodyHash);
        removedCount++;
      }
    }

    return removedCount;
  }

  /**
   * Creates a sanitized hash from endpoint and body.
   *
   * @param endpoint - The API endpoint
   * @param body - The request body
   * @returns A hash string
   */
  private createHash(endpoint: string, body: Record<string, unknown>): string {
    const raw = `${endpoint}:${JSON.stringify(body)}`;
    return raw.replace(/[.$/[\]]/g, '_');
  }
}

/**
 * Singleton instance of IdempotencyManager for global use.
 */
export const idempotencyManager = new IdempotencyManager();
