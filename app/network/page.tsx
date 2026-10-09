/**
 * Network Page - /network
 *
 * Full-page orchestrator for Fritz!Box network monitoring:
 * - System Info card (model, firmware, uptime)
 * - WAN status card (connection, IP, uptime, DNS, gateway)
 * - Tab navigation: Dispositivi / WiFi Clients / Servizi di Rete
 * - Bandwidth chart with tier toggle (Tempo reale / Orario / Giornaliero)
 * - Bandwidth-stove correlation chart
 * - Device history timeline
 *
 * Uses orchestrator pattern:
 * - Reuses useNetworkData hook from Phase 62 (single polling loop)
 * - Thin coordination layer
 * - Presentational components handle display
 */

'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { Button, Card, PageLayout, Skeleton } from '@/app/components/ui';
import { useNetworkData } from '@/app/components/devices/network/hooks/useNetworkData';
import { useBandwidthHistory } from './hooks/useBandwidthHistory';
import { useDeviceHistory } from './hooks/useDeviceHistory';
import { useBandwidthCorrelation } from './hooks/useBandwidthCorrelation';
import { useFritzSystemInfo } from './hooks/useFritzSystemInfo';
import { useFritzWifiClients } from './hooks/useFritzWifiClients';
import { useFritzNetworkServices } from './hooks/useFritzNetworkServices';
import { useFritzBandwidthTiers } from './hooks/useFritzBandwidthTiers';
import { useFritzWifiNetworks } from './hooks/useFritzWifiNetworks';
import { useFritzBudgetStats } from './hooks/useFritzBudgetStats';
import { useFritzDeviceCountHistory } from './hooks/useFritzDeviceCountHistory';
import { useFritzBandwidthHistoryRaw } from './hooks/useFritzBandwidthHistoryRaw';
import { useFritzDevicePresenceHistory } from './hooks/useFritzDevicePresenceHistory';
import { useFritzDeviceEventsRaw } from './hooks/useFritzDeviceEventsRaw';
import WanStatusCard from './components/WanStatusCard';
import DeviceListTable from './components/DeviceListTable';
import CorrelationInsight from './components/CorrelationInsight';
import DeviceHistoryTimeline from './components/DeviceHistoryTimeline';
import SystemInfoCard from './components/SystemInfoCard';
import WifiClientsTable from './components/WifiClientsTable';
import NetworkServicesCard from './components/NetworkServicesCard';
import BudgetStatsCard from './components/BudgetStatsCard';
import WifiNetworksTable from './components/WifiNetworksTable';
import RawHistoryTab from './components/RawHistoryTab';

const BandwidthChart = dynamic(
  () => import('./components/BandwidthChart'),
  {
    ssr: false,
    loading: () => (
      <Card variant="elevated" className="flex h-95 items-center justify-center p-4 sm:p-6">
        <Skeleton className="size-full rounded-xl" />
      </Card>
    ),
  }
);

const BandwidthCorrelationChart = dynamic(
  () => import('./components/BandwidthCorrelationChart'),
  {
    ssr: false,
    loading: () => (
      <Card variant="elevated" className="flex h-90 items-center justify-center p-4 sm:p-6">
        <Skeleton className="size-full rounded-xl" />
      </Card>
    ),
  }
);
const DeviceCountChart = dynamic(
  () => import('./components/DeviceCountChart'),
  {
    ssr: false,
    loading: () => (
      <Card variant="elevated" className="flex h-80 items-center justify-center p-4 sm:p-6">
        <Skeleton className="size-full rounded-xl" />
      </Card>
    ),
  }
);

import { STOVE_ROUTES } from '@/lib/routes';
import type { DeviceCategory } from '@/types/firebase/network';

type NetworkTab = 'dispositivi' | 'wifi' | 'servizi' | 'reti-wifi' | 'storico';

export default function NetworkPage() {
  const networkData = useNetworkData({ enrichVendors: true });
  const bandwidthHistory = useBandwidthHistory();
  const deviceHistory = useDeviceHistory();
  const correlation = useBandwidthCorrelation();

  // Tab state
  const [activeTab, setActiveTab] = useState<NetworkTab>('dispositivi');

  // Storico grezzo (raw history) tab scope — shared across three sub-sections (D-09)
  const [storicoHours, setStoricoHours] = useState<'1h' | '24h' | '7d'>('24h');

  // New hooks (Phase 134)
  const systemInfo = useFritzSystemInfo();
  const wifiClients = useFritzWifiClients({ paused: activeTab !== 'wifi' });
  const networkServices = useFritzNetworkServices({ paused: activeTab !== 'servizi' });
  const bandwidthTiers = useFritzBandwidthTiers();
  const wifiNetworks = useFritzWifiNetworks({ paused: activeTab !== 'reti-wifi' });
  const budgetStats = useFritzBudgetStats();
  const deviceCountHistory = useFritzDeviceCountHistory();

  // Phase 171: Raw history hooks for Storico grezzo tab (FRITZ-04/05/06).
  // Lazy-loaded per D-10: `paused: activeTab !== 'storico'` keeps them idle until activated.
  const bandwidthRaw = useFritzBandwidthHistoryRaw({ paused: activeTab !== 'storico', hours: storicoHours });
  const devicePresence = useFritzDevicePresenceHistory({ paused: activeTab !== 'storico' });
  const deviceEventsRaw = useFritzDeviceEventsRaw({ paused: activeTab !== 'storico', hours: storicoHours });

  // Stove power level polling (lightweight, independent)
  const stovePowerRef = useRef<number | null>(null);

  useEffect(() => {
    const fetchPower = async () => {
      try {
        const res = await fetch(STOVE_ROUTES.getPower);
        const json = await res.json();
        const level = json?.Result ?? null;
        stovePowerRef.current = level;
      } catch {
        // Stove may be unreachable — fire-and-forget
        stovePowerRef.current = null;
      }
    };

    // Initial fetch
    fetchPower();

    // Poll every 30s (aligned with network data polling)
    const interval = setInterval(fetchPower, 30000);
    return () => clearInterval(interval);
  }, []);

  // Handle category override - calls API and updates UI optimistically
  const handleCategoryChange = async (mac: string, category: DeviceCategory) => {
    try {
      const response = await fetch('/api/v1/fritzbox/category-override', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mac, category }),
      });

      if (response.ok) {
        // Optimistic update: immediately reflect in UI
        networkData.updateDeviceCategory(mac, category);
      }
    } catch {
      // Override failed — dropdown already closed, no action needed
      // Category will be re-fetched on next poll (fire-and-forget, self-heals)
    }
  };

  // Feed bandwidth data from polling into history buffer
  useEffect(() => {
    if (networkData.bandwidth) {
      bandwidthHistory.addDataPoint(networkData.bandwidth);
    }
  }, [networkData.bandwidth]); // eslint-disable-line react-hooks/exhaustive-deps

  // Wire bandwidth + stove power → correlation hook
  useEffect(() => {
    if (!networkData.bandwidth) return;

    correlation.addDataPoint(
      networkData.bandwidth.download,
      stovePowerRef.current,
      networkData.bandwidth.timestamp
    );
  }, [networkData.bandwidth]); // eslint-disable-line react-hooks/exhaustive-deps

  // Loading skeleton guard - only on initial load (no cached data)
  if (networkData.loading && !networkData.wan && networkData.devices.length === 0) {
    return (
      <PageLayout header={<PageLayout.Header title="Rete" backHref="/altro" />}>
        <div className="space-y-6">
          <Skeleton className="h-25 rounded-2xl" />
          <Skeleton className="h-70 rounded-2xl" />
          <Skeleton className="h-10 w-full rounded-xl" />
          <Skeleton className="h-100 rounded-2xl" />
          <Skeleton className="h-95 rounded-2xl" />
          <Skeleton className="h-75 rounded-2xl" />
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout header={<PageLayout.Header title="Rete" backHref="/altro" />}>
      <div className="space-y-6">
        {/* System Info Card - above WAN status card */}
        <SystemInfoCard data={systemInfo.data} loading={systemInfo.loading} stale={systemInfo.stale} />

        {/* WAN Status Card - always visible, top position */}
        <WanStatusCard
          wan={networkData.wan}
          isStale={networkData.stale}
          lastUpdated={networkData.lastUpdated}
        />

        {/* Budget Stats Card - system-level info above tabs (D-09) */}
        <BudgetStatsCard data={budgetStats.data} loading={budgetStats.loading} error={budgetStats.error} />

        {/* Tab Navigation */}
        <Button.Group>
          {([
            { key: 'dispositivi' as const, label: 'Dispositivi' },
            { key: 'wifi' as const, label: 'WiFi Clients' },
            { key: 'servizi' as const, label: 'Servizi di Rete' },
            { key: 'reti-wifi' as const, label: 'Reti WiFi' },
            { key: 'storico' as const, label: 'Storico grezzo' },
          ]).map((tab) => (
            <Button
              key={tab.key}
              variant={activeTab === tab.key ? 'ember' : 'subtle'}
              size="sm"
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </Button>
          ))}
        </Button.Group>

        {/* Tab Content */}
        {activeTab === 'dispositivi' && (
          <DeviceListTable
            devices={networkData.devices}
            isStale={networkData.stale}
            onCategoryChange={handleCategoryChange}
          />
        )}
        {activeTab === 'wifi' && (
          <WifiClientsTable
            clients={wifiClients.clients}
            loading={wifiClients.loading}
            band={wifiClients.band}
            onBandChange={wifiClients.setBand}
            total={wifiClients.total}
          />
        )}
        {activeTab === 'servizi' && (
          <NetworkServicesCard
            dhcp={networkServices.dhcp}
            portForwarding={networkServices.portForwarding}
            upnp={networkServices.upnp}
            mesh={networkServices.mesh}
            loading={networkServices.loading}
            stale={networkServices.stale}
          />
        )}
        {activeTab === 'reti-wifi' && (
          <WifiNetworksTable
            networks={wifiNetworks.networks}
            loading={wifiNetworks.loading}
            stale={wifiNetworks.stale}
          />
        )}
        {activeTab === 'storico' && (
          <RawHistoryTab
            bandwidth={bandwidthRaw}
            presence={devicePresence}
            events={deviceEventsRaw}
            hours={storicoHours}
            onHoursChange={setStoricoHours}
          />
        )}

        {/* Device Count Chart - daily connected device history (D-05) */}
        <DeviceCountChart data={deviceCountHistory.chartData} loading={deviceCountHistory.loading} />

        {/* Bandwidth Chart - below tab content */}
        <BandwidthChart
          data={bandwidthHistory.chartData}
          timeRange={bandwidthHistory.timeRange}
          onTimeRangeChange={bandwidthHistory.setTimeRange}
          isEmpty={bandwidthHistory.isEmpty}
          isCollecting={bandwidthHistory.isCollecting}
          isLoading={bandwidthHistory.isLoading}
          pointCount={bandwidthHistory.pointCount}
          activeTier={bandwidthTiers.tier}
          onTierChange={bandwidthTiers.setTier}
          tierData={bandwidthTiers.tierData}
          tierLoading={bandwidthTiers.loading}
          autoGranularity={bandwidthTiers.autoGranularity}
        />

        {/* Bandwidth-Stove Correlation (Phase 67) */}
        <BandwidthCorrelationChart
          data={correlation.chartData}
          status={correlation.status}
          pointCount={correlation.pointCount}
          minPoints={correlation.minPoints}
        />
        <CorrelationInsight
          insight={correlation.insight}
          status={correlation.status}
        />

        {/* Device History Timeline - below bandwidth chart */}
        <DeviceHistoryTimeline
          events={deviceHistory.events}
          isLoading={deviceHistory.isLoading}
          isEmpty={deviceHistory.isEmpty}
          timeRange={deviceHistory.timeRange}
          onTimeRangeChange={deviceHistory.setTimeRange}
          deviceFilter={deviceHistory.deviceFilter}
          onDeviceFilterChange={deviceHistory.setDeviceFilter}
          devices={networkData.devices}
        />
      </div>
    </PageLayout>
  );
}
