'use client';

import { forwardRef, type ReactNode, type ComponentPropsWithoutRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
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
 */
export interface SmartHomeCardHeaderProps extends ComponentPropsWithoutRef<'div'> {
  children?: ReactNode;
}

const SmartHomeCardHeader = forwardRef<HTMLDivElement, SmartHomeCardHeaderProps>(function SmartHomeCardHeader(
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
 */
export interface SmartHomeCardStatusProps extends ComponentPropsWithoutRef<'div'> {
  children?: ReactNode;
}

const SmartHomeCardStatus = forwardRef<HTMLDivElement, SmartHomeCardStatusProps>(function SmartHomeCardStatus(
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
 */
export interface SmartHomeCardControlsProps extends ComponentPropsWithoutRef<'div'> {
  children?: ReactNode;
}

const SmartHomeCardControls = forwardRef<HTMLDivElement, SmartHomeCardControlsProps>(function SmartHomeCardControls(
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
export interface SmartHomeCardProps
  extends ComponentPropsWithoutRef<'div'>,
    VariantProps<typeof smartHomeCardVariants> {
  children?: ReactNode;
  icon?: ReactNode;
  title?: string;
  isLoading?: boolean;
  error?: boolean;
  errorMessage?: string;
  disabled?: boolean;
  headerActions?: ReactNode;
}

type SmartHomeCardComponent = React.ForwardRefExoticComponent<
  SmartHomeCardProps & React.RefAttributes<HTMLDivElement>
> & {
  Header: typeof SmartHomeCardHeader;
  Status: typeof SmartHomeCardStatus;
  Controls: typeof SmartHomeCardControls;
};

const SmartHomeCard = forwardRef<HTMLDivElement, SmartHomeCardProps>(function SmartHomeCard(
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
        colorTheme={colorTheme ?? 'ember'}
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
          <Banner {...({ variant: "error", compact: true, className: "mb-4", children: errorMessage } as any)} />
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
(SmartHomeCard as SmartHomeCardComponent).Header = SmartHomeCardHeader;
(SmartHomeCard as SmartHomeCardComponent).Status = SmartHomeCardStatus;
(SmartHomeCard as SmartHomeCardComponent).Controls = SmartHomeCardControls;

// Export with proper type
const SmartHomeCardWithNamespace = SmartHomeCard as SmartHomeCardComponent;

// Export both named and default
export {
  SmartHomeCardWithNamespace as SmartHomeCard,
  SmartHomeCardHeader,
  SmartHomeCardStatus,
  SmartHomeCardControls,
};
export default SmartHomeCardWithNamespace;
