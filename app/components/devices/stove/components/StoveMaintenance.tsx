'use client';

import MaintenanceBar from '../../../MaintenanceBar';
import { Divider } from '../../../ui';

/**
 * StoveMaintenance - Maintenance progress bar wrapper
 * Presentational component (no state/effects)
 */

export interface StoveMaintenanceProps {
  maintenanceStatus: any;
}

export default function StoveMaintenance({
  maintenanceStatus,
}: StoveMaintenanceProps) {
  return (
    <>
      <Divider label="Manutenzione" variant="gradient" spacing="large" />
      <MaintenanceBar maintenanceStatus={maintenanceStatus} />
    </>
  );
}
