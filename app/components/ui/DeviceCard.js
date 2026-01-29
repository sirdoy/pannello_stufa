'use client';

import { forwardRef } from 'react';
import { cn } from '@/lib/utils/cn';
import SmartHomeCard from './SmartHomeCard';
import Button from './Button';
import Banner from './Banner';
import Badge from './Badge';
import LoadingOverlay from './LoadingOverlay';
import Toast from './Toast';
import InfoBox from './InfoBox';
import HealthIndicator from './HealthIndicator';
import { Heading, EmptyState, Divider } from './index';

/**
 * DeviceCard Component - Ember Noir Design System
 *
 * Device control card extending SmartHomeCard with controls area.
 * Maintains backwards compatibility with existing usages while integrating
 * Badge, HealthIndicator, and SmartHomeCard base.
 *
 * Legacy Props (backwards compatibility):
 * @param {string} props.icon - Device icon emoji
 * @param {string} props.title - Device title
 * @param {'ember'|'ocean'|'warning'|'sage'|'primary'|'info'|'success'|'danger'} props.colorTheme - Color theme for accent bar
 * @param {boolean} props.connected - Connection status
 * @param {string} props.connectionError - Connection error message
 * @param {Function} props.onConnect - Connect button handler
 * @param {string} props.connectButtonLabel - Connect button text
 * @param {string} props.connectInfoRoute - Route for "Maggiori Info" button
 * @param {boolean} props.loading - Loading state
 * @param {string} props.loadingMessage - Loading overlay message
 * @param {ReactNode} props.skeletonComponent - Skeleton component for initial load
 * @param {Object} props.statusBadge - Status badge {label, color, icon}
 * @param {Array} props.banners - Array of banner objects {variant, icon, title, description, dismissible, onDismiss}
 * @param {ReactNode} props.children - Main content area
 * @param {Array} props.infoBoxes - Array of info box objects {icon, label, value, valueColor}
 * @param {string} props.infoBoxesTitle - Section title for info boxes
 * @param {Array} props.footerActions - Array of button objects {label, variant, onClick, ...props}
 * @param {Object} props.toast - Toast notification {show, message, type}
 * @param {Function} props.onToastClose - Toast close handler
 * @param {string} props.className - Additional classes
 *
 * New Props (v3.0 API):
 * @param {'compact'|'default'} props.size - Card size variant
 * @param {'ok'|'warning'|'error'|'critical'} props.healthStatus - Health indicator status
 * @param {boolean} props.isLoading - Alias for loading (new API consistency)
 */
const DeviceCard = forwardRef(function DeviceCard(
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
    ...props
  },
  ref
) {
  // Map legacy color names to new names
  const normalizeColorTheme = (theme) => {
    const colorMap = {
      primary: 'ember',
      info: 'ocean',
      success: 'sage',
    };
    return colorMap[theme] || theme;
  };

  const normalizedColorTheme = normalizeColorTheme(colorTheme);

  // Map legacy statusBadge color to new Badge variant
  const mapStatusBadgeVariant = (color) => {
    const variantMap = {
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
    return variantMap[color] || 'neutral';
  };

  // Determine if badge should pulse (active states)
  const shouldPulse = (color) => {
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
  const hasErrorBanner = banners.some(b => b.variant === 'error');

  return (
    <>
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
            <Banner
              variant={banner.variant}
              icon={banner.icon}
              title={banner.title}
              description={banner.description}
              dismissible={banner.dismissible}
              onDismiss={banner.onDismiss}
            />
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
                  icon={box.icon}
                  label={box.label}
                  value={box.value}
                  valueColor={box.valueColor}
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
                variant={action.variant || 'subtle'}
                className="w-full"
                size={action.size}
                onClick={action.onClick}
                {...action}
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
          icon={icon}
        />
      </SmartHomeCard>

      {/* Toast Notification - rendered outside SmartHomeCard */}
      {toast?.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={onToastClose}
        />
      )}
    </>
  );
});

export default DeviceCard;
