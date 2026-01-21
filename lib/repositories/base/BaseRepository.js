/**
 * Base Repository Class
 *
 * Provides common Firebase operations for all repositories.
 * Uses Admin SDK for server-side operations.
 *
 * Usage:
 *   class MyRepository extends BaseRepository {
 *     constructor() { super('myPath'); }
 *   }
 */

import { adminDbGet, adminDbSet, adminDbUpdate, adminDbPush, adminDbRemove, adminDbTransaction } from '@/lib/firebaseAdmin';

export class BaseRepository {
  /**
   * @param {string} basePath - Firebase path for this repository
   */
  constructor(basePath) {
    this.basePath = basePath;
  }

  /**
   * Get data from Firebase
   * @param {string} [subPath=''] - Additional path segment
   * @returns {Promise<any>} Data or null
   */
  async get(subPath = '') {
    const fullPath = this.resolvePath(subPath);
    return adminDbGet(fullPath);
  }

  /**
   * Set data in Firebase (overwrites)
   * @param {string} subPath - Path segment
   * @param {any} data - Data to set
   */
  async set(subPath, data) {
    const fullPath = this.resolvePath(subPath);
    const filteredData = this.filterUndefined(data);
    return adminDbSet(fullPath, filteredData);
  }

  /**
   * Update data in Firebase (merges)
   * @param {string} subPath - Path segment
   * @param {Object} updates - Fields to update
   */
  async update(subPath, updates) {
    const fullPath = this.resolvePath(subPath);
    const filteredUpdates = this.filterUndefined(updates);
    return adminDbUpdate(fullPath, filteredUpdates);
  }

  /**
   * Push data to Firebase list
   * @param {string} subPath - Path segment
   * @param {any} data - Data to push
   * @returns {Promise<string>} Generated key
   */
  async push(subPath, data) {
    const fullPath = this.resolvePath(subPath);
    const filteredData = this.filterUndefined(data);
    return adminDbPush(fullPath, filteredData);
  }

  /**
   * Remove data from Firebase
   * @param {string} subPath - Path segment
   */
  async remove(subPath) {
    const fullPath = this.resolvePath(subPath);
    return adminDbRemove(fullPath);
  }

  /**
   * Run transaction
   * @param {string} subPath - Path segment
   * @param {Function} updateFn - Transaction function
   */
  async transaction(subPath, updateFn) {
    const fullPath = this.resolvePath(subPath);
    return adminDbTransaction(fullPath, updateFn);
  }

  /**
   * Resolve full Firebase path
   * @param {string} subPath - Additional path segment
   * @returns {string} Full path
   */
  resolvePath(subPath) {
    if (!subPath) return this.basePath;
    return `${this.basePath}/${subPath}`;
  }

  /**
   * Filter undefined values from object (Firebase doesn't accept undefined)
   * @param {any} data - Data to filter
   * @returns {any} Filtered data
   */
  filterUndefined(data) {
    if (data === null || data === undefined) return null;
    if (typeof data !== 'object') return data;
    if (Array.isArray(data)) return data.map(item => this.filterUndefined(item));

    return Object.fromEntries(
      Object.entries(data)
        .filter(([_, value]) => value !== undefined)
        .map(([key, value]) => [key, this.filterUndefined(value)])
    );
  }

  /**
   * Add timestamp to data
   * @param {Object} data - Data object
   * @param {string} [field='updatedAt'] - Timestamp field name
   * @returns {Object} Data with timestamp
   */
  withTimestamp(data, field = 'updatedAt') {
    return {
      ...data,
      [field]: new Date().toISOString(),
    };
  }
}
