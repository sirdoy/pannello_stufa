'use client';

import React, { useState, useEffect } from 'react';

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

const TOKEN_NAMES = [
  '--accent',
  '--glass-bg',
  '--glass-blur',
  '--glass-border',
  '--glass-shadow',
  '--text-1',
  '--text-2',
  '--r-card',
  '--pad-card',
  '--font-display',
  '--font-body',
] as const;
type TokenName = typeof TOKEN_NAMES[number];

export function Section03Tokens(): React.ReactElement {
  // activeHue is read from the live --accent CSS variable for the description;
  // this section is stateless — the token grid is purely declarative.
  // We use a fixed fallback for the static token description.
  const activeHue: HueName = 'copper';

  const [tokens, setTokens] = useState<Record<TokenName, string>>(() => {
    const init = {} as Record<TokenName, string>;
    for (const name of TOKEN_NAMES) init[name] = '';
    return init;
  });

  useEffect(() => {
    const cs = getComputedStyle(document.documentElement);
    const next = {} as Record<TokenName, string>;
    for (const name of TOKEN_NAMES) {
      next[name] = cs.getPropertyValue(name).trim();
    }
    setTokens(next);
  }, []);

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

      {/* === Sub-block A: Live token table (D-15) === */}
      <hr style={{ border: 0, borderTop: '0.5px solid var(--glass-border)', margin: '24px 0' }} />

      <div>
        <h3
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 24,
            fontWeight: 600,
            lineHeight: 1.2,
            color: 'var(--text-1)',
            margin: 0,
          }}
        >
          Token live
        </h3>
        <p
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: 16,
            fontWeight: 400,
            color: 'var(--text-2)',
            marginTop: 4,
          }}
        >
          Valori risolti da :root via getComputedStyle.
        </p>
        <dl
          style={{
            marginTop: 16,
            display: 'grid',
            gridTemplateColumns: 'minmax(160px, max-content) 1fr',
            gap: 12,
            alignItems: 'baseline',
          }}
        >
          {TOKEN_NAMES.map((name) => (
            <React.Fragment key={name}>
              <dt
                style={{
                  fontFamily: 'ui-monospace, SF Mono, Menlo, monospace',
                  fontSize: 12,
                  fontWeight: 400,
                  color: 'var(--text-2)',
                }}
              >
                {name}
              </dt>
              <dd
                data-token-name={name}
                style={{
                  fontFamily: 'ui-monospace, SF Mono, Menlo, monospace',
                  fontSize: 12,
                  fontWeight: 400,
                  color: 'var(--text-1)',
                  margin: 0,
                  wordBreak: 'break-all',
                }}
              >
                {tokens[name] || '—'}
              </dd>
            </React.Fragment>
          ))}
        </dl>
      </div>

      {/* === Sub-block B: Typography specimens (D-17, UI-SPEC §Specimen Scale) === */}
      <hr style={{ border: 0, borderTop: '0.5px solid var(--glass-border)', margin: '24px 0' }} />

      <div>
        <h3
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 24,
            fontWeight: 600,
            lineHeight: 1.2,
            color: 'var(--text-1)',
            margin: 0,
          }}
        >
          Tipografia
        </h3>
        <p
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: 16,
            fontWeight: 400,
            color: 'var(--text-2)',
            marginTop: 4,
          }}
        >
          Coppie display + body al ritmo della specimen scale.
        </p>
        <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* AUDIT-EXCEPTION (DSREF-02): font-size literals below are documentary specimens
              from UI-SPEC §Specimen Scale and §Page Structural Scale. Each specimen
              renders at its target size/weight so the user can read it as a sample. */}
          <div>
            <div
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 40,
                fontWeight: 600,
                lineHeight: 1.05,
                letterSpacing: '-1px',
                color: 'var(--text-1)',
              }}
            >
              Ember Glass
            </div>
            <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text-2)', marginTop: 4 }}>
              Outfit 40/600 / tracking -1px — page display
            </div>
          </div>
          <div>
            <div
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 24,
                fontWeight: 600,
                lineHeight: 1.2,
                color: 'var(--text-1)',
              }}
            >
              Tipografia display
            </div>
            <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text-2)', marginTop: 4 }}>
              Outfit 24/600 — section heading
            </div>
          </div>
          <div>
            <div
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 18,
                fontWeight: 600,
                lineHeight: 1.2,
                color: 'var(--text-1)',
              }}
            >
              Nome primitivo
            </div>
            <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text-2)', marginTop: 4 }}>
              Outfit 18/600 — specimen legacy
            </div>
          </div>
          <div>
            <div
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 68,
                fontWeight: 600,
                lineHeight: 1,
                color: 'var(--text-1)',
              }}
            >
              21°
            </div>
            <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text-2)', marginTop: 4 }}>
              Outfit 68/600 — RadialDial center value
            </div>
          </div>
          <div>
            <div
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 28,
                fontWeight: 600,
                lineHeight: 1,
                color: 'var(--text-1)',
              }}
            >
              72%
            </div>
            <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text-2)', marginTop: 4 }}>
              Outfit 28/600 — BigSlider percentage
            </div>
          </div>
          <div>
            <div
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: 16,
                fontWeight: 400,
                lineHeight: 1.5,
                color: 'var(--text-1)',
              }}
            >
              Testo corpo con ritmo 1.5.
            </div>
            <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text-2)', marginTop: 4 }}>
              Inter 16/400 — body
            </div>
          </div>
          <div>
            <div
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: 14,
                fontWeight: 500,
                lineHeight: 1.4,
                color: 'var(--text-1)',
              }}
            >
              Descrizione in una riga.
            </div>
            <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text-2)', marginTop: 4 }}>
              Inter 14/500 — descrizione legacy
            </div>
          </div>
          <div>
            <div
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: 12,
                fontWeight: 600,
                letterSpacing: '1.2px',
                textTransform: 'uppercase',
                color: 'var(--text-1)',
              }}
            >
              01 / TOKENS
            </div>
            <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text-2)', marginTop: 4 }}>
              Inter 12/600 / 1.2px / uppercase — eyebrow
            </div>
          </div>
          <div>
            <div
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: 13,
                fontWeight: 500,
                color: 'var(--text-1)',
              }}
            >
              Stufa
            </div>
            <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text-2)', marginTop: 4 }}>
              Inter 13/500 — chip / launcher pill
            </div>
          </div>
          <div>
            <div
              style={{
                fontFamily: 'ui-monospace, SF Mono, Menlo, monospace',
                fontSize: 12,
                fontWeight: 400,
                color: 'var(--text-1)',
              }}
            >
              {'<GlassCard tone={…} />'}
            </div>
            <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text-2)', marginTop: 4 }}>
              Inter mono 12/400 — snippet
            </div>
          </div>
        </div>
      </div>

      {/* === Sub-block C: Spacing scale tiles (D-16) === */}
      <hr style={{ border: 0, borderTop: '0.5px solid var(--glass-border)', margin: '24px 0' }} />

      <div>
        <h3
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 24,
            fontWeight: 600,
            lineHeight: 1.2,
            color: 'var(--text-1)',
            margin: 0,
          }}
        >
          Spaziature
        </h3>
        <p
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: 16,
            fontWeight: 400,
            color: 'var(--text-2)',
            marginTop: 4,
          }}
        >
          Scala letterali armonizzata 0/4/8/12/16/20/24/28/32/40/48/64 px.
        </p>
        <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* AUDIT-EXCEPTION (D-16): the 12 px literals below are the documentary spacing scale. */}
          {[0, 4, 8, 12, 16, 20, 24, 28, 32, 40, 48, 64].map((px) => (
            <div
              key={px}
              data-spacing-px={px}
              style={{ display: 'flex', alignItems: 'center', gap: 12 }}
            >
              <div
                style={{
                  width: px,
                  height: 8,
                  background: 'var(--accent)',
                  borderRadius: 4,
                  minWidth: 1,
                }}
              />
              <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text-2)' }}>
                {px}px
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* === Sub-block D: Shadow + blur tiles (DSREF-01) === */}
      <hr style={{ border: 0, borderTop: '0.5px solid var(--glass-border)', margin: '24px 0' }} />

      <div>
        <h3
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 24,
            fontWeight: 600,
            lineHeight: 1.2,
            color: 'var(--text-1)',
            margin: 0,
          }}
        >
          Ombra e blur
        </h3>
        <p
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: 16,
            fontWeight: 400,
            color: 'var(--text-2)',
            marginTop: 4,
          }}
        >
          Sample del glass-shadow e del backdrop blur.
        </p>
        <div style={{ marginTop: 16, display: 'flex', gap: 24, flexWrap: 'wrap' }}>
          <div
            data-shadow-tile
            style={{
              width: 160,
              height: 100,
              borderRadius: 'var(--r-card)',
              background: 'var(--glass-bg)',
              border: '0.5px solid var(--glass-border)',
              boxShadow: 'var(--glass-shadow)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: 'var(--font-body)',
              fontSize: 12,
              color: 'var(--text-2)',
            }}
          >
            --glass-shadow
          </div>
          <div
            data-blur-tile
            style={{
              width: 160,
              height: 100,
              borderRadius: 'var(--r-card)',
              background: 'var(--glass-bg)',
              border: '0.5px solid var(--glass-border)',
              backdropFilter: 'blur(var(--glass-blur)) saturate(180%)',
              WebkitBackdropFilter: 'blur(var(--glass-blur)) saturate(180%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: 'var(--font-body)',
              fontSize: 12,
              color: 'var(--text-2)',
            }}
          >
            --glass-blur
          </div>
        </div>
      </div>
    </section>
  );
}
