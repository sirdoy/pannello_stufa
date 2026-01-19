'use client';

import Card from './Card';
import Button from './Button';
import Banner from './Banner';
import LoadingOverlay from './LoadingOverlay';
import Toast from './Toast';
import InfoBox from './InfoBox';
import CardAccentBar from './CardAccentBar';
import { Heading, Text, EmptyState, Divider } from './index';

/**
 * DeviceCard Component - Ember Noir Design System
 *
 * Base component for device cards with consistent structure and styling.
 * Abstracts common patterns while allowing device-specific customization.
 *
 * @param {Object} props
 * @param {string} props.icon - Device icon emoji
 * @param {string} props.title - Device title
 * @param {'ember'|'ocean'|'warning'|'sage'|'primary'|'info'|'success'} props.colorTheme - Color theme for accent bar
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
}) {
  // Color theme gradients - Ember Noir palette
  const colorThemes = {
    ember: 'from-ember-600 via-flame-500 to-ember-600',
    ocean: 'from-ocean-500 via-ocean-400 to-ocean-500',
    warning: 'from-warning-500 via-warning-400 to-warning-500',
    sage: 'from-sage-500 via-sage-400 to-sage-500',
    danger: 'from-danger-500 via-danger-400 to-danger-500',
    // Legacy mappings
    primary: 'from-ember-600 via-flame-500 to-ember-600',
    info: 'from-ocean-500 via-ocean-400 to-ocean-500',
    success: 'from-sage-500 via-sage-400 to-sage-500',
  };

  // Status badge colors - Ember Noir palette with light mode
  const statusBadgeColors = {
    neutral: 'bg-slate-800 text-slate-400 border border-slate-700 [html:not(.dark)_&]:bg-slate-100 [html:not(.dark)_&]:text-slate-600 [html:not(.dark)_&]:border-slate-300',
    ember: 'bg-ember-900/40 text-ember-400 border border-ember-500/40 [html:not(.dark)_&]:bg-ember-100/80 [html:not(.dark)_&]:text-ember-700 [html:not(.dark)_&]:border-ember-300',
    ocean: 'bg-ocean-900/40 text-ocean-400 border border-ocean-500/40 [html:not(.dark)_&]:bg-ocean-100/80 [html:not(.dark)_&]:text-ocean-700 [html:not(.dark)_&]:border-ocean-300',
    sage: 'bg-sage-900/40 text-sage-400 border border-sage-500/40 [html:not(.dark)_&]:bg-sage-100/80 [html:not(.dark)_&]:text-sage-700 [html:not(.dark)_&]:border-sage-300',
    warning: 'bg-warning-900/40 text-warning-400 border border-warning-500/40 [html:not(.dark)_&]:bg-warning-100/80 [html:not(.dark)_&]:text-warning-700 [html:not(.dark)_&]:border-warning-300',
    danger: 'bg-danger-900/40 text-danger-400 border border-danger-500/40 [html:not(.dark)_&]:bg-danger-100/80 [html:not(.dark)_&]:text-danger-700 [html:not(.dark)_&]:border-danger-300',
    // Legacy mappings
    primary: 'bg-ember-900/40 text-ember-400 border border-ember-500/40 [html:not(.dark)_&]:bg-ember-100/80 [html:not(.dark)_&]:text-ember-700 [html:not(.dark)_&]:border-ember-300',
    success: 'bg-sage-900/40 text-sage-400 border border-sage-500/40 [html:not(.dark)_&]:bg-sage-100/80 [html:not(.dark)_&]:text-sage-700 [html:not(.dark)_&]:border-sage-300',
    info: 'bg-ocean-900/40 text-ocean-400 border border-ocean-500/40 [html:not(.dark)_&]:bg-ocean-100/80 [html:not(.dark)_&]:text-ocean-700 [html:not(.dark)_&]:border-ocean-300',
  };

  // Skeleton loading (initial load)
  if (loading && skeletonComponent) {
    return skeletonComponent;
  }

  // Not connected state
  if (!connected && onConnect) {
    return (
      <Card variant="elevated" padding={false} className={`overflow-visible transition-all duration-500 ${className}`}>
        <div className="relative">
          {/* Modern Accent Bar with glow effect */}
          <CardAccentBar colorTheme={colorTheme} animated={true} size="md" />

          {/* Content */}
          <div className="p-6 sm:p-8">
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
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card variant="elevated" padding={false} className={`overflow-visible transition-all duration-500 ${className}`}>
      <div className="relative">
        {/* Modern Accent Bar with glow effect */}
        <CardAccentBar colorTheme={colorTheme} animated={true} size="md" />

        {/* Content */}
        <div className="p-6 sm:p-8">
          {/* Header */}
          <div className={`flex items-center ${statusBadge ? 'justify-between' : 'gap-3'} mb-6`}>
            <div className="flex items-center gap-3">
              <span className="text-2xl sm:text-3xl">{icon}</span>
              <Heading level={2} size="xl" className="font-display">{title}</Heading>
            </div>

            {/* Status Badge (inline) */}
            {statusBadge && (
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${statusBadgeColors[statusBadge.color || 'neutral']}`}>
                {statusBadge.icon && <span>{statusBadge.icon}</span>}
                <span className="w-2 h-2 bg-current rounded-full opacity-60" />
                <span className="text-xs font-semibold font-display">{statusBadge.label}</span>
              </div>
            )}
          </div>

          {/* Banners (errors, warnings, etc.) */}
          {banners.map((banner, index) => (
            <div key={index} className="mb-4 sm:mb-6">
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

          {/* Main Content */}
          {children}

          {/* Info Boxes Section - 2 Column Grid */}
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

          {/* Footer Actions */}
          {footerActions.length > 0 && (
            <div className="mt-4 sm:mt-6 space-y-3">
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
