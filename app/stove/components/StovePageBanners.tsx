/**
 * StovePageBanners Component
 *
 * Presentational component rendering page-level banners:
 * - Error alert (outside card layout)
 * - Low pellet reserve warning
 * - Maintenance warning
 * - Staleness status
 * - Pending commands queue
 *
 * Props in, JSX out. No state management.
 */

import { Banner, Button } from '@/app/components/ui';
import ErrorAlert from '@/app/components/ui/ErrorAlert';
import type { MaintenanceStatus } from '@/lib/maintenance/maintenanceService';
import type { FormattedCommand } from '@/lib/pwa/backgroundSync';

export interface StovePageBannersProps {
  errorCode: number;
  errorDescription: string;
  pelletLow: boolean;
  needsMaintenance: boolean;
  maintenanceStatus: MaintenanceStatus | null;
  cleaningInProgress: boolean;
  hasPendingCommands: boolean;
  pendingCommands: FormattedCommand[];
  onConfirmCleaning: () => void;
  onNavigateToMaintenance: () => void;
}

export default function StovePageBanners(props: StovePageBannersProps) {
  const {
    errorCode,
    errorDescription,
    pelletLow,
    needsMaintenance,
    maintenanceStatus,
    cleaningInProgress,
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

      {/* Low pellet reserve (stove sensor read on the Pi, ROADMAP D11) */}
      {pelletLow && (
        <div className="mb-6" data-testid="stove-pellet-low-banner">
          <Banner
            variant="warning"
            icon="🪵"
            title="Pellet in riserva"
            description="Il pellet sta per finire: ricarica il serbatoio della stufa."
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

      {/* Pending commands banner */}
      {hasPendingCommands && (
        <div className="mb-6">
          <Banner
            variant="info"
            icon="⏳"
            title={`${pendingCommands.length} comando/i in attesa`}
            description="Verranno eseguiti al ripristino connessione."
          />
        </div>
      )}
    </>
  );
}
