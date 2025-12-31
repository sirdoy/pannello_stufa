'use client';

import { useEffect } from 'react';
import { createPortal } from 'react-dom';

/**
 * LoadingOverlay - Full-page blocking loading overlay
 * Liquid glass style with animated spinner
 * Blocks page scroll when visible
 * Uses React Portal to render at body level (fixes positioning issues)
 */
export default function LoadingOverlay({
  show = false,
  message = 'Caricamento...',
  icon = '⏳',
  liquid = true
}) {
  // Block body scroll when overlay is shown
  useEffect(() => {
    if (show) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [show]);

  if (!show) return null;

  // Render using Portal to ensure fixed positioning works correctly
  // (bypasses any parent transforms/filters that would break position: fixed)
  const overlay = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center animate-fadeIn"
      aria-live="assertive"
      aria-busy="true"
    >
      {/* Backdrop blur */}
      <div className="absolute inset-0 bg-neutral-900/40 dark:bg-neutral-950/60 backdrop-blur-xl will-change-[backdrop-filter] transform-gpu" />

      {/* Loading card - Opaque background for readability */}
      <div className="relative z-10 animate-spring-in will-change-transform transform-gpu">
        <div className={`
          ${liquid
            ? 'bg-white dark:bg-neutral-800 shadow-liquid-xl ring-1 ring-white/30 dark:ring-white/20 ring-inset before:absolute before:inset-0 before:bg-gradient-to-br before:from-white/10 dark:before:from-white/5 before:to-transparent before:pointer-events-none'
            : 'bg-white dark:bg-neutral-800 shadow-elevated-xl ring-1 ring-white/50 dark:ring-white/10 ring-inset before:absolute before:inset-0 before:bg-gradient-to-br before:from-white/40 dark:before:from-white/10 before:to-transparent before:pointer-events-none'
          }
          rounded-3xl
          px-8 py-10 sm:px-10 sm:py-12
          flex flex-col items-center gap-5 sm:gap-6
          min-w-[280px] sm:min-w-[320px]
          relative overflow-hidden
        `}>
          {/* Animated spinner icon */}
          <div className="relative">
            {/* Pulse ring effect */}
            <div className="absolute inset-0 -m-4 rounded-full bg-primary-500/20 dark:bg-primary-400/20 animate-ping" />

            {/* Icon container */}
            <div className="
              relative
              bg-gradient-to-br from-primary-500 to-accent-600
              dark:from-primary-600 dark:to-accent-700
              rounded-2xl p-5 sm:p-6
              shadow-elevated ring-2 ring-white/30 dark:ring-white/20 ring-inset
              animate-pulse
            ">
              <span className="text-5xl sm:text-6xl inline-block animate-bounce">
                {icon}
              </span>
            </div>
          </div>

          {/* Message */}
          <div className="text-center space-y-2 relative z-10">
            <p className="text-lg sm:text-xl font-bold text-neutral-900 dark:text-white">
              {message}
            </p>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              Attendere prego...
            </p>
          </div>

          {/* Loading dots */}
          <div className="flex gap-2">
            <span className="w-2.5 h-2.5 bg-primary-500 dark:bg-primary-400 rounded-full animate-bounce [animation-delay:0ms]" />
            <span className="w-2.5 h-2.5 bg-primary-500 dark:bg-primary-400 rounded-full animate-bounce [animation-delay:150ms]" />
            <span className="w-2.5 h-2.5 bg-primary-500 dark:bg-primary-400 rounded-full animate-bounce [animation-delay:300ms]" />
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(overlay, document.body);
}
