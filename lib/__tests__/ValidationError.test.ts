/**
 * ValidationError Unit Tests
 *
 * Tests for custom ValidationError class that bypasses error boundaries.
 */

import { ValidationError } from '../errors/ValidationError';

describe('ValidationError', () => {
  test('constructor sets name, message, code, and details correctly', () => {
    const error = new ValidationError(
      'Test error message',
      'TEST_CODE',
      { key: 'value' }
    );

    expect(error.name).toBe('ValidationError');
    expect(error.message).toBe('Test error message');
    expect(error.code).toBe('TEST_CODE');
    expect(error.details).toEqual({ key: 'value' });
  });

  test('instanceof ValidationError returns true', () => {
    const error = new ValidationError('Test');
    expect(error instanceof ValidationError).toBe(true);
  });

  test('instanceof Error returns true (prototype chain)', () => {
    const error = new ValidationError('Test');
    expect(error instanceof Error).toBe(true);
  });

  test('ValidationError.maintenanceRequired() creates correct instance with code MAINTENANCE_REQUIRED', () => {
    const error = ValidationError.maintenanceRequired();

    expect(error instanceof ValidationError).toBe(true);
    expect(error.code).toBe('MAINTENANCE_REQUIRED');
    expect(error.message).toBe('Manutenzione richiesta - Conferma la pulizia prima di accendere');
  });

  test('ValidationError.maintenanceRequired() passes details through', () => {
    const details = { lastCleaning: '2026-02-01', h24Hours: 120 };
    const error = ValidationError.maintenanceRequired(details);

    expect(error.details).toEqual(details);
    expect(error.code).toBe('MAINTENANCE_REQUIRED');
  });

  test('default code is VALIDATION_ERROR when not specified', () => {
    const error = new ValidationError('Test message');
    expect(error.code).toBe('VALIDATION_ERROR');
  });

  test('details are optional', () => {
    const error = new ValidationError('Test message', 'TEST_CODE');
    expect(error.details).toBeUndefined();
  });

  test('stack trace is captured', () => {
    const error = new ValidationError('Test');
    expect(error.stack).toBeDefined();
    expect(typeof error.stack).toBe('string');
  });
});
