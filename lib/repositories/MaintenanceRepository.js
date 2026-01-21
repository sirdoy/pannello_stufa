/**
 * Maintenance Repository
 *
 * Handles all maintenance data operations.
 * Firebase path: /maintenance
 */

import { BaseRepository } from './base/BaseRepository';

const DEFAULT_TARGET_HOURS = 50;

export class MaintenanceRepository extends BaseRepository {
  constructor() {
    super('maintenance');
  }

  /**
   * Get maintenance data with defaults
   * @returns {Promise<Object>} Maintenance data
   */
  async getData() {
    const data = await this.get();

    if (data) {
      return data;
    }

    // Initialize with defaults
    const defaultData = {
      currentHours: 0,
      targetHours: DEFAULT_TARGET_HOURS,
      lastCleanedAt: null,
      needsCleaning: false,
      lastUpdatedAt: null,
      lastNotificationLevel: 0,
    };

    await this.set('', defaultData);
    return defaultData;
  }

  /**
   * Update maintenance data
   * @param {Object} updates - Fields to update
   */
  async updateData(updates) {
    const data = this.withTimestamp(updates);
    return this.update('', data);
  }

  /**
   * Check if ignition is allowed
   * @returns {Promise<boolean>} True if allowed
   */
  async canIgnite() {
    const data = await this.getData();
    return !data.needsCleaning;
  }

  /**
   * Reset maintenance after cleaning
   * @returns {Promise<Object>} Updated data
   */
  async confirmCleaning() {
    const now = new Date().toISOString();
    const updates = {
      currentHours: 0,
      needsCleaning: false,
      lastCleanedAt: now,
      lastNotificationLevel: 0,
    };

    await this.updateData(updates);
    return { ...updates, lastUpdatedAt: now };
  }

  /**
   * Update target hours
   * @param {number} hours - New target hours
   */
  async setTargetHours(hours) {
    return this.updateData({ targetHours: hours });
  }

  /**
   * Get status summary
   * @returns {Promise<Object>} Status with percentage and remaining hours
   */
  async getStatus() {
    const data = await this.getData();
    const percentage = (data.currentHours / data.targetHours) * 100;
    const remainingHours = Math.max(0, data.targetHours - data.currentHours);

    return {
      ...data,
      percentage: Math.min(100, percentage),
      remainingHours,
      isNearLimit: percentage >= 80 && !data.needsCleaning,
    };
  }
}
