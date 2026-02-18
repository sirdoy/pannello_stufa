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
export type AnalyticsEventType = 'stove_ignite' | 'stove_shutdown' | 'power_change' | 'component_error';

/** Event source classification */
export type AnalyticsEventSource = 'manual' | 'scheduler' | 'automation' | 'error_boundary';

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
  /** Component name for component_error events */
  component?: string;
  /** Error message for component_error events */
  errorMessage?: string;
  /** Error stack trace for component_error events */
  errorStack?: string;
  /** Device ID for component_error events */
  device?: string;
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

/** Web Vitals metric name (Core Web Vitals + supplementary) */
export type WebVitalName = 'LCP' | 'INP' | 'CLS' | 'FCP' | 'TTFB';

/** Web Vitals rating thresholds */
export type WebVitalRating = 'good' | 'needs-improvement' | 'poor';

/** Web Vitals event stored in Firebase RTDB */
export interface WebVitalEvent {
  /** Metric name (LCP, INP, CLS, FCP, TTFB) */
  name: WebVitalName;
  /** Metric value (ms for timing, unitless for CLS) */
  value: number;
  /** Rating based on Core Web Vitals thresholds */
  rating: WebVitalRating;
  /** Unique metric ID (for deduplication) */
  id: string;
  /** Page URL path */
  url: string;
  /** ISO 8601 timestamp */
  timestamp: string;
}
