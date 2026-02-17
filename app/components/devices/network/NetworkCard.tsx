/**
 * NetworkCard - Fritz!Box network monitoring dashboard card
 *
 * Orchestrator pattern: hooks manage state/commands, sub-components render UI.
 *
 * Architecture:
 * - useNetworkData: All state management + polling + Firebase
 * - useNetworkCommands: Navigation handlers
 * - 3 sub-components: All presentational (no state/effects)
 * - Single polling loop guarantee (only in useNetworkData)
 */

'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Skeleton from '../../ui/Skeleton';
import { SmartHomeCard } from '../../ui';
import { HealthIndicator, Banner } from '../../ui';
import { useNetworkData } from './hooks/useNetworkData';
import { useNetworkCommands } from './hooks/useNetworkCommands';
import NetworkStatusBar from './components/NetworkStatusBar';
import NetworkBandwidth from './components/NetworkBandwidth';
import NetworkInfo from './components/NetworkInfo';

export default function NetworkCard() {
  const router = useRouter();
  const networkData = useNetworkData();
  const commands = useNetworkCommands({ router });

  // Loading state
  if (networkData.loading) {
    return <Skeleton.NetworkCard />;
  }

  // Setup required: TR-064 not enabled or Fritz!Box not configured
  if (networkData.error?.type === 'setup') {
    return (
      <SmartHomeCard icon="📡" title="Rete" colorTheme="sage">
        <SmartHomeCard.Controls>
          <Banner
            variant="info"
            title="Configura Fritz!Box"
            compact={false}
          >
            <p className="text-sm text-slate-300 mb-3">
              Per monitorare la rete configura le credenziali Fritz!Box nelle impostazioni.
            </p>
            <Link
              href="/settings?tab=rete"
              className="text-sm text-sage-400 hover:text-sage-300 underline"
            >
              Vai alle impostazioni Rete →
            </Link>
          </Banner>
        </SmartHomeCard.Controls>
      </SmartHomeCard>
    );
  }

  // Main card - clickable, navigates to /network page
  return (
    <div
      onClick={commands.navigateToNetwork}
      className="cursor-pointer transition-transform hover:scale-[1.01] active:scale-[0.99]"
      role="link"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          commands.navigateToNetwork();
        }
      }}
      aria-label="Vai alla pagina Rete"
    >
      <SmartHomeCard
        icon="📡"
        title="Rete"
        colorTheme="sage"
        headerActions={
          <HealthIndicator
            status={networkData.healthMapped}
            size="sm"
            showIcon={true}
            label=""
          />
        }
      >
        {/* WAN Status Bar — full width at top (LOCKED DECISION) */}
        <NetworkStatusBar
          connected={networkData.connected}
          stale={networkData.stale}
          lastUpdated={networkData.lastUpdated}
        />

        {/* Bandwidth Hero — two big numbers + sparklines (LOCKED DECISION) */}
        <SmartHomeCard.Controls>
          <NetworkBandwidth
            bandwidth={networkData.bandwidth}
            downloadHistory={networkData.downloadHistory}
            uploadHistory={networkData.uploadHistory}
          />
        </SmartHomeCard.Controls>

        {/* Secondary Info — device count, health, uptime */}
        <div className="mt-4">
          <NetworkInfo
            activeDeviceCount={networkData.activeDeviceCount}
            wan={networkData.wan}
            health={networkData.health}
          />
        </div>
      </SmartHomeCard>
    </div>
  );
}
