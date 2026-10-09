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
import { PageHeader } from '@/app/components/EmberGlass/PageHeader';
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
import { Section11CompactControls } from './sections/Section11CompactControls';

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
      <PageHeader
        title="Ember Glass"
        eyebrow="Design system · v2"
        description="Riferimento token e picker live · Phase 174"
        backHref="/debug"
      />

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
      <Section11CompactControls />
    </div>
  );
}
