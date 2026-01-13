'use client';

import { useEffect, useState } from 'react';

/**
 * Toast - Notification component with liquid glass style
 * Auto-dismisses after specified duration with progress indicator
 */
export default function Toast({
  message,
  icon = '✓',
  variant = 'success',
  duration = 3000,
  onDismiss,
  liquid = true
}) {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (duration && onDismiss) {
      const timer = setTimeout(() => {
        onDismiss();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onDismiss]);

  useEffect(() => {
    if (duration === 0) return;

    const interval = setInterval(() => {
      setProgress(prev => {
        const next = prev - (100 / (duration / 50));
        return next <= 0 ? 0 : next;
      });
    }, 50);

    return () => clearInterval(interval);
  }, [duration]);

  // Enhanced iOS 18 Liquid Glass - Floating notification with vibrancy
  const liquidVariants = {
    success: {
      bg: 'bg-success-500/[0.18] dark:bg-success-500/[0.28]',
      border: 'border-success-400/[0.35] dark:border-success-500/[0.4]',
      text: 'text-success-950 dark:text-success-50',
      iconBg: 'bg-success-400/[0.25] dark:bg-success-400/[0.35]',
      ring: 'ring-success-300/[0.3] dark:ring-success-400/[0.35]'
    },
    warning: {
      bg: 'bg-warning-500/[0.18] dark:bg-warning-500/[0.28]',
      border: 'border-warning-400/[0.35] dark:border-warning-500/[0.4]',
      text: 'text-warning-950 dark:text-warning-50',
      iconBg: 'bg-warning-400/[0.25] dark:bg-warning-400/[0.35]',
      ring: 'ring-warning-300/[0.3] dark:ring-warning-400/[0.35]'
    },
    info: {
      bg: 'bg-info-500/[0.18] dark:bg-info-500/[0.28]',
      border: 'border-info-400/[0.35] dark:border-info-500/[0.4]',
      text: 'text-info-950 dark:text-info-50',
      iconBg: 'bg-info-400/[0.25] dark:bg-info-400/[0.35]',
      ring: 'ring-info-300/[0.3] dark:ring-info-400/[0.35]'
    },
    error: {
      bg: 'bg-primary-500/[0.18] dark:bg-primary-500/[0.28]',
      border: 'border-primary-400/[0.35] dark:border-primary-500/[0.4]',
      text: 'text-primary-950 dark:text-primary-50',
      iconBg: 'bg-primary-400/[0.25] dark:bg-primary-400/[0.35]',
      ring: 'ring-primary-300/[0.3] dark:ring-primary-400/[0.35]'
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

  // Progress bar gradients
  const progressGradients = {
    success: 'from-success-500 to-success-600',
    warning: 'from-warning-500 to-warning-600',
    info: 'from-info-500 to-info-600',
    error: 'from-primary-500 to-primary-600',
  };

  return (
    <div className="fixed top-safe-4 left-1/2 -translate-x-1/2 z-[9999] w-[calc(100%-2rem)] max-w-md animate-slideDown">
      <div className={`
        ${styles.bg} ${styles.text}
        ${liquid
          ? `backdrop-blur-4xl backdrop-saturate-[1.8] backdrop-brightness-[1.08]
             rounded-3xl shadow-liquid-lg border-2 ${styles.border}
             ring-1 ${styles.ring} ring-inset
             isolation-isolate
             before:absolute before:inset-0 before:rounded-[inherit]
             before:bg-gradient-to-br before:from-white/[0.2] dark:before:from-white/[0.12]
             before:via-white/[0.08] dark:before:via-white/[0.05]
             before:to-transparent
             before:pointer-events-none before:z-[-1]
             after:absolute after:inset-0 after:rounded-[inherit]
             after:shadow-[inset_0_1px_0_rgba(255,255,255,0.3),inset_0_-1px_0_rgba(0,0,0,0.08)]
             dark:after:shadow-[inset_0_1px_0_rgba(255,255,255,0.15),inset_0_-1px_0_rgba(0,0,0,0.25)]
             after:pointer-events-none after:z-[-1]`
          : `backdrop-blur-3xl rounded-2xl shadow-elevated-lg ring-2 ${styles.ring} ring-inset
             before:absolute before:inset-0 before:bg-gradient-to-br before:from-white/20 before:to-transparent before:pointer-events-none`
        }
        px-5 py-3.5 sm:px-6 sm:py-4
        flex items-center gap-3 sm:gap-4
        min-w-[280px] sm:min-w-[320px] max-w-[90vw] sm:max-w-md
        relative overflow-hidden
        transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]
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

        {/* Progress bar */}
        {duration > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20 dark:bg-white/10 overflow-hidden rounded-b-2xl">
            <div
              className={`h-full bg-gradient-to-r ${progressGradients[variant]} transition-all duration-50 ease-linear`}
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
