'use client';

import { useUser } from '@auth0/nextjs-auth0/client';
import SettingsLayout from '@/app/components/SettingsLayout';
import { Card, Button, Heading, Text, Skeleton } from '@/app/components/ui';
import NotificationInbox from '@/components/notifications/NotificationInbox';

export default function NotificationHistoryPage() {
  const { user, isLoading: userLoading } = useUser();

  // Loading state
  if (userLoading) {
    return (
      <SettingsLayout title="Cronologia Notifiche" icon="📬">
        <div className="space-y-6">
          <Skeleton className="h-12 w-full rounded-xl" />
          <Skeleton className="h-96 w-full rounded-2xl" />
        </div>
      </SettingsLayout>
    );
  }

  // Not authenticated
  if (!user) {
    return (
      <SettingsLayout title="Cronologia Notifiche" icon="📬">
        <Card variant="glass" className="p-8 text-center">
          <div className="text-6xl mb-4">🔐</div>
          <Heading level={2} size="xl" className="mb-2">
            Autenticazione Richiesta
          </Heading>
          <Text variant="secondary" className="mb-6">
            Devi effettuare il login per visualizzare la cronologia
          </Text>
          <Button
            variant="ember"
            onClick={() => (window.location.href = '/auth/login')}
          >
            Accedi
          </Button>
        </Card>
      </SettingsLayout>
    );
  }

  return (
    <SettingsLayout title="Cronologia Notifiche" icon="📬">
      {/* Description */}
      <div className="space-y-2 mb-6">
        <Text variant="secondary" size="sm">
          Visualizza le notifiche inviate negli ultimi 90 giorni.
          Le notifiche più vecchie vengono automaticamente eliminate per conformità GDPR.
        </Text>
      </div>

      {/* Notification inbox with infinite scroll */}
      <div id="notification-scroll-container" className="max-h-[70vh] overflow-y-auto">
        <NotificationInbox />
      </div>

      {/* Back link */}
      <Card variant="glass" className="p-4 mt-6">
        <div className="flex items-center justify-between">
          <Text variant="secondary" size="sm">
            Torna alle impostazioni notifiche
          </Text>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => (window.location.href = '/settings/notifications')}
          >
            ← Indietro
          </Button>
        </div>
      </Card>
    </SettingsLayout>
  );
}
