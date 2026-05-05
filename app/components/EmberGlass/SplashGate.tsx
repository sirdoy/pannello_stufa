'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';
import { useReducedMotion } from '@/lib/hooks/useReducedMotion';
import { Splash } from './Splash';

const SPLASH_FLAG_KEY = 'ember-glass-splash-shown';

/**
 * SplashGate — Phase 176 (SPLASH-01, SPLASH-04, SPLASH-05)
 *
 * Orchestrator that gates the post-Auth0 splash animation:
 *   1. Reads useUser() from @auth0/nextjs-auth0/client.
 *   2. Reads sessionStorage[SPLASH_FLAG_KEY] to enforce session-once (SPLASH-04).
 *   3. Reads useReducedMotion() to honor prefers-reduced-motion: reduce.
 *   4. Mounts <Splash> as a sibling overlay over {children}, NOT a wrapper —
 *      so {children} mount immediately and dashboard data fetches start during
 *      the splash window (SPLASH-05; D-05 / D-20 / D-21).
 *
 * <Splash> is purely presentational; this orchestrator owns ALL integration
 * concerns. <Splash> never touches sessionStorage / Auth0 / matchMedia.
 *
 * Mount: inside ClientProviders, wrapping {children} between <OfflineBanner>
 * and <InstallPrompt> (CONTEXT.md D-04).
 */

export interface SplashGateProps {
  children: ReactNode;
  /**
   * @internal — for /debug/design-system-v2 visual regression and unit tests only.
   * Bypasses sessionStorage + useUser predicates and forces the splash to render.
   */
  forceShow?: boolean;
}

export function SplashGate({ children, forceShow = false }: SplashGateProps) {
  const { user, isLoading } = useUser();
  const reducedMotion = useReducedMotion();

  const [hydrated, setHydrated] = useState(false);
  const [shownThisSession, setShownThisSession] = useState(false);
  const [ready, setReady] = useState(false);

  // SSR-safe sessionStorage hydration (RESEARCH §"Pattern 1"; UI-SPEC §"<SplashGate> ... SSR safety").
  useEffect(() => {
    setHydrated(true);
    try {
      const shown = sessionStorage.getItem(SPLASH_FLAG_KEY) === 'true';
      setShownThisSession(shown);
      if (shown) setReady(true);
    } catch {
      // Incognito or sessionStorage disabled — graceful no-op (splash plays).
    }
  }, []);

  // When auth resolves with no user (logged-out / public route), splash never plays —
  // surface content instead of leaving the wrapper at opacity:0 forever.
  useEffect(() => {
    if (hydrated && !isLoading && !user && !ready && !forceShow) {
      setReady(true);
    }
  }, [hydrated, isLoading, user, ready, forceShow]);

  // SPLASH-01 trigger predicate (CONTEXT.md D-08): all four conditions hold OR forceShow.
  const shouldShowSplash =
    forceShow || (hydrated && !shownThisSession && !isLoading && !!user && !ready);

  return (
    <>
      <div
        data-testid="dashboard-wrapper"
        style={{
          opacity: ready ? 1 : 0,
          transform: reducedMotion ? undefined : ready ? 'scale(1)' : 'scale(0.97)',
          transition: reducedMotion
            ? 'opacity .2s linear'
            : 'opacity .6s cubic-bezier(.22,1,.36,1) .1s, transform .7s cubic-bezier(.22,1,.36,1) .1s',
        }}
      >
        {children}
      </div>
      {shouldShowSplash && (
        <Splash
          reducedMotion={reducedMotion}
          onDone={() => {
            setReady(true);
            setShownThisSession(true);
            try {
              sessionStorage.setItem(SPLASH_FLAG_KEY, 'true');
            } catch {
              // Incognito write failure — graceful no-op (splash already played).
            }
          }}
        />
      )}
    </>
  );
}
