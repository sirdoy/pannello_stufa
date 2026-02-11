/**
 * Analytics Data Types
 *
 * Type definitions for analytics events, consent state, daily statistics,
 * calibration settings, and period filters.
 *
 * Used by:
 * - analyticsConsentService.ts: Consent state management
 * - analyticsEventLogger.ts: Event logging to Firebase RTDB
 * - Analytics dashboard components: Display and filtering
 */

/** GDPR consent state */
export type ConsentState = 'unknown' | 'granted' | 'denied';

/** Analytics event types for stove operations */
export type AnalyticsEventType = 'stove_ignite' | 'stove_shutdown' | 'power_change';

/** Event source classification */
export type AnalyticsEventSource = 'manual' | 'scheduler' | 'automation';

/** Analytics event logged to Firebase RTDB */
export interface AnalyticsEvent {
  /** ISO 8601 timestamp */
  timestamp: string;
  /** Event type */
  eventType: AnalyticsEventType;
  /** Power level for power_change events (1-5) */
  powerLevel?: number;
  /** Event source (manual/scheduler/automation) */
  source: AnalyticsEventSource;
  /** User ID if manual action (Auth0 sub) */
  userId?: string;
}

/** Daily aggregated statistics */
export interface DailyStats {
  /** Date in YYYY-MM-DD format */
  date: string;
  /** Total running hours for the day */
  totalHours: number;
  /** Hours by power level (1-5) */
  byPowerLevel: Record<number, number>;
  /** Pellet consumption estimate */
  pelletEstimate: {
    /** Total kg consumed */
    totalKg: number;
    /** Cost estimate based on calibration */
    costEstimate: number;
  };
  /** Count of ignition events */
  ignitionCount: number;
  /** Count of shutdown events */
  shutdownCount: number;
  /** Hours from automation (scheduler/PID) */
  automationHours: number;
  /** Hours from manual control */
  manualHours: number;
  /** Average room temperature (if available from Netatmo) */
  avgTemperature?: number;
}

/** Pellet calibration settings for cost estimation */
export interface CalibrationSettings {
  /** Calibration factor (kg/hour at power level 5) */
  pelletCalibrationFactor: number;
  /** Last calibration date (ISO 8601) */
  lastCalibrationDate: string;
  /** Actual pellet consumption measured (kg) */
  lastCalibrationActual: number;
  /** Estimated consumption before calibration (kg) */
  lastCalibrationEstimated: number;
  /** Cost per kg of pellets (user-configurable) */
  pelletCostPerKg: number;
}

/** Analytics dashboard period filter options */
export type AnalyticsPeriod = 7 | 30 | 90;
