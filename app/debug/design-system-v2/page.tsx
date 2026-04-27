'use client';

/**
 * /debug/design-system-v2 — Phase 174 (DS-02, DS-03, DS-05)
 *
 * Token + accent picker + ambient toggle + glass-surface demo. Single-file client
 * component per UI-SPEC §"Claude's Discretion". Italian visible copy; English aria
 * labels for the 6 hue swatches (matches the test contract `Set accent to {Name}`).
 *
 * Dependency contract:
 * - Hue swatch click → `document.documentElement.style.setProperty('--accent', value)`
 *   AND localStorage 'ember-glass-accent' write (D-07).
 * - Ambient toggle → localStorage 'ember-glass-ambient' write (D-13/D-14) AND
 *   `window.dispatchEvent(new CustomEvent('ember-glass-ambient-change', { detail }))`
 *   consumed by AmbientBg (Plan 02 contract). Also writes
 *   `document.documentElement.dataset.ambient` so the in-session toggle survives a
 *   StrictMode/dev re-mount and matches the pre-paint script's hard-reload state.
 * - All localStorage writes wrapped in try/catch (T-174-03-04 mitigation).
 *
 * Critical-security note (D-05 picker scope): the 6 oklch values are the
 * source-of-truth allowlist for `--accent`; the picker UI cannot dispatch any value
 * outside ACCENT_PRESETS, so localStorage tampering would only affect the inline
 * pre-paint script's read path (handled in Plan 02's threat register T-174-02-02).
 */

import React, { useState, useEffect } from 'react';
import { Pressable, Sheet } from '@/app/components/EmberGlass';

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

function setAmbient(on: boolean): void {
  try {
    localStorage.setItem('ember-glass-ambient', on ? 'true' : 'false');
  } catch {
    /* T-174-03-04: QuotaExceeded / disabled storage — silently noop. */
  }
  document.documentElement.dataset.ambient = on ? 'on' : 'off';
  window.dispatchEvent(new CustomEvent<boolean>('ember-glass-ambient-change', { detail: on }));
}

export default function DesignSystemV2Page(): React.ReactElement {
  const [activeHue, setActiveHue] = useState<HueName>('copper');
  const [ambientOn, setAmbientOn] = useState<boolean>(false);
  const [sheetOpen, setSheetOpen] = useState<boolean>(false);

  // Sync local state from persisted storage on mount. The inline pre-paint script
  // already applied --accent and dataset.ambient; this useEffect just rehydrates
  // React state so aria-pressed / aria-checked reflect the persisted choice.
  useEffect(() => {
    try {
      const persistedAccent = localStorage.getItem('ember-glass-accent');
      if (persistedAccent) {
        const match = (Object.entries(ACCENT_PRESETS) as Array<[HueName, string]>).find(
          ([, v]) => v === persistedAccent
        );
        if (match) setActiveHue(match[0]);
      }
      const persistedAmbient = localStorage.getItem('ember-glass-ambient');
      if (persistedAmbient === 'true') setAmbientOn(true);
    } catch {
      /* T-174-03-04: localStorage read failure — fall back to defaults. */
    }
  }, []);

  const onSwatchClick = (hue: HueName): void => {
    setAccent(ACCENT_PRESETS[hue]);
    setActiveHue(hue);
  };

  const onAmbientToggle = (): void => {
    const next = !ambientOn;
    setAmbient(next);
    setAmbientOn(next);
  };

  return (
    <main
      style={{
        maxWidth: 1240,
        margin: '0 auto',
        padding: 'var(--pad-card)',
        position: 'relative',
        zIndex: 1,
      }}
    >
      {/* Page header */}
      <header style={{ marginBottom: 32 }}>
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
          DESIGN SYSTEM · v2
        </p>
        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 40,
            fontWeight: 600,
            lineHeight: 1.05,
            letterSpacing: '-1px',
            color: 'var(--text-1)',
            margin: 0,
          }}
        >
          Ember Glass
        </h1>
        <p
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: 16,
            fontWeight: 400,
            color: 'var(--text-2)',
            marginTop: 8,
          }}
        >
          Riferimento token e picker live · Phase 174
        </p>
      </header>

      <hr style={{ border: 0, borderTop: '0.5px solid var(--glass-border)', margin: '24px 0' }} />

      {/* Section 01 — Hue picker */}
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

      {/* Section 02 — Ambient toggle */}
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

      {/* Section 03 — Token grid (live) */}
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

      {/* Section 04 — Glass surface demo */}
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

      {/* Section 05 — Press primitive demo (Phase 175 / DS-07) */}
      <section aria-labelledby="sec-05-heading" style={{ marginBottom: 48 }}>
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
          05 / PRESS
        </p>
        <h2
          id="sec-05-heading"
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 24,
            fontWeight: 600,
            color: 'var(--text-1)',
            margin: '4px 0 8px 0',
          }}
        >
          Animazione di pressione
        </h2>
        <p
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: 16,
            color: 'var(--text-2)',
            marginBottom: 16,
          }}
        >
          Tap o clicca per vedere scale(0.97) ↔ scale(1) con cubic-bezier(.34,1.56,.64,1) su 220ms
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          <Pressable
            as="div"
            data-testid="press-card-demo"
            className="glass-surface"
            style={{
              aspectRatio: '1 / 1',
              display: 'grid',
              placeItems: 'center',
              touchAction: 'manipulation',
            }}
          >
            <span
              style={{
                fontSize: 16,
                fontFamily: 'var(--font-display)',
                fontWeight: 600,
                color: 'var(--text-1)',
              }}
            >
              Card
            </span>
          </Pressable>
          <Pressable
            as="button"
            type="button"
            className="glass-surface press-anim"
            style={{
              height: 56,
              border: 0,
              color: 'var(--text-1)',
              fontFamily: 'var(--font-display)',
              fontSize: 16,
              fontWeight: 600,
              cursor: 'pointer',
              touchAction: 'manipulation',
            }}
            aria-label="Esempio bottone pressabile"
          >
            Pressable button
          </Pressable>
          <Pressable
            as="div"
            className="glass-surface"
            style={{
              width: 80,
              height: 80,
              borderRadius: 999,
              justifySelf: 'center',
              touchAction: 'manipulation',
            }}
          />
        </div>
      </section>

      {/* Section 06 — Sheet primitive demo (Phase 175 / SHEET-01) */}
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
    </main>
  );
}
