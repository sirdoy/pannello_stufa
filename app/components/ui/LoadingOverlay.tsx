'use client';

import type React from 'react';
import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import Text from './Text';

/**
 * LoadingOverlay Component Props
 */
export interface LoadingOverlayProps {
  show?: boolean;
  message?: string;
  /** Emoji or React element icon */
  icon?: string | React.ReactNode;
}

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
 * @param {string | React.ReactNode} props.icon - Emoji or React element icon
 */
export default function LoadingOverlay({
  show = false,
  message = 'Caricamento...',
  icon = '⏳',
}: LoadingOverlayProps) {
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
      className="animate-fadeIn fixed inset-0 z-[9999] flex items-center justify-center"
      aria-live="assertive"
      aria-busy="true"
    >
      {/* Backdrop - Ember Noir dark/light blur */}
      <div className="absolute inset-0 transform-gpu bg-slate-950/70 backdrop-blur-xl will-change-[backdrop-filter] " />

      {/* Loading card */}
      <div className="animate-spring-in relative z-10 transform-gpu will-change-transform">
        <div className="
          ,0,0,0.15)] relative
          flex min-w-[280px]
          flex-col
          items-center
          gap-5 overflow-hidden rounded-3xl border
          border-slate-700/60 bg-slate-800/90 px-8 py-10 shadow-[0_8px_32px_rgba(0,0,0,0.4)]
          backdrop-blur-2xl sm:min-w-[320px]
          sm:gap-6 sm:px-10
          
          
          sm:py-12
        ">
          {/* Animated spinner icon */}
          <div className="relative">
            {/* Pulse ring effect */}
            <div className="bg-ember-500/20 absolute inset-0 -m-4 animate-ping rounded-full" />

            {/* Icon container */}
            <div className="
              from-ember-500
              to-flame-600 shadow-ember-glow relative
              animate-pulse rounded-2xl border
              border-white/10
              bg-gradient-to-br p-5
              sm:p-6
            ">
              <span className="inline-block animate-bounce text-5xl sm:text-6xl">
                {icon}
              </span>
            </div>
          </div>

          {/* Message */}
          <div className="relative z-10 space-y-2 text-center">
            <Text variant="body" size="lg" className="sm:text-xl">
              {message}
            </Text>
            <Text variant="tertiary" size="sm">
              Attendere prego...
            </Text>
          </div>

          {/* Loading dots */}
          <div className="flex gap-2">
            <span className="bg-ember-500 h-2.5 w-2.5 animate-bounce rounded-full [animation-delay:0ms]" />
            <span className="bg-ember-500 h-2.5 w-2.5 animate-bounce rounded-full [animation-delay:150ms]" />
            <span className="bg-ember-500 h-2.5 w-2.5 animate-bounce rounded-full [animation-delay:300ms]" />
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(overlay, document.body);
}
