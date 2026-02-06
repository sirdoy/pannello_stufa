/**
 * Stove Service
 *
 * Business logic for stove operations.
 * Uses repositories for data access and stoveApi for external calls.
 */

import { MaintenanceRepository } from '@/lib/repositories/MaintenanceRepository';
import { StoveStateRepository } from '@/lib/repositories/StoveStateRepository';
import { SchedulerModeRepository } from '@/lib/repositories/SchedulerModeRepository';
import {
  igniteStove as apiIgnite,
  shutdownStove as apiShutdown,
  setFanLevel as apiSetFan,
  setPowerLevel as apiSetPower,
} from '@/lib/stoveApi';
import { getNextScheduledChange } from '@/lib/schedulerService';
import { syncLivingRoomWithStove } from '@/lib/netatmoStoveSync';
import { ApiError } from '@/lib/core';
import type { StoveCommand, StovePowerLevel } from '@/types/firebase';

/**
 * Stove command source
 */
type StoveCommandSource = 'manual' | 'scheduler';

export class StoveService {
  private maintenanceRepo: MaintenanceRepository;
  private stoveStateRepo: StoveStateRepository;
  private schedulerModeRepo: SchedulerModeRepository;

  constructor() {
    this.maintenanceRepo = new MaintenanceRepository();
    this.stoveStateRepo = new StoveStateRepository();
    this.schedulerModeRepo = new SchedulerModeRepository();
  }

  /**
   * Ignite stove with maintenance check
   */
  async ignite(power = 3, source: StoveCommandSource = 'manual'): Promise<unknown> {
    // Check maintenance
    const canIgnite = await this.maintenanceRepo.canIgnite();
    if (!canIgnite) {
      throw ApiError.maintenanceRequired();
    }

    // Call external API
    const result = await apiIgnite(power as StovePowerLevel);

    // Update state
    await this.stoveStateRepo.updateState({
      status: 'START',
      statusDescription: 'Avvio in corso',
      powerLevel: power,
      source,
    });

    // Handle semi-manual mode for manual commands
    if (source === 'manual') {
      await this.handleManualCommandMode();
    }

    // Sync Netatmo thermostats with stove state (async, don't block response)
    syncLivingRoomWithStove(true).then((syncResult) => {
      if (syncResult.synced && 'roomNames' in syncResult && 'temperature' in syncResult) {
        console.log(`Netatmo stove sync (ignite): ${syncResult.roomNames || 'Rooms'} set to ${syncResult.temperature}C`);
      }
    }).catch(err => console.error('Netatmo stove sync error (ignite):', err.message));

    return result;
  }

  /**
   * Shutdown stove
   */
  async shutdown(source: StoveCommandSource = 'manual'): Promise<unknown> {
    // No maintenance check for shutdown - always allowed
    const result = await apiShutdown();

    await this.stoveStateRepo.updateState({
      status: 'STANDBY',
      statusDescription: 'Spegnimento...',
      source,
    });

    // Handle semi-manual mode for manual commands
    if (source === 'manual') {
      await this.handleManualCommandMode();
    }

    // Sync Netatmo thermostats with stove state (async, don't block response)
    syncLivingRoomWithStove(false).then((syncResult) => {
      if (syncResult.synced && 'roomNames' in syncResult) {
        console.log(`Netatmo stove sync (shutdown): ${syncResult.roomNames || 'Rooms'} returned to schedule`);
      }
    }).catch(err => console.error('Netatmo stove sync error (shutdown):', err.message));

    return result;
  }

  /**
   * Set fan level
   * @param {number} level - Fan level (1-6)
   * @param {string} source - 'manual' or 'scheduler'
   * @returns {Promise<Object>} Result with mode change info
   */
  async setFan(level, source = 'manual') {
    const result = await apiSetFan(level);

    await this.stoveStateRepo.updateState({
      fanLevel: level,
      source,
    });

    let modeChanged = false;
    let returnToAutoAt = null;

    if (source === 'manual') {
      const modeInfo = await this.handleManualCommandMode();
      modeChanged = modeInfo.changed;
      returnToAutoAt = modeInfo.returnToAutoAt;
    }

    return { ...result, modeChanged, returnToAutoAt };
  }

  /**
   * Set power level
   * @param {number} level - Power level (1-5)
   * @param {string} source - 'manual' or 'scheduler'
   * @returns {Promise<Object>} Result with mode change info
   */
  async setPower(level, source = 'manual') {
    const result = await apiSetPower(level);

    await this.stoveStateRepo.updateState({
      powerLevel: level,
      source,
    });

    let modeChanged = false;
    let returnToAutoAt = null;

    if (source === 'manual') {
      const modeInfo = await this.handleManualCommandMode();
      modeChanged = modeInfo.changed;
      returnToAutoAt = modeInfo.returnToAutoAt;
    }

    return { ...result, modeChanged, returnToAutoAt };
  }

  /**
   * Handle semi-manual mode activation for manual commands
   * @returns {Promise<Object>} { changed: boolean, returnToAutoAt: string|null }
   */
  async handleManualCommandMode() {
    const mode = await this.schedulerModeRepo.getMode();

    // Only activate semi-manual if scheduler is enabled and not already in semi-manual
    if (mode.enabled && !mode.semiManual) {
      const nextChange = await getNextScheduledChange();
      await this.schedulerModeRepo.setSemiManual(nextChange);
      console.log('Modalita semi-manuale attivata per comando manuale');
      return { changed: true, returnToAutoAt: nextChange };
    }

    return { changed: false, returnToAutoAt: null };
  }
}

// Singleton instance for convenience
let instance = null;

export function getStoveService() {
  if (!instance) {
    instance = new StoveService();
  }
  return instance;
}
