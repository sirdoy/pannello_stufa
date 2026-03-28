'use client';

import { useRouter } from 'next/navigation';
import { Play, Pause, Square } from 'lucide-react';
import Skeleton from '../../ui/Skeleton';
import { SmartHomeCard, Banner } from '../../ui';
import { useSonosData } from './hooks/useSonosData';
import { LastUpdated } from '@/app/components/ui/LastUpdated';

export default function SonosCard() {
  const router = useRouter();
  const { data, loading, error, stale, lastUpdatedAt } = useSonosData();

  // Loading state — show skeleton
  if (loading && !data) {
    return <Skeleton.SonosCard />;
  }

  // Error state — no cached data available
  if (error && !data) {
    return (
      <SmartHomeCard icon="🎵" title="Sonos" colorTheme="sage">
        <SmartHomeCard.Controls>
          <Banner variant="warning" title="Non raggiungibile" compact={false}>
            <p className="text-sm text-slate-300 [html:not(.dark)_&]:text-slate-600">
              {error}
            </p>
          </Banner>
        </SmartHomeCard.Controls>
      </SmartHomeCard>
    );
  }

  function getPlaybackIcon() {
    const state = data?.nowPlaying?.transport_state;
    if (state === 'PLAYING') return <Play className="inline-block w-4 h-4 text-success-400" />;
    if (state === 'PAUSED_PLAYBACK') return <Pause className="inline-block w-4 h-4 text-amber-400" />;
    return <Square className="inline-block w-4 h-4 text-slate-400" />;
  }

  // Main card with data — clickable, navigates to /sonos page
  return (
    <div
      onClick={() => router.push('/sonos')}
      className="cursor-pointer transition-transform hover:scale-[1.01] active:scale-[0.99]"
      role="link"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          router.push('/sonos');
        }
      }}
      aria-label="Vai alla pagina Sonos"
    >
      <SmartHomeCard icon="🎵" title="Sonos" colorTheme="sage">
        {/* Stale banner — shows when data exists but latest fetch failed */}
        {stale && (
          <SmartHomeCard.Controls>
            <Banner variant="warning" title="Dati non aggiornati" compact={true} />
          </SmartHomeCard.Controls>
        )}

        {/* Content */}
        {data && (
          <SmartHomeCard.Controls>
            {/* Now-playing info */}
            <div className="mb-3">
              <p className="text-base font-medium flex items-center gap-2">
                {getPlaybackIcon()}
                {data.nowPlaying?.title ?? 'Nessuna riproduzione'}
              </p>
              {data.nowPlaying?.artist && (
                <p className="text-sm text-slate-400">{data.nowPlaying.artist}</p>
              )}
            </div>

            {/* Stats row */}
            <div className="flex gap-3">
              <div className="flex-1 bg-slate-800/50 rounded-lg p-3 text-center [html:not(.dark)_&]:bg-slate-100/80">
                <p className="text-lg font-semibold text-white [html:not(.dark)_&]:text-slate-900">
                  {data.zoneCount}
                </p>
                <p className="text-xs text-slate-400 [html:not(.dark)_&]:text-slate-500">
                  {data.zoneCount === 1 ? 'zona' : 'zone'}
                </p>
              </div>
              <div className="flex-1 bg-slate-800/50 rounded-lg p-3 text-center [html:not(.dark)_&]:bg-slate-100/80">
                <p className="text-lg font-semibold text-white [html:not(.dark)_&]:text-slate-900">
                  {data.speakerCount}
                </p>
                <p className="text-xs text-slate-400 [html:not(.dark)_&]:text-slate-500">
                  {data.speakerCount === 1 ? 'speaker' : 'speaker'}
                </p>
              </div>
            </div>
          </SmartHomeCard.Controls>
        )}

        <LastUpdated tsMs={lastUpdatedAt} className="mt-3 pt-2 border-t border-slate-800/30 dark:border-slate-700/30" />
      </SmartHomeCard>
    </div>
  );
}
