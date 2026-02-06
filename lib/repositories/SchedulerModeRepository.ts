/**
 * Scheduler Mode Repository
 *
 * Handles scheduler mode operations.
 * Firebase path: /schedules-v2/mode and /schedules-v2/activeScheduleId
 */

import { BaseRepository } from './base/BaseRepository';

/** Scheduler mode configuration */
interface SchedulerMode {
  enabled: boolean;
  semiManual: boolean;
  semiManualActivatedAt?: string;
  returnToAutoAt?: string;
  lastUpdated?: string;
}

export class SchedulerModeRepository extends BaseRepository<SchedulerMode> {
  constructor() {
    super('schedules-v2');
  }

  /**
   * Get full scheduler mode
   * @returns Mode object
   */
  async getMode(): Promise<SchedulerMode> {
    const mode = await this.get('mode');
    return mode || { enabled: false, semiManual: false };
  }

  /**
   * Set scheduler enabled/disabled
   * @param enabled - Enable or disable
   */
  async setEnabled(enabled: boolean): Promise<void> {
    const data = this.withTimestamp({
      enabled,
      semiManual: false, // Reset semi-manual when toggling
    }, 'lastUpdated');

    return this.set('mode', data);
  }

  /**
   * Activate semi-manual mode
   * @param returnToAutoAt - ISO timestamp for auto return
   */
  async setSemiManual(returnToAutoAt: string): Promise<void> {
    const data: SchedulerMode = {
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
  async clearSemiManual(): Promise<void> {
    const current = await this.getMode();
    const data = this.withTimestamp({
      enabled: current.enabled,
      semiManual: false,
    }, 'lastUpdated');

    return this.set('mode', data);
  }

  /**
   * Get active schedule ID
   * @returns Active schedule ID or 'default'
   */
  async getActiveScheduleId(): Promise<string> {
    const id = await this.get('activeScheduleId');
    return (id as unknown as string) || 'default';
  }

  /**
   * Set active schedule ID
   * @param scheduleId - Schedule ID to activate
   */
  async setActiveScheduleId(scheduleId: string): Promise<void> {
    return this.set('activeScheduleId', scheduleId as unknown as Partial<SchedulerMode>);
  }
}
