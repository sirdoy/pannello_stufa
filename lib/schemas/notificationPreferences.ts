/**
 * Notification Preferences Zod Schema
 *
 * Provides type-safe validation for user notification preferences.
 * Supports type-level toggles, DND windows, and rate limits.
 *
 * Compatible with React Hook Form via @hookform/resolvers/zod
 */

import { z } from 'zod';

/**
 * DND (Do Not Disturb) Window Schema
 *
 * Represents a time window when notifications should be suppressed.
 * Multiple windows per day are supported (e.g., lunch break + nighttime).
 */
export const dndWindowSchema = z.object({
  // Unique ID for React key prop
  id: z.string().uuid(),

  // Time format: HH:mm (24-hour format)
  // Zod 3.x uses z.string().regex() - z.iso.time() is Zod 4.x only
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'Start time must be in HH:mm format (00:00 to 23:59)',
  }),

  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'End time must be in HH:mm format (00:00 to 23:59)',
  }),

  // Whether this DND window is active
  enabled: z.boolean().default(true),

  // Optional device ID for per-device DND (phone silent, desktop active)
  deviceId: z.string().optional(),
}).refine(
  (data) => {
    // Only validate if window is enabled
    if (!data.enabled) return true;

    // Ensure start and end times are different
    return data.startTime !== data.endTime;
  },
  {
    message: 'Start and end times must be different',
    path: ['startTime'],
  }
);

/**
 * Rate Limit Schema
 *
 * Per-notification-type rate limiting configuration.
 * Prevents spam by limiting notifications within a time window.
 */
export const rateLimitSchema = z.object({
  // Time window in minutes (1-60)
  windowMinutes: z.number().int().min(1).max(60).default(5),

  // Maximum notifications allowed per window (1-10)
  maxPerWindow: z.number().int().min(1).max(10).default(1),
});

/**
 * Main Notification Preferences Schema
 *
 * Complete user preferences including:
 * - Type-level toggles (CRITICAL, ERROR, scheduler_success, etc.)
 * - DND windows (multiple periods per day)
 * - Per-type rate limits
 * - Timezone (auto-detected)
 * - Version tracking for conflict detection
 */
export const notificationPreferencesSchema = z.object({
  /**
   * Type-Level Toggles
   * Each notification type can be independently enabled/disabled.
   *
   * Categories (semantic grouping):
   * - Alerts: CRITICAL, ERROR
   * - System: maintenance, updates
   * - Routine: scheduler_success, status (opt-in)
   *
   * Default (balanced approach per CONTEXT.md):
   * - Alerts + System enabled
   * - Routine disabled (opt-in)
   */
  enabledTypes: z.record(z.string(), z.boolean()).default({
    // Alerts category (enabled by default)
    CRITICAL: true,
    ERROR: true,

    // System category (enabled by default)
    maintenance: true,
    updates: true,

    // Routine category (opt-in - disabled by default)
    scheduler_success: false,
    status: false,
  }),

  /**
   * DND (Do Not Disturb) Windows
   * Multiple time periods per day when notifications are suppressed.
   * CRITICAL notifications bypass DND (per CONTEXT.md).
   *
   * Maximum 5 windows to prevent abuse.
   */
  dndWindows: z.array(dndWindowSchema).max(5).default([]),

  /**
   * Per-Type Rate Limits
   * Independent rate limiting for each notification type.
   * Prevents spam while allowing critical alerts.
   *
   * Example: max 1 scheduler_success per 5 minutes
   */
  rateLimits: z.record(z.string(), rateLimitSchema).default({
    // CRITICAL: minimal rate limit (3 per minute)
    CRITICAL: { windowMinutes: 1, maxPerWindow: 3 },

    // ERROR: moderate rate limit (2 per minute)
    ERROR: { windowMinutes: 1, maxPerWindow: 2 },

    // Routine: aggressive rate limit (1 per 5 minutes)
    scheduler_success: { windowMinutes: 5, maxPerWindow: 1 },
    status: { windowMinutes: 5, maxPerWindow: 1 },

    // System: moderate rate limit
    maintenance: { windowMinutes: 5, maxPerWindow: 2 },
    updates: { windowMinutes: 60, maxPerWindow: 1 },
  }),

  /**
   * Timezone (auto-detected via Intl API)
   * Read-only in UI, used for DND time comparisons.
   * Example: "Europe/Rome", "America/New_York"
   */
  timezone: z.string().default('UTC'),

  /**
   * Version for Conflict Detection
   * Incremented on each update to detect concurrent modifications.
   * Prevents cross-device race conditions (last write wins).
   */
  version: z.number().int().default(1),

  /**
   * Last Update Timestamp (ISO 8601)
   * Tracks when preferences were last modified.
   */
  updatedAt: z.string().datetime().optional(),
});

/** Inferred TypeScript types from Zod schemas */
export type DNDWindow = z.infer<typeof dndWindowSchema>;
export type RateLimit = z.infer<typeof rateLimitSchema>;
export type NotificationPreferences = z.infer<typeof notificationPreferencesSchema>;

/**
 * Get Default Notification Preferences
 *
 * Returns validated default preferences matching CONTEXT.md balanced approach:
 * - Alerts + System categories enabled (CRITICAL, ERROR, maintenance, updates)
 * - Routine category disabled (scheduler_success, status - opt-in)
 * - No DND windows by default
 * - Timezone auto-detected from browser
 *
 * @returns Default preferences object
 */
export function getDefaultPreferences(): NotificationPreferences {
  // Auto-detect timezone using browser Intl API
  const timezone = typeof Intl !== 'undefined'
    ? Intl.DateTimeFormat().resolvedOptions().timeZone
    : 'UTC';

  // Parse with schema to ensure validation
  return notificationPreferencesSchema.parse({
    enabledTypes: {
      // Alerts category (enabled)
      CRITICAL: true,
      ERROR: true,

      // System category (enabled)
      maintenance: true,
      updates: true,

      // Routine category (disabled - opt-in)
      scheduler_success: false,
      status: false,
    },
    dndWindows: [],
    rateLimits: {
      CRITICAL: { windowMinutes: 1, maxPerWindow: 3 },
      ERROR: { windowMinutes: 1, maxPerWindow: 2 },
      scheduler_success: { windowMinutes: 5, maxPerWindow: 1 },
      status: { windowMinutes: 5, maxPerWindow: 1 },
      maintenance: { windowMinutes: 5, maxPerWindow: 2 },
      updates: { windowMinutes: 60, maxPerWindow: 1 },
    },
    timezone,
    version: 1,
  });
}
