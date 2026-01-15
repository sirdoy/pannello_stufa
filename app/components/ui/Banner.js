'use client';

import { useState, useEffect } from 'react';
import Heading from './Heading';
import Text from './Text';

/**
 * Banner Component - Ember Noir Design System
 *
 * Sophisticated alert/notification banner with warm aesthetic.
 * Supports persistent dismissal via localStorage.
 *
 * @param {Object} props - Component props
 * @param {'info'|'warning'|'error'|'success'|'ember'} props.variant - Banner style
 * @param {string} props.icon - Emoji or icon to display
 * @param {string} props.title - Banner title
 * @param {string|React.ReactNode} props.description - Banner content
 * @param {React.ReactNode} props.actions - Action buttons
 * @param {boolean} props.dismissible - Show dismiss button
 * @param {function} props.onDismiss - Dismiss handler
 * @param {string} props.dismissKey - Unique key for persistent dismissal
 * @param {boolean} props.compact - Use compact layout
 * @param {string} props.className - Additional CSS classes
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
  // Legacy props
  liquid = true,
}) {
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

  // Variant styles - Ember Noir aesthetic
  const variantStyles = {
    info: {
      container: `
        bg-ocean-500/[0.12] dark:bg-ocean-500/[0.15]
        border border-ocean-400/20 dark:border-ocean-500/25
        [html:not(.dark)_&]:bg-ocean-500/[0.08]
        [html:not(.dark)_&]:border-ocean-400/25
      `,
      title: 'text-ocean-200 dark:text-ocean-200 [html:not(.dark)_&]:text-ocean-800',
      description: 'text-ocean-300 dark:text-ocean-300 [html:not(.dark)_&]:text-ocean-700',
      defaultIcon: 'ℹ️',
    },
    warning: {
      container: `
        bg-warning-500/[0.12] dark:bg-warning-500/[0.15]
        border border-warning-400/20 dark:border-warning-500/25
        [html:not(.dark)_&]:bg-warning-500/[0.08]
        [html:not(.dark)_&]:border-warning-400/25
      `,
      title: 'text-warning-200 dark:text-warning-200 [html:not(.dark)_&]:text-warning-800',
      description: 'text-warning-300 dark:text-warning-300 [html:not(.dark)_&]:text-warning-700',
      defaultIcon: '⚠️',
    },
    error: {
      container: `
        bg-danger-500/[0.12] dark:bg-danger-500/[0.15]
        border border-danger-400/20 dark:border-danger-500/25
        [html:not(.dark)_&]:bg-danger-500/[0.08]
        [html:not(.dark)_&]:border-danger-400/25
      `,
      title: 'text-danger-200 dark:text-danger-200 [html:not(.dark)_&]:text-danger-800',
      description: 'text-danger-300 dark:text-danger-300 [html:not(.dark)_&]:text-danger-700',
      defaultIcon: '❌',
    },
    success: {
      container: `
        bg-sage-500/[0.12] dark:bg-sage-500/[0.15]
        border border-sage-400/20 dark:border-sage-500/25
        [html:not(.dark)_&]:bg-sage-500/[0.08]
        [html:not(.dark)_&]:border-sage-400/25
      `,
      title: 'text-sage-200 dark:text-sage-200 [html:not(.dark)_&]:text-sage-800',
      description: 'text-sage-300 dark:text-sage-300 [html:not(.dark)_&]:text-sage-700',
      defaultIcon: '✅',
    },
    ember: {
      container: `
        bg-ember-500/[0.12] dark:bg-ember-500/[0.15]
        border border-ember-400/20 dark:border-ember-500/25
        shadow-ember-glow-sm
        [html:not(.dark)_&]:bg-ember-500/[0.08]
        [html:not(.dark)_&]:border-ember-400/25
        [html:not(.dark)_&]:shadow-none
      `,
      title: 'text-ember-200 dark:text-ember-200 [html:not(.dark)_&]:text-ember-800',
      description: 'text-ember-300 dark:text-ember-300 [html:not(.dark)_&]:text-ember-700',
      defaultIcon: '🔥',
    },
  };

  const styles = variantStyles[variant] || variantStyles.info;
  const displayIcon = icon || styles.defaultIcon;

  return (
    <div
      className={`
        rounded-xl
        backdrop-blur-lg
        transition-all duration-300
        animate-fade-in-up
        ${styles.container}
        ${compact ? 'p-3' : 'p-4 sm:p-5'}
        ${className}
      `.trim().replace(/\s+/g, ' ')}
      role="alert"
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        {displayIcon && (
          <div className="flex-shrink-0">
            <span className={compact ? 'text-xl' : 'text-2xl'}>{displayIcon}</span>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Title */}
          {title && (
            <Heading
              level={3}
              size={compact ? 'sm' : 'base'}
              className={`${styles.title} ${description || children || actions ? 'mb-1' : ''}`}
            >
              {title}
            </Heading>
          )}

          {/* Description */}
          {description && (
            <Text
              size={compact ? 'xs' : 'sm'}
              className={`${styles.description} ${actions || children ? 'mb-3' : ''}`}
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
            className="
              flex-shrink-0 p-1.5
              rounded-lg
              text-slate-400 hover:text-slate-200
              hover:bg-white/[0.06]
              transition-all duration-200
              [html:not(.dark)_&]:text-slate-500
              [html:not(.dark)_&]:hover:text-slate-700
              [html:not(.dark)_&]:hover:bg-black/[0.04]
            "
            aria-label="Dismiss"
          >
            <svg
              className="w-4 h-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
