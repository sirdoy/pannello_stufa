'use client';

import React, { useState, useEffect } from 'react';

function setAmbient(on: boolean): void {
  try {
    localStorage.setItem('ember-glass-ambient', on ? 'true' : 'false');
  } catch {
    /* T-174-03-04: QuotaExceeded / disabled storage — silently noop. */
  }
  document.documentElement.dataset.ambient = on ? 'on' : 'off';
  window.dispatchEvent(new CustomEvent<boolean>('ember-glass-ambient-change', { detail: on }));
}

export function Section02Ambient(): React.ReactElement {
  const [ambientOn, setAmbientOn] = useState<boolean>(false);

  useEffect(() => {
    try {
      const persistedAmbient = localStorage.getItem('ember-glass-ambient');
      if (persistedAmbient === 'true') setAmbientOn(true);
    } catch {
      /* T-174-03-04: localStorage read failure — fall back to defaults. */
    }
  }, []);

  const onAmbientToggle = (): void => {
    const next = !ambientOn;
    setAmbient(next);
    setAmbientOn(next);
  };

  return (
    <section aria-labelledby="sec-02-heading" style={{ marginBottom: 48 }}>
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
        02 / AMBIENT
      </p>
      <h2
        id="sec-02-heading"
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 24,
          fontWeight: 600,
          color: 'var(--text-1)',
          margin: '4px 0 8px 0',
        }}
      >
        Glow ambient
      </h2>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <span style={{ fontFamily: 'var(--font-body)', fontSize: 16, color: 'var(--text-1)' }}>
          Glow ambient
        </span>
        <button
          type="button"
          role="switch"
          aria-checked={ambientOn}
          aria-label="Attiva glow ambient"
          onClick={onAmbientToggle}
          style={{
            width: 44,
            height: 24,
            borderRadius: 999,
            background: ambientOn ? 'var(--accent)' : 'var(--glass-bg)',
            border: '1px solid var(--glass-border)',
            cursor: 'pointer',
            padding: 2,
            position: 'relative',
          }}
        >
          <span
            aria-hidden="true"
            style={{
              display: 'block',
              width: 18,
              height: 18,
              borderRadius: 999,
              background: 'var(--text-1)',
              transform: ambientOn ? 'translateX(20px)' : 'translateX(0)',
              transition: 'transform 200ms cubic-bezier(.34,1.56,.64,1)',
            }}
          />
        </button>
      </div>
      <p
        style={{
          fontFamily: 'var(--font-body)',
          fontSize: 16,
          color: 'var(--text-2)',
          marginTop: 8,
        }}
      >
        Persistito in localStorage. Spento di default per risparmiare frame.
      </p>
    </section>
  );
}
