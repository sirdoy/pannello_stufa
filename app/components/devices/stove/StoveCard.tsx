'use client';

import { useRouter } from 'next/navigation';
import { useUser } from '@auth0/nextjs-auth0/client';
import { useVersion } from '@/app/context/VersionContext';
import Card from '../../ui/Card';
import Skeleton from '../../ui/Skeleton';
import LoadingOverlay from '../../ui/LoadingOverlay';
import CardAccentBar from '../../ui/CardAccentBar';
import { Heading, Badge, HealthIndicator } from '../../ui';
import { useStoveData } from './hooks/useStoveData';
import { useStoveCommands } from './hooks/useStoveCommands';
import { getStatusInfo, getStatusDisplay } from './stoveStatusUtils';
import StoveStatus from './components/StoveStatus';
import StovePrimaryActions from './components/StovePrimaryActions';
import StoveBanners from './components/StoveBanners';
import StoveModeControl from './components/StoveModeControl';
import StoveAdjustments from './components/StoveAdjustments';
import StoveMaintenance from './components/StoveMaintenance';

/**
 * StoveCard - Complete stove control for homepage
 * Orchestrator pattern: hooks manage state/commands, sub-components render UI
 *
 * Architecture:
 * - useStoveData: All state management + polling + Firebase
 * - useStoveCommands: All command handlers with retry
 * - 6 sub-components: All presentational (no state/effects)
 * - Single polling loop guarantee (only in useStoveData)
 */
export default function StoveCard() {
  const router = useRouter();
  const { checkVersion } = useVersion();
  const { user } = useUser();

  // Custom hooks: all state management and data fetching
  const stoveData = useStoveData({ checkVersion, userId: user?.sub });

  // Command hooks: all command handlers
  const commands = useStoveCommands({
    stoveData: {
      setLoading: stoveData.setLoading,
      setLoadingMessage: stoveData.setLoadingMessage,
      fetchStatusAndUpdate: stoveData.fetchStatusAndUpdate,
      setSchedulerEnabled: stoveData.setSchedulerEnabled,
      setSemiManualMode: stoveData.setSemiManualMode,
      setReturnToAutoAt: stoveData.setReturnToAutoAt,
      setNextScheduledAction: stoveData.setNextScheduledAction,
      setCleaningInProgress: stoveData.setCleaningInProgress,
      fetchMaintenanceStatus: stoveData.fetchMaintenanceStatus,
      semiManualMode: stoveData.semiManualMode,
    },
    router,
    user,
  });

  // Derived display properties
  const statusInfo = getStatusInfo(stoveData.status);
  const statusDisplay = getStatusDisplay(stoveData.status);

  if (stoveData.initialLoading) {
    return <Skeleton.StovePanel />;
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Loading Overlay - Full page blocking */}
      <LoadingOverlay
        show={stoveData.loading}
        message={stoveData.loadingMessage}
        icon="🔥"
      />

      {/* StoveBanners renders: ErrorAlert (outside card), maintenance/Firebase/pending banners (passed to inside card section) */}
      <StoveBanners
        errorCode={stoveData.errorCode}
        errorDescription={stoveData.errorDescription}
        needsMaintenance={stoveData.needsMaintenance}
        maintenanceStatus={stoveData.maintenanceStatus}
        cleaningInProgress={stoveData.cleaningInProgress}
        isFirebaseConnected={stoveData.isFirebaseConnected}
        hasPendingCommands={stoveData.hasPendingCommands}
        pendingCommands={stoveData.pendingCommands}
        igniteCmd={commands.igniteCmd}
        shutdownCmd={commands.shutdownCmd}
        setFanCmd={commands.setFanCmd}
        setPowerCmd={commands.setPowerCmd}
        onConfirmCleaning={commands.handleConfirmCleaning}
        onNavigateToMaintenance={() => router.push('/stove/maintenance')}
      />

      {/* Main Status Card - Ember Noir */}
      <Card variant="elevated" padding={false} className="overflow-visible transition-all duration-500">
        <div className="relative">
          {/* Modern Accent Bar with glow effect - pulses when stove is active */}
          <CardAccentBar
            colorTheme="ember"
            animated={true}
            pulse={stoveData.isAccesa}
            size="md"
          />

          <div className="p-6 sm:p-8">
            {/* Header - Ember Noir style */}
            <div className="flex items-center justify-between gap-3 mb-6">
              <div className="flex items-center gap-3">
                <span className="text-2xl sm:text-3xl">🔥</span>
                <Heading level={2} size="xl" className="font-display">Stufa</Heading>
              </div>
              <div className="flex items-center gap-2">
                <Badge
                  variant={statusDisplay.variant as any}
                  pulse={statusDisplay.pulse}
                  size="sm"
                >
                  {statusDisplay.label}
                </Badge>
                <HealthIndicator
                  status={statusDisplay.health as any}
                  size="sm"
                  showIcon={true}
                  label=""
                />
              </div>
            </div>

            {/* StoveStatus: Main status display box */}
            <StoveStatus
              status={stoveData.status}
              fanLevel={stoveData.fanLevel}
              powerLevel={stoveData.powerLevel}
              errorCode={stoveData.errorCode}
              sandboxMode={stoveData.sandboxMode}
              staleness={stoveData.staleness}
              isVisible={stoveData.isVisible}
              statusInfo={statusInfo}
              statusDisplay={statusDisplay}
            />

            {/* StovePrimaryActions: Ignite/shutdown buttons */}
            <StovePrimaryActions
              isAccesa={stoveData.isAccesa}
              isSpenta={stoveData.isSpenta}
              isOnline={stoveData.isOnline}
              needsMaintenance={stoveData.needsMaintenance}
              loading={stoveData.loading}
              igniteCmd={commands.igniteCmd}
              shutdownCmd={commands.shutdownCmd}
              onIgnite={commands.handleIgnite}
              onShutdown={commands.handleShutdown}
            />

            {/* StoveModeControl: Scheduler mode selector and next action display */}
            {stoveData.isOnline && (
              <StoveModeControl
                schedulerEnabled={stoveData.schedulerEnabled}
                semiManualMode={stoveData.semiManualMode}
                returnToAutoAt={stoveData.returnToAutoAt}
                nextScheduledAction={stoveData.nextScheduledAction}
                onSetManualMode={commands.handleSetManualMode}
                onSetAutomaticMode={commands.handleSetAutomaticMode}
                onClearSemiManual={commands.handleClearSemiManual}
                onNavigateToScheduler={() => router.push('/stove/scheduler')}
              />
            )}

            {/* StoveMaintenance: Maintenance progress bar */}
            {stoveData.maintenanceStatus && (
              <StoveMaintenance maintenanceStatus={stoveData.maintenanceStatus} />
            )}

            {/* StoveAdjustments: Fan and power level controls - Visible ONLY when WORK */}
            {stoveData.isOnline && stoveData.status?.toUpperCase().includes('WORK') && (
              <StoveAdjustments
                fanLevel={stoveData.fanLevel}
                powerLevel={stoveData.powerLevel}
                schedulerEnabled={stoveData.schedulerEnabled}
                semiManualMode={stoveData.semiManualMode}
                onFanChange={commands.handleFanChange}
                onPowerChange={commands.handlePowerChange}
              />
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
