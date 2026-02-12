'use client';

import { useRouter } from 'next/navigation';
import ErrorAlert from '../../ui/ErrorAlert';
import Banner from '../../ui/Banner';
import Button from '../../ui/Button';
import { Text } from '../../ui';

interface StoveBannersProps {
  errorCode: number;
  errorDescription: string;
  needsMaintenance: boolean;
  maintenanceStatus: any;
  cleaningInProgress: boolean;
  isFirebaseConnected: boolean;
  hasPendingCommands: boolean;
  pendingCommands: any[];
  igniteCmd: { lastError: Error | null; retry: () => void };
  shutdownCmd: { lastError: Error | null; retry: () => void };
  setFanCmd: { lastError: Error | null; retry: () => void };
  setPowerCmd: { lastError: Error | null; retry: () => void };
  onConfirmCleaning: () => void;
  onNavigateToMaintenance: () => void;
}

export default function StoveBanners({
  errorCode,
  errorDescription,
  needsMaintenance,
  maintenanceStatus,
  cleaningInProgress,
  isFirebaseConnected,
  hasPendingCommands,
  pendingCommands,
  igniteCmd,
  shutdownCmd,
  setFanCmd,
  setPowerCmd,
  onConfirmCleaning,
  onNavigateToMaintenance,
}: StoveBannersProps) {
  const router = useRouter();

  return (
    <>
      {/* Error Alert - Outside card as it's a critical system message */}
      {errorCode !== 0 && (
        <ErrorAlert
          errorCode={errorCode}
          errorDescription={errorDescription}
          showDetailsButton={true}
          showSuggestion={true}
        />
      )}

      {/* Maintenance Cleaning Banner - Inside card */}
      {needsMaintenance && (
        <div className="mb-6">
          <Banner
            variant="warning"
            icon="🧹"
            title="Pulizia Stufa Richiesta"
            description={
              <>
                La stufa ha raggiunto <strong>{maintenanceStatus.currentHours.toFixed(1)} ore</strong> di utilizzo.
                È necessario effettuare la pulizia prima di poterla riaccendere.
              </>
            }
            actions={
              <>
                <Button
                  variant="success"
                  onClick={onConfirmCleaning}
                  disabled={cleaningInProgress}
                  size="sm"
                >
                  {cleaningInProgress ? '⏳ Conferma...' : '✓ Ho Pulito'}
                </Button>
                <Button
                  variant="outline"
                  onClick={onNavigateToMaintenance}
                  size="sm"
                >
                  ⚙️ Impostazioni
                </Button>
              </>
            }
          />
        </div>
      )}

      {/* Firebase Connection Status */}
      {!isFirebaseConnected && (
        <div className="mb-6">
          <Banner
            variant="warning"
            icon="⚠️"
            title="Connessione Firebase Interrotta"
            description="Aggiornamenti in tempo reale non disponibili. Dati aggiornati ogni 10 secondi."
          />
        </div>
      )}

      {/* Pending commands banner */}
      {hasPendingCommands && (
        <div className="mb-6">
          <Banner
            variant="info"
            icon="⏳"
            title="Comandi in attesa"
            description={`${pendingCommands.length} ${pendingCommands.length === 1 ? 'comando' : 'comandi'} in coda. Verranno eseguiti al ripristino della connessione.`}
          />
        </div>
      )}

      {/* Retry Infrastructure Error Banner */}
      {(igniteCmd.lastError || shutdownCmd.lastError || setFanCmd.lastError || setPowerCmd.lastError) && (
        <div className="mt-4 sm:mt-6">
          <Banner variant="error">
            <div className="flex items-center justify-between w-full">
              <Text variant="body">
                {(igniteCmd.lastError || shutdownCmd.lastError || setFanCmd.lastError || setPowerCmd.lastError)?.message}
              </Text>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  // Retry the failed command
                  const failedCmd = [igniteCmd, shutdownCmd, setFanCmd, setPowerCmd]
                    .find(cmd => cmd.lastError);
                  failedCmd?.retry();
                }}
              >
                Riprova
              </Button>
            </div>
          </Banner>
        </div>
      )}
    </>
  );
}
