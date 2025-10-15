/**
 * ErrorAlert Component
 * Displays stove errors and alarms with appropriate styling
 */

import { ERROR_SEVERITY, getErrorInfo } from '@/lib/errorMonitor';
import Banner from './Banner';
import Button from './Button';

export default function ErrorAlert({ errorCode, errorDescription, className = '', onDismiss, showSuggestion = true, showDetailsButton = false }) {
  if (errorCode === 0 || !errorCode) {
    return null;
  }

  const errorInfo = getErrorInfo(errorCode);
  const { severity, suggestion } = errorInfo;

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

  // Build description with suggestion if available
  const fullDescription = (
    <>
      <div className="font-semibold mb-2">
        {errorDescription || errorInfo.description}
      </div>
      {showSuggestion && suggestion && (
        <div className="mt-3 p-3 bg-white/40 backdrop-blur-sm rounded-lg border border-white/60">
          <p className="text-sm font-medium text-neutral-700 mb-1">💡 Suggerimento:</p>
          <p className="text-sm text-neutral-600">{suggestion}</p>
        </div>
      )}
    </>
  );

  // Actions for banner (optional details button)
  const actions = showDetailsButton ? (
    <Button
      variant="outline"
      size="sm"
      onClick={() => window.location.href = '/errors'}
    >
      📋 Vedi Storico Errori
    </Button>
  ) : undefined;

  return (
    <Banner
      variant={config.variant}
      icon={config.icon}
      title={`Allarme Stufa - Codice ${errorCode}`}
      description={fullDescription}
      actions={actions}
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
