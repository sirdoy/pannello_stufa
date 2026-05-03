'use client';

import React, { useState } from 'react';
import { SplashGate } from '@/app/components/EmberGlass';

export function Section07Splash(): React.ReactElement {
  // Phase 176 (Claude's Discretion per UI-SPEC §"Copywriting Contract"): Replay splash demo.
  // Increment forces a remount of <SplashGate forceShow> so the splash plays again.
  const [replayKey, setReplayKey] = useState<number>(0);

  return (
    <section aria-labelledby="sec-07-heading" style={{ marginBottom: 48 }}>
      <p
        style={{
          fontFamily: 'var(--font-body)',
          fontSize: 12,
          fontWeight: 600,
          letterSpacing: '1.2px',
          textTransform: 'uppercase',
          color: 'var(--text-2)',
        }}
      >
        07 / SPLASH
      </p>
      <h2
        id="sec-07-heading"
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 24,
          fontWeight: 600,
          color: 'var(--text-1)',
          margin: '4px 0 8px 0',
        }}
      >
        Splash post-Auth0
      </h2>
      <p
        style={{
          fontFamily: 'var(--font-body)',
          fontSize: 16,
          color: 'var(--text-2)',
          marginBottom: 16,
        }}
      >
        Pulisce sessionStorage e ri-monta lo splash per il regression test visivo
      </p>
      <button
        type="button"
        onClick={() => {
          try {
            sessionStorage.removeItem('ember-glass-splash-shown');
          } catch {
            /* T-174-03-04 mirror: incognito / sessionStorage disabled — silently noop. */
          }
          setReplayKey((k) => k + 1);
        }}
        style={{
          height: 56,
          padding: '0 24px',
          borderRadius: 16,
          border: 'none',
          background: 'rgba(255,255,255,0.06)',
          color: 'var(--text-1)',
          fontFamily: 'var(--font-display)',
          fontSize: 16,
          fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        Replay splash
      </button>
      {replayKey > 0 && (
        <SplashGate key={replayKey} forceShow>
          <div aria-hidden="true" />
        </SplashGate>
      )}
    </section>
  );
}
