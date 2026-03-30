'use client';

import { useRouter } from 'next/navigation';
import Skeleton from '../../ui/Skeleton';
import { SmartHomeCard } from '../../ui';
import { Banner } from '../../ui';
import { LastUpdated } from '../../ui/LastUpdated';
import { useTuyaData } from './hooks/useTuyaData';
import { TuyaSummary } from './components/TuyaSummary';

export default function TuyaCard() {
  const router = useRouter();
  const { plugs, loading, error, stale, lastUpdatedAt } = useTuyaData();

  // Loading state — show skeleton
  if (loading) {
    return <Skeleton.TuyaCard />;
  }

  // Error state — no cached data available
  if (error && !plugs) {
    return (
      <SmartHomeCard icon="⚡" title="Tuya" colorTheme="warning">
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

  // Main card with data — clickable, navigates to /tuya page
  return (
    <div
      onClick={() => router.push('/tuya')}
      className="cursor-pointer transition-transform hover:scale-[1.01] active:scale-[0.99]"
      role="link"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          router.push('/tuya');
        }
      }}
      aria-label="Vai alla pagina Tuya"
    >
      <SmartHomeCard icon="⚡" title="Tuya" colorTheme="warning">
        {/* Stale banner — shows when data exists but latest fetch failed */}
        {stale && (
          <SmartHomeCard.Controls>
            <Banner variant="warning" title="Dati non aggiornati" compact={true}>
              <p className="text-xs text-slate-400">Ultimo aggiornamento non riuscito</p>
            </Banner>
          </SmartHomeCard.Controls>
        )}

        {/* Plug summary */}
        {plugs && (
          <SmartHomeCard.Controls>
            <TuyaSummary plugs={plugs} />
          </SmartHomeCard.Controls>
        )}

        {/* LastUpdated timestamp — outside data conditional per Phase 146 pattern (UX-02) */}
        <SmartHomeCard.Controls>
          <LastUpdated tsMs={lastUpdatedAt} className="mt-2" />
        </SmartHomeCard.Controls>
      </SmartHomeCard>
    </div>
  );
}
