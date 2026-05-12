'use client';

/**
 * WeatherCard — Phase 177 (DASH-06).
 *
 * Read-only summary card. Per D-11 / SC-#3 this card omits the open-handler
 * prop on GlassCard, so the card is not wrapped in <Pressable>, has no Sheet,
 * no cursor pointer, no click handler.
 *
 * Bundle source (PRIMARY visual contract):
 *   .planning/inbox/ember-glass-design/project/components/cards.jsx:200-218
 *
 * Tone is the device-class amber `#ffb84a` (D-09 — NOT user-themable).
 * RC-clean — no manual memoization hooks (D-28 / React Compiler discipline).
 */

import { Sun } from 'lucide-react';
import { GlassCard } from '../GlassCard';
import { CardHead } from '../CardHead';
import { useWeatherSummary } from '@/app/components/devices/weather/hooks/useWeatherSummary';

const TONE = '#ffb84a';

export default function WeatherCard() {
  const { city, temp, condition, high, low, loading } = useWeatherSummary();
  const hasData = !loading && temp !== null;

  const right = (
    <div
      style={{
        fontSize: 11,
        color: 'var(--text-2)',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        maxWidth: 110,
      }}
    >
      {city ?? ''}
    </div>
  );

  return (
    <GlassCard tone={TONE} data-testid="weather-card">
      <CardHead Icon={Sun} label="Meteo" tone={TONE} right={right} />
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
        }}
      >
        <div
          data-testid="weather-temp"
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 40,
            fontWeight: 600,
            lineHeight: 1,
            color: hasData ? '#fff' : 'var(--text-2)',
            letterSpacing: -1,
          }}
        >
          {hasData ? temp : '—'}
          <span style={{ fontSize: 18, opacity: 0.4, marginLeft: 2 }}>°</span>
        </div>
        <div style={{ marginTop: 6, fontSize: 12, color: 'var(--text-2)' }}>
          {hasData ? `${condition} · ↑${high}° ↓${low}°` : 'Non raggiungibile'}
        </div>
      </div>
    </GlassCard>
  );
}
