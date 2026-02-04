'use client';

/**
 * Thermostat Settings Page
 *
 * Configure thermostat-related automations:
 * - Stove-thermostat sync (existing feature)
 * - PID automation (new feature)
 */

import SettingsLayout from '@/app/components/SettingsLayout';
import StoveSyncPanel from '@/app/components/netatmo/StoveSyncPanel';
import PidAutomationPanel from '@/app/components/netatmo/PidAutomationPanel';

export default function ThermostatSettingsPage() {
  return (
    <SettingsLayout title="Impostazioni termostato" icon="🌡️">
      <div className="space-y-6">
        {/* Stove Sync Panel */}
        <StoveSyncPanel />

        {/* PID Automation Panel */}
        <PidAutomationPanel />
      </div>
    </SettingsLayout>
  );
}
