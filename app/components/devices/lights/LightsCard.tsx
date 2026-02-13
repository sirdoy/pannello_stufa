'use client';

import { useRouter } from 'next/navigation';
import Skeleton from '../../ui/Skeleton';
import DeviceCard from '../../ui/DeviceCard';
import RoomSelector from '../../ui/RoomSelector';
import { EmptyState } from '../../ui';
import { useLightsData } from './hooks/useLightsData';
import { useLightsCommands } from './hooks/useLightsCommands';
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
      rooms: lightsData.rooms,
      setPairing: lightsData.setPairing,
      setPairingStep: lightsData.setPairingStep,
      setDiscoveredBridges: lightsData.setDiscoveredBridges,
      setSelectedBridge: lightsData.setSelectedBridge,
      setPairingCountdown: lightsData.setPairingCountdown,
      setPairingError: lightsData.setPairingError,
      pairingTimerRef: lightsData.pairingTimerRef,
      selectedBridge: lightsData.selectedBridge,
      checkConnection: lightsData.checkConnection,
      connected: lightsData.connected,
    },
    router,
  });

  // Build banners using utility
  const banners = buildLightsBanners({
    hueRoomCmd: commands.hueRoomCmd,
    hueSceneCmd: commands.hueSceneCmd,
    pairing: lightsData.pairing,
    pairingStep: lightsData.pairingStep,
    pairingCountdown: lightsData.pairingCountdown,
    pairingError: lightsData.pairingError,
    discoveredBridges: lightsData.discoveredBridges,
    selectedBridge: lightsData.selectedBridge,
    error: lightsData.error,
    onRemoteAuth: commands.handleRemoteAuth,
    onCancelPairing: commands.handleCancelPairing,
    onConfirmButtonPressed: commands.handleConfirmButtonPressed,
    onSelectBridge: commands.handleSelectBridge,
    onRetryPairing: commands.handleRetryPairing,
    onDismissError: () => lightsData.setError(null),
    onDismissPairingError: () => lightsData.setPairingError(null),
  });

  // Derived display properties
  const infoBoxes = lightsData.selectedRoom ? [
    { icon: '💡', label: 'Luci Stanza', value: lightsData.roomLights.length },
    { icon: '🚪', label: 'Stanze', value: lightsData.rooms.length },
    { icon: '🎨', label: 'Scene', value: lightsData.scenes.length },
  ] : [];

  const footerActions = lightsData.selectedRoom ? [{
    label: 'Tutte le Stanze e Scene →',
    variant: 'outline' as any,
    size: 'sm',
    onClick: () => router.push('/lights')
  }] : [];

  // Connection mode badge for DeviceCard header
  const getStatusBadge = () => {
    if (!lightsData.connected || !lightsData.connectionMode) return null;

    const badges: Record<string, { icon: string; label: string; color: string }> = {
      'local': { icon: '📡', label: 'Local', color: 'sage' },
      'remote': { icon: '☁️', label: 'Cloud', color: 'ocean' },
      'hybrid': { icon: '🔄', label: 'Hybrid', color: 'warning' },
    };

    return badges[lightsData.connectionMode] || null;
  };

  const statusBadge = getStatusBadge();

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
      onConnect={commands.handleStartPairing}
      connectButtonLabel="Connetti Bridge Hue"
      connectInfoRoute="/lights"
      loading={lightsData.loading || lightsData.refreshing || lightsData.pairing}
      loadingMessage={lightsData.pairingStep === 'discovering' ? 'Ricerca bridge...' : lightsData.pairingStep === 'pairing' ? `Pairing in corso... ${lightsData.pairingCountdown}s` : lightsData.loadingMessage}
      skeletonComponent={lightsData.loading ? <Skeleton.LightsCard /> : null}
      statusBadge={statusBadge as any}
      banners={banners}
      infoBoxes={infoBoxes}
      infoBoxesTitle="Informazioni"
      footerActions={footerActions as any}
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
        rooms={lightsData.rooms.map((room: any) => ({
          id: room.id,
          name: room.metadata?.name || 'Stanza'
        }))}
        selectedRoomId={lightsData.selectedRoomId || undefined}
        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => lightsData.setSelectedRoomId(e.target.value)}
      />

      {/* Selected Room Controls */}
      {lightsData.selectedRoom ? (
        <div className="space-y-4 sm:space-y-6">
          <LightsRoomControl
            selectedRoom={lightsData.selectedRoom}
            selectedRoomGroupedLightId={lightsData.selectedRoomGroupedLightId}
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
