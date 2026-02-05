/**
 * Configuration and constants type definitions
 */

/**
 * Application environment
 */
export type AppEnvironment = 'development' | 'production' | 'test';

/**
 * Application configuration
 */
export interface AppConfig {
  env: AppEnvironment;
  apiBaseUrl: string;
  firebase: {
    databaseUrl: string;
    projectId: string;
  };
  auth: {
    domain: string;
    clientId: string;
  };
}

/**
 * Dashboard card identifiers
 */
export type DashboardCardId =
  | 'stove'
  | 'thermostat'
  | 'hue'
  | 'camera'
  | 'weather'
  | 'maintenance'
  | 'schedule'
  | 'monitoring';

/**
 * Dashboard card configuration
 */
export interface DashboardCardConfig {
  id: DashboardCardId;
  title: string;
  enabled: boolean;
  order: number;
}

/**
 * User dashboard preferences (stored in Firebase)
 */
export interface DashboardPreferences {
  cards: DashboardCardConfig[];
  lastUpdated?: string;
}

/**
 * Location configuration for weather
 */
export interface LocationConfig {
  city: string;
  latitude: number;
  longitude: number;
  timezone?: string;
}

/**
 * Weather display configuration
 */
export interface WeatherConfig {
  location: LocationConfig;
  units: 'metric' | 'imperial';
  showForecast: boolean;
  forecastDays: number;
}

/**
 * Stove configuration
 */
export interface StoveConfig {
  host: string;
  port: number;
  timeout: number;
  maintenanceThresholdHours: number;
}

/**
 * Netatmo OAuth configuration
 */
export interface NetatmoConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scope: string[];
}

/**
 * Hue bridge configuration
 */
export interface HueConfig {
  bridgeIp?: string;
  username?: string;
  clientKey?: string;
}

/**
 * Notification rate limit configuration
 */
export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  byType: Record<string, number>;
}

/**
 * Cron job configuration
 */
export interface CronConfig {
  enabled: boolean;
  secret: string;
  jobs: {
    healthCheck: { intervalMs: number };
    coordination: { intervalMs: number };
    tokenCleanup: { intervalMs: number };
  };
}

/**
 * Feature flags
 */
export interface FeatureFlags {
  enableWeather: boolean;
  enableDashboardCustomization: boolean;
  enableContextMenu: boolean;
  enableCommandPalette: boolean;
  enableAnimations: boolean;
}
