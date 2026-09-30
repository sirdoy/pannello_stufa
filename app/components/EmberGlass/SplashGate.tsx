'use client';

import { useState, useSyncExternalStore, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { useUser } from '@/lib/auth/useUser';
import { useReducedMotion } from '@/lib/hooks/useReducedMotion';
import { Splash } from './Splash';

const SPLASH_FLAG_KEY = 'ember-glass-splash-shown';

const subscribeNoop = () => () => {};

function readShownFlag(): boolean {
  try {
    return sessionStorage.getItem(SPLASH_FLAG_KEY) === 'true';
  } catch {
    // Incognito or sessionStorage disabled — graceful no-op (splash plays).
    return false;
  }
}

/**
 * SplashGate — Phase 176 (SPLASH-01, SPLASH-04, SPLASH-05)
 *
 * Orchestrator that gates the post-login splash animation:
 *   1. Reads useUser() from @/lib/auth/useUser.
 *   2. Reads sessionStorage[SPLASH_FLAG_KEY] to enforce session-once (SPLASH-04).
 *   3. Reads useReducedMotion() to honor prefers-reduced-motion: reduce.
 *   4. Mounts <Splash> as a sibling overlay over {children}, NOT a wrapper —
 *      so {children} mount immediately and dashboard data fetches start during
 *      the splash window (SPLASH-05; D-05 / D-20 / D-21).
 *
 * <Splash> is purely presentational; this orchestrator owns ALL integration
 * concerns. <Splash> never touches sessionStorage / auth / matchMedia.
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
  const pathname = usePathname();
  // The splash is post-login: never play it on the sign-in screens, even when a user is
  // already known there (auth bypass, stale session), or it would consume the
  // session-once flag before the real landing page.
  const onAuthPage = pathname === '/auth' || !!pathname?.startsWith('/auth/');

  // SSR-safe sessionStorage hydration (RESEARCH §"Pattern 1"; UI-SPEC §"<SplashGate> ... SSR safety"):
  // false on the server and during hydration, real values right after.
  const hydrated = useSyncExternalStore(subscribeNoop, () => true, () => false);
  const storedShown = useSyncExternalStore(subscribeNoop, readShownFlag, () => false);
  const [playedNow, setPlayedNow] = useState(false);
  const shownThisSession = storedShown || playedNow;
  const [ready, setReady] = useState(false);

  // Latch `ready` once the splash is known to be skipped: already shown this session, or
  // auth resolved with no user (logged-out / public route) or on a sign-in screen — surface
  // content instead of leaving the wrapper at opacity:0 forever. Adjusting state during
  // render (not in an effect) avoids an extra commit.
  const skipSplash =
    hydrated && (storedShown || (!isLoading && (!user || onAuthPage) && !forceShow));
  if (skipSplash && !ready) {
    setReady(true);
  }

  // SPLASH-01 trigger predicate (CONTEXT.md D-08): all four conditions hold OR forceShow.
  const shouldShowSplash =
    forceShow || (hydrated && !shownThisSession && !isLoading && !!user && !onAuthPage && !ready);

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
            setPlayedNow(true);
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
