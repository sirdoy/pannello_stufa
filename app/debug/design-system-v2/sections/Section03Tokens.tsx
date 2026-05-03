'use client';

import React from 'react';

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

export function Section03Tokens(): React.ReactElement {
  // activeHue is read from the live --accent CSS variable for the description;
  // this section is stateless — the token grid is purely declarative.
  // We use a fixed fallback for the static token description.
  const activeHue: HueName = 'copper';

  return (
    <section aria-labelledby="sec-03-heading" style={{ marginBottom: 48 }}>
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
        03 / TOKENS
      </p>
      <h2
        id="sec-03-heading"
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 24,
          fontWeight: 600,
          color: 'var(--text-1)',
          margin: '4px 0 8px 0',
        }}
      >
        Token
      </h2>
      <p
        style={{
          fontFamily: 'var(--font-body)',
          fontSize: 16,
          color: 'var(--text-2)',
          marginBottom: 16,
        }}
      >
        11 variabili CSS · sorgente: globals.css
      </p>
      <dl
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(180px, 1fr) 2fr',
          gap: 8,
          fontFamily: 'var(--font-body)',
          fontSize: 12,
        }}
      >
        {(
          [
            ['--glass-bg', 'rgba(255, 255, 255, 0.04)'],
            ['--glass-blur', '24px'],
            ['--glass-border', 'rgba(255, 255, 255, 0.08)'],
            ['--glass-shadow', '0 8px 32px ...'],
            ['--accent', `${ACCENT_PRESETS[activeHue]} (${HUE_DISPLAY_NAMES[activeHue]})`],
            ['--text-1', '#f5f5f4'], // AUDIT-EXCEPTION (DS-02): documentary text echoing the token's source value, not a styling literal

            ['--text-2', 'rgba(245, 245, 244, 0.55)'],
            ['--r-card', '24px'],
            ['--pad-card', '16px'],
            ['--font-display', 'Outfit (next/font)'],
            ['--font-body', 'Inter (next/font)'],
          ] as const
        ).map(([name, val]) => (
          <React.Fragment key={name}>
            <dt style={{ fontWeight: 600, color: 'var(--text-1)' }}>{name}</dt>
            <dd style={{ color: 'var(--text-2)', margin: 0 }}>{val}</dd>
          </React.Fragment>
        ))}
      </dl>
    </section>
  );
}
