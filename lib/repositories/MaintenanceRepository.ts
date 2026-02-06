/**
 * Maintenance Repository
 *
 * Handles all maintenance data operations.
 * Firebase path: /maintenance
 */

import { BaseRepository } from './base/BaseRepository';

const DEFAULT_TARGET_HOURS = 50;

/** Maintenance data structure stored in Firebase */
interface MaintenanceData {
  currentHours: number;
  targetHours: number;
  lastCleanedAt: string | null;
  needsCleaning: boolean;
  lastUpdatedAt: string | null;
  lastNotificationLevel: number;
}

/** Extended maintenance status with computed fields */
interface MaintenanceStatus extends MaintenanceData {
  percentage: number;
  remainingHours: number;
  isNearLimit: boolean;
}

export class MaintenanceRepository extends BaseRepository<MaintenanceData> {
  constructor() {
    super('maintenance');
  }

  /**
   * Get maintenance data with defaults
   * @returns Maintenance data
   */
  async getData(): Promise<MaintenanceData> {
    const data = await this.get();

    if (data) {
      return data;
    }

    // Initialize with defaults
    const defaultData: MaintenanceData = {
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
   * @param updates - Fields to update
   */
  async updateData(updates: Partial<MaintenanceData>): Promise<void> {
    const data = this.withTimestamp(updates);
    return this.update('', data);
  }

  /**
   * Check if ignition is allowed
   * @returns True if allowed
   */
  async canIgnite(): Promise<boolean> {
    const data = await this.getData();
    return !data.needsCleaning;
  }

  /**
   * Reset maintenance after cleaning
   * @returns Updated data
   */
  async confirmCleaning(): Promise<Partial<MaintenanceData> & { lastUpdatedAt: string }> {
    const now = new Date().toISOString();
    const updates: Partial<MaintenanceData> = {
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
   * @param hours - New target hours
   */
  async setTargetHours(hours: number): Promise<void> {
    return this.updateData({ targetHours: hours });
  }

  /**
   * Get status summary
   * @returns Status with percentage and remaining hours
   */
  async getStatus(): Promise<MaintenanceStatus> {
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
