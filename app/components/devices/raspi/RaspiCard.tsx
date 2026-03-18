'use client';

import { useRouter } from 'next/navigation';
import Skeleton from '../../ui/Skeleton';
import { SmartHomeCard } from '../../ui';
import { HealthIndicator, Banner } from '../../ui';
import { useRaspiData } from './hooks/useRaspiData';
import RaspiStats from './components/RaspiStats';

export default function RaspiCard() {
  const router = useRouter();
  const { data, loading, error, stale, health } = useRaspiData();

  // Loading state — show skeleton
  if (loading) {
    return <Skeleton.RaspiCard />;
  }

  // Error state — no cached data available
  if (error && !data) {
    return (
      <SmartHomeCard icon="🖥️" title="Raspberry Pi" colorTheme="sage">
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

  // Main card with data — clickable, navigates to /raspi page
  return (
    <div
      onClick={() => router.push('/raspi')}
      className="cursor-pointer transition-transform hover:scale-[1.01] active:scale-[0.99]"
      role="link"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          router.push('/raspi');
        }
      }}
      aria-label="Vai alla pagina Raspberry Pi"
    >
      <SmartHomeCard
        icon="🖥️"
        title="Raspberry Pi"
        colorTheme="sage"
        headerActions={
          <HealthIndicator
            status={health}
            size="sm"
            showIcon={true}
            label=""
          />
        }
      >
        {/* Stale banner — shows when data exists but latest fetch failed */}
        {stale && (
          <SmartHomeCard.Controls>
            <Banner variant="warning" title="Dati non aggiornati" compact={true}>
              <p className="text-xs text-slate-400">Ultimo aggiornamento non riuscito</p>
            </Banner>
          </SmartHomeCard.Controls>
        )}

        {/* Metrics grid */}
        {data && (
          <SmartHomeCard.Controls>
            <RaspiStats data={data} />
          </SmartHomeCard.Controls>
        )}
      </SmartHomeCard>
    </div>
  );
}
