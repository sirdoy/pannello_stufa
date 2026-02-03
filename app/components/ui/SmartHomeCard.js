'use client';

import { forwardRef } from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils/cn';
import Card from './Card';
import CardAccentBar from './CardAccentBar';
import Heading from './Heading';
import Banner from './Banner';
import Spinner from './Spinner';

/**
 * SmartHomeCard CVA Variants
 *
 * Base styling for smart home device cards.
 * Size: compact (dashboard), default (full view)
 * ColorTheme: Passed to CardAccentBar for theming
 */
export const smartHomeCardVariants = cva(
  // Base classes
  [
    'overflow-visible',
    'transition-all duration-500',
    'relative',
  ],
  {
    variants: {
      size: {
        compact: '', // Padding handled in content wrapper
        default: '',
      },
      colorTheme: {
        ember: '',
        ocean: '',
        sage: '',
        warning: '',
        danger: '',
      },
    },
    defaultVariants: {
      size: 'default',
      colorTheme: 'ember',
    },
  }
);

/**
 * SmartHomeCardHeader - Header section with icon and title
 *
 * @param {Object} props - Component props
 * @param {ReactNode} props.children - Header content
 * @param {string} props.className - Additional CSS classes
 */
const SmartHomeCardHeader = forwardRef(function SmartHomeCardHeader(
  { children, className, ...props },
  ref
) {
  return (
    <div
      ref={ref}
      className={cn('flex items-center gap-3 mb-4', className)}
      {...props}
    >
      {children}
    </div>
  );
});

/**
 * SmartHomeCardStatus - Status area for badges and connection status
 *
 * @param {Object} props - Component props
 * @param {ReactNode} props.children - Status content (badges, indicators)
 * @param {string} props.className - Additional CSS classes
 */
const SmartHomeCardStatus = forwardRef(function SmartHomeCardStatus(
  { children, className, ...props },
  ref
) {
  return (
    <div
      ref={ref}
      className={cn('mb-4', className)}
      {...props}
    >
      {children}
    </div>
  );
});

/**
 * SmartHomeCardControls - Controls area for buttons, sliders, etc.
 *
 * @param {Object} props - Component props
 * @param {ReactNode} props.children - Control elements
 * @param {string} props.className - Additional CSS classes
 */
const SmartHomeCardControls = forwardRef(function SmartHomeCardControls(
  { children, className, ...props },
  ref
) {
  return (
    <div
      ref={ref}
      className={cn('space-y-3', className)}
      {...props}
    >
      {children}
    </div>
  );
});

/**
 * SmartHomeCard Component - Ember Noir Design System
 *
 * Base component for all smart home device cards (thermostat, lights, stove).
 * Provides consistent structure with header, status, and controls areas.
 * Uses Card internally with CardAccentBar for theming.
 *
 * @param {Object} props - Component props
 * @param {ReactNode} props.children - Main content
 * @param {string} props.className - Additional CSS classes
 * @param {ReactNode} props.icon - Device icon (emoji or lucide icon)
 * @param {string} props.title - Card title
 * @param {'compact'|'default'} props.size - Card size variant
 * @param {'ember'|'ocean'|'sage'|'warning'|'danger'} props.colorTheme - Color for accent bar
 * @param {boolean} props.isLoading - Show loading overlay
 * @param {boolean} props.error - Show error state
 * @param {string} props.errorMessage - Error message to display
 * @param {boolean} props.disabled - Disabled state with opacity
 * @param {ReactNode} props.headerActions - Actions to display in the header (e.g., refresh button)
 *
 * @example
 * <SmartHomeCard icon="🔥" title="Thermostat" colorTheme="ember">
 *   <SmartHomeCard.Status>
 *     <Badge variant="sage">Online</Badge>
 *   </SmartHomeCard.Status>
 *   <SmartHomeCard.Controls>
 *     <Slider value={20} />
 *   </SmartHomeCard.Controls>
 * </SmartHomeCard>
 */
const SmartHomeCard = forwardRef(function SmartHomeCard(
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
    headerActions = null,
    ...props
  },
  ref
) {
  const paddingClasses = size === 'compact' ? 'p-3 sm:p-4' : 'p-5 sm:p-6';

  return (
    <Card
      ref={ref}
      variant="elevated"
      padding={false}
      className={cn(
        smartHomeCardVariants({ size, colorTheme }),
        disabled && 'opacity-50 pointer-events-none',
        className
      )}
      {...props}
    >
      {/* Accent bar for theming */}
      <CardAccentBar
        colorTheme={colorTheme}
        animated={!disabled}
        size="md"
      />

      {/* Content wrapper with padding */}
      <div className={paddingClasses}>
        {/* Header with icon + title (only if provided) */}
        {(icon || title || headerActions) && (
          <SmartHomeCardHeader>
            {icon && (
              <span className="text-2xl sm:text-3xl" aria-hidden="true">
                {icon}
              </span>
            )}
            {title && (
              <Heading level={2} size={size === 'compact' ? 'md' : 'xl'}>
                {title}
              </Heading>
            )}
            {headerActions && (
              <div className="ml-auto">
                {headerActions}
              </div>
            )}
          </SmartHomeCardHeader>
        )}

        {/* Error state */}
        {error && errorMessage && (
          <Banner variant="error" compact className="mb-4">
            {errorMessage}
          </Banner>
        )}

        {/* Loading overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-slate-900/50 flex items-center justify-center rounded-2xl z-10">
            <Spinner size="lg" />
          </div>
        )}

        {/* Children content */}
        {children}
      </div>
    </Card>
  );
});

// Attach namespace sub-components
SmartHomeCard.Header = SmartHomeCardHeader;
SmartHomeCard.Status = SmartHomeCardStatus;
SmartHomeCard.Controls = SmartHomeCardControls;

// Export both named and default
export {
  SmartHomeCard,
  SmartHomeCardHeader,
  SmartHomeCardStatus,
  SmartHomeCardControls,
};
export default SmartHomeCard;
