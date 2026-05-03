'use client';
/**
 * Section10SheetGallery — Phase 182 (DSREF-01, DSREF-02; D-13, D-14)
 *
 * 5 launcher pills (one per device) that open the corresponding real *Sheet
 * body component wrapped in the Phase 175 <Sheet>. The *Sheet bodies
 * self-fetch via internal hooks; this gallery does NOT pass any data props.
 *
 * Only one sheet open at a time (D-14): single shared useState<DeviceKey | null>.
 *
 * Section number 10 per orchestrator's research_reconciliation override.
 */
import React, { useState } from 'react';
import {
  Pressable,
  Sheet,
  StoveSheet,
  ClimateSheet,
  LightsSheet,
  SonosSheet,
  PlugsSheet,
} from '@/app/components/EmberGlass';
import { DEVICE_KEYS, DEVICE_LABELS, type DeviceKey } from './sheetFixtures';

export function Section10SheetGallery(): React.ReactElement {
  const [openSheet, setOpenSheet] = useState<DeviceKey | null>(null);
  const close = (): void => setOpenSheet(null);

  return (
    <section aria-labelledby="sec-10-heading" style={{ marginBottom: 48 }}>
      <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600, letterSpacing: '1.2px', textTransform: 'uppercase', color: 'var(--text-2)' }}>
        10 / DEMO
      </p>
      <h2 id="sec-10-heading" style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 600, lineHeight: 1.2, color: 'var(--text-1)', margin: '4px 0 8px' }}>
        Sheet device dal vivo
      </h2>
      <p style={{ fontFamily: 'var(--font-body)', fontSize: 16, fontWeight: 400, color: 'var(--text-2)', marginBottom: 24 }}>
        Apri ciascun pannello con dati di esempio
      </p>

      {/* Launcher row — 5 pills */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        {DEVICE_KEYS.map((key) => {
          const isActive = openSheet === key;
          return (
            <Pressable
              key={key}
              as="button"
              type="button"
              data-testid={`launcher-${key}`}
              aria-label={`Open ${key} sheet`}
              onClick={() => setOpenSheet(key)}
              style={{
                height: 40,
                padding: '0 20px',
                borderRadius: 16,
                border: isActive ? '1px solid var(--accent)' : '0.5px solid var(--glass-border)',
                background: 'rgba(255,255,255,0.06)',
                color: 'var(--text-1)',
                fontFamily: 'var(--font-body)',
                fontSize: 13,
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              {DEVICE_LABELS[key]}
            </Pressable>
          );
        })}
      </div>

      {/* 5 sheets — each conditionally rendered. *Sheet bodies are zero-prop self-fetching. */}
      <Sheet open={openSheet === 'stove'} onClose={close} title="Stufa">
        <StoveSheet />
      </Sheet>
      <Sheet open={openSheet === 'climate'} onClose={close} title="Clima">
        <ClimateSheet />
      </Sheet>
      <Sheet open={openSheet === 'lights'} onClose={close} title="Luci">
        <LightsSheet />
      </Sheet>
      <Sheet open={openSheet === 'sonos'} onClose={close} title="Sonos">
        <SonosSheet />
      </Sheet>
      <Sheet open={openSheet === 'plugs'} onClose={close} title="Prese">
        <PlugsSheet />
      </Sheet>
    </section>
  );
}
