import { ref, get, set, remove } from 'firebase/database';
import { db } from '@/lib/firebase';

/**
 * Represents an idempotency key record stored in Firebase RTDB.
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
 * Keys are stored in Firebase RTDB with a 1-hour TTL. The same endpoint+body combination
 * within the TTL window returns the same idempotency key, preventing duplicate commands
 * from being executed on physical devices.
 *
 * Storage structure:
 * - `idempotency/keys/{key}`: Full record with endpoint, body hash, timestamps
 * - `idempotency/lookup/{hash}`: Lookup entry mapping endpoint+body hash to key
 */
export class IdempotencyManager {
  private readonly TTL_MS = 60 * 60 * 1000; // 1 hour

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
    const lookupPath = `idempotency/lookup/${bodyHash}`;
    const lookupRef = ref(db, lookupPath);

    // Check if we already have a key for this combination
    const lookupSnapshot = await get(lookupRef);
    if (lookupSnapshot.exists()) {
      const lookupData = lookupSnapshot.val() as { key: string; expiresAt: number };
      const now = Date.now();

      // If key hasn't expired, return existing key
      if (lookupData.expiresAt > now) {
        return lookupData.key;
      }
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

    // Store in both locations
    const keyRef = ref(db, `idempotency/keys/${key}`);
    await set(keyRef, record);
    await set(lookupRef, { key, expiresAt: record.expiresAt });

    return key;
  }

  /**
   * Cleans up expired idempotency keys from Firebase RTDB.
   *
   * @returns The number of keys removed
   */
  async cleanupExpired(): Promise<number> {
    const keysRef = ref(db, 'idempotency/keys');
    const snapshot = await get(keysRef);

    if (!snapshot.exists()) {
      return 0;
    }

    const keys = snapshot.val() as Record<string, IdempotencyRecord>;
    const now = Date.now();
    let removedCount = 0;

    for (const [keyId, record] of Object.entries(keys)) {
      if (record.expiresAt <= now) {
        const keyRef = ref(db, `idempotency/keys/${keyId}`);
        await remove(keyRef);
        removedCount++;
      }
    }

    return removedCount;
  }

  /**
   * Creates a sanitized hash from endpoint and body for use as Firebase key.
   * Firebase keys cannot contain: . $ # [ ] /
   *
   * @param endpoint - The API endpoint
   * @param body - The request body
   * @returns A sanitized hash string safe for Firebase keys
   */
  private createHash(endpoint: string, body: Record<string, unknown>): string {
    const raw = `${endpoint}:${JSON.stringify(body)}`;
    // Sanitize for Firebase: replace forbidden characters with underscores
    return raw.replace(/[.$/[\]]/g, '_');
  }
}

/**
 * Singleton instance of IdempotencyManager for global use.
 */
export const idempotencyManager = new IdempotencyManager();
