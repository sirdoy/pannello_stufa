'use client';

import { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { it } from 'date-fns/locale';
import { WifiOff, X } from 'lucide-react';
import { useOnlineStatus } from '@/lib/hooks/useOnlineStatus';
import { useDepsChanged } from '@/lib/hooks/useDepsChanged';
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
  // "Reconnected" shows while wasOffline, until its 3s timer expires; reset each time wasOffline flips
  const [reconnectedExpired, setReconnectedExpired] = useState(false);
  const wasOfflineChanged = useDepsChanged([wasOffline]);
  if (wasOfflineChanged && reconnectedExpired) {
    setReconnectedExpired(false);
  }
  const showReconnected = wasOffline && !reconnectedExpired;
  const [isExpanded, setIsExpanded] = useState(false);

  // Show reconnected message briefly when coming back online
  useEffect(() => {
    if (wasOffline) {
      const timer = setTimeout(() => setReconnectedExpired(true), 3000);
      return () => clearTimeout(timer);
    }
  }, [wasOffline]);

  // Add body padding when banner is visible and fixed
  useEffect(() => {
    if (typeof document === 'undefined') return;

    const shouldShowBanner = !isOnline || showReconnected || lastSyncedCommand;

    if (fixed && shouldShowBanner) {
      // Calculate banner height dynamically
      const bannerHeight = isExpanded && pendingCommands.length > 0
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
  }, [fixed, isOnline, showReconnected, lastSyncedCommand, isExpanded, pendingCommands.length]);

  // Don't render if online and no special messages
  if (isOnline && !showReconnected && !lastSyncedCommand) {
    return null;
  }

  const baseClasses = cn(
    'z-60 transition-all duration-300',
    'animate-fade-in-up',
    fixed ? 'fixed inset-x-0 top-0' : 'relative'
  );

  // Reconnected state (success styling)
  if (showReconnected) {
    return (
      <div
        className={cn(
          baseClasses,
          'bg-emerald-600/90',
          'backdrop-blur-lg',
          'border-b border-emerald-400/30',
          'px-4 py-3',
          className
        )}
        style={{ '--offline-banner-height': '60px' } as React.CSSProperties}
      >
        <div className="flex items-center justify-center gap-2">
          <Text className="font-medium text-white">
            Connessione ripristinata
          </Text>
          {pendingCommands.length > 0 && (
            <Text className="text-sm text-white/80">
              • Sincronizzazione in corso...
            </Text>
          )}
        </div>
      </div>
    );
  }

  // Synced command notification (success styling)
  if (lastSyncedCommand) {
    const actionLabels: Record<string, string> = {
      'stove/ignite': '🔥 Stufa accesa',
      'stove/shutdown': '🌙 Stufa spenta',
      'stove/set-power': '⚡ Potenza impostata',
    };
    const label = actionLabels[lastSyncedCommand.endpoint || ''] || 'Comando eseguito';

    return (
      <div
        className={cn(
          baseClasses,
          'bg-emerald-600/90',
          'backdrop-blur-lg',
          'border-b border-emerald-400/30',
          'px-4 py-3',
          className
        )}
        style={{ '--offline-banner-height': '60px' } as React.CSSProperties}
      >
        <div className="flex items-center justify-center gap-2">
          <Text className="font-medium text-white">
            ✓ {label}
          </Text>
        </div>
      </div>
    );
  }

  // Offline state (Ember Noir styling - dark/muted, NOT alarming)
  if (!isOnline) {
    const hasCommands = pendingCommands.length > 0;
    const estimatedHeight = isExpanded && hasCommands
      ? Math.min(60 + (pendingCommands.length * 56) + 40, 300)
      : 60;

    return (
      <div
        className={cn(
          baseClasses,
          // Opaque floating surface
          'bg-(--surface-solid)',
          'border-b-[0.5px] border-white/8',
          'backdrop-blur-xl',
          'px-4 py-3',
          className
        )}
        style={{ '--offline-banner-height': `${estimatedHeight}px` } as React.CSSProperties}
      >
        <div className="mx-auto max-w-6xl">
          {/* Main offline message */}
          <div className="flex items-start gap-3">
            {/* Icon - subtle informational, NOT alarming */}
            <div className="shrink-0 text-(--text-2)">
              <WifiOff size={20} strokeWidth={2} aria-hidden="true" />
            </div>

            {/* Content */}
            <div className="min-w-0 flex-1">
              {/* Title */}
              <Heading
                level={2}
                size="sm"
                className="text-(--text-1)"
              >
                Sei offline
              </Heading>

              {/* Subtitle - last online timestamp */}
              {lastOnlineAt && (
                <Text
                  size="xs"
                  className="mt-0.5 text-(--text-2)"
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
                      'flex w-full items-center gap-2',
                      'text-left',
                      'text-(--text-2)',
                      'hover:text-(--text-1)',
                      'transition-colors duration-200'
                    )}
                  >
                    <Text size="sm" className="font-medium">
                      Comandi in coda ({pendingCommands.length})
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
                    <div className="mt-2 max-h-50 space-y-2 overflow-y-auto">
                      {pendingCommands.map((cmd) => (
                        <div
                          key={cmd.id}
                          className={cn(
                            'flex items-center justify-between gap-3',
                            'rounded-lg p-2.5',
                            'bg-white/5',
                            'transition-all duration-200'
                          )}
                        >
                          {/* Command info */}
                          <div className="flex min-w-0 flex-1 items-center gap-2">
                            <span className="text-lg" aria-hidden="true">
                              {cmd.icon}
                            </span>
                            <div className="min-w-0 flex-1">
                              <Text
                                size="sm"
                                className={cn(
                                  'text-(--text-1)',
                                  'truncate'
                                )}
                              >
                                {cmd.label}
                              </Text>
                              <Text
                                size="xs"
                                className={cn(
                                  'text-(--text-2)',
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
                              'h-8 shrink-0 px-3',
                              'text-(--text-2)',
                              'border-white/14',
                              'hover:bg-white/10',
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
