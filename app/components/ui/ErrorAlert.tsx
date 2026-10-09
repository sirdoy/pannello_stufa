/**
 * ErrorAlert Component - Ember Noir Design System
 *
 * Displays stove errors and alarms with appropriate styling.
 * Uses Banner component for consistent presentation.
 */

import type { ReactNode } from 'react';
import { ERROR_SEVERITY, getErrorInfo } from '@/lib/errorMonitor';
import { AlertTriangle, Info, Siren, Zap } from 'lucide-react';
import Banner from './Banner';
import Button from './Button';

/**
 * ErrorAlert Component Props
 */
export interface ErrorAlertProps {
  errorCode: number;
  errorDescription?: string;
  className?: string;
  onDismiss?: () => void;
  showSuggestion?: boolean;
  showDetailsButton?: boolean;
}

/**
 * ErrorBadge Component Props
 */
export interface ErrorBadgeProps {
  errorCode: number;
  className?: string;
}

export default function ErrorAlert({ errorCode, errorDescription, className = '', onDismiss, showSuggestion = true, showDetailsButton = false }: ErrorAlertProps) {
  if (errorCode === 0 || !errorCode) {
    return null;
  }

  const errorInfo = getErrorInfo(errorCode);
  const { severity, suggestion } = errorInfo;

  // Map severity to Banner variant and icon
  const getSeverityConfig = (): { variant: 'error' | 'warning' | 'info'; icon: ReactNode } => {
    switch (severity) {
      case ERROR_SEVERITY.CRITICAL:
        return { variant: 'error', icon: <Siren size={24} /> };
      case ERROR_SEVERITY.ERROR:
        return { variant: 'error', icon: <AlertTriangle size={24} /> };
      case ERROR_SEVERITY.WARNING:
        return { variant: 'warning', icon: <Zap size={24} /> };
      default:
        return { variant: 'info', icon: <Info size={24} /> };
    }
  };

  const config = getSeverityConfig();

  // Build description with suggestion if available
  // Use <span> with block display to avoid <div> inside <p> hydration error
  const fullDescription: ReactNode = (
    <>
      <span className="mb-2 block font-semibold">
        {errorDescription || errorInfo.description}
      </span>
      {showSuggestion && suggestion && (
        <span className="mt-3 block rounded-xl border-[0.5px] border-white/6 bg-white/4 p-3">
          <span className="mb-1 block text-sm font-medium text-(--text-1)">
            Suggerimento:
          </span>
          <span className="block text-sm text-(--text-2)">
            {suggestion}
          </span>
        </span>
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
      Vedi Storico Errori
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
      dismissKey=""
      compact={false}
      className={className}
    />
  );
}

/**
 * ErrorBadge - Compact error indicator
 * Uses Ember Noir danger/warning palette
 */
export function ErrorBadge({ errorCode, className = '' }: ErrorBadgeProps) {
  if (errorCode === 0 || !errorCode) {
    return null;
  }

  const errorInfo = getErrorInfo(errorCode);
  const { severity } = errorInfo;

  // Severity tints (same recipe as Badge)
  const getSeverityClasses = () => {
    switch (severity) {
      case ERROR_SEVERITY.CRITICAL:
        return 'border-[0.5px] border-danger-400/40 bg-danger-500/30 text-danger-200';
      case ERROR_SEVERITY.ERROR:
        return 'border-[0.5px] border-danger-400/30 bg-danger-500/20 text-danger-300';
      case ERROR_SEVERITY.WARNING:
        return 'border-[0.5px] border-warning-400/30 bg-warning-500/20 text-warning-300';
      default:
        return 'border-[0.5px] border-ocean-400/30 bg-ocean-500/20 text-ocean-300';
    }
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-display text-xs font-bold ${getSeverityClasses()} ${className}`}
    >
      <AlertTriangle size={12} aria-hidden="true" />
      <span>Errore {errorCode}</span>
    </span>
  );
}
