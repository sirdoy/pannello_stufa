'use client';

import type React from 'react';
import { useState, useEffect } from 'react';
import type { VariantProps } from 'class-variance-authority';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils/cn';
import { X, Info, AlertTriangle, AlertCircle, CheckCircle, Flame } from 'lucide-react';
import Heading from './Heading';
import Text from './Text';

/**
 * Banner Variants - CVA Configuration
 *
 * Variant: info, warning, error, success, ember
 * Compact: true, false
 */
export const bannerVariants = cva(
  // Base classes
  [
    'rounded-xl backdrop-blur-lg',
    'transition-all duration-300',
    'animate-fade-in-up',
    'border',
  ],
  {
    variants: {
      variant: {
        info: [
          'bg-ocean-500/[0.15] [html:not(.dark)_&]:bg-ocean-500/[0.08]',
          'border-ocean-500/25 [html:not(.dark)_&]:border-ocean-400/25',
        ],
        warning: [
          'bg-warning-500/[0.15] [html:not(.dark)_&]:bg-warning-500/[0.08]',
          'border-warning-500/25 [html:not(.dark)_&]:border-warning-400/25',
        ],
        error: [
          'bg-danger-500/[0.15] [html:not(.dark)_&]:bg-danger-500/[0.08]',
          'border-danger-500/25 [html:not(.dark)_&]:border-danger-400/25',
        ],
        success: [
          'bg-sage-500/[0.15] [html:not(.dark)_&]:bg-sage-500/[0.08]',
          'border-sage-500/25 [html:not(.dark)_&]:border-sage-400/25',
        ],
        ember: [
          'bg-ember-500/[0.15] [html:not(.dark)_&]:bg-ember-500/[0.08]',
          'border-ember-500/25 [html:not(.dark)_&]:border-ember-400/25',
          'shadow-ember-glow-sm [html:not(.dark)_&]:shadow-none',
        ],
      },
      compact: {
        true: 'p-3',
        false: 'p-4 sm:p-5',
      },
    },
    defaultVariants: {
      variant: 'info',
      compact: false,
    },
  }
);

/**
 * Text color variants per banner type
 */
const textVariants = {
  info: {
    title: 'text-ocean-200 [html:not(.dark)_&]:text-ocean-800',
    description: 'text-ocean-300 [html:not(.dark)_&]:text-ocean-700',
    icon: 'text-ocean-400 [html:not(.dark)_&]:text-ocean-600',
  },
  warning: {
    title: 'text-warning-200 [html:not(.dark)_&]:text-warning-800',
    description: 'text-warning-300 [html:not(.dark)_&]:text-warning-700',
    icon: 'text-warning-400 [html:not(.dark)_&]:text-warning-700',
  },
  error: {
    title: 'text-danger-200 [html:not(.dark)_&]:text-danger-800',
    description: 'text-danger-300 [html:not(.dark)_&]:text-danger-700',
    icon: 'text-danger-400 [html:not(.dark)_&]:text-danger-600',
  },
  success: {
    title: 'text-sage-200 [html:not(.dark)_&]:text-sage-800',
    description: 'text-sage-300 [html:not(.dark)_&]:text-sage-700',
    icon: 'text-sage-400 [html:not(.dark)_&]:text-sage-600',
  },
  ember: {
    title: 'text-ember-200 [html:not(.dark)_&]:text-ember-800',
    description: 'text-ember-300 [html:not(.dark)_&]:text-ember-700',
    icon: 'text-ember-400 [html:not(.dark)_&]:text-ember-600',
  },
};

/**
 * Icon mapping per variant (lucide icons)
 */
const iconMap = {
  info: Info,
  warning: AlertTriangle,
  error: AlertCircle,
  success: CheckCircle,
  ember: Flame,
};

export interface BannerProps extends VariantProps<typeof bannerVariants> {
  /** Custom icon (overrides default) - emoji string or React element */
  icon?: string | React.ReactNode;
  /** Banner title */
  title?: string;
  /** Banner content */
  description?: string | React.ReactNode;
  /** Action buttons */
  actions?: React.ReactNode;
  /** Show dismiss button */
  dismissible?: boolean;
  /** Dismiss handler */
  onDismiss?: () => void;
  /** Unique key for persistent dismissal */
  dismissKey?: string;
  /** Additional CSS classes */
  className?: string;
  /** Additional content */
  children?: React.ReactNode;
}

/**
 * Banner Component - Ember Noir Design System
 *
 * Sophisticated alert/notification banner with warm aesthetic.
 * Supports persistent dismissal via localStorage.
 * Uses CVA for variant and compact styling.
 *
 * @example
 * <Banner
 *   variant="warning"
 *   title="Connection Lost"
 *   description="Attempting to reconnect..."
 *   dismissible
 *   onDismiss={() => console.log('dismissed')}
 * />
 */
export default function Banner({
  variant = 'info',
  icon,
  title,
  description,
  actions,
  dismissible = false,
  onDismiss,
  dismissKey,
  compact = false,
  className = '',
  children,
}: BannerProps) {
  const [isDismissed, setIsDismissed] = useState(false);

  // Check persistent dismissal
  useEffect(() => {
    if (dismissKey && typeof window !== 'undefined') {
      const dismissed = localStorage.getItem(`banner-dismissed-${dismissKey}`);
      if (dismissed === 'true') {
        setIsDismissed(true);
      }
    }
  }, [dismissKey]);

  // Handle dismiss
  const handleDismiss = () => {
    setIsDismissed(true);
    if (dismissKey && typeof window !== 'undefined') {
      localStorage.setItem(`banner-dismissed-${dismissKey}`, 'true');
    }
    if (onDismiss) {
      onDismiss();
    }
  };

  if (isDismissed) {
    return null;
  }

  // Get variant-specific styles (with proper type guard)
  const validVariant: keyof typeof textVariants =
    variant && variant in textVariants ? variant : 'info';
  const styles = textVariants[validVariant];

  // Get icon component or custom icon
  const IconComponent = iconMap[validVariant];
  const iconSize = compact ? 20 : 24;

  return (
    <div
      className={cn(
        bannerVariants({ variant: validVariant, compact }),
        className
      )}
      role="alert"
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={cn('flex-shrink-0', styles.icon)} aria-hidden="true">
          {icon !== undefined ? (
            // Custom icon (string emoji or ReactNode)
            typeof icon === 'string' ? (
              <span className={compact ? 'text-xl' : 'text-2xl'}>{icon}</span>
            ) : (
              icon
            )
          ) : (
            // Default lucide icon
            <IconComponent size={iconSize} strokeWidth={2} />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Title */}
          {title && (
            <Heading
              level={2}
              size={compact ? 'sm' : 'md'}
              className={cn(
                styles.title,
                (description || children || actions) && 'mb-1'
              )}
            >
              {title}
            </Heading>
          )}

          {/* Description */}
          {description && (
            <Text
              size={compact ? 'xs' : 'sm'}
              className={cn(
                styles.description,
                (actions || children) && 'mb-3'
              )}
            >
              {description}
            </Text>
          )}

          {/* Custom children content */}
          {children}

          {/* Actions */}
          {actions && (
            <div className="flex flex-wrap gap-2 mt-2">
              {actions}
            </div>
          )}
        </div>

        {/* Dismiss button */}
        {dismissible && (
          <button
            onClick={handleDismiss}
            className={cn(
              'flex-shrink-0 p-1.5',
              'rounded-lg',
              'text-slate-400 hover:text-slate-200',
              'hover:bg-white/[0.06]',
              'transition-all duration-200',
              '[html:not(.dark)_&]:text-slate-500',
              '[html:not(.dark)_&]:hover:text-slate-700',
              '[html:not(.dark)_&]:hover:bg-black/[0.04]'
            )}
            aria-label="Dismiss"
          >
            <X size={16} aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  );
}

export { Banner };
