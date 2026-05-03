'use client';

import React, { useState, useEffect } from 'react';
import { Pressable } from '@/app/components/EmberGlass';

// AUDIT-EXCEPTION (DS-02): the 6 oklch literal strings below are the source-of-truth
// preset map (D-05). Every other visual value on this page is a token reference.
const ACCENT_PRESETS = {
  copper: 'oklch(0.68 0.17 45)',
  rose:   'oklch(0.68 0.17 0)',
  violet: 'oklch(0.65 0.17 290)',
  blue:   'oklch(0.65 0.14 230)',
  green:  'oklch(0.68 0.12 150)',
  amber:  'oklch(0.76 0.15 75)',
} as const;

type HueName = keyof typeof ACCENT_PRESETS;

const HUE_DISPLAY_NAMES: Record<HueName, string> = {
  copper: 'Copper',
  rose:   'Rose',
  violet: 'Violet',
  blue:   'Blue',
  green:  'Green',
  amber:  'Amber',
};

function setAccent(value: string): void {
  document.documentElement.style.setProperty('--accent', value);
  try {
    localStorage.setItem('ember-glass-accent', value);
  } catch {
    /* T-174-03-04: QuotaExceeded / disabled storage — silently noop. */
  }
}

export function Section01Hue(): React.ReactElement {
  const [activeHue, setActiveHue] = useState<HueName>('copper');

  useEffect(() => {
    try {
      const persistedAccent = localStorage.getItem('ember-glass-accent');
      if (persistedAccent) {
        const match = (Object.entries(ACCENT_PRESETS) as Array<[HueName, string]>).find(
          ([, v]) => v === persistedAccent
        );
        if (match) setActiveHue(match[0]);
      }
    } catch {
      /* T-174-03-04: localStorage read failure — fall back to defaults. */
    }
  }, []);

  const onSwatchClick = (hue: HueName): void => {
    setAccent(ACCENT_PRESETS[hue]);
    setActiveHue(hue);
  };

  return (
    <section aria-labelledby="sec-01-heading" style={{ marginBottom: 48 }}>
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
        01 / HUE
      </p>
      <h2
        id="sec-01-heading"
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 24,
          fontWeight: 600,
          color: 'var(--text-1)',
          margin: '4px 0 8px 0',
        }}
      >
        Tinte accento
      </h2>
      <p
        style={{
          fontFamily: 'var(--font-body)',
          fontSize: 16,
          color: 'var(--text-2)',
          marginBottom: 16,
        }}
      >
        Clicca uno swatch per aggiornare --accent in tempo reale
      </p>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {(Object.keys(ACCENT_PRESETS) as HueName[]).map((hue) => {
          const isActive = activeHue === hue;
          return (
            <button
              key={hue}
              type="button"
              aria-label={`Set accent to ${HUE_DISPLAY_NAMES[hue]}`}
              aria-pressed={isActive}
              onClick={() => onSwatchClick(hue)}
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: ACCENT_PRESETS[hue],
                border: isActive ? '2px solid var(--accent)' : '1px solid var(--glass-border)',
                cursor: 'pointer',
                outlineOffset: 2,
              }}
            />
          );
        })}
      </div>
    </section>
  );
}
