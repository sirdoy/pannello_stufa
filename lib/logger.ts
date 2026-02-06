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

const LOG_LEVELS = {
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
function formatMessage(context, message) {
  if (context) {
    return `[${context}] ${message}`;
  }
  return message;
}

/**
 * Create a logger instance with optional context
 * @param {string} context - Module/context name for log prefix
 * @returns {Object} Logger instance
 */
export function createLogger(context = null) {
  return {
    /**
     * Debug level - development only
     */
    debug(message, ...args) {
      if (LOG_LEVELS.debug >= MIN_LOG_LEVEL) {
        console.log(formatMessage(context, message), ...args);
      }
    },

    /**
     * Info level - general information
     */
    info(message, ...args) {
      if (LOG_LEVELS.info >= MIN_LOG_LEVEL) {
        console.log(formatMessage(context, message), ...args);
      }
    },

    /**
     * Warning level - potential issues
     */
    warn(message, ...args) {
      if (LOG_LEVELS.warn >= MIN_LOG_LEVEL) {
        console.warn(`⚠️ ${formatMessage(context, message)}`, ...args);
      }
    },

    /**
     * Error level - errors and failures
     */
    error(message, ...args) {
      if (LOG_LEVELS.error >= MIN_LOG_LEVEL) {
        console.error(`❌ ${formatMessage(context, message)}`, ...args);
      }
    },

    /**
     * Success indicator - for completed operations
     */
    success(message, ...args) {
      if (LOG_LEVELS.info >= MIN_LOG_LEVEL) {
        console.log(`✅ ${formatMessage(context, message)}`, ...args);
      }
    },

    /**
     * Progress indicator - for ongoing operations
     */
    progress(message, ...args) {
      if (LOG_LEVELS.info >= MIN_LOG_LEVEL) {
        console.log(`🔄 ${formatMessage(context, message)}`, ...args);
      }
    },

    /**
     * Skip indicator - for skipped operations
     */
    skip(message, ...args) {
      if (LOG_LEVELS.info >= MIN_LOG_LEVEL) {
        console.log(`⏭️ ${formatMessage(context, message)}`, ...args);
      }
    },
  };
}

/**
 * Default logger instance (no context)
 */
export const logger = createLogger();

export default logger;
