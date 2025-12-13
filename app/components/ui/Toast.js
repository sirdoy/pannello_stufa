'use client';

import { useEffect } from 'react';

/**
 * Toast - Notification component with liquid glass style
 * Auto-dismisses after specified duration
 */
export default function Toast({
  message,
  icon = '✓',
  variant = 'success',
  duration = 3000,
  onDismiss,
  liquid = true
}) {
  useEffect(() => {
    if (duration && onDismiss) {
      const timer = setTimeout(() => {
        onDismiss();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onDismiss]);

  // Liquid glass variants (iOS glassmorphism style)
  const liquidVariants = {
    success: {
      bg: 'bg-success-500/15 dark:bg-success-500/25',
      border: 'border-success-500/30 dark:border-success-500/40',
      text: 'text-success-900 dark:text-success-100',
      iconBg: 'bg-success-400/20 dark:bg-success-400/30',
      ring: 'ring-success-400/30'
    },
    warning: {
      bg: 'bg-warning-500/15 dark:bg-warning-500/25',
      border: 'border-warning-500/30 dark:border-warning-500/40',
      text: 'text-warning-900 dark:text-warning-100',
      iconBg: 'bg-warning-400/20 dark:bg-warning-400/30',
      ring: 'ring-warning-400/30'
    },
    info: {
      bg: 'bg-info-500/15 dark:bg-info-500/25',
      border: 'border-info-500/30 dark:border-info-500/40',
      text: 'text-info-900 dark:text-info-100',
      iconBg: 'bg-info-400/20 dark:bg-info-400/30',
      ring: 'ring-info-400/30'
    },
    error: {
      bg: 'bg-primary-500/15 dark:bg-primary-500/25',
      border: 'border-primary-500/30 dark:border-primary-500/40',
      text: 'text-primary-900 dark:text-primary-100',
      iconBg: 'bg-primary-400/20 dark:bg-primary-400/30',
      ring: 'ring-primary-400/30'
    }
  };

  // Solid variants (traditional gradient style)
  const solidVariants = {
    success: {
      bg: 'bg-gradient-to-br from-success-500/95 to-success-600/95',
      ring: 'ring-success-400/50',
      text: 'text-white',
      iconBg: 'bg-success-400/30'
    },
    warning: {
      bg: 'bg-gradient-to-br from-warning-500/95 to-warning-600/95',
      ring: 'ring-warning-400/50',
      text: 'text-white',
      iconBg: 'bg-warning-400/30'
    },
    info: {
      bg: 'bg-gradient-to-br from-info-500/95 to-info-600/95',
      ring: 'ring-info-400/50',
      text: 'text-white',
      iconBg: 'bg-info-400/30'
    },
    error: {
      bg: 'bg-gradient-to-br from-primary-500/95 to-primary-600/95',
      ring: 'ring-primary-400/50',
      text: 'text-white',
      iconBg: 'bg-primary-400/30'
    }
  };

  const variants = liquid ? liquidVariants : solidVariants;
  const styles = variants[variant] || variants.success;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] animate-slideDown">
      <div className={`
        ${styles.bg} ${styles.text}
        ${liquid
          ? `backdrop-blur-3xl rounded-2xl shadow-liquid-lg border-2 ${styles.border} ring-1 ${styles.ring} ring-inset before:absolute before:inset-0 before:bg-gradient-to-br before:from-white/15 dark:before:from-white/10 before:to-transparent before:pointer-events-none`
          : `backdrop-blur-3xl rounded-2xl shadow-elevated-lg ring-2 ${styles.ring} ring-inset before:absolute before:inset-0 before:bg-gradient-to-br before:from-white/20 before:to-transparent before:pointer-events-none`
        }
        px-5 py-3.5 sm:px-6 sm:py-4
        flex items-center gap-3 sm:gap-4
        min-w-[280px] sm:min-w-[320px] max-w-[90vw] sm:max-w-md
        relative overflow-hidden
      `}>
        {/* Icon */}
        <div className={`
          ${styles.iconBg}
          rounded-xl p-2.5 sm:p-3
          flex-shrink-0
          shadow-inner-soft
          ring-1 ring-white/20 ring-inset
        `}>
          <span className="text-2xl sm:text-3xl">{icon}</span>
        </div>

        {/* Message */}
        <p className="text-sm sm:text-base font-semibold leading-snug flex-1 relative z-10">
          {message}
        </p>

        {/* Dismiss button */}
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="
              flex-shrink-0 p-1.5 rounded-lg
              hover:bg-white/20 active:bg-white/30
              transition-colors duration-200
              relative z-10
            "
            aria-label="Dismiss"
          >
            <span className="text-lg">✕</span>
          </button>
        )}
      </div>
    </div>
  );
}
