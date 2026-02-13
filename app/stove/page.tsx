/**
 * Stove Command Center
 *
 * Full-page orchestrator that reuses StoveCard hooks:
 * - useStoveData for state management and polling
 * - useStoveCommands for command handlers
 * - Page-specific components for immersive full-page layout
 *
 * Reduced from 1066 LOC to ~200 LOC orchestrator pattern.
 */

'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@auth0/nextjs-auth0/client';
import { useVersion } from '@/app/context/VersionContext';
import { Heading, Skeleton, LoadingOverlay, Toast } from '@/app/components/ui';
import { useStoveData } from '@/app/components/devices/stove/hooks/useStoveData';
import { useStoveCommands } from '@/app/components/devices/stove/hooks/useStoveCommands';
import { useBackgroundSync } from '@/lib/hooks/useBackgroundSync';
import { getStovePageStatusConfig, getStovePageTheme } from './stovePageTheme';
import StovePageBanners from './components/StovePageBanners';
import StovePageHero from './components/StovePageHero';
import StovePageAdjustments from './components/StovePageAdjustments';
import StovePageNavigation from './components/StovePageNavigation';

export default function StovePage() {
  const router = useRouter();
  const { checkVersion } = useVersion();
  const { user } = useUser();

  // Reuse StoveCard hooks - SAME state management, polling, Firebase
  const stoveData = useStoveData({ checkVersion, userId: user?.sub });
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

  // Page-specific: offline command queueing and toast notifications
  const { queueStoveCommand } = useBackgroundSync();
  const [toast, setToast] = useState<{
    message: string;
    icon?: string;
    variant?: 'success' | 'error' | 'warning' | 'info';
  } | null>(null);

  // Derive display properties
  const statusConfig = getStovePageStatusConfig(stoveData.status);
  const theme = getStovePageTheme(statusConfig.theme);
  const isWorking = stoveData.status?.toUpperCase().includes('WORK');

  // Page-level ignite/shutdown with offline queueing
  const handlePageIgnite = useCallback(async () => {
    if (!stoveData.isOnline) {
      await queueStoveCommand('ignite', { source: 'manual' });
      setToast({ message: 'Comando in coda - eseguito al ripristino connessione', variant: 'warning' });
      return;
    }
    await commands.handleIgnite();
  }, [stoveData.isOnline, queueStoveCommand, commands]);

  const handlePageShutdown = useCallback(async () => {
    if (!stoveData.isOnline) {
      await queueStoveCommand('shutdown', { source: 'manual' });
      setToast({ message: 'Comando in coda - eseguito al ripristino connessione', variant: 'warning' });
      return;
    }
    await commands.handleShutdown();
  }, [stoveData.isOnline, queueStoveCommand, commands]);

  // Fan/Power wrappers to adapt number → event interface
  const handlePageFanChange = useCallback(
    async (newLevel: number) => {
      await commands.handleFanChange({ target: { value: String(newLevel) } });
    },
    [commands]
  );

  const handlePagePowerChange = useCallback(
    async (newLevel: number) => {
      await commands.handlePowerChange({ target: { value: String(newLevel) } });
    },
    [commands]
  );

  // Loading skeleton guard
  if (stoveData.initialLoading) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-[500px] rounded-3xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <Heading level={1} className="sr-only">
        Controllo Stufa
      </Heading>

      {/* Full-screen ambient gradient + glow */}
      <div className={`fixed inset-0 -z-10 bg-gradient-to-br ${theme.bg} transition-all duration-1000`} />
      <div className={`fixed inset-0 -z-10 pointer-events-none transition-all duration-1000 ${theme.glow}`} />

      <LoadingOverlay show={stoveData.loading} message={stoveData.loadingMessage} icon="🔥" />

      <div className="relative space-y-6 sm:space-y-8">
        <StovePageBanners
          errorCode={stoveData.errorCode}
          errorDescription={stoveData.errorDescription}
          needsMaintenance={stoveData.needsMaintenance}
          maintenanceStatus={stoveData.maintenanceStatus}
          cleaningInProgress={stoveData.cleaningInProgress}
          isFirebaseConnected={stoveData.isFirebaseConnected}
          hasPendingCommands={stoveData.hasPendingCommands}
          pendingCommands={stoveData.pendingCommands}
          onConfirmCleaning={commands.handleConfirmCleaning}
          onNavigateToMaintenance={() => router.push('/stove/maintenance')}
        />

        <StovePageHero
          status={stoveData.status}
          statusConfig={statusConfig}
          theme={theme}
          fanLevel={stoveData.fanLevel}
          powerLevel={stoveData.powerLevel}
          errorCode={stoveData.errorCode}
          sandboxMode={stoveData.sandboxMode}
          isAccesa={stoveData.isAccesa}
          isSpenta={stoveData.isSpenta}
          isOnline={stoveData.isOnline}
          needsMaintenance={stoveData.needsMaintenance}
          loading={stoveData.loading}
          schedulerEnabled={stoveData.schedulerEnabled}
          semiManualMode={stoveData.semiManualMode}
          returnToAutoAt={stoveData.returnToAutoAt}
          nextScheduledAction={stoveData.nextScheduledAction}
          onIgnite={handlePageIgnite}
          onShutdown={handlePageShutdown}
          onClearSemiManual={commands.handleClearSemiManual}
          onNavigateToScheduler={() => router.push('/stove/scheduler')}
        />

        {isWorking && (
          <StovePageAdjustments
            fanLevel={stoveData.fanLevel}
            powerLevel={stoveData.powerLevel}
            schedulerEnabled={stoveData.schedulerEnabled}
            semiManualMode={stoveData.semiManualMode}
            loading={stoveData.loading}
            onFanChange={handlePageFanChange}
            onPowerChange={handlePagePowerChange}
          />
        )}

        <StovePageNavigation
          schedulerEnabled={stoveData.schedulerEnabled}
          maintenanceStatus={stoveData.maintenanceStatus}
          errorCode={stoveData.errorCode}
        />
      </div>

      {toast && (
        <Toast variant={toast.variant} open={!!toast} onOpenChange={(open) => !open && setToast(null)} duration={3000}>
          {toast.icon && <span>{toast.icon}</span>}
          {toast.message}
        </Toast>
      )}
    </div>
  );
}
