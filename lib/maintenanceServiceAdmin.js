/**
 * Maintenance Service - ADMIN SDK (Server-side only)
 * Usato SOLO da API routes (trackUsageHours, canIgnite)
 */
import { adminDbGet, adminDbUpdate, adminDbTransaction } from './firebaseAdmin';

const MAINTENANCE_REF = 'maintenance';
const DEFAULT_TARGET_HOURS = 50;

function shouldSendMaintenanceNotification(percentage, currentHours, targetHours, lastNotificationLevel = 0) {
  let notificationLevel = 0;
  if (percentage >= 100) notificationLevel = 100;
  else if (percentage >= 90) notificationLevel = 90;
  else if (percentage >= 80) notificationLevel = 80;

  if (notificationLevel === 0 || notificationLevel <= (lastNotificationLevel || 0)) {
    return null;
  }

  const remainingHours = Math.max(0, targetHours - currentHours);

  return {
    notificationLevel,
    percentage,
    currentHours,
    targetHours,
    remainingHours,
  };
}

export async function trackUsageHours(stoveStatus) {
  try {
    const isWorking = (
      stoveStatus.includes('WORK') ||
      stoveStatus.includes('MODULATION')
    );

    if (!isWorking) {
      return { tracked: false, reason: 'Stove not in WORK/MODULATION status' };
    }

    const now = new Date();

    const transactionResult = await adminDbTransaction(MAINTENANCE_REF, (currentData) => {
      if (!currentData) {
        return {
          currentHours: 0,
          targetHours: DEFAULT_TARGET_HOURS,
          lastCleanedAt: null,
          needsCleaning: false,
          lastUpdatedAt: now.toISOString(),
          lastNotificationLevel: 0,
        };
      }

      if (!currentData.lastUpdatedAt) {
        return {
          ...currentData,
          lastUpdatedAt: now.toISOString(),
        };
      }

      const lastUpdated = new Date(currentData.lastUpdatedAt);
      const elapsedMs = now - lastUpdated;
      const MIN_UPDATE_INTERVAL_MS = 30 * 1000;

      if (elapsedMs < MIN_UPDATE_INTERVAL_MS) {
        return;
      }

      const elapsedMinutes = elapsedMs / 1000 / 60;
      const elapsedHours = elapsedMinutes / 60;
      const newCurrentHours = (currentData.currentHours || 0) + elapsedHours;
      const percentage = (newCurrentHours / (currentData.targetHours || DEFAULT_TARGET_HOURS)) * 100;

      const notificationData = shouldSendMaintenanceNotification(
        percentage,
        newCurrentHours,
        currentData.targetHours || DEFAULT_TARGET_HOURS,
        currentData.lastNotificationLevel || 0
      );

      const result = {
        ...currentData,
        currentHours: parseFloat(newCurrentHours.toFixed(4)),
        lastUpdatedAt: now.toISOString(),
        needsCleaning: newCurrentHours >= (currentData.targetHours || DEFAULT_TARGET_HOURS),
        _elapsedMinutes: elapsedMinutes,
        _notificationData: notificationData,
      };

      if (notificationData) {
        result.lastNotificationLevel = notificationData.notificationLevel;
      }

      return result;
    });

    const updatedData = transactionResult;
    const notificationData = updatedData._notificationData || null;
    const elapsedMinutes = updatedData._elapsedMinutes || 0;

    delete updatedData._notificationData;
    delete updatedData._elapsedMinutes;

    return {
      tracked: true,
      elapsedMinutes,
      newCurrentHours: updatedData.currentHours,
      notificationData,
    };
  } catch (error) {
    console.error('Error tracking usage hours:', error);
    return { tracked: false, error: error.message };
  }
}

export async function canIgnite() {
  try {
    const data = await adminDbGet(MAINTENANCE_REF);
    if (!data) return true;
    return !data.needsCleaning;
  } catch (error) {
    console.error('Error checking if can ignite:', error);
    return true;
  }
}
