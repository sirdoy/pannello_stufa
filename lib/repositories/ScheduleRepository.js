/**
 * Schedule Repository
 *
 * Handles multi-schedule operations.
 * Firebase path: /schedules-v2/schedules
 */

import { BaseRepository } from './base/BaseRepository';

export class ScheduleRepository extends BaseRepository {
  constructor() {
    super('schedules-v2/schedules');
  }

  /**
   * Get all schedules
   * @returns {Promise<Array>} Array of schedules with metadata
   */
  async getAll() {
    const data = await this.get();
    if (!data) return [];

    return Object.entries(data).map(([id, schedule]) => ({
      id,
      name: schedule.name,
      enabled: schedule.enabled,
      createdAt: schedule.createdAt,
      updatedAt: schedule.updatedAt,
      intervalCount: this.countIntervals(schedule.slots),
    }));
  }

  /**
   * Get schedule by ID (full data with slots)
   * @param {string} scheduleId - Schedule ID
   * @returns {Promise<Object|null>} Schedule or null
   */
  async getById(scheduleId) {
    const data = await this.get(scheduleId);
    if (!data) return null;
    return { id: scheduleId, ...data };
  }

  /**
   * Create new schedule
   * @param {string} id - Schedule ID
   * @param {Object} schedule - Schedule data
   */
  async create(id, schedule) {
    const now = new Date().toISOString();
    const data = {
      ...schedule,
      createdAt: now,
      updatedAt: now,
    };
    return this.set(id, data);
  }

  /**
   * Update schedule
   * @param {string} id - Schedule ID
   * @param {Object} updates - Fields to update
   */
  async updateById(id, updates) {
    const data = this.withTimestamp(updates);
    return this.update(id, data);
  }

  /**
   * Delete schedule
   * @param {string} id - Schedule ID
   */
  async deleteById(id) {
    return this.remove(id);
  }

  /**
   * Get schedule slots for a specific day
   * @param {string} scheduleId - Schedule ID
   * @param {string} day - Day name (e.g., 'Lunedi')
   * @returns {Promise<Array>} Intervals for the day
   */
  async getDaySlots(scheduleId, day) {
    const slots = await this.get(`${scheduleId}/slots/${day}`);
    return slots || [];
  }

  /**
   * Update schedule slots for a day
   * @param {string} scheduleId - Schedule ID
   * @param {string} day - Day name
   * @param {Array} intervals - Intervals
   */
  async setDaySlots(scheduleId, day, intervals) {
    await this.set(`${scheduleId}/slots/${day}`, intervals);
    await this.updateById(scheduleId, {}); // Updates updatedAt
  }

  /**
   * Check if schedule name exists
   * @param {string} name - Schedule name
   * @param {string} [excludeId] - ID to exclude from check
   * @returns {Promise<boolean>} True if name exists
   */
  async nameExists(name, excludeId = null) {
    const schedules = await this.getAll();
    const normalizedName = name.toLowerCase().trim();

    return schedules.some(s =>
      s.id !== excludeId && s.name.toLowerCase().trim() === normalizedName
    );
  }

  /**
   * Count total intervals across all days
   * @param {Object} slots - Slots object
   * @returns {number} Total intervals
   */
  countIntervals(slots) {
    if (!slots) return 0;
    return Object.values(slots).reduce((total, dayIntervals) => {
      return total + (Array.isArray(dayIntervals) ? dayIntervals.length : 0);
    }, 0);
  }
}
