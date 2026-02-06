'use client';

import { forwardRef } from 'react';
import { cn } from '@/lib/utils/cn';
import SmartHomeCard from './SmartHomeCard';
import Badge from './Badge';
import ConnectionStatus from './ConnectionStatus';

/**
 * StatusCard Component - Ember Noir Design System
 *
 * Specialized card for displaying read-only device status information.
 * Extends SmartHomeCard with integrated Badge and ConnectionStatus components.
 *
 * @param {Object} props - Component props
 * @param {ReactNode} props.children - Additional custom content
 * @param {string} props.className - Additional CSS classes
 * @param {ReactNode} props.icon - Device icon (emoji or lucide icon)
 * @param {string} props.title - Card title
 * @param {'compact'|'default'} props.size - Card size variant
 * @param {'ember'|'ocean'|'sage'|'warning'|'danger'} props.colorTheme - Color for accent bar
 * @param {boolean} props.isLoading - Show loading overlay
 * @param {boolean} props.error - Show error state
 * @param {string} props.errorMessage - Error message to display
 * @param {boolean} props.disabled - Disabled state with opacity
 * @param {string} props.status - Status text to display in Badge
 * @param {'ember'|'sage'|'ocean'|'warning'|'danger'|'neutral'} props.statusVariant - Badge color variant
 * @param {'online'|'offline'|'connecting'|'unknown'} props.connectionStatus - Connection state
 *
 * @example
 * // Basic status display
 * <StatusCard
 *   icon="🌡️"
 *   title="Thermostat"
 *   status="Heating"
 *   statusVariant="ember"
 *   connectionStatus="online"
 * />
 *
 * @example
 * // Compact with custom content
 * <StatusCard
 *   icon="💡"
 *   title="Lights"
 *   size="compact"
 *   status="On"
 *   statusVariant="sage"
 * >
 *   <p>2 lights active</p>
 * </StatusCard>
 */
const StatusCard = forwardRef(function StatusCard(
  {
    children,
    className,
    icon,
    title,
    size = 'default',
    colorTheme = 'ember',
    isLoading = false,
    error = false,
    errorMessage,
    disabled = false,
    status,
    statusVariant = 'neutral',
    connectionStatus,
    ...props
  },
  ref
) {
  // Pulse animation for active states (ember = heating/active, sage = online/healthy)
  const shouldPulse = statusVariant === 'ember' || statusVariant === 'sage';

  return (
    <SmartHomeCard
      ref={ref}
      icon={icon}
      title={title}
      size={size}
      colorTheme={colorTheme}
      isLoading={isLoading}
      error={error}
      errorMessage={errorMessage}
      disabled={disabled}
      className={className}
      {...props}
    >
      <SmartHomeCard.Status>
        <div className="flex items-center">
          {/* Status Badge with pulse for active states */}
          {status && (
            <Badge
              variant={statusVariant}
              pulse={shouldPulse}
            >
              {status}
            </Badge>
          )}

          {/* Connection Status */}
          {connectionStatus && (
            <ConnectionStatus
              status={connectionStatus}
              size={size === 'compact' ? 'sm' : 'md'}
              className={cn(status && 'ml-3')}
            />
          )}
        </div>
      </SmartHomeCard.Status>

      {/* Custom content via children */}
      {children}
    </SmartHomeCard>
  );
});

StatusCard.displayName = 'StatusCard';

export { StatusCard };
export default StatusCard;
