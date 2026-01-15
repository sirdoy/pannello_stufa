'use client';

import { useEffect, useState } from 'react';

/**
 * Toast Component - Ember Noir Design System
 *
 * Notification toast with auto-dismiss and progress indicator.
 *
 * @param {Object} props
 * @param {string} props.message - Toast message
 * @param {string} props.icon - Emoji icon
 * @param {'success'|'warning'|'info'|'error'|'ember'|'ocean'|'sage'|'danger'} props.variant - Color variant
 * @param {number} props.duration - Auto-dismiss duration in ms (0 to disable)
 * @param {Function} props.onDismiss - Dismiss callback
 */
export default function Toast({
  message,
  icon = '✓',
  variant = 'success',
  duration = 3000,
  onDismiss,
  liquid = true, // Legacy prop - ignored
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

  // Ember Noir variant styles - with light mode support
  const variants = {
    success: {
      bg: 'bg-sage-900/80 [html:not(.dark)_&]:bg-sage-50/95',
      border: 'border-sage-500/50 [html:not(.dark)_&]:border-sage-300',
      text: 'text-sage-100 [html:not(.dark)_&]:text-sage-800',
      iconBg: 'bg-sage-800/60 [html:not(.dark)_&]:bg-sage-200/80',
      progress: 'from-sage-500 to-sage-600',
    },
    sage: {
      bg: 'bg-sage-900/80 [html:not(.dark)_&]:bg-sage-50/95',
      border: 'border-sage-500/50 [html:not(.dark)_&]:border-sage-300',
      text: 'text-sage-100 [html:not(.dark)_&]:text-sage-800',
      iconBg: 'bg-sage-800/60 [html:not(.dark)_&]:bg-sage-200/80',
      progress: 'from-sage-500 to-sage-600',
    },
    warning: {
      bg: 'bg-warning-900/80 [html:not(.dark)_&]:bg-warning-50/95',
      border: 'border-warning-500/50 [html:not(.dark)_&]:border-warning-300',
      text: 'text-warning-100 [html:not(.dark)_&]:text-warning-800',
      iconBg: 'bg-warning-800/60 [html:not(.dark)_&]:bg-warning-200/80',
      progress: 'from-warning-500 to-warning-600',
    },
    info: {
      bg: 'bg-ocean-900/80 [html:not(.dark)_&]:bg-ocean-50/95',
      border: 'border-ocean-500/50 [html:not(.dark)_&]:border-ocean-300',
      text: 'text-ocean-100 [html:not(.dark)_&]:text-ocean-800',
      iconBg: 'bg-ocean-800/60 [html:not(.dark)_&]:bg-ocean-200/80',
      progress: 'from-ocean-500 to-ocean-600',
    },
    ocean: {
      bg: 'bg-ocean-900/80 [html:not(.dark)_&]:bg-ocean-50/95',
      border: 'border-ocean-500/50 [html:not(.dark)_&]:border-ocean-300',
      text: 'text-ocean-100 [html:not(.dark)_&]:text-ocean-800',
      iconBg: 'bg-ocean-800/60 [html:not(.dark)_&]:bg-ocean-200/80',
      progress: 'from-ocean-500 to-ocean-600',
    },
    error: {
      bg: 'bg-danger-900/80 [html:not(.dark)_&]:bg-danger-50/95',
      border: 'border-danger-500/50 [html:not(.dark)_&]:border-danger-300',
      text: 'text-danger-100 [html:not(.dark)_&]:text-danger-800',
      iconBg: 'bg-danger-800/60 [html:not(.dark)_&]:bg-danger-200/80',
      progress: 'from-danger-500 to-danger-600',
    },
    danger: {
      bg: 'bg-danger-900/80 [html:not(.dark)_&]:bg-danger-50/95',
      border: 'border-danger-500/50 [html:not(.dark)_&]:border-danger-300',
      text: 'text-danger-100 [html:not(.dark)_&]:text-danger-800',
      iconBg: 'bg-danger-800/60 [html:not(.dark)_&]:bg-danger-200/80',
      progress: 'from-danger-500 to-danger-600',
    },
    ember: {
      bg: 'bg-ember-900/80 [html:not(.dark)_&]:bg-ember-50/95',
      border: 'border-ember-500/50 [html:not(.dark)_&]:border-ember-300',
      text: 'text-ember-100 [html:not(.dark)_&]:text-ember-800',
      iconBg: 'bg-ember-800/60 [html:not(.dark)_&]:bg-ember-200/80',
      progress: 'from-ember-500 to-flame-600',
    },
  };

  const styles = variants[variant] || variants.success;

  return (
    <div className="fixed top-safe-4 left-1/2 -translate-x-1/2 z-[9999] w-[calc(100%-2rem)] max-w-md animate-slideDown">
      <div className={`
        ${styles.bg} ${styles.text}
        backdrop-blur-xl
        rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.4)] [html:not(.dark)_&]:shadow-[0_8px_32px_rgba(0,0,0,0.12)]
        border ${styles.border}
        px-5 py-3.5 sm:px-6 sm:py-4
        flex items-center gap-3 sm:gap-4
        min-w-[280px] sm:min-w-[320px] max-w-[90vw] sm:max-w-md
        relative overflow-hidden
        transition-all duration-300
      `}>
        {/* Icon */}
        <div className={`
          ${styles.iconBg}
          rounded-xl p-2.5 sm:p-3
          flex-shrink-0
          border border-white/10 [html:not(.dark)_&]:border-black/5
        `}>
          <span className="text-2xl sm:text-3xl">{icon}</span>
        </div>

        {/* Message */}
        <p className="text-sm sm:text-base font-semibold font-display leading-snug flex-1 relative z-10">
          {message}
        </p>

        {/* Dismiss button */}
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="
              flex-shrink-0 p-1.5 rounded-lg
              hover:bg-white/10 active:bg-white/20
              [html:not(.dark)_&]:hover:bg-black/5 [html:not(.dark)_&]:active:bg-black/10
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
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10 [html:not(.dark)_&]:bg-black/5 overflow-hidden rounded-b-2xl">
            <div
              className={`h-full bg-gradient-to-r ${styles.progress} transition-all duration-50 ease-linear`}
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
