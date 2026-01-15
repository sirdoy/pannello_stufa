'use client';

import Link from 'next/link';
import { APP_VERSION, APP_AUTHOR } from '@/lib/version';
import { useVersionCheck } from '@/app/hooks/useVersionCheck';
import WhatsNewModal from '../WhatsNewModal';
import Text from './Text';

export default function Footer({ className = '' }) {
  const { hasNewVersion, showWhatsNew, dismissWhatsNew, dismissBadge } = useVersionCheck();

  const handleBadgeClick = () => {
    dismissBadge();
  };

  return (
    <>
      <footer
        className={`
          w-full pt-4 sm:pt-6 pb-32 lg:pb-6 mt-auto
          bg-slate-900/90 backdrop-blur-xl
          border-t border-slate-700/50
          relative z-10
          [html:not(.dark)_&]:bg-white/90
          [html:not(.dark)_&]:border-slate-200/50
          ${className}
        `}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-2">
            {/* Author info */}
            <div className="flex items-center gap-2 order-2 sm:order-1">
              <Text variant="tertiary" size="sm" as="span" className="hidden sm:inline">Made with</Text>
              <Text variant="tertiary" size="sm" as="span" className="sm:hidden">❤️ by</Text>
              <span className="hidden sm:inline text-danger-400 text-base animate-pulse">❤️</span>
              <Text variant="tertiary" size="sm" as="span" className="hidden sm:inline">by</Text>
              <Text variant="body" size="sm" weight="bold" as="strong">{APP_AUTHOR}</Text>
            </div>

            {/* Version info */}
            <div className="flex items-center gap-2 order-1 sm:order-2">
              <Text variant="tertiary" size="sm" as="span" className="hidden sm:inline">•</Text>
              <Link
                href="/changelog"
                className="
                  group flex items-center gap-1.5 px-3 py-2 sm:px-0 sm:py-0
                  rounded-xl sm:rounded-none
                  bg-slate-800/50 sm:bg-transparent
                  hover:bg-slate-700/50 sm:hover:bg-transparent
                  [html:not(.dark)_&]:bg-slate-100/50 [html:not(.dark)_&]:sm:bg-transparent
                  [html:not(.dark)_&]:hover:bg-slate-200/50 [html:not(.dark)_&]:sm:hover:bg-transparent
                  transition-all duration-200
                  active:scale-95 sm:active:scale-100
                  touch-manipulation
                  relative
                "
              >
                <Text variant="tertiary" size="sm" as="span" className="group-hover:text-ember-400 [html:not(.dark)_&]:group-hover:text-ember-600 transition-colors">Versione</Text>
                <Text variant="body" size="base" weight="bold" as="strong" className="group-hover:text-ember-400 [html:not(.dark)_&]:group-hover:text-ember-600 transition-colors">
                  {APP_VERSION}
                </Text>
                <span className="text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  📋
                </span>

                {/* Badge Novità - Ember Noir gradient */}
                {hasNewVersion && (
                  <span
                    onClick={(e) => {
                      e.preventDefault();
                      handleBadgeClick();
                    }}
                    className="
                      absolute -top-1 -right-1 sm:-top-2 sm:-right-2
                      px-2 py-0.5 sm:px-2.5 sm:py-1
                      text-[10px] sm:text-xs font-bold font-display
                      text-white bg-gradient-to-r from-ember-500 to-flame-600
                      rounded-full shadow-ember-glow-sm
                      animate-pulse cursor-pointer
                      hover:scale-110 active:scale-95
                      transition-transform duration-200
                      touch-manipulation
                    "
                    title="Nuova versione disponibile! Tocca per nascondere"
                    role="button"
                    aria-label="Nuova versione disponibile"
                  >
                    NEW
                  </span>
                )}
              </Link>
            </div>
          </div>
        </div>
      </footer>

      {/* Modal What's New */}
      <WhatsNewModal
        isOpen={showWhatsNew}
        onClose={() => dismissWhatsNew(false)}
        dontShowAgain={() => dismissWhatsNew(true)}
      />
    </>
  );
}
