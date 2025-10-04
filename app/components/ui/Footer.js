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
          w-full py-6 mt-auto
          bg-white/80 backdrop-blur-sm
          border-t border-neutral-200/50
          ${className}
        `}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-sm text-neutral-600">
            <div className="flex items-center gap-2">
              <span>Made with</span>
              <span className="text-red-500 text-base">❤️</span>
              <span>by <strong className="text-neutral-900">{APP_AUTHOR}</strong></span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-neutral-400">•</span>
              <Link
                href="/changelog"
                className="group flex items-center gap-1.5 hover:text-primary-600 transition-colors duration-200 relative"
              >
                <span>Versione</span>
                <strong className="text-neutral-900 group-hover:text-primary-600">{APP_VERSION}</strong>
                <span className="text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-200">📋</span>

                {/* Badge Novità */}
                {hasNewVersion && (
                  <span
                    onClick={(e) => {
                      e.preventDefault();
                      handleBadgeClick();
                    }}
                    className="absolute -top-2 -right-2 px-2 py-0.5 text-xs font-bold text-white bg-primary-500 rounded-full animate-pulse cursor-pointer hover:scale-110 transition-transform duration-200"
                    title="Nuova versione disponibile!"
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
