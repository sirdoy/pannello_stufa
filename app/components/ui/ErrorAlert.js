/**
 * ErrorAlert Component
 * Displays stove errors and alarms with appropriate styling
 */

import { ERROR_SEVERITY, getErrorInfo } from '@/lib/errorMonitor';

export default function ErrorAlert({ errorCode, errorDescription, className = '', onDismiss }) {
  if (errorCode === 0 || !errorCode) {
    return null;
  }

  const errorInfo = getErrorInfo(errorCode);
  const { severity } = errorInfo;

  // Determine styling based on severity
  const getSeverityStyles = () => {
    switch (severity) {
      case ERROR_SEVERITY.CRITICAL:
        return {
          container: 'bg-primary-50 border-primary-500',
          icon: '🚨',
          title: 'text-primary-800',
          description: 'text-primary-700',
        };
      case ERROR_SEVERITY.ERROR:
        return {
          container: 'bg-primary-50 border-primary-400',
          icon: '⚠️',
          title: 'text-primary-700',
          description: 'text-primary-600',
        };
      case ERROR_SEVERITY.WARNING:
        return {
          container: 'bg-warning-50 border-warning-400',
          icon: '⚡',
          title: 'text-warning-700',
          description: 'text-warning-600',
        };
      default:
        return {
          container: 'bg-info-50 border-info-400',
          icon: 'ℹ️',
          title: 'text-info-700',
          description: 'text-info-600',
        };
    }
  };

  const styles = getSeverityStyles();

  return (
    <div className={`border-l-4 p-4 rounded-r-xl ${styles.container} ${className}`}>
      <div className="flex items-start gap-3">
        <span className="text-2xl flex-shrink-0">{styles.icon}</span>
        <div className="flex-1 min-w-0">
          <h4 className={`text-sm font-bold ${styles.title} mb-1`}>
            Codice Errore: {errorCode}
          </h4>
          <p className={`text-sm ${styles.description}`}>
            {errorDescription || errorInfo.description}
          </p>
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className={`flex-shrink-0 text-lg ${styles.title} hover:opacity-70 transition-opacity`}
            aria-label="Chiudi avviso"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * ErrorBadge - Compact error indicator
 */
export function ErrorBadge({ errorCode, className = '' }) {
  if (errorCode === 0 || !errorCode) {
    return null;
  }

  const errorInfo = getErrorInfo(errorCode);
  const { severity } = errorInfo;

  const getSeverityColor = () => {
    switch (severity) {
      case ERROR_SEVERITY.CRITICAL:
        return 'bg-primary-500 text-white';
      case ERROR_SEVERITY.ERROR:
        return 'bg-primary-400 text-white';
      case ERROR_SEVERITY.WARNING:
        return 'bg-warning-500 text-white';
      default:
        return 'bg-info-500 text-white';
    }
  };

  return (
    <span
      className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${getSeverityColor()} ${className}`}
    >
      <span>⚠️</span>
      <span>Errore {errorCode}</span>
    </span>
  );
}
