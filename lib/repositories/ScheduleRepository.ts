/**
 * Schedule Repository
 *
 * Handles multi-schedule operations.
 * Firebase path: /schedules-v2/schedules
 */

import { BaseRepository } from './base/BaseRepository';

/** Schedule slot (interval) for a day */
interface ScheduleInterval {
  start: string;
  end: string;
  power: number;
  temperature: number;
}

/** Schedule slots organized by day */
interface ScheduleSlots {
  [day: string]: ScheduleInterval[];
}

/** Full schedule data stored in Firebase */
interface ScheduleData {
  name: string;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
  slots: ScheduleSlots;
}

/** Schedule metadata for listing */
interface ScheduleMetadata {
  id: string;
  name: string;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
  intervalCount: number;
}

/** Full schedule with ID */
interface ScheduleWithId extends ScheduleData {
  id: string;
}

export class ScheduleRepository extends BaseRepository<ScheduleData> {
  constructor() {
    super('schedules-v2/schedules');
  }

  /**
   * Get all schedules
   * @returns Array of schedules with metadata
   */
  async getAll(): Promise<ScheduleMetadata[]> {
    const data = await this.get();
    if (!data) return [];

    return Object.entries(data as unknown as Record<string, ScheduleData>).map(([id, schedule]) => ({
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
   * @param scheduleId - Schedule ID
   * @returns Schedule or null
   */
  async getById(scheduleId: string): Promise<ScheduleWithId | null> {
    const data = await this.get(scheduleId);
    if (!data) return null;
    return { id: scheduleId, ...data };
  }

  /**
   * Create new schedule
   * @param id - Schedule ID
   * @param schedule - Schedule data
   */
  async create(id: string, schedule: Omit<ScheduleData, 'createdAt' | 'updatedAt'>): Promise<void> {
    const now = new Date().toISOString();
    const data: ScheduleData = {
      ...schedule,
      createdAt: now,
      updatedAt: now,
    };
    return this.set(id, data);
  }

  /**
   * Update schedule
   * @param id - Schedule ID
   * @param updates - Fields to update
   */
  async updateById(id: string, updates: Partial<ScheduleData>): Promise<void> {
    const data = this.withTimestamp(updates);
    return this.update(id, data);
  }

  /**
   * Delete schedule
   * @param id - Schedule ID
   */
  async deleteById(id: string): Promise<void> {
    return this.remove(id);
  }

  /**
   * Get schedule slots for a specific day
   * @param scheduleId - Schedule ID
   * @param day - Day name (e.g., 'Lunedi')
   * @returns Intervals for the day
   */
  async getDaySlots(scheduleId: string, day: string): Promise<ScheduleInterval[]> {
    const slots = await this.get(`${scheduleId}/slots/${day}`);
    return (slots as unknown as ScheduleInterval[]) || [];
  }

  /**
   * Update schedule slots for a day
   * @param scheduleId - Schedule ID
   * @param day - Day name
   * @param intervals - Intervals
   */
  async setDaySlots(scheduleId: string, day: string, intervals: ScheduleInterval[]): Promise<void> {
    await this.set(`${scheduleId}/slots/${day}`, intervals as unknown as Partial<ScheduleData>);
    await this.updateById(scheduleId, {}); // Updates updatedAt
  }

  /**
   * Check if schedule name exists
   * @param name - Schedule name
   * @param excludeId - ID to exclude from check
   * @returns True if name exists
   */
  async nameExists(name: string, excludeId: string | null = null): Promise<boolean> {
    const schedules = await this.getAll();
    const normalizedName = name.toLowerCase().trim();

    return schedules.some(s =>
      s.id !== excludeId && s.name.toLowerCase().trim() === normalizedName
    );
  }

  /**
   * Count total intervals across all days
   * @param slots - Slots object
   * @returns Total intervals
   */
  private countIntervals(slots: ScheduleSlots): number {
    if (!slots) return 0;
    return Object.values(slots).reduce((total, dayIntervals) => {
      return total + (Array.isArray(dayIntervals) ? dayIntervals.length : 0);
    }, 0);
  }
}
