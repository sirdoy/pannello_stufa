'use client';

import { useRouter } from 'next/navigation';
import Skeleton from '../../ui/Skeleton';
import { SmartHomeCard, HealthIndicator, Banner } from '../../ui';
import { useDirigeraData } from './hooks/useDirigeraData';
import { LastUpdated } from '@/app/components/ui/LastUpdated';
import DirigeraStats from './components/DirigeraStats';

export default function DirigeraCard() {
  const router = useRouter();
  const { data, loading, error, stale, health, lastUpdatedAt } = useDirigeraData();

  // Loading state — show skeleton
  if (loading) {
    return <Skeleton.DirigeraCard />;
  }

  // Error state — no cached data available
  if (error && !data) {
    return (
      <SmartHomeCard icon="🔌" title="DIRIGERA" colorTheme="ocean">
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

  // Main card with data — clickable, navigates to /dirigera page
  return (
    <div
      onClick={() => router.push('/dirigera')}
      className="cursor-pointer transition-transform hover:scale-[1.01] active:scale-[0.99]"
      role="link"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          router.push('/dirigera');
        }
      }}
      aria-label="Vai alla pagina DIRIGERA"
    >
      <SmartHomeCard
        icon="🔌"
        title="DIRIGERA"
        colorTheme="ocean"
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

        {/* Sensor stats grid */}
        {data && (
          <SmartHomeCard.Controls>
            <DirigeraStats summary={data.summary} />
          </SmartHomeCard.Controls>
        )}

        <LastUpdated tsMs={lastUpdatedAt} className="mt-3 pt-2 border-t border-slate-800/30 dark:border-slate-700/30" />
      </SmartHomeCard>
    </div>
  );
}
