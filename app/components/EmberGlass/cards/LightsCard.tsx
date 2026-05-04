'use client';

/**
 * LightsCard — Phase 177 (DASH-04).
 *
 * Bundle source (PRIMARY visual contract):
 *   .planning/inbox/ember-glass-design/project/components/cards.jsx:166-218
 *
 * Composition:
 *  - <GlassCard tone="#f5c84a" onOpen={...}> (DASH-01)
 *  - <CardHead Icon={Lightbulb} label="Luci" right={<InlineToggle />}>
 *  - Body: ≤4 on-light name rows (with StatusDot) + overflow `+ altre N`
 *    + footer `{N} di {total} accese`. Empty state: 28px display "Spente"
 *    + subtitle `{total} disponibili`.
 *  - Adjacent <Sheet> wraps <LightsSheet /> (Phase 178-09 swap).
 *
 * Stop-propagation rule (D-17): the master InlineToggle MUST call
 * e.stopPropagation() so its click does NOT also fire the parent Pressable
 * onOpen → would otherwise pop the sheet on every toggle.
 *
 * Hook coupling matches legacy `app/components/devices/lights/LightsCard.tsx`:
 *  - useLightsData() returns the full UseLightsDataReturn (lights are HueLight[]
 *    keyed by `light_id`).
 *  - useLightsCommands accepts `Pick<UseLightsDataReturn, ...>` + router; passing
 *    the picked subset (NOT the whole object) preserves type-safety.
 *
 * RC-clean — no manual memoization hooks (D-28 — React Compiler discipline).
 */

import { useState } from 'react';
import { Lightbulb } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { GlassCard } from '../GlassCard';
import { CardHead } from '../CardHead';
import { StatusDot } from '../StatusDot';
import { InlineToggle } from '../InlineToggle';
import { Sheet } from '../Sheet';
import { LightsSheet } from '../sheets/LightsSheet';
import { useLightsData } from '@/app/components/devices/lights/hooks/useLightsData';
import { useLightsCommands } from '@/app/components/devices/lights/hooks/useLightsCommands';

const TONE = '#f5c84a';

export default function LightsCard() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const lightsData = useLightsData();
  const cmds = useLightsCommands({
    lightsData: {
      setRefreshing: lightsData.setRefreshing,
      setLoadingMessage: lightsData.setLoadingMessage,
      setError: lightsData.setError,
      fetchData: lightsData.fetchData,
      groups: lightsData.groups,
      checkConnection: lightsData.checkConnection,
      connected: lightsData.connected,
    },
    router,
  });

  const allLights = lightsData.lights ?? [];
  const onLights = allLights.filter((l) => l.on);
  const anyOn = onLights.length > 0;
  const totalLights = allLights.length;

  const right = (
    <InlineToggle
      on={anyOn}
      color={TONE}
      aria-label={anyOn ? 'Spegni tutte le luci' : 'Accendi tutte le luci'}
      onChange={(e) => {
        e.stopPropagation(); // D-17 — prevent parent Pressable click → sheet open
        void cmds.handleAllLightsToggle(!anyOn);
      }}
    />
  );

  return (
    <>
      <GlassCard tone={TONE} onOpen={() => setOpen(true)} data-testid="lights-card">
        <CardHead Icon={Lightbulb} label="Luci" tone={TONE} right={right} />
        {anyOn ? (
          <>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 5,
                flex: 1,
                justifyContent: 'center',
              }}
            >
              {onLights.slice(0, 4).map((l) => (
                <div
                  key={l.light_id}
                  style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  <StatusDot on color={TONE} />
                  <div
                    style={{
                      flex: 1,
                      fontSize: 11,
                      fontWeight: 500,
                      color: '#fff',
                    }}
                  >
                    {l.name}
                  </div>
                </div>
              ))}
              {onLights.length > 4 && (
                <div style={{ fontSize: 10, color: 'var(--text-2)' }}>
                  + altre {onLights.length - 4}
                </div>
              )}
            </div>
            <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text-2)' }}>
              {onLights.length} di {totalLights} accese
            </div>
          </>
        ) : (
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-end',
            }}
          >
            <div
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 28,
                fontWeight: 600,
                color: 'var(--text-2)',
              }}
            >
              Spente
            </div>
            <div style={{ marginTop: 6, fontSize: 12, color: 'var(--text-2)' }}>
              {totalLights} disponibili
            </div>
          </div>
        )}
      </GlassCard>
      <Sheet open={open} onClose={() => setOpen(false)} title="Luci">
        <LightsSheet />
      </Sheet>
    </>
  );
}
