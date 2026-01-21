/**
 * Scheduler Mode Repository
 *
 * Handles scheduler mode operations.
 * Firebase path: /schedules-v2/mode and /schedules-v2/activeScheduleId
 */

import { BaseRepository } from './base/BaseRepository';

export class SchedulerModeRepository extends BaseRepository {
  constructor() {
    super('schedules-v2');
  }

  /**
   * Get full scheduler mode
   * @returns {Promise<Object>} Mode object
   */
  async getMode() {
    const mode = await this.get('mode');
    return mode || { enabled: false, semiManual: false };
  }

  /**
   * Set scheduler enabled/disabled
   * @param {boolean} enabled - Enable or disable
   */
  async setEnabled(enabled) {
    const data = this.withTimestamp({
      enabled,
      semiManual: false, // Reset semi-manual when toggling
    }, 'lastUpdated');

    return this.set('mode', data);
  }

  /**
   * Activate semi-manual mode
   * @param {string} returnToAutoAt - ISO timestamp for auto return
   */
  async setSemiManual(returnToAutoAt) {
    const data = {
      enabled: true,
      semiManual: true,
      semiManualActivatedAt: new Date().toISOString(),
      returnToAutoAt,
      lastUpdated: new Date().toISOString(),
    };

    return this.set('mode', data);
  }

  /**
   * Clear semi-manual mode
   */
  async clearSemiManual() {
    const current = await this.getMode();
    const data = this.withTimestamp({
      enabled: current.enabled,
      semiManual: false,
    }, 'lastUpdated');

    return this.set('mode', data);
  }

  /**
   * Get active schedule ID
   * @returns {Promise<string>} Active schedule ID or 'default'
   */
  async getActiveScheduleId() {
    const id = await this.get('activeScheduleId');
    return id || 'default';
  }

  /**
   * Set active schedule ID
   * @param {string} scheduleId - Schedule ID to activate
   */
  async setActiveScheduleId(scheduleId) {
    return this.set('activeScheduleId', scheduleId);
  }
}
