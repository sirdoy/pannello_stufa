'use client';

import { createContext, useContext, useState, useCallback, useRef, useEffect, ReactNode } from 'react';
import { usePathname } from 'next/navigation';

/**
 * PageTransitionContext - Gestione transizioni di pagina cinematografiche
 *
 * Features:
 * - View Transitions API nativa (Chrome, Safari)
 * - Fallback CSS animations
 * - Direction awareness (forward/backward)
 * - Multiple transition types
 * - Ember Noir integration
 */

type TransitionType = 'slide-morph' | 'fade-scale' | 'ember-burst' | 'liquid-flow' | 'stack-lift' | 'diagonal-sweep';
type Direction = 'forward' | 'backward';

interface PageTransitionContextValue {
  startTransition: (callback?: () => void | Promise<void>) => Promise<void>;
  isTransitioning: boolean;
  transitionType: TransitionType;
  setTransitionType: (type: TransitionType) => void;
  direction: Direction;
}

const PageTransitionContext = createContext<PageTransitionContextValue | null>(null);

export const usePageTransition = (): PageTransitionContextValue => {
  const context = useContext(PageTransitionContext);
  if (!context) {
    throw new Error('usePageTransition must be used within PageTransitionProvider');
  }
  return context;
};

// Transition types disponibili
export const TRANSITION_TYPES = {
  SLIDE_MORPH: 'slide-morph' as const,      // Default: slide + scale + blur
  FADE_SCALE: 'fade-scale' as const,         // Fade + gentle scale
  EMBER_BURST: 'ember-burst' as const,       // Esplosione ember glow
  LIQUID_FLOW: 'liquid-flow' as const,       // Liquid glass flow
  STACK_LIFT: 'stack-lift' as const,         // Card lift & stack
  DIAGONAL_SWEEP: 'diagonal-sweep' as const, // Diagonal wipe
};

export function PageTransitionProvider({ children }: { children: ReactNode }) {
  const [isTransitioning, setIsTransitioning] = useState<boolean>(false);
  const [transitionType, setTransitionType] = useState<TransitionType>(TRANSITION_TYPES.SLIDE_MORPH);
  const [direction, setDirection] = useState<Direction>('forward');
  const pathname = usePathname();
  const previousPathRef = useRef<string>(pathname);
  const historyStackRef = useRef<string[]>([pathname]);

  // Detect navigation direction
  useEffect(() => {
    const currentPath = pathname;
    const previousPath = previousPathRef.current;

    if (currentPath !== previousPath) {
      // Check if going back in history
      const currentIndex = historyStackRef.current.indexOf(currentPath);
      const previousIndex = historyStackRef.current.indexOf(previousPath);

      if (currentIndex !== -1 && currentIndex < previousIndex) {
        setDirection('backward');
      } else {
        setDirection('forward');
        // Add to history if new page
        if (currentIndex === -1) {
          historyStackRef.current.push(currentPath);
        }
      }

      previousPathRef.current = currentPath;
    }
  }, [pathname]);

  /**
   * Start page transition
   * Usa View Transitions API se disponibile, altrimenti fallback CSS
   */
  const startTransition = useCallback(async (callback?: () => void | Promise<void>): Promise<void> => {
    // Set transitioning state
    setIsTransitioning(true);

    // Add data attributes for CSS targeting
    document.documentElement.setAttribute('data-transitioning', 'true');
    document.documentElement.setAttribute('data-transition-type', transitionType);
    document.documentElement.setAttribute('data-transition-direction', direction);

    try {
      // Check View Transitions API support
      if (document.startViewTransition) {
        // Use native View Transitions API
        const transition = document.startViewTransition(async () => {
          if (callback) await callback();
        });

        await transition.finished;
      } else {
        // Fallback: CSS animations
        // Add exit class
        document.documentElement.setAttribute('data-transition-phase', 'exit');

        // Wait for exit animation
        await new Promise<void>(resolve => setTimeout(resolve, 400));

        // Execute callback
        if (callback) await callback();

        // Add enter class
        document.documentElement.setAttribute('data-transition-phase', 'enter');

        // Wait for enter animation
        await new Promise<void>(resolve => setTimeout(resolve, 400));
      }
    } catch (error) {
      console.error('Page transition error:', error);
    } finally {
      // Clean up
      setIsTransitioning(false);
      document.documentElement.removeAttribute('data-transitioning');
      document.documentElement.removeAttribute('data-transition-type');
      document.documentElement.removeAttribute('data-transition-direction');
      document.documentElement.removeAttribute('data-transition-phase');
    }
  }, [transitionType, direction]);

  const value = {
    startTransition,
    isTransitioning,
    transitionType,
    setTransitionType,
    direction,
  };

  return (
    <PageTransitionContext.Provider value={value}>
      {children}
    </PageTransitionContext.Provider>
  );
}
