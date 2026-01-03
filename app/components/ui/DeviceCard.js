'use client';

import Card from './Card';
import Button from './Button';
import Banner from './Banner';
import LoadingOverlay from './LoadingOverlay';
import Toast from './Toast';
import InfoBox from './InfoBox';
import { Heading, Text, EmptyState, Divider } from './index';

/**
 * DeviceCard Component
 *
 * Base component for device cards with consistent structure and styling.
 * Abstracts common patterns while allowing device-specific customization.
 *
 * @param {Object} props
 * @param {string} props.icon - Device icon emoji
 * @param {string} props.title - Device title
 * @param {'primary'|'info'|'warning'|'success'} props.colorTheme - Color theme for accent bar
 * @param {boolean} props.connected - Connection status
 * @param {string} props.connectionError - Connection error message
 * @param {Function} props.onConnect - Connect button handler
 * @param {string} props.connectButtonLabel - Connect button text
 * @param {string} props.connectInfoRoute - Route for "Maggiori Info" button
 * @param {boolean} props.loading - Loading state
 * @param {string} props.loadingMessage - Loading overlay message
 * @param {ReactNode} props.skeletonComponent - Skeleton component for initial load
 * @param {Object} props.statusBadge - Optional status badge {label, color, icon}
 * @param {Array} props.banners - Array of banner objects {variant, icon, title, description, dismissible, onDismiss}
 * @param {ReactNode} props.children - Main content area
 * @param {Array} props.infoBoxes - Array of info box objects {icon, label, value, valueColor}
 * @param {string} props.infoBoxesTitle - Section title for info boxes
 * @param {Array} props.footerActions - Array of button objects {label, variant, onClick, ...props}
 * @param {Object} props.toast - Toast notification {show, message, type}
 * @param {Function} props.onToastClose - Toast close handler
 * @param {string} props.className - Additional classes
 */
export default function DeviceCard({
  icon,
  title,
  colorTheme = 'primary',
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
}) {
  // Color theme gradients
  const colorThemes = {
    primary: 'from-primary-500 via-accent-500 to-primary-500',
    info: 'from-info-500 via-accent-500 to-info-500',
    warning: 'from-warning-500 via-accent-500 to-warning-500',
    success: 'from-success-500 via-accent-500 to-success-500',
  };

  // Status badge colors for inline badge
  const statusBadgeColors = {
    neutral: 'bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300',
    primary: 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400',
    success: 'bg-success-100 dark:bg-success-900/30 text-success-700 dark:text-success-400',
    warning: 'bg-warning-100 dark:bg-warning-900/30 text-warning-700 dark:text-warning-400',
    info: 'bg-info-100 dark:bg-info-900/30 text-info-700 dark:text-info-400',
  };

  // Skeleton loading (initial load)
  if (loading && skeletonComponent) {
    return skeletonComponent;
  }

  // Not connected state
  if (!connected && onConnect) {
    return (
      <Card liquid className={`overflow-visible transition-all duration-500 ${className}`}>
        <div className="relative">
          {/* Accent bar */}
          <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${colorThemes[colorTheme]} opacity-80`} />

          {/* Content */}
          <div className="p-6 sm:p-8">
            <EmptyState
              icon={icon}
              title={`${title} Non Connesso`}
              description={connectionError || `Connetti il tuo account per controllare ${title.toLowerCase()}`}
              action={
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button liquid variant="success" onClick={onConnect}>
                    {connectButtonLabel}
                  </Button>
                  {connectInfoRoute && (
                    <Button liquid variant="outline" onClick={() => window.location.href = connectInfoRoute}>
                      Maggiori Info
                    </Button>
                  )}
                </div>
              }
            />
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card liquid className={`overflow-visible transition-all duration-500 ${className}`}>
      <div className="relative">
        {/* Accent bar */}
        <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${colorThemes[colorTheme]} opacity-80`} />

        {/* Content */}
        <div className="p-6 sm:p-8">
          {/* Header */}
          <div className={`flex items-center ${statusBadge ? 'justify-between' : 'gap-2'} mb-6`}>
            <div className="flex items-center gap-2">
              <span className="text-2xl sm:text-3xl">{icon}</span>
              <Heading level={2} size="xl">{title}</Heading>
            </div>

            {/* Status Badge (inline) */}
            {statusBadge && (
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${statusBadgeColors[statusBadge.color || 'neutral']}`}>
                {statusBadge.icon && <span>{statusBadge.icon}</span>}
                <span className="w-2 h-2 bg-current rounded-full opacity-50" />
                <span className="text-xs font-medium">{statusBadge.label}</span>
              </div>
            )}
          </div>

          {/* Banners (errors, warnings, etc.) */}
          {banners.map((banner, index) => (
            <div key={index} className="mb-4 sm:mb-6">
              <Banner
                liquid
                variant={banner.variant}
                icon={banner.icon}
                title={banner.title}
                description={banner.description}
                dismissible={banner.dismissible}
                onDismiss={banner.onDismiss}
              />
            </div>
          ))}

          {/* Main Content */}
          {children}

          {/* Info Boxes Section */}
          {infoBoxes.length > 0 && (
            <>
              {infoBoxesTitle && (
                <Divider label={infoBoxesTitle} variant="gradient" spacing="large" />
              )}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 mb-6">
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

          {/* Footer Actions */}
          {footerActions.length > 0 && (
            <div className="mt-4 sm:mt-6 space-y-3">
              {footerActions.map((action, index) => (
                <Button
                  key={index}
                  liquid
                  variant={action.variant || 'outline'}
                  className="w-full"
                  size={action.size}
                  onClick={action.onClick}
                  {...action}
                >
                  {action.label}
                </Button>
              ))}
            </div>
          )}
        </div>

        {/* Loading Overlay */}
        <LoadingOverlay
          show={loading}
          message={loadingMessage}
          icon={icon}
        />
      </div>

      {/* Toast Notification */}
      {toast?.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={onToastClose}
        />
      )}
    </Card>
  );
}
