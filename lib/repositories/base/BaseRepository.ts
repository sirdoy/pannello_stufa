/**
 * Base Repository Class
 *
 * Provides common Firebase operations for all repositories.
 * Uses Admin SDK for server-side operations.
 *
 * Usage:
 *   class MyRepository extends BaseRepository<MyDataType> {
 *     constructor() { super('myPath'); }
 *   }
 */

import { adminDbGet, adminDbSet, adminDbUpdate, adminDbPush, adminDbRemove, adminDbTransaction } from '@/lib/firebaseAdmin';

export abstract class BaseRepository<T = unknown> {
  protected basePath: string;

  /**
   * @param basePath - Firebase path for this repository
   */
  constructor(basePath: string) {
    this.basePath = basePath;
  }

  /**
   * Get data from Firebase
   * @param subPath - Additional path segment
   * @returns Data or null
   */
  async get(subPath: string = ''): Promise<T | null> {
    const fullPath = this.resolvePath(subPath);
    const data = await adminDbGet(fullPath);
    return data as T;
  }

  /**
   * Set data in Firebase (overwrites)
   * @param subPath - Path segment
   * @param data - Data to set
   */
  async set(subPath: string, data: Partial<T>): Promise<void> {
    const fullPath = this.resolvePath(subPath);
    const filteredData = this.filterUndefined(data);
    return adminDbSet(fullPath, filteredData);
  }

  /**
   * Update data in Firebase (merges)
   * @param subPath - Path segment
   * @param updates - Fields to update
   */
  async update(subPath: string, updates: Partial<T>): Promise<void> {
    const fullPath = this.resolvePath(subPath);
    const filteredUpdates = this.filterUndefined(updates);
    return adminDbUpdate(fullPath, filteredUpdates);
  }

  /**
   * Push data to Firebase list
   * @param subPath - Path segment
   * @param data - Data to push
   * @returns Generated key
   */
  async push(subPath: string, data: Partial<T>): Promise<string> {
    const fullPath = this.resolvePath(subPath);
    const filteredData = this.filterUndefined(data);
    return adminDbPush(fullPath, filteredData);
  }

  /**
   * Remove data from Firebase
   * @param subPath - Path segment
   */
  async remove(subPath: string): Promise<void> {
    const fullPath = this.resolvePath(subPath);
    return adminDbRemove(fullPath);
  }

  /**
   * Run transaction
   * @param subPath - Path segment
   * @param updateFn - Transaction function
   */
  async transaction(subPath: string, updateFn: (current: T | null) => T | null): Promise<void> {
    const fullPath = this.resolvePath(subPath);
    return adminDbTransaction(fullPath, updateFn);
  }

  /**
   * Resolve full Firebase path
   * @param subPath - Additional path segment
   * @returns Full path
   */
  protected resolvePath(subPath: string): string {
    if (!subPath) return this.basePath;
    return `${this.basePath}/${subPath}`;
  }

  /**
   * Filter undefined values from object (Firebase doesn't accept undefined)
   * @param data - Data to filter
   * @returns Filtered data
   */
  protected filterUndefined<D>(data: D): D {
    if (data === null || data === undefined) return null as D;
    if (typeof data !== 'object') return data;
    if (Array.isArray(data)) return data.map(item => this.filterUndefined(item)) as D;

    return Object.fromEntries(
      Object.entries(data as Record<string, unknown>)
        .filter(([_, value]) => value !== undefined)
        .map(([key, value]) => [key, this.filterUndefined(value)])
    ) as D;
  }

  /**
   * Add timestamp to data
   * @param data - Data object
   * @param field - Timestamp field name
   * @returns Data with timestamp
   */
  protected withTimestamp<D extends Record<string, unknown>>(data: D, field: string = 'updatedAt'): D & { [key: string]: string } {
    return {
      ...data,
      [field]: new Date().toISOString(),
    };
  }
}
