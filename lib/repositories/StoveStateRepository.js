/**
 * Stove State Repository
 *
 * Handles stove state operations in Firebase.
 * Firebase path: /stove/state (via environmentHelper)
 */

import { BaseRepository } from './base/BaseRepository';
import { getEnvironmentPath } from '@/lib/environmentHelper';

export class StoveStateRepository extends BaseRepository {
  constructor() {
    // Use environment-aware path (handles sandbox/production automatically)
    super(getEnvironmentPath('stove/state'));
  }

  /**
   * Get current stove state
   * @returns {Promise<Object|null>} Stove state
   */
  async getState() {
    return this.get();
  }

  /**
   * Update stove state (merges with existing)
   * @param {Object} state - State updates
   */
  async updateState(state) {
    const data = this.withTimestamp({
      ...state,
      lastUpdated: new Date().toISOString(),
    });
    return this.update('', data);
  }

  /**
   * Set full stove state (overwrite)
   * @param {Object} state - Complete state
   */
  async setState(state) {
    const data = this.withTimestamp(state);
    return this.set('', data);
  }
}
