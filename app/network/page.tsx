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
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { PageLayout, Skeleton, Button, Heading } from '@/app/components/ui';
import { cn } from '@/lib/utils/cn';
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
import WanStatusCard from './components/WanStatusCard';
import DeviceListTable from './components/DeviceListTable';
import CorrelationInsight from './components/CorrelationInsight';
import DeviceHistoryTimeline from './components/DeviceHistoryTimeline';
import SystemInfoCard from './components/SystemInfoCard';
import WifiClientsTable from './components/WifiClientsTable';
import NetworkServicesCard from './components/NetworkServicesCard';
import BudgetStatsCard from './components/BudgetStatsCard';
import WifiNetworksTable from './components/WifiNetworksTable';

const BandwidthChart = dynamic(
  () => import('./components/BandwidthChart'),
  {
    ssr: false,
    loading: () => (
      <div className="bg-slate-800/30 [html:not(.dark)_&]:bg-white rounded-2xl p-6 h-[380px] flex items-center justify-center">
        <Skeleton className="w-full h-full rounded-xl" />
      </div>
    ),
  }
);

const BandwidthCorrelationChart = dynamic(
  () => import('./components/BandwidthCorrelationChart'),
  {
    ssr: false,
    loading: () => (
      <div className="bg-slate-800/30 [html:not(.dark)_&]:bg-white rounded-2xl p-6 h-[360px] flex items-center justify-center">
        <Skeleton className="w-full h-full rounded-xl" />
      </div>
    ),
  }
);
const DeviceCountChart = dynamic(
  () => import('./components/DeviceCountChart'),
  {
    ssr: false,
    loading: () => (
      <div className="bg-slate-800/30 [html:not(.dark)_&]:bg-white rounded-2xl p-6 h-[320px] flex items-center justify-center">
        <Skeleton className="w-full h-full rounded-xl" />
      </div>
    ),
  }
);

import { STOVE_ROUTES } from '@/lib/routes';
import type { DeviceCategory } from '@/types/firebase/network';

type NetworkTab = 'dispositivi' | 'wifi' | 'servizi' | 'reti-wifi';

export default function NetworkPage() {
  const router = useRouter();
  const networkData = useNetworkData();
  const bandwidthHistory = useBandwidthHistory();
  const deviceHistory = useDeviceHistory();
  const correlation = useBandwidthCorrelation();

  const handleBack = () => router.push('/');

  // Tab state
  const [activeTab, setActiveTab] = useState<NetworkTab>('dispositivi');

  // New hooks (Phase 134)
  const systemInfo = useFritzSystemInfo();
  const wifiClients = useFritzWifiClients({ paused: activeTab !== 'wifi' });
  const networkServices = useFritzNetworkServices({ paused: activeTab !== 'servizi' });
  const bandwidthTiers = useFritzBandwidthTiers();
  const wifiNetworks = useFritzWifiNetworks({ paused: activeTab !== 'reti-wifi' });
  const budgetStats = useFritzBudgetStats();
  const deviceCountHistory = useFritzDeviceCountHistory();

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
      const response = await fetch('/api/fritzbox/category-override', {
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
      <div className="space-y-6">
        <Skeleton className="h-12 w-48 rounded-xl" />
        <Skeleton className="h-[100px] rounded-2xl" />
        <Skeleton className="h-[280px] rounded-2xl" />
        <Skeleton className="h-10 rounded-xl w-full" />
        <Skeleton className="h-[400px] rounded-2xl" />
        <Skeleton className="h-[380px] rounded-2xl" />
        <Skeleton className="h-[300px] rounded-2xl" />
      </div>
    );
  }

  return (
    <PageLayout
      header={
        <PageLayout.Header>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={handleBack}>
                ← Indietro
              </Button>
              <div>
                <Heading level={1} size="2xl">Rete</Heading>
              </div>
            </div>
          </div>
        </PageLayout.Header>
      }
    >
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
        <div className="flex gap-1 border-b border-white/[0.06] [html:not(.dark)_&]:border-black/[0.06] pb-0">
          {([
            { key: 'dispositivi' as const, label: 'Dispositivi' },
            { key: 'wifi' as const, label: 'WiFi Clients' },
            { key: 'servizi' as const, label: 'Servizi di Rete' },
            { key: 'reti-wifi' as const, label: 'Reti WiFi' },
          ]).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px',
                activeTab === tab.key
                  ? 'border-ember-400 text-ember-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200 [html:not(.dark)_&]:hover:text-slate-600'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

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
