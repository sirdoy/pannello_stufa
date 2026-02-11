'use client';

/**
 * Thermostat Settings Page
 *
 * Configure thermostat-related automations:
 * - Stove-thermostat sync (existing feature)
 * - PID automation (new feature)
 */

import { useUser } from '@auth0/nextjs-auth0/client';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import SettingsLayout from '@/app/components/SettingsLayout';
import StoveSyncPanel from '@/app/components/netatmo/StoveSyncPanel';
import PidAutomationPanel from '@/app/components/netatmo/PidAutomationPanel';
import { Skeleton, Card, Text } from '@/app/components/ui';

export default function ThermostatSettingsPage() {
  const { user, isLoading } = useUser();
  const router = useRouter();

  // Redirect to login if not authenticated after loading completes
  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/auth/login');
    }
  }, [isLoading, user, router]);

  // Show loading state while auth is being verified
  if (isLoading) {
    return (
      <SettingsLayout title="Impostazioni termostato" icon="🌡️">
        <Skeleton className="h-96 w-full" />
      </SettingsLayout>
    );
  }

  // Show message while redirecting (brief flash before redirect)
  if (!user) {
    return (
      <SettingsLayout title="Impostazioni termostato" icon="🌡️">
        <Card variant="glass" className="p-6">
          <Text variant="secondary">
            Accesso richiesto. Reindirizzamento al login...
          </Text>
        </Card>
      </SettingsLayout>
    );
  }

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
