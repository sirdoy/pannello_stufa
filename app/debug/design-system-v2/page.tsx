'use client';

/**
 * /debug/design-system-v2 — Phase 174 + Phase 182 (D-01)
 *
 * Section orchestrator. Decomposed into per-section files under `./sections/`.
 * Each Section0X component owns its own state, helpers, and JSX verbatim from
 * the original Phase-174 single-file page (sections 01-07) — Phase 182 trims
 * page.tsx to import + render order only. Phase 182 will add Sections 08-10.
 *
 * Section 01 (HUE) writes `--accent` and persists to localStorage; the recolor
 * invariant for DSREF-03 is unchanged. Existing test contracts (accent-picker
 * Playwright spec, ambient-persist Playwright spec, page.test.tsx Jest spec) all
 * key off section IDs `sec-01-heading`..`sec-07-heading` and aria-labels that
 * survive verbatim through the extraction.
 */

import React from 'react';
import { Section01Hue } from './sections/Section01Hue';
import { Section02Ambient } from './sections/Section02Ambient';
import { Section03Tokens } from './sections/Section03Tokens';
import { Section04GlassSurface } from './sections/Section04GlassSurface';
import { Section05Press } from './sections/Section05Press';
import { Section06Sheet } from './sections/Section06Sheet';
import { Section07Splash } from './sections/Section07Splash';
import { Section08CardPrimitives } from './sections/Section08CardPrimitives';
import { Section09SheetPrimitives } from './sections/Section09SheetPrimitives';
import { Section10SheetGallery } from './sections/Section10SheetGallery';

export default function DesignSystemV2Page(): React.ReactElement {
  return (
    // Wrapper is a plain div: app/layout.tsx already renders the page-level
    // <main> landmark, and nesting two main landmarks fails the axe-core
    // landmark-no-duplicate-main rule that Next 16 surfaces in dev.
    <div
      style={{
        maxWidth: 1240,
        margin: '0 auto',
        padding: 'var(--pad-card)',
        position: 'relative',
        zIndex: 1,
      }}
    >
      {/* Page header — verbatim from Phase 174 page.tsx lines 119-156 */}
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

      <Section01Hue />
      <Section02Ambient />
      <Section03Tokens />
      <Section04GlassSurface />
      <Section05Press />
      <Section06Sheet />
      <Section07Splash />
      <Section08CardPrimitives />
      <Section09SheetPrimitives />
      <Section10SheetGallery />
    </div>
  );
}
