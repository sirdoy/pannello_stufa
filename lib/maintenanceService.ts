import { db } from './firebase';
import { ref, get, set, update, runTransaction } from 'firebase/database';
import { isLocalEnvironment, isSandboxEnabled, getSandboxMaintenance, SandboxMaintenance } from './sandboxService';
import { shouldSendMaintenanceNotification } from './maintenance/helpers';

const MAINTENANCE_REF = 'maintenance';
const DEFAULT_TARGET_HOURS = 50;

/** Maintenance data stored in Firebase */
export interface MaintenanceData {
  currentHours: number;
  targetHours: number;
  lastCleanedAt: string | null;
  needsCleaning: boolean;
  lastUpdatedAt: string | null;
  lastNotificationLevel?: number;
}

/** Track usage hours result */
export interface TrackUsageResult {
  tracked: boolean;
  reason?: string;
  elapsedMinutes?: number;
  newCurrentHours?: number;
  needsCleaning?: boolean;
  notificationData?: unknown;
}

/** Maintenance status summary */
export interface MaintenanceStatus extends MaintenanceData {
  percentage: number;
  remainingHours: number;
  isNearLimit: boolean;
}

/**
 * Get maintenance data from Firebase
 * Se sandbox è attivo in localhost, legge da sandbox/maintenance
 */
export async function getMaintenanceData(): Promise<MaintenanceData> {
  try {
    // Check sandbox mode
    if (isLocalEnvironment()) {
      const sandboxEnabled = await isSandboxEnabled();
      if (sandboxEnabled) {
        const sandboxData = (await getSandboxMaintenance()) as unknown as SandboxMaintenance;
        // Convert sandbox format to maintenance format
        return {
          currentHours: sandboxData.hoursWorked || 0,
          targetHours: sandboxData.maxHours || 150,
          lastCleanedAt: null,
          needsCleaning: sandboxData.needsCleaning || false,
          lastUpdatedAt: sandboxData.lastUpdatedAt || null,
        };
      }
    }

    // Production mode - usa maintenance normale
    const maintenanceRef = ref(db, MAINTENANCE_REF);
    const snapshot = await get(maintenanceRef);

    if (snapshot.exists()) {
      return snapshot.val() as MaintenanceData;
    }

    // Initialize with defaults if not exists
    // lastUpdatedAt will be set on first WORK tracking
    const defaultData = {
      currentHours: 0,
      targetHours: DEFAULT_TARGET_HOURS,
      lastCleanedAt: null,
      needsCleaning: false,
      lastUpdatedAt: null
    };

    await set(maintenanceRef, defaultData);
    return defaultData;
  } catch (error) {
    console.error('Error getting maintenance data:', error);
    throw error;
  }
}

/**
 * Update target hours (from config page) via API
 */
export async function updateTargetHours(hours: number | string): Promise<boolean> {
  try {
    const response = await fetch('/api/maintenance/update-target', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ targetHours: parseFloat(String(hours)) }),
    });

    if (!response.ok) {
      const error = await response.json() as { message?: string };
      throw new Error(error.message || 'Failed to update target hours');
    }

    return true;
  } catch (error) {
    console.error('Error updating target hours:', error);
    throw error;
  }
}

/**
 * Increment usage hours (called every minute when status = WORK or MODULATION)
 */
export async function incrementUsageHours(minutes: number = 1): Promise<Partial<MaintenanceData>> {
  try {
    const data = await getMaintenanceData();
    const hoursToAdd = minutes / 60; // Convert minutes to hours
    const newCurrentHours = data.currentHours + hoursToAdd;

    const updates: Partial<MaintenanceData> & { currentHours: number; lastUpdatedAt: string } = {
      currentHours: parseFloat(newCurrentHours.toFixed(4)), // 4 decimals precision
      lastUpdatedAt: new Date().toISOString()
    };

    // Check if threshold reached
    if (newCurrentHours >= data.targetHours && !data.needsCleaning) {
      updates.needsCleaning = true;
    }

    const maintenanceRef = ref(db, MAINTENANCE_REF);
    await update(maintenanceRef, updates);

    return updates;
  } catch (error) {
    console.error('Error incrementing usage hours:', error);
    throw error;
  }
}

/**
 * Track usage hours automatically based on stove status (WORK or MODULATION)
 * Called by cron job every minute - calculates elapsed time since last update
 */
export async function trackUsageHours(stoveStatus: string): Promise<TrackUsageResult> {
  try {
    // Only track when stove is actively working or modulating
    const isWorking = stoveStatus && (
      stoveStatus.includes('WORK') ||
      stoveStatus.includes('MODULATION')
    );

    if (!isWorking) {
      return { tracked: false, reason: 'Stove not in WORK/MODULATION status' };
    }

    const maintenanceRef = ref(db, MAINTENANCE_REF);
    const now = new Date();

    // Use Firebase Transaction for atomic read-modify-write
    const transactionResult = await runTransaction(maintenanceRef, (currentData: MaintenanceData | null) => {
      // Initialize if no data exists
      if (!currentData) {
        return {
          currentHours: 0,
          targetHours: DEFAULT_TARGET_HOURS,
          lastCleanedAt: null,
          needsCleaning: false,
          lastUpdatedAt: now.toISOString(),
          lastNotificationLevel: 0
        };
      }

      // First time tracking - initialize lastUpdatedAt without adding time
      if (!currentData.lastUpdatedAt) {
        currentData.lastUpdatedAt = now.toISOString();
        return currentData; // Don't add time yet
      }

      const lastUpdate = new Date(currentData.lastUpdatedAt!);

      // Calculate elapsed minutes since last update
      const elapsedMinutes = (now.getTime() - lastUpdate.getTime()) / 1000 / 60;

      // Only update if at least 0.5 minutes passed (avoid too frequent updates)
      if (elapsedMinutes < 0.5) {
        // Abort transaction - no changes needed
        return undefined;
      }

      // Add elapsed time to current hours
      const hoursToAdd = elapsedMinutes / 60;
      const newCurrentHours = currentData.currentHours + hoursToAdd;
      const newPercentage = (newCurrentHours / currentData.targetHours) * 100;

      // Update data atomically
      currentData.currentHours = parseFloat(newCurrentHours.toFixed(4)); // 4 decimals precision
      currentData.lastUpdatedAt = now.toISOString();

      // Check if threshold reached
      if (newCurrentHours >= currentData.targetHours && !currentData.needsCleaning) {
        currentData.needsCleaning = true;
      }

      // Check if notification should be sent and update lastNotificationLevel atomically
      const notificationData = shouldSendMaintenanceNotification(
        newPercentage,
        newCurrentHours,
        currentData.targetHours,
        currentData.lastNotificationLevel || 0
      );

      if (notificationData) {
        currentData.lastNotificationLevel = notificationData.notificationLevel;
        // Store notification data in transaction result metadata
        (currentData as unknown as Record<string, unknown>)._notificationData = notificationData;
      }

      // Store elapsed minutes for return value (temporary field)
      (currentData as unknown as Record<string, unknown>)._elapsedMinutes = elapsedMinutes;

      return currentData;
    });

    // Check transaction result
    if (!transactionResult.committed) {
      return { tracked: false, reason: 'Too soon since last update (transaction aborted)' };
    }

    const snapshot = transactionResult.snapshot;
    if (!snapshot) {
      return { tracked: false, reason: 'Transaction aborted (no snapshot)' };
    }

    const updatedData = snapshot.val() as MaintenanceData & { _notificationData?: unknown; _elapsedMinutes?: number };
    if (!updatedData) {
      return { tracked: false, reason: 'Transaction aborted (no data)' };
    }

    // Extract temporary fields (not stored in DB)
    const notificationData = updatedData._notificationData || null;
    const elapsedMinutes = updatedData._elapsedMinutes || 0;

    // Clean up temporary fields from result
    delete (updatedData as unknown as Record<string, unknown>)._notificationData;
    delete (updatedData as unknown as Record<string, unknown>)._elapsedMinutes;

    return {
      tracked: true,
      elapsedMinutes: parseFloat(elapsedMinutes.toFixed(2)),
      newCurrentHours: updatedData.currentHours,
      needsCleaning: updatedData.needsCleaning || false,
      notificationData  // Ritorna dati per invio notifica (se applicabile)
    };
  } catch (error) {
    console.error('Error tracking usage hours:', error);
    throw error;
  }
}

/**
 * Reset maintenance after cleaning confirmation via API
 */
export async function confirmCleaning(user?: unknown): Promise<boolean> {
  try {
    // Chiama API route che gestisce logging e reset automaticamente
    const response = await fetch('/api/maintenance/confirm-cleaning', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json() as { message?: string };
      throw new Error(error.message || 'Failed to confirm cleaning');
    }

    return true;
  } catch (error) {
    console.error('Error confirming cleaning:', error);
    throw error;
  }
}

/**
 * Check if stove can be ignited (maintenance check)
 */
export async function canIgnite(): Promise<boolean> {
  try {
    const data = await getMaintenanceData();
    return !data.needsCleaning;
  } catch (error) {
    console.error('Error checking if can ignite:', error);
    return true; // Default to allowing if error
  }
}

/**
 * Get maintenance status summary
 */
export async function getMaintenanceStatus(): Promise<MaintenanceStatus> {
  try {
    const data = await getMaintenanceData();
    const percentage = (data.currentHours / data.targetHours) * 100;
    const remainingHours = Math.max(0, data.targetHours - data.currentHours);

    return {
      ...data,
      percentage: Math.min(100, percentage),
      remainingHours,
      isNearLimit: percentage >= 80 && !data.needsCleaning // Warning at 80%
    };
  } catch (error) {
    console.error('Error getting maintenance status:', error);
    throw error;
  }
}
