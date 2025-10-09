/**
 * ErrorAlert Component
 * Displays stove errors and alarms with appropriate styling
 */

import { ERROR_SEVERITY, getErrorInfo } from '@/lib/errorMonitor';
import Banner from './Banner';

export default function ErrorAlert({ errorCode, errorDescription, className = '', onDismiss }) {
  if (errorCode === 0 || !errorCode) {
    return null;
  }

  const errorInfo = getErrorInfo(errorCode);
  const { severity } = errorInfo;

  // Map severity to Banner variant and icon
  const getSeverityConfig = () => {
    switch (severity) {
      case ERROR_SEVERITY.CRITICAL:
        return { variant: 'error', icon: '🚨' };
      case ERROR_SEVERITY.ERROR:
        return { variant: 'error', icon: '⚠️' };
      case ERROR_SEVERITY.WARNING:
        return { variant: 'warning', icon: '⚡' };
      default:
        return { variant: 'info', icon: 'ℹ️' };
    }
  };

  const config = getSeverityConfig();

  return (
    <Banner
      variant={config.variant}
      icon={config.icon}
      title={`Codice Errore: ${errorCode}`}
      description={errorDescription || errorInfo.description}
      dismissible={!!onDismiss}
      onDismiss={onDismiss}
      className={className}
    />
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
