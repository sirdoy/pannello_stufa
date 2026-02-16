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

import { useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { PageLayout, Skeleton, Button, Heading } from '@/app/components/ui';
import { useNetworkData } from '@/app/components/devices/network/hooks/useNetworkData';
import { useBandwidthHistory } from './hooks/useBandwidthHistory';
import { useDeviceHistory } from './hooks/useDeviceHistory';
import WanStatusCard from './components/WanStatusCard';
import DeviceListTable from './components/DeviceListTable';
import BandwidthChart from './components/BandwidthChart';
import DeviceHistoryTimeline from './components/DeviceHistoryTimeline';
import type { DeviceCategory } from '@/types/firebase/network';

export default function NetworkPage() {
  const router = useRouter();
  const networkData = useNetworkData();
  const bandwidthHistory = useBandwidthHistory();
  const deviceHistory = useDeviceHistory();

  const handleBack = () => router.push('/');

  // Handle category override - calls API and updates UI optimistically
  const handleCategoryChange = useCallback(async (mac: string, category: DeviceCategory) => {
    try {
      const response = await fetch('/api/network/category-override', {
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
  }, [networkData.updateDeviceCategory]);

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
          onCategoryChange={handleCategoryChange}
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
