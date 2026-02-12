'use client';

import { useRouter } from 'next/navigation';
import { useUser } from '@auth0/nextjs-auth0/client';
import { useVersion } from '@/app/context/VersionContext';
import Card from '../../ui/Card';
import Button from '../../ui/Button';
import ControlButton from '../../ui/ControlButton';
import Skeleton from '../../ui/Skeleton';
import Banner from '../../ui/Banner';
import MaintenanceBar from '../../MaintenanceBar';
import CronHealthBanner from '../../CronHealthBanner';
import LoadingOverlay from '../../ui/LoadingOverlay';
import CardAccentBar from '../../ui/CardAccentBar';
import { Divider, Heading, Text, Badge, HealthIndicator } from '../../ui';
import { useStoveData } from './hooks/useStoveData';
import { useStoveCommands } from './hooks/useStoveCommands';
import { getStatusInfo, getStatusDisplay } from './stoveStatusUtils';
import StoveStatus from './components/StoveStatus';
import StovePrimaryActions from './components/StovePrimaryActions';
import StoveBanners from './components/StoveBanners';

/**
 * StoveCard - Complete stove control for homepage
 * Orchestrator pattern: hooks manage state/commands, sub-components render UI
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

  // Fan/power adjustment options (only used in adjustments section)
  const fanOptions = [1, 2, 3, 4, 5, 6].map(level => ({
    value: level,
    label: `Livello ${level}`
  }));

  const powerOptions = [1, 2, 3, 4, 5].map(level => ({
    value: level,
    label: `Livello ${level}`
  }));

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

            {stoveData.isOnline && (
              <>
                {/* Separator */}
                <Divider label="Modalità Controllo" variant="gradient" spacing="large" />

                {/* Mode Indicator - Ember Noir */}
                <div className="flex flex-col gap-4 p-5 sm:p-6 bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 relative overflow-hidden [html:not(.dark)_&]:bg-white/80 [html:not(.dark)_&]:border-slate-200">
                  <div className="flex items-center gap-3 sm:gap-4 relative z-10">
                    <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      stoveData.schedulerEnabled && stoveData.semiManualMode ? 'bg-warning-900/40 border-2 border-warning-500/50 [html:not(.dark)_&]:bg-warning-100/80 [html:not(.dark)_&]:border-warning-300' :
                      stoveData.schedulerEnabled ? 'bg-sage-900/40 border-2 border-sage-500/50 [html:not(.dark)_&]:bg-sage-100/80 [html:not(.dark)_&]:border-sage-300' :
                      'bg-ember-900/40 border-2 border-ember-500/50 [html:not(.dark)_&]:bg-ember-100/80 [html:not(.dark)_&]:border-ember-300'
                    }`}>
                      <span className="text-2xl sm:text-3xl">
                        {stoveData.schedulerEnabled && stoveData.semiManualMode ? '⚙️' : stoveData.schedulerEnabled ? '⏰' : '🔧'}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <Text variant="tertiary" size="sm" className="mb-2">
                        Modalità
                      </Text>
                      <Button.Group className="w-full sm:w-auto">
                        <Button
                          variant={!stoveData.schedulerEnabled ? 'ember' : 'subtle'}
                          size="sm"
                          onClick={commands.handleSetManualMode}
                          aria-pressed={!stoveData.schedulerEnabled}
                          className="flex-1 sm:flex-none"
                        >
                          Manuale
                        </Button>
                        <Button
                          variant={stoveData.schedulerEnabled && !stoveData.semiManualMode ? 'ember' : 'subtle'}
                          size="sm"
                          onClick={commands.handleSetAutomaticMode}
                          aria-pressed={stoveData.schedulerEnabled && !stoveData.semiManualMode}
                          className="flex-1 sm:flex-none"
                        >
                          Automatica
                        </Button>
                        <Button
                          variant={stoveData.schedulerEnabled && stoveData.semiManualMode ? 'ember' : 'subtle'}
                          size="sm"
                          disabled
                          aria-pressed={stoveData.schedulerEnabled && stoveData.semiManualMode}
                          className="flex-1 sm:flex-none cursor-not-allowed"
                        >
                          Semi-man.
                        </Button>
                      </Button.Group>
                      <Text variant="tertiary" size="sm" className="mt-2 break-words">
                        {stoveData.schedulerEnabled && stoveData.semiManualMode && stoveData.returnToAutoAt ? (
                          (() => {
                            const date = new Date(stoveData.returnToAutoAt);
                            const time = date.toLocaleString('it-IT', { hour: '2-digit', minute: '2-digit' });
                            const day = date.toLocaleString('it-IT', { day: '2-digit', month: '2-digit' });
                            return `Ritorno auto: ${time} del ${day}`;
                          })()
                        ) : stoveData.schedulerEnabled && stoveData.nextScheduledAction ? (
                          <>
                            <Text as="span" className={stoveData.nextScheduledAction.action === 'ignite' ? 'text-ember-400 [html:not(.dark)_&]:text-ember-600' : 'text-slate-300 [html:not(.dark)_&]:text-slate-600'}>
                              {stoveData.nextScheduledAction.action === 'ignite' ? '🔥 Accensione' : '❄️ Spegnimento'}
                            </Text>
                            {' alle '}
                            <Text as="span" className="text-slate-300 [html:not(.dark)_&]:text-slate-600">
                              {(() => {
                                const date = new Date(stoveData.nextScheduledAction.timestamp);
                                const time = date.toLocaleString('it-IT', { hour: '2-digit', minute: '2-digit' });
                                const day = date.toLocaleString('it-IT', { day: '2-digit', month: '2-digit' });
                                return `${time} del ${day}`;
                              })()}
                            </Text>
                            {stoveData.nextScheduledAction.action === 'ignite' && (
                              <Text as="span" variant="tertiary" className="block sm:inline"> • P{stoveData.nextScheduledAction.power}, V{stoveData.nextScheduledAction.fan}</Text>
                            )}
                          </>
                        ) : stoveData.schedulerEnabled ? (
                          'Controllo automatico attivo'
                        ) : (
                          'Controllo manuale attivo'
                        )}
                      </Text>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                    {stoveData.schedulerEnabled && stoveData.semiManualMode && (
                      <Button
                        variant="ember"
                        size="sm"
                        onClick={commands.handleClearSemiManual}
                        aria-label="Torna alla modalita automatica"
                      >
                        Torna in Automatico
                      </Button>
                    )}
                    <Button
                      variant="subtle"
                      size="sm"
                      onClick={() => router.push('/stove/scheduler')}
                      aria-label="Vai alle impostazioni di pianificazione"
                    >
                      Configura Pianificazione
                    </Button>
                  </div>
                </div>

                {/* Cron Health Warning */}
                <div className="mt-4 sm:mt-6">
                  <CronHealthBanner variant="inline" />
                </div>
              </>
            )}

            {/* Maintenance Status */}
            {stoveData.maintenanceStatus && (
              <>
                <Divider label="Manutenzione" variant="gradient" spacing="large" />
                <MaintenanceBar maintenanceStatus={stoveData.maintenanceStatus} />
              </>
            )}

            {/* Regolazioni - Visibili SOLO quando stufa è in WORK */}
            {stoveData.isOnline && stoveData.status?.toUpperCase().includes('WORK') && (
              <>
                <Divider label="Regolazioni" variant="gradient" spacing="large" />

                <div className="space-y-4">
                  {/* Info badge quando in modalità automatica */}
                  {stoveData.schedulerEnabled && !stoveData.semiManualMode && (
                    <Banner
                      variant="info"
                      icon="ℹ️"
                      description="La modifica attiverà la modalità Semi-Manuale"
                      compact
                    />
                  )}

                  {/* Ventilazione Control - Ember Noir */}
                  <div data-control="fan" className="relative overflow-hidden rounded-2xl bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 p-5 sm:p-6 [html:not(.dark)_&]:bg-white/80 [html:not(.dark)_&]:border-slate-200">
                    {/* Header */}
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-ocean-900/50 flex items-center justify-center border-2 border-ocean-500/50 [html:not(.dark)_&]:bg-ocean-100/80 [html:not(.dark)_&]:border-ocean-300">
                        <span className="text-xl sm:text-2xl">💨</span>
                      </div>
                      <Heading level={4} size="md" className="font-display">Ventilazione</Heading>
                    </div>

                    {/* 3 Colonne: [−] [Livello] [+] */}
                    <div className="grid grid-cols-[1fr_auto_1fr] gap-3 sm:gap-4 items-center">
                      {/* Bottone Meno */}
                      <ControlButton
                        type="decrement"
                        variant="subtle"
                        onClick={() => {
                          if (stoveData.fanLevel && stoveData.fanLevel > 1) {
                            const newLevel = stoveData.fanLevel - 1;
                            commands.handleFanChange({ target: { value: newLevel.toString() } });
                          }
                        }}
                        disabled={!stoveData.fanLevel || stoveData.fanLevel <= 1}
                      />

                      {/* Display Livello Centrale */}
                      <div className="flex flex-col items-center justify-center px-4 sm:px-6">
                        <Text variant="label" size="sm" className="mb-1 font-display">Livello</Text>
                        <div className="flex items-baseline gap-1">
                          <span className="text-4xl sm:text-5xl font-black font-display text-ocean-400 leading-none [html:not(.dark)_&]:text-ocean-600">
                            {stoveData.fanLevel ?? '-'}
                          </span>
                          <span className="text-xl sm:text-2xl font-bold text-slate-500 [html:not(.dark)_&]:text-slate-400">/6</span>
                        </div>
                      </div>

                      {/* Bottone Più */}
                      <ControlButton
                        type="increment"
                        variant="subtle"
                        onClick={() => {
                          if (stoveData.fanLevel && stoveData.fanLevel < 6) {
                            const newLevel = stoveData.fanLevel + 1;
                            commands.handleFanChange({ target: { value: newLevel.toString() } });
                          }
                        }}
                        disabled={!stoveData.fanLevel || stoveData.fanLevel >= 6}
                      />
                    </div>
                  </div>

                  {/* Potenza Control - Ember Noir */}
                  <div className="relative overflow-hidden rounded-2xl bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 p-5 sm:p-6 [html:not(.dark)_&]:bg-white/80 [html:not(.dark)_&]:border-slate-200">
                    {/* Header */}
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-ember-900/50 flex items-center justify-center border-2 border-ember-500/50 [html:not(.dark)_&]:bg-ember-100/80 [html:not(.dark)_&]:border-ember-300">
                        <span className="text-xl sm:text-2xl">⚡</span>
                      </div>
                      <Heading level={4} size="md" className="font-display">Potenza</Heading>
                    </div>

                    {/* 3 Colonne: [−] [Livello] [+] */}
                    <div className="grid grid-cols-[1fr_auto_1fr] gap-3 sm:gap-4 items-center">
                      {/* Bottone Meno */}
                      <ControlButton
                        type="decrement"
                        variant="ember"
                        onClick={() => {
                          if (stoveData.powerLevel && stoveData.powerLevel > 1) {
                            const newLevel = stoveData.powerLevel - 1;
                            commands.handlePowerChange({ target: { value: newLevel.toString() } });
                          }
                        }}
                        disabled={!stoveData.powerLevel || stoveData.powerLevel <= 1}
                      />

                      {/* Display Livello Centrale */}
                      <div className="flex flex-col items-center justify-center px-4 sm:px-6">
                        <Text variant="label" size="sm" className="mb-1 font-display">Livello</Text>
                        <div className="flex items-baseline gap-1">
                          <span className="text-4xl sm:text-5xl font-black font-display text-ember-400 leading-none [html:not(.dark)_&]:text-ember-600">
                            {stoveData.powerLevel ?? '-'}
                          </span>
                          <span className="text-xl sm:text-2xl font-bold text-slate-500 [html:not(.dark)_&]:text-slate-400">/5</span>
                        </div>
                      </div>

                      {/* Bottone Più */}
                      <ControlButton
                        type="increment"
                        variant="ember"
                        onClick={() => {
                          if (stoveData.powerLevel && stoveData.powerLevel < 5) {
                            const newLevel = stoveData.powerLevel + 1;
                            commands.handlePowerChange({ target: { value: newLevel.toString() } });
                          }
                        }}
                        disabled={!stoveData.powerLevel || stoveData.powerLevel >= 5}
                      />
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
