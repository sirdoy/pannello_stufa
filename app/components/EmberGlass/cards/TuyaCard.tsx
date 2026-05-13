'use client';

/**
 * TuyaCard — Phase 177 (DASH-10).
 *
 * Bundle source: .planning/inbox/ember-glass-design/project/components/cards.jsx:385-432.
 *
 * Per DASH-10, the dashboard surface is REPORT-ONLY: NO inline toggles, NO switch role.
 * Plug toggles live in the PlugsSheet (Phase 178). Tapping the card opens the sheet
 * wired to `<PlugsSheet />` (Phase 178-09 swap).
 *
 * Hook field mapping — `TuyaPlug` (types/tuyaProxy.ts:33-46) exposes:
 *   device_id   → row key + fallback name
 *   switch_on   → on-state (boolean | null; null = UNREACHABLE → treated as off)
 *   power_w     → wattage contribution (null tolerated → 0)
 *   custom_name → display name (null → falls back to device_id)
 *
 * RC-clean — no manual memoization hooks (D-28 — React Compiler discipline).
 */

import { useState } from 'react';
import { Plug } from 'lucide-react';
import { GlassCard } from '../GlassCard';
import { CardHead } from '../CardHead';
import { StatusDot } from '../StatusDot';
import { Sheet } from '../Sheet';
import { PlugsSheet } from '../sheets/PlugsSheet';
import { useTuyaData } from '@/app/components/devices/tuya/hooks/useTuyaData';
import { useTuyaCommands } from '@/app/components/devices/tuya/hooks/useTuyaCommands';

const TONE = '#ffb84a';

function formatPower(w: number): string {
  return w >= 1000 ? `${(w / 1000).toFixed(1)}kW` : `${w}W`;
}

export default function TuyaCard() {
  const [open, setOpen] = useState(false);
  // Hooks lifted from PlugsSheet body to this card (260506-d45 Fix B): the
  // sheet was previously calling useTuyaData/useTuyaCommands too, doubling
  // the polling cost on every open.
  const tuyaData = useTuyaData();
  const cmds = useTuyaCommands();
  const list = tuyaData.plugs ?? [];
  const visible = list.slice(0, 4);
  const onCount = list.filter((p) => p.switch_on === true).length;
  const totalPower = list.reduce((s, p) => s + (p.power_w ?? 0), 0);

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
      <GlassCard tone={TONE} onOpen={() => setOpen(true)} data-testid="tuya-card">
        <CardHead Icon={Plug} label="Prese smart" tone={TONE} right={right} />
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 5,
            flex: 1,
            justifyContent: 'center',
          }}
        >
          {visible.map((p) => {
            const on = p.switch_on === true;
            return (
              <div
                key={p.device_id}
                style={{ display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <StatusDot on={on} color={TONE} />
                <div
                  style={{
                    flex: 1,
                    fontSize: 11,
                    fontWeight: 500,
                    color: on ? '#fff' : 'var(--text-2)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {p.custom_name ?? p.device_id}
                </div>
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 600,
                    color: on ? TONE : 'var(--text-2)',
                    flexShrink: 0,
                  }}
                >
                  {on ? 'ON' : 'OFF'}
                </div>
              </div>
            );
          })}
        </div>
        <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text-2)' }}>
          {onCount} di {list.length} accese
        </div>
      </GlassCard>
      <Sheet open={open} onClose={() => setOpen(false)} title="Prese smart">
        <PlugsSheet tuyaData={tuyaData} cmds={cmds} />
      </Sheet>
    </>
  );
}
