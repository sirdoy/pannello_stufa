/**
 * Stove State Repository
 *
 * Handles stove state operations in Firebase.
 * Firebase path: /stove/state (via environmentHelper)
 */

import { BaseRepository } from './base/BaseRepository';
import { getEnvironmentPath } from '@/lib/environmentHelper';
import type { StoveState } from '@/types/firebase';

export class StoveStateRepository extends BaseRepository<StoveState> {
  constructor() {
    // Use environment-aware path (handles sandbox/production automatically)
    super(getEnvironmentPath('stove/state'));
  }

  /**
   * Get current stove state
   * @returns Stove state
   */
  async getState(): Promise<StoveState | null> {
    return this.get();
  }

  /**
   * Update stove state (merges with existing)
   * @param state - State updates
   */
  async updateState(state: Partial<StoveState>): Promise<void> {
    const data = this.withTimestamp({
      ...state,
      lastUpdated: new Date().toISOString(),
    });
    return this.update('', data);
  }

  /**
   * Set full stove state (overwrite)
   * @param state - Complete state
   */
  async setState(state: StoveState): Promise<void> {
    const data = this.withTimestamp(state as unknown as Record<string, unknown>);
    return this.set('', data as unknown as Partial<StoveState>);
  }
}
