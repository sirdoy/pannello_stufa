/**
 * Coordination Preferences Zod Schema
 *
 * Provides type-safe validation for user coordination preferences.
 * Defines how stove-thermostat coordination behaves per user.
 *
 * Compatible with React Hook Form via @hookform/resolvers/zod
 */

import { z } from 'zod';

/**
 * Zone Configuration Schema
 *
 * Represents a Netatmo room participating in coordination.
 * Each zone can have a custom boost amount or use defaultBoost.
 */
export const zoneConfigSchema = z.object({
  // Netatmo room ID (must match Netatmo API)
  roomId: z.string().min(1, 'Room ID is required'),

  // Display name for UI
  roomName: z.string().min(1, 'Room name is required'),

  // Whether this zone participates in coordination
  enabled: z.boolean().default(true),

  // Zone-specific boost override (null = use defaultBoost)
  // Range: 0.5°C to 5°C
  boost: z.number().min(0.5).max(5).nullable().default(null),
});

/**
 * Main Coordination Preferences Schema
 *
 * Complete user preferences including:
 * - Global enable/disable toggle
 * - Default boost amount for all zones
 * - Per-zone configuration (enabled, custom boost)
 * - Notification preferences for coordination events
 * - Version tracking for conflict detection
 */
export const coordinationPreferencesSchema = z.object({
  /**
   * Global coordination toggle
   * When false, no coordination actions occur regardless of zones
   */
  enabled: z.boolean().default(true),

  /**
   * Default temperature boost in °C
   * Applied to zones when stove turns on
   * Range: 0.5°C to 5°C (sensible heating range)
   */
  defaultBoost: z.number().min(0.5).max(5).default(2),

  /**
   * Zone configurations
   * Array of rooms participating in coordination
   * Empty array = coordination disabled (no zones to coordinate)
   */
  zones: z.array(zoneConfigSchema).default([]),

  /**
   * Notification preferences for coordination events
   * Independent toggles for different event types
   */
  notificationPreferences: z.object({
    // Notify when setpoint override applied (stove turned on)
    coordinationApplied: z.boolean().default(true),

    // Notify when setpoints restored (stove turned off)
    coordinationRestored: z.boolean().default(false),

    // Notify when automation paused (manual intervention detected)
    automationPaused: z.boolean().default(true),

    // Notify when 30°C cap applied (safety limit reached)
    maxSetpointReached: z.boolean().default(true),
  }).default({
    coordinationApplied: true,
    coordinationRestored: false,
    automationPaused: true,
    maxSetpointReached: true,
  }),

  /**
   * Version for conflict detection
   * Incremented on each update to detect concurrent modifications
   * Prevents cross-device race conditions (last write wins with warning)
   */
  version: z.number().int().default(1),

  /**
   * Last update timestamp (ISO 8601)
   * Tracks when preferences were last modified
   */
  updatedAt: z.string().datetime().optional(),
});

/** Inferred TypeScript types from Zod schemas */
export type ZoneConfig = z.infer<typeof zoneConfigSchema>;
export type CoordinationPreferences = z.infer<typeof coordinationPreferencesSchema>;

/**
 * Get default coordination preferences
 *
 * Returns validated default preferences matching documented defaults:
 * - Coordination enabled globally
 * - 2°C default boost (moderate heating)
 * - No zones configured (user must configure)
 * - Notification defaults: coordinationApplied + automationPaused + maxSetpointReached
 *
 * @returns Default preferences object
 */
export function getDefaultCoordinationPreferences(): CoordinationPreferences {
  return coordinationPreferencesSchema.parse({
    enabled: true,
    defaultBoost: 2,
    zones: [],
    notificationPreferences: {
      coordinationApplied: true,
      coordinationRestored: false,
      automationPaused: true,
      maxSetpointReached: true,
    },
    version: 1,
  });
}
