/**
 * StovePageBanners Component
 *
 * Presentational component rendering page-level banners:
 * - Error alert (outside card layout)
 * - Maintenance warning
 * - Firebase connection status
 * - Pending commands queue
 *
 * Props in, JSX out. No state management.
 */

import { Banner, Button } from '@/app/components/ui';
import ErrorAlert from '@/app/components/ui/ErrorAlert';

export interface StovePageBannersProps {
  errorCode: number;
  errorDescription: string;
  needsMaintenance: boolean;
  maintenanceStatus: any;
  cleaningInProgress: boolean;
  isFirebaseConnected: boolean;
  hasPendingCommands: boolean;
  pendingCommands: unknown[];
  onConfirmCleaning: () => void;
  onNavigateToMaintenance: () => void;
}

export default function StovePageBanners(props: StovePageBannersProps) {
  const {
    errorCode,
    errorDescription,
    needsMaintenance,
    maintenanceStatus,
    cleaningInProgress,
    isFirebaseConnected,
    hasPendingCommands,
    pendingCommands,
    onConfirmCleaning,
    onNavigateToMaintenance,
  } = props;

  return (
    <>
      {/* Error Alert - Outside main card */}
      {errorCode !== 0 && (
        <div className="mb-6">
          <ErrorAlert
            errorCode={errorCode}
            errorDescription={errorDescription}
            showDetailsButton={true}
            showSuggestion={true}
          />
        </div>
      )}

      {/* Maintenance Banner */}
      {needsMaintenance && (
        <div className="mb-6">
          <Banner
            variant="warning"
            icon="🧹"
            title="Pulizia Stufa Richiesta"
            description={
              <>
                Raggiunte <strong>{maintenanceStatus?.currentHours.toFixed(1)} ore</strong>.
                Effettua la pulizia prima di riaccendere.
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

      {/* Connection Status Banner */}
      {(!isFirebaseConnected || hasPendingCommands) && (
        <div className="mb-6 space-y-3">
          {!isFirebaseConnected && (
            <Banner
              variant="warning"
              icon="⚠️"
              title="Connessione Interrotta"
              description="Aggiornamenti ogni 10 secondi."
            />
          )}
          {hasPendingCommands && (
            <Banner
              variant="info"
              icon="⏳"
              title={`${pendingCommands.length} comando/i in attesa`}
              description="Verranno eseguiti al ripristino connessione."
            />
          )}
        </div>
      )}
    </>
  );
}
