'use client';

/**
 * RaspiCard — Phase 177 (DASH-09).
 *
 * Bundle source: .planning/inbox/ember-glass-design/project/components/cards.jsx:361-373.
 *
 * READ-ONLY summary card per D-11 / SC-#3:
 *   - GlassCard rendered WITHOUT an open handler → no Pressable, no Sheet, no cursor: pointer.
 *   - 2-column MiniStat grid (CPU + RAM) with progress bars.
 *   - Footer: `CPU temp {N}°C` (or `—°C` when sensor reading is null).
 *
 * RC-clean — no manual memoization hooks (D-28 — React Compiler discipline).
 */

import { Cpu } from 'lucide-react';
import { GlassCard } from '../GlassCard';
import { CardHead } from '../CardHead';
import { StatusDot } from '../StatusDot';
import { MiniStat } from '../MiniStat';
import { useRaspiData } from '@/app/components/devices/raspi/hooks/useRaspiData';

const TONE = '#6aa86a';

export default function RaspiCard() {
  const { data } = useRaspiData();
  const cpu = data?.cpuPercent ?? 0;
  const ram = data?.memoryPercent ?? 0;
  const temp = data?.cpuTemperature;

  return (
    <GlassCard tone={TONE} data-testid="raspi-card">
      <CardHead
        Icon={Cpu}
        label="Raspberry"
        tone={TONE}
        right={<StatusDot on color={TONE} />}
      />
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 8,
          flex: 1,
          alignContent: 'end',
        }}
      >
        <MiniStat label="CPU" value={`${cpu}%`} bar={cpu / 100} />
        <MiniStat label="RAM" value={`${ram}%`} bar={ram / 100} />
      </div>
      <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text-2)' }}>
        CPU temp {temp ?? '—'}°C
      </div>
    </GlassCard>
  );
}
