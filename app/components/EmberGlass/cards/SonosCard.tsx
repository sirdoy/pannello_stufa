'use client';

/**
 * SonosCard — Phase 177 (DASH-05).
 *
 * Bundle source (PRIMARY visual contract):
 *   .planning/inbox/ember-glass-design/project/components/cards.jsx:220-270
 *
 * Composition:
 *  - <GlassCard tone="#b080ff" onOpen={...}> (DASH-01)
 *  - <CardHead Icon={Music} label="Sonos" right={<count text>}>
 *  - Body: ≤4 group rows, PlayingBars on rows where transport_state === 'PLAYING',
 *    dim 6×6 dot otherwise. Track title on second line for playing rows.
 *  - Adjacent <Sheet> with placeholder body (Phase 178 swap).
 *
 * Real proxy shapes (per types/sonosProxy.ts):
 *  - SonosZoneResponse → `coordinator_name` (NOT nested coordinator.name)
 *  - SonosPlaybackResponse → `transport_state` (NOT state) + `title`
 *    (NOT current_track.title). The PATTERNS.md / PLAN.md examples used
 *    placeholder names; the implementation tracks the actual proxy types.
 *
 * RC-clean — no manual memoization hooks (D-28 — React Compiler discipline).
 */

import { useState } from 'react';
import { Music } from 'lucide-react';
import { GlassCard } from '../GlassCard';
import { CardHead } from '../CardHead';
import { PlayingBars } from '../PlayingBars';
import { Sheet } from '../Sheet';
import { SheetPlaceholderBody } from './SheetPlaceholderBody';
import { useSonosFullData } from '@/app/components/devices/sonos/hooks/useSonosFullData';

const TONE = '#b080ff';

export default function SonosCard() {
  const [open, setOpen] = useState(false);
  const { data } = useSonosFullData();

  const allZones = data?.zones ?? [];
  const groups = allZones.map((z) => {
    const pb = data?.playback?.[z.group_id];
    const playing = pb?.transport_state === 'PLAYING';
    return {
      group_id: z.group_id,
      name: z.coordinator_name ?? z.group_id,
      playing,
      track: pb?.title ?? '',
    };
  });
  const visible = groups.slice(0, 4);
  const playingCount = groups.filter((g) => g.playing).length;

  const right = (
    <div
      style={{
        fontSize: 11,
        fontWeight: 600,
        color: 'var(--text-2)',
        letterSpacing: 0.3,
      }}
    >
      {playingCount >= 1 ? `${playingCount} in riprod.` : 'In pausa'}
    </div>
  );

  return (
    <>
      <GlassCard tone={TONE} onOpen={() => setOpen(true)} data-testid="sonos-card">
        <CardHead Icon={Music} label="Sonos" tone={TONE} right={right} />
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
            flex: 1,
            justifyContent: 'center',
          }}
        >
          {visible.map((g) => (
            <div
              key={g.group_id}
              style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}
            >
              {g.playing ? (
                <PlayingBars />
              ) : (
                <div
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: 999,
                    background: 'rgba(255,255,255,0.18)',
                    marginTop: 3,
                  }}
                />
              )}
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 500,
                    color: g.playing ? '#fff' : 'var(--text-2)',
                  }}
                >
                  {g.name}
                </div>
                {g.playing && g.track && (
                  <div
                    style={{
                      fontSize: 10,
                      color: 'var(--text-2)',
                      marginTop: 1,
                    }}
                  >
                    {g.track}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </GlassCard>
      <Sheet open={open} onClose={() => setOpen(false)} title="Sonos">
        <SheetPlaceholderBody phase="178" device="sonos" />
      </Sheet>
    </>
  );
}
