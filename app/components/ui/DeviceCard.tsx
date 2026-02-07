'use client';

import { forwardRef, useState, type ReactNode, type CSSProperties } from 'react';
import { cn } from '@/lib/utils/cn';
import SmartHomeCard, { type SmartHomeCardProps } from './SmartHomeCard';
import Button from './Button';
import Banner from './Banner';
import Badge from './Badge';
import LoadingOverlay from './LoadingOverlay';
import Toast from './Toast';
import InfoBox from './InfoBox';
import HealthIndicator from './HealthIndicator';
import RightClickMenu from './RightClickMenu';
import { useContextMenuLongPress, longPressPreventSelection } from '@/app/hooks/useContextMenuLongPress';
import { Heading, EmptyState, Divider } from './index';

export interface ContextMenuItem {
  icon?: ReactNode;
  label: string;
  onSelect?: () => void;
  disabled?: boolean;
  separator?: boolean;
}

interface StatusBadge {
  label: string;
  color: string;
  icon?: ReactNode;
}

interface BannerItem {
  variant: 'info' | 'success' | 'warning' | 'error';
  icon?: any;
  title?: string;
  description?: any;
  dismissible?: boolean;
  onDismiss?: () => void;
  [key: string]: any; // Allow additional Banner props
}

interface InfoBoxItem {
  icon?: ReactNode;
  label: string;
  value: ReactNode;
  valueColor?: string;
}

interface FooterAction {
  label: string;
  variant?: 'ember' | 'ocean' | 'sage' | 'danger' | 'subtle' | 'ghost' | 'success' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
  [key: string]: any;
}

interface ToastNotification {
  show: boolean;
  message?: string;
  type?: 'success' | 'error' | 'info' | 'warning';
  [key: string]: any; // Allow additional Toast props
}

/**
 * DeviceCard Component - Ember Noir Design System
 *
 * Device control card extending SmartHomeCard with controls area.
 * Maintains backwards compatibility with existing usages while integrating
 * Badge, HealthIndicator, and SmartHomeCard base.
 */
export interface DeviceCardProps extends Omit<SmartHomeCardProps, 'headerActions' | 'colorTheme'> {
  colorTheme?: 'ember' | 'ocean' | 'warning' | 'sage' | 'danger' | 'primary' | 'info' | 'success';
  // Legacy props (backwards compatibility)
  connected?: boolean;
  connectionError?: string | null;
  onConnect?: () => void;
  connectButtonLabel?: string;
  connectInfoRoute?: string;
  loading?: boolean;
  loadingMessage?: string;
  skeletonComponent?: ReactNode;
  statusBadge?: StatusBadge;
  banners?: BannerItem[];
  infoBoxes?: InfoBoxItem[];
  infoBoxesTitle?: string;
  footerActions?: FooterAction[];
  toast?: ToastNotification;
  onToastClose?: () => void;
  // New props (v3.0 API)
  healthStatus?: 'ok' | 'warning' | 'error' | 'critical';
  // Context menu props (v4.0)
  contextMenuItems?: ContextMenuItem[];
  onContextMenu?: () => void;
}

const DeviceCard = forwardRef<HTMLDivElement, DeviceCardProps>(function DeviceCard(
  {
    // Legacy props (backwards compatibility)
    icon,
    title,
    colorTheme = 'ember',
    connected = true,
    connectionError = null,
    onConnect,
    connectButtonLabel = 'Connetti',
    connectInfoRoute,
    loading = false,
    loadingMessage = 'Caricamento...',
    skeletonComponent,
    statusBadge,
    banners = [],
    children,
    infoBoxes = [],
    infoBoxesTitle,
    footerActions = [],
    toast,
    onToastClose,
    className = '',
    // New props (v3.0 API)
    size = 'default',
    healthStatus,
    isLoading,
    // Context menu props (v4.0)
    contextMenuItems = [],
    onContextMenu,
    ...props
  },
  ref
) {
  // Context menu state - trigger callback when long-pressed
  const { bind: longPressBind, isPressed } = useContextMenuLongPress(() => {
    onContextMenu?.();
  });
  // Map legacy color names to new names
  const normalizeColorTheme = (theme: string): 'ember' | 'ocean' | 'sage' | 'warning' | 'danger' => {
    const colorMap: Record<string, 'ember' | 'ocean' | 'sage' | 'warning' | 'danger'> = {
      primary: 'ember',
      info: 'ocean',
      success: 'sage',
    };
    return (colorMap[theme] || theme) as 'ember' | 'ocean' | 'sage' | 'warning' | 'danger';
  };

  const normalizedColorTheme = normalizeColorTheme(colorTheme || 'ember');

  // Map legacy statusBadge color to new Badge variant
  const mapStatusBadgeVariant = (color: string): 'ember' | 'ocean' | 'sage' | 'warning' | 'danger' | 'neutral' => {
    const variantMap: Record<string, 'ember' | 'ocean' | 'sage' | 'warning' | 'danger' | 'neutral'> = {
      neutral: 'neutral',
      ember: 'ember',
      ocean: 'ocean',
      sage: 'sage',
      warning: 'warning',
      danger: 'danger',
      // Legacy mappings
      primary: 'ember',
      success: 'sage',
      info: 'ocean',
    };
    return (variantMap[color] || 'neutral') as 'ember' | 'ocean' | 'sage' | 'warning' | 'danger' | 'neutral';
  };

  // Determine if badge should pulse (active states)
  const shouldPulse = (color: string) => {
    const pulseColors = ['ember', 'sage', 'primary', 'success'];
    return pulseColors.includes(color);
  };

  // Combine loading states (support both legacy and new API)
  const isLoadingState = loading || isLoading;

  // Skeleton loading (initial load)
  if (isLoadingState && skeletonComponent) {
    return skeletonComponent;
  }

  // Not connected state with connect handler
  if (!connected && onConnect) {
    return (
      <SmartHomeCard
        ref={ref}
        icon={icon}
        title={title}
        size={size}
        colorTheme={normalizedColorTheme}
        disabled={true}
        className={className}
        {...props}
      >
        <EmptyState
          icon={icon}
          title={`${title} Non Connesso`}
          description={connectionError || `Connetti il tuo account per controllare ${title.toLowerCase()}`}
          level={3}
          action={
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button variant="ember" onClick={onConnect}>
                {connectButtonLabel}
              </Button>
              {connectInfoRoute && (
                <Button variant="subtle" onClick={() => window.location.href = connectInfoRoute}>
                  Maggiori Info
                </Button>
              )}
            </div>
          }
        />
      </SmartHomeCard>
    );
  }

  // Check if there are error banners
  const hasErrorBanner = banners.some((b) => b.variant === 'error');

  // Check if context menu is enabled
  const hasContextMenu = contextMenuItems && contextMenuItems.length > 0;

  // Card content (shared between with/without context menu)
  const cardContent = (
    <SmartHomeCard
      ref={ref}
      icon={icon}
      title={title}
      size={size}
      colorTheme={normalizedColorTheme}
      isLoading={false} // We handle loading separately with LoadingOverlay
      error={hasErrorBanner}
      disabled={!connected}
      className={cn('relative', className)}
      {...props}
    >
      {/* Status area with Badge and HealthIndicator */}
      {(statusBadge || healthStatus) && (
        <SmartHomeCard.Status className="flex items-center justify-between mb-4 -mt-2">
          {/* Legacy statusBadge support - convert to new Badge */}
          {statusBadge && (
            <Badge
              variant={mapStatusBadgeVariant(statusBadge.color)}
              pulse={shouldPulse(statusBadge.color)}
              icon={statusBadge.icon ? <span>{statusBadge.icon}</span> : null}
            >
              {statusBadge.label}
            </Badge>
          )}

          {/* New HealthIndicator (if provided) */}
          {healthStatus && (
            <HealthIndicator status={healthStatus} />
          )}
        </SmartHomeCard.Status>
      )}

      {/* Banners (legacy support) */}
      {banners.map((banner, index) => (
        <div key={index} className="mb-4">
          <Banner {...(banner as any)} />
        </div>
      ))}

      {/* Main content */}
      {children}

      {/* Info boxes section (legacy support) */}
      {infoBoxes.length > 0 && (
        <>
          {infoBoxesTitle && (
            <Divider label={infoBoxesTitle} variant="gradient" spacing="large" />
          )}
          <div className="grid grid-cols-2 gap-2.5 mb-6">
            {infoBoxes.map((box, index) => (
              <InfoBox
                key={index}
                {...(box as any)}
              />
            ))}
          </div>
        </>
      )}

      {/* Footer actions using SmartHomeCard.Controls */}
      {footerActions.length > 0 && (
        <SmartHomeCard.Controls className="mt-4 sm:mt-6">
          {footerActions.map((action, index) => (
            <Button
              key={index}
              {...(action as any)}
              className="w-full"
            >
              {action.label}
            </Button>
          ))}
        </SmartHomeCard.Controls>
      )}

      {/* Loading Overlay */}
      <LoadingOverlay
        show={isLoadingState}
        message={loadingMessage}
        icon={icon as any}
      />
    </SmartHomeCard>
  );

  return (
    <>
      {hasContextMenu ? (
        <RightClickMenu>
          <RightClickMenu.Trigger asChild>
            <div
              {...longPressBind()}
              style={{
                ...(longPressPreventSelection as CSSProperties),
                transform: isPressed ? 'scale(0.98)' : 'scale(1)',
                transition: 'transform 150ms cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            >
              {cardContent}
            </div>
          </RightClickMenu.Trigger>
          <RightClickMenu.Content>
            {contextMenuItems.map((item, index) => (
              item.separator ? (
                <RightClickMenu.Separator key={index} />
              ) : (
                <RightClickMenu.Item
                  key={item.label}
                  icon={item.icon}
                  onSelect={item.onSelect}
                  disabled={item.disabled}
                >
                  {item.label}
                </RightClickMenu.Item>
              )
            ))}
          </RightClickMenu.Content>
        </RightClickMenu>
      ) : (
        cardContent
      )}

      {/* Toast Notification - rendered outside SmartHomeCard */}
      {toast?.show && (
        <Toast {...(toast as any)} onClose={onToastClose} />
      )}
    </>
  );
});

export default DeviceCard;
