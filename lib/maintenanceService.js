import { db } from './firebase';
import { ref, get, set, update } from 'firebase/database';
import { logUserAction } from './logService';
import { DEVICE_TYPES } from './devices/deviceTypes';

const MAINTENANCE_REF = 'maintenance';
const DEFAULT_TARGET_HOURS = 50;

/**
 * Get maintenance data from Firebase
 */
export async function getMaintenanceData() {
  try {
    const maintenanceRef = ref(db, MAINTENANCE_REF);
    const snapshot = await get(maintenanceRef);

    if (snapshot.exists()) {
      return snapshot.val();
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
 * Update target hours (from config page)
 */
export async function updateTargetHours(hours) {
  try {
    const maintenanceRef = ref(db, MAINTENANCE_REF);
    await update(maintenanceRef, {
      targetHours: parseFloat(hours)
      // DO NOT update lastUpdatedAt here - it should only be updated when tracking WORK time
    });

    // Check if needs cleaning after update
    const data = await getMaintenanceData();
    if (data.currentHours >= data.targetHours && !data.needsCleaning) {
      await update(maintenanceRef, { needsCleaning: true });
    }

    return true;
  } catch (error) {
    console.error('Error updating target hours:', error);
    throw error;
  }
}

/**
 * Increment usage hours (called every minute when status = WORK)
 * @param {number} minutes - Minutes to add (typically 1)
 */
export async function incrementUsageHours(minutes = 1) {
  try {
    const data = await getMaintenanceData();
    const hoursToAdd = minutes / 60; // Convert minutes to hours
    const newCurrentHours = data.currentHours + hoursToAdd;

    const updates = {
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
 * Track usage hours automatically based on stove status (WORK)
 * Called by cron job every minute - calculates elapsed time since last update
 * @param {string} stoveStatus - Current stove status (e.g., 'WORK', 'OFF', etc.)
 */
export async function trackUsageHours(stoveStatus) {
  try {
    // Only track when stove is working
    if (!stoveStatus || !stoveStatus.includes('WORK')) {
      return { tracked: false, reason: 'Stove not in WORK status' };
    }

    const data = await getMaintenanceData();
    const now = new Date();

    // First time tracking or after config change - initialize lastUpdatedAt without adding time
    if (!data.lastUpdatedAt) {
      const maintenanceRef = ref(db, MAINTENANCE_REF);
      await update(maintenanceRef, {
        lastUpdatedAt: now.toISOString()
      });
      return { tracked: false, reason: 'First tracking - lastUpdatedAt initialized' };
    }

    const lastUpdate = new Date(data.lastUpdatedAt);

    // Calculate elapsed minutes since last update
    const elapsedMinutes = (now - lastUpdate) / 1000 / 60;

    // Only update if at least 0.5 minutes passed (avoid too frequent updates)
    if (elapsedMinutes < 0.5) {
      return { tracked: false, reason: 'Too soon since last update' };
    }

    // Add elapsed time to current hours
    const hoursToAdd = elapsedMinutes / 60;
    const newCurrentHours = data.currentHours + hoursToAdd;

    const updates = {
      currentHours: parseFloat(newCurrentHours.toFixed(4)), // 4 decimals precision
      lastUpdatedAt: now.toISOString()
    };

    // Check if threshold reached
    if (newCurrentHours >= data.targetHours && !data.needsCleaning) {
      updates.needsCleaning = true;
      console.log(`⚠️ Maintenance threshold reached: ${newCurrentHours.toFixed(2)}h / ${data.targetHours}h`);
    }

    const maintenanceRef = ref(db, MAINTENANCE_REF);
    await update(maintenanceRef, updates);

    return {
      tracked: true,
      elapsedMinutes: parseFloat(elapsedMinutes.toFixed(2)),
      newCurrentHours: updates.currentHours,
      needsCleaning: updates.needsCleaning || data.needsCleaning
    };
  } catch (error) {
    console.error('Error tracking usage hours:', error);
    throw error;
  }
}

/**
 * Reset maintenance after cleaning confirmation
 */
export async function confirmCleaning(user) {
  try {
    const data = await getMaintenanceData();
    const cleanedAt = new Date().toISOString();

    // Log cleaning action
    await logUserAction(
      'Pulizia stufa',
      DEVICE_TYPES.STOVE,
      `${data.currentHours.toFixed(2)}h`,
      {
        previousHours: data.currentHours,
        targetHours: data.targetHours,
        cleanedAt,
        source: 'manual'
      }
    );

    // Reset maintenance data
    const maintenanceRef = ref(db, MAINTENANCE_REF);
    await update(maintenanceRef, {
      currentHours: 0,
      needsCleaning: false,
      lastCleanedAt: cleanedAt,
      lastUpdatedAt: cleanedAt
    });

    return true;
  } catch (error) {
    console.error('Error confirming cleaning:', error);
    throw error;
  }
}

/**
 * Check if stove can be ignited (maintenance check)
 */
export async function canIgnite() {
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
export async function getMaintenanceStatus() {
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
