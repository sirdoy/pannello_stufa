/**
 * Network Page - /network
 *
 * Full-page orchestrator for Fritz!Box network monitoring:
 * - WAN status card (connection, IP, uptime, DNS, gateway)
 * - Device list table (name, IP, MAC, status, bandwidth)
 * - Bandwidth chart (download/upload trends over time)
 *
 * Uses orchestrator pattern:
 * - Reuses useNetworkData hook from Phase 62 (single polling loop)
 * - Thin coordination layer (~80 lines)
 * - Presentational components handle display
 */

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PageLayout, Skeleton, Button, Heading } from '@/app/components/ui';
import { useNetworkData } from '@/app/components/devices/network/hooks/useNetworkData';
import { useBandwidthHistory } from './hooks/useBandwidthHistory';
import WanStatusCard from './components/WanStatusCard';
import DeviceListTable from './components/DeviceListTable';
import BandwidthChart from './components/BandwidthChart';

export default function NetworkPage() {
  const router = useRouter();
  const networkData = useNetworkData();
  const bandwidthHistory = useBandwidthHistory();

  const handleBack = () => router.push('/');

  // Feed bandwidth data from polling into history buffer
  useEffect(() => {
    if (networkData.bandwidth) {
      bandwidthHistory.addDataPoint(networkData.bandwidth);
    }
  }, [networkData.bandwidth]); // eslint-disable-line react-hooks/exhaustive-deps

  // Loading skeleton guard - only on initial load (no cached data)
  if (networkData.loading && !networkData.wan && networkData.devices.length === 0) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-48 rounded-xl" />
        <Skeleton className="h-[280px] rounded-2xl" />
        <Skeleton className="h-[400px] rounded-2xl" />
        <Skeleton className="h-[380px] rounded-2xl" />
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
        {/* WAN Status Card - always visible, top position */}
        <WanStatusCard
          wan={networkData.wan}
          isStale={networkData.stale}
          lastUpdated={networkData.lastUpdated}
        />

        {/* Device List Table - below WAN card */}
        <DeviceListTable
          devices={networkData.devices}
          isStale={networkData.stale}
        />

        {/* Bandwidth Chart - below device list */}
        <BandwidthChart
          data={bandwidthHistory.chartData}
          timeRange={bandwidthHistory.timeRange}
          onTimeRangeChange={bandwidthHistory.setTimeRange}
          isEmpty={bandwidthHistory.isEmpty}
          isCollecting={bandwidthHistory.isCollecting}
          pointCount={bandwidthHistory.pointCount}
        />
      </div>
    </PageLayout>
  );
}
