'use client';

/**
 * DirigeraCard — Phase 177 (DASH-10 sibling).
 *
 * Bundle source: .planning/inbox/ember-glass-design/project/components/cards.jsx:385-432
 * (same shape as TuyaCard, label "IKEA").
 *
 * A-02 / RESEARCH LANDMINE #2:
 *   useDirigeraData() exposes sensors (contact + motion) only, NOT plugs.
 *   Per A-02 default (c), this card renders an empty list with `0W` total power
 *   and `0 di 0 accese` footer until a future phase adds plug data to the
 *   DIRIGERA proxy. The hook is still consumed here for forward-compatibility —
 *   when plug data lands, the empty array below can be replaced without re-wiring.
 *
 * Per DASH-10, dashboard surface is REPORT-ONLY (no toggles); plug controls
 * land in PlugsSheet (Phase 178).
 *
 * RC-clean — no manual memoization hooks (D-28 — React Compiler discipline).
 */

import { useState } from 'react';
import { Plug } from 'lucide-react';
import { GlassCard } from '../GlassCard';
import { CardHead } from '../CardHead';
import { Sheet } from '../Sheet';
import { SheetPlaceholderBody } from './SheetPlaceholderBody';
import { useDirigeraData } from '@/app/components/devices/dirigera/hooks/useDirigeraData';

const TONE = '#ffb84a';

interface DirigeraPlug {
  id: string;
  name: string;
  on: boolean;
  power: number;
}

function formatPower(w: number): string {
  return w >= 1000 ? `${(w / 1000).toFixed(1)}kW` : `${w}W`;
}

export default function DirigeraCard() {
  const [open, setOpen] = useState(false);

  // A-02 LANDMINE #2: useDirigeraData() returns sensors only.
  // Hook consumed for forward-compatibility — when plug data lands,
  // replace the empty array below with the real list.
  useDirigeraData();
  const list: DirigeraPlug[] = [];
  const onCount = 0;
  const totalPower = 0;

  const right = (
    <div
      style={{
        fontSize: 11,
        fontWeight: 600,
        color: TONE,
        letterSpacing: 0.3,
        fontVariantNumeric: 'tabular-nums',
      }}
    >
      {formatPower(totalPower)}
    </div>
  );

  return (
    <>
      <GlassCard tone={TONE} onOpen={() => setOpen(true)} data-testid="dirigera-card">
        <CardHead Icon={Plug} label="IKEA" tone={TONE} right={right} />
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 5,
            flex: 1,
            justifyContent: 'center',
          }}
        >
          {/* Empty by design per A-02. */}
        </div>
        <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text-2)' }}>
          {onCount} di {list.length} accese
        </div>
      </GlassCard>
      <Sheet open={open} onClose={() => setOpen(false)} title="IKEA">
        <SheetPlaceholderBody phase="178" device="plugs-dirigera" />
      </Sheet>
    </>
  );
}
