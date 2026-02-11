'use client';

import { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { it } from 'date-fns/locale';
import { WifiOff, X } from 'lucide-react';
import { useOnlineStatus } from '@/lib/hooks/useOnlineStatus';
import { useBackgroundSync } from '@/lib/hooks/useBackgroundSync';
import { cn } from '@/lib/utils/cn';
import Heading from './Heading';
import Text from './Text';
import Button from './Button';

/**
 * OfflineBanner Component Props
 */
export interface OfflineBannerProps {
  showPendingCount?: boolean;
  fixed?: boolean;
  className?: string;
}

interface FormattedCommand {
  id?: number;
  label: string;
  icon: string;
  formattedTime: string;
  endpoint: string;
}

/**
 * OfflineBanner Component - Enhanced for Phase 53
 *
 * Shows a sticky top banner when offline with:
 * - Dark/muted Ember Noir styling (informational, not alarming)
 * - Last successful update timestamp
 * - Expandable command queue with per-command cancel capability
 * - Reconnection success message
 *
 * Features:
 * - Fixed at top of viewport with backdrop blur
 * - Pushes content down (CSS padding-top on body)
 * - Command queue with device name, action, timestamp, cancel button
 * - Smooth animations and transitions
 *
 * @param {Object} props - Component props
 * @param {boolean} props.showPendingCount - Show pending command count
 * @param {boolean} props.fixed - Use fixed positioning at top
 * @param {string} props.className - Additional CSS classes
 *
 * @example
 * // In ClientProviders
 * <OfflineBanner fixed showPendingCount />
 */
export default function OfflineBanner({
  showPendingCount = true,
  fixed = false,
  className = '',
}: OfflineBannerProps) {
  const { isOnline, wasOffline, lastOnlineAt } = useOnlineStatus();
  const { pendingCommands, lastSyncedCommand, cancelCommand } = useBackgroundSync();
  const [showReconnected, setShowReconnected] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // Cast pending commands to typed array
  const typedPendingCommands = pendingCommands as FormattedCommand[];

  // Show reconnected message briefly when coming back online
  useEffect(() => {
    if (wasOffline) {
      setShowReconnected(true);
      const timer = setTimeout(() => setShowReconnected(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [wasOffline]);

  // Add body padding when banner is visible and fixed
  useEffect(() => {
    if (typeof document === 'undefined') return;

    const shouldShowBanner = !isOnline || showReconnected || lastSyncedCommand;

    if (fixed && shouldShowBanner) {
      // Calculate banner height dynamically
      const bannerHeight = isExpanded && typedPendingCommands.length > 0
        ? 'var(--offline-banner-expanded-height, 200px)'
        : 'var(--offline-banner-height, 60px)';

      document.body.style.paddingTop = typeof bannerHeight === 'string'
        ? bannerHeight
        : `${bannerHeight}px`;
    } else {
      document.body.style.paddingTop = '';
    }

    return () => {
      document.body.style.paddingTop = '';
    };
  }, [fixed, isOnline, showReconnected, lastSyncedCommand, isExpanded, typedPendingCommands.length]);

  // Don't render if online and no special messages
  if (isOnline && !showReconnected && !lastSyncedCommand) {
    return null;
  }

  const baseClasses = cn(
    'transition-all duration-300 z-[60]',
    'animate-fade-in-up',
    fixed ? 'fixed top-0 left-0 right-0' : 'relative'
  );

  // Reconnected state (success styling)
  if (showReconnected) {
    return (
      <div
        className={cn(
          baseClasses,
          'bg-emerald-500/90 dark:bg-emerald-600/90',
          'backdrop-blur-lg',
          'border-b border-emerald-400/30',
          'px-4 py-3',
          className
        )}
        style={{ '--offline-banner-height': '60px' } as React.CSSProperties}
      >
        <div className="flex items-center justify-center gap-2">
          <Text className="text-white font-medium">
            Connessione ripristinata
          </Text>
          {typedPendingCommands.length > 0 && (
            <Text className="text-white/80 text-sm">
              • Sincronizzazione in corso...
            </Text>
          )}
        </div>
      </div>
    );
  }

  // Synced command notification (success styling)
  if (lastSyncedCommand) {
    const syncedCmd = lastSyncedCommand as { endpoint?: string };
    const actionLabels: Record<string, string> = {
      'stove/ignite': '🔥 Stufa accesa',
      'stove/shutdown': '🌙 Stufa spenta',
      'stove/set-power': '⚡ Potenza impostata',
    };
    const label = actionLabels[syncedCmd.endpoint || ''] || 'Comando eseguito';

    return (
      <div
        className={cn(
          baseClasses,
          'bg-emerald-500/90 dark:bg-emerald-600/90',
          'backdrop-blur-lg',
          'border-b border-emerald-400/30',
          'px-4 py-3',
          className
        )}
        style={{ '--offline-banner-height': '60px' } as React.CSSProperties}
      >
        <div className="flex items-center justify-center gap-2">
          <Text className="text-white font-medium">
            ✓ {label}
          </Text>
        </div>
      </div>
    );
  }

  // Offline state (Ember Noir styling - dark/muted, NOT alarming)
  if (!isOnline) {
    const hasCommands = typedPendingCommands.length > 0;
    const estimatedHeight = isExpanded && hasCommands
      ? Math.min(60 + (typedPendingCommands.length * 56) + 40, 300)
      : 60;

    return (
      <div
        className={cn(
          baseClasses,
          // Dark mode: slate-800 with high opacity, muted border
          'bg-slate-800/95 dark:bg-slate-800/95',
          'border-b border-slate-700/50',
          // Light mode: slate-100 background
          '[html:not(.dark)_&]:bg-slate-100/95',
          '[html:not(.dark)_&]:border-slate-200',
          'backdrop-blur-lg',
          'px-4 py-3',
          className
        )}
        style={{ '--offline-banner-height': `${estimatedHeight}px` } as React.CSSProperties}
      >
        <div className="max-w-6xl mx-auto">
          {/* Main offline message */}
          <div className="flex items-start gap-3">
            {/* Icon - subtle informational, NOT alarming */}
            <div className="flex-shrink-0 text-slate-400 dark:text-slate-400 [html:not(.dark)_&]:text-slate-500">
              <WifiOff size={20} strokeWidth={2} aria-hidden="true" />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              {/* Title */}
              <Heading
                level={2}
                size="sm"
                className="text-slate-200 dark:text-slate-200 [html:not(.dark)_&]:text-slate-700"
              >
                Sei offline
              </Heading>

              {/* Subtitle - last online timestamp */}
              {lastOnlineAt && (
                <Text
                  size="xs"
                  className="text-slate-400 dark:text-slate-400 [html:not(.dark)_&]:text-slate-600 mt-0.5"
                >
                  Ultimo aggiornamento:{' '}
                  {formatDistanceToNow(lastOnlineAt, {
                    addSuffix: true,
                    locale: it
                  })}
                </Text>
              )}

              {/* Command queue section */}
              {showPendingCount && hasCommands && (
                <div className="mt-3">
                  {/* Queue header with expand toggle */}
                  <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className={cn(
                      'flex items-center gap-2 w-full',
                      'text-left',
                      'text-slate-300 dark:text-slate-300 [html:not(.dark)_&]:text-slate-600',
                      'hover:text-slate-200 dark:hover:text-slate-200 [html:not(.dark)_&]:hover:text-slate-700',
                      'transition-colors duration-200'
                    )}
                  >
                    <Text size="sm" className="font-medium">
                      Comandi in coda ({typedPendingCommands.length})
                    </Text>
                    <span className={cn(
                      'transition-transform duration-200',
                      isExpanded && 'rotate-180'
                    )}>
                      ▼
                    </span>
                  </button>

                  {/* Expanded command list */}
                  {isExpanded && (
                    <div className="mt-2 space-y-2 max-h-[200px] overflow-y-auto">
                      {typedPendingCommands.map((cmd) => (
                        <div
                          key={cmd.id}
                          className={cn(
                            'flex items-center justify-between gap-3',
                            'p-2.5 rounded-lg',
                            'bg-white/5 dark:bg-white/5',
                            '[html:not(.dark)_&]:bg-slate-200/50',
                            'transition-all duration-200'
                          )}
                        >
                          {/* Command info */}
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <span className="text-lg" aria-hidden="true">
                              {cmd.icon}
                            </span>
                            <div className="flex-1 min-w-0">
                              <Text
                                size="sm"
                                className={cn(
                                  'text-slate-200 dark:text-slate-200',
                                  '[html:not(.dark)_&]:text-slate-700',
                                  'truncate'
                                )}
                              >
                                {cmd.label}
                              </Text>
                              <Text
                                size="xs"
                                className={cn(
                                  'text-slate-400 dark:text-slate-400',
                                  '[html:not(.dark)_&]:text-slate-500'
                                )}
                              >
                                {cmd.formattedTime}
                              </Text>
                            </div>
                          </div>

                          {/* Cancel button */}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => cmd.id && cancelCommand(cmd.id)}
                            className={cn(
                              'flex-shrink-0 h-8 px-3',
                              'text-slate-300 dark:text-slate-300',
                              '[html:not(.dark)_&]:text-slate-600',
                              'border-slate-600/50 dark:border-slate-600/50',
                              '[html:not(.dark)_&]:border-slate-300',
                              'hover:bg-white/10 dark:hover:bg-white/10',
                              '[html:not(.dark)_&]:hover:bg-slate-200'
                            )}
                            aria-label={`Annulla ${cmd.label}`}
                          >
                            <X size={14} className="mr-1" aria-hidden="true" />
                            Annulla
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
