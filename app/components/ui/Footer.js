'use client';

import Link from 'next/link';
import { APP_VERSION, APP_AUTHOR } from '@/lib/version';
import { useVersionCheck } from '@/app/hooks/useVersionCheck';
import WhatsNewModal from '../WhatsNewModal';

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
          bg-white/90 dark:bg-neutral-900/90 backdrop-blur-xl shadow-glass-lg
          border-t border-neutral-200/50 dark:border-neutral-700/50
          relative z-10
          ${className}
        `}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-2">
            {/* Author info */}
            <div className="flex items-center gap-2 text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 order-2 sm:order-1">
              <span className="hidden sm:inline">Made with</span>
              <span className="sm:hidden">❤️ by</span>
              <span className="hidden sm:inline text-red-500 text-base animate-pulse">❤️</span>
              <span className="hidden sm:inline">by</span>
              <strong className="text-neutral-900 dark:text-neutral-100">{APP_AUTHOR}</strong>
            </div>

            {/* Version info */}
            <div className="flex items-center gap-2 order-1 sm:order-2">
              <span className="hidden sm:inline text-neutral-400 dark:text-neutral-500 text-sm">•</span>
              <Link
                href="/changelog"
                className="
                  group flex items-center gap-1.5 px-3 py-2 sm:px-0 sm:py-0
                  rounded-xl sm:rounded-none
                  bg-neutral-50/50 dark:bg-neutral-800/50 sm:bg-transparent sm:dark:bg-transparent
                  hover:bg-neutral-100 dark:hover:bg-neutral-700 sm:hover:bg-transparent sm:dark:hover:bg-transparent
                  hover:text-primary-600 dark:hover:text-primary-400
                  transition-all duration-200
                  active:scale-95 sm:active:scale-100
                  touch-manipulation
                  relative
                "
              >
                <span className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 group-hover:text-primary-600 dark:group-hover:text-primary-400">Versione</span>
                <strong className="text-sm sm:text-base text-neutral-900 dark:text-neutral-100 group-hover:text-primary-600 dark:group-hover:text-primary-400">
                  {APP_VERSION}
                </strong>
                <span className="text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  📋
                </span>

                {/* Badge Novità - più grande e visibile su mobile */}
                {hasNewVersion && (
                  <span
                    onClick={(e) => {
                      e.preventDefault();
                      handleBadgeClick();
                    }}
                    className="
                      absolute -top-1 -right-1 sm:-top-2 sm:-right-2
                      px-2 py-0.5 sm:px-2.5 sm:py-1
                      text-[10px] sm:text-xs font-bold
                      text-white bg-gradient-to-r from-primary-500 to-accent-500
                      rounded-full shadow-lg
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
