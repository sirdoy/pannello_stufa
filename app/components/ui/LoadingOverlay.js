'use client';

import { useEffect } from 'react';
import { createPortal } from 'react-dom';

/**
 * LoadingOverlay Component - Ember Noir Design System
 *
 * Full-page blocking loading overlay with dark-first styling.
 * Blocks page scroll when visible.
 * Uses React Portal to render at body level.
 *
 * @param {Object} props
 * @param {boolean} props.show - Show overlay
 * @param {string} props.message - Loading message
 * @param {string} props.icon - Emoji icon
 */
export default function LoadingOverlay({
  show = false,
  message = 'Caricamento...',
  icon = '⏳',
  liquid = true, // Legacy prop - ignored
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

  const overlay = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center animate-fadeIn"
      aria-live="assertive"
      aria-busy="true"
    >
      {/* Backdrop - Ember Noir dark/light blur */}
      <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-xl will-change-[backdrop-filter] transform-gpu [html:not(.dark)_&]:bg-slate-100/80" />

      {/* Loading card */}
      <div className="relative z-10 animate-spring-in will-change-transform transform-gpu">
        <div className="
          bg-slate-800/90 backdrop-blur-2xl
          border border-slate-700/60
          shadow-[0_8px_32px_rgba(0,0,0,0.4)]
          rounded-3xl
          px-8 py-10 sm:px-10 sm:py-12
          flex flex-col items-center gap-5 sm:gap-6
          min-w-[280px] sm:min-w-[320px]
          relative overflow-hidden
          [html:not(.dark)_&]:bg-white/95
          [html:not(.dark)_&]:border-slate-200
          [html:not(.dark)_&]:shadow-[0_8px_32px_rgba(0,0,0,0.15)]
        ">
          {/* Animated spinner icon */}
          <div className="relative">
            {/* Pulse ring effect */}
            <div className="absolute inset-0 -m-4 rounded-full bg-ember-500/20 animate-ping" />

            {/* Icon container */}
            <div className="
              relative
              bg-gradient-to-br from-ember-500 to-flame-600
              rounded-2xl p-5 sm:p-6
              shadow-ember-glow
              border border-white/10
              animate-pulse
            ">
              <span className="text-5xl sm:text-6xl inline-block animate-bounce">
                {icon}
              </span>
            </div>
          </div>

          {/* Message */}
          <div className="text-center space-y-2 relative z-10">
            <p className="text-lg sm:text-xl font-bold font-display text-slate-100 [html:not(.dark)_&]:text-slate-900">
              {message}
            </p>
            <p className="text-sm text-slate-400 font-display [html:not(.dark)_&]:text-slate-500">
              Attendere prego...
            </p>
          </div>

          {/* Loading dots */}
          <div className="flex gap-2">
            <span className="w-2.5 h-2.5 bg-ember-500 rounded-full animate-bounce [animation-delay:0ms]" />
            <span className="w-2.5 h-2.5 bg-ember-500 rounded-full animate-bounce [animation-delay:150ms]" />
            <span className="w-2.5 h-2.5 bg-ember-500 rounded-full animate-bounce [animation-delay:300ms]" />
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(overlay, document.body);
}
