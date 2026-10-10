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

import { Check, Hourglass, Settings } from 'lucide-react';
import { Banner, Button } from '@/app/components/ui';
import ErrorAlert from '@/app/components/ui/ErrorAlert';
import type { MaintenanceStatus } from '@/lib/maintenance/maintenanceService';
import type { FormattedCommand } from '@/lib/pwa/backgroundSync';

export interface StovePageBannersProps {
  errorCode: number;
  errorDescription: string;
  pelletLow: boolean;
  /** The last status read failed (ROADMAP M78) */
  unreachable?: boolean;
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
    unreachable = false,
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

      {/* Last status read failed: the state below is the last known one (ROADMAP M78) */}
      {unreachable && (
        <div className="mb-6" data-testid="stove-unreachable-banner">
          <Banner
            variant="warning"
            title="Stufa non raggiungibile"
            description="La stufa non risponde: lo stato mostrato è l'ultimo letto e può essere diverso."
          />
        </div>
      )}

      {/* Low pellet reserve (stove sensor read on the Pi, ROADMAP D11) */}
      {pelletLow && (
        <div className="mb-6" data-testid="stove-pellet-low-banner">
          <Banner
            variant="warning"
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
                  icon={cleaningInProgress ? <Hourglass size={16} /> : <Check size={16} />}
                >
                  {cleaningInProgress ? 'Conferma...' : 'Ho Pulito'}
                </Button>
                <Button
                  variant="subtle"
                  onClick={onNavigateToMaintenance}
                  size="sm"
                  icon={<Settings size={16} />}
                >
                  Impostazioni
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
            icon={<Hourglass size={24} />}
            title={`${pendingCommands.length} comando/i in attesa`}
            description="Verranno eseguiti al ripristino connessione."
          />
        </div>
      )}
    </>
  );
}
