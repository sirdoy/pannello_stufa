/**
 * ValidationError - Custom error class that bypasses error boundaries
 *
 * Purpose: Safety-critical validation errors (e.g., maintenance required)
 * that should NOT be caught by component error boundaries.
 *
 * Usage:
 * - Component error boundaries check `instanceof ValidationError` to bypass
 * - Static factories provide semantic error creation
 * - Details field supports structured error context
 *
 * Example:
 * ```ts
 * throw ValidationError.maintenanceRequired({ lastCleaning: '2026-02-01' });
 * ```
 */

export class ValidationError extends Error {
  /** Error code for categorization */
  public readonly code: string;

  /** Structured error details */
  public readonly details?: Record<string, unknown>;

  constructor(
    message: string,
    code: string = 'VALIDATION_ERROR',
    details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'ValidationError';
    this.code = code;
    this.details = details;

    // Capture stack trace in V8 engines (Node.js, Chrome)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ValidationError);
    }
  }

  /**
   * Factory: Create maintenance required error
   *
   * Used by device control flows when H24 maintenance threshold is reached.
   * Error message is in Italian to match UI language.
   *
   * @param details - Optional structured context (e.g., lastCleaning date)
   */
  static maintenanceRequired(details?: Record<string, unknown>): ValidationError {
    return new ValidationError(
      'Manutenzione richiesta - Conferma la pulizia prima di accendere',
      'MAINTENANCE_REQUIRED',
      details
    );
  }
}
