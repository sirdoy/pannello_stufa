/**
 * Stove Input Validators
 *
 * Validation functions for stove-related API inputs.
 */

import { validateRequired, validateRange, validateEnum } from '@/lib/core';
import type { StovePowerLevel } from '@/types/firebase';

/** Command source type */
type CommandSource = 'manual' | 'scheduler';

/** Validated ignite input */
interface IgniteInput {
  power: StovePowerLevel;
  source: CommandSource;
}

/** Validated shutdown input */
interface ShutdownInput {
  source: CommandSource;
}

/** Validated fan input */
interface FanInput {
  level: number; // 1-6
  source: CommandSource;
}

/** Validated power input */
interface PowerInput {
  level: StovePowerLevel;
  source: CommandSource;
}

/**
 * Validate ignite input
 * @param body - Request body
 * @returns Validated input
 */
export function validateIgniteInput(body: { power?: number; source?: string }): IgniteInput {
  const power = (body.power ?? 3) as StovePowerLevel;
  const source = (body.source ?? 'manual') as CommandSource;

  validateRange(power, 1, 5, 'power');
  validateEnum(source, ['manual', 'scheduler'], 'source');

  return { power, source };
}

/**
 * Validate shutdown input
 * @param body - Request body
 * @returns Validated input
 */
export function validateShutdownInput(body: { source?: string }): ShutdownInput {
  const source = (body.source ?? 'manual') as CommandSource;
  validateEnum(source, ['manual', 'scheduler'], 'source');
  return { source };
}

/**
 * Validate set fan input
 * @param body - Request body
 * @returns Validated input
 */
export function validateSetFanInput(body: { level?: number; source?: string }): FanInput {
  validateRequired(body.level, 'level');
  const level = validateRange(body.level as number, 1, 6, 'level');
  const source = (body.source ?? 'manual') as CommandSource;
  validateEnum(source, ['manual', 'scheduler'], 'source');

  return { level, source };
}

/**
 * Validate set power input
 * @param body - Request body
 * @returns Validated input
 */
export function validateSetPowerInput(body: { level?: number; source?: string }): PowerInput {
  validateRequired(body.level, 'level');
  const level = validateRange(body.level as number, 1, 5, 'level') as StovePowerLevel;
  const source = (body.source ?? 'manual') as CommandSource;
  validateEnum(source, ['manual', 'scheduler'], 'source');

  return { level, source };
}
