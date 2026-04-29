'use client';

/**
 * StoveCard — Phase 177 (DASH-02)
 *
 * Dashboard summary tile for the Thermorossi stove. Composes Wave 1 EmberGlass
 * primitives (GlassCard + CardHead + StatusDot) with FlameViz (Phase 176) and
 * the Phase 175 Sheet primitive wrapping the real `<StoveSheet>` body
 * (Phase 178-09 swap; placeholder retired for this card).
 *
 * A-01 deviation (no °C superscript on the value):
 *   The bundle (`cards.jsx:81-107`) renders a `°C` superscript on the 36px
 *   readout. The bundle's `temp` was mock data — Thermorossi's HA proxy
 *   exposes only `power_level` (1..5 dimensionless integer). Rendering a
 *   temperature unit on a power level would be a semantic lie. The 36px
 *   display shows the digit alone. The unit-test asserts NO `°C` substring
 *   in the DOM near the value. A future phase that wires Netatmo room temp
 *   into this card may restore the °C superscript.
 *
 * Bundle source (PRIMARY visual contract):
 *   .planning/inbox/ember-glass-design/project/components/cards.jsx:81-107
 *
 * RC-clean (D-28): no useMemo / useCallback. React Compiler 1.0 auto-memoizes.
 */

import { useState } from 'react';
import { Flame } from 'lucide-react';
import { useUser } from '@auth0/nextjs-auth0/client';
import { GlassCard } from '../GlassCard';
import { CardHead } from '../CardHead';
import { StatusDot } from '../StatusDot';
import { FlameViz } from '../FlameViz';
import { Sheet } from '../Sheet';
import { StoveSheet } from '../sheets/StoveSheet';
import { useStoveData } from '@/app/components/devices/stove/hooks/useStoveData';
import { useVersion } from '@/app/context/VersionContext';

export default function StoveCard() {
  const [open, setOpen] = useState(false);
  const { checkVersion } = useVersion();
  const { user } = useUser();
  const stove = useStoveData({ checkVersion, userId: user?.sub });

  // D-25: stale → amber StatusDot. `staleness` is StalenessInfo | null.
  const isStale = stove.staleness?.isStale ?? false;
  const dotColor = isStale ? '#ffb84a' : undefined;

  return (
    <>
      <GlassCard
        tone="var(--accent)"
        onOpen={() => setOpen(true)}
        data-testid="stove-card"
      >
        <CardHead
          Icon={Flame}
          label="Stufa"
          tone="var(--accent)"
          right={<StatusDot on={stove.isAccesa} color={dotColor} />}
        />
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
            position: 'relative',
          }}
        >
          {/* FlameViz absolute-positioned top-right (bundle cards.jsx:88).
              Bleeds past the card padding by design. */}
          <div
            style={{ position: 'absolute', right: -8, top: -10, opacity: 0.9 }}
            data-testid="flame-viz-wrapper"
          >
            <FlameViz on={stove.isAccesa} intensity={(stove.powerLevel ?? 0) / 5} />
          </div>
          {/* 36px display — power_level integer, NO temperature unit (A-01). */}
          <div
            data-testid="stove-temp"
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 36,
              fontWeight: 600,
              lineHeight: 1,
              color: stove.isAccesa ? '#fff' : 'var(--text-2)',
              letterSpacing: -1.2,
              position: 'relative',
              zIndex: 1,
            }}
          >
            {stove.powerLevel ?? '—'}
          </div>
          <div style={{ marginTop: 6, fontSize: 12, color: 'var(--text-2)' }}>
            {stove.isAccesa ? `Fiamma ${stove.powerLevel} · Ventola ${stove.fanLevel}` : 'Spenta'}
          </div>
        </div>
      </GlassCard>
      <Sheet open={open} onClose={() => setOpen(false)} title="Stufa">
        <StoveSheet />
      </Sheet>
    </>
  );
}
