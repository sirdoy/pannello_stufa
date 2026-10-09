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
      className="animate-fadeIn fixed inset-0 z-9999 flex items-center justify-center"
      aria-live="assertive"
      aria-busy="true"
    >
      {/* Backdrop - Ember Noir dark/light blur */}
      <div className="absolute inset-0 transform-gpu bg-black/60 backdrop-blur-sm will-change-[backdrop-filter]" />

      {/* Loading card */}
      <div className="animate-spring-in relative z-10 transform-gpu will-change-transform">
        <div className="
          relative
          flex min-w-70
          flex-col
          items-center
          gap-5 overflow-hidden rounded-3xl border-[0.5px]
          border-white/8 bg-(--surface-solid) px-8 py-10 shadow-[0_8px_32px_rgba(0,0,0,0.4)]
          backdrop-blur-xl sm:min-w-80
          sm:gap-6 sm:px-10
          sm:py-12
        ">
          {/* Animated spinner icon */}
          <div className="relative">
            {/* Pulse ring effect */}
            <div className="absolute inset-0 -m-4 animate-ping rounded-full bg-ember-500/20" />

            {/* Icon container */}
            <div className="
              relative
              animate-pulse rounded-2xl border-[0.5px]
              border-ember-400/30 bg-ember-500/20
              p-5 text-ember-300
              sm:p-6
            ">
              <span className={typeof icon === 'string' ? 'inline-block animate-bounce text-5xl sm:text-6xl' : 'flex animate-bounce items-center justify-center'}>
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
            <span className="size-2.5 animate-bounce rounded-full bg-ember-500 [animation-delay:0ms]" />
            <span className="size-2.5 animate-bounce rounded-full bg-ember-500 [animation-delay:150ms]" />
            <span className="size-2.5 animate-bounce rounded-full bg-ember-500 [animation-delay:300ms]" />
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(overlay, document.body);
}
