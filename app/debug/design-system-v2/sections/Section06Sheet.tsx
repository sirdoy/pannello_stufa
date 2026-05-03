'use client';

import React, { useState } from 'react';
import { Sheet } from '@/app/components/EmberGlass';

export function Section06Sheet(): React.ReactElement {
  const [sheetOpen, setSheetOpen] = useState<boolean>(false);

  return (
    <section aria-labelledby="sec-06-heading" style={{ marginBottom: 48 }}>
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
        06 / SHEET
      </p>
      <h2
        id="sec-06-heading"
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 24,
          fontWeight: 600,
          color: 'var(--text-1)',
          margin: '4px 0 8px 0',
        }}
      >
        Sheet primitivo
      </h2>
      <p
        style={{
          fontFamily: 'var(--font-body)',
          fontSize: 16,
          color: 'var(--text-2)',
          marginBottom: 16,
        }}
      >
        Apri lo sheet di esempio per testare le tre vie di chiusura: Esc, tap fuori, e bottone X
      </p>
      <button
        type="button"
        onClick={() => setSheetOpen(true)}
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
        Apri sheet demo
      </button>
      <Sheet open={sheetOpen} onClose={() => setSheetOpen(false)} title="Demo sheet">
        {[
          { primary: 'Riga 1', secondary: 'Contenuto fittizio' },
          { primary: 'Riga 2', secondary: 'Contenuto fittizio' },
          { primary: 'Riga di esempio lunga abbastanza da scrollare', secondary: 'Contenuto fittizio' },
        ].map((row, i) => (
          <div
            key={i}
            style={{
              padding: '14px 0',
              borderBottom: '0.5px solid var(--glass-border)',
            }}
          >
            <div style={{ fontSize: 16, color: 'var(--text-1)', fontWeight: 600 }}>
              {row.primary}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 2 }}>
              {row.secondary}
            </div>
          </div>
        ))}
        <div aria-hidden="true" style={{ height: 600 }} />
      </Sheet>
    </section>
  );
}
