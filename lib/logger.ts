/**
 * Centralized Logger Utility
 *
 * Provides consistent logging across the application with:
 * - Log levels (debug, info, warn, error)
 * - Context/module prefixes
 * - Optional emoji indicators
 *
 * Usage:
 *   import { logger, createLogger } from '@/lib/logger';
 *
 *   // Use default logger
 *   logger.info('Server started');
 *   logger.error('Failed to connect', error);
 *
 *   // Create module-specific logger
 *   const log = createLogger('Scheduler');
 *   log.info('Cron job running');
 *   log.success('Task completed');
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

// Set minimum log level based on environment
const MIN_LOG_LEVEL = process.env.NODE_ENV === 'production' ? LOG_LEVELS.info : LOG_LEVELS.debug;

/**
 * Format log message with context
 */
function formatMessage(context: string | null, message: string): string {
  if (context) {
    return `[${context}] ${message}`;
  }
  return message;
}

/**
 * Logger instance interface
 */
export interface Logger {
  debug(message: string, ...args: unknown[]): void;
  info(message: string, ...args: unknown[]): void;
  warn(message: string, ...args: unknown[]): void;
  error(message: string, ...args: unknown[]): void;
  success(message: string, ...args: unknown[]): void;
  progress(message: string, ...args: unknown[]): void;
  skip(message: string, ...args: unknown[]): void;
}

/**
 * Create a logger instance with optional context
 * @param context - Module/context name for log prefix
 * @returns Logger instance
 */
export function createLogger(context: string | null = null): Logger {
  return {
    /**
     * Debug level - development only
     */
    debug(message: string, ...args: unknown[]): void {
      if (LOG_LEVELS.debug >= MIN_LOG_LEVEL) {
        console.log(formatMessage(context, message), ...args);
      }
    },

    /**
     * Info level - general information
     */
    info(message: string, ...args: unknown[]): void {
      if (LOG_LEVELS.info >= MIN_LOG_LEVEL) {
        console.log(formatMessage(context, message), ...args);
      }
    },

    /**
     * Warning level - potential issues
     */
    warn(message: string, ...args: unknown[]): void {
      if (LOG_LEVELS.warn >= MIN_LOG_LEVEL) {
        console.warn(`⚠️ ${formatMessage(context, message)}`, ...args);
      }
    },

    /**
     * Error level - errors and failures
     */
    error(message: string, ...args: unknown[]): void {
      if (LOG_LEVELS.error >= MIN_LOG_LEVEL) {
        console.error(`❌ ${formatMessage(context, message)}`, ...args);
      }
    },

    /**
     * Success indicator - for completed operations
     */
    success(message: string, ...args: unknown[]): void {
      if (LOG_LEVELS.info >= MIN_LOG_LEVEL) {
        console.log(`✅ ${formatMessage(context, message)}`, ...args);
      }
    },

    /**
     * Progress indicator - for ongoing operations
     */
    progress(message: string, ...args: unknown[]): void {
      if (LOG_LEVELS.info >= MIN_LOG_LEVEL) {
        console.log(`🔄 ${formatMessage(context, message)}`, ...args);
      }
    },

    /**
     * Skip indicator - for skipped operations
     */
    skip(message: string, ...args: unknown[]): void {
      if (LOG_LEVELS.info >= MIN_LOG_LEVEL) {
        console.log(`⏭️ ${formatMessage(context, message)}`, ...args);
      }
    },
  };
}

/**
 * Default logger instance (no context)
 */
export const logger: Logger = createLogger();

export default logger;
