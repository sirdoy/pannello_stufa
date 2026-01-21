/**
 * Stove Input Validators
 *
 * Validation functions for stove-related API inputs.
 */

import { validateRequired, validateRange, validateEnum } from '@/lib/core';

/**
 * Validate ignite input
 * @param {Object} body - Request body
 * @returns {Object} Validated input
 */
export function validateIgniteInput(body) {
  const power = body.power ?? 3;
  const source = body.source ?? 'manual';

  validateRange(power, 1, 5, 'power');
  validateEnum(source, ['manual', 'scheduler'], 'source');

  return { power, source };
}

/**
 * Validate shutdown input
 * @param {Object} body - Request body
 * @returns {Object} Validated input
 */
export function validateShutdownInput(body) {
  const source = body.source ?? 'manual';
  validateEnum(source, ['manual', 'scheduler'], 'source');
  return { source };
}

/**
 * Validate set fan input
 * @param {Object} body - Request body
 * @returns {Object} Validated input
 */
export function validateSetFanInput(body) {
  validateRequired(body.level, 'level');
  const level = validateRange(body.level, 1, 6, 'level');
  const source = body.source ?? 'manual';
  validateEnum(source, ['manual', 'scheduler'], 'source');

  return { level, source };
}

/**
 * Validate set power input
 * @param {Object} body - Request body
 * @returns {Object} Validated input
 */
export function validateSetPowerInput(body) {
  validateRequired(body.level, 'level');
  const level = validateRange(body.level, 1, 5, 'level');
  const source = body.source ?? 'manual';
  validateEnum(source, ['manual', 'scheduler'], 'source');

  return { level, source };
}
