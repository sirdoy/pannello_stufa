/**
 * ErrorAlert Component - Ember Noir Design System
 *
 * Displays stove errors and alarms with appropriate styling.
 * Uses Banner component for consistent presentation.
 */

import type { ReactNode } from 'react';
import { ERROR_SEVERITY, getErrorInfo } from '@/lib/errorMonitor';
import Banner from './Banner';
import Button from './Button';
import Text from './Text';

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
  const getSeverityConfig = (): { variant: 'error' | 'warning' | 'info'; icon: string } => {
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
  // Use <span> with block display to avoid <div> inside <p> hydration error
  const fullDescription: ReactNode = (
    <>
      <span className="block font-semibold mb-2">
        {errorDescription || errorInfo.description}
      </span>
      {showSuggestion && suggestion && (
        <span className="block mt-3 p-3 bg-slate-800/40 backdrop-blur-2xl rounded-lg ring-1 ring-slate-700/50 ring-inset [html:not(.dark)_&]:bg-slate-100/60 [html:not(.dark)_&]:ring-slate-200">
          <span className="block mb-1 text-sm font-medium text-slate-300 [html:not(.dark)_&]:text-slate-600">
            💡 Suggerimento:
          </span>
          <span className="block text-sm text-slate-400 [html:not(.dark)_&]:text-slate-500">
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
      dismissKey=""
      compact={false}
      className={className}
    >
      {/* Banner children required but unused */}
    </Banner>
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

  // Ember Noir severity colors
  const getSeverityClasses = () => {
    switch (severity) {
      case ERROR_SEVERITY.CRITICAL:
        return 'bg-gradient-to-r from-danger-500 to-danger-600 text-white shadow-[0_2px_8px_rgba(239,68,68,0.3)]';
      case ERROR_SEVERITY.ERROR:
        return 'bg-gradient-to-r from-danger-400 to-danger-500 text-white shadow-[0_2px_8px_rgba(239,68,68,0.25)]';
      case ERROR_SEVERITY.WARNING:
        return 'bg-gradient-to-r from-warning-400 to-warning-500 text-white shadow-[0_2px_8px_rgba(234,179,8,0.25)]';
      default:
        return 'bg-gradient-to-r from-ocean-400 to-ocean-500 text-white shadow-[0_2px_8px_rgba(67,125,174,0.25)]';
    }
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold font-display ${getSeverityClasses()} ${className}`}
    >
      <span>⚠️</span>
      <span>Errore {errorCode}</span>
    </span>
  );
}
