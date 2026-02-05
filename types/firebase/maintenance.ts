/**
 * Maintenance data types - matches Firebase /maintenance/* structure
 */

/** Maintenance history entry type */
export type MaintenanceType = 'cleaning' | 'inspection' | 'repair';

/** Single maintenance history entry */
export interface MaintenanceHistoryEntry {
  timestamp: string; // ISO 8601
  type: MaintenanceType;
  notes?: string;
}

/** Maintenance record as stored in Firebase /maintenance */
export interface MaintenanceRecord {
  lastCleaning: string; // ISO 8601
  totalHours: number;
  hoursSinceLastCleaning: number;
  needsCleaning: boolean;
  cleaningThresholdHours: number;
  history?: MaintenanceHistoryEntry[];
}
