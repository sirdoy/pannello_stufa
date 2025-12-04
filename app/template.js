'use client';

import { useEffect, useState } from 'react';

/**
 * Template - Gestisce transizioni smooth tra le pagine con effetto liquid glass
 *
 * Il file template.js in Next.js App Router crea una nuova istanza per ogni navigazione,
 * permettendo animazioni di transizione pulite senza wrapping complesso.
 *
 * Features:
 * - Fade + slide up + scale in combinato
 * - Overlay liquid glass durante transizione
 * - Supporto dark mode completo
 * - Animazioni CSS performanti con easing fluido
 * - Effetto "lift" professionale
 * - View Transitions API (Chrome/Edge) con fallback automatico
 */
export default function Template({ children }) {
  const [mounted, setMounted] = useState(false);
  const [showOverlay, setShowOverlay] = useState(true);

  useEffect(() => {
    // Reset scroll position on page navigation
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });

    // View Transitions API support (Chrome 111+, Edge 111+)
    // Adds native browser smooth transitions when available
    const supportsViewTransitions = typeof document !== 'undefined' &&
                                     'startViewTransition' in document;

    if (supportsViewTransitions) {
      // Let browser handle smooth cross-fade natively
      document.startViewTransition(() => {
        setMounted(true);
      });

      // Still remove overlay after animation
      const overlayTimer = setTimeout(() => {
        setShowOverlay(false);
      }, 400);

      return () => clearTimeout(overlayTimer);
    } else {
      // Fallback: custom CSS animations
      const mountTimer = setTimeout(() => {
        setMounted(true);
      }, 50);

      const overlayTimer = setTimeout(() => {
        setShowOverlay(false);
      }, 400);

      return () => {
        clearTimeout(mountTimer);
        clearTimeout(overlayTimer);
      };
    }
  }, []);

  return (
    <>
      {/* Overlay liquid glass durante transizione */}
      {showOverlay && (
        <div
          className={`fixed inset-0 z-30 pointer-events-none transition-opacity duration-300 ${
            mounted ? 'opacity-0' : 'opacity-100'
          }`}
          aria-hidden="true"
        >
          <div className="absolute inset-0 bg-neutral-50/40 dark:bg-neutral-900/40 backdrop-blur-[2px]" />
        </div>
      )}

      {/* Contenuto pagina con animazione combinata */}
      <div
        className={`transition-all duration-500 transition-page-smooth ${
          mounted
            ? 'opacity-100 translate-y-0 scale-100'
            : 'opacity-0 translate-y-2 scale-[0.98]'
        }`}
      >
        {children}
      </div>
    </>
  );
}
