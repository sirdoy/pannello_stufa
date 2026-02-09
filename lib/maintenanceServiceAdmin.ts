/**
 * Maintenance Service - ADMIN SDK (Server-side only)
 * Usato SOLO da API routes (trackUsageHours, canIgnite)
 */
import { adminDbGet, adminDbUpdate, adminDbTransaction } from './firebaseAdmin';
import { shouldSendMaintenanceNotification } from './maintenance/helpers';

const MAINTENANCE_REF = 'maintenance';
const DEFAULT_TARGET_HOURS = 50;

/** Maintenance data stored in Firebase */
interface MaintenanceData {
  currentHours: number;
  targetHours: number;
  lastCleanedAt: string | null;
  needsCleaning: boolean;
  lastUpdatedAt: string;
  lastNotificationLevel: number;
}

/** Track usage hours result */
interface TrackUsageResult {
  tracked: boolean;
  reason?: string;
  elapsedMinutes?: number;
  newCurrentHours?: number;
  notificationData?: unknown;
  error?: string;
}

export async function trackUsageHours(stoveStatus: string): Promise<TrackUsageResult> {
  try {
    const isWorking = (
      stoveStatus.includes('WORK') ||
      stoveStatus.includes('MODULATION')
    );

    if (!isWorking) {
      return { tracked: false, reason: 'Stove not in WORK/MODULATION status' };
    }

    const now = new Date();

    const transactionResult = await adminDbTransaction(MAINTENANCE_REF, ((currentData: MaintenanceData | null) => {
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
      const elapsedMs = now.getTime() - lastUpdated.getTime();
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

      return result as MaintenanceData & { _elapsedMinutes: number; _notificationData: unknown };
    }) as (currentData: unknown) => unknown);

    const updatedData = transactionResult as MaintenanceData & { _notificationData?: unknown; _elapsedMinutes?: number };
    const notificationData = updatedData._notificationData || null;
    const elapsedMinutes = updatedData._elapsedMinutes || 0;

    delete (updatedData as unknown as Record<string, unknown>)._notificationData;
    delete (updatedData as unknown as Record<string, unknown>)._elapsedMinutes;

    return {
      tracked: true,
      elapsedMinutes,
      newCurrentHours: updatedData.currentHours,
      notificationData,
    };
  } catch (error: unknown) {
    console.error('Error tracking usage hours:', error);
    const message = error instanceof Error ? error.message : String(error);
    return { tracked: false, error: message };
  }
}

export async function canIgnite(): Promise<boolean> {
  try {
    const data = await adminDbGet(MAINTENANCE_REF) as MaintenanceData | null;
    if (!data) return true;
    return !data.needsCleaning;
  } catch (error) {
    console.error('Error checking if can ignite:', error);
    return true;
  }
}
