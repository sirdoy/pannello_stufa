'use client';

/**
 * DirigeraCard — IKEA DIRIGERA sensors summary.
 *
 * Surfaces the contact + occupancy sensors from the DIRIGERA proxy. The earlier
 * placeholder was hardcoded to an empty plug list (A-02 LANDMINE #2) — replaced
 * here with real data from useDirigeraFullData('all') since plug data still
 * isn't exposed by the proxy but sensors ARE.
 *
 * RC-clean — no manual memoization hooks.
 */

import { useState } from 'react';
import { Boxes } from 'lucide-react';
import { GlassCard } from '../GlassCard';
import { CardHead } from '../CardHead';
import { StatusDot } from '../StatusDot';
import { Sheet } from '../Sheet';
import { DirigeraSheet } from '../sheets/DirigeraSheet';
import { useDirigeraFullData } from '@/app/components/devices/dirigera/hooks/useDirigeraFullData';
import type { DirigeraSensor } from '@/types/dirigeraProxy';

const TONE = '#ffb84a';

/**
 * Active = open contact sensor OR detected motion. The proxy types `is_open`
 * for contact + we read `is_detected` defensively (motion sensors include it
 * in payload but it's not on the DirigeraSensor interface).
 */
function isSensorActive(s: DirigeraSensor): boolean {
  if (s.type === 'openCloseSensor') return s.is_open === true;
  const detected = (s as { is_detected?: boolean }).is_detected;
  return detected === true;
}

export default function DirigeraCard() {
  const [open, setOpen] = useState(false);
  const { data } = useDirigeraFullData('all');
  const sensors = data?.sensors ?? [];
  const visibleSensors = sensors.slice(0, 4);
  const activeCount = sensors.filter(isSensorActive).length;
  const totalCount = sensors.length;

  const right = (
    <div
      style={{
        fontSize: 11,
        fontWeight: 600,
        color: activeCount > 0 ? TONE : 'var(--text-2)',
        letterSpacing: 0.3,
        fontVariantNumeric: 'tabular-nums',
      }}
    >
      {activeCount > 0 ? `${activeCount} aperti` : 'OK'}
    </div>
  );

  return (
    <>
      <GlassCard tone={TONE} onOpen={() => setOpen(true)} data-testid="dirigera-card">
        <CardHead Icon={Boxes} label="IKEA" tone={TONE} right={right} />
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 5,
            flex: 1,
            justifyContent: 'center',
          }}
        >
          {visibleSensors.length === 0 && (
            <div style={{ fontSize: 11, color: 'var(--text-2)' }}>
              {data === null ? 'Caricamento…' : 'Nessun sensore'}
            </div>
          )}
          {visibleSensors.map((s) => (
            <div
              key={s.id}
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <StatusDot on={isSensorActive(s)} color={TONE} />
              <div
                style={{
                  flex: 1,
                  fontSize: 11,
                  fontWeight: 500,
                  color: '#fff',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {s.custom_name}
              </div>
              <div
                style={{
                  fontSize: 10,
                  color: 'var(--text-2)',
                  flexShrink: 0,
                }}
              >
                {s.type === 'openCloseSensor'
                  ? s.is_open
                    ? 'Aperto'
                    : 'Chiuso'
                  : isSensorActive(s)
                    ? 'Movimento'
                    : 'Fermo'}
              </div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text-2)' }}>
          {totalCount === 0
            ? '—'
            : `${activeCount} attivi di ${totalCount} sensori`}
        </div>
      </GlassCard>
      <Sheet open={open} onClose={() => setOpen(false)} title="IKEA">
        <DirigeraSheet sensors={sensors} loading={data === null} />
      </Sheet>
    </>
  );
}
