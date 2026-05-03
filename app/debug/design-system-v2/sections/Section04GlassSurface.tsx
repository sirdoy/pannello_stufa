'use client';

import React from 'react';

export function Section04GlassSurface(): React.ReactElement {
  return (
    <section aria-labelledby="sec-04-heading" style={{ marginBottom: 48 }}>
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
        04 / DEMO
      </p>
      <h2
        id="sec-04-heading"
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 24,
          fontWeight: 600,
          color: 'var(--text-1)',
          margin: '4px 0 16px 0',
        }}
      >
        Demo glass-surface
      </h2>
      <div className="glass-surface" style={{ padding: 'var(--pad-card)' }}>
        <h3
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 24,
            fontWeight: 600,
            color: 'var(--text-1)',
            margin: 0,
          }}
        >
          Superficie vetro
        </h3>
        <p
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: 16,
            color: 'var(--text-2)',
            margin: '8px 0',
          }}
        >
          Anteprima dei token. Clicca un colore sopra per vedere --accent aggiornarsi.
        </p>
        <div
          role="img"
          aria-label="Live accent preview"
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: 'var(--accent)',
            marginTop: 8,
          }}
        />
      </div>
    </section>
  );
}
