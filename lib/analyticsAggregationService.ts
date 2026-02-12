/**
 * Analytics Aggregation Service
 *
 * Processes raw analytics events into daily statistics for dashboard display.
 * Calculates usage hours per power level, automation vs manual hours, pellet estimates.
 *
 * Fire-and-forget pattern: errors logged but never thrown.
 * Server-side only (uses adminDbGet/adminDbSet).
 */

import { adminDbGet, adminDbSet } from './firebaseAdmin';
import { getEnvironmentPath } from './environmentHelper';
import { getAnalyticsEventsForDate } from './analyticsEventLogger';
import { estimatePelletConsumption, type UsageDataPoint } from './pelletEstimationService';
import type { AnalyticsEvent, DailyStats } from '@/types/analytics';

/**
 * Aggregate raw analytics events into daily statistics
 *
 * Processes event pairs (ignite -> shutdown) to calculate:
 * - Runtime hours per power level
 * - Automation vs manual hours
 * - Ignition/shutdown counts
 * - Pellet consumption estimates
 *
 * @param dateKey - Date in YYYY-MM-DD format
 * @returns DailyStats for the date
 */
export async function aggregateDailyStats(dateKey: string): Promise<DailyStats> {
  try {
    // Get raw events for date
    const rawEvents = await getAnalyticsEventsForDate(dateKey);

    // Filter out component_error events (not relevant for usage statistics)
    const events = rawEvents.filter(event => event.eventType !== 'component_error');

    if (events.length === 0) {
      return createEmptyStats(dateKey);
    }

    // Sort events by timestamp ascending
    const sortedEvents = [...events].sort((a, b) =>
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    // Track session state
    let sessionStart: Date | null = null;
    let currentPowerLevel = 1;
    let currentSource: 'manual' | 'scheduler' | 'automation' = 'manual';

    const byPowerLevel: Record<number, number> = {};
    let automationHours = 0;
    let manualHours = 0;
    let ignitionCount = 0;
    let shutdownCount = 0;

    // Helper to accumulate hours
    const accumulateHours = (startTime: Date, endTime: Date, powerLevel: number, source: string) => {
      const hours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);

      if (!byPowerLevel[powerLevel]) {
        byPowerLevel[powerLevel] = 0;
      }
      byPowerLevel[powerLevel] += hours;

      if (source === 'scheduler' || source === 'automation') {
        automationHours += hours;
      } else {
        manualHours += hours;
      }
    };

    // Process events sequentially
    for (const event of sortedEvents) {
      const eventTime = new Date(event.timestamp);

      if (event.eventType === 'stove_ignite') {
        ignitionCount++;

        // Start new session
        sessionStart = eventTime;
        currentPowerLevel = event.powerLevel ?? 1;
        currentSource = event.source;

      } else if (event.eventType === 'power_change') {
        if (sessionStart) {
          // Accumulate hours at previous power level
          accumulateHours(sessionStart, eventTime, currentPowerLevel, currentSource);

          // Update power level and restart timer
          currentPowerLevel = event.powerLevel ?? 1;
          sessionStart = eventTime;
        }

      } else if (event.eventType === 'stove_shutdown') {
        shutdownCount++;

        if (sessionStart) {
          // Accumulate final hours for this session
          accumulateHours(sessionStart, eventTime, currentPowerLevel, currentSource);

          // End session
          sessionStart = null;
        }
      }
    }

    // Handle unclosed session (stove still running at midnight)
    if (sessionStart) {
      const endOfDay = new Date(`${dateKey}T23:59:59.999Z`);
      accumulateHours(sessionStart, endOfDay, currentPowerLevel, currentSource);
    }

    // Calculate totals
    const totalHours = Object.values(byPowerLevel).reduce((sum, hours) => sum + hours, 0);

    // Round all values to 2 decimal places
    Object.keys(byPowerLevel).forEach(level => {
      const levelNum = parseInt(level);
      const hours = byPowerLevel[levelNum];
      if (hours !== undefined) {
        byPowerLevel[levelNum] = parseFloat(hours.toFixed(2));
      }
    });
    automationHours = parseFloat(automationHours.toFixed(2));
    manualHours = parseFloat(manualHours.toFixed(2));

    // Build usage data for pellet estimation
    const usageData: UsageDataPoint[] = Object.entries(byPowerLevel).map(([level, hours]) => ({
      powerLevel: parseInt(level),
      hours,
    }));

    // Calculate pellet estimates
    const pelletEstimate = estimatePelletConsumption(usageData);

    // Try to get average temperature from weather cache (optional)
    let avgTemperature: number | undefined = undefined;
    try {
      const weatherCache = await adminDbGet(getEnvironmentPath('weather/cache')) as any;
      if (weatherCache && typeof weatherCache.temperature === 'number') {
        avgTemperature = parseFloat(weatherCache.temperature.toFixed(1));
      }
    } catch {
      // Weather data optional - ignore errors
    }

    return {
      date: dateKey,
      totalHours: parseFloat(totalHours.toFixed(2)),
      byPowerLevel,
      pelletEstimate: {
        totalKg: pelletEstimate.totalKg,
        costEstimate: pelletEstimate.costEstimate,
      },
      ignitionCount,
      shutdownCount,
      automationHours,
      manualHours,
      ...(avgTemperature !== undefined && { avgTemperature }),
    };

  } catch (error) {
    console.error('❌ Failed to aggregate daily stats (returning empty):', error);
    return createEmptyStats(dateKey);
  }
}

/**
 * Save daily statistics to Firebase RTDB
 *
 * Fire-and-forget pattern: errors logged but never thrown.
 *
 * @param stats - DailyStats to save
 */
export async function saveDailyStats(stats: DailyStats): Promise<void> {
  try {
    const path = getEnvironmentPath(`analyticsStats/daily/${stats.date}`);
    await adminDbSet(path, stats);
  } catch (error) {
    console.error('❌ Failed to save daily stats (non-blocking):', error);
    // Don't throw - this is fire-and-forget
  }
}

/**
 * Create empty stats for a date with no events
 */
function createEmptyStats(dateKey: string): DailyStats {
  return {
    date: dateKey,
    totalHours: 0,
    byPowerLevel: {},
    pelletEstimate: {
      totalKg: 0,
      costEstimate: 0,
    },
    ignitionCount: 0,
    shutdownCount: 0,
    automationHours: 0,
    manualHours: 0,
  };
}
