'use client';

import { useRouter } from 'next/navigation';
import Skeleton from '../../ui/Skeleton';
import DeviceCard from '../../ui/DeviceCard';
import type { FooterAction, StatusBadge, BannerItem } from '../../ui/DeviceCard';
import RoomSelector from '../../ui/RoomSelector';
import { EmptyState } from '../../ui';
import { useLightsData } from './hooks/useLightsData';
import { useLightsCommands } from './hooks/useLightsCommands';
import { LastUpdated } from '@/app/components/ui/LastUpdated';
import { buildLightsBanners } from './components/LightsBanners';
import LightsHouseControl from './components/LightsHouseControl';
import LightsRoomControl from './components/LightsRoomControl';
import LightsScenes from './components/LightsScenes';

/**
 * LightsCard - Complete Philips Hue lights control for homepage
 * Orchestrator pattern: hooks manage state/commands, sub-components render UI
 *
 * Architecture:
 * - useLightsData: All state management + polling + Firebase
 * - useLightsCommands: All command handlers with retry
 * - 4 sub-components: All presentational (no state/effects)
 * - Single polling loop guarantee (only in useLightsData)
 */
export default function LightsCard() {
  const router = useRouter();

  // Custom hooks: all state management and data fetching
  const lightsData = useLightsData();

  // Command hooks: all command handlers
  const commands = useLightsCommands({
    lightsData: {
      setRefreshing: lightsData.setRefreshing,
      setLoadingMessage: lightsData.setLoadingMessage,
      setError: lightsData.setError,
      fetchData: lightsData.fetchData,
      groups: lightsData.groups,
      checkConnection: lightsData.checkConnection,
      connected: lightsData.connected,
    },
    router,
  });

  // Build banners using utility
  const banners = buildLightsBanners({
    hueRoomCmd: commands.hueRoomCmd,
    hueSceneCmd: commands.hueSceneCmd,
    stale: lightsData.stale,
    error: lightsData.error,
    onDismissError: () => lightsData.setError(null),
  });

  // Derived display properties
  const infoBoxes = lightsData.selectedGroup ? [
    { icon: '💡', label: 'Luci Stanza', value: lightsData.roomLights.length },
    { icon: '🚪', label: 'Stanze', value: lightsData.groups.length },
    { icon: '🎨', label: 'Scene', value: lightsData.scenes.length },
  ] : [];

  const footerActions: FooterAction[] = lightsData.selectedGroup ? [{
    label: 'Tutte le Stanze e Scene →',
    variant: 'outline',
    size: 'sm',
    onClick: () => router.push('/lights'),
  }] : [];

  // Staleness badge for DeviceCard header
  const statusBadge: StatusBadge | undefined = lightsData.stale
    ? { icon: '⏳', label: 'Stale', color: 'warning' }
    : undefined;

  // Skeleton/loading guard
  if (lightsData.loading) {
    return <Skeleton.LightsCard />;
  }

  return (
    <DeviceCard
      icon="💡"
      title="Luci"
      colorTheme="warning"
      connected={lightsData.connected}
      connectInfoRoute="/lights"
      loading={lightsData.loading || lightsData.refreshing}
      loadingMessage={lightsData.loadingMessage}
      skeletonComponent={lightsData.loading ? <Skeleton.LightsCard /> : null}
      statusBadge={statusBadge}
      banners={banners as BannerItem[]}
      infoBoxes={infoBoxes}
      infoBoxesTitle="Informazioni"
      footerActions={footerActions}
      footerContent={<LastUpdated tsMs={lightsData.lastUpdatedAt} className="mt-3 pt-2 border-t border-slate-700/30" />}
    >
      {/* Quick All-House Control */}
      <LightsHouseControl
        hasAnyLights={lightsData.hasAnyLights}
        totalLightsOn={lightsData.totalLightsOn}
        totalLights={lightsData.lights.length}
        allHouseLightsOn={lightsData.allHouseLightsOn}
        allHouseLightsOff={lightsData.allHouseLightsOff}
        refreshing={lightsData.refreshing}
        onAllLightsToggle={commands.handleAllLightsToggle}
      />

      {/* Room Selection */}
      <RoomSelector
        rooms={lightsData.groups.map((group) => ({
          id: group.group_id,
          name: group.name,
        }))}
        selectedRoomId={lightsData.selectedGroupId || undefined}
        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => lightsData.setSelectedGroupId(e.target.value)}
      />

      {/* Selected Room Controls */}
      {lightsData.selectedGroup ? (
        <div className="space-y-4 sm:space-y-6">
          <LightsRoomControl
            selectedGroup={lightsData.selectedGroup}
            selectedGroupId={lightsData.selectedGroupId_action}
            roomLights={lightsData.roomLights}
            isRoomOn={lightsData.isRoomOn}
            lightsOnCount={lightsData.lightsOnCount}
            lightsOffCount={lightsData.lightsOffCount}
            allLightsOn={lightsData.allLightsOn}
            allLightsOff={lightsData.allLightsOff}
            avgBrightness={lightsData.avgBrightness}
            localBrightness={lightsData.localBrightness}
            hasColorLights={lightsData.hasColorLights}
            refreshing={lightsData.refreshing}
            dynamicRoomStyle={lightsData.dynamicRoomStyle}
            contrastMode={lightsData.contrastMode}
            adaptive={lightsData.adaptive}
            onRoomToggle={commands.handleRoomToggle}
            onBrightnessChange={commands.handleBrightnessChange}
            setLocalBrightness={lightsData.setLocalBrightness}
            onNavigateToColors={() => router.push('/lights')}
          />

          <LightsScenes
            roomScenes={lightsData.roomScenes}
            refreshing={lightsData.refreshing}
            onSceneActivate={commands.handleSceneActivate}
          />
        </div>
      ) : (
        <EmptyState
          icon="💡"
          title="Nessuna stanza disponibile"
        />
      )}
    </DeviceCard>
  );
}
