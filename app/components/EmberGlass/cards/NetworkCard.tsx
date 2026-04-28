'use client';

/**
 * NetworkCard — Phase 177 (DASH-08).
 *
 * Bundle source (PRIMARY visual contract):
 *   .planning/inbox/ember-glass-design/project/components/cards.jsx:343-359
 *
 * Header right slot is a green dot (#6aa86a) when WAN is reachable; it switches
 * to amber (#ffb84a) when `wan.connected === false` per D-25 (stale signal).
 * Body shows large download Mbps + Italian subtitle "{up} Mbps ↑ · {N} dispositivi".
 *
 * Tone is the device-class azure `#5eafff` (D-09).
 * RC-clean — no manual memoization hooks (D-28 / React Compiler discipline).
 */

import { useState } from 'react';
import { Wifi } from 'lucide-react';
import { GlassCard } from '../GlassCard';
import { CardHead } from '../CardHead';
import { StatusDot } from '../StatusDot';
import { Sheet } from '../Sheet';
import { SheetPlaceholderBody } from './SheetPlaceholderBody';
import { useNetworkData } from '@/app/components/devices/network/hooks/useNetworkData';

const TONE = '#5eafff';

export default function NetworkCard() {
  const [open, setOpen] = useState(false);
  const network = useNetworkData();
  const down = network.bandwidth?.download ?? 0;
  const up = network.bandwidth?.upload ?? 0;
  const deviceCount = network.devices?.length ?? 0;
  const wanOk = network.wan?.connected !== false;
  const dotColor = wanOk ? '#6aa86a' : '#ffb84a';

  return (
    <>
      <GlassCard tone={TONE} onOpen={() => setOpen(true)} data-testid="network-card">
        <CardHead
          Icon={Wifi}
          label="Rete"
          tone={TONE}
          right={<StatusDot on color={dotColor} />}
        />
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
            <div
              data-testid="network-down"
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 22,
                fontWeight: 600,
                color: '#fff',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {down}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-2)' }}>Mbps ↓</div>
          </div>
          <div style={{ marginTop: 6, fontSize: 12, color: 'var(--text-2)' }}>
            {up} Mbps ↑ · {deviceCount} dispositivi
          </div>
        </div>
      </GlassCard>
      <Sheet open={open} onClose={() => setOpen(false)} title="Rete">
        <SheetPlaceholderBody phase="178" device="network" />
      </Sheet>
    </>
  );
}
